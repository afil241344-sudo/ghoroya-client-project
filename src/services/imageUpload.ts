import { getSupabaseClient } from '../lib/supabase';

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const IMAGE_BUCKET = 'catalog';

export async function uploadCatalogImage(
  file: File,
  folder: 'products' | 'combos',
  itemId: string,
): Promise<string> {
  const allowedImageTypes = new Set([
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/avif',
  ]);
  if (!allowedImageTypes.has(file.type)) {
    throw new Error('JPEG, PNG, WebP, GIF বা AVIF ছবির ফাইল নির্বাচন করুন।');
  }
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    throw new Error('ছবির সাইজ ৫ MB-এর মধ্যে হতে হবে।');
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
