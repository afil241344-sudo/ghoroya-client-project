import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../data');
const DB_FILE = path.resolve(DATA_DIR, 'store.json');

export interface DBOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  phone: string;
  address: string;
  deliveryArea: 'dhaka' | 'outside_dhaka';
  note?: string;
  bundleId: string;
  bundleName: string;
  bundleWeight: string;
  quantity: number;
  itemSubtotal: number;
  deliveryCharge: number;
  discount: number;
  totalAmount: number;
  paymentMethod: 'cod' | 'bkash';
  bkashTxId?: string;
  couponCode?: string;
  status: 'pending' | 'confirmed' | 'printed' | 'processing' | 'packaging' | 'shipped' | 'delivered' | 'cancelled';
  courierName?: string;
  courierConsignmentId?: string;
  adminNote?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DBBundle {
  id: string;
  name: string;
  subtitle: string;
  weight: string;
  boxes: number;
  originalPrice: number;
  salePrice: number;
  savings: number;
  badge?: string;
  badgeColor?: string;
  freeDelivery: boolean;
  popular?: boolean;
  description: string;
  inStock: boolean;
}

export interface DBCoupon {
  id: string;
  code: string;
  discountType: 'fixed' | 'free_shipping';
  discountAmount: number;
  minQuantity: number;
  isActive: boolean;
}

export interface StoreData {
  orders: DBOrder[];
  bundles: DBBundle[];
  coupons: DBCoupon[];
  storeSettings: {
    storeName: string;
    phone: string;
    email: string;
    address: string;
    dhakaDeliveryFee: number;
    outsideDhakaDeliveryFee: number;
    steadfastApiKey?: string;
    steadfastSecret?: string;
    soundNotification: boolean;
  };
}

const DEFAULT_BUNDLES: DBBundle[] = [
  {
    id: 'bundle-single',
    name: '১ বক্স ট্রায়াল প্যাক',
    subtitle: 'টেস্ট ও ব্যক্তিগত ব্যবহারের জন্য আদর্শ',
    weight: '৪৫০ গ্রাম (১ বক্স)',
    boxes: 1,
    originalPrice: 550,
    salePrice: 420,
    savings: 130,
    badge: 'জনপ্রিয় ট্রায়াল',
    badgeColor: 'bg-amber-600',
    freeDelivery: false,
    description: 'খাঁটি গাওয়া ঘি, প্রিমিয়াম জাফরান ফ্লেভার এবং মুচমুচে সুস্বাদু কারিগরি তৈরি।',
    inStock: true,
  },
  {
    id: 'bundle-double',
    name: '২ বক্স ফ্যামিলি সেভার প্যাক',
    subtitle: 'সবচেয়ে বেশি বিক্রিত এবং পরিবারের পছন্দের প্যাক',
    weight: '৯০০ গ্রাম (২ বক্স)',
    boxes: 2,
    originalPrice: 1100,
    salePrice: 790,
    savings: 310,
    badge: 'সেরা অফার (Best Choice)',
    badgeColor: 'bg-emerald-700',
    freeDelivery: false,
    popular: true,
    description: 'পরিবারের সবার সাথে আনন্দ ভাগ করে নিতে সবচেয়ে জনপ্রিয় কম্বো। সেভ হবে ৩১০ টাকা!',
    inStock: true,
  },
  {
    id: 'bundle-family',
    name: '৪ বক্স গ্র্যান্ড উৎসব ধামাকা প্যাক',
    subtitle: 'সম্পূর্ণ ফ্রি ডেলিভারি + উপহার বক্স',
    weight: '১৮০০ গ্রাম (৪ বক্স)',
    boxes: 4,
    originalPrice: 2200,
    salePrice: 1490,
    savings: 710,
    badge: 'ফ্রি ডেলিভারি + মেগা সেভিংস',
    badgeColor: 'bg-rose-700',
    freeDelivery: true,
    description: 'আত্মীয়-স্বজন ও মেহমানদারির জন্য উপযুক্ত। কোনো ডেলিভারি চার্জ লাগবে না!',
    inStock: true,
  },
];

const DEFAULT_COUPONS: DBCoupon[] = [
  {
    id: 'c-1',
    code: 'EID50',
    discountType: 'fixed',
    discountAmount: 50,
    minQuantity: 1,
    isActive: true,
  },
  {
    id: 'c-2',
    code: 'FREESHIP',
    discountType: 'free_shipping',
    discountAmount: 0,
    minQuantity: 1,
    isActive: true,
  },
  {
    id: 'c-3',
    code: 'EID100',
    discountType: 'fixed',
    discountAmount: 100,
    minQuantity: 2,
    isActive: true,
  },
];

const SEED_ORDERS: DBOrder[] = [
  {
    id: 'ord-101',
    orderNumber: 'LCH-892415',
    customerName: 'তানভীর আহমেদ',
    phone: '01712345678',
    address: 'বাড়ি ১৪, রোড ৭, সেক্টর ৪, উত্তরা, ঢাকা',
    deliveryArea: 'dhaka',
    note: 'অফিস টাইমের পর ডেলিভারি দিলে ভালো হয়',
    bundleId: 'bundle-double',
    bundleName: '২ বক্স ফ্যামিলি সেভার প্যাক',
    bundleWeight: '৯০০ গ্রাম (২ বক্স)',
    quantity: 1,
    itemSubtotal: 790,
    deliveryCharge: 70,
    discount: 50,
    totalAmount: 810,
    paymentMethod: 'cod',
    couponCode: 'EID50',
    status: 'shipped',
    courierName: 'Steadfast Courier',
    courierConsignmentId: 'ST-902318',
    adminNote: 'কাস্টমারকে ফোন করে কনফার্ম করা হয়েছে। কাল দুপুর ২টায় পাবে।',
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 1).toISOString(),
  },
  {
    id: 'ord-102',
    orderNumber: 'LCH-773120',
    customerName: 'নাজনীন আক্তার',
    phone: '01898765432',
    address: 'ফ্ল্যাট ৪বি, প্রপার্টিজ হাইটস, পাঁচলাইশ, চট্টগ্রাম',
    deliveryArea: 'outside_dhaka',
    bundleId: 'bundle-family',
    bundleName: '৪ বক্স গ্র্যান্ড উৎসব ধামাকা প্যাক',
    bundleWeight: '১৮০০ গ্রাম (৪ বক্স)',
    quantity: 1,
    itemSubtotal: 1490,
    deliveryCharge: 0,
    discount: 0,
    totalAmount: 1490,
    paymentMethod: 'cod',
    status: 'packaging',
    courierName: 'Steadfast Courier',
    courierConsignmentId: 'ST-902319',
    adminNote: 'বক্স সিল্ড ও বাবল র‍্যাপ করে রেডি করা হয়েছে।',
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'ord-103',
    orderNumber: 'LCH-641209',
    customerName: 'মাহমুদুল হাসান',
    phone: '01911223344',
    address: 'বাড়ি ২০, রোড ৩, ধানমন্ডি, ঢাকা',
    deliveryArea: 'dhaka',
    bundleId: 'bundle-single',
    bundleName: '১ বক্স ট্রায়াল প্যাক',
    bundleWeight: '৪৫০ গ্রাম (১ বক্স)',
    quantity: 1,
    itemSubtotal: 420,
    deliveryCharge: 70,
    discount: 0,
    totalAmount: 490,
    paymentMethod: 'cod',
    status: 'pending',
    createdAt: new Date(Date.now() - 3600000 * 1).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 1).toISOString(),
  },
  {
    id: 'ord-104',
    orderNumber: 'LCH-512984',
    customerName: 'ডাঃ মোস্তাফিজুর রহমান',
    phone: '01755667788',
    address: 'হাউজ ১২, জিন্দাবাজার, সিলেট',
    deliveryArea: 'outside_dhaka',
    bundleId: 'bundle-double',
    bundleName: '২ বক্স ফ্যামিলি সেভার প্যাক',
    bundleWeight: '৯০০ গ্রাম (২ বক্স)',
    quantity: 2,
    itemSubtotal: 1580,
    deliveryCharge: 130,
    discount: 100,
    totalAmount: 1610,
    paymentMethod: 'bkash',
    bkashTxId: '9KJ8D72A',
    couponCode: 'EID100',
    status: 'delivered',
    courierName: 'Sundarban Courier',
    courierConsignmentId: 'SUN-44129',
    adminNote: 'পণ্য সফলভাবে কাস্টমারের হাতে পৌঁছেছে ও মূল্য পরিশোধিত।',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
];

class Database {
  private data: StoreData;

  constructor() {
    this.data = this.loadData();
  }

  private loadData(): StoreData {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const fileContent = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(fileContent);
      }
    } catch (err) {
      console.error('Error loading database file, initializing defaults:', err);
    }

    const defaultData: StoreData = {
      orders: SEED_ORDERS,
      bundles: DEFAULT_BUNDLES,
      coupons: DEFAULT_COUPONS,
      storeSettings: {
        storeName: 'প্যারামাউন্ট রয়েল ফুডস (Shahi Ghee Shemai)',
        phone: '01798-241344',
        email: 'support@paramountfoods.bd',
        address: 'ধানমন্ডি, রোড-৮/এ, ঢাকা-১২০৯',
        dhakaDeliveryFee: 70,
        outsideDhakaDeliveryFee: 130,
        steadfastApiKey: 'st_live_9a8f2bc01',
        steadfastSecret: 'st_sec_8841294',
        soundNotification: true,
      },
    };

    this.saveData(defaultData);
    return defaultData;
  }

  private saveData(data: StoreData) {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error writing database file:', err);
    }
  }

  // Orders
  getOrders(): DBOrder[] {
    return [...this.data.orders].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  getOrderById(id: string): DBOrder | undefined {
    return this.data.orders.find((o) => o.id === id || o.orderNumber === id);
  }

  createOrder(orderData: Omit<DBOrder, 'id' | 'createdAt' | 'updatedAt'>): DBOrder {
    const newOrder: DBOrder = {
      ...orderData,
      id: `ord-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.data.orders.unshift(newOrder);
    this.saveData(this.data);
    return newOrder;
  }

  updateOrderStatus(
    id: string,
    status: DBOrder['status'],
    courierConsignmentId?: string,
    courierName?: string
  ): DBOrder | null {
    const order = this.data.orders.find((o) => o.id === id || o.orderNumber === id);
    if (!order) return null;

    order.status = status;
    order.updatedAt = new Date().toISOString();
    if (courierConsignmentId) order.courierConsignmentId = courierConsignmentId;
    if (courierName) order.courierName = courierName;

    this.saveData(this.data);
    return order;
  }

  updateOrderNotes(id: string, adminNote: string): DBOrder | null {
    const order = this.data.orders.find((o) => o.id === id || o.orderNumber === id);
    if (!order) return null;

    order.adminNote = adminNote;
    order.updatedAt = new Date().toISOString();
    this.saveData(this.data);
    return order;
  }

  deleteOrder(id: string): boolean {
    const index = this.data.orders.findIndex((o) => o.id === id || o.orderNumber === id);
    if (index === -1) return false;

    this.data.orders.splice(index, 1);
    this.saveData(this.data);
    return true;
  }

  // Bundles
  getBundles(): DBBundle[] {
    return this.data.bundles;
  }

  updateBundle(id: string, updates: Partial<DBBundle>): DBBundle | null {
    const bundle = this.data.bundles.find((b) => b.id === id);
    if (!bundle) return null;

    Object.assign(bundle, updates);
    this.saveData(this.data);
    return bundle;
  }

  // Coupons
  getCoupons(): DBCoupon[] {
    return this.data.coupons;
  }

  createCoupon(coupon: Omit<DBCoupon, 'id'>): DBCoupon {
    const newCoupon: DBCoupon = {
      ...coupon,
      id: `c-${Date.now()}`,
    };
    this.data.coupons.push(newCoupon);
    this.saveData(this.data);
    return newCoupon;
  }

  deleteCoupon(id: string): boolean {
    const idx = this.data.coupons.findIndex((c) => c.id === id || c.code === id);
    if (idx === -1) return false;
    this.data.coupons.splice(idx, 1);
    this.saveData(this.data);
    return true;
  }

  // Settings & Analytics
  getSettings() {
    return this.data.storeSettings;
  }

  updateSettings(settings: Partial<StoreData['storeSettings']>) {
    Object.assign(this.data.storeSettings, settings);
    this.saveData(this.data);
    return this.data.storeSettings;
  }

  getStats() {
    const orders = this.data.orders;
    const totalOrders = orders.length;
    const totalRevenue = orders
      .filter((o) => o.status !== 'cancelled')
      .reduce((acc, curr) => acc + curr.totalAmount, 0);

    const todayStr = new Date().toISOString().slice(0, 10);
    const todayOrders = orders.filter((o) => o.createdAt.startsWith(todayStr)).length;
    const pendingOrders = orders.filter((o) => o.status === 'pending').length;
    const packagingOrders = orders.filter((o) => o.status === 'packaging').length;
    const shippedOrders = orders.filter((o) => o.status === 'shipped').length;
    const deliveredOrders = orders.filter((o) => o.status === 'delivered').length;
    const cancelledOrders = orders.filter((o) => o.status === 'cancelled').length;

    const dhakaOrders = orders.filter((o) => o.deliveryArea === 'dhaka').length;
    const outsideDhakaOrders = orders.filter((o) => o.deliveryArea === 'outside_dhaka').length;

    return {
      totalOrders,
      totalRevenue,
      todayOrders,
      pendingOrders,
      packagingOrders,
      shippedOrders,
      deliveredOrders,
      cancelledOrders,
      dhakaOrders,
      outsideDhakaOrders,
    };
  }
}

export const db = new Database();
