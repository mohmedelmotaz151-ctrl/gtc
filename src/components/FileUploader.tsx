/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { Upload, File, Image, Video, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

interface FileUploaderProps {
  id: string;
  accept: string;
  label: string;
  onUploadSuccess: (url: string) => void;
  helperText?: string;
}

export default function FileUploader({
  id,
  accept,
  label,
  onUploadSuccess,
  helperText = "يدعم الملفات الصوتية، المرئية، والمستندات عبر السيرفر السحابي كلويديناري"
}: FileUploaderProps) {
  const [dragOver, setDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const uploadFile = async (file: File) => {
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);
    setUploadedUrl(null);
    setFileName(file.name);

    let uploadedSuccessfully = false;

    // 1. Try to fetch presigned URL and upload directly to Cloudflare R2 from the browser
    try {
      console.log(`Attempting direct browser upload to Cloudflare R2 for: ${file.name}`);
      const presignRes = await fetch('/api/upload/presign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          filename: file.name,
          filetype: file.type
        })
      });

      if (presignRes.ok) {
        const presignData = await presignRes.json();
        if (presignData.success && presignData.uploadUrl) {
          console.log('Successfully generated presigned R2 URL. Commencing direct client upload to:', presignData.uploadUrl);
          
          try {
            const uploadRes = await fetch(presignData.uploadUrl, {
              method: 'PUT',
              headers: {
                'Content-Type': file.type || 'application/octet-stream'
              },
              body: file
            });

            if (uploadRes.ok) {
              console.log('Direct Cloudflare R2 upload succeeded!', presignData.fileUrl);
              setUploadedUrl(presignData.fileUrl);
              onUploadSuccess(presignData.fileUrl);
              uploadedSuccessfully = true;
            } else {
              const errBody = await uploadRes.text().catch(() => '');
              console.warn(`Direct PUT upload failed with status (${uploadRes.status}). Base response context:`, errBody);
            }
          } catch (r2PutError: any) {
            console.error('Direct PUT upload to R2 failed due to network / CORS. Please ensure CORS rules are set on your Cloudflare R2 bucket (Allowed Methods: PUT, Allowed Headers: content-type, Allowed Origins: *). Error details:', r2PutError?.message || r2PutError);
          }
        }
      }
    } catch (r2ClientError: any) {
      console.warn('Direct upload attempt to Cloudflare R2 skipped or failed:', r2ClientError.message || r2ClientError);
    }

    // 2. Try direct browser-side Cloudinary Upload using signed signature (completely bypasses server request limits)
    if (!uploadedSuccessfully) {
      try {
        console.log(`Attempting direct browser-side signed upload to Cloudinary for: ${file.name}`);
        const signRes = await fetch('/api/cloudinary/sign', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (signRes.ok) {
          const signData = await signRes.json();
          if (signData.success && signData.signature) {
            console.log('Successfully generated direct Cloudinary upload signature.');
            
            let resourceType = 'raw';
            if (file.type.startsWith('image/')) {
              resourceType = 'image';
            } else if (file.type.startsWith('video/')) {
              resourceType = 'video';
            }

            const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${signData.cloudName}/${resourceType}/upload`;
            const cloudFormData = new FormData();
            cloudFormData.append('file', file);
            cloudFormData.append('api_key', signData.apiKey);
            cloudFormData.append('timestamp', signData.timestamp.toString());
            cloudFormData.append('signature', signData.signature);
            cloudFormData.append('folder', signData.folder);

            const uploadCloudRes = await fetch(cloudinaryUrl, {
              method: 'POST',
              body: cloudFormData
            });

            if (uploadCloudRes.ok) {
              const uploadCloudData = await uploadCloudRes.json();
              if (uploadCloudData.secure_url) {
                console.log('Direct browser-side Cloudinary upload succeeded!', uploadCloudData.secure_url);
                setUploadedUrl(uploadCloudData.secure_url);
                onUploadSuccess(uploadCloudData.secure_url);
                uploadedSuccessfully = true;
              }
            } else {
              console.warn(`Direct Cloudinary upload response failed with status: ${uploadCloudRes.status}`);
            }
          }
        }
      } catch (clClientError: any) {
        console.warn('Direct browser-to-Cloudinary upload failed or was skipped:', clClientError.message || clClientError);
      }
    }

    // 3. Server-side proxy upload fallback if direct uploads failed, only for files less than 200 MB (suitable for all Cloud Run containers!)
    if (!uploadedSuccessfully && file.size < 200 * 1024 * 1024) {
      console.log('Starting backup upload via server fallback...');
      const formData = new FormData();
      formData.append('file', file);

      try {
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });

        if (!response.ok) {
          let errorMessage = 'فشل في رفع الملف إلى السيرفر.';
          try {
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
              const errorData = await response.json();
              errorMessage = errorData.error || errorData.message || errorMessage;
            } else {
              const text = await response.text();
              if (response.status === 413) {
                errorMessage = 'حجم الملف المرفوع كبير جداً ويتجاوز حدود الرفع القصوى المسموحة من شبكة الخادم.';
              } else {
                errorMessage = `خطأ في السيرفر (${response.status}): ${text.slice(0, 80)}`;
              }
            }
          } catch (e) {
            errorMessage = `فشل الرفع برمز الاستجابة (${response.status})`;
          }
          throw new Error(errorMessage);
        }

        const data = await response.json();
        if (data.success && data.url) {
          setUploadedUrl(data.url);
          onUploadSuccess(data.url);
          uploadedSuccessfully = true;
        }
      } catch (err: any) {
        console.warn('Proxy upload handler warning:', err.message || err);
      }
    }

    // 4. If all uploads fail, show a real cloud/network error and do NOT fallback to sandboxed 'blob:' links
    if (!uploadedSuccessfully) {
      setUploadError('فشل الرفع السحابي للملف. تأكد من توفر سحابة Cloudflare R2 أو Cloudinary أو حجم الملف.');
    }

    setIsUploading(false);
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      uploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      uploadFile(e.target.files[0]);
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="space-y-2 mt-1" id={`uploader-container-${id}`}>
      <label className="block text-xs font-bold text-slate-700 text-right">
        {label}
      </label>

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={triggerFileInput}
        className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[140px] relative ${
          dragOver 
            ? 'border-amber-500 bg-amber-500/5 scale-[0.99]' 
            : uploadedUrl 
            ? 'border-emerald-500 bg-emerald-500/5' 
            : 'border-slate-200 bg-slate-50 hover:bg-slate-100/70 hover:border-slate-300'
        }`}
      >
        <input
          id={id}
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileChange}
          className="hidden"
        />

        {isUploading ? (
          <div className="flex flex-col items-center space-y-2 text-amber-600">
            <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
            <p className="text-xs font-bold">جاري رفع الملف وتأمينه على وبثّه لقاعدة البيانات السحابية...</p>
            <span className="text-[10px] text-slate-400 max-w-[250px] truncate">{fileName}</span>
          </div>
        ) : uploadedUrl ? (
          <div className="flex flex-col items-center space-y-2 text-emerald-600">
            <CheckCircle2 className="h-8 w-8 text-emerald-500" />
            <p className="text-xs font-extrabold text-emerald-750">
              {uploadedUrl.includes('cloudinary') 
                ? 'تم الرفع بنجاح وحفظه على Cloudinary سحابياً (متاح للجميع)!' 
                : (uploadedUrl.includes('r2.dev') || uploadedUrl.includes('r2.cloudflarestorage.com') || uploadedUrl.includes('r2'))
                ? 'تم الرفع بنجاح وتأمينه في Cloudflare R2 وبثه عاماً لجميع الطلاب!' 
                : 'تم الرفع بنجاح وحفظه عاماً بمخازن الأكاديمية!'}
            </p>
            <span className="text-[10px] text-slate-500 max-w-[280px] break-all truncate underline">{uploadedUrl}</span>
            <span className="text-[9px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-black mt-1">
              جاهز للاستخدام
            </span>
          </div>
        ) : uploadError ? (
          <div className="flex flex-col items-center space-y-2 text-rose-600">
            <AlertCircle className="h-8 w-8 text-rose-500" />
            <p className="text-xs font-bold">فشل الرفع: {uploadError}</p>
            <p className="text-[10px] text-slate-400">انقر أو اسحب ملفاً هنا للمحاولة مجدداً</p>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-2">
            <div className="p-2.5 bg-white rounded-full shadow-sm border border-slate-100 text-slate-400">
              {accept.includes('image') ? (
                <Image className="h-6 w-6" />
              ) : accept.includes('video') ? (
                <Video className="h-6 w-6" />
              ) : (
                <File className="h-6 w-6" />
              )}
            </div>
            <div className="text-slate-600 space-y-0.5">
              <p className="text-xs font-extrabold flex items-center justify-center gap-1">
                <span>اسحب وأفلت الملف هنا أو</span>
                <span className="text-amber-500 hover:text-amber-600 underline">اضغط للتصفح</span>
              </p>
              <p className="text-[10px] text-slate-400 font-normal">
                {helperText}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
