import { getSupabaseClient } from '../lib/supabase';
import { DBCoupon, PlacedOrder, ShemaiBundle, ProductItem } from '../types';

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
  couponCode?: string;
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

export interface StoreDeliverySettings {
  dhakaDeliveryFee: number;
  outsideDhakaDeliveryFee: number;
}

export interface SliderImage {
  id: string;
  title: string;
  altText: string;
  caption: string;
  imageUrl: string;
  sortOrder: number;
  isActive: boolean;
}

export interface HomepageImageCard {
  id: string;
  imageUrl: string;
  altText: string;
  sortOrder: number;
  isActive: boolean;
}

export type BackendProduct = BackendCombo;
export interface SingleProduct extends ProductItem {}
export type { ProductItem };

const ORDERS_TABLE = 'orders';
const COMBOS_TABLE = 'combos';
const PRODUCTS_TABLE = 'products';
const COUPONS_TABLE = 'coupons';
const STORE_SETTINGS_TABLE = 'store_settings';
const SLIDER_IMAGES_TABLE = 'slider_images';
const HOMEPAGE_IMAGE_CARDS_TABLE = 'homepage_image_cards';
export const HOMEPAGE_IMAGE_CARD_LIMIT = 6;

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

export async function fetchCombos(): Promise<BackendCombo[]> {
  const { data, error } = await getSupabaseClient()
    .from(COMBOS_TABLE)
    .select('*')
    .order('id');
  throwOnError(error);
  return (data ?? []).map((row) => fromDatabaseRow<BackendCombo>(row));
}

export async function createCombo(combo: BackendCombo): Promise<BackendCombo> {
  const { data, error } = await getSupabaseClient()
    .from(COMBOS_TABLE)
    .insert(toDatabaseRow(combo))
    .select()
    .single();
  throwOnError(error);
  if (!data) throw new Error('Supabase did not return the created combo.');
  return fromDatabaseRow<BackendCombo>(data);
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

export async function deleteCombo(comboId: string): Promise<void> {
  const { data, error } = await getSupabaseClient()
    .from(COMBOS_TABLE)
    .delete()
    .eq('id', comboId)
    .select('id')
    .maybeSingle();
  throwOnError(error);
  if (!data) throw new Error('Combo was not deleted. Check admin permissions.');
}

export async function fetchAllProducts(): Promise<ProductItem[]> {
  const { data, error } = await getSupabaseClient()
    .from(PRODUCTS_TABLE)
    .select('*')
    .order('id');
  throwOnError(error);
  return (data ?? []).map((row) => fromDatabaseRow<ProductItem>(row));
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

export async function fetchActiveCoupons(): Promise<DBCoupon[]> {
  const { data, error } = await getSupabaseClient()
    .from(COUPONS_TABLE)
    .select('*')
    .eq('is_active', true)
    .order('code');
  throwOnError(error);
  if (!data) throw new Error('Supabase returned no coupon records.');
  return data.map((row) => fromDatabaseRow<DBCoupon>(row));
}

export async function fetchAllCoupons(): Promise<DBCoupon[]> {
  const { data, error } = await getSupabaseClient()
    .from(COUPONS_TABLE)
    .select('*')
    .order('code');
  throwOnError(error);
  if (!data) throw new Error('Supabase returned no coupon records.');
  return data.map((row) => fromDatabaseRow<DBCoupon>(row));
}

export async function createCoupon(
  coupon: Omit<DBCoupon, 'id'>,
): Promise<DBCoupon> {
  const { data, error } = await getSupabaseClient()
    .from(COUPONS_TABLE)
    .insert(toDatabaseRow({ ...coupon, code: coupon.code.trim().toUpperCase() }))
    .select()
    .single();
  throwOnError(error);
  if (!data) throw new Error('Supabase did not return the created coupon.');
  return fromDatabaseRow<DBCoupon>(data);
}

export async function updateCoupon(
  couponId: string,
  updates: Partial<DBCoupon>,
): Promise<void> {
  const { id: _id, ...allowedUpdates } = updates;
  const { error } = await getSupabaseClient()
    .from(COUPONS_TABLE)
    .update(toDatabaseRow(allowedUpdates))
    .eq('id', couponId);
  throwOnError(error);
}

export async function deleteCoupon(couponId: string): Promise<void> {
  const { error } = await getSupabaseClient()
    .from(COUPONS_TABLE)
    .delete()
    .eq('id', couponId);
  throwOnError(error);
}

export async function fetchDeliverySettings(): Promise<StoreDeliverySettings> {
  const { data, error } = await getSupabaseClient()
    .from(STORE_SETTINGS_TABLE)
    .select('dhaka_delivery_fee, outside_dhaka_delivery_fee')
    .eq('id', 'default')
    .single();
  throwOnError(error);
  if (!data) throw new Error('Supabase returned no delivery settings.');
  return fromDatabaseRow<StoreDeliverySettings>(data);
}

export async function updateDeliverySettings(
  settings: StoreDeliverySettings,
): Promise<void> {
  const { data, error } = await getSupabaseClient()
    .from(STORE_SETTINGS_TABLE)
    .update(toDatabaseRow(settings))
    .eq('id', 'default')
    .select('id')
    .maybeSingle();
  throwOnError(error);
  if (!data) throw new Error('Delivery settings were not updated. Check admin permissions.');
}

export async function fetchSliderImages(activeOnly = false): Promise<SliderImage[]> {
  let query = getSupabaseClient()
    .from(SLIDER_IMAGES_TABLE)
    .select('*')
    .order('sort_order')
    .order('created_at');
  if (activeOnly) query = query.eq('is_active', true);
  const { data, error } = await query;
  throwOnError(error);
  if (!data) throw new Error('Supabase returned no slider image records.');
  return data.map((row) => fromDatabaseRow<SliderImage>(row));
}

export async function createSliderImage(
  image: Omit<SliderImage, 'id'> & { id?: string },
): Promise<SliderImage> {
  const { data, error } = await getSupabaseClient()
    .from(SLIDER_IMAGES_TABLE)
    .insert(toDatabaseRow(image))
    .select()
    .single();
  throwOnError(error);
  if (!data) throw new Error('Supabase did not return the created slider image.');
  return fromDatabaseRow<SliderImage>(data);
}

export async function updateSliderImage(
  imageId: string,
  updates: Partial<Omit<SliderImage, 'id'>>,
): Promise<void> {
  const { data, error } = await getSupabaseClient()
    .from(SLIDER_IMAGES_TABLE)
    .update(toDatabaseRow({ ...updates, updatedAt: new Date().toISOString() }))
    .eq('id', imageId)
    .select('id')
    .maybeSingle();
  throwOnError(error);
  if (!data) throw new Error('Slider image was not updated. Check admin permissions.');
}

export async function deleteSliderImage(imageId: string): Promise<void> {
  const { data, error } = await getSupabaseClient()
    .from(SLIDER_IMAGES_TABLE)
    .delete()
    .eq('id', imageId)
    .select('id')
    .maybeSingle();
  throwOnError(error);
  if (!data) throw new Error('Slider image was not deleted. Check admin permissions.');
}

export async function fetchHomepageImageCards(activeOnly = false): Promise<HomepageImageCard[]> {
  let query = getSupabaseClient()
    .from(HOMEPAGE_IMAGE_CARDS_TABLE)
    .select('*')
    .order('sort_order')
    .order('created_at');
  if (activeOnly) query = query.eq('is_active', true);
  const { data, error } = await query;
  throwOnError(error);
  return (data ?? []).map((row) => fromDatabaseRow<HomepageImageCard>(row));
}

export async function createHomepageImageCards(
  cards: Array<Omit<HomepageImageCard, 'id'> & { id?: string }>,
): Promise<HomepageImageCard[]> {
  if (cards.length === 0) return [];
  const { data, error } = await getSupabaseClient()
    .from(HOMEPAGE_IMAGE_CARDS_TABLE)
    .insert(cards.map(toDatabaseRow))
    .select();
  throwOnError(error);
  if (!data) throw new Error('Supabase did not return the created homepage image cards.');
  return data.map((row) => fromDatabaseRow<HomepageImageCard>(row));
}

export async function updateHomepageImageCard(
  imageId: string,
  updates: Partial<Omit<HomepageImageCard, 'id'>>,
): Promise<void> {
  const { data, error } = await getSupabaseClient()
    .from(HOMEPAGE_IMAGE_CARDS_TABLE)
    .update(toDatabaseRow(updates))
    .eq('id', imageId)
    .select('id')
    .maybeSingle();
  throwOnError(error);
  if (!data) throw new Error('Homepage image card was not updated. Check admin permissions.');
}

export async function deleteHomepageImageCard(imageId: string): Promise<void> {
  const { data, error } = await getSupabaseClient()
    .from(HOMEPAGE_IMAGE_CARDS_TABLE)
    .delete()
    .eq('id', imageId)
    .select('id')
    .maybeSingle();
  throwOnError(error);
  if (!data) throw new Error('Homepage image card was not deleted. Check admin permissions.');
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
    couponCode: placedOrder.customer.couponCode,
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
    if (error.message.includes('INVALID_COUPON')) {
      throw new Error('কুপনটি আর কার্যকর নেই অথবা আপনার অর্ডারের জন্য প্রযোজ্য নয়।');
    }
    if (error.message.includes('DELIVERY_SETTINGS_NOT_CONFIGURED')) {
      throw new Error('ডেলিভারি চার্জ সেট করা নেই। Admin Dashboard থেকে চার্জ সেট করে আবার চেষ্টা করুন।');
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
