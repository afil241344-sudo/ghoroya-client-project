import { Router, Request, Response } from 'express';
import { db, DBOrder } from './db.js';

export const apiRouter = Router();

// 1. Orders Endpoints
apiRouter.get('/orders', (req: Request, res: Response) => {
  try {
    const { status, search } = req.query;
    let orders = db.getOrders();

    if (status && status !== 'all') {
      orders = orders.filter((o) => o.status === status);
    }

    if (search && typeof search === 'string') {
      const q = search.toLowerCase().trim();
      orders = orders.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(q) ||
          o.customerName.toLowerCase().includes(q) ||
          o.phone.includes(q) ||
          o.address.toLowerCase().includes(q)
      );
    }

    res.json({ success: true, orders, total: orders.length });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.get('/orders/:id', (req: Request, res: Response) => {
  try {
    const order = db.getOrderById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }
    res.json({ success: true, order });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.post('/orders', (req: Request, res: Response) => {
  try {
    const {
      customerName,
      phone,
      address,
      deliveryArea,
      note,
      bundleId,
      quantity,
      paymentMethod,
      bkashTxId,
      couponCode,
    } = req.body;

    if (!customerName || !phone || !address || !bundleId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required order fields (customerName, phone, address, bundleId)',
      });
    }

    const bundles = db.getBundles();
    const bundle = bundles.find((b) => b.id === bundleId) || bundles[0];
    const qty = Math.max(1, Number(quantity) || 1);
    const itemSubtotal = bundle.salePrice * qty;

    // Delivery calculation
    let deliveryCharge = 0;
    if (bundle.freeDelivery || couponCode === 'FREESHIP') {
      deliveryCharge = 0;
    } else {
      const settings = db.getSettings();
      if (deliveryArea === 'dhaka') {
        deliveryCharge = settings.dhakaDeliveryFee;
      } else if (deliveryArea === 'outside_dhaka') {
        deliveryCharge = settings.outsideDhakaDeliveryFee;
      } else {
        return res.status(400).json({ success: false, error: 'Invalid delivery area' });
      }
    }

    // Coupon calculation
    let discount = 0;
    if (couponCode === 'EID50') {
      discount = 50;
    } else if (couponCode === 'EID100' && qty >= 2) {
      discount = 100;
    }

    const totalAmount = Math.max(0, itemSubtotal + deliveryCharge - discount);
    const orderNumber = `LCH-${Math.floor(100000 + Math.random() * 900000)}`;

    const newOrder = db.createOrder({
      orderNumber,
      customerName: customerName.trim(),
      phone: phone.trim(),
      address: address.trim(),
      deliveryArea: deliveryArea || 'dhaka',
      note: note ? note.trim() : undefined,
      bundleId: bundle.id,
      bundleName: bundle.name,
      bundleWeight: bundle.weight,
      quantity: qty,
      itemSubtotal,
      deliveryCharge,
      discount,
      totalAmount,
      paymentMethod: paymentMethod || 'cod',
      bkashTxId: paymentMethod === 'bkash' ? bkashTxId?.trim() : undefined,
      couponCode: couponCode ? couponCode.trim() : undefined,
      status: 'pending',
    });

    res.status(201).json({ success: true, order: newOrder });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.patch('/orders/:id/status', (req: Request, res: Response) => {
  try {
    const { status, courierConsignmentId, courierName } = req.body;
    const allowed = ['pending', 'confirmed', 'printed', 'processing', 'packaging', 'shipped', 'delivered', 'cancelled'];

    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid order status' });
    }

    const updated = db.updateOrderStatus(req.params.id, status, courierConsignmentId, courierName);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    res.json({ success: true, order: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.patch('/orders/:id/notes', (req: Request, res: Response) => {
  try {
    const { adminNote } = req.body;
    const updated = db.updateOrderNotes(req.params.id, adminNote || '');
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }
    res.json({ success: true, order: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.delete('/orders/:id', (req: Request, res: Response) => {
  try {
    const deleted = db.deleteOrder(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }
    res.json({ success: true, message: 'Order deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Steadfast / Bangladeshi Courier Dispatch Simulation
apiRouter.post('/courier/dispatch', (req: Request, res: Response) => {
  try {
    const { orderId, courierService } = req.body;
    const order = db.getOrderById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    const courier = courierService || 'Steadfast Courier';
    const consignmentId = `ST-${Math.floor(100000 + Math.random() * 900000)}`;

    const updated = db.updateOrderStatus(orderId, 'shipped', consignmentId, courier);
    res.json({
      success: true,
      message: `Order successfully booked with ${courier}`,
      consignmentId,
      order: updated,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Bundles / Products
apiRouter.get('/bundles', (req: Request, res: Response) => {
  try {
    const bundles = db.getBundles();
    res.json({ success: true, bundles });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.put('/bundles/:id', (req: Request, res: Response) => {
  try {
    const updated = db.updateBundle(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Bundle not found' });
    }
    res.json({ success: true, bundle: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Coupons
apiRouter.get('/coupons', (req: Request, res: Response) => {
  try {
    const coupons = db.getCoupons();
    res.json({ success: true, coupons });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.post('/coupons', (req: Request, res: Response) => {
  try {
    const { code, discountType, discountAmount, minQuantity } = req.body;
    if (!code) {
      return res.status(400).json({ success: false, error: 'Coupon code is required' });
    }
    const created = db.createCoupon({
      code: code.trim().toUpperCase(),
      discountType: discountType || 'fixed',
      discountAmount: Number(discountAmount) || 0,
      minQuantity: Number(minQuantity) || 1,
      isActive: true,
    });
    res.status(201).json({ success: true, coupon: created });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.delete('/coupons/:id', (req: Request, res: Response) => {
  try {
    const deleted = db.deleteCoupon(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Coupon not found' });
    }
    res.json({ success: true, message: 'Coupon deleted' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. Admin Stats & Analytics
apiRouter.get('/admin/stats', (req: Request, res: Response) => {
  try {
    const stats = db.getStats();
    res.json({ success: true, stats });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. Settings
apiRouter.get('/settings', (req: Request, res: Response) => {
  try {
    const settings = db.getSettings();
    res.json({ success: true, settings });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.put('/settings', (req: Request, res: Response) => {
  try {
    const updated = db.updateSettings(req.body);
    res.json({ success: true, settings: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
