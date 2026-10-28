import { PlacedOrder, AdminStats, ShemaiBundle, DBCoupon } from '../types';

export const api = {
  // Orders
  async getOrders(status?: string, search?: string): Promise<PlacedOrder[]> {
    try {
      const params = new URLSearchParams();
      if (status && status !== 'all') params.append('status', status);
      if (search) params.append('search', search);

      const res = await fetch(`/api/orders?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch orders');
      const data = await res.json();
      return (data.orders || []).map((o: any) => ({
        orderId: o.orderNumber || o.id,
        orderDate: new Date(o.createdAt).toLocaleString('bn-BD', {
          dateStyle: 'medium',
          timeStyle: 'short',
        }),
        customer: {
          fullName: o.customerName,
          phone: o.phone,
          address: o.address,
          deliveryArea: o.deliveryArea,
          note: o.note,
          paymentMethod: o.paymentMethod,
          bkashTxId: o.bkashTxId,
          bundleId: o.bundleId,
          quantity: o.quantity,
          couponCode: o.couponCode,
        },
        bundle: {
          id: o.bundleId,
          name: o.bundleName,
          subtitle: '',
          weight: o.bundleWeight,
          boxes: 1,
          originalPrice: o.itemSubtotal,
          salePrice: o.itemSubtotal / o.quantity,
          savings: 0,
          freeDelivery: o.deliveryCharge === 0,
          description: '',
        },
        quantity: o.quantity,
        itemSubtotal: o.itemSubtotal,
        deliveryCharge: o.deliveryCharge,
        discount: o.discount,
        totalAmount: o.totalAmount,
        status: o.status,
        courierName: o.courierName,
        courierConsignmentId: o.courierConsignmentId,
        adminNote: o.adminNote,
      }));
    } catch (err) {
      console.error('API getOrders error:', err);
      return [];
    }
  },

  async createOrder(payload: any): Promise<PlacedOrder> {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: payload.fullName,
        phone: payload.phone,
        address: payload.address,
        deliveryArea: payload.deliveryArea,
        note: payload.note,
        bundleId: payload.bundleId,
        quantity: payload.quantity,
        paymentMethod: payload.paymentMethod,
        bkashTxId: payload.bkashTxId,
        couponCode: payload.couponCode,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to place order');
    }

    const data = await res.json();
    const o = data.order;
    return {
      orderId: o.orderNumber,
      orderDate: new Date(o.createdAt).toLocaleString('bn-BD', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }),
      customer: payload,
      bundle: {
        id: o.bundleId,
        name: o.bundleName,
        subtitle: '',
        weight: o.bundleWeight,
        boxes: 1,
        originalPrice: o.itemSubtotal,
        salePrice: o.itemSubtotal / o.quantity,
        savings: 0,
        freeDelivery: o.deliveryCharge === 0,
        description: '',
      },
      quantity: o.quantity,
      itemSubtotal: o.itemSubtotal,
      deliveryCharge: o.deliveryCharge,
      discount: o.discount,
      totalAmount: o.totalAmount,
      status: o.status,
    };
  },

  async updateOrderStatus(
    orderId: string,
    status: string,
    courierConsignmentId?: string,
    courierName?: string
  ): Promise<boolean> {
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, courierConsignmentId, courierName }),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async updateOrderNotes(orderId: string, adminNote: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/orders/${orderId}/notes`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminNote }),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async deleteOrder(orderId: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'DELETE',
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async dispatchCourier(orderId: string, courierService: string): Promise<{ success: boolean; consignmentId?: string }> {
    try {
      const res = await fetch('/api/courier/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, courierService }),
      });
      return await res.json();
    } catch (err: any) {
      return { success: false };
    }
  },

  // Stats
  async getStats(): Promise<AdminStats> {
    try {
      const res = await fetch('/api/admin/stats');
      if (!res.ok) throw new Error('Failed to fetch stats');
      const data = await res.json();
      return data.stats;
    } catch {
      return {
        totalOrders: 0,
        totalRevenue: 0,
        todayOrders: 0,
        pendingOrders: 0,
        packagingOrders: 0,
        shippedOrders: 0,
        deliveredOrders: 0,
        cancelledOrders: 0,
        dhakaOrders: 0,
        outsideDhakaOrders: 0,
      };
    }
  },

  // Bundles
  async getBundles(): Promise<ShemaiBundle[]> {
    try {
      const res = await fetch('/api/bundles');
      if (!res.ok) throw new Error('Failed to fetch bundles');
      const data = await res.json();
      return data.bundles;
    } catch {
      return [];
    }
  },

  async updateBundle(id: string, updates: Partial<ShemaiBundle>): Promise<boolean> {
    try {
      const res = await fetch(`/api/bundles/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  // Coupons
  async getCoupons(): Promise<DBCoupon[]> {
    try {
      const res = await fetch('/api/coupons');
      if (!res.ok) throw new Error('Failed to fetch coupons');
      const data = await res.json();
      return data.coupons;
    } catch {
      return [];
    }
  },

  async createCoupon(coupon: any): Promise<boolean> {
    try {
      const res = await fetch('/api/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(coupon),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async deleteCoupon(id: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/coupons/${id}`, {
        method: 'DELETE',
      });
      return res.ok;
    } catch {
      return false;
    }
  },
};
