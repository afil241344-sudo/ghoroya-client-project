import { config } from 'dotenv';
import { initializeApp } from 'firebase/app';
import { collection, getDocs, getFirestore } from 'firebase/firestore';
import { createClient } from '@supabase/supabase-js';
import firebaseConfig from '../firebase-applet-config.json';

config({ path: '.env.local' });

type FirebaseRecord = Record<string, unknown> & { id: string };

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const secretKey = process.env.SUPABASE_SECRET_KEY;
if (!supabaseUrl || !secretKey) {
  throw new Error('Set VITE_SUPABASE_URL and SUPABASE_SECRET_KEY in .env.local before migration.');
}

const firebaseApp = initializeApp(firebaseConfig, 'firebase-to-supabase-migration');
const firestore = getFirestore(firebaseApp);
const supabase = createClient(supabaseUrl, secretKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function toSnakeCase(record: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(record)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => [
        key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`),
        value,
      ]),
  );
}

function isoDate(value: unknown): string {
  if (value && typeof value === 'object' && 'toDate' in value) {
    const date = (value as { toDate: () => Date }).toDate();
    return date.toISOString();
  }
  if (typeof value === 'string' && !Number.isNaN(Date.parse(value))) return value;
  return new Date().toISOString();
}

async function loadCollection(name: string): Promise<FirebaseRecord[]> {
  const snapshot = await getDocs(collection(firestore, name));
  return snapshot.docs.map((document) => ({
    id: document.id,
    ...document.data(),
  })) as FirebaseRecord[];
}

async function migrateImage(
  row: FirebaseRecord,
  folder: 'products' | 'combos',
): Promise<string | null> {
  const url = row.imageUrl;
  if (typeof url !== 'string' || !url) return null;
  if (url.startsWith(`${supabaseUrl}/storage/v1/object/public/catalog/`)) return url;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Could not download image for ${row.id}: ${response.status} ${response.statusText}`);
  }

  const contentType = response.headers.get('content-type') || 'image/jpeg';
  if (!contentType.startsWith('image/')) {
    throw new Error(`Image URL for ${row.id} returned non-image content (${contentType}).`);
  }
  const extension = contentType.split('/')[1]?.split(';')[0] || 'jpg';
  const path = `${folder}/${row.id}/firebase-migration.${extension}`;
  const { error } = await supabase.storage
    .from('catalog')
    .upload(path, await response.arrayBuffer(), { upsert: true, contentType });
  if (error) throw new Error(`Could not upload image for ${row.id}: ${error.message}`);
  return supabase.storage.from('catalog').getPublicUrl(path).data.publicUrl;
}

async function migrateCatalog(
  table: 'products' | 'combos',
  rows: FirebaseRecord[],
): Promise<void> {
  const converted = await Promise.all(rows.map(async (row) => {
    const imageUrl = await migrateImage(row, table);
    const source: Record<string, unknown> = { ...row, ...(imageUrl ? { imageUrl } : {}) };
    delete source.timestamp;
    return toSnakeCase(source);
  }));
  if (converted.length === 0) return;

  const { error } = await supabase.from(table).upsert(converted, { onConflict: 'id' });
  if (error) throw new Error(`Could not migrate ${table}: ${error.message}`);
  console.log(`Migrated ${converted.length} ${table}.`);
}

async function migrateOrders(rows: FirebaseRecord[]): Promise<void> {
  const converted = rows.map((row) => {
    const status = row.status === 'confirmed'
      ? 'pending'
      : row.status === 'packaging'
        ? 'processing'
        : row.status;
    const source = {
      id: row.id,
      orderId: row.orderId || row.id,
      customerName: row.customerName,
      customerPhone: row.customerPhone,
      customerAddress: row.customerAddress,
      deliveryArea: row.deliveryArea,
      note: row.note || '',
      paymentMethod: row.paymentMethod,
      bkashTxId: row.bkashTxId || '',
      bundleId: row.bundleId,
      bundleName: row.bundleName,
      quantity: row.quantity,
      itemSubtotal: row.itemSubtotal,
      deliveryCharge: row.deliveryCharge,
      discount: row.discount,
      totalAmount: row.totalAmount,
      status: status || 'pending',
      courierName: row.courierName,
      courierTrackingCode: row.courierTrackingCode,
      createdAt: isoDate(row.createdAt),
      updatedAt: row.updatedAt ? isoDate(row.updatedAt) : undefined,
    };
    return toSnakeCase(source);
  });
  if (converted.length === 0) return;

  const { error } = await supabase.from('orders').upsert(converted, { onConflict: 'id' });
  if (error) throw new Error(`Could not migrate orders: ${error.message}`);
  console.log(`Migrated ${converted.length} orders.`);
}

const [products, combos, orders] = await Promise.all([
  loadCollection('products'),
  loadCollection('combos'),
  loadCollection('orders'),
]);

await migrateCatalog('products', products);
await migrateCatalog('combos', combos);
await migrateOrders(orders);
console.log('Firebase to Supabase migration completed.');
