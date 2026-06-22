/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { Upload, File, Image, Video, CheckCircle2, AlertCircle, Loader2, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';

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
  helperText = "يدعم الملفات الصوتية، المرئية، والمستندات عبر السحابة الآمنة Cloudflare R2"
}: FileUploaderProps) {
  const [dragOver, setDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [showGuide, setShowGuide] = useState(false);
  const [copied, setCopied] = useState(false);
  
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
    let failureReason = '';

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
              failureReason = `مشكلة في الرفع السحابي المباشر (${uploadRes.status}): ${errBody.slice(0, 50) || 'خطأ غير معروف'}`;
              console.warn(`Direct PUT upload failed with status (${uploadRes.status}). Base response context:`, errBody);
            }
          } catch (r2PutError: any) {
            failureReason = `فشل في الاتصال بمخدم R2 السحابي مباشرة (قد تكون مشكلة CORS أو شبكة). تفاصيل: ${r2PutError?.message || r2PutError}`;
            console.error('Direct PUT upload to R2 failed due to network / CORS. Please ensure CORS rules are set on your Cloudflare R2 bucket (Allowed Methods: PUT, Allowed Headers: content-type, Allowed Origins: *). Error details:', r2PutError?.message || r2PutError);
          }
        } else {
          failureReason = presignData.error || 'فشلت تهيئة رابط الرفع السحابي.';
        }
      } else {
        try {
          const presignErrData = await presignRes.json();
          failureReason = presignErrData.error || presignErrData.message || `خطأ سيرفر ${presignRes.status}`;
        } catch (e) {
          failureReason = `رمز خطأ تهيئة الرفع السحابي (${presignRes.status})`;
        }
      }
    } catch (r2ClientError: any) {
      failureReason = `فشل طلب الرفع المباشر: ${r2ClientError.message || r2ClientError}`;
      console.warn('Direct upload attempt to Cloudflare R2 skipped or failed:', r2ClientError.message || r2ClientError);
    }

    // 2. Server-side proxy upload fallback if direct uploads failed, only for files less than 200 MB (suitable for all Cloud Run containers!)
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
                errorMessage = 'حجم الملف المرفوع كبير جداً ويتجاوز حدود الرفع القصوى المسموحة من شبكة الخادم (32 ميجابايت). للرفع المباشر بلا حدود، يُرجى ضبط وتهيئة متغيرات Cloudflare R2.';
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
        } else {
          failureReason = data.error || 'عذراً، الخادم الخلفي لم يعثر على رابط الملف بعد معالجته.';
        }
      } catch (err: any) {
        failureReason = `${failureReason ? `${failureReason} | ` : ''}الرفع الاحتياطي عبر السيرفر فشل أيضاً: ${err.message || err}`;
        console.warn('Proxy upload handler warning:', err.message || err);
      }
    } else if (!uploadedSuccessfully && file.size >= 200 * 1024 * 1024) {
      failureReason = `الملف كبير جداً (${Math.round(file.size / (1024 * 1024))} ميجابايت) ولا يمكن رفعه عبر السيرفر الاحتياطي. يرجى تهيئة سحابة Cloudflare R2 لرفع الملفات الضخمة مباشرة.`;
    }

    // 3. If all uploads fail, show a real cloud/network error and do NOT fallback to sandboxed 'blob:' links
    if (!uploadedSuccessfully) {
      setUploadError(failureReason || 'فشل الرفع السحابي للملف. تأكد من تهيئة سحابة Cloudflare R2 بشكل صحيح وحجم الملف.');
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
              {(uploadedUrl.includes('r2.dev') || uploadedUrl.includes('r2.cloudflarestorage.com') || uploadedUrl.includes('r2'))
                ? 'تم الرفع بنجاح وتأمينه في Cloudflare R2 وبثه عاماً لجميع الطلاب!' 
                : 'تم الرفع بنجاح وحفظه عاماً بمخازن الأكاديمية!'}
            </p>
            <span className="text-[10px] text-slate-500 max-w-[280px] break-all truncate underline">{uploadedUrl}</span>
            <span className="text-[9px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-black mt-1">
              جاهز للاستخدام
            </span>
          </div>
        ) : uploadError ? (
          <div className="flex flex-col items-center space-y-2 text-rose-600 w-full px-4">
            <AlertCircle className="h-8 w-8 text-rose-500 flex-shrink-0" />
            <p className="text-xs font-bold text-center">فشل الرفع: {uploadError}</p>
            <p className="text-[10px] text-slate-400 text-center">انقر أو اسحب ملفاً هنا للمحاولة مجدداً</p>

            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowGuide(!showGuide);
              }}
              className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-md mt-2 flex items-center gap-1 justify-center transition-all"
            >
              <span>{showGuide ? 'إخفاء دليل حل مشاكل R2' : 'عرض دليل حل وتهيئة Cloudflare R2'}</span>
              {showGuide ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>

            {showGuide && (
              <div 
                onClick={(e) => e.stopPropagation()} 
                className="bg-white rounded-xl p-4 border border-slate-200 mt-2 text-right text-xs text-slate-700 space-y-3 shadow-lg w-full max-w-md mx-auto cursor-default transition-all duration-200 block"
              >
                <div className="border-b border-slate-100 pb-2 mb-2 text-slate-800 font-bold flex items-center gap-1">
                  <span>🛠️ دليل إعداد وحل مشاكل Cloudflare R2</span>
                </div>

                <div className="space-y-1.5">
                  <p className="font-bold text-slate-900">1. ضبط سياسة CORS في لوحة تحكم Cloudflare:</p>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    يجب تفعيل سياسة CORS للسماح للمتصفح برفع الملفات مباشرة إلى R2 دون حظر. تفضل بزيارة إعدادات حوض التخزين (Bucket Settings) في Cloudflare ثم الصق هذا الكود في قسم **CORS Policy**:
                  </p>
                  <div className="relative mt-2 bg-slate-50 p-2 rounded-md border border-slate-200 font-mono text-[10px] text-left block">
                    <pre className="overflow-x-auto max-h-[140px] whitespace-pre-wrap">{`[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "HEAD", "OPTIONS"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": []
  }
]`}</pre>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigator.clipboard.writeText(`[\n  {\n    "AllowedHeaders": ["*"],\n    "AllowedMethods": ["GET", "PUT", "POST", "HEAD", "OPTIONS"],\n    "AllowedOrigins": ["*"],\n    "ExposeHeaders": []\n  }\n]`);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      className="absolute top-1.5 right-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 p-1 rounded-md shadow-sm flex items-center gap-1 text-[10px]"
                      title="نسخ الكود"
                    >
                      {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                      <span>{copied ? 'تم النسخ!' : 'نسخ'}</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-1 pt-1 border-t border-slate-100 text-[11px]">
                  <p className="font-bold text-slate-900 text-xs">2. تعيين متغيرات البيئة بالشكل السليم في ملف <code className="font-mono text-[10px] bg-slate-100 p-0.5 rounded text-rose-600">.env</code>:</p>
                  <ul className="list-disc list-inside space-y-1 pr-1 text-slate-500">
                    <li><strong className="text-slate-700 font-mono">R2_ACCOUNT_ID</strong>: معرّف الحساب لـ Cloudflare (Account ID).</li>
                    <li><strong className="text-slate-700 font-mono">R2_ACCESS_KEY_ID</strong>: مفتاح الوصول الفريد للـ API.</li>
                    <li><strong className="text-slate-700 font-mono">R2_SECRET_ACCESS_KEY</strong>: المفتاح السري الآمن للتخزين.</li>
                    <li><strong className="text-slate-700 font-mono">R2_BUCKET_NAME</strong>: اسم حوض التخزين (Bucket Name).</li>
                    <li><strong className="text-slate-700 font-mono">R2_PUBLIC_URL</strong>: الرابط العام المباشر لمحتويات Bucket لتوليد روابط المحاضرات.</li>
                  </ul>
                </div>
              </div>
            )}
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
