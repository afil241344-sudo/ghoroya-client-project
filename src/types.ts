export interface ShemaiBundle {
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
  inStock?: boolean;
  stockCount?: number;
  includedProductIds?: string;
  imageUrl?: string;
}

export type ShemaiCombo = ShemaiBundle;

export interface ProductItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  unitWeight: string;
  costPrice: number;
  regularPrice: number;
  stockQuantity: number;
  inStock: boolean;
  description: string;
  imageUrl?: string;
  createdAt?: string;
}

export interface CustomerReview {
  id: string;
  author: string;
  location: string;
  rating: number;
  date: string;
  verified: boolean;
  comment: string;
  orderType: string;
}

export interface OrderFormData {
  fullName: string;
  phone: string;
  address: string;
  deliveryArea: 'dhaka' | 'outside_dhaka';
  note?: string;
  paymentMethod: 'cod' | 'bkash';
  bkashTxId?: string;
  bundleId: string;
  quantity: number;
  couponCode?: string;
}

export interface PlacedOrder {
  orderId: string;
  orderDate: string;
  customer: OrderFormData;
  bundle: ShemaiBundle;
  quantity: number;
  itemSubtotal: number;
  deliveryCharge: number;
  discount: number;
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'printed' | 'processing' | 'packaging' | 'shipped' | 'delivered' | 'cancelled';
  courierName?: string;
  courierConsignmentId?: string;
  adminNote?: string;
}

export interface AdminStats {
  totalOrders: number;
  totalRevenue: number;
  todayOrders: number;
  pendingOrders: number;
  packagingOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  dhakaOrders: number;
  outsideDhakaOrders: number;
}

export interface DBCoupon {
  id: string;
  code: string;
  discountType: 'fixed' | 'free_shipping';
  discountAmount: number;
  minQuantity: number;
  isActive: boolean;
}

export interface LiveSalesNotificationItem {
  id: string;
  name: string;
  location: string;
  bundleTitle: string;
  timeAgo: string;
}
