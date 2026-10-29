import { useEffect, useRef, useState } from 'react';
import { Check, ImagePlus, Upload, X } from 'lucide-react';
import { readImageDimensions } from '../services/imageUpload';

export interface GalleryImageOption {
  id: string;
  label: string;
  imageUrl: string;
  category: 'homepage' | 'gallery' | 'product' | 'combo' | 'slider';
}

type ImageCategory = 'all' | GalleryImageOption['category'];

interface GalleryImagePickerProps {
  availableSlots: number;
  existingImages: GalleryImageOption[];
  selectedFiles: File[];
  selectedImageUrls: string[];
  onFilesChange: (files: File[]) => void;
  onImageUrlsChange: (imageUrls: string[]) => void;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MIN_IMAGE_DIMENSION = 600;
const ACCEPTED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']);

export default function GalleryImagePicker({
  availableSlots,
  existingImages,
  selectedFiles,
  selectedImageUrls,
  onFilesChange,
  onImageUrlsChange,
}: GalleryImagePickerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<'upload' | 'existing'>('upload');
  const [imageCategory, setImageCategory] = useState<ImageCategory>('all');
  const [fileError, setFileError] = useState<string | null>(null);
  const [filePreviews, setFilePreviews] = useState<Array<{ file: File; url: string }>>([]);
  const visibleExistingImages = imageCategory === 'all'
    ? existingImages
    : existingImages.filter((image) => image.category === imageCategory);
  const imageCategoryOptions: Array<{ id: ImageCategory; label: string }> = [
    { id: 'all', label: 'সব ছবি' },
    { id: 'product', label: 'প্রোডাক্ট' },
    { id: 'combo', label: 'কম্বো' },
    { id: 'gallery', label: 'গ্যালারি' },
    { id: 'slider', label: 'স্লাইডার' },
    { id: 'homepage', label: 'আগের হোমপেজ' },
  ];
  const imageCategories = imageCategoryOptions.filter(({ id }) => (
    id === 'all' || existingImages.some((image) => image.category === id)
  ));

  useEffect(() => {
    const previews = selectedFiles.map((file) => ({ file, url: URL.createObjectURL(file) }));
    setFilePreviews(previews);
    return () => previews.forEach(({ url }) => URL.revokeObjectURL(url));
  }, [selectedFiles]);

  const selectFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setFileError(null);
    const addedFiles: File[] = [];
    const errors: string[] = [];
    const remainingSlots = Math.max(0, availableSlots - selectedImageUrls.length - selectedFiles.length);

    for (const file of Array.from(files)) {
      if (addedFiles.length >= remainingSlots) {
        errors.push(`একসাথে সর্বোচ্চ ${availableSlots}টি card রাখা যাবে।`);
        break;
      }
      if (!ACCEPTED_TYPES.has(file.type)) {
        errors.push(`${file.name}: JPEG, PNG, WebP, GIF অথবা AVIF ছবি দিন।`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        errors.push(`${file.name}: ছবির সাইজ ৫ MB-এর বেশি।`);
        continue;
      }
      if ([...selectedFiles, ...addedFiles].some((selected) => (
        selected.name === file.name && selected.size === file.size
      ))) {
        continue;
      }

      try {
        const { width, height } = await readImageDimensions(file);
        if (width < MIN_IMAGE_DIMENSION || height < MIN_IMAGE_DIMENSION) {
          errors.push(`${file.name}: অন্তত ${MIN_IMAGE_DIMENSION} × ${MIN_IMAGE_DIMENSION} px ছবি দিন।`);
          continue;
        }
        addedFiles.push(file);
      } catch (error: unknown) {
        errors.push(`${file.name}: ${error instanceof Error ? error.message : 'ছবিটি পড়া যায়নি।'}`);
      }
    }

    if (addedFiles.length) onFilesChange([...selectedFiles, ...addedFiles]);
    if (errors.length) setFileError(errors.join(' '));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const toggleExistingImage = (imageUrl: string) => {
    if (selectedImageUrls.includes(imageUrl)) {
      onImageUrlsChange(selectedImageUrls.filter((url) => url !== imageUrl));
      return;
    }
    if (selectedImageUrls.length + selectedFiles.length >= availableSlots) {
      setFileError(`একসাথে সর্বোচ্চ ${availableSlots}টি image card রাখা যাবে।`);
      return;
    }
    setFileError(null);
    onImageUrlsChange([...selectedImageUrls, imageUrl]);
  };

  const removeFile = (fileToRemove: File) => {
    onFilesChange(selectedFiles.filter((file) => file !== fileToRemove));
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
      <div className="flex border-b border-stone-200 bg-stone-50 p-1.5">
        <button
          type="button"
          onClick={() => setActiveTab('upload')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-bold transition ${activeTab === 'upload' ? 'bg-white text-emerald-800 shadow-sm' : 'text-stone-500 hover:text-stone-800'}`}
        >
          <Upload className="h-4 w-4" />
          নতুন ছবি upload
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('existing')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-bold transition ${activeTab === 'existing' ? 'bg-white text-emerald-800 shadow-sm' : 'text-stone-500 hover:text-stone-800'}`}
        >
          <ImagePlus className="h-4 w-4" />
          আগের ছবি বেছে নিন
        </button>
      </div>

      <div className="p-3 sm:p-4">
        {activeTab === 'upload' ? (
          <>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
              onChange={(event) => void selectFiles(event.target.files)}
              className="sr-only"
              aria-label="ছবি নির্বাচন করুন"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={selectedFiles.length + selectedImageUrls.length >= availableSlots}
              className="group flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-stone-300 bg-stone-50 px-4 py-8 text-center transition hover:border-emerald-500 hover:bg-emerald-50/50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-emerald-700 shadow-sm transition group-hover:scale-105">
                <ImagePlus className="h-6 w-6" />
              </span>
              <span className="mt-3 text-sm font-bold text-stone-800">ছবি বেছে নিতে এখানে click করুন</span>
              <span className="mt-1 text-xs text-stone-500">একসাথে একাধিক ছবি নির্বাচন করা যাবে</span>
            </button>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-stone-500">
              <span>Recommended: 1200 × 1200 px · Minimum: 600 × 600 px</span>
              <span>সর্বোচ্চ 5 MB · {selectedFiles.length + selectedImageUrls.length}/{availableSlots} নির্বাচিত</span>
            </div>
            <p className="mt-1 text-[11px] text-stone-500">Card square দেখাবে; rectangle ছবি মাঝখান থেকে crop হতে পারে।</p>
            {filePreviews.length > 0 && (
              <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
                {filePreviews.map(({ file, url }) => (
                  <div key={`${file.name}-${file.size}`} className="group relative overflow-hidden rounded-xl border border-stone-200 bg-stone-100">
                    <img src={url} alt={file.name} className="aspect-square w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeFile(file)}
                      aria-label={`${file.name} সরান`}
                      className="absolute right-1.5 top-1.5 rounded-full bg-stone-950/75 p-1.5 text-white opacity-100 transition hover:bg-rose-600 sm:opacity-0 sm:group-hover:opacity-100"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                    <p className="truncate px-2 py-1.5 text-[10px] text-stone-600">{file.name}</p>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : existingImages.length === 0 ? (
          <p className="rounded-xl border border-dashed border-stone-200 bg-stone-50 p-6 text-center text-xs text-stone-500">
            বেছে নেওয়ার মতো কোনো পুরোনো ছবি পাওয়া যায়নি।
          </p>
        ) : (
          <>
            <p className="mb-3 text-xs text-stone-500">যে ছবিগুলো card হিসেবে রাখতে চান, সেগুলোতে click করুন।</p>
            <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
              {imageCategories.map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setImageCategory(id)}
                  aria-pressed={imageCategory === id}
                  className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-bold transition ${imageCategory === id ? 'bg-emerald-700 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}
                >
                  {label}
                  {id !== 'all' && (
                    <span className="ml-1 opacity-75">
                      {existingImages.filter((image) => image.category === id).length}
                    </span>
                  )}
                </button>
              ))}
            </div>
            <div className="grid max-h-80 grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3">
              {visibleExistingImages.map((image) => {
                const isSelected = selectedImageUrls.includes(image.imageUrl);
                const isDisabled = !isSelected
                  && selectedFiles.length + selectedImageUrls.length >= availableSlots;
                return (
                  <button
                    key={image.id}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => toggleExistingImage(image.imageUrl)}
                    aria-pressed={isSelected}
                    className={`group relative overflow-hidden rounded-xl border-2 text-left transition ${isSelected ? 'border-emerald-600 ring-2 ring-emerald-100' : 'border-transparent hover:border-stone-300'} disabled:cursor-not-allowed disabled:opacity-40`}
                  >
                    <img src={image.imageUrl} alt="" className="aspect-square w-full bg-stone-100 object-cover" loading="lazy" />
                    <span className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/75 to-transparent px-2 pb-2 pt-6 text-[10px] font-semibold text-white">
                      {image.label}
                    </span>
                    <span className={`absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full shadow ${isSelected ? 'bg-emerald-600 text-white' : 'bg-white/90 text-stone-400'}`}>
                      {isSelected && <Check className="h-3.5 w-3.5" />}
                    </span>
                  </button>
                );
              })}
            </div>
            {visibleExistingImages.length === 0 && (
              <p className="rounded-xl border border-dashed border-stone-200 bg-stone-50 p-6 text-center text-xs text-stone-500">
                এই category-তে কোনো ছবি পাওয়া যায়নি।
              </p>
            )}
            <p className="mt-3 text-right text-[11px] text-stone-500">
              {selectedFiles.length + selectedImageUrls.length}/{availableSlots}টি ছবি নির্বাচিত
            </p>
          </>
        )}
        {fileError && (
          <p role="alert" className="mt-3 rounded-lg bg-rose-50 p-3 text-xs font-medium text-rose-700">
            {fileError}
          </p>
        )}
      </div>
    </div>
  );
}
