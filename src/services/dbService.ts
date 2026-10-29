import { getSupabaseClient } from '../lib/supabase';
import { PlacedOrder, ShemaiBundle, ProductItem } from '../types';
import { SHEMAI_BUNDLES } from '../data/shemaiData';

export interface BackendOrder {
  id: string;
  orderId: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  deliveryArea: 'dhaka' | 'outside_dhaka';
  note?: string;
  paymentMethod: 'cod' | 'bkash';
  bkashTxId?: string;
  bundleId: string;
  bundleName: string;
  quantity: number;
  itemSubtotal: number;
  deliveryCharge: number;
  discount: number;
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'printed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  courierName?: string;
  courierTrackingCode?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface BackendCombo extends ShemaiBundle {
  stockCount: number;
  inStock: boolean;
  includedProductIds?: string;
}

export type BackendProduct = BackendCombo;
export interface SingleProduct extends ProductItem {}
export type { ProductItem };

const ORDERS_TABLE = 'orders';
const COMBOS_TABLE = 'combos';
const PRODUCTS_TABLE = 'products';

export const DEFAULT_BASE_PRODUCTS: ProductItem[] = [
  {
    id: 'prod-shemai-450',
    name: 'শাহী গাওয়া ঘিয়ে ভাজা লাচ্ছা সেমাই (৪৫০ গ্রাম বক্স)',
    sku: 'LCH-SHM-450',
    category: 'লাচ্ছা সেমাই',
    unitWeight: '৪৫০ গ্রাম',
    costPrice: 280,
    regularPrice: 420,
    stockQuantity: 280,
    inStock: true,
    description: 'সিরাজগঞ্জের খাঁটি গাওয়া ঘিয়ে ভাজা প্রিমিয়াম মুচমুচে সোনালী সেমাই। কোনো ডালডা নেই।',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-ghee-250',
    name: 'সিরাজগঞ্জের খাঁটি গাওয়া ঘি জার (২৫০ গ্রাম)',
    sku: 'GHEE-JAR-250',
    category: 'গাওয়া ঘি',
    unitWeight: '২৫০ গ্রাম',
    costPrice: 320,
    regularPrice: 480,
    stockQuantity: 95,
    inStock: true,
    description: 'দেশি গাভীর খাঁটি দুধের সর থেকে ঐতিহ্যবাহী নিয়মে প্রস্তুতকৃত সুঘ্রাণযুক্ত গাওয়া ঘি।',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-topping-nuts',
    name: 'স্পেশাল পেস্তা, কাঠবাদাম ও জাফরান টপিং (১০০ গ্রাম)',
    sku: 'TOP-NUT-100',
    category: 'টপিং ও বাদাম',
    unitWeight: '১০০ গ্রাম',
    costPrice: 150,
    regularPrice: 240,
    stockQuantity: 140,
    inStock: true,
    description: 'আসল ইরানি জাফরান, পেস্তা ও কাঠবাদাম স্লাইসের রাজকীয় ব্লেন্ড যা সেমাইয়ের স্বাদ দ্বিগুণ করে।',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-kismis-gold',
    name: 'প্রিমিয়াম গোল্ডেন কিশমিশ প্যাক (১৫০ গ্রাম)',
    sku: 'KSM-GLD-150',
    category: 'ড্রাই ফ্রুটস',
    unitWeight: '১৫০ গ্রাম',
    costPrice: 110,
    regularPrice: 180,
    stockQuantity: 110,
    inStock: true,
    description: 'স্বাদ ও আকারে বড় মিষ্টি বাছাইকৃত গোল্ডেন কিশমিশ।',
    createdAt: new Date().toISOString(),
  },
];

const DEFAULT_COMBOS: BackendCombo[] = SHEMAI_BUNDLES.map((bundle, index) => ({
  ...bundle,
  stockCount: [120, 85, 40][index] ?? 40,
  inStock: true,
  includedProductIds: `prod-shemai-450 (${[1, 2, 4][index] ?? 1}x)`,
}));

export class InsufficientStockError extends Error {
  constructor(message = 'এই পণ্যের পর্যাপ্ত স্টক নেই।') {
    super(message);
    this.name = 'InsufficientStockError';
  }
}

function toDatabaseRow<T extends object>(record: T): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(record)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => [key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`), value]),
  );
}

function fromDatabaseRow<T>(record: Record<string, unknown>): T {
  return Object.fromEntries(
    Object.entries(record).map(([key, value]) => [
      key.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase()),
      value,
    ]),
  ) as T;
}

function throwOnError(error: { message: string } | null): void {
  if (error) throw new Error(error.message);
}

export async function seedInitialCombosIfEmpty(): Promise<BackendCombo[]> {
  const { data, error } = await getSupabaseClient()
    .from(COMBOS_TABLE)
    .select('*')
    .order('id');
  throwOnError(error);
  if (!data) throw new Error('Supabase returned no combo records.');
  if (data.length > 0) return data.map((row) => fromDatabaseRow<BackendCombo>(row));
  return DEFAULT_COMBOS;
}

export async function fetchCombos(): Promise<BackendCombo[]> {
  return seedInitialCombosIfEmpty();
}

export async function updateCombo(
  comboId: string,
  updates: Partial<BackendCombo>,
): Promise<void> {
  const { error } = await getSupabaseClient()
    .from(COMBOS_TABLE)
    .update(toDatabaseRow(updates))
    .eq('id', comboId);
  throwOnError(error);
}

export const seedInitialProductsIfEmpty = seedInitialCombosIfEmpty;
export const updateProduct = updateCombo;

export async function seedInitialProductsCatalogIfEmpty(): Promise<ProductItem[]> {
  const { data, error } = await getSupabaseClient()
    .from(PRODUCTS_TABLE)
    .select('*')
    .order('id');
  throwOnError(error);
  if (!data) throw new Error('Supabase returned no product records.');
  if (data.length > 0) return data.map((row) => fromDatabaseRow<ProductItem>(row));
  return DEFAULT_BASE_PRODUCTS;
}

export async function fetchAllProducts(): Promise<ProductItem[]> {
  return seedInitialProductsCatalogIfEmpty();
}

export async function createProductItem(
  productData: Omit<ProductItem, 'id'>,
): Promise<ProductItem> {
  const product: ProductItem = {
    ...productData,
    id: `prod-${crypto.randomUUID()}`,
    createdAt: new Date().toISOString(),
  };
  const { data, error } = await getSupabaseClient()
    .from(PRODUCTS_TABLE)
    .insert(toDatabaseRow(product))
    .select()
    .single();
  throwOnError(error);
  if (!data) throw new Error('Supabase did not return the created product.');
  return fromDatabaseRow<ProductItem>(data);
}

export async function updateProductItem(
  productId: string,
  updates: Partial<ProductItem>,
): Promise<void> {
  const { error } = await getSupabaseClient()
    .from(PRODUCTS_TABLE)
    .update(toDatabaseRow(updates))
    .eq('id', productId);
  throwOnError(error);
}

export async function deleteProductItem(productId: string): Promise<void> {
  const { error } = await getSupabaseClient()
    .from(PRODUCTS_TABLE)
    .delete()
    .eq('id', productId);
  throwOnError(error);
}

export async function saveOrderToSupabase(placedOrder: PlacedOrder): Promise<BackendOrder> {
  const orderRecord: BackendOrder = {
    id: placedOrder.orderId,
    orderId: placedOrder.orderId,
    customerName: placedOrder.customer.fullName,
    customerPhone: placedOrder.customer.phone,
    customerAddress: placedOrder.customer.address,
    deliveryArea: placedOrder.customer.deliveryArea,
    note: placedOrder.customer.note || '',
    paymentMethod: placedOrder.customer.paymentMethod,
    bkashTxId: placedOrder.customer.bkashTxId || '',
    bundleId: placedOrder.bundle.id,
    bundleName: placedOrder.bundle.name,
    quantity: placedOrder.quantity,
    itemSubtotal: placedOrder.itemSubtotal,
    deliveryCharge: placedOrder.deliveryCharge,
    discount: placedOrder.discount,
    totalAmount: placedOrder.totalAmount,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  const { data, error } = await getSupabaseClient().rpc('place_order_with_stock', {
    order_data: toDatabaseRow(orderRecord),
  });
  if (error) {
    if (error.message.includes('INSUFFICIENT_STOCK')) {
      throw new InsufficientStockError();
    }
    if (error.message.includes('PRODUCT_NOT_FOUND')) {
      throw new Error('পণ্যটি আর পাওয়া যাচ্ছে না। পেজ রিফ্রেশ করে আবার চেষ্টা করুন।');
    }
    throw new Error(error.message);
  }
  if (!data) throw new Error('Supabase did not return the created order.');
  return fromDatabaseRow<BackendOrder>(data as Record<string, unknown>);
}

export async function fetchAllOrders(): Promise<BackendOrder[]> {
  const { data, error } = await getSupabaseClient()
    .from(ORDERS_TABLE)
    .select('*')
    .order('created_at', { ascending: false });
  throwOnError(error);
  if (!data) throw new Error('Supabase returned no order records.');
  return data.map((row) => fromDatabaseRow<BackendOrder>(row));
}

export function subscribeToOrders(
  onUpdate: (orders: BackendOrder[]) => void,
  onError?: (error: Error) => void,
): () => void {
  const supabase = getSupabaseClient();
  const refreshOrders = () => {
    void fetchAllOrders().then(onUpdate).catch((error: unknown) => {
      onError?.(error instanceof Error ? error : new Error(String(error)));
    });
  };
  const channel = supabase
    .channel('admin-orders')
    .on('postgres_changes', { event: '*', schema: 'public', table: ORDERS_TABLE }, refreshOrders)
    .subscribe((status, error) => {
      if (error) onError?.(error);
      if (status === 'SUBSCRIBED') refreshOrders();
    });
  return () => {
    void supabase.removeChannel(channel);
  };
}

export async function updateOrderStatus(
  orderId: string,
  updates: Partial<BackendOrder>,
): Promise<void> {
  const { id: _id, orderId: _orderId, createdAt: _createdAt, ...allowedUpdates } = updates;
  const { data, error } = await getSupabaseClient()
    .from(ORDERS_TABLE)
    .update({
      ...toDatabaseRow(allowedUpdates),
      updated_at: new Date().toISOString(),
    })
    .eq('order_id', orderId)
    .select('order_id')
    .maybeSingle();
  throwOnError(error);
  if (!data) throw new Error(`Order ${orderId} was not updated. Check admin permissions and order ID.`);
}

export async function deleteOrder(orderId: string): Promise<void> {
  const { error } = await getSupabaseClient()
    .from(ORDERS_TABLE)
    .delete()
    .eq('order_id', orderId);
  throwOnError(error);
}
