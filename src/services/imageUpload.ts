import { getSupabaseClient } from '../lib/supabase';

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const IMAGE_BUCKET = 'catalog';
const SLIDER_MIN_WIDTH = 1280;
const SLIDER_MIN_HEIGHT = 720;
const SLIDER_ASPECT_RATIO = 16 / 9;
const SLIDER_ASPECT_TOLERANCE = 0.015;

export async function uploadCatalogImage(
  file: File,
  folder: 'products' | 'combos' | 'slider',
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
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    throw new Error('ছবির সাইজ ৫ MB-এর মধ্যে হতে হবে।');
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

  const fileExtension = file.name.split('.').pop()?.replace(/[^a-zA-Z0-9]/g, '') || 'image';
  const filePath = `${folder}/${itemId}/${Date.now()}.${fileExtension}`;
  const supabase = getSupabaseClient();
  const { error } = await supabase.storage
    .from(IMAGE_BUCKET)
    .upload(filePath, file, { upsert: true, contentType: file.type });

  if (error) {
    throw new Error(`ছবি আপলোড করা যায়নি: ${error.message}`);
  }

  return supabase.storage.from(IMAGE_BUCKET).getPublicUrl(filePath).data.publicUrl;
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
