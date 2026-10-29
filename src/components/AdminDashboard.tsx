import { useState, useEffect, useCallback } from 'react';
import {
  Package,
  ShoppingBag,
  TrendingUp,
  Clock,
  Truck,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  Phone,
  MessageCircle,
  Download,
  Edit,
  Save,
  Trash2,
  RefreshCw,
  ArrowLeft,
  Lock,
  Boxes,
  Layers,
  Plus,
  ExternalLink,
  Tag,
  DollarSign,
  AlertCircle,
  Check,
  Printer,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Settings,
  Database,
  LogOut,
  Image as ImageIcon,
  ChevronUp,
  ChevronDown,
  Eye,
  EyeOff,
} from 'lucide-react';
import ImageUploadField from './ImageUploadField';
import SliderImageUploadField from './SliderImageUploadField';
import GalleryImagePicker, { GalleryImageOption } from './GalleryImagePicker';
import heroBowlImage from '../assets/images/shemai_hero_bowl_1793156337325.jpg';
import packagingBoxImage from '../assets/images/shemai_packaging_box_1793156354481.jpg';
import preparedDishImage from '../assets/images/prepared_malai_shemai_1793156370328.jpg';
import {
  fetchAllOrders,
  subscribeToOrders,
  updateOrderStatus,
  deleteOrder,
  fetchCombos,
  createCombo,
  updateCombo,
  deleteCombo,
  fetchAllProducts,
  createProductItem,
  updateProductItem,
  deleteProductItem,
  fetchAllCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  fetchDeliverySettings,
  updateDeliverySettings,
  fetchSliderImages,
  createSliderImage,
  updateSliderImage,
  deleteSliderImage,
  fetchHomepageImageCards,
  createHomepageImageCards,
  updateHomepageImageCard,
  deleteHomepageImageCard,
  HOMEPAGE_IMAGE_CARD_LIMIT,
  StoreDeliverySettings,
  SliderImage,
  HomepageImageCard,
  BackendOrder,
  BackendCombo,
  ProductItem,
} from '../services/dbService';
import { DBCoupon } from '../types';
import { copyCatalogImageToGallery, deleteCatalogImage, uploadCatalogImage } from '../services/imageUpload';
import { getSupabaseClient } from '../lib/supabase';

function isOrderStatus(status: string): status is BackendOrder['status'] {
  return ['pending', 'confirmed', 'printed', 'processing', 'shipped', 'delivered', 'cancelled'].includes(status);
}

const ORDER_STATUS_LABELS: Record<BackendOrder['status'], string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  printed: 'Printed',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

type OrderDateRange = 'today' | 'this-week' | 'this-month' | 'all' | 'custom';

function isOrderDateRange(value: string): value is OrderDateRange {
  return ['today', 'this-week', 'this-month', 'all', 'custom'].includes(value);
}

function getLocalDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatOrderUnitPrice(order: BackendOrder): string {
  const unitPrice = order.quantity > 0 ? order.itemSubtotal / order.quantity : order.itemSubtotal;
  return unitPrice.toLocaleString('en-BD', { maximumFractionDigits: 2 });
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character] ?? character);
}

function buildInvoicesHtml(
  orders: BackendOrder[],
  combos: BackendCombo[],
  products: ProductItem[],
): string {
  const invoices = orders.map((order) => {
    const bundleImage = combos.find((combo) => combo.id === order.bundleId)?.imageUrl
      || products.find((product) => product.id === order.bundleId)?.imageUrl;
    const invoiceDate = new Date(order.createdAt).toLocaleString('en-GB');
    const paymentMethod = order.paymentMethod === 'cod' ? 'Cash on delivery' : 'bKash/Nagad';

    return `
      <article class="invoice">
        <header>
          <div>
            <h1>Paramount Foods</h1>
            <p>Order invoice</p>
          </div>
          <div class="order-number">
            <strong>Invoice</strong>
            <span>#${escapeHtml(order.orderId)}</span>
            <small>${escapeHtml(invoiceDate)}</small>
          </div>
        </header>
        <section class="customer">
          <div><strong>Customer</strong><span>${escapeHtml(order.customerName)}</span></div>
          <div><strong>Phone</strong><span>${escapeHtml(order.customerPhone)}</span></div>
          <div><strong>Address</strong><span>${escapeHtml(order.customerAddress)}</span></div>
          <div><strong>Delivery area</strong><span>${order.deliveryArea === 'dhaka' ? 'Inside Dhaka' : 'Outside Dhaka'}</span></div>
          <div><strong>Payment</strong><span>${escapeHtml(paymentMethod)}</span></div>
          ${order.note ? `<div><strong>Note</strong><span>${escapeHtml(order.note)}</span></div>` : ''}
        </section>
        <table>
          <thead><tr><th>Product</th><th>Qty</th><th>Unit price</th><th>Subtotal</th></tr></thead>
          <tbody><tr>
            <td class="product">
              ${bundleImage ? `<img src="${escapeHtml(bundleImage)}" alt="">` : ''}
              <span>${escapeHtml(order.bundleName)}</span>
            </td>
            <td>${order.quantity}</td>
            <td>৳${formatOrderUnitPrice(order)}</td>
            <td>৳${order.itemSubtotal.toLocaleString()}</td>
          </tr></tbody>
        </table>
        <section class="totals">
          <div><span>Delivery charge</span><span>৳${order.deliveryCharge.toLocaleString()}</span></div>
          <div><span>Discount</span><span>- ৳${order.discount.toLocaleString()}</span></div>
          ${order.couponCode ? `<div><span>Coupon</span><span>${escapeHtml(order.couponCode)}</span></div>` : ''}
          <div class="grand-total"><strong>Total</strong><strong>৳${order.totalAmount.toLocaleString()}</strong></div>
        </section>
        <footer>Thank you for your order.</footer>
      </article>`;
  }).join('');

  return `<!doctype html>
    <html lang="en"><head><meta charset="utf-8"><title>Order invoices</title>
    <style>
      @page { size: A4; margin: 16mm; }
      * { box-sizing: border-box; }
      body { margin: 0; color: #292524; font: 14px Arial, sans-serif; }
      .invoice { min-height: 265mm; page-break-after: always; break-after: page; }
      .invoice:last-child { page-break-after: auto; break-after: auto; }
      header { display: flex; justify-content: space-between; border-bottom: 2px solid #047857; padding-bottom: 18px; }
      h1 { margin: 0; color: #065f46; font-size: 24px; }
      header p { margin: 6px 0 0; color: #78716c; }
      .order-number { display: grid; gap: 5px; text-align: right; }
      .order-number span { font-size: 18px; font-weight: bold; }
      .order-number small { color: #78716c; }
      .customer { display: grid; gap: 12px; margin: 24px 0; }
      .customer div { display: grid; grid-template-columns: 110px 1fr; gap: 12px; }
      .customer strong { color: #57534e; }
      table { width: 100%; border-collapse: collapse; margin-top: 20px; }
      th, td { padding: 12px 8px; border-bottom: 1px solid #e7e5e4; text-align: left; }
      th { background: #f5f5f4; }
      td:last-child, th:last-child { text-align: right; }
      .product { display: flex; align-items: center; gap: 12px; }
      .product img { width: 52px; height: 52px; object-fit: cover; border-radius: 6px; }
      .totals { width: 260px; margin: 20px 0 0 auto; }
      .totals div { display: flex; justify-content: space-between; padding: 7px 0; }
      .grand-total { margin-top: 4px; border-top: 2px solid #a8a29e; font-size: 17px; }
      footer { margin-top: 48px; border-top: 1px solid #e7e5e4; padding-top: 14px; text-align: center; color: #78716c; }
      @media screen { body { max-width: 800px; margin: 24px auto; } .invoice { padding: 20px; } }
    </style></head><body>${invoices}</body></html>`;
}

interface AdminDashboardProps {
  onNavigateToStore: () => void;
  onClose?: () => void;
}

export default function AdminDashboard({ onNavigateToStore, onClose }: AdminDashboardProps) {
  const handleBackToStore = onNavigateToStore || onClose;
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Tab State: orders, combos, products, coupons, slider, or settings
  const [activeTab, setActiveTab] = useState<'orders' | 'combos' | 'products' | 'coupons' | 'slider' | 'gallery' | 'settings'>('orders');

  // Data states
  const [orders, setOrders] = useState<BackendOrder[]>([]);
  const [combos, setCombos] = useState<BackendCombo[]>([]);
  const [productsList, setProductsList] = useState<ProductItem[]>([]);
  const [coupons, setCoupons] = useState<DBCoupon[]>([]);
  const [sliderImages, setSliderImages] = useState<SliderImage[]>([]);
  const [homepageImageCards, setHomepageImageCards] = useState<HomepageImageCard[]>([]);
  const [deliverySettings, setDeliverySettings] = useState<StoreDeliverySettings | null>(null);
  const [isSavingCoupon, setIsSavingCoupon] = useState(false);
  const [isSavingDeliverySettings, setIsSavingDeliverySettings] = useState(false);
  const [isSavingSlider, setIsSavingSlider] = useState(false);
  const [isSavingGalleryCard, setIsSavingGalleryCard] = useState(false);
  const [isGalleryFormOpen, setIsGalleryFormOpen] = useState(false);
  const [galleryImageFiles, setGalleryImageFiles] = useState<File[]>([]);
  const [gallerySelectedImageUrls, setGallerySelectedImageUrls] = useState<string[]>([]);
  const [isSliderFormOpen, setIsSliderFormOpen] = useState(false);
  const [editingSliderImage, setEditingSliderImage] = useState<SliderImage | null>(null);
  const [sliderImageFile, setSliderImageFile] = useState<File | null>(null);
  const [isSliderImageValid, setIsSliderImageValid] = useState(true);
  const [sliderDraft, setSliderDraft] = useState({
    title: '',
    altText: '',
    caption: '',
    isActive: true,
  });
  const [couponForm, setCouponForm] = useState({
    code: '',
    discountType: 'fixed' as DBCoupon['discountType'],
    discountAmount: 50,
    minQuantity: 1,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filters & Search for orders
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<OrderDateRange>('all');
  const [customStartDate, setCustomStartDate] = useState(() => getLocalDateKey(new Date()));
  const [customEndDate, setCustomEndDate] = useState(() => getLocalDateKey(new Date()));
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modals & Edit states
  const [editingCombo, setEditingCombo] = useState<BackendCombo | null>(null);
  const [isCreatingCombo, setIsCreatingCombo] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [comboImageFile, setComboImageFile] = useState<File | null>(null);
  const [newProductImageFile, setNewProductImageFile] = useState<File | null>(null);
  const [editingProductImageFile, setEditingProductImageFile] = useState<File | null>(null);
  const [isSavingCatalogItem, setIsSavingCatalogItem] = useState(false);
  const [newProductForm, setNewProductForm] = useState<Omit<ProductItem, 'id'>>({
    name: '',
    sku: '',
    category: '',
    unitWeight: '',
    costPrice: 0,
    regularPrice: 0,
    stockQuantity: 0,
    inStock: true,
    description: '',
  });

  const [notification, setNotification] = useState<string | null>(null);
  const [catalogLoadError, setCatalogLoadError] = useState<string | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [isPrintingOrders, setIsPrintingOrders] = useState(false);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleSliderFileChange = useCallback((file: File | null, isValid: boolean) => {
    setSliderImageFile(file);
    setIsSliderImageValid(isValid);
  }, []);

  const loadData = async () => {
    setIsRefreshing(true);
    try {
      const [fetchedOrders, fetchedCombos, fetchedProducts, fetchedCoupons, fetchedDeliverySettings, fetchedSliderImages, fetchedGalleryCards] = await Promise.all([
        fetchAllOrders(),
        fetchCombos(),
        fetchAllProducts(),
        fetchAllCoupons(),
        fetchDeliverySettings(),
        fetchSliderImages(),
        fetchHomepageImageCards(),
      ]);
      setOrders(fetchedOrders);
      setCombos(fetchedCombos);
      setProductsList(fetchedProducts);
      setCoupons(fetchedCoupons);
      setDeliverySettings(fetchedDeliverySettings);
      setSliderImages(fetchedSliderImages);
      setHomepageImageCards(fetchedGalleryCards);
      setCatalogLoadError(null);
    } catch (err) {
      console.error('Error fetching admin data:', err);
      setCatalogLoadError(err instanceof Error ? err.message : 'অ্যাডমিন ডেটা লোড করা যায়নি');
      showToast(err instanceof Error ? err.message : 'অ্যাডমিন ডেটা লোড করা যায়নি');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    let subscription: { unsubscribe: () => void } | undefined;
    try {
      const supabase = getSupabaseClient();
      supabase.auth.getSession().then(({ data, error }) => {
        if (error) {
          setAuthError(error.message);
          return;
        }
        setIsAuthenticated(data.session?.user.app_metadata.role === 'admin');
      }).catch((error: unknown) => {
        setAuthError(error instanceof Error ? error.message : 'Supabase session load failed.');
      });

      const authState = supabase.auth.onAuthStateChange((_event, session) => {
        setIsAuthenticated(session?.user.app_metadata.role === 'admin');
      });
      subscription = authState.data.subscription;
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Supabase is not configured.');
    }

    return () => subscription?.unsubscribe();
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;

    // Load catalog records from Supabase without inserting defaults.
    Promise.all([
      fetchCombos(),
      fetchAllProducts(),
      fetchAllCoupons(),
      fetchDeliverySettings(),
      fetchSliderImages(),
      fetchHomepageImageCards(),
    ]).then(([cList, pList, couponList, fetchedDeliverySettings, fetchedSliderImages, fetchedGalleryCards]) => {
      setCombos(cList);
      setProductsList(pList);
      setCoupons(couponList);
      setDeliverySettings(fetchedDeliverySettings);
      setSliderImages(fetchedSliderImages);
      setHomepageImageCards(fetchedGalleryCards);
      setCatalogLoadError(null);
      setIsLoading(false);
    }).catch((error: unknown) => {
      console.error('Could not load catalog data from Supabase:', error);
      setCatalogLoadError(error instanceof Error ? error.message : 'ক্যাটালগ ডেটা লোড করা যায়নি');
      showToast(error instanceof Error ? error.message : 'ক্যাটালগ ডেটা লোড করা যায়নি');
      setIsLoading(false);
    });

    // Real-time Supabase subscription for orders
    const unsubscribe = subscribeToOrders((liveOrders) => {
      setOrders(liveOrders);
      setIsLoading(false);
      setIsRefreshing(false);
    }, (error) => {
      console.error('Supabase orders subscription failed:', error);
      showToast(error.message);
      setIsLoading(false);
      setIsRefreshing(false);
    });

    return () => {
      unsubscribe();
    };
  }, [isAuthenticated]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsAuthenticating(true);
    try {
      const { data, error } = await getSupabaseClient().auth.signInWithPassword({
        email: adminEmail,
        password: adminPassword,
      });
      if (error) throw error;
      if (data.user.app_metadata.role !== 'admin') {
        await getSupabaseClient().auth.signOut();
        throw new Error('এই অ্যাকাউন্টে অ্যাডমিন অনুমতি নেই।');
      }
      setIsAuthenticated(true);
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'লগইন করা যায়নি।');
    } finally {
      setIsAuthenticating(false);
    }
  };

  // Real-time Order Status Handler
  const handleStatusChange = async (
    orderId: string,
    newStatus: BackendOrder['status']
  ) => {
    const previousStatus = orders.find((order) => order.orderId === orderId)?.status;
    setUpdatingOrderId(orderId);
    setOrders((prev) =>
      prev.map((o) => (o.orderId === orderId ? { ...o, status: newStatus } : o))
    );

    try {
      await updateOrderStatus(orderId, { status: newStatus });
      showToast(`অর্ডার #${orderId} সফলভাবে ${ORDER_STATUS_LABELS[newStatus]} এ আপডেট হয়েছে!`);
    } catch (err) {
      console.error('Failed to update status in database:', err);
      if (previousStatus) {
        setOrders((prev) =>
          prev.map((order) => (order.orderId === orderId ? { ...order, status: previousStatus } : order))
        );
      }
      showToast(
        err instanceof Error && err.message.includes('INSUFFICIENT_STOCK')
          ? 'স্টক অপর্যাপ্ত, তাই বাতিল অর্ডারটি আবার চালু করা যায়নি।'
          : 'স্ট্যাটাস আপডেট করতে সমস্যা হয়েছে, অনুগ্রহ করে আবার চেষ্টা করুন।',
      );
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleCourierUpdate = async (
    orderId: string,
    courierName: string,
    courierTrackingCode: string
  ) => {
    await updateOrderStatus(orderId, { courierName, courierTrackingCode, status: 'shipped' });
    setOrders((prev) =>
      prev.map((o) =>
        o.orderId === orderId ? { ...o, courierName, courierTrackingCode, status: 'shipped' } : o
      )
    );
    showToast(`অর্ডার #${orderId} এর কুরিয়ার তথ্য আপডেট হয়েছে!`);
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (window.confirm(`আপনি কি নিশ্চিত যে অর্ডার #${orderId} ডিলিট করতে চান?`)) {
      await deleteOrder(orderId);
      setOrders((prev) => prev.filter((o) => o.orderId !== orderId));
      showToast(`অর্ডার #${orderId} মুছে ফেলা হয়েছে!`);
    }
  };

  const openNewComboForm = () => {
    setComboImageFile(null);
    setIsCreatingCombo(true);
    setEditingCombo({
      id: crypto.randomUUID(),
      name: '',
      subtitle: '',
      weight: '',
      boxes: 1,
      originalPrice: 0,
      salePrice: 0,
      savings: 0,
      freeDelivery: false,
      popular: false,
      description: '',
      inStock: true,
      stockCount: 0,
    });
  };

  // 1. Combo Table Handlers
  const handleSaveCombo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCombo) return;
    if (!editingCombo.name.trim() || !editingCombo.weight.trim()) {
      showToast('কম্বোর নাম এবং ওজন/সাইজ লিখুন।');
      return;
    }
    if (editingCombo.salePrice < 0 || editingCombo.originalPrice < 0 || editingCombo.stockCount < 0) {
      showToast('মূল্য এবং স্টক শূন্য বা তার বেশি হতে হবে।');
      return;
    }

    setIsSavingCatalogItem(true);
    let uploadedImageUrl: string | null = null;
    const previousImageUrl = editingCombo.imageUrl;
    try {
      if (comboImageFile) {
        uploadedImageUrl = await uploadCatalogImage(comboImageFile, 'combos', editingCombo.id);
      }
      const combo: BackendCombo = {
        ...editingCombo,
        name: editingCombo.name.trim(),
        subtitle: editingCombo.subtitle.trim(),
        weight: editingCombo.weight.trim(),
        description: editingCombo.description.trim(),
        originalPrice: Number(editingCombo.originalPrice),
        salePrice: Number(editingCombo.salePrice),
        savings: Math.max(0, Number(editingCombo.originalPrice) - Number(editingCombo.salePrice)),
        stockCount: Number(editingCombo.stockCount),
        imageUrl: uploadedImageUrl ?? editingCombo.imageUrl,
      };

      if (isCreatingCombo) {
        const created = await createCombo(combo);
        setCombos((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
        showToast(`কম্বো '${created.name}' তৈরি হয়েছে।`);
      } else {
        await updateCombo(editingCombo.id, combo);
        setCombos((prev) => prev.map((item) => item.id === editingCombo.id ? combo : item));
        showToast(`কম্বো অফার '${combo.name}' আপডেট হয়েছে।`);
      }
      setEditingCombo(null);
      setIsCreatingCombo(false);
      setComboImageFile(null);
      if (uploadedImageUrl && previousImageUrl && previousImageUrl !== uploadedImageUrl) {
        try {
          await deleteCatalogImage(previousImageUrl);
        } catch (cleanupError) {
          console.error('Combo saved but its previous image could not be removed:', cleanupError);
          showToast('কম্বো সেভ হয়েছে, তবে পুরোনো image Storage থেকে মুছতে পারেনি।');
        }
      }
    } catch (err) {
      if (uploadedImageUrl) {
        try {
          await deleteCatalogImage(uploadedImageUrl);
        } catch (cleanupError) {
          console.error('Could not clean up an unused combo image:', cleanupError);
        }
      }
      console.error('Error saving combo image or details:', err);
      showToast(err instanceof Error ? err.message : 'কম্বো সেভ করতে সমস্যা হয়েছে');
    } finally {
      setIsSavingCatalogItem(false);
    }
  };

  const handleDeleteCombo = async (combo: BackendCombo) => {
    if (!window.confirm(`"${combo.name}" কম্বোটি মুছে ফেলবেন? পুরোনো অর্ডারের তথ্য অক্ষত থাকবে।`)) return;
    try {
      await deleteCombo(combo.id);
      setCombos((current) => current.filter((item) => item.id !== combo.id));
      try {
        if (combo.imageUrl) await deleteCatalogImage(combo.imageUrl);
        showToast('কম্বো মুছে ফেলা হয়েছে।');
      } catch (cleanupError) {
        console.error('Combo deleted but its Storage image could not be removed:', cleanupError);
        showToast('কম্বো মুছে গেছে, তবে Storage থেকে image মুছতে পারেনি।');
      }
    } catch (error) {
      console.error('Could not delete combo:', error);
      showToast(error instanceof Error ? error.message : 'কম্বো মুছে ফেলা যায়নি।');
    }
  };

  // 2. Base Product Table Handlers
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductForm.name.trim()) {
      alert('প্রোডাক্টের নাম লিখুন');
      return;
    }

    try {
      setIsSavingCatalogItem(true);
      const imageUrl = newProductImageFile
        ? await uploadCatalogImage(newProductImageFile, 'products', `prod-${Date.now()}`)
        : undefined;
      const created = await createProductItem({ ...newProductForm, imageUrl });
      setProductsList((prev) => [created, ...prev]);
      setIsAddingProduct(false);
      setNewProductImageFile(null);
      setNewProductForm({
        name: '',
        sku: '',
        category: '',
        unitWeight: '',
        costPrice: 0,
        regularPrice: 0,
        stockQuantity: 0,
        inStock: true,
        description: '',
      });
      showToast(`নতুন প্রোডাক্ট '${created.name}' ডাটাবেসে যোগ হয়েছে!`);
    } catch (err) {
      console.error('Error creating product:', err);
      showToast(err instanceof Error ? err.message : 'প্রোডাক্ট তৈরি করতে সমস্যা হয়েছে');
    } finally {
      setIsSavingCatalogItem(false);
    }
  };

  const handleSaveSingleProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    setIsSavingCatalogItem(true);
    try {
      const imageUrl = editingProductImageFile
        ? await uploadCatalogImage(editingProductImageFile, 'products', editingProduct.id)
        : editingProduct.imageUrl;
      const updatedProduct = { ...editingProduct, imageUrl };
      await updateProductItem(editingProduct.id, {
        name: editingProduct.name,
        sku: editingProduct.sku,
        category: editingProduct.category,
        unitWeight: editingProduct.unitWeight,
        costPrice: Number(editingProduct.costPrice),
        regularPrice: Number(editingProduct.regularPrice),
        stockQuantity: Number(editingProduct.stockQuantity),
        inStock: editingProduct.inStock,
        description: editingProduct.description,
        imageUrl,
      });

      setProductsList((prev) =>
        prev.map((product) => (product.id === editingProduct.id ? updatedProduct : product))
      );
      setEditingProduct(null);
      setEditingProductImageFile(null);
      showToast(`প্রোডাক্ট '${editingProduct.name}' ডাটাবেসে সফলভাবে আপডেট হয়েছে!`);
    } catch (err) {
      console.error('Error saving product image or details:', err);
      showToast(err instanceof Error ? err.message : 'প্রোডাক্ট আপডেট করতে সমস্যা হয়েছে');
    } finally {
      setIsSavingCatalogItem(false);
    }
  };

  const handleDeleteProduct = async (productId: string, productName: string) => {
    if (window.confirm(`আপনি কি নিশ্চিত যে '${productName}' প্রোডাক্টটি মুছে ফেলতে চান?`)) {
      await deleteProductItem(productId);
      setProductsList((prev) => prev.filter((p) => p.id !== productId));
      showToast(`প্রোডাক্ট '${productName}' মুছে ফেলা হয়েছে!`);
    }
  };

  const handleCreateCoupon = async (event: React.FormEvent) => {
    event.preventDefault();
    const code = couponForm.code.trim().toUpperCase();
    if (!/^[A-Z0-9_-]+$/.test(code)) {
      showToast('কুপন কোডে শুধু ইংরেজি অক্ষর, সংখ্যা, - এবং _ ব্যবহার করুন।');
      return;
    }

    setIsSavingCoupon(true);
    try {
      const created = await createCoupon({
        ...couponForm,
        code,
        discountAmount: couponForm.discountType === 'fixed' ? Number(couponForm.discountAmount) : 0,
        minQuantity: Number(couponForm.minQuantity),
        isActive: true,
      });
      setCoupons((current) => [...current, created].sort((a, b) => a.code.localeCompare(b.code)));
      setCouponForm({ code: '', discountType: 'fixed', discountAmount: 50, minQuantity: 1 });
      showToast(`কুপন ${created.code} তৈরি হয়েছে।`);
    } catch (error) {
      console.error('Could not create coupon:', error);
      showToast(error instanceof Error ? error.message : 'কুপন তৈরি করা যায়নি।');
    } finally {
      setIsSavingCoupon(false);
    }
  };

  const handleToggleCoupon = async (coupon: DBCoupon) => {
    try {
      await updateCoupon(coupon.id, { isActive: !coupon.isActive });
      setCoupons((current) =>
        current.map((item) => item.id === coupon.id ? { ...item, isActive: !item.isActive } : item),
      );
      showToast(`${coupon.code} কুপন ${coupon.isActive ? 'নিষ্ক্রিয়' : 'সক্রিয়'} করা হয়েছে।`);
    } catch (error) {
      console.error('Could not update coupon:', error);
      showToast(error instanceof Error ? error.message : 'কুপন আপডেট করা যায়নি।');
    }
  };

  const handleDeleteCoupon = async (coupon: DBCoupon) => {
    if (!window.confirm(`আপনি কি ${coupon.code} কুপনটি মুছে ফেলতে চান?`)) return;
    try {
      await deleteCoupon(coupon.id);
      setCoupons((current) => current.filter((item) => item.id !== coupon.id));
      showToast(`${coupon.code} কুপন মুছে ফেলা হয়েছে।`);
    } catch (error) {
      console.error('Could not delete coupon:', error);
      showToast(error instanceof Error ? error.message : 'কুপন মুছে ফেলা যায়নি।');
    }
  };

  const openSliderForm = (slide?: SliderImage) => {
    setEditingSliderImage(slide ?? null);
    setSliderDraft(slide
      ? {
          title: slide.title,
          altText: slide.altText,
          caption: slide.caption,
          isActive: slide.isActive,
        }
      : { title: '', altText: '', caption: '', isActive: true });
    setSliderImageFile(null);
    setIsSliderImageValid(true);
    setIsSliderFormOpen(true);
  };

  const closeSliderForm = () => {
    setIsSliderFormOpen(false);
    setEditingSliderImage(null);
    setSliderImageFile(null);
    setIsSliderImageValid(true);
  };

  const handleSaveSlider = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!sliderDraft.title.trim() || !sliderDraft.altText.trim()) {
      showToast('Slider-এর title এবং alt text লিখুন।');
      return;
    }
    if (!isSliderImageValid) {
      showToast('নির্দেশনা অনুযায়ী একটি বৈধ slider image নির্বাচন করুন।');
      return;
    }
    if (!editingSliderImage && !sliderImageFile) {
      showToast('নতুন slider যোগ করতে একটি image নির্বাচন করুন।');
      return;
    }

    setIsSavingSlider(true);
    let uploadedImageUrl: string | null = null;
    const slideId = editingSliderImage?.id ?? crypto.randomUUID();
    const previousImageUrl = editingSliderImage?.imageUrl;
    try {
      if (sliderImageFile) {
        uploadedImageUrl = await uploadCatalogImage(sliderImageFile, 'slider', slideId);
      }
      const image = {
        title: sliderDraft.title.trim(),
        altText: sliderDraft.altText.trim(),
        caption: sliderDraft.caption.trim(),
        imageUrl: uploadedImageUrl ?? editingSliderImage?.imageUrl ?? '',
        sortOrder: editingSliderImage?.sortOrder
          ?? (Math.max(-1, ...sliderImages.map((slide) => slide.sortOrder)) + 1),
        isActive: sliderDraft.isActive,
      };

      if (editingSliderImage) {
        await updateSliderImage(editingSliderImage.id, image);
        setSliderImages((current) => current.map((slide) => (
          slide.id === editingSliderImage.id ? { ...slide, ...image } : slide
        )));
      } else {
        const created = await createSliderImage({ id: slideId, ...image });
        setSliderImages((current) => [...current, created].sort(
          (left, right) => left.sortOrder - right.sortOrder,
        ));
      }
    } catch (error) {
      if (uploadedImageUrl) {
        try {
          await deleteCatalogImage(uploadedImageUrl);
        } catch (cleanupError) {
          console.error('Could not clean up an unused slider image:', cleanupError);
        }
      }
      console.error('Could not save slider image:', error);
      showToast(error instanceof Error ? error.message : 'Slider image সেভ করা যায়নি।');
      setIsSavingSlider(false);
      return;
    }

    closeSliderForm();
    setIsSavingSlider(false);
    if (uploadedImageUrl && previousImageUrl && previousImageUrl !== uploadedImageUrl) {
      try {
        await deleteCatalogImage(previousImageUrl);
      } catch (error) {
        console.error('Slider updated but the previous image could not be removed:', error);
        showToast('Slider আপডেট হয়েছে, তবে পুরোনো image Storage থেকে মুছতে পারেনি।');
        return;
      }
    }
    showToast(editingSliderImage ? 'Slider image আপডেট হয়েছে।' : 'নতুন slider image যোগ হয়েছে।');
  };

  const handleToggleSlider = async (slide: SliderImage) => {
    try {
      await updateSliderImage(slide.id, { isActive: !slide.isActive });
      setSliderImages((current) => current.map((item) => (
        item.id === slide.id ? { ...item, isActive: !item.isActive } : item
      )));
      showToast(slide.isActive ? 'Slider image নিষ্ক্রিয় করা হয়েছে।' : 'Slider image সক্রিয় করা হয়েছে।');
    } catch (error) {
      console.error('Could not change slider image visibility:', error);
      showToast(error instanceof Error ? error.message : 'Slider status আপডেট করা যায়নি।');
    }
  };

  const handleDeleteSlider = async (slide: SliderImage) => {
    if (!window.confirm(`"${slide.title}" slider image মুছে ফেলবেন?`)) return;
    try {
      await deleteSliderImage(slide.id);
      setSliderImages((current) => current.filter((item) => item.id !== slide.id));
    } catch (error) {
      console.error('Could not delete slider image:', error);
      showToast(error instanceof Error ? error.message : 'Slider image মুছে ফেলা যায়নি।');
      return;
    }

    try {
      await deleteCatalogImage(slide.imageUrl);
      showToast('Slider image মুছে ফেলা হয়েছে।');
    } catch (error) {
      console.error('Slider record deleted but its Storage image could not be removed:', error);
      showToast('Slider মুছে গেছে, তবে Storage থেকে image মুছতে পারেনি।');
    }
  };

  const handleMoveSlider = async (slideIndex: number, direction: -1 | 1) => {
    const destination = slideIndex + direction;
    if (destination < 0 || destination >= sliderImages.length) return;
    const reordered = [...sliderImages];
    [reordered[slideIndex], reordered[destination]] = [reordered[destination], reordered[slideIndex]];

    try {
      await Promise.all(reordered.map((slide, index) => updateSliderImage(slide.id, { sortOrder: index })));
      setSliderImages(reordered.map((slide, index) => ({ ...slide, sortOrder: index })));
    } catch (error) {
      console.error('Could not reorder slider images:', error);
      try {
        setSliderImages(await fetchSliderImages());
      } catch (refreshError) {
        console.error('Could not refresh slider order after a failed update:', refreshError);
      }
      showToast(error instanceof Error ? error.message : 'Slider order আপডেট করা যায়নি।');
    }
  };

  const galleryImageOptions: GalleryImageOption[] = ([
    { label: 'আগের হোমপেজ ছবি · সেমাই বোল', imageUrl: heroBowlImage, category: 'homepage' },
    { label: 'আগের হোমপেজ ছবি · প্যাকেজিং বক্স', imageUrl: packagingBoxImage, category: 'homepage' },
    { label: 'আগের হোমপেজ ছবি · তৈরি সেমাই', imageUrl: preparedDishImage, category: 'homepage' },
    ...homepageImageCards.map((card) => ({
      label: `আগের gallery ছবি · ${card.altText}`,
      imageUrl: card.imageUrl,
      category: 'gallery' as const,
    })),
    ...productsList.flatMap((product) => product.imageUrl
      ? [{ label: `প্রোডাক্ট · ${product.name}`, imageUrl: product.imageUrl, category: 'product' as const }]
      : []),
    ...combos.flatMap((combo) => combo.imageUrl
      ? [{ label: `কম্বো · ${combo.name}`, imageUrl: combo.imageUrl, category: 'combo' as const }]
      : []),
    ...sliderImages.map((slide) => ({
      label: `স্লাইডার · ${slide.title}`,
      imageUrl: slide.imageUrl,
      category: 'slider' as const,
    })),
  ] as GalleryImageOption[]).map((option) => ({ ...option, id: option.imageUrl }))
    .filter((option, index, options) => (
      options.findIndex((candidate) => candidate.imageUrl === option.imageUrl) === index
    ));

  const closeGalleryForm = () => {
    setIsGalleryFormOpen(false);
    setGalleryImageFiles([]);
    setGallerySelectedImageUrls([]);
  };

  const handleSaveGalleryCards = async (event: React.FormEvent) => {
    event.preventDefault();
    if (homepageImageCards.length >= HOMEPAGE_IMAGE_CARD_LIMIT) {
      showToast(`সর্বোচ্চ ${HOMEPAGE_IMAGE_CARD_LIMIT}টি image card রাখা যাবে।`);
      return;
    }
    if (galleryImageFiles.length + gallerySelectedImageUrls.length === 0) {
      showToast('অন্তত একটি ছবি নির্বাচন করুন।');
      return;
    }
    if (galleryImageFiles.length + gallerySelectedImageUrls.length
      > HOMEPAGE_IMAGE_CARD_LIMIT - homepageImageCards.length) {
      showToast(`আর সর্বোচ্চ ${HOMEPAGE_IMAGE_CARD_LIMIT - homepageImageCards.length}টি ছবি যোগ করা যাবে।`);
      return;
    }

    setIsSavingGalleryCard(true);
    const uploadedImageUrls: string[] = [];
    try {
      const newCards: Array<Omit<HomepageImageCard, 'id'> & { id: string }> = [];
      let nextOrder = Math.max(-1, ...homepageImageCards.map((card) => card.sortOrder)) + 1;
      for (const file of galleryImageFiles) {
        const id = crypto.randomUUID();
        const imageUrl = await uploadCatalogImage(file, 'gallery', id);
        uploadedImageUrls.push(imageUrl);
        newCards.push({
          id,
          imageUrl,
          altText: file.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim() || 'Product image',
          sortOrder: nextOrder++,
          isActive: true,
        });
      }
      for (const sourceUrl of gallerySelectedImageUrls) {
        const option = galleryImageOptions.find((item) => item.imageUrl === sourceUrl);
        if (!option) throw new Error('নির্বাচিত একটি ছবি আর পাওয়া যাচ্ছে না। আবার নির্বাচন করুন।');
        const id = crypto.randomUUID();
        const imageUrl = await copyCatalogImageToGallery(sourceUrl, id);
        if (imageUrl !== sourceUrl) uploadedImageUrls.push(imageUrl);
        newCards.push({
          id,
          imageUrl,
          altText: option.label,
          sortOrder: nextOrder++,
          isActive: true,
        });
      }

      const createdCards = await createHomepageImageCards(newCards);
      setHomepageImageCards((current) => [...current, ...createdCards]);
      window.dispatchEvent(new Event('homepage-images-updated'));
      closeGalleryForm();
      showToast(`${createdCards.length}টি image card যোগ করা হয়েছে।`);
    } catch (error) {
      for (const imageUrl of uploadedImageUrls) {
        try {
          await deleteCatalogImage(imageUrl);
        } catch (cleanupError) {
          console.error('Could not clean up an unused gallery image:', cleanupError);
        }
      }
      console.error('Could not save homepage image cards:', error);
      showToast(error instanceof Error ? error.message : 'ছবির card সেভ করা যায়নি।');
    } finally {
      setIsSavingGalleryCard(false);
    }
  };

  const handleToggleGalleryCard = async (card: HomepageImageCard) => {
    try {
      await updateHomepageImageCard(card.id, { isActive: !card.isActive });
      setHomepageImageCards((current) => current.map((item) => (
        item.id === card.id ? { ...item, isActive: !item.isActive } : item
      )));
      window.dispatchEvent(new Event('homepage-images-updated'));
    } catch (error) {
      console.error('Could not change homepage image card visibility:', error);
      showToast(error instanceof Error ? error.message : 'ছবির card status আপডেট করা যায়নি।');
    }
  };

  const handleDeleteGalleryCard = async (card: HomepageImageCard) => {
    if (!window.confirm('এই ছবির card মুছে ফেলবেন?')) return;
    try {
      await deleteHomepageImageCard(card.id);
      setHomepageImageCards((current) => current.filter((item) => item.id !== card.id));
      window.dispatchEvent(new Event('homepage-images-updated'));
    } catch (error) {
      console.error('Could not delete homepage image card:', error);
      showToast(error instanceof Error ? error.message : 'ছবির card মুছে ফেলা যায়নি।');
      return;
    }

    if (card.imageUrl.includes('/catalog/gallery/')) {
      try {
        await deleteCatalogImage(card.imageUrl);
      } catch (error) {
        console.error('Gallery record deleted but its Storage image could not be removed:', error);
        showToast('ছবির card মুছে গেছে, তবে Storage থেকে ছবি মুছতে পারেনি।');
        return;
      }
    }
    showToast('ছবির card মুছে ফেলা হয়েছে।');
  };

  const handleMoveGalleryCard = async (cardIndex: number, direction: -1 | 1) => {
    const destination = cardIndex + direction;
    if (destination < 0 || destination >= homepageImageCards.length) return;
    const reordered = [...homepageImageCards];
    [reordered[cardIndex], reordered[destination]] = [reordered[destination], reordered[cardIndex]];
    try {
      await Promise.all(reordered.map((card, index) => (
        updateHomepageImageCard(card.id, { sortOrder: index })
      )));
      setHomepageImageCards(reordered.map((card, index) => ({ ...card, sortOrder: index })));
      window.dispatchEvent(new Event('homepage-images-updated'));
    } catch (error) {
      console.error('Could not reorder homepage image cards:', error);
      try {
        setHomepageImageCards(await fetchHomepageImageCards());
      } catch (refreshError) {
        console.error('Could not refresh homepage image card order:', refreshError);
      }
      showToast(error instanceof Error ? error.message : 'ছবির order আপডেট করা যায়নি।');
    }
  };

  const handleSaveDeliverySettings = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!deliverySettings) return;
    if (
      !Number.isFinite(deliverySettings.dhakaDeliveryFee) ||
      !Number.isFinite(deliverySettings.outsideDhakaDeliveryFee) ||
      deliverySettings.dhakaDeliveryFee < 0 ||
      deliverySettings.outsideDhakaDeliveryFee < 0
    ) {
      showToast('ডেলিভারি চার্জ শূন্য বা তার বেশি সংখ্যা হতে হবে।');
      return;
    }

    setIsSavingDeliverySettings(true);
    try {
      await updateDeliverySettings(deliverySettings);
      showToast('ডেলিভারি চার্জ আপডেট হয়েছে।');
    } catch (error) {
      console.error('Could not update delivery settings:', error);
      showToast(error instanceof Error ? error.message : 'ডেলিভারি চার্জ আপডেট করা যায়নি।');
    } finally {
      setIsSavingDeliverySettings(false);
    }
  };

  const today = new Date();
  const todayKey = getLocalDateKey(today);
  const weekStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
  const monthStartKey = getLocalDateKey(new Date(today.getFullYear(), today.getMonth(), 1));
  const rangeStartKey =
    dateRange === 'today'
      ? todayKey
      : dateRange === 'this-week'
        ? getLocalDateKey(weekStart)
        : dateRange === 'this-month'
          ? monthStartKey
          : dateRange === 'custom'
            ? customStartDate
            : '';
  const rangeEndKey =
    dateRange === 'today' || dateRange === 'this-week' || dateRange === 'this-month'
      ? todayKey
      : dateRange === 'custom'
        ? customEndDate
        : '';
  const invalidCustomRange =
    dateRange === 'custom' && Boolean(rangeStartKey && rangeEndKey && rangeStartKey > rangeEndKey);
  const dateFilteredOrders = orders.filter((order) => {
    if (dateRange === 'all') return true;
    if (invalidCustomRange) return false;
    const orderDateKey = getLocalDateKey(new Date(order.createdAt));
    return orderDateKey >= rangeStartKey && orderDateKey <= rangeEndKey;
  });
  const filteredOrders = dateFilteredOrders.filter((order) => {
    const matchesSearch =
      order.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerPhone.includes(searchQuery);
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });
  const pageCount = Math.max(1, Math.ceil(filteredOrders.length / pageSize));
  const displayedPage = Math.min(currentPage, pageCount);
  const pageStartIndex = (displayedPage - 1) * pageSize;
  const paginatedOrders = filteredOrders.slice(pageStartIndex, pageStartIndex + pageSize);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, dateRange, customStartDate, customEndDate, pageSize]);

  useEffect(() => {
    if (currentPage > pageCount) setCurrentPage(pageCount);
  }, [currentPage, pageCount]);

  // Export orders to CSV
  const exportToCsv = () => {
    if (filteredOrders.length === 0) {
      showToast('এই filter-এ export করার মতো কোনো order নেই।');
      return;
    }

    const headers = [
      'Order ID',
      'Date',
      'Customer Name',
      'Phone Number',
      'Delivery Address',
      'Area',
      'Combo/Bundle',
      'Quantity',
      'Total Amount',
      'Payment Method',
      'TrxID',
      'Status',
      'Courier',
      'Tracking Code',
    ];

    const rows = filteredOrders.map((o) => [
      o.orderId,
      new Date(o.createdAt).toLocaleDateString(),
      `"${o.customerName.replace(/"/g, '""')}"`,
      `"${o.customerPhone}"`,
      `"${o.customerAddress.replace(/"/g, '""')}"`,
      o.deliveryArea === 'dhaka' ? 'Inside Dhaka' : 'Outside Dhaka',
      `"${o.bundleName}"`,
      o.quantity,
      o.totalAmount,
      o.paymentMethod.toUpperCase(),
      o.bkashTxId || '',
      o.status.toUpperCase(),
      o.courierName || '',
      o.courierTrackingCode || '',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const exportRange = dateRange === 'custom'
      ? `${customStartDate}_to_${customEndDate}`
      : dateRange;
    link.setAttribute('download', `lachcha_shemai_orders_${exportRange}_${todayKey}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('অর্ডার লিস্ট CSV ফাইলে ডাউনলোড হয়েছে!');
  };

  const selectedOrders = orders.filter((order) => selectedOrderIds.includes(order.orderId));
  const allVisibleOrdersSelected =
    paginatedOrders.length > 0 &&
    paginatedOrders.every((order) => selectedOrderIds.includes(order.orderId));

  const toggleOrderSelection = (orderId: string) => {
    setSelectedOrderIds((selected) =>
      selected.includes(orderId)
        ? selected.filter((id) => id !== orderId)
        : [...selected, orderId],
    );
  };

  const toggleVisibleOrderSelection = () => {
    const visibleIds = paginatedOrders.map((order) => order.orderId);
    setSelectedOrderIds((selected) => {
      if (visibleIds.every((id) => selected.includes(id))) {
        return selected.filter((id) => !visibleIds.includes(id));
      }
      return [...new Set([...selected, ...visibleIds])];
    });
  };

  const markOrdersPrinted = async (printedOrders: BackendOrder[]) => {
    const results = await Promise.allSettled(
      printedOrders.map((order) => updateOrderStatus(order.orderId, { status: 'printed' })),
    );
    const failures = results.flatMap((result, index): { orderId: string; error: unknown }[] => {
      if (result.status === 'fulfilled') return [];
      console.error(`Failed to mark order ${printedOrders[index].orderId} as printed:`, result.reason);
      return [{ orderId: printedOrders[index].orderId, error: result.reason }];
    });
    const successfulIds = results.flatMap((result, index) =>
      result.status === 'fulfilled' ? [printedOrders[index].orderId] : [],
    );

    setOrders((current) =>
      current.map((order) =>
        successfulIds.includes(order.orderId) ? { ...order, status: 'printed' } : order,
      ),
    );
    setSelectedOrderIds((selected) => selected.filter((id) => !successfulIds.includes(id)));
    setIsPrintingOrders(false);

    if (failures.length > 0) {
      const firstError = failures[0].error instanceof Error
        ? failures[0].error.message
        : String(failures[0].error);
      if (/orders_status_check|check constraint/i.test(firstError)) {
        showToast(`${successfulIds.length}টি Printed হয়েছে; বাকিগুলোর জন্য Supabase SQL Editor-এ supabase/schema.sql চালান।`);
      } else {
        showToast(`${successfulIds.length}টি Printed হয়েছে; ${failures.length}টির status save হয়নি: ${firstError}`);
      }
    } else {
      showToast(`${successfulIds.length}টি অর্ডার Printed status-এ আপডেট হয়েছে।`);
    }
  };

  const handlePrintSelectedOrders = () => {
    if (selectedOrders.length === 0 || isPrintingOrders) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      showToast('Invoice print window খোলা যায়নি। Browser-এর pop-up অনুমতি দিন।');
      return;
    }

    const ordersToPrint = [...selectedOrders];
    setIsPrintingOrders(true);

    let printStarted = false;
    let printFinished = false;
    let imageWaitTimeout = 0;
    const finishPrint = () => {
      if (printFinished) return;
      printFinished = true;
      window.clearTimeout(imageWaitTimeout);
      void markOrdersPrinted(ordersToPrint);
      if (!printWindow.closed) printWindow.close();
    };

    const startPrint = () => {
      if (printStarted) return;
      printStarted = true;
      if (printWindow.closed) {
        setIsPrintingOrders(false);
        showToast('Invoice window বন্ধ হয়েছে; অর্ডারগুলো Printed করা হয়নি।');
        return;
      }

      try {
        printWindow.focus();
        printWindow.print();
        finishPrint();
      } catch (error) {
        console.error('Could not open the invoice print dialog:', error);
        window.clearTimeout(imageWaitTimeout);
        setIsPrintingOrders(false);
        printWindow.close();
        showToast('Invoice print করা যায়নি। আবার চেষ্টা করুন।');
      }
    };

    printWindow.addEventListener('afterprint', finishPrint, { once: true });

    try {
      printWindow.document.write(buildInvoicesHtml(ordersToPrint, combos, productsList));
      printWindow.document.close();

      const imagesReady = Promise.allSettled(
        Array.from(printWindow.document.images, (image) => image.decode()),
      );
      imageWaitTimeout = window.setTimeout(startPrint, 3000);
      void imagesReady.then(startPrint);
    } catch (error) {
      console.error('Could not prepare order invoices:', error);
      setIsPrintingOrders(false);
      printWindow.close();
      showToast('Invoice তৈরি করা যায়নি। আবার চেষ্টা করুন।');
    }
  };

  // Calculate metrics
  const totalRevenue = dateFilteredOrders.reduce(
    (sum, order) => (order.status !== 'cancelled' ? sum + order.totalAmount : sum),
    0,
  );

  // Supabase Auth Gate - Standalone Page
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#1c1917] flex flex-col justify-center items-center p-4 font-['Hind_Siliguri',sans-serif]">
        <div className="bg-white rounded-2xl max-w-sm w-full p-6 sm:p-8 shadow-2xl border border-stone-800 text-center">
          <div className="w-14 h-14 bg-emerald-100 text-emerald-800 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
            <Lock className="w-7 h-7" />
          </div>

          <div className="inline-block bg-stone-100 text-stone-600 text-[10px] font-mono px-2.5 py-0.5 rounded-full mb-2">
            URL: /admin
          </div>
          <h3 className="text-xl font-extrabold text-stone-900">অ্যাডমিন ড্যাশবোর্ড</h3>
          <p className="text-xs text-stone-500 mt-1">
            প্যারামাউন্ট ফুডস · অর্ডার, কম্বো ও প্রোডাক্ট ম্যানেজমেন্ট
          </p>

          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <div>
              <label htmlFor="admin-email" className="block text-xs font-bold text-stone-700 text-left mb-1.5">
                অ্যাডমিন ইমেইল:
              </label>
              <input
                id="admin-email"
                type="email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                autoComplete="username"
                required
                className="w-full px-4 py-3 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label htmlFor="admin-password" className="block text-xs font-bold text-stone-700 text-left mb-1.5">
                পাসওয়ার্ড:
              </label>
              <input
                id="admin-password"
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                autoComplete="current-password"
                required
                className="w-full px-4 py-3 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {authError && (
              <p role="alert" className="text-left text-xs text-rose-600">{authError}</p>
            )}
            <button
              type="submit"
              disabled={isAuthenticating}
              className="w-full bg-emerald-700 hover:bg-emerald-800 text-white py-3 rounded-xl font-bold text-sm cursor-pointer shadow-md transition-all active:scale-98 disabled:opacity-50"
            >
              {isAuthenticating ? 'লগইন হচ্ছে...' : 'ড্যাশবোর্ডে প্রবেশ করুন'}
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-stone-100">
            <button
              type="button"
              onClick={handleBackToStore}
              className="w-full bg-stone-100 hover:bg-stone-200 text-stone-700 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>স্টোর ল্যান্ডিং পেজে ফিরে যান</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col font-['Hind_Siliguri',sans-serif]">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed left-3 right-3 top-3 z-50 flex items-center gap-2 rounded-xl border border-emerald-500 bg-stone-900 px-4 py-2.5 text-xs font-bold text-white shadow-2xl sm:left-auto sm:right-5 sm:top-5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* Top Standalone Navbar */}
      <header className="sticky top-0 z-30 border-b border-stone-200 bg-white px-2 py-2 shadow-xs sm:px-4 sm:py-3">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <button
              onClick={handleBackToStore}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-stone-200 bg-stone-100 text-stone-700 transition-colors hover:bg-stone-200 hover:text-stone-900"
              title="স্টোরে ফিরে যান"
              aria-label="স্টোরে ফিরে যান"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800"
              title="DB"
              aria-label="DB"
            >
              <Database className="h-5 w-5" />
            </div>
          </div>

          <div className="flex shrink-0 items-center justify-end gap-1 sm:gap-2">
            <button
              onClick={loadData}
              disabled={isRefreshing}
              className="flex h-10 w-10 items-center justify-center rounded-lg text-stone-600 transition-colors hover:bg-stone-100 hover:text-stone-900 disabled:opacity-50"
              title="ডাটা রিফ্রেশ করুন"
              aria-label="ডাটা রিফ্রেশ করুন"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={exportToCsv}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-800 transition-colors hover:bg-emerald-100"
              title="অর্ডার CSV এক্সপোর্ট"
              aria-label="অর্ডার CSV এক্সপোর্ট"
            >
              <Download className="h-4 w-4" />
            </button>

            <button
              onClick={() => {
                void getSupabaseClient().auth.signOut().then(({ error }) => {
                  if (error) showToast(error.message);
                });
                setIsAuthenticated(false);
              }}
              className="flex h-10 w-10 items-center justify-center rounded-lg text-stone-500 transition-colors hover:bg-rose-50 hover:text-rose-600"
              title="লগআউট"
              aria-label="লগআউট"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="mx-auto w-full max-w-7xl min-w-0 flex-1 space-y-4 p-3 sm:space-y-6 sm:p-6">
        {catalogLoadError && (
          <div role="alert" className="flex flex-col gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 sm:flex-row sm:items-center sm:justify-between">
            <span>Backend data লোড করা যায়নি। {catalogLoadError}</span>
            <button
              type="button"
              onClick={() => void loadData()}
              disabled={isRefreshing}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-rose-300 bg-white px-3 py-2 text-xs font-bold hover:bg-rose-100 disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              আবার চেষ্টা করুন
            </button>
          </div>
        )}

        {/* Metric Cards Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <div className="flex min-w-0 items-center justify-between gap-2 rounded-xl border border-stone-200 bg-white p-3 shadow-xs sm:p-4">
            <div>
              <span className="text-[11px] font-semibold text-stone-500 sm:text-xs">Total revenue</span>
              <div className="mt-1 break-all text-lg font-black text-emerald-800 sm:text-2xl">
                ৳{totalRevenue.toLocaleString()}
              </div>
              <span className="mt-1 block text-[10px] text-stone-500">
                {dateFilteredOrders.length} orders in selected period
              </span>
            </div>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 sm:h-10 sm:w-10">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>

          <div className="flex min-w-0 items-center justify-between gap-2 rounded-xl border border-stone-200 bg-white p-3 shadow-xs sm:p-4">
            <div>
              <span className="text-[11px] font-semibold text-stone-500 sm:text-xs">Orders in period</span>
              <div className="mt-1 text-lg font-black text-stone-900 sm:text-2xl">
                {dateFilteredOrders.length}
              </div>
            </div>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-700 sm:h-10 sm:w-10">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>

          <div className="flex min-w-0 items-center justify-between gap-2 rounded-xl border border-stone-200 bg-white p-3 shadow-xs sm:p-4">
            <div>
              <span className="text-[11px] font-semibold text-stone-500 sm:text-xs">কম্বো অফার</span>
              <div className="mt-1 text-lg font-black text-amber-700 sm:text-2xl">
                {combos.length} টি
              </div>
            </div>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 sm:h-10 sm:w-10">
              <Layers className="w-5 h-5" />
            </div>
          </div>

          <div className="flex min-w-0 items-center justify-between gap-2 rounded-xl border border-stone-200 bg-white p-3 shadow-xs sm:p-4">
            <div>
              <span className="text-[11px] font-semibold text-stone-500 sm:text-xs">প্রোডাক্ট আইটেম</span>
              <div className="mt-1 text-lg font-black text-indigo-700 sm:text-2xl">
                {productsList.length} টি
              </div>
            </div>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700 sm:h-10 sm:w-10">
              <Boxes className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Tab Controls: Orders | Combos | Products | Coupons | Slider | Settings */}
        <div className="grid grid-cols-4 overflow-hidden rounded-t-xl border-b border-stone-200 bg-white pt-2 sm:flex sm:overflow-x-auto sm:px-4">
          {/* Tab 1: Orders */}
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex min-w-0 items-center justify-center gap-1 border-b-2 px-1 py-3 text-[11px] font-bold transition-all sm:justify-start sm:gap-2 sm:px-4 sm:text-sm ${
              activeTab === 'orders'
                ? 'border-emerald-700 text-emerald-800'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="truncate sm:whitespace-nowrap">অর্ডার ({dateFilteredOrders.length})</span>
          </button>

          {/* Tab 2: Combos Table (Converted from previous products bundle table) */}
          <button
            onClick={() => setActiveTab('combos')}
            className={`flex min-w-0 items-center justify-center gap-1 border-b-2 px-1 py-3 text-[11px] font-bold transition-all sm:justify-start sm:gap-2 sm:px-4 sm:text-sm ${
              activeTab === 'combos'
                ? 'border-emerald-700 text-emerald-800'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span className="truncate sm:whitespace-nowrap">কম্বো ({combos.length})</span>
            <span className="hidden text-[10px] font-semibold sm:block sm:rounded sm:bg-amber-100 sm:px-1.5 sm:py-0.2 sm:text-amber-800">
              Combos
            </span>
          </button>

          {/* Tab 3: Products Table (Base catalog items) */}
          <button
            onClick={() => setActiveTab('products')}
            className={`flex min-w-0 items-center justify-center gap-1 border-b-2 px-1 py-3 text-[11px] font-bold transition-all sm:justify-start sm:gap-2 sm:px-4 sm:text-sm ${
              activeTab === 'products'
                ? 'border-emerald-700 text-emerald-800'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Boxes className="w-4 h-4" />
            <span className="truncate sm:whitespace-nowrap">প্রোডাক্ট ({productsList.length})</span>
            <span className="hidden text-[10px] font-semibold sm:block sm:rounded sm:bg-indigo-100 sm:px-1.5 sm:py-0.2 sm:text-indigo-800">
              Products
            </span>
          </button>

          <button
            onClick={() => setActiveTab('coupons')}
            className={`flex min-w-0 items-center justify-center gap-1 border-b-2 px-1 py-3 text-[11px] font-bold transition-all sm:justify-start sm:gap-2 sm:px-4 sm:text-sm ${
              activeTab === 'coupons'
                ? 'border-emerald-700 text-emerald-800'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Tag className="w-4 h-4" />
            <span className="truncate sm:whitespace-nowrap">কুপন ({coupons.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('slider')}
            className={`flex min-w-0 items-center justify-center gap-1 border-b-2 px-1 py-3 text-[11px] font-bold transition-all sm:justify-start sm:gap-2 sm:px-4 sm:text-sm ${
              activeTab === 'slider'
                ? 'border-emerald-700 text-emerald-800'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span className="truncate sm:whitespace-nowrap">স্লাইডার ({sliderImages.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('gallery')}
            className={`flex min-w-0 items-center justify-center gap-1 border-b-2 px-1 py-3 text-[11px] font-bold transition-all sm:justify-start sm:gap-2 sm:px-4 sm:text-sm ${
              activeTab === 'gallery'
                ? 'border-emerald-700 text-emerald-800'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span className="truncate sm:whitespace-nowrap">ছবি কার্ড ({homepageImageCards.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex min-w-0 items-center justify-center gap-1 border-b-2 px-1 py-3 text-[11px] font-bold transition-all sm:justify-start sm:gap-2 sm:px-4 sm:text-sm ${
              activeTab === 'settings'
                ? 'border-emerald-700 text-emerald-800'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span className="truncate sm:whitespace-nowrap">সেটিংস</span>
          </button>
        </div>

        {/* TAB 1: ORDERS MANAGEMENT */}
        {activeTab === 'orders' && (
          <div className="min-w-0 space-y-4 rounded-b-xl border border-t-0 border-stone-200 bg-white p-3 sm:p-6">
            <section className="rounded-xl border border-stone-200 bg-stone-50 p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <div className="flex items-center gap-2 text-sm font-bold text-stone-800">
                    <CalendarDays className="h-4 w-4 text-emerald-700" />
                    <label htmlFor="order-date-range">Order date range</label>
                  </div>
                  <p className="mt-1 text-xs text-stone-500">
                    View and export orders by the date they were placed.
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <select
                    id="order-date-range"
                    value={dateRange}
                    onChange={(event) => {
                      if (isOrderDateRange(event.target.value)) {
                        setDateRange(event.target.value);
                      }
                      setSelectedOrderIds([]);
                    }}
                    className="min-h-10 rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm font-semibold text-stone-800 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20"
                  >
                    <option value="today">Today</option>
                    <option value="this-week">This week</option>
                    <option value="this-month">This month</option>
                    <option value="all">All time</option>
                    <option value="custom">Custom date range</option>
                  </select>
                  {dateRange === 'custom' && (
                    <>
                      <label className="flex items-center gap-2 rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs font-semibold text-stone-600">
                        From
                        <input
                          type="date"
                          value={customStartDate}
                          max={customEndDate}
                          onChange={(event) => {
                            setCustomStartDate(event.target.value);
                            setSelectedOrderIds([]);
                          }}
                          className="min-w-0 flex-1 bg-transparent text-sm text-stone-800 outline-none"
                        />
                      </label>
                      <label className="flex items-center gap-2 rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs font-semibold text-stone-600">
                        To
                        <input
                          type="date"
                          value={customEndDate}
                          min={customStartDate}
                          onChange={(event) => {
                            setCustomEndDate(event.target.value);
                            setSelectedOrderIds([]);
                          }}
                          className="min-w-0 flex-1 bg-transparent text-sm text-stone-800 outline-none"
                        />
                      </label>
                    </>
                  )}
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-stone-200 pt-3">
                <span className="text-xs font-semibold text-stone-600">
                  {dateFilteredOrders.length} orders
                  {dateRange === 'today' && ' today'}
                  {dateRange === 'this-week' && ' this week'}
                  {dateRange === 'this-month' && ' this month'}
                  {dateRange === 'all' && ' across all dates'}
                  {dateRange === 'custom' && ` from ${customStartDate} to ${customEndDate}`}
                </span>
                <span className="text-xs text-stone-500">
                  Showing {filteredOrders.length} after search and status filters
                </span>
              </div>
              {invalidCustomRange && (
                <p className="mt-2 text-xs font-semibold text-rose-700">
                  Start date must be on or before the end date.
                </p>
              )}
            </section>

            {/* Search & Status Filters */}
            <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
              {/* Search Box */}
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="অর্ডার আইডি, গ্রাহকের নাম বা মোবাইল নাম্বার দিয়ে খুঁজুন..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-stone-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-[#fdfdfc]"
                />
              </div>

              {/* Status Segmented Buttons */}
              <div className="grid grid-cols-3 gap-1 pb-1 text-[11px] sm:flex sm:flex-wrap sm:pb-0 sm:text-xs">
                {[
                  { key: 'all', label: 'All' },
                  { key: 'pending', label: 'Pending' },
                  { key: 'confirmed', label: 'Confirmed' },
                  { key: 'processing', label: 'Processing' },
                  { key: 'shipped', label: 'Shipped' },
                  { key: 'delivered', label: 'Delivered' },
                  { key: 'printed', label: 'Printed' },
                  { key: 'cancelled', label: 'Cancelled' },
                ].map((st) => (
                  <button
                    key={st.key}
                    onClick={() => setStatusFilter(st.key)}
                    className={`min-w-0 rounded-lg px-2 py-1.5 font-bold transition-all ${
                      statusFilter === st.key
                        ? 'bg-emerald-700 text-white shadow-xs'
                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-stone-200 bg-stone-50 p-3">
              <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-stone-700">
                <input
                  type="checkbox"
                  checked={allVisibleOrdersSelected}
                  onChange={toggleVisibleOrderSelection}
                  disabled={paginatedOrders.length === 0 || isPrintingOrders}
                  className="h-4 w-4 rounded border-stone-300 accent-emerald-700"
                  aria-label="Select all orders on this page"
                />
                Select this page
              </label>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-stone-600">
                  {selectedOrders.length} selected
                </span>
                {selectedOrderIds.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedOrderIds([])}
                    disabled={isPrintingOrders}
                    className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs font-bold text-stone-700 hover:bg-stone-100 disabled:opacity-50"
                  >
                    Clear selection
                  </button>
                )}
                <button
                  type="button"
                  onClick={handlePrintSelectedOrders}
                  disabled={selectedOrders.length === 0 || isPrintingOrders}
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Printer className="h-4 w-4" />
                  {isPrintingOrders ? 'Preparing invoices...' : 'Print now'}
                </button>
              </div>
            </div>

            {/* Mobile order cards */}
            <div className="space-y-3 md:hidden">
              {filteredOrders.length === 0 ? (
                <div className="rounded-xl border border-stone-200 py-8 text-center text-sm text-stone-500">
                  কোনো অর্ডার পাওয়া যায়নি।
                </div>
              ) : paginatedOrders.map((order) => {
                const bundleImage = combos.find((combo) => combo.id === order.bundleId)?.imageUrl
                  || productsList.find((product) => product.id === order.bundleId)?.imageUrl;
                const whatsappUrl = `https://wa.me/88${order.customerPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                  `সালামু আলাইকুম ${order.customerName}! প্যারামাউন্ট ফুডস থেকে আপনার লাচ্ছা সেমাই এর অর্ডার #${order.orderId} সম্পর্কে যোগাযোগ করছি।`
                )}`;

                return (
                  <article key={order.orderId} className="min-w-0 rounded-xl border border-stone-200 bg-stone-50 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <input
                        type="checkbox"
                        checked={selectedOrderIds.includes(order.orderId)}
                        onChange={() => toggleOrderSelection(order.orderId)}
                        disabled={isPrintingOrders}
                        className="mt-1 h-4 w-4 shrink-0 rounded border-stone-300 accent-emerald-700"
                        aria-label={`Select order ${order.orderId}`}
                      />
                      <div className="min-w-0">
                        <p className="break-all font-mono text-xs font-bold text-emerald-800">#{order.orderId}</p>
                        <p className="mt-1 break-words text-sm font-bold text-stone-900">{order.customerName}</p>
                        <a href={`tel:${order.customerPhone}`} className="text-xs text-stone-600 underline">
                          {order.customerPhone}
                        </a>
                      </div>
                      <span className="shrink-0 text-sm font-black text-stone-900">৳{order.totalAmount}</span>
                    </div>

                    <div className="mt-3 space-y-1 border-t border-stone-200 pt-3 text-xs">
                      <div className="flex items-center gap-2">
                        {bundleImage ? (
                          <img src={bundleImage} alt={order.bundleName} className="h-12 w-12 shrink-0 rounded-lg border border-stone-200 object-cover" />
                        ) : (
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-400">
                            <Package className="h-5 w-5" />
                          </div>
                        )}
                        <p className="break-words font-semibold text-stone-800">{order.bundleName} · {order.quantity} টি</p>
                      </div>
                      <p className="break-words text-stone-600">{order.customerAddress}</p>
                      <p className="text-stone-500">{order.deliveryArea === 'dhaka' ? 'ঢাকার ভেতরে' : 'ঢাকার বাইরে'} · {order.paymentMethod === 'cod' ? 'ক্যাশ অন ডেলিভারি' : 'bKash/Nagad'}</p>
                      {order.bkashTxId && <p className="break-all text-stone-500">Trx: {order.bkashTxId}</p>}
                      {order.note && <p className="break-words text-amber-800">নোট: {order.note}</p>}
                      {order.courierTrackingCode && (
                        <p className="break-all text-indigo-700">
                          {order.courierName || 'কুরিয়ার'} · {order.courierTrackingCode}
                        </p>
                      )}
                    </div>

                    {!order.courierTrackingCode && (
                      <button
                        type="button"
                        onClick={() => {
                          const courier = prompt(
                            'কুরিয়ারের নাম লিখুন (যেমন: Steadfast, Sundarban, Pathao):',
                            'Steadfast',
                          );
                          if (!courier) return;
                          const code = prompt('ট্র্যাকিং কোড বা পার্সেল আইডি লিখুন:');
                          if (code) {
                            handleCourierUpdate(order.orderId, courier, code);
                          }
                        }}
                        className="mt-2 text-xs font-semibold text-emerald-700 underline"
                      >
                        + কুরিয়ার কোড যোগ করুন
                      </button>
                    )}

                    <label className="mt-3 block text-[11px] font-bold text-stone-600">
                      Order status
                      <select
                        value={order.status}
                        onChange={(event) => {
                          const status = event.target.value;
                          if (isOrderStatus(status)) handleStatusChange(order.orderId, status);
                        }}
                        disabled={updatingOrderId === order.orderId}
                        className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-800 disabled:opacity-50"
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="printed">Printed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </label>

                    <div className="mt-3 flex items-center justify-between gap-2 border-t border-stone-200 pt-2">
                      <div className="flex gap-2">
                        <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="rounded-lg bg-emerald-100 px-3 py-2 text-xs font-bold text-emerald-800">
                          WhatsApp
                        </a>
                        <a href={`tel:${order.customerPhone}`} className="rounded-lg bg-white px-3 py-2 text-xs font-bold text-stone-700">
                          কল
                        </a>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteOrder(order.orderId)}
                        className="rounded-lg p-2 text-rose-600 hover:bg-rose-50"
                        aria-label={`অর্ডার ${order.orderId} মুছুন`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>

            {/* Orders Table */}
            <div className="hidden overflow-x-auto rounded-xl border border-stone-200 md:block">
              <table className="w-full min-w-[1040px] text-left text-xs border-collapse">
                <thead className="bg-stone-50 border-b border-stone-200 text-stone-700 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-3">
                      <input
                        type="checkbox"
                        checked={allVisibleOrdersSelected}
                        onChange={toggleVisibleOrderSelection}
                        disabled={paginatedOrders.length === 0 || isPrintingOrders}
                        className="h-4 w-4 rounded border-stone-300 accent-emerald-700"
                        aria-label="Select all orders on this page"
                      />
                    </th>
                    <th className="py-3 px-3">অর্ডার আইডি</th>
                    <th className="py-3 px-3">গ্রাহকের বিবরণ</th>
                    <th className="py-3 px-3">প্যাকেজ / কম্বো</th>
                    <th className="py-3 px-3">মোট বিল</th>
                    <th className="py-3 px-3">পেমেন্ট</th>
                    <th className="py-3 px-3">রিয়েল-টাইম স্ট্যাটাস (Click Badge to Update)</th>
                    <th className="py-3 px-3">কুরিয়ার ট্র্যাকিং</th>
                    <th className="py-3 px-3 text-right">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-stone-500">
                        কোনো অর্ডার পাওয়া যায়নি।
                      </td>
                    </tr>
                  ) : (
                    paginatedOrders.map((order) => {
                      const bundleImage = combos.find((combo) => combo.id === order.bundleId)?.imageUrl
                        || productsList.find((product) => product.id === order.bundleId)?.imageUrl;
                      const whatsappUrl = `https://wa.me/88${order.customerPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                        `সালামু আলাইকুম ${order.customerName}! প্যারামাউন্ট ফুডস থেকে আপনার লাচ্ছা সেমাই এর অর্ডার #${order.orderId} সম্পর্কে যোগাযোগ করছি।`
                      )}`;

                      return (
                        <tr key={order.orderId} className="hover:bg-amber-50/20 transition-colors">
                          <td className="py-3 px-3 align-top">
                            <input
                              type="checkbox"
                              checked={selectedOrderIds.includes(order.orderId)}
                              onChange={() => toggleOrderSelection(order.orderId)}
                              disabled={isPrintingOrders}
                              className="h-4 w-4 rounded border-stone-300 accent-emerald-700"
                              aria-label={`Select order ${order.orderId}`}
                            />
                          </td>
                          {/* Order ID & Date */}
                          <td className="py-3 px-3 font-mono font-bold text-stone-900 align-top">
                            <span className="text-emerald-800">#{order.orderId}</span>
                            <span className="block text-[10px] text-stone-400 font-normal">
                              {new Date(order.createdAt).toLocaleDateString('bn-BD', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </td>

                          {/* Customer Info */}
                          <td className="py-3 px-3 align-top">
                            <div className="font-bold text-stone-900">{order.customerName}</div>
                            <div className="font-mono text-stone-600">{order.customerPhone}</div>
                            <div className="text-[11px] text-stone-500 max-w-xs line-clamp-2 mt-0.5">
                              {order.customerAddress}
                            </div>
                            <span className="inline-block mt-1 text-[10px] bg-stone-100 text-stone-700 px-1.5 py-0.2 rounded">
                              {order.deliveryArea === 'dhaka' ? 'ঢাকার ভেতরে (৳৭০)' : 'ঢাকার বাইরে (৳১৩০)'}
                            </span>
                            {order.note && (
                              <p className="text-[10px] text-amber-800 italic mt-0.5">
                                নোট: {order.note}
                              </p>
                            )}
                          </td>

                          {/* Bundle & Qty */}
                          <td className="py-3 px-3 align-top">
                            <div className="flex items-center gap-2">
                              {bundleImage ? (
                                <img src={bundleImage} alt={order.bundleName} className="h-12 w-12 shrink-0 rounded-lg border border-stone-200 object-cover" />
                              ) : (
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-400">
                                  <Package className="h-5 w-5" />
                                </div>
                              )}
                              <div>
                                <span className="font-bold text-stone-900">{order.bundleName}</span>
                                <span className="block text-[11px] text-stone-500">
                                  পরিমাণ: <strong>{order.quantity} টি</strong>
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Total */}
                          <td className="py-3 px-3 align-top font-bold text-stone-900 text-sm">
                            ৳{order.totalAmount}
                          </td>

                          {/* Payment Method */}
                          <td className="py-3 px-3 align-top">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                                order.paymentMethod === 'cod'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-pink-100 text-pink-800 font-mono'
                              }`}
                            >
                              {order.paymentMethod === 'cod' ? 'ক্যাশ অন ডেলিভারি' : 'bKash/Nagad'}
                            </span>
                            {order.bkashTxId && (
                              <span className="block text-[10px] font-mono text-stone-500 mt-0.5">
                                Trx: {order.bkashTxId}
                              </span>
                            )}
                          </td>

                          {/* Clickable Status Badges (Pending, Shipped, Delivered) */}
                          <td className="py-3 px-3 align-top min-w-[220px]">
                            <div className="flex items-center gap-1.5 mb-1.5">
                              <span className="text-[10px] text-stone-400 font-semibold uppercase">বর্তমান:</span>
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                                  order.status === 'pending'
                                    ? 'bg-amber-100 text-amber-900 border-amber-300'
                                    : order.status === 'confirmed'
                                    ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                                    : order.status === 'printed'
                                    ? 'bg-violet-100 text-violet-900 border-violet-300'
                                    : order.status === 'processing'
                                    ? 'bg-sky-100 text-sky-900 border-sky-300'
                                    : order.status === 'shipped'
                                    ? 'bg-indigo-100 text-indigo-900 border-indigo-300'
                                    : order.status === 'delivered'
                                    ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                                    : 'bg-rose-100 text-rose-900 border-rose-300'
                                }`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    order.status === 'pending'
                                      ? 'bg-amber-600 animate-pulse'
                                      : order.status === 'confirmed' || order.status === 'delivered'
                                      ? 'bg-emerald-600'
                                      : order.status === 'printed'
                                      ? 'bg-violet-600'
                                      : order.status === 'processing'
                                      ? 'bg-sky-600 animate-pulse'
                                      : order.status === 'shipped'
                                      ? 'bg-indigo-600 animate-pulse'
                                      : 'bg-rose-600'
                                  }`}
                                />
                                <span>{ORDER_STATUS_LABELS[order.status]}</span>
                              </span>
                            </div>

                            {/* Clickable Badges Group: Pending, Shipped, Delivered */}
                            <div className="flex flex-wrap items-center gap-1">
                              {/* 1. Pending Badge */}
                              <button
                                type="button"
                                onClick={() => handleStatusChange(order.orderId, 'pending')}
                                disabled={updatingOrderId === order.orderId}
                                className={`px-2 py-1 rounded-md text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer border ${
                                  order.status === 'pending'
                                    ? 'bg-amber-600 text-white border-amber-700 shadow-xs ring-2 ring-amber-400/50'
                                    : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200'
                                }`}
                                title="ক্লিক করে পেন্ডিং স্ট্যাটাস সেট করুন"
                              >
                                <Clock className="w-3 h-3" />
                                <span>Pending</span>
                              </button>

                              {/* Confirmed Badge */}
                              <button
                                type="button"
                                onClick={() => handleStatusChange(order.orderId, 'confirmed')}
                                disabled={updatingOrderId === order.orderId}
                                className={`px-2 py-1 rounded-md text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer border ${
                                  order.status === 'confirmed'
                                    ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs ring-2 ring-emerald-400/50'
                                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
                                }`}
                                title="অর্ডার নিশ্চিত করুন"
                              >
                                <Check className="w-3 h-3" />
                                <span>Confirm</span>
                              </button>

                              {/* Processing Badge */}
                              <button
                                type="button"
                                onClick={() => handleStatusChange(order.orderId, 'processing')}
                                disabled={updatingOrderId === order.orderId}
                                className={`px-2 py-1 rounded-md text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer border ${
                                  order.status === 'processing'
                                    ? 'bg-sky-700 text-white border-sky-800 shadow-xs ring-2 ring-sky-400/50'
                                    : 'bg-sky-50 hover:bg-sky-100 text-sky-800 border-sky-200'
                                }`}
                                title="Mark order as processing"
                              >
                                <Package className="w-3 h-3" />
                                <span>Processing</span>
                              </button>

                              {/* 2. Shipped Badge */}
                              <button
                                type="button"
                                onClick={() => handleStatusChange(order.orderId, 'shipped')}
                                disabled={updatingOrderId === order.orderId}
                                className={`px-2 py-1 rounded-md text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer border ${
                                  order.status === 'shipped'
                                    ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs ring-2 ring-indigo-400/50'
                                    : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border-indigo-200'
                                }`}
                                title="ক্লিক করে Shipped / কুরিয়ারে হস্তান্তর সেট করুন"
                              >
                                <Truck className="w-3 h-3" />
                                <span>Shipped</span>
                              </button>

                              {/* 3. Delivered Badge */}
                              <button
                                type="button"
                                onClick={() => handleStatusChange(order.orderId, 'delivered')}
                                disabled={updatingOrderId === order.orderId}
                                className={`px-2 py-1 rounded-md text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer border ${
                                  order.status === 'delivered'
                                    ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs ring-2 ring-emerald-400/50'
                                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
                                }`}
                                title="ক্লিক করে Delivered / সফল ডেলিভারি সেট করুন"
                              >
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Delivered</span>
                              </button>

                              {/* Printed Badge */}
                              <button
                                type="button"
                                onClick={() => handleStatusChange(order.orderId, 'printed')}
                                disabled={updatingOrderId === order.orderId}
                                className={`px-2 py-1 rounded-md text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer border ${
                                  order.status === 'printed'
                                    ? 'bg-violet-700 text-white border-violet-800 shadow-xs ring-2 ring-violet-400/50'
                                    : 'bg-violet-50 hover:bg-violet-100 text-violet-800 border-violet-200'
                                }`}
                                title="Mark order as printed"
                              >
                                <Printer className="w-3 h-3" />
                                <span>Printed</span>
                              </button>

                              {/* Cancel Toggle Button */}
                              <button
                                type="button"
                                onClick={() => {
                                  const next = order.status === 'cancelled' ? 'pending' : 'cancelled';
                                  handleStatusChange(order.orderId, next);
                                }}
                                disabled={updatingOrderId === order.orderId}
                                className={`px-1.5 py-1 rounded-md text-[10px] font-semibold transition-all cursor-pointer border ${
                                  order.status === 'cancelled'
                                    ? 'bg-rose-600 text-white border-rose-700 shadow-xs'
                                    : 'bg-stone-50 hover:bg-rose-50 text-stone-500 hover:text-rose-700 border-stone-200'
                                }`}
                                title={order.status === 'cancelled' ? 'পেন্ডিং-এ ফেরত নিন' : 'অর্ডার বাতিল করুন'}
                              >
                                {order.status === 'cancelled' ? 'বাতিল' : 'Cancel'}
                              </button>
                            </div>

                            {/* Real-time saving status spinner */}
                            {updatingOrderId === order.orderId && (
                              <div className="flex items-center gap-1 mt-1 text-[10px] text-emerald-700 font-semibold animate-pulse">
                                <div className="w-2.5 h-2.5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                                <span>ডাটাবেস রিয়েল-টাইম সেভ হচ্ছে...</span>
                              </div>
                            )}
                          </td>

                          {/* Courier Tracking */}
                          <td className="py-3 px-3 align-top">
                            {order.courierTrackingCode ? (
                              <div>
                                <span className="font-bold text-[11px] text-stone-800 block">
                                  {order.courierName || 'কুরিয়ার'}
                                </span>
                                <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded">
                                  {order.courierTrackingCode}
                                </span>
                              </div>
                            ) : (
                              <button
                                onClick={() => {
                                  const courier = prompt(
                                    'কুরিয়ারের নাম লিখুন (যেমন: Steadfast, Sundarban, Pathao):',
                                    'Steadfast'
                                  );
                                  if (!courier) return;
                                  const code = prompt('ট্র্যাকিং কোড বা পার্সেল আইডি লিখুন:');
                                  if (code) {
                                    handleCourierUpdate(order.orderId, courier, code);
                                  }
                                }}
                                className="text-[10px] text-emerald-700 hover:text-emerald-900 underline font-semibold cursor-pointer"
                              >
                                + কুরিয়ার কোড যোগ করুন
                              </button>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-3 align-top text-right space-x-1 whitespace-nowrap">
                            <a
                              href={whatsappUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex p-1.5 text-[#128C7E] hover:bg-emerald-50 rounded-lg transition-colors"
                              title="WhatsApp এ মেসেজ দিন"
                            >
                              <MessageCircle className="w-4 h-4 fill-current" />
                            </a>

                            <a
                              href={`tel:${order.customerPhone}`}
                              className="inline-flex p-1.5 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors"
                              title="সরাসরি কল করুন"
                            >
                              <Phone className="w-4 h-4" />
                            </a>

                            <button
                              onClick={() => handleDeleteOrder(order.orderId)}
                              className="inline-flex p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="অর্ডার মুছুন"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-3 rounded-xl border border-stone-200 bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-3 text-xs text-stone-600">
                <span>
                  Showing {filteredOrders.length === 0 ? 0 : pageStartIndex + 1}-
                  {Math.min(pageStartIndex + pageSize, filteredOrders.length)} of {filteredOrders.length}
                </span>
                <label className="flex items-center gap-2">
                  Rows per page
                  <select
                    value={pageSize}
                    onChange={(event) => {
                      const nextPageSize = Number(event.target.value);
                      if ([10, 25, 50].includes(nextPageSize)) setPageSize(nextPageSize);
                    }}
                    className="rounded-lg border border-stone-300 bg-white px-2 py-1.5 font-semibold text-stone-800 outline-none focus:border-emerald-600"
                    aria-label="Rows per page"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                  </select>
                </label>
              </div>
              <div className="flex items-center justify-between gap-1 sm:justify-end">
                <span className="mr-2 whitespace-nowrap text-xs font-semibold text-stone-600">
                  Page {displayedPage} of {pageCount}
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentPage(1)}
                  disabled={displayedPage === 1}
                  className="rounded-lg border border-stone-300 p-2 text-stone-700 transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="First page"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                  disabled={displayedPage === 1}
                  className="rounded-lg border border-stone-300 p-2 text-stone-700 transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentPage((page) => Math.min(pageCount, page + 1))}
                  disabled={displayedPage === pageCount}
                  className="rounded-lg border border-stone-300 p-2 text-stone-700 transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Next page"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentPage(pageCount)}
                  disabled={displayedPage === pageCount}
                  className="rounded-lg border border-stone-300 p-2 text-stone-700 transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Last page"
                >
                  <ChevronsRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: COMBO OFFERS TABLE (কম্বো অফার টেবিল - Converted Table) */}
        {activeTab === 'combos' && (
          <div className="min-w-0 space-y-6 rounded-b-xl border border-t-0 border-stone-200 bg-white p-3 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="bg-amber-100 text-amber-900 text-xs font-bold px-2.5 py-0.5 rounded-md flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5" />
                    <span>Supabase table: public.combos</span>
                  </span>
                  <span className="text-xs text-stone-400">|</span>
                  <span className="text-xs font-semibold text-emerald-700">কনভার্ট করা কম্বো টেবিল</span>
                </div>
                <h3 className="text-base sm:text-lg font-black text-stone-900 mt-1">
                  কম্বো অফার ও বান্ডেল প্যাকেজ তালিকা (Combo Offers Table)
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  এখানকার কম্বোগুলো storefront-এ দেখাবে। কোনো কম্বো না থাকলে নতুন কম্বো তৈরি করুন।
                </p>
              </div>
              <button
                type="button"
                onClick={openNewComboForm}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-800"
              >
                <Plus className="h-4 w-4" />
                নতুন কম্বো
              </button>
            </div>

            {/* Combos Grid Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {combos.length === 0 && (
                <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 px-5 py-10 text-center md:col-span-3">
                  <Layers className="mx-auto h-9 w-9 text-stone-400" />
                  <h4 className="mt-3 text-sm font-bold text-stone-800">কোনো কম্বো তৈরি করা হয়নি</h4>
                  <p className="mt-1 text-xs text-stone-600">নতুন কম্বো যোগ করলে তা storefront-এ প্রকাশিত হবে।</p>
                  <button type="button" onClick={openNewComboForm} className="mt-4 rounded-lg bg-emerald-700 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-800">
                    কম্বো তৈরি করুন
                  </button>
                </div>
              )}
              {combos.map((combo) => (
                <div
                  key={combo.id}
                  className="bg-stone-50 rounded-2xl p-5 border border-stone-200 flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden"
                >
                  {combo.badge && (
                    <div className="absolute top-0 right-0 bg-amber-500 text-white font-bold text-[10px] px-3 py-1 rounded-bl-xl shadow-xs">
                      {combo.badge}
                    </div>
                  )}

                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                        {combo.weight}
                      </span>
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded ${
                          combo.inStock
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {combo.inStock ? 'ইন স্টক' : 'আউট অফ স্টক'}
                      </span>
                    </div>

                    <h4 className="font-extrabold text-stone-900 text-base">{combo.name}</h4>
                    <p className="text-xs text-stone-500 mt-0.5">{combo.subtitle}</p>

                    {combo.includedProductIds && (
                      <div className="mt-2 text-[11px] bg-white/80 border border-stone-200 rounded-lg p-2 text-stone-600">
                        <span className="font-semibold text-stone-700">কম্বোতে সংযুক্ত আইটেম:</span>
                        <div className="font-mono text-[10px] text-emerald-800 mt-0.5">
                          {combo.includedProductIds}
                        </div>
                      </div>
                    )}

                    <div className="mt-4 p-3 bg-white rounded-xl border border-stone-200 space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-stone-500">অফার মূল্য (Sale Price):</span>
                        <strong className="text-stone-900 text-sm font-bold">৳{combo.salePrice}</strong>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-stone-500">রেগুলার মূল্য (Original):</span>
                        <span className="text-stone-400 line-through">৳{combo.originalPrice}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-stone-500">গ্রাহকের সঞ্চয় (Discount):</span>
                        <span className="text-rose-600 font-bold">৳{combo.savings ?? (combo.originalPrice - combo.salePrice)} ছাড়</span>
                      </div>
                      <div className="flex justify-between text-xs pt-1 border-t border-stone-100">
                        <span className="text-stone-500">কম্বো স্টক (Stock):</span>
                        <span className="font-bold text-emerald-700">{combo.stockCount} টি প্যাকেজ</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-stone-200">
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setComboImageFile(null);
                          setIsCreatingCombo(false);
                          setEditingCombo({ ...combo });
                        }}
                        className="flex-1 bg-[#0073aa] hover:bg-[#005a87] text-white font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>এডিট</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDeleteCombo(combo)}
                        aria-label={`${combo.name} মুছুন`}
                        className="rounded-xl border border-rose-200 px-3 text-rose-600 hover:bg-rose-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Edit Combo Modal */}
            {editingCombo && (
              <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-2 backdrop-blur-xs sm:p-4">
                <div className="my-auto max-h-[calc(100dvh-1rem)] w-full max-w-md overflow-y-auto rounded-2xl border border-stone-200 bg-white p-4 shadow-2xl sm:max-h-[calc(100dvh-2rem)] sm:p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-extrabold text-stone-900 text-base">
                      {isCreatingCombo ? 'নতুন কম্বো তৈরি করুন' : `কম্বো এডিট: ${editingCombo.name}`}
                    </h4>
                    <span className="text-[10px] font-mono bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                      ID: {editingCombo.id}
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 mb-4">
                    কম্বোর বর্ণনা, মূল্য, স্টক, ছবি এবং storefront status পরিচালনা করুন।
                  </p>

                  <form onSubmit={handleSaveCombo} className="space-y-4">
                    <ImageUploadField
                      currentImageUrl={editingCombo.imageUrl}
                      onFileChange={setComboImageFile}
                    />
                    <label className="block text-xs font-bold text-stone-700">
                      কম্বোর নাম
                      <input
                        type="text"
                        maxLength={140}
                        value={editingCombo.name}
                        onChange={(event) => setEditingCombo({ ...editingCombo, name: event.target.value })}
                        className="mt-1 w-full rounded-xl border px-3 py-2"
                        required
                      />
                    </label>
                    <label className="block text-xs font-bold text-stone-700">
                      সংক্ষিপ্ত বর্ণনা
                      <input
                        type="text"
                        maxLength={180}
                        value={editingCombo.subtitle}
                        onChange={(event) => setEditingCombo({ ...editingCombo, subtitle: event.target.value })}
                        className="mt-1 w-full rounded-xl border px-3 py-2"
                      />
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <label className="block text-xs font-bold text-stone-700">
                        ওজন / সাইজ
                        <input
                          type="text"
                          maxLength={80}
                          value={editingCombo.weight}
                          onChange={(event) => setEditingCombo({ ...editingCombo, weight: event.target.value })}
                          className="mt-1 w-full rounded-xl border px-3 py-2"
                          required
                        />
                      </label>
                      <label className="block text-xs font-bold text-stone-700">
                        বক্স সংখ্যা
                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={editingCombo.boxes}
                          onChange={(event) => setEditingCombo({ ...editingCombo, boxes: Number(event.target.value) })}
                          className="mt-1 w-full rounded-xl border px-3 py-2"
                          required
                        />
                      </label>
                    </div>
                    <label className="block text-xs font-bold text-stone-700">
                      বিস্তারিত বর্ণনা
                      <textarea
                        rows={3}
                        maxLength={500}
                        value={editingCombo.description}
                        onChange={(event) => setEditingCombo({ ...editingCombo, description: event.target.value })}
                        className="mt-1 w-full rounded-xl border px-3 py-2"
                      />
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <label className="block text-xs font-bold text-stone-700">
                        Badge (optional)
                        <input
                          type="text"
                          maxLength={50}
                          value={editingCombo.badge ?? ''}
                          onChange={(event) => setEditingCombo({ ...editingCombo, badge: event.target.value || undefined })}
                          className="mt-1 w-full rounded-xl border px-3 py-2"
                        />
                      </label>
                      <label className="block text-xs font-bold text-stone-700">
                        Badge color class
                        <input
                          type="text"
                          value={editingCombo.badgeColor ?? ''}
                          onChange={(event) => setEditingCombo({ ...editingCombo, badgeColor: event.target.value || undefined })}
                          placeholder="bg-amber-600"
                          className="mt-1 w-full rounded-xl border px-3 py-2"
                        />
                      </label>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">
                        বিক্রয় মূল্য (টাকা):
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={editingCombo.salePrice}
                        onChange={(e) =>
                          setEditingCombo({
                            ...editingCombo,
                            salePrice: Number(e.target.value),
                            savings: Number(editingCombo.originalPrice) - Number(e.target.value),
                          })
                        }
                        className="w-full px-3 py-2 border rounded-xl font-bold"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">
                        রেগুলার মূল্য (কাটা মূল্য):
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={editingCombo.originalPrice}
                        onChange={(e) =>
                          setEditingCombo({
                            ...editingCombo,
                            originalPrice: Number(e.target.value),
                            savings: Number(e.target.value) - Number(editingCombo.salePrice),
                          })
                        }
                        className="w-full px-3 py-2 border rounded-xl"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">
                        স্টক প্যাকেজ সংখ্যা:
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={editingCombo.stockCount}
                        onChange={(e) =>
                          setEditingCombo({
                            ...editingCombo,
                            stockCount: Number(e.target.value),
                          })
                        }
                        className="w-full px-3 py-2 border rounded-xl font-bold"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">
                        সংযুক্ত মূল প্রোডাক্টসমূহ (Included Product IDs):
                      </label>
                      <input
                        type="text"
                        value={editingCombo.includedProductIds || ''}
                        onChange={(e) =>
                          setEditingCombo({
                            ...editingCombo,
                            includedProductIds: e.target.value,
                          })
                        }
                        placeholder="প্যাকের মধ্যে থাকা পণ্যের বিবরণ"
                        className="w-full px-3 py-2 border rounded-xl text-xs font-mono"
                      />
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="checkbox"
                        id="comboInStockCheck"
                        checked={editingCombo.inStock}
                        onChange={(e) =>
                          setEditingCombo({
                            ...editingCombo,
                            inStock: e.target.checked,
                          })
                        }
                        className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                      />
                      <label htmlFor="comboInStockCheck" className="text-xs font-bold text-stone-800 cursor-pointer">
                        কম্বো অফারটি স্টকে ও বিক্রয়ে সক্রিয় রাখুন (In Stock)
                      </label>
                    </div>
                    <div className="flex flex-wrap gap-x-5 gap-y-2">
                      <label className="flex items-center gap-2 text-xs font-bold text-stone-800">
                        <input
                          type="checkbox"
                          checked={editingCombo.freeDelivery}
                          onChange={(event) => setEditingCombo({ ...editingCombo, freeDelivery: event.target.checked })}
                          className="h-4 w-4 accent-emerald-600"
                        />
                        ফ্রি ডেলিভারি
                      </label>
                      <label className="flex items-center gap-2 text-xs font-bold text-stone-800">
                        <input
                          type="checkbox"
                          checked={Boolean(editingCombo.popular)}
                          onChange={(event) => setEditingCombo({ ...editingCombo, popular: event.target.checked })}
                          className="h-4 w-4 accent-emerald-600"
                        />
                        জনপ্রিয় অফার হিসেবে দেখান
                      </label>
                    </div>

                    <div className="flex gap-2 pt-3">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingCombo(null);
                          setIsCreatingCombo(false);
                          setComboImageFile(null);
                        }}
                        className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-700 py-2.5 rounded-xl font-bold text-xs cursor-pointer"
                      >
                        বাতিল
                      </button>
                      <button
                        type="submit"
                        disabled={isSavingCatalogItem}
                        className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white py-2.5 rounded-xl font-bold text-xs cursor-pointer shadow-md flex items-center justify-center gap-1.5"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>{isSavingCatalogItem ? 'সেভ হচ্ছে...' : isCreatingCombo ? 'কম্বো তৈরি করুন' : 'কম্বো আপডেট সেভ করুন'}</span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: BASE PRODUCTS CATALOG TABLE (প্রোডাক্ট নাম টেবিল - New Table) */}
        {activeTab === 'products' && (
          <div className="min-w-0 space-y-6 rounded-b-xl border border-t-0 border-stone-200 bg-white p-3 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="bg-indigo-100 text-indigo-900 text-xs font-bold px-2.5 py-0.5 rounded-md flex items-center gap-1">
                    <Boxes className="w-3.5 h-3.5" />
                    <span>Supabase table: public.products</span>
                  </span>
                  <span className="text-xs text-stone-400">|</span>
                  <span className="text-xs font-semibold text-indigo-700">নতুন স্বতন্ত্র প্রোডাক্ট নাম টেবিল</span>
                </div>
                <h3 className="text-base sm:text-lg font-black text-stone-900 mt-1">
                  প্রোডাক্ট ক্যাটালগ ও স্টক তালিকা (Product Name Table)
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  প্রতিটি মূল পণ্য (সেমাই বক্স, গাওয়া ঘি জার, কাজু-জাফরান টপিং ইত্যাদি) এর SKU, ক্রয়মূল্য, বিক্রয়মূল্য ও ইনভেন্টরি ম্যানেজ করুন।
                </p>
              </div>

              {/* Add New Product Button */}
              <button
                type="button"
                onClick={() => {
                  setNewProductImageFile(null);
                  setIsAddingProduct(true);
                }}
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-sm cursor-pointer transition-all self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>নতুন প্রোডাক্ট নাম যোগ করুন</span>
              </button>
            </div>

            {/* Mobile product cards */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:hidden">
              {productsList.length === 0 ? (
                <div className="col-span-full rounded-xl border border-stone-200 py-8 text-center text-sm text-stone-500">
                  কোনো প্রোডাক্ট আইটেম পাওয়া যায়নি। নতুন প্রোডাক্ট যোগ করতে উপরের বাটনে চাপ দিন।
                </div>
              ) : productsList.map((product) => (
                <article key={product.id} className="min-w-0 rounded-xl border border-stone-200 bg-stone-50 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h4 className="break-words text-sm font-bold text-stone-900">{product.name}</h4>
                      <p className="mt-1 text-[11px] text-stone-500">{product.category} · {product.unitWeight}</p>
                    </div>
                    <span className="shrink-0 text-sm font-black text-emerald-800">৳{product.regularPrice}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-stone-600">
                    <span>SKU: {product.sku || 'N/A'}</span>
                    <span>ক্রয়: ৳{product.costPrice}</span>
                    <span>স্টক: {product.stockQuantity}</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-stone-200 pt-2">
                    <button
                      type="button"
                      onClick={async () => {
                        const updatedInStock = !product.inStock;
                        try {
                          await updateProductItem(product.id, { inStock: updatedInStock });
                          setProductsList((prev) =>
                            prev.map((item) => item.id === product.id ? { ...item, inStock: updatedInStock } : item)
                          );
                          showToast(`'${product.name}' এর স্টক স্ট্যাটাস পরিবর্তন হয়েছে`);
                        } catch (error) {
                          console.error('Could not update product stock:', error);
                          showToast(error instanceof Error ? error.message : 'স্টক আপডেট করা যায়নি');
                        }
                      }}
                      className={`rounded-lg px-2.5 py-1.5 text-[11px] font-bold ${
                        product.inStock ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {product.inStock ? '✓ ইন স্টক' : '✕ স্টক নেই'}
                    </button>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingProductImageFile(null);
                          setEditingProduct({ ...product });
                        }}
                        className="rounded-lg p-2 text-stone-600 hover:bg-white"
                        aria-label={`${product.name} এডিট করুন`}
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteProduct(product.id, product.name)}
                        className="rounded-lg p-2 text-rose-600 hover:bg-rose-50"
                        aria-label={`${product.name} মুছুন`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {/* Products Table */}
            <div className="hidden max-w-full overflow-x-auto rounded-xl border border-stone-200 md:block">
              <table className="w-full min-w-[900px] border-collapse text-left text-xs">
                <thead className="bg-stone-50 border-b border-stone-200 text-stone-700 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-3">প্রোডাক্টের নাম</th>
                    <th className="py-3 px-3">SKU কোড</th>
                    <th className="py-3 px-3">ক্যাটাগরি</th>
                    <th className="py-3 px-3">ওজন / মাপ</th>
                    <th className="py-3 px-3">ক্রয়মূল্য (Cost)</th>
                    <th className="py-3 px-3">বিক্রয়মূল্য (Retail)</th>
                    <th className="py-3 px-3">স্টক পরিমাণ</th>
                    <th className="py-3 px-3">স্টক অবস্থা</th>
                    <th className="py-3 px-3 text-right">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {productsList.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-stone-500">
                        কোনো প্রোডাক্ট আইটেম পাওয়া যায়নি। নতুন প্রোডাক্ট যোগ করতে উপরের বাটনে ক্লিক করুন।
                      </td>
                    </tr>
                  ) : (
                    productsList.map((prod) => (
                      <tr key={prod.id} className="hover:bg-indigo-50/20 transition-colors">
                        {/* Name & description */}
                        <td className="py-3 px-3 align-top max-w-xs">
                          <span className="font-extrabold text-stone-900 block text-xs">
                            {prod.name}
                          </span>
                          {prod.description && (
                            <span className="text-[11px] text-stone-500 line-clamp-1 mt-0.5">
                              {prod.description}
                            </span>
                          )}
                          <span className="text-[10px] text-stone-400 font-mono">ID: {prod.id}</span>
                        </td>

                        {/* SKU */}
                        <td className="py-3 px-3 align-top font-mono text-stone-700 font-bold">
                          <span className="bg-stone-100 text-stone-800 px-2 py-0.5 rounded text-[11px]">
                            {prod.sku || 'N/A'}
                          </span>
                        </td>

                        {/* Category */}
                        <td className="py-3 px-3 align-top">
                          <span className="inline-block bg-indigo-50 text-indigo-700 font-semibold px-2 py-0.5 rounded text-[11px]">
                            {prod.category}
                          </span>
                        </td>

                        {/* Weight */}
                        <td className="py-3 px-3 align-top font-bold text-stone-800">
                          {prod.unitWeight}
                        </td>

                        {/* Cost Price */}
                        <td className="py-3 px-3 align-top text-stone-600 font-mono">
                          ৳{prod.costPrice}
                        </td>

                        {/* Regular Retail Price */}
                        <td className="py-3 px-3 align-top font-bold text-emerald-800 text-sm">
                          ৳{prod.regularPrice}
                        </td>

                        {/* Stock */}
                        <td className="py-3 px-3 align-top">
                          <span className="font-bold text-stone-900 text-xs">
                            {prod.stockQuantity} একক
                          </span>
                        </td>

                        {/* In Stock toggle */}
                        <td className="py-3 px-3 align-top">
                          <button
                            type="button"
                            onClick={async () => {
                              const updatedInStock = !prod.inStock;
                              await updateProductItem(prod.id, { inStock: updatedInStock });
                              setProductsList((prev) =>
                                prev.map((p) => (p.id === prod.id ? { ...p, inStock: updatedInStock } : p))
                              );
                              showToast(`'${prod.name}' এর স্টক স্ট্যাটাস পরিবর্তন হয়েছে`);
                            }}
                            className={`px-2 py-1 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                              prod.inStock
                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                            }`}
                            title="ক্লিক করে ইন-স্টক বা আউট-অফ-স্টক টগল করুন"
                          >
                            {prod.inStock ? '✓ ইন স্টক' : '✕ স্টক নেই'}
                          </button>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-3 align-top text-right space-x-1 whitespace-nowrap">
                          <button
                            onClick={() => {
                              setEditingProductImageFile(null);
                              setEditingProduct({ ...prod });
                            }}
                            className="inline-flex p-1.5 text-stone-600 hover:text-emerald-800 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
                            title="প্রোডাক্ট এডিট করুন"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleDeleteProduct(prod.id, prod.name)}
                            className="inline-flex p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="মুছে ফেলুন"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Modal: Add New Product */}
            {isAddingProduct && (
              <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-2 backdrop-blur-xs sm:p-4">
                <div className="my-auto max-h-[calc(100dvh-1rem)] w-full max-w-lg overflow-y-auto rounded-2xl border border-stone-200 bg-white p-4 shadow-2xl sm:max-h-[calc(100dvh-2rem)] sm:p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-extrabold text-stone-900 text-base flex items-center gap-2">
                      <Plus className="w-4 h-4 text-emerald-700" />
                      <span>নতুন প্রোডাক্ট নাম যোগ করুন (New Product)</span>
                    </h4>
                    <span className="text-[10px] font-mono bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded">
                      products table
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 mb-4">
                    নতুন পণ্যের নাম, SKU, ক্যাটাগরি, ওজন ও মূল্য দিয়ে ডাটাবেসে সেভ করুন
                  </p>

                  <form onSubmit={handleCreateProduct} className="space-y-3">
                    <ImageUploadField onFileChange={setNewProductImageFile} />
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">
                        প্রোডাক্টের নাম * :
                      </label>
                      <input
                        type="text"
                        value={newProductForm.name}
                        onChange={(e) =>
                          setNewProductForm({ ...newProductForm, name: e.target.value })
                        }
                        placeholder="যেমন: প্রিমিয়াম জাফরান-পেস্তা গুঁড়ো (৫০ গ্রাম)"
                        className="w-full px-3 py-2 border rounded-xl font-bold text-xs"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs font-bold text-stone-700 mb-1">
                          SKU কোড :
                        </label>
                        <input
                          type="text"
                          value={newProductForm.sku || ''}
                          onChange={(e) =>
                            setNewProductForm({ ...newProductForm, sku: e.target.value })
                          }
                          placeholder="যেমন: LCH-TOP-050"
                          className="w-full px-3 py-2 border rounded-xl font-mono text-xs uppercase"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-stone-700 mb-1">
                          ক্যাটাগরি :
                        </label>
                        <input
                          type="text"
                          value={newProductForm.category}
                          onChange={(e) =>
                            setNewProductForm({ ...newProductForm, category: e.target.value })
                          }
                          placeholder="লাচ্ছা সেমাই / ঘি / বাদাম"
                          className="w-full px-3 py-2 border rounded-xl text-xs"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <div>
                        <label className="block text-xs font-bold text-stone-700 mb-1">
                          ওজন / সাইজ :
                        </label>
                        <input
                          type="text"
                          value={newProductForm.unitWeight}
                          onChange={(e) =>
                            setNewProductForm({ ...newProductForm, unitWeight: e.target.value })
                          }
                          placeholder="৪৫০ গ্রাম"
                          className="w-full px-3 py-2 border rounded-xl text-xs"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-stone-700 mb-1">
                          ক্রয়মূল্য (টাকা):
                        </label>
                        <input
                          type="number"
                          value={newProductForm.costPrice}
                          onChange={(e) =>
                            setNewProductForm({
                              ...newProductForm,
                              costPrice: Number(e.target.value),
                            })
                          }
                          className="w-full px-3 py-2 border rounded-xl text-xs"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-stone-700 mb-1">
                          বিক্রয়মূল্য (টাকা):
                        </label>
                        <input
                          type="number"
                          value={newProductForm.regularPrice}
                          onChange={(e) =>
                            setNewProductForm({
                              ...newProductForm,
                              regularPrice: Number(e.target.value),
                            })
                          }
                          className="w-full px-3 py-2 border rounded-xl font-bold text-xs"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">
                        ইনভেন্টরি স্টক সংখ্যা:
                      </label>
                      <input
                        type="number"
                        value={newProductForm.stockQuantity}
                        onChange={(e) =>
                          setNewProductForm({
                            ...newProductForm,
                            stockQuantity: Number(e.target.value),
                          })
                        }
                        className="w-full px-3 py-2 border rounded-xl font-bold text-xs"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">
                        সংক্ষিপ্ত বিবরণ :
                      </label>
                      <textarea
                        value={newProductForm.description || ''}
                        onChange={(e) =>
                          setNewProductForm({
                            ...newProductForm,
                            description: e.target.value,
                          })
                        }
                        rows={2}
                        placeholder="পণ্যের গুণাগুণ ও উপাদান..."
                        className="w-full px-3 py-2 border rounded-xl text-xs"
                      />
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="checkbox"
                        id="newProductInStock"
                        checked={newProductForm.inStock}
                        onChange={(e) =>
                          setNewProductForm({ ...newProductForm, inStock: e.target.checked })
                        }
                        className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                      />
                      <label htmlFor="newProductInStock" className="text-xs font-bold text-stone-800 cursor-pointer">
                        তৎক্ষণাৎ স্টকে সক্রিয় রাখুন (In Stock)
                      </label>
                    </div>

                    <div className="flex gap-2 pt-3">
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddingProduct(false);
                          setNewProductImageFile(null);
                        }}
                        className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-700 py-2.5 rounded-xl font-bold text-xs cursor-pointer"
                      >
                        বাতিল
                      </button>
                      <button
                        type="submit"
                        disabled={isSavingCatalogItem}
                        className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white py-2.5 rounded-xl font-bold text-xs cursor-pointer shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>{isSavingCatalogItem ? 'সেভ হচ্ছে...' : 'প্রোডাক্ট ডাটাবেসে সেভ করুন'}</span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Modal: Edit Existing Product */}
            {editingProduct && (
              <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-2 backdrop-blur-xs sm:p-4">
                <div className="my-auto max-h-[calc(100dvh-1rem)] w-full max-w-lg overflow-y-auto rounded-2xl border border-stone-200 bg-white p-4 shadow-2xl sm:max-h-[calc(100dvh-2rem)] sm:p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-extrabold text-stone-900 text-base">
                      প্রোডাক্ট এডিট: {editingProduct.name}
                    </h4>
                    <span className="text-[10px] font-mono bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded">
                      ID: {editingProduct.id}
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 mb-4">
                    মূল পণ্যের নাম, দাম, SKU ও স্টক পরিবর্তন করুন
                  </p>

                  <form onSubmit={handleSaveSingleProduct} className="space-y-3">
                    <ImageUploadField
                      currentImageUrl={editingProduct.imageUrl}
                      onFileChange={setEditingProductImageFile}
                    />
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">
                        প্রোডাক্টের নাম:
                      </label>
                      <input
                        type="text"
                        value={editingProduct.name}
                        onChange={(e) =>
                          setEditingProduct({ ...editingProduct, name: e.target.value })
                        }
                        className="w-full px-3 py-2 border rounded-xl font-bold text-xs"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs font-bold text-stone-700 mb-1">
                          SKU কোড:
                        </label>
                        <input
                          type="text"
                          value={editingProduct.sku || ''}
                          onChange={(e) =>
                            setEditingProduct({ ...editingProduct, sku: e.target.value })
                          }
                          className="w-full px-3 py-2 border rounded-xl font-mono text-xs uppercase"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-stone-700 mb-1">
                          ক্যাটাগরি:
                        </label>
                        <input
                          type="text"
                          value={editingProduct.category}
                          onChange={(e) =>
                            setEditingProduct({ ...editingProduct, category: e.target.value })
                          }
                          className="w-full px-3 py-2 border rounded-xl text-xs"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <div>
                        <label className="block text-xs font-bold text-stone-700 mb-1">
                          ওজন / সাইজ:
                        </label>
                        <input
                          type="text"
                          value={editingProduct.unitWeight}
                          onChange={(e) =>
                            setEditingProduct({ ...editingProduct, unitWeight: e.target.value })
                          }
                          className="w-full px-3 py-2 border rounded-xl text-xs"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-stone-700 mb-1">
                          ক্রয়মূল্য:
                        </label>
                        <input
                          type="number"
                          value={editingProduct.costPrice}
                          onChange={(e) =>
                            setEditingProduct({
                              ...editingProduct,
                              costPrice: Number(e.target.value),
                            })
                          }
                          className="w-full px-3 py-2 border rounded-xl text-xs"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-stone-700 mb-1">
                          বিক্রয়মূল্য:
                        </label>
                        <input
                          type="number"
                          value={editingProduct.regularPrice}
                          onChange={(e) =>
                            setEditingProduct({
                              ...editingProduct,
                              regularPrice: Number(e.target.value),
                            })
                          }
                          className="w-full px-3 py-2 border rounded-xl font-bold text-xs"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">
                        ইনভেন্টরি স্টক সংখ্যা:
                      </label>
                      <input
                        type="number"
                        value={editingProduct.stockQuantity}
                        onChange={(e) =>
                          setEditingProduct({
                            ...editingProduct,
                            stockQuantity: Number(e.target.value),
                          })
                        }
                        className="w-full px-3 py-2 border rounded-xl font-bold text-xs"
                        required
                      />
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="checkbox"
                        id="editProductInStock"
                        checked={editingProduct.inStock}
                        onChange={(e) =>
                          setEditingProduct({ ...editingProduct, inStock: e.target.checked })
                        }
                        className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                      />
                      <label htmlFor="editProductInStock" className="text-xs font-bold text-stone-800 cursor-pointer">
                        পণ্যটি ইন স্টকে সক্রিয় রয়েছে (In Stock)
                      </label>
                    </div>

                    <div className="flex gap-2 pt-3">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingProduct(null);
                          setEditingProductImageFile(null);
                        }}
                        className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-700 py-2.5 rounded-xl font-bold text-xs cursor-pointer"
                      >
                        বাতিল
                      </button>
                      <button
                        type="submit"
                        disabled={isSavingCatalogItem}
                        className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white py-2.5 rounded-xl font-bold text-xs cursor-pointer shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>{isSavingCatalogItem ? 'সেভ হচ্ছে...' : 'আপডেট সংরক্ষণ করুন'}</span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'coupons' && (
          <div className="min-w-0 space-y-6 rounded-b-xl border border-t-0 border-stone-200 bg-white p-3 sm:p-6">
            <section className="rounded-xl border border-stone-200 bg-stone-50 p-4 sm:p-5">
              <div className="mb-4">
                <h3 className="flex items-center gap-2 text-base font-black text-stone-900 sm:text-lg">
                  <Tag className="h-5 w-5 text-emerald-700" />
                  নতুন কুপন তৈরি করুন
                </h3>
                <p className="mt-1 text-xs text-stone-600">Fixed discount অথবা free shipping coupon তৈরি ও পরিচালনা করুন।</p>
              </div>
              <form onSubmit={handleCreateCoupon} className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <label className="text-xs font-semibold text-stone-700">
                  Coupon code
                  <input
                    required
                    value={couponForm.code}
                    onChange={(event) => setCouponForm((current) => ({ ...current, code: event.target.value.toUpperCase() }))}
                    placeholder="যেমন: EID50"
                    pattern="[A-Za-z0-9_-]+"
                    className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm uppercase"
                  />
                </label>
                <label className="text-xs font-semibold text-stone-700">
                  Discount type
                  <select
                    value={couponForm.discountType}
                    onChange={(event) => setCouponForm((current) => ({
                      ...current,
                      discountType: event.target.value as DBCoupon['discountType'],
                    }))}
                    className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm"
                  >
                    <option value="fixed">Fixed amount (৳)</option>
                    <option value="free_shipping">Free shipping</option>
                  </select>
                </label>
                {couponForm.discountType === 'fixed' && (
                  <label className="text-xs font-semibold text-stone-700">
                    Discount amount (৳)
                    <input
                      type="number"
                      min="1"
                      step="1"
                      required
                      value={couponForm.discountAmount}
                      onChange={(event) => setCouponForm((current) => ({ ...current, discountAmount: Number(event.target.value) }))}
                      className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm"
                    />
                  </label>
                )}
                <label className="text-xs font-semibold text-stone-700">
                  Minimum order quantity
                  <input
                    type="number"
                    min="1"
                    step="1"
                    required
                    value={couponForm.minQuantity}
                    onChange={(event) => setCouponForm((current) => ({ ...current, minQuantity: Number(event.target.value) }))}
                    className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm"
                  />
                </label>
                <div className="sm:col-span-2 lg:col-span-4">
                  <button
                    type="submit"
                    disabled={isSavingCoupon}
                    className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Plus className="h-4 w-4" />
                    {isSavingCoupon ? 'তৈরি হচ্ছে...' : 'কুপন তৈরি করুন'}
                  </button>
                </div>
              </form>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-bold text-stone-800">কুপন তালিকা</h3>
              {coupons.length === 0 ? (
                <p className="rounded-xl border border-dashed border-stone-300 p-6 text-center text-sm text-stone-500">
                  কোনো কুপন নেই। উপরের ফর্ম থেকে নতুন কুপন যোগ করুন।
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {coupons.map((coupon) => (
                    <article key={coupon.id} className="flex items-center justify-between gap-3 rounded-xl border border-stone-200 bg-white p-4">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <strong className="font-mono text-sm text-stone-900">{coupon.code}</strong>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            coupon.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-600'
                          }`}>{coupon.isActive ? 'সক্রিয়' : 'নিষ্ক্রিয়'}</span>
                        </div>
                        <p className="mt-1 text-xs text-stone-600">
                          {coupon.discountType === 'fixed' ? `৳${coupon.discountAmount} ছাড়` : 'ফ্রি ডেলিভারি'}
                          {' · '}কমপক্ষে {coupon.minQuantity} টি
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <button
                          type="button"
                          onClick={() => void handleToggleCoupon(coupon)}
                          className="rounded-lg border border-stone-300 px-2.5 py-1.5 text-[11px] font-semibold text-stone-700 hover:bg-stone-50"
                        >
                          {coupon.isActive ? 'বন্ধ করুন' : 'সক্রিয় করুন'}
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDeleteCoupon(coupon)}
                          className="rounded-lg p-2 text-rose-600 hover:bg-rose-50"
                          aria-label={`${coupon.code} মুছুন`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {activeTab === 'gallery' && (
          <div className="min-w-0 space-y-5 rounded-b-xl border border-t-0 border-stone-200 bg-white p-3 sm:p-6">
            <section className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="flex items-center gap-2 text-base font-black text-stone-900">
                  <ImageIcon className="h-5 w-5 text-amber-700" />
                  Slider-এর নিচের image cards
                </h3>
                <p className="mt-1 text-xs text-stone-600">
                  নতুন ছবি upload করুন অথবা আগে যোগ করা product, combo কিংবা slider image বেছে নিন।
                </p>
              </div>
              <button
                type="button"
                disabled={homepageImageCards.length >= HOMEPAGE_IMAGE_CARD_LIMIT}
                onClick={() => {
                  setGalleryImageFiles([]);
                  setGallerySelectedImageUrls([]);
                  setIsGalleryFormOpen(true);
                }}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
                {homepageImageCards.length >= HOMEPAGE_IMAGE_CARD_LIMIT ? '৬টি ছবি যোগ হয়েছে' : 'ছবি যোগ করুন'}
              </button>
            </section>
            <p className="text-xs text-stone-500">
              {homepageImageCards.length}/{HOMEPAGE_IMAGE_CARD_LIMIT}টি ছবি · সব ডিভাইসে এক সারিতে ৬টি card দেখাবে।
            </p>

            {isGalleryFormOpen && (
              <form onSubmit={handleSaveGalleryCards} className="space-y-4 rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 sm:p-5">
                <GalleryImagePicker
                  availableSlots={HOMEPAGE_IMAGE_CARD_LIMIT - homepageImageCards.length}
                  existingImages={galleryImageOptions}
                  selectedFiles={galleryImageFiles}
                  selectedImageUrls={gallerySelectedImageUrls}
                  onFilesChange={setGalleryImageFiles}
                  onImageUrlsChange={setGallerySelectedImageUrls}
                />
                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={closeGalleryForm}
                    disabled={isSavingGalleryCard}
                    className="rounded-lg bg-stone-100 px-4 py-2.5 text-xs font-bold text-stone-700 hover:bg-stone-200 disabled:opacity-50"
                  >
                    বাতিল
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingGalleryCard || galleryImageFiles.length + gallerySelectedImageUrls.length === 0}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Save className="h-4 w-4" />
                    {isSavingGalleryCard
                      ? 'আপলোড হচ্ছে...'
                      : `${galleryImageFiles.length + gallerySelectedImageUrls.length}টি card যোগ করুন`}
                  </button>
                </div>
              </form>
            )}

            {homepageImageCards.length === 0 ? (
              <section className="rounded-xl border border-dashed border-stone-300 bg-stone-50 p-8 text-center">
                <ImageIcon className="mx-auto h-8 w-8 text-stone-400" />
                <p className="mt-2 text-sm font-bold text-stone-800">এখনো কোনো image card নেই</p>
                <p className="mt-1 text-xs text-stone-600">ছবি যোগ করলে slider-এর নিচে এবং product list-এর উপরে দেখাবে।</p>
              </section>
            ) : (
              <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {homepageImageCards.map((card, index) => (
                  <article key={card.id} className="overflow-hidden rounded-xl border border-stone-200 bg-white">
                    <img src={card.imageUrl} alt={card.altText} className="aspect-[4/3] w-full bg-stone-100 object-cover" loading="lazy" />
                    <div className="space-y-3 p-3">
                      <p className="line-clamp-2 text-xs text-stone-700">{card.altText}</p>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => void handleMoveGalleryCard(index, -1)}
                          disabled={index === 0}
                          aria-label="ছবি আগে নিন"
                          className="rounded-lg border border-stone-200 p-2 text-stone-600 disabled:opacity-40"
                        >
                          <ChevronUp className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleMoveGalleryCard(index, 1)}
                          disabled={index === homepageImageCards.length - 1}
                          aria-label="ছবি পরে নিন"
                          className="rounded-lg border border-stone-200 p-2 text-stone-600 disabled:opacity-40"
                        >
                          <ChevronDown className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleToggleGalleryCard(card)}
                          className="inline-flex items-center gap-1 rounded-lg border border-stone-200 px-2.5 py-2 text-[11px] font-semibold text-stone-700"
                        >
                          {card.isActive ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                          {card.isActive ? 'Hide' : 'Show'}
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDeleteGalleryCard(card)}
                          aria-label="ছবির card মুছুন"
                          className="ml-auto rounded-lg border border-rose-100 p-2 text-rose-600 hover:bg-rose-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </section>
            )}
          </div>
        )}

        {activeTab === 'slider' && (
          <div className="min-w-0 space-y-5 rounded-b-xl border border-t-0 border-stone-200 bg-white p-3 sm:p-6">
            <section className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="flex items-center gap-2 text-base font-black text-stone-900">
                  <ImageIcon className="h-5 w-5 text-amber-700" />
                  Homepage slider পরিচালনা
                </h3>
                <p className="mt-1 text-xs text-stone-600">
                  ছবির অনুপাত 16:9, ন্যূনতম 1280 × 720 px; 1920 × 1080 px recommended।
                  সর্বোচ্চ file size 5 MB।
                </p>
              </div>
              <button
                type="button"
                onClick={() => openSliderForm()}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-800"
              >
                <Plus className="h-4 w-4" />
                Slider যোগ করুন
              </button>
            </section>

            {sliderImages.length === 0 && (
              <section className="rounded-xl border border-dashed border-stone-300 bg-stone-50 p-5 text-center">
                <p className="text-sm font-bold text-stone-800">এখনো কোনো slider image যোগ করা হয়নি।</p>
                <p className="mt-1 text-xs text-stone-600">
                  Slider যোগ করলে সেটি সক্রিয় থাকা অবস্থায় homepage-এ প্রদর্শিত হবে।
                </p>
              </section>
            )}

            {isSliderFormOpen && (
              <form onSubmit={handleSaveSlider} className="space-y-4 rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 sm:p-5">
                <div>
                  <h3 className="text-sm font-black text-stone-900">
                    {editingSliderImage ? 'Slider image edit করুন' : 'নতুন slider image'}
                  </h3>
                  <p className="mt-1 text-xs text-stone-600">
                    Title admin-এর জন্য; alt text accessibility এবং search-এর জন্য ব্যবহৃত হবে।
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="text-xs font-semibold text-stone-700">
                    Title
                    <input
                      required
                      maxLength={120}
                      value={sliderDraft.title}
                      onChange={(event) => setSliderDraft((current) => ({ ...current, title: event.target.value }))}
                      className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm"
                    />
                  </label>
                  <label className="text-xs font-semibold text-stone-700">
                    Alt text
                    <input
                      required
                      maxLength={250}
                      value={sliderDraft.altText}
                      onChange={(event) => setSliderDraft((current) => ({ ...current, altText: event.target.value }))}
                      className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm"
                    />
                  </label>
                  <label className="text-xs font-semibold text-stone-700 sm:col-span-2">
                    Caption (optional)
                    <input
                      maxLength={180}
                      value={sliderDraft.caption}
                      onChange={(event) => setSliderDraft((current) => ({ ...current, caption: event.target.value }))}
                      className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm"
                    />
                  </label>
                </div>
                <SliderImageUploadField
                  currentImageUrl={editingSliderImage?.imageUrl}
                  onFileChange={handleSliderFileChange}
                />
                <label className="flex items-center gap-2 text-xs font-semibold text-stone-700">
                  <input
                    type="checkbox"
                    checked={sliderDraft.isActive}
                    onChange={(event) => setSliderDraft((current) => ({ ...current, isActive: event.target.checked }))}
                    className="h-4 w-4 accent-emerald-700"
                  />
                  Homepage-এ active রাখুন
                </label>
                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={closeSliderForm}
                    disabled={isSavingSlider}
                    className="rounded-lg bg-stone-100 px-4 py-2.5 text-xs font-bold text-stone-700 hover:bg-stone-200 disabled:opacity-50"
                  >
                    বাতিল
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingSlider || !isSliderImageValid}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Save className="h-4 w-4" />
                    {isSavingSlider ? 'সেভ হচ্ছে...' : 'Slider সেভ করুন'}
                  </button>
                </div>
              </form>
            )}

            {sliderImages.length > 0 && (
              <section className="space-y-3">
                <h3 className="text-sm font-bold text-stone-800">Slider image তালিকা</h3>
                <div className="grid gap-3 lg:grid-cols-2">
                  {sliderImages.map((slide, index) => (
                    <article key={slide.id} className="flex min-w-0 flex-col overflow-hidden rounded-xl border border-stone-200 bg-white sm:flex-row">
                      <img
                        src={slide.imageUrl}
                        alt={slide.altText}
                        className="aspect-video w-full bg-stone-100 object-cover sm:aspect-auto sm:h-36 sm:w-56"
                        loading="lazy"
                      />
                      <div className="flex min-w-0 flex-1 flex-col justify-between gap-3 p-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="truncate text-sm font-bold text-stone-900">{slide.title}</h4>
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              slide.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-600'
                            }`}>{slide.isActive ? 'Active' : 'Inactive'}</span>
                          </div>
                          {slide.caption && <p className="mt-1 line-clamp-2 text-xs text-stone-600">{slide.caption}</p>}
                          <p className="mt-1 truncate text-[10px] text-stone-500">Order {index + 1} · 16:9</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => void handleMoveSlider(index, -1)}
                            disabled={index === 0}
                            aria-label={`${slide.title} উপরে নিন`}
                            className="rounded-lg border border-stone-200 p-2 text-stone-600 hover:bg-stone-50 disabled:opacity-30"
                          >
                            <ChevronUp className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleMoveSlider(index, 1)}
                            disabled={index === sliderImages.length - 1}
                            aria-label={`${slide.title} নিচে নিন`}
                            className="rounded-lg border border-stone-200 p-2 text-stone-600 hover:bg-stone-50 disabled:opacity-30"
                          >
                            <ChevronDown className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleToggleSlider(slide)}
                            aria-label={slide.isActive ? `${slide.title} inactive করুন` : `${slide.title} active করুন`}
                            className="inline-flex items-center gap-1 rounded-lg border border-stone-200 px-2.5 py-2 text-[11px] font-semibold text-stone-700 hover:bg-stone-50"
                          >
                            {slide.isActive ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                            {slide.isActive ? 'Hide' : 'Show'}
                          </button>
                          <button
                            type="button"
                            onClick={() => openSliderForm(slide)}
                            className="inline-flex items-center gap-1 rounded-lg border border-stone-200 px-2.5 py-2 text-[11px] font-semibold text-stone-700 hover:bg-stone-50"
                          >
                            <Edit className="h-3.5 w-3.5" />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDeleteSlider(slide)}
                            aria-label={`${slide.title} মুছুন`}
                            className="rounded-lg border border-rose-100 p-2 text-rose-600 hover:bg-rose-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="min-w-0 space-y-6 rounded-b-xl border border-t-0 border-stone-200 bg-white p-3 sm:p-6">
            <section className="max-w-3xl rounded-xl border border-stone-200 bg-stone-50 p-4 sm:p-6">
              <div className="mb-5">
                <h3 className="flex items-center gap-2 text-base font-black text-stone-900 sm:text-lg">
                  <Truck className="h-5 w-5 text-emerald-700" />
                  ডেলিভারি চার্জ সেটিংস
                </h3>
                <p className="mt-1 text-xs text-stone-600">
                  এখানে পরিবর্তন করলে checkout-এ দেখানো charge ও order total—দুটিই আপডেট হবে।
                </p>
              </div>
              {!deliverySettings ? (
                <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">
                  ডেলিভারি সেটিংস লোড করা যায়নি। Supabase schema চালানো আছে কি না দেখুন এবং আবার রিফ্রেশ করুন।
                </p>
              ) : (
                <form onSubmit={handleSaveDeliverySettings} className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <label className="text-sm font-semibold text-stone-700">
                      ঢাকার ভেতরে (৳)
                      <input
                        type="number"
                        min="0"
                        step="1"
                        required
                        value={deliverySettings.dhakaDeliveryFee}
                        onChange={(event) => setDeliverySettings({
                          ...deliverySettings,
                          dhakaDeliveryFee: Number(event.target.value),
                        })}
                        className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-sm"
                      />
                    </label>
                    <label className="text-sm font-semibold text-stone-700">
                      ঢাকার বাইরে (৳)
                      <input
                        type="number"
                        min="0"
                        step="1"
                        required
                        value={deliverySettings.outsideDhakaDeliveryFee}
                        onChange={(event) => setDeliverySettings({
                          ...deliverySettings,
                          outsideDhakaDeliveryFee: Number(event.target.value),
                        })}
                        className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-sm"
                      />
                    </label>
                  </div>
                  <button
                    type="submit"
                    disabled={isSavingDeliverySettings}
                    className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Save className="h-4 w-4" />
                    {isSavingDeliverySettings ? 'সেভ হচ্ছে...' : 'চার্জ সেভ করুন'}
                  </button>
                </form>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
