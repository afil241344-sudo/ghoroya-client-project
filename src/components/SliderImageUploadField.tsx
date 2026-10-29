import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, ImagePlus, Upload, X } from 'lucide-react';
import { readImageDimensions } from '../services/imageUpload';

interface SliderImageUploadFieldProps {
  currentImageUrl?: string;
  onFileChange: (file: File | null, isValid: boolean) => void;
}

interface ImageInfo {
  width: number;
  height: number;
  size: number;
  error?: string;
}

const MAX_FILE_SIZE = 15 * 1024 * 1024;
const MIN_WIDTH = 1280;
const MIN_HEIGHT = 720;
const EXPECTED_RATIO = 16 / 9;
const RATIO_TOLERANCE = 0.015;
const ACCEPTED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif']);

export default function SliderImageUploadField({
  currentImageUrl,
  onFileChange,
}: SliderImageUploadFieldProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageInfo, setImageInfo] = useState<ImageInfo | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(objectUrl);
    let active = true;
    setIsChecking(true);
    readImageDimensions(selectedFile)
      .then(({ width, height }) => {
        const ratio = width / height;
        const error = selectedFile.size > MAX_FILE_SIZE
          ? 'Upload-এর আগে ফাইল ১৫ MB-এর বেশি।'
          : width < MIN_WIDTH || height < MIN_HEIGHT
            ? `Resolution কম। অন্তত ${MIN_WIDTH} × ${MIN_HEIGHT} px লাগবে।`
            : Math.abs(ratio - EXPECTED_RATIO) > RATIO_TOLERANCE
              ? 'Aspect ratio 16:9 নয়; upload-এর আগে crop করুন।'
              : undefined;
        if (active) {
          setImageInfo({ width, height, size: selectedFile.size, error });
          onFileChange(selectedFile, !error);
        }
      })
      .catch((error: unknown) => {
        if (active) {
          const message = error instanceof Error ? error.message : 'ছবিটি পড়া যায়নি।';
          setImageInfo({
            width: 0,
            height: 0,
            size: selectedFile.size,
            error: selectedFile.size > MAX_FILE_SIZE ? 'Upload-এর আগে ফাইল ১৫ MB-এর বেশি।' : message,
          });
          onFileChange(selectedFile, false);
        }
      })
      .finally(() => {
        if (active) setIsChecking(false);
      });

    return () => {
      active = false;
      URL.revokeObjectURL(objectUrl);
    };
  }, [selectedFile, onFileChange]);

  const handleChange = (file: File | null) => {
    if (!file) {
      setSelectedFile(null);
      setImageInfo(null);
      onFileChange(null, true);
      return;
    }

    if (!ACCEPTED_TYPES.has(file.type)) {
      const error = 'JPEG, PNG, WebP অথবা AVIF ছবি নির্বাচন করুন।';
      setSelectedFile(null);
      setImageInfo({ width: 0, height: 0, size: file.size, error });
      onFileChange(file, false);
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setSelectedFile(null);
      setImageInfo({
        width: 0,
        height: 0,
        size: file.size,
        error: 'Upload-এর আগে ফাইল ১৫ MB-এর বেশি।',
      });
      onFileChange(file, false);
      return;
    }

    setSelectedFile(file);
    setImageInfo(null);
    onFileChange(file, false);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <div>
          <label className="block text-xs font-bold text-stone-800">Slider image</label>
          <p className="mt-0.5 text-[11px] text-stone-500">Homepage-এর জন্য প্রশস্ত 16:9 ছবি বেছে নিন</p>
        </div>
        <span className="shrink-0 rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-800 ring-1 ring-amber-200">
          16:9
        </span>
      </div>

      <div
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={(event) => {
          if (!(event.relatedTarget instanceof Node) || !event.currentTarget.contains(event.relatedTarget)) {
            setIsDragging(false);
          }
        }}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          handleChange(event.dataTransfer.files?.[0] ?? null);
        }}
        className={`grid overflow-hidden rounded-2xl border bg-white shadow-sm transition ${
          isDragging ? 'border-emerald-500 ring-4 ring-emerald-100' : 'border-stone-200'
        } sm:grid-cols-[minmax(0,1fr)_minmax(220px,40%)]`}
      >
        <div className="flex min-w-0 flex-col justify-center p-4 sm:p-5">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            onChange={(event) => {
              handleChange(event.target.files?.[0] ?? null);
              event.currentTarget.value = '';
            }}
            className="sr-only"
            aria-label="Slider image নির্বাচন করুন"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="group flex min-h-36 w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-stone-300 bg-stone-50 px-4 py-5 text-center transition hover:border-emerald-500 hover:bg-emerald-50/60 focus:outline-none focus:ring-4 focus:ring-emerald-100"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-emerald-700 shadow-sm ring-1 ring-stone-200 transition group-hover:scale-105">
              <Upload className="h-5 w-5" />
            </span>
            <span className="mt-3 text-sm font-bold text-stone-800">
              {selectedFile ? 'অন্য ছবি বেছে নিন' : 'ছবি upload করতে click করুন'}
            </span>
            <span className="mt-1 text-[11px] text-stone-500">অথবা ছবিটি এখানে drag & drop করুন</span>
            <span className="mt-2 rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold text-stone-500 ring-1 ring-stone-200">
              JPEG · PNG · WebP · AVIF
            </span>
          </button>

          <div className="mt-3 space-y-1 text-[11px] leading-relaxed text-stone-500">
            <p><strong className="text-stone-700">Recommended:</strong> 1920 × 1080 px · <strong className="text-stone-700">Minimum:</strong> 1280 × 720 px</p>
            <p>সর্বোচ্চ 15 MB upload; বড় image WebP-তে optimize হবে (storage limit 5 MB)।</p>
          </div>

          {isChecking && (
            <p role="status" className="mt-3 flex items-center gap-2 text-xs font-semibold text-stone-600">
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-stone-300 border-t-emerald-700" />
              ছবির dimension যাচাই হচ্ছে...
            </p>
          )}
          {imageInfo?.error && (
            <p role="alert" className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
              {imageInfo.error}
            </p>
          )}
          {imageInfo && !imageInfo.error && (
            <div className="mt-3 flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                <strong>{imageInfo.width} × {imageInfo.height} px</strong>
                {' · '}{(imageInfo.size / (1024 * 1024)).toFixed(2)} MB · ছবিটি ব্যবহারের জন্য প্রস্তুত
              </span>
            </div>
          )}
          {selectedFile && (
            <div className="mt-3 flex min-w-0 items-center gap-2 rounded-lg bg-stone-50 px-3 py-2">
              <ImagePlus className="h-4 w-4 shrink-0 text-stone-500" />
              <span className="min-w-0 flex-1 truncate text-xs font-medium text-stone-700">{selectedFile.name}</span>
              <button
                type="button"
                onClick={() => handleChange(null)}
                aria-label="নির্বাচিত ছবি সরান"
                className="rounded-md p-1 text-stone-500 hover:bg-rose-50 hover:text-rose-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        <div className="relative min-h-40 overflow-hidden bg-stone-100 sm:min-h-full">
          {previewUrl || currentImageUrl ? (
            <>
              <img
                src={previewUrl || currentImageUrl}
                alt="Slider image preview"
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-stone-950/70 to-transparent px-3 pb-3 pt-10">
                <span className="rounded-full bg-black/35 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur-sm">
                  {previewUrl ? 'নতুন ছবির preview' : 'বর্তমান slider image'}
                </span>
              </div>
            </>
          ) : (
            <div className="flex h-full min-h-40 flex-col items-center justify-center gap-2 text-stone-400">
              <ImagePlus className="h-9 w-9" />
              <span className="text-xs font-medium">ছবির preview এখানে দেখাবে</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
