import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
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
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  courierName?: string;
  courierTrackingCode?: string;
  createdAt: string;
  updatedAt?: string;
}

// 1. Combo Table Model (Converted from existing bundle table)
export interface BackendCombo extends ShemaiBundle {
  stockCount: number;
  inStock: boolean;
  includedProductIds?: string;
}

// Backward-compatible alias
export type BackendProduct = BackendCombo;

// 2. Product Name Table Model (Base inventory catalog)
export interface SingleProduct extends ProductItem {}
export type { ProductItem };

const ORDERS_COLLECTION = 'orders';
const COMBOS_COLLECTION = 'combos';
const PRODUCTS_COLLECTION = 'products';

// Default base products catalog
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

// ==========================================
// A. COMBOS TABLE OPERATIONS (কম্বো টেবিল)
// ==========================================

export async function seedInitialCombosIfEmpty(): Promise<BackendCombo[]> {
  try {
    const combosRef = collection(db, COMBOS_COLLECTION);
    const snapshot = await getDocs(combosRef);

    if (!snapshot.empty) {
      const items: BackendCombo[] = [];
      snapshot.forEach((docSnap) => {
        items.push({ id: docSnap.id, ...(docSnap.data() as any) });
      });
      localStorage.setItem('shemai_combos_cache', JSON.stringify(items));
      return items;
    }

    // Seed defaults into combos collection
    const initialList: BackendCombo[] = SHEMAI_BUNDLES.map((bundle, index) => ({
      ...bundle,
      stockCount: index === 0 ? 120 : index === 1 ? 85 : 40,
      inStock: true,
      includedProductIds: index === 0 ? 'prod-shemai-450 (1x)' : index === 1 ? 'prod-shemai-450 (2x)' : 'prod-shemai-450 (4x)',
    }));

    for (const combo of initialList) {
      await setDoc(doc(db, COMBOS_COLLECTION, combo.id), combo);
    }

    localStorage.setItem('shemai_combos_cache', JSON.stringify(initialList));
    return initialList;
  } catch (error) {
    console.warn('Could not seed/fetch Firestore combos, using defaults:', error);
    const fallback = SHEMAI_BUNDLES.map((bundle, index) => ({
      ...bundle,
      stockCount: index === 0 ? 120 : index === 1 ? 85 : 40,
      inStock: true,
    }));
    return fallback;
  }
}

export async function fetchCombos(): Promise<BackendCombo[]> {
  try {
    const combosRef = collection(db, COMBOS_COLLECTION);
    const snapshot = await getDocs(combosRef);
    if (!snapshot.empty) {
      const items: BackendCombo[] = [];
      snapshot.forEach((d) => items.push({ id: d.id, ...(d.data() as any) }));
      localStorage.setItem('shemai_combos_cache', JSON.stringify(items));
      return items;
    }
  } catch (err) {
    console.warn('Failed to fetch combos from Firestore:', err);
  }

  return seedInitialCombosIfEmpty();
}

export async function updateCombo(
  comboId: string,
  updates: Partial<BackendCombo>
): Promise<void> {
  try {
    const comboDocRef = doc(db, COMBOS_COLLECTION, comboId);
    await updateDoc(comboDocRef, updates);
  } catch (err) {
    console.warn('Failed to update combo in Firestore:', err);
  }

  try {
    const stored = localStorage.getItem('shemai_combos_cache');
    if (stored) {
      const list: BackendCombo[] = JSON.parse(stored);
      const updated = list.map((c) => (c.id === comboId ? { ...c, ...updates } : c));
      localStorage.setItem('shemai_combos_cache', JSON.stringify(updated));
    }
  } catch {
    // ignore
  }
}

// Backward-compatible alias for existing components
export const seedInitialProductsIfEmpty = seedInitialCombosIfEmpty;
export const updateProduct = updateCombo;


// ==========================================
// B. PRODUCTS TABLE OPERATIONS (প্রোডাক্ট নাম টেবিল)
// ==========================================

export async function seedInitialProductsCatalogIfEmpty(): Promise<ProductItem[]> {
  try {
    const prodsRef = collection(db, PRODUCTS_COLLECTION);
    const snapshot = await getDocs(prodsRef);

    if (!snapshot.empty) {
      const items: ProductItem[] = [];
      snapshot.forEach((docSnap) => {
        items.push({ id: docSnap.id, ...(docSnap.data() as any) });
      });
      localStorage.setItem('shemai_single_products_cache', JSON.stringify(items));
      return items;
    }

    // Seed defaults into products collection
    for (const prod of DEFAULT_BASE_PRODUCTS) {
      await setDoc(doc(db, PRODUCTS_COLLECTION, prod.id), prod);
    }

    localStorage.setItem('shemai_single_products_cache', JSON.stringify(DEFAULT_BASE_PRODUCTS));
    return DEFAULT_BASE_PRODUCTS;
  } catch (error) {
    console.warn('Could not seed products catalog in Firestore, using defaults:', error);
    return DEFAULT_BASE_PRODUCTS;
  }
}

export async function fetchAllProducts(): Promise<ProductItem[]> {
  try {
    const prodsRef = collection(db, PRODUCTS_COLLECTION);
    const snapshot = await getDocs(prodsRef);
    if (!snapshot.empty) {
      const items: ProductItem[] = [];
      snapshot.forEach((d) => items.push({ id: d.id, ...(d.data() as any) }));
      localStorage.setItem('shemai_single_products_cache', JSON.stringify(items));
      return items;
    }
  } catch (err) {
    console.warn('Failed to fetch products from Firestore:', err);
  }

  const stored = localStorage.getItem('shemai_single_products_cache');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // ignore
    }
  }
  return seedInitialProductsCatalogIfEmpty();
}

export async function createProductItem(
  productData: Omit<ProductItem, 'id'>
): Promise<ProductItem> {
  const newId = `prod-${Date.now()}`;
  const newProduct: ProductItem = {
    ...productData,
    id: newId,
    createdAt: new Date().toISOString(),
  };

  try {
    await setDoc(doc(db, PRODUCTS_COLLECTION, newId), newProduct);
  } catch (err) {
    console.warn('Failed to create product in Firestore:', err);
  }

  const current = await fetchAllProducts();
  const updated = [newProduct, ...current];
  localStorage.setItem('shemai_single_products_cache', JSON.stringify(updated));
  return newProduct;
}

export async function updateProductItem(
  productId: string,
  updates: Partial<ProductItem>
): Promise<void> {
  try {
    const prodDocRef = doc(db, PRODUCTS_COLLECTION, productId);
    await updateDoc(prodDocRef, updates);
  } catch (err) {
    console.warn('Failed to update product item in Firestore:', err);
  }

  const current = await fetchAllProducts();
  const updated = current.map((p) => (p.id === productId ? { ...p, ...updates } : p));
  localStorage.setItem('shemai_single_products_cache', JSON.stringify(updated));
}

export async function deleteProductItem(productId: string): Promise<void> {
  try {
    const prodDocRef = doc(db, PRODUCTS_COLLECTION, productId);
    await deleteDoc(prodDocRef);
  } catch (err) {
    console.warn('Failed to delete product item from Firestore:', err);
  }

  const current = await fetchAllProducts();
  const updated = current.filter((p) => p.id !== productId);
  localStorage.setItem('shemai_single_products_cache', JSON.stringify(updated));
}


// ==========================================
// C. ORDERS TABLE OPERATIONS (অর্ডার টেবিল)
// ==========================================

export async function saveOrderToFirestore(placedOrder: PlacedOrder): Promise<BackendOrder> {
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

  try {
    const orderDocRef = doc(db, ORDERS_COLLECTION, placedOrder.orderId);
    await setDoc(orderDocRef, {
      ...orderRecord,
      timestamp: serverTimestamp(),
    });
  } catch (err) {
    console.error('Error saving order to Firestore:', err);
  }

  saveLocalOrder(orderRecord);
  return orderRecord;
}

export async function fetchAllOrders(): Promise<BackendOrder[]> {
  try {
    const ordersRef = collection(db, ORDERS_COLLECTION);
    const q = query(ordersRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    const orders: BackendOrder[] = [];
    snapshot.forEach((d) => {
      orders.push({ id: d.id, ...(d.data() as any) });
    });

    if (orders.length > 0) {
      localStorage.setItem('shemai_orders_cache', JSON.stringify(orders));
      return orders;
    }
  } catch (err) {
    console.warn('Firestore fetch failed, checking local cache:', err);
  }

  return getLocalOrders();
}

export function subscribeToOrders(
  onUpdate: (orders: BackendOrder[]) => void,
  onError?: (err: any) => void
): () => void {
  try {
    const ordersRef = collection(db, ORDERS_COLLECTION);
    const q = query(ordersRef, orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const orders: BackendOrder[] = [];
        snapshot.forEach((d) => {
          orders.push({ id: d.id, ...(d.data() as any) });
        });
        if (orders.length > 0) {
          localStorage.setItem('shemai_orders_cache', JSON.stringify(orders));
          onUpdate(orders);
        } else {
          onUpdate(getLocalOrders());
        }
      },
      (err) => {
        console.warn('Firestore onSnapshot listener error, falling back to local orders:', err);
        if (onError) onError(err);
        onUpdate(getLocalOrders());
      }
    );
    return unsubscribe;
  } catch (err) {
    console.warn('Failed to start Firestore onSnapshot listener:', err);
    onUpdate(getLocalOrders());
    return () => {};
  }
}

export async function updateOrderStatus(
  orderId: string,
  updates: Partial<BackendOrder>
): Promise<void> {
  try {
    const orderDocRef = doc(db, ORDERS_COLLECTION, orderId);
    await updateDoc(orderDocRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('Failed to update Firestore order, updating local cache:', err);
  }

  const local = getLocalOrders();
  const updated = local.map((o) => (o.orderId === orderId ? { ...o, ...updates } : o));
  localStorage.setItem('shemai_orders_cache', JSON.stringify(updated));
}

export async function deleteOrder(orderId: string): Promise<void> {
  try {
    const orderDocRef = doc(db, ORDERS_COLLECTION, orderId);
    await deleteDoc(orderDocRef);
  } catch (err) {
    console.warn('Failed to delete order from Firestore:', err);
  }

  const local = getLocalOrders().filter((o) => o.orderId !== orderId);
  localStorage.setItem('shemai_orders_cache', JSON.stringify(local));
}

function getLocalOrders(): BackendOrder[] {
  try {
    const stored = localStorage.getItem('shemai_orders_cache');
    if (stored) return JSON.parse(stored);
  } catch {
    // ignore
  }

  const sampleOrders: BackendOrder[] = [
    {
      id: 'LCH-849201',
      orderId: 'LCH-849201',
      customerName: 'তানভীর আহমেদ',
      customerPhone: '01712998877',
      customerAddress: 'বাসা ৪২, রোড ৭, সেক্টর ৪, উত্তরা, ঢাকা',
      deliveryArea: 'dhaka',
      note: 'বিকেলে ডেলিভারি দিলে সুবিধা হয়',
      paymentMethod: 'cod',
      bundleId: 'bundle-double',
      bundleName: '২ বক্স ফ্যামিলি সেভার প্যাক',
      quantity: 1,
      itemSubtotal: 790,
      deliveryCharge: 70,
      discount: 0,
      totalAmount: 860,
      status: 'processing',
      courierName: 'Steadfast Courier',
      courierTrackingCode: 'ST-948271',
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    },
    {
      id: 'LCH-719324',
      orderId: 'LCH-719324',
      customerName: 'নাজনীন সুলতানা',
      customerPhone: '01823456789',
      customerAddress: 'হোল্ডিং ১২, কাতালগঞ্জ, পাঁচলাইশ, চট্টগ্রাম',
      deliveryArea: 'outside_dhaka',
      note: '',
      paymentMethod: 'bkash',
      bkashTxId: 'BK9283AX7',
      bundleId: 'bundle-family',
      bundleName: '৪ বক্স গ্র্যান্ড উৎসব ধামাকা প্যাক',
      quantity: 1,
      itemSubtotal: 1490,
      deliveryCharge: 0,
      discount: 50,
      totalAmount: 1440,
      status: 'shipped',
      courierName: 'Sundarban Courier',
      courierTrackingCode: 'SD-83921',
      createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    },
    {
      id: 'LCH-618492',
      orderId: 'LCH-618492',
      customerName: 'ডাঃ মোস্তাফিজুর রহমান',
      customerPhone: '01911223344',
      customerAddress: 'হাউজ ১৭, রোড ৩, ধানমন্ডি, ঢাকা',
      deliveryArea: 'dhaka',
      note: '',
      paymentMethod: 'cod',
      bundleId: 'bundle-single',
      bundleName: '১ বক্স ট্রায়াল প্যাক',
      quantity: 2,
      itemSubtotal: 840,
      deliveryCharge: 70,
      discount: 0,
      totalAmount: 910,
      status: 'delivered',
      courierName: 'Steadfast Courier',
      courierTrackingCode: 'ST-829103',
      createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    },
  ];

  localStorage.setItem('shemai_orders_cache', JSON.stringify(sampleOrders));
  return sampleOrders;
}

function saveLocalOrder(order: BackendOrder) {
  const current = getLocalOrders();
  const exists = current.some((o) => o.orderId === order.orderId);
  if (!exists) {
    const updated = [order, ...current];
    localStorage.setItem('shemai_orders_cache', JSON.stringify(updated));
  }
}
