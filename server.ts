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

// Load environment variables
dotenv.config();

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

// Setup multer for memory storage file uploads
const memoryStorage = multer.memoryStorage();
const uploadHandler = multer({
  storage: memoryStorage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB max limit to support video lecture uploads
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

// API endpoint for Media file uploading (Images and Videos) to Cloudinary
app.post('/api/upload', uploadHandler.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'الرجاء اختيار ملف لرفعه.' });
    }

    console.log(`Received file for upload to Cloudinary: ${req.file.originalname} (${req.file.mimetype})`);

    // Determine safe resource_type dynamically (video vs image vs auto)
    let resourceType: 'image' | 'video' | 'raw' | 'auto' = 'auto';
    if (req.file.mimetype.startsWith('video/')) {
      resourceType = 'video';
    } else if (req.file.mimetype.startsWith('image/')) {
      resourceType = 'image';
    } else {
      resourceType = 'raw';
    }

    // Convert Buffer to steam upload
    const uploadPromise = () => {
      return new Promise<any>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'gcc_academy_media',
            resource_type: resourceType,
            filename_override: req.file?.originalname,
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
        uploadStream.end(req.file?.buffer);
      });
    };

    const cloudinaryResult = await uploadPromise();
    console.log('Cloudinary upload success. URL:', cloudinaryResult.secure_url);

    return res.json({
      success: true,
      url: cloudinaryResult.secure_url,
      resourceType: cloudinaryResult.resource_type,
      duration: cloudinaryResult.duration,
      format: cloudinaryResult.format,
      publicId: cloudinaryResult.public_id
    });

  } catch (err: any) {
    console.error('Internal file upload failure:', err);
    return res.status(500).json({ error: 'وقع خطأ أثناء رفع الملف إلى السيرفر السحابي.', details: err.message });
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

bootstrapServer();
