import { useEffect, useState } from 'react';
import { ImagePlus } from 'lucide-react';
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

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MIN_WIDTH = 1280;
const MIN_HEIGHT = 720;
const EXPECTED_RATIO = 16 / 9;
const RATIO_TOLERANCE = 0.015;
const ACCEPTED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif']);

export default function SliderImageUploadField({
  currentImageUrl,
  onFileChange,
}: SliderImageUploadFieldProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageInfo, setImageInfo] = useState<ImageInfo | null>(null);
  const [isChecking, setIsChecking] = useState(false);

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
          ? 'ফাইল ৫ MB-এর বেশি।'
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
            error: selectedFile.size > MAX_FILE_SIZE ? 'ফাইল ৫ MB-এর বেশি।' : message,
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

    setSelectedFile(file);
    setImageInfo(null);
    onFileChange(file, false);
    if (file.size > MAX_FILE_SIZE) {
      setImageInfo({ width: 0, height: 0, size: file.size, error: 'ফাইল ৫ MB-এর বেশি।' });
    }
  };

  return (
    <div>
      <label className="mb-1 block text-xs font-bold text-stone-700">
        Slider image
      </label>
      <div className="grid gap-3 rounded-xl border border-stone-200 p-3 sm:grid-cols-[minmax(0,1fr)_200px]">
        <div className="min-w-0">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            onChange={(event) => handleChange(event.target.files?.[0] ?? null)}
            className="block w-full text-xs text-stone-600 file:mr-2 file:rounded-lg file:border-0 file:bg-amber-100 file:px-3 file:py-2 file:font-bold file:text-amber-900"
          />
          <div className="mt-2 space-y-1 text-[11px] text-stone-600">
            <p className="font-semibold">Recommended: 1920 × 1080 px (16:9)</p>
            <p>Minimum: 1280 × 720 px · Maximum file size: 5 MB</p>
            {isChecking && <p>ছবির dimension যাচাই হচ্ছে...</p>}
            {imageInfo && (
              <p>
                Selected: {imageInfo.width > 0 ? `${imageInfo.width} × ${imageInfo.height} px · ` : ''}
                {(imageInfo.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            )}
            {imageInfo?.error && <p role="alert" className="font-semibold text-rose-700">{imageInfo.error}</p>}
            {imageInfo && !imageInfo.error && (
              <p className="font-semibold text-emerald-700">Image size and ratio are valid.</p>
            )}
          </div>
        </div>
        <div className="flex aspect-video items-center justify-center overflow-hidden rounded-lg bg-stone-100">
          {previewUrl || currentImageUrl ? (
            <img
              src={previewUrl || currentImageUrl}
              alt="Slider image preview"
              className="h-full w-full object-cover"
            />
          ) : (
            <ImagePlus className="h-8 w-8 text-stone-400" />
          )}
        </div>
      </div>
    </div>
  );
}
