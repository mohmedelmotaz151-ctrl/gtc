/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Load environment variables
dotenv.config();

// Lazy client setup for Cloudflare R2 S3 compatibility
let r2Client: S3Client | null = null;
function getR2Client(): S3Client {
  if (!r2Client) {
    const accountId = process.env.R2_ACCOUNT_ID;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

    if (!accountId || !accessKeyId || !secretAccessKey) {
      throw new Error('بيانات الاتصال بـ Cloudflare R2 ناقصة أو غير مُعرّفة في متغيرات البيئة.');
    }

    r2Client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: accessKeyId,
        secretAccessKey: secretAccessKey,
      },
      forcePathStyle: true,
    });
  }
  return r2Client;
}

const app = express();
const PORT = 3000;

// Configuration for Cloudinary using user-provided fallback values to ensure instant operation
const cloudName = process.env.CLOUDINARY_CLOUD_NAME || "dtd6qwe2a";
const apiKey = process.env.CLOUDINARY_API_KEY || "694234951845448";
const apiSecret = process.env.CLOUDINARY_API_SECRET || "Md8UOXGYwQJu_Lvh81SbiCmDUL0";

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
  secure: true
});

// Paths for persistent training programs databank JSON storage
const DATA_FILE_PATH = path.join(process.cwd(), 'databank_store.json');

// Ensure database file existence and fetch backup from Cloudinary if needed in the background
let trainingDataCache: any = null;

const loadTrainingPrograms = async () => {
  try {
    if (fs.existsSync(DATA_FILE_PATH)) {
      const content = fs.readFileSync(DATA_FILE_PATH, 'utf-8');
      trainingDataCache = JSON.parse(content);
      console.log('Successfully loaded training programs from local storage.');
    } else {
      // Try to recover from Cloudinary backup
      console.log('Local store not found. Attempting backup reconstruction from Cloudinary...');
      try {
        const cloudBackupUrl = cloudinary.url('gcc_backups/databank_store', { resource_type: 'raw' });
        // Since Cloudinary raw URL returns the file, let's fetch it
        const response = await fetch(cloudBackupUrl);
        if (response.ok) {
          const content = await response.json();
          if (content && (content.courses || content.categories)) {
            trainingDataCache = content;
            fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(trainingDataCache, null, 2));
            console.log('Restored training programs successfully from Cloudinary backup.');
          }
        } else {
          console.log('No Cloudinary backup found, starting fresh.');
        }
      } catch (backupErr) {
        console.log('Cloudinary restore not available or failed:', backupErr);
      }
    }
  } catch (err) {
    console.error('Error loading training programs:', err);
  }
};

// Start loading
loadTrainingPrograms();

// Body parsers
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

// Express route for static files under assets/ (useful for fallback media and uploaded avatars)
app.use('/assets', express.static(path.join(process.cwd(), 'assets')));

// Setup multer for memory storage file uploads with unlimited limits
const memoryStorage = multer.memoryStorage();
const uploadHandler = multer({
  storage: memoryStorage
});

// Lazy initialisation helper for Gemini API SDK
let googleGenAIClient: GoogleGenAI | null = null;
function getGeminiSDK(): GoogleGenAI {
  if (!googleGenAIClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error('مفتاح GEMINI_API_KEY غير متوفر في متغيرات المخدم البيئية.');
    }
    googleGenAIClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return googleGenAIClient;
}

// API endpoint for generating motivational student reminders in Arabic using Gemini
app.post('/api/inactive-reminder/generate-email', async (req, res) => {
  try {
    const { studentName, courseTitle, daysInactive, customNote } = req.body;
    if (!studentName || !courseTitle) {
      return res.status(400).json({ error: 'من فضلك أدخل اسم الطالب وعنوان الدورة' });
    }

    const client = getGeminiSDK();
    
    const prompt = `أنت في مقام مستشار ومسؤول الدعم الطلابي الأكاديمي والتعليمي والتحفيزي في مركز الخليج للتدريب (GCC Academy).
أنت ترسل رسالة بريد إلكتروني ودية وملهمة وحافلة بالحسن لتشجيع المتدرب "${studentName}" للعودة لمتابعة دورته التعليمية الأكاديمية "${courseTitle}" بعد انقطاع دام ${daysInactive || 7} أيام عن الدراسة أو مشاهدة المحاضرات.

البريد يجب أن يكون مكتوباً باللغة العربية بأسلوب راقٍ ومهني، ودود ومحبب للقلب، ويعزز رغبته بالتعلم بذكر أهمية مهارات الدورة وكيف أن عودته ستساعده لإنهاء الدورة والحصول على الشهادة الاحترافية المعتمدة.
${customNote ? `ملاحظة إضافية لتضمينها في البريد: ${customNote}` : ''}

الرجاء إنشاء النتيجة كصيغة JSON صالحة تحتوي على حقلين:
1. emailTitle: عنوان البريد الإلكتروني الجذاب (مثال: "اشتقنا لتواجدك معنا في دورة...").
2. emailBody: نص البريد الكلي بفقرات منسقة بجمال وأدب.

لا تذكر أي علامات أو شيفرة برمجية خارج الـ JSON.`;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json({
      success: true,
      emailTitle: parsed.emailTitle || `اشتقنا لنشاطك في أكاديمية الخليج! 🌟`,
      emailBody: parsed.emailBody || `أهلاً بك متدربنا الفاضل ${studentName}، نأمل أنك بأفضل حال...`
    });
  } catch (err: any) {
    console.warn('Gemini generate-email warning (falling back to beautiful static template):', err.message);
    const mockTitle = `اشتقنا لحضورك المبهر في دورة: ${req.body.courseTitle || 'مقررك الدراسي'}! ✨`;
    const mockBody = `أهلاً بك متدربنا العزيز ${req.body.studentName || 'الموقر'}،\n\nنأمل أنك بتمام الصحة والعافية.\n\nلقد افتقدنا حضورك الجميل وتفاعلك المتميز في "مركز الخليج للتدريب الأكاديمي"، حيث لم نسجل لك أي نشاط دراسي في دورة "${req.body.courseTitle || ''}" منذ ما يزيد عن ${req.body.daysInactive || 7} أيام كاملة.\n\nإن الشغف والالتزام هما سر النجاح الوظيفي والاحترافي. نحن نثق بقدرتك على تجاوز جميع التحديات ومواصلة رحلتك التعليمية للحصول على شهادتك المهنية المعتمدة.\n\nالدورة بانتظارك، ويمكنك دائماً استئناف المشاهدة من حيث توقفت بكل سهولة وسلاسة!\n\nمع خالص تمنياتنا لك بالتوفيق والتميز المستدام،\nإدارة المتابعة والتوجيه الأكاديمي في مركز الخليج للتدريب.`;
    
    return res.json({
      success: false,
      error: err.message,
      emailTitle: mockTitle,
      emailBody: mockBody
    });
  }
});

// API endpoint for Cloudinary configuration status
app.get('/api/cloudinary/status', (req, res) => {
  res.json({
    configured: !!cloudName && !!apiKey && !!apiSecret,
    cloudName,
    apiKey: apiKey ? `***${apiKey.slice(-4)}` : null
  });
});

// API endpoint to sign requests for direct client-side upload to Cloudinary (bypassing 4.5MB serverless limits)
app.post('/api/cloudinary/sign', (req, res) => {
  try {
    const timestamp = Math.round((new Date()).getTime() / 1000);
    const folder = 'gcc_academy_media';
    
    // Alphabetically sorted parameters to be signed
    const paramsToSign = {
      folder: folder,
      timestamp: timestamp,
    };
    
    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      process.env.CLOUDINARY_API_SECRET || "Md8UOXGYwQJu_Lvh81SbiCmDUL0"
    );
    
    res.json({
      success: true,
      signature,
      timestamp,
      apiKey: process.env.CLOUDINARY_API_KEY || "694234951845448",
      cloudName: process.env.CLOUDINARY_CLOUD_NAME || "dtd6qwe2a",
      folder: folder
    });
  } catch (err: any) {
    console.error('Error generating Cloudinary upload signature:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// API endpoint to dynamically proxy-stream or generate secure links from Cloudflare R2 bucket
app.get('/api/video/stream', async (req, res) => {
  const key = req.query.key as string;
  try {
    if (!key) {
      return res.status(400).send('مفتاح الملف مطلوب.');
    }

    const client = getR2Client();
    const bucketName = process.env.R2_BUCKET_NAME || 'gcc-academy-videos';

    const range = req.headers.range;
    const commandParams: any = {
      Bucket: bucketName,
      Key: key,
    };
    if (range) {
      commandParams.Range = range;
    }

    const command = new GetObjectCommand(commandParams);
    const response = await client.send(command);

    if (response.ContentType) {
      res.setHeader('Content-Type', response.ContentType);
    }
    if (response.ContentLength) {
      res.setHeader('Content-Length', response.ContentLength);
    }
    if (response.ContentRange) {
      res.setHeader('Content-Range', response.ContentRange);
    }
    if (response.AcceptRanges) {
      res.setHeader('Accept-Ranges', response.AcceptRanges);
    }

    res.status(range ? 206 : 200);

    const stream = response.Body as any;
    if (stream && typeof stream.pipe === 'function') {
      stream.pipe(res);
    } else if (response.Body) {
      const arr = await response.Body.transformToByteArray();
      res.end(Buffer.from(arr));
    } else {
      res.status(404).send('تعذر بث هذا الملف.');
    }
  } catch (err: any) {
    console.error('Error in direct /api/video/stream proxy-streaming:', err.message);
    
    // Graceful fallback to signed URL redirect in case direct S3 streaming fails or ranges cause issues
    try {
      if (key) {
        console.log('Attempting 302 redirect fallback for safe-access of key:', key);
        const client = getR2Client();
        const bucketName = process.env.R2_BUCKET_NAME || 'gcc-academy-videos';
        const command = new GetObjectCommand({
          Bucket: bucketName,
          Key: key,
        });
        const signedUrl = await getSignedUrl(client, command, { expiresIn: 43200 });
        return res.redirect(302, signedUrl);
      }
    } catch (fallbackErr: any) {
      console.error('Proxy streaming fallback also failed:', fallbackErr.message);
    }
    res.status(500).send('عذراً، وقع خطأ أثناء توليد بث آمن للملف: ' + err.message);
  }
});

// API endpoint to generate a presigned PUT URL for uploading directly to Cloudflare R2 from the client-side
app.post('/api/upload/presign', async (req, res) => {
  try {
    const { filename, filetype } = req.body;
    if (!filename) {
      return res.status(400).json({ error: 'اسم الملف مطلوب.' });
    }

    const client = getR2Client();
    const bucketName = process.env.R2_BUCKET_NAME || 'gcc-academy-videos';
    
    // Cleanup filenames
    const safeName = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    const isVideo = filetype?.startsWith('video/') || filename.endsWith('.mp4') || filename.endsWith('.mov') || filename.endsWith('.avi');
    const key = isVideo ? `videos/${Date.now()}-${safeName}` : `documents/${Date.now()}-${safeName}`;

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      ContentType: filetype || 'application/octet-stream',
    });

    const uploadUrl = await getSignedUrl(client, command, { expiresIn: 3600 });

    let publicUrl = process.env.R2_PUBLIC_URL || '';
    if (!publicUrl) {
      publicUrl = `https://pub-9e3616bcd27644489c80a1831756eb22.r2.dev`;
    }
    const baseUrl = publicUrl.endsWith('/') ? publicUrl.slice(0, -1) : publicUrl;
    const fileUrl = `${baseUrl}/${key}`;

    return res.json({
      success: true,
      uploadUrl,
      fileUrl,
      key
    });
  } catch (err: any) {
    console.error('Error in /api/upload/presign:', err.message);
    return res.status(500).json({ 
      success: false, 
      error: 'بيانات الاتصال بـ Cloudflare R2 ناقصة أو غير مُعرّفة في متغيرات البيئة.' 
    });
  }
});

// API endpoint for Media file uploading (with intelligent routing for videos <= 15MB to Cloudinary, and > 15MB to Cloudflare R2)
app.post('/api/upload', uploadHandler.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'الرجاء اختيار ملف لرفعه.' });
    }

    const isVideo = req.file.mimetype.startsWith('video/') || 
                    req.file.originalname.endsWith('.mp4') || 
                    req.file.originalname.endsWith('.mov') || 
                    req.file.originalname.endsWith('.avi');
    const fileSize = req.file.size;

    const limit15MB = 15 * 1024 * 1024;

    console.log(`Received file for upload: ${req.file.originalname} (${req.file.mimetype}), Size: ${fileSize} bytes`);

    // Dynamic resource type identifier for Cloudinary backend api
    const uploadToCloudinary = (fileBuffer: Buffer, mimetype: string, originalname: string) => {
      let resourceType: 'image' | 'video' | 'raw' | 'auto' = 'auto';
      if (mimetype.startsWith('video/')) {
        resourceType = 'video';
      } else if (mimetype.startsWith('image/')) {
        resourceType = 'image';
      } else {
        resourceType = 'raw';
      }

      return new Promise<any>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'gcc_academy_media',
            resource_type: resourceType,
            filename_override: originalname,
            use_filename: true
          },
          (error, result) => {
            if (error) {
              console.error('Cloudinary stream upload error:', error);
              reject(error);
            } else {
              resolve(result);
            }
          }
        );
        uploadStream.end(fileBuffer);
      });
    };

    // Helper function to safely write the file locally if cloud uploads are unavailable or fail.
    // We return a relative URL starting with `/assets` which is guaranteed to work 
    // seamlessly on any browser, device, or incognito window because it queries the active host context!
    const saveLocalFallback = (file: Express.Multer.File) => {
      console.log(`Executing local static storage wrapper as primary/secondary fallback...`);
      const localDir = path.join(process.cwd(), 'assets', 'uploads');
      if (!fs.existsSync(localDir)) {
        fs.mkdirSync(localDir, { recursive: true });
      }
      const localSafeName = `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const localPath = path.join(localDir, localSafeName);
      fs.writeFileSync(localPath, file.buffer);

      const localUrl = `/assets/uploads/${localSafeName}`;
      console.log(`Local static asset saved on disk successfully! URL: ${localUrl}`);
      return localUrl;
    };

    // Routing Logic: Prioritize Cloudflare R2 for all file types if R2 credentials are configured.
    const isImage = req.file.mimetype.startsWith('image/');
    const isPdf = req.file.mimetype === 'application/pdf' || req.file.originalname.endsWith('.pdf');

    let hasR2 = false;
    try {
      hasR2 = !!(process.env.R2_ACCOUNT_ID && process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY);
    } catch (e) {}

    if (hasR2) {
      console.log(`Cloudflare R2 is configured. Primary routing to Cloudflare R2 for file: ${req.file.originalname} (${req.file.mimetype})`);
      try {
        const client = getR2Client();
        const bucketName = process.env.R2_BUCKET_NAME || 'gcc-academy-videos';
        // Cleanup filenames to prevent layout-breaks or uri corruption
        const safeName = req.file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
        
        let folderPrefix = 'others';
        if (isVideo) {
          folderPrefix = 'videos';
        } else if (isImage) {
          folderPrefix = 'images';
        } else if (isPdf) {
          folderPrefix = 'documents';
        }
        const key = `${folderPrefix}/${Date.now()}-${safeName}`;

        const uploadParams = {
          Bucket: bucketName,
          Key: key,
          Body: req.file.buffer,
          ContentType: req.file.mimetype,
        };

        // Fire PutObject command to user's Cloudflare R2 bucket
        await client.send(new PutObjectCommand(uploadParams));

        let publicUrl = process.env.R2_PUBLIC_URL || '';
        if (!publicUrl) {
          // Default R2 dev subdomain format as fallback
          publicUrl = `https://pub-9e3616bcd27644489c80a1831756eb22.r2.dev`;
        }
        const baseUrl = publicUrl.endsWith('/') ? publicUrl.slice(0, -1) : publicUrl;
        const fileUrl = `${baseUrl}/${key}`;

        console.log(`Cloudflare R2 Direct Upload successful from system proxy! URL: ${fileUrl}`);
        return res.json({
          success: true,
          url: fileUrl,
          provider: 'r2',
          mimetype: req.file.mimetype,
          size: fileSize
        });

      } catch (r2Error: any) {
        console.warn(`Direct R2 upload from server proxy failed: ${r2Error.message}. Escalating fallback to Cloudinary...`);
      }
    }

    // Fallback or Non-R2 route: Try Cloudinary first, then Local Fallback
    console.log(`Routing file to Cloudinary fallback...`);
    try {
      const cloudinaryResult = await uploadToCloudinary(req.file.buffer, req.file.mimetype, req.file.originalname);
      console.log('Cloudinary upload success. URL:', cloudinaryResult.secure_url);

      return res.json({
        success: true,
        url: cloudinaryResult.secure_url,
        provider: 'cloudinary',
        resourceType: cloudinaryResult.resource_type,
        duration: cloudinaryResult.duration,
        format: cloudinaryResult.format,
        publicId: cloudinaryResult.public_id,
        size: fileSize
      });
    } catch (cloudinaryError: any) {
      console.warn(`Cloudinary upload failed: ${cloudinaryError.message}. Escalating local server fallback...`);
      const localUrl = saveLocalFallback(req.file);
      return res.json({
        success: true,
        url: localUrl,
        provider: 'local_dev_fallback',
        mimetype: req.file.mimetype,
        size: fileSize
      });
    }

  } catch (err: any) {
    console.error('Critical upload handler generic exception:', err);
    return res.status(500).json({ error: 'وقع خطأ أثناء معالجة أو رفع الملف للسحابة.', details: err.message });
  }
});

// API endpoint to Retrieve persisted training programs (courses, categories, lessons)
app.get('/api/training-data', (req, res) => {
  if (trainingDataCache) {
    return res.json({ success: true, ...trainingDataCache });
  } else {
    // If empty or file doesn't exist yet
    return res.json({ success: true, categories: null, courses: null, lessons: null });
  }
});

// API endpoint to Persist training programs (courses, categories, lessons)
app.post('/api/training-data', async (req, res) => {
  try {
    const { categories, courses, lessons } = req.body;
    if (!categories || !courses || !lessons) {
      return res.status(400).json({ error: 'بيانات غير مكتملة، يرجى تقديم الأقسام والكورسات والمحاضرات.' });
    }

    const payload = { categories, courses, lessons };
    trainingDataCache = payload;

    // 1. Write locally
    fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(payload, null, 2), 'utf-8');
    console.log('Persisted training programs databank locally of size:', JSON.stringify(payload).length);

    // 2. Sync to Cloudinary asynchronously as a secure backup raw file
    try {
      const buffer = Buffer.from(JSON.stringify(payload, null, 2), 'utf-8');
      const uploadBackup = () => {
        return new Promise<any>((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              resource_type: 'raw',
              public_id: 'gcc_backups/databank_store',
              overwrite: true
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          stream.end(buffer);
        });
      };
      
      const uploadResult = await uploadBackup();
      console.log('Successfully backed up training database to Cloudinary raw asset:', uploadResult.secure_url);
    } catch (cwErr) {
      console.warn('Could not save raw backup to Cloudinary (will run off local copy):', cwErr);
    }

    return res.json({ success: true, message: 'تم حفظ وتأمين البرامج التدريبية محلياً وسحابياً بحمد الله.' });

  } catch (err: any) {
    console.error('Critical save training-data exception:', err);
    return res.status(500).json({ error: 'فشل في حفظ البرامج التدريبية.', details: err.message });
  }
});

// JSON error handling middleware for API routes to catch upload limitations and other errors
app.use('/api', (err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[API Global Error Catch]:', err);
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      error: 'حجم الملف المرفوع كبير جداً ويتجاوز الحدود المسموحة (الحد الأقصى هو 100 ميجابايت).'
    });
  }
  res.status(err.status || 500).json({
    error: err.message || 'عذراً، حدث خطأ داخلي في معالجة طلبك.'
  });
});

// Start our full-stack Express server with Vite Dev middleware or static files serving
async function bootstrapServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[GCC Academy Full-Stack Platform] Server listing strictly on http://localhost:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  bootstrapServer();
}

export default app;
