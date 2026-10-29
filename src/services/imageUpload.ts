import { getSupabaseClient } from '../lib/supabase';

const MAX_SOURCE_IMAGE_SIZE_BYTES = 15 * 1024 * 1024;
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const IMAGE_BUCKET = 'catalog';
const SLIDER_MIN_WIDTH = 1280;
const SLIDER_MIN_HEIGHT = 720;
const SLIDER_ASPECT_RATIO = 16 / 9;
const SLIDER_ASPECT_TOLERANCE = 0.015;
const MAX_CATALOG_IMAGE_DIMENSION = 1600;
const MAX_SLIDER_IMAGE_WIDTH = 1920;
const MAX_SLIDER_IMAGE_HEIGHT = 1080;
const IMAGE_COMPRESSION_THRESHOLD_BYTES = 350 * 1024;
const WEBP_QUALITIES = [0.84, 0.76, 0.68];

async function optimizeCatalogImage(
  file: File,
  folder: 'products' | 'combos' | 'slider' | 'gallery',
): Promise<File> {
  if (file.type === 'image/gif') return file;

  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  try {
    const maxWidth = folder === 'slider' ? MAX_SLIDER_IMAGE_WIDTH : MAX_CATALOG_IMAGE_DIMENSION;
    const maxHeight = folder === 'slider' ? MAX_SLIDER_IMAGE_HEIGHT : MAX_CATALOG_IMAGE_DIMENSION;
    const scale = Math.min(1, maxWidth / bitmap.width, maxHeight / bitmap.height);
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const needsResize = width !== bitmap.width || height !== bitmap.height;

    if (!needsResize && file.size <= IMAGE_COMPRESSION_THRESHOLD_BYTES) return file;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('ছবি optimize করার জন্য browser canvas পাওয়া যায়নি।');
    context.drawImage(bitmap, 0, 0, width, height);

    let optimizedBlob: Blob | null = null;
    for (const quality of WEBP_QUALITIES) {
      optimizedBlob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, 'image/webp', quality);
      });
      if (!optimizedBlob) throw new Error('WebP image তৈরি করা যায়নি।');
      if (optimizedBlob.size <= MAX_IMAGE_SIZE_BYTES) break;
    }

    if (!optimizedBlob) throw new Error('ছবি optimize করা যায়নি।');
    if (!needsResize && optimizedBlob.size >= file.size) return file;
    if (optimizedBlob.size > MAX_IMAGE_SIZE_BYTES) {
      throw new Error('ছবিটি optimize করার পরও ৫ MB-এর বেশি। ছোট image upload করুন।');
    }

    const optimizedName = `${file.name.replace(/\.[^.]+$/, '') || 'image'}.webp`;
    return new File([optimizedBlob], optimizedName, {
      type: 'image/webp',
      lastModified: file.lastModified,
    });
  } finally {
    bitmap.close();
  }
}

export async function uploadCatalogImage(
  file: File,
  folder: 'products' | 'combos' | 'slider' | 'gallery',
  itemId: string,
): Promise<string> {
  const allowedImageTypes = folder === 'slider'
    ? new Set([
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/avif',
    ])
    : new Set([
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'image/avif',
    ]);
  if (!allowedImageTypes.has(file.type)) {
    throw new Error(folder === 'slider'
      ? 'Slider-এর জন্য JPEG, PNG, WebP অথবা AVIF ছবি নির্বাচন করুন।'
      : 'JPEG, PNG, WebP, GIF বা AVIF ছবির ফাইল নির্বাচন করুন।');
  }
  if (file.size > MAX_SOURCE_IMAGE_SIZE_BYTES) {
    throw new Error('Upload-এর আগে ছবির সাইজ ১৫ MB-এর মধ্যে হতে হবে।');
  }
  if (folder === 'slider') {
    const { width, height } = await readImageDimensions(file);
    if (width < SLIDER_MIN_WIDTH || height < SLIDER_MIN_HEIGHT) {
      throw new Error('Slider ছবির ন্যূনতম resolution 1280 × 720 px হতে হবে।');
    }
    if (Math.abs(width / height - SLIDER_ASPECT_RATIO) > SLIDER_ASPECT_TOLERANCE) {
      throw new Error('Slider ছবির aspect ratio 16:9 হতে হবে (যেমন 1920 × 1080 px)।');
    }
  }

  const optimizedFile = await optimizeCatalogImage(file, folder);
  if (optimizedFile.size > MAX_IMAGE_SIZE_BYTES) {
    throw new Error(file.type === 'image/gif'
      ? 'GIF animation অক্ষত রাখতে compress করা হয়নি; GIF ফাইল ৫ MB-এর মধ্যে দিন।'
      : 'ছবির সাইজ optimize করার পরও ৫ MB-এর বেশি।');
  }
  const fileExtension = optimizedFile.name.split('.').pop()?.replace(/[^a-zA-Z0-9]/g, '') || 'image';
  const filePath = `${folder}/${itemId}/${Date.now()}.${fileExtension}`;
  const supabase = getSupabaseClient();
  const { error } = await supabase.storage
    .from(IMAGE_BUCKET)
    .upload(filePath, optimizedFile, { upsert: true, contentType: optimizedFile.type });

  if (error) {
    throw new Error(`ছবি আপলোড করা যায়নি: ${error.message}`);
  }

  return supabase.storage.from(IMAGE_BUCKET).getPublicUrl(filePath).data.publicUrl;
}

export async function copyCatalogImageToFolder(
  imageUrl: string,
  folder: 'products' | 'combos' | 'gallery',
  itemId: string,
): Promise<string> {
  const marker = '/storage/v1/object/public/catalog/';
  const markerIndex = imageUrl.indexOf(marker);
  let blob: Blob;
  let fileName: string;

  if (markerIndex >= 0) {
    const objectPath = decodeURIComponent(imageUrl.slice(markerIndex + marker.length));
    if (!objectPath) throw new Error('নির্বাচিত ছবির Storage path পাওয়া যায়নি।');
    const { data, error } = await getSupabaseClient().storage
      .from(IMAGE_BUCKET)
      .download(objectPath);
    if (error) throw new Error(`নির্বাচিত ছবি কপি করা যায়নি: ${error.message}`);
    blob = data;
    fileName = objectPath.split('/').pop() || 'selected-image';
  } else {
    const response = await fetch(imageUrl);
    if (!response.ok) throw new Error(`নির্বাচিত ছবি পড়া যায়নি (HTTP ${response.status})।`);
    blob = await response.blob();
    fileName = new URL(imageUrl, window.location.href).pathname.split('/').pop() || 'selected-image';
  }

  const extension = fileName.split('.').pop()?.replace(/[^a-zA-Z0-9]/g, '') || 'image';
  const mimeType = blob.type || ({
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    gif: 'image/gif',
    avif: 'image/avif',
  }[extension.toLowerCase()] ?? '');
  if (!mimeType) throw new Error('নির্বাচিত ছবির format চেনা যায়নি।');
  const file = new File([blob], `selected-image.${extension}`, { type: mimeType });
  return uploadCatalogImage(file, folder, itemId);
}

export async function copyCatalogImageToGallery(
  imageUrl: string,
  itemId: string,
): Promise<string> {
  return copyCatalogImageToFolder(imageUrl, 'gallery', itemId);
}

export async function readImageDimensions(file: File): Promise<{ width: number; height: number }> {
  try {
    const bitmap = await createImageBitmap(file);
    const dimensions = { width: bitmap.width, height: bitmap.height };
    bitmap.close();
    return dimensions;
  } catch {
    throw new Error('ছবিটি পড়া যায়নি। JPEG, PNG, WebP বা AVIF ফাইল দিন।');
  }
}

export async function deleteCatalogImage(imageUrl: string): Promise<void> {
  const marker = '/storage/v1/object/public/catalog/';
  const markerIndex = imageUrl.indexOf(marker);
  if (markerIndex < 0) return;

  const objectPath = decodeURIComponent(imageUrl.slice(markerIndex + marker.length));
  if (!objectPath) return;
  const { error } = await getSupabaseClient().storage.from(IMAGE_BUCKET).remove([objectPath]);
  if (error) throw new Error(`পুরোনো ছবি মুছে ফেলা যায়নি: ${error.message}`);
}
