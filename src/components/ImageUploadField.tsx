import { useEffect, useState } from 'react';
import { ImagePlus } from 'lucide-react';

interface ImageUploadFieldProps {
  currentImageUrl?: string;
  onFileChange: (file: File | null) => void;
}

export default function ImageUploadField({
  currentImageUrl,
  onFileChange,
}: ImageUploadFieldProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [selectedFile]);

  const handleFileChange = (file: File | null) => {
    setSelectedFile(file);
    onFileChange(file);
  };

  return (
    <div>
      <label className="mb-1 block text-xs font-bold text-stone-700">
        প্রোডাক্ট / কম্বোর ছবি:
      </label>
      <div className="flex items-center gap-3 rounded-xl border border-stone-200 p-2.5">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-stone-100">
          {previewUrl || currentImageUrl ? (
            <img
              src={previewUrl || currentImageUrl}
              alt="ছবির প্রিভিউ"
              className="h-full w-full object-cover"
            />
          ) : (
            <ImagePlus className="h-6 w-6 text-stone-400" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
            onChange={(event) => handleFileChange(event.target.files?.[0] || null)}
            className="block w-full text-xs text-stone-600 file:mr-2 file:rounded-lg file:border-0 file:bg-amber-100 file:px-3 file:py-1.5 file:font-bold file:text-amber-900"
          />
          <p className="mt-1 text-[10px] text-stone-500">ছবি সর্বোচ্চ ৫ MB</p>
        </div>
      </div>
    </div>
  );
}
