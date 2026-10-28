import { useState, useEffect } from 'react';
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
} from 'lucide-react';
import ImageUploadField from './ImageUploadField';
import {
  fetchAllOrders,
  subscribeToOrders,
  updateOrderStatus,
  deleteOrder,
  seedInitialCombosIfEmpty,
  updateCombo,
  fetchAllProducts,
  seedInitialProductsCatalogIfEmpty,
  createProductItem,
  updateProductItem,
  deleteProductItem,
  BackendOrder,
  BackendCombo,
  ProductItem,
} from '../services/dbService';
import { uploadCatalogImage } from '../services/imageUpload';
import { getSupabaseClient } from '../lib/supabase';

function isOrderStatus(status: string): status is BackendOrder['status'] {
  return ['pending', 'processing', 'shipped', 'delivered', 'cancelled'].includes(status);
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

  // Tab State: 'orders' | 'combos' | 'products'
  const [activeTab, setActiveTab] = useState<'orders' | 'combos' | 'products'>('orders');

  // Data states
  const [orders, setOrders] = useState<BackendOrder[]>([]);
  const [combos, setCombos] = useState<BackendCombo[]>([]);
  const [productsList, setProductsList] = useState<ProductItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filters & Search for orders
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modals & Edit states
  const [editingCombo, setEditingCombo] = useState<BackendCombo | null>(null);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [comboImageFile, setComboImageFile] = useState<File | null>(null);
  const [newProductImageFile, setNewProductImageFile] = useState<File | null>(null);
  const [editingProductImageFile, setEditingProductImageFile] = useState<File | null>(null);
  const [isSavingCatalogItem, setIsSavingCatalogItem] = useState(false);
  const [newProductForm, setNewProductForm] = useState<Omit<ProductItem, 'id'>>({
    name: '',
    sku: '',
    category: 'লাচ্ছা সেমাই',
    unitWeight: '',
    costPrice: 0,
    regularPrice: 0,
    stockQuantity: 100,
    inStock: true,
    description: '',
  });

  const [notification, setNotification] = useState<string | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const loadData = async () => {
    setIsRefreshing(true);
    try {
      const [fetchedOrders, fetchedCombos, fetchedProducts] = await Promise.all([
        fetchAllOrders(),
        seedInitialCombosIfEmpty(),
        seedInitialProductsCatalogIfEmpty(),
      ]);
      setOrders(fetchedOrders);
      setCombos(fetchedCombos);
      setProductsList(fetchedProducts);
    } catch (err) {
      console.error('Error fetching admin data:', err);
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

    // Initial load for combos and products
    Promise.all([
      seedInitialCombosIfEmpty(),
      seedInitialProductsCatalogIfEmpty(),
    ]).then(([cList, pList]) => {
      setCombos(cList);
      setProductsList(pList);
      setIsLoading(false);
    }).catch((error: unknown) => {
      console.error('Could not load catalog data from Supabase:', error);
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
    setUpdatingOrderId(orderId);
    setOrders((prev) =>
      prev.map((o) => (o.orderId === orderId ? { ...o, status: newStatus } : o))
    );

    try {
      await updateOrderStatus(orderId, { status: newStatus });
      const statusLabels: Record<string, string> = {
        pending: 'Pending (পেন্ডিং)',
        processing: 'Processing (প্রসেসিং)',
        shipped: 'Shipped (কুরিয়ারে)',
        delivered: 'Delivered (ডেলিভার্ড)',
        cancelled: 'Cancelled (বাতিল)',
      };
      showToast(`অর্ডার #${orderId} সফলভাবে ${statusLabels[newStatus] || newStatus} এ আপডেট হয়েছে!`);
    } catch (err) {
      console.error('Failed to update status in database:', err);
      showToast('স্ট্যাটাস আপডেট করতে সমস্যা হয়েছে, অনুগ্রহ করে আবার চেষ্টা করুন।');
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

  // 1. Combo Table Handlers
  const handleSaveCombo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCombo) return;

    setIsSavingCatalogItem(true);
    try {
      const imageUrl = comboImageFile
        ? await uploadCatalogImage(comboImageFile, 'combos', editingCombo.id)
        : editingCombo.imageUrl;
      const updatedCombo = { ...editingCombo, imageUrl };
      await updateCombo(editingCombo.id, {
        salePrice: Number(editingCombo.salePrice),
        originalPrice: Number(editingCombo.originalPrice),
        stockCount: Number(editingCombo.stockCount),
        inStock: editingCombo.inStock,
        includedProductIds: editingCombo.includedProductIds,
        imageUrl,
      });

      setCombos((prev) =>
        prev.map((combo) => (combo.id === editingCombo.id ? updatedCombo : combo))
      );
      setEditingCombo(null);
      setComboImageFile(null);
      showToast(`কম্বো অফার '${editingCombo.name}' ডাটাবেসে আপডেট হয়েছে!`);
    } catch (err) {
      console.error('Error saving combo image or details:', err);
      showToast(err instanceof Error ? err.message : 'কম্বো আপডেট করতে সমস্যা হয়েছে');
    } finally {
      setIsSavingCatalogItem(false);
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
        category: 'লাচ্ছা সেমাই',
        unitWeight: '',
        costPrice: 0,
        regularPrice: 0,
        stockQuantity: 100,
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

  // Export orders to CSV
  const exportToCsv = () => {
    if (orders.length === 0) return;

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

    const rows = orders.map((o) => [
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
    link.setAttribute('download', `lachcha_shemai_orders_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('অর্ডার লিস্ট CSV ফাইলে ডাউনলোড হয়েছে!');
  };

  // Filtered orders
  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerPhone.includes(searchQuery);

    const matchesStatus =
      statusFilter === 'all' ? true : order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Calculate metrics
  const totalRevenue = orders.reduce((sum, o) => (o.status !== 'cancelled' ? sum + o.totalAmount : sum), 0);
  const pendingOrdersCount = orders.filter((o) => o.status === 'pending').length;
  const processingCount = orders.filter((o) => o.status === 'processing').length;
  const deliveredCount = orders.filter((o) => o.status === 'delivered').length;

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
      <header className="sticky top-0 z-30 border-b border-stone-200 bg-white px-3 py-3 shadow-xs sm:px-4">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div className="flex min-w-0 items-center justify-between gap-2 sm:justify-start sm:gap-3">
            <button
              onClick={handleBackToStore}
              className="flex shrink-0 items-center gap-1.5 rounded-xl border border-stone-200 bg-stone-100 px-2.5 py-1.5 text-xs font-bold text-stone-700 transition-colors hover:bg-stone-200 hover:text-stone-900 sm:px-3"
              title="স্টোরে ফিরে যান"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">স্টোরে ফিরে যান</span>
              <span className="sm:hidden">স্টোর</span>
            </button>
            <div className="flex min-w-0 flex-1 items-center gap-2 sm:flex-initial">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-800 text-sm font-bold text-white shadow-xs">
                প্যা
              </div>
              <div className="min-w-0">
                <h1 className="truncate text-sm font-extrabold leading-tight text-stone-900 sm:text-lg">
                  <span className="sm:hidden">অ্যাডমিন পোর্টাল</span>
                  <span className="hidden sm:inline">প্যারামাউন্ট ফুডস · অ্যাডমিন পোর্টাল</span>
                  <span className="text-[10px] font-mono bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded font-normal hidden md:inline">
                    /admin
                  </span>
                </h1>
                <span className="mt-0.5 flex items-center gap-1 text-[10px] font-semibold text-emerald-700 sm:text-[11px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                  <span className="truncate">Supabase সংযুক্ত</span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex w-full items-center justify-end gap-1 sm:w-auto sm:gap-2">
            <button
              onClick={loadData}
              disabled={isRefreshing}
              className="flex shrink-0 items-center gap-1 rounded-lg p-2 text-xs font-bold text-stone-600 transition-colors hover:bg-stone-100 hover:text-stone-900"
              title="ডাটা রিফ্রেশ করুন"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">রিফ্রেশ</span>
            </button>

            <button
              onClick={exportToCsv}
              className="flex shrink-0 items-center gap-1 rounded-lg border border-emerald-300 bg-emerald-50 px-2.5 py-1.5 text-xs font-bold text-emerald-800 transition-colors hover:bg-emerald-100 sm:gap-1.5 sm:px-3"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">অর্ডার এক্সপোর্ট (CSV)</span>
              <span className="sm:hidden">CSV</span>
            </button>

            <button
              onClick={handleBackToStore}
              className="flex shrink-0 items-center gap-1 rounded-lg bg-stone-800 px-2.5 py-1.5 text-xs font-bold text-white transition-colors hover:bg-stone-900 sm:px-3"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">ওয়েবসাইট ভিউ</span>
              <span className="sm:hidden">স্টোর</span>
            </button>

            <button
              onClick={() => {
                void getSupabaseClient().auth.signOut().then(({ error }) => {
                  if (error) showToast(error.message);
                });
                setIsAuthenticated(false);
              }}
              className="shrink-0 rounded-lg p-1.5 text-xs font-bold text-stone-500 transition-colors hover:bg-rose-50 hover:text-rose-600"
              title="লগআউট"
            >
              লগআউট
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="mx-auto w-full max-w-7xl min-w-0 flex-1 space-y-4 p-3 sm:space-y-6 sm:p-6">
        {/* Metric Cards Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <div className="flex min-w-0 items-center justify-between gap-2 rounded-xl border border-stone-200 bg-white p-3 shadow-xs sm:p-4">
            <div>
              <span className="text-[11px] font-semibold text-stone-500 sm:text-xs">মোট বিক্রয় (আয়)</span>
              <div className="mt-1 break-all text-lg font-black text-emerald-800 sm:text-2xl">
                ৳{totalRevenue.toLocaleString()}
              </div>
            </div>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 sm:h-10 sm:w-10">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>

          <div className="flex min-w-0 items-center justify-between gap-2 rounded-xl border border-stone-200 bg-white p-3 shadow-xs sm:p-4">
            <div>
              <span className="text-[11px] font-semibold text-stone-500 sm:text-xs">মোট অর্ডার</span>
              <div className="mt-1 text-lg font-black text-stone-900 sm:text-2xl">
                {orders.length} টি
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

        {/* Tab Controls: Orders | Combos Table | Products Table */}
        <div className="grid grid-cols-3 overflow-hidden rounded-t-xl border-b border-stone-200 bg-white pt-2 sm:flex sm:overflow-x-auto sm:px-4">
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
            <span className="truncate sm:whitespace-nowrap">অর্ডার ({orders.length})</span>
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
        </div>

        {/* TAB 1: ORDERS MANAGEMENT */}
        {activeTab === 'orders' && (
          <div className="min-w-0 space-y-4 rounded-b-xl border border-t-0 border-stone-200 bg-white p-3 sm:p-6">
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
                  { key: 'all', label: 'সব' },
                  { key: 'pending', label: 'নতুন' },
                  { key: 'processing', label: 'প্রসেসিং' },
                  { key: 'shipped', label: 'কুরিয়ারে' },
                  { key: 'delivered', label: 'ডেলিভার্ড' },
                  { key: 'cancelled', label: 'বাতিল' },
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

            {/* Mobile order cards */}
            <div className="space-y-3 md:hidden">
              {filteredOrders.length === 0 ? (
                <div className="rounded-xl border border-stone-200 py-8 text-center text-sm text-stone-500">
                  কোনো অর্ডার পাওয়া যায়নি।
                </div>
              ) : filteredOrders.map((order) => {
                const whatsappUrl = `https://wa.me/88${order.customerPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                  `সালামু আলাইকুম ${order.customerName}! প্যারামাউন্ট ফুডস থেকে আপনার লাচ্ছা সেমাই এর অর্ডার #${order.orderId} সম্পর্কে যোগাযোগ করছি।`
                )}`;

                return (
                  <article key={order.orderId} className="min-w-0 rounded-xl border border-stone-200 bg-stone-50 p-3">
                    <div className="flex items-start justify-between gap-2">
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
                      <p className="break-words font-semibold text-stone-800">{order.bundleName} · {order.quantity} টি</p>
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
                      অর্ডার স্ট্যাটাস
                      <select
                        value={order.status}
                        onChange={(event) => {
                          const status = event.target.value;
                          if (isOrderStatus(status)) handleStatusChange(order.orderId, status);
                        }}
                        disabled={updatingOrderId === order.orderId}
                        className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-800 disabled:opacity-50"
                      >
                        <option value="pending">নতুন</option>
                        <option value="processing">প্রসেসিং</option>
                        <option value="shipped">কুরিয়ারে</option>
                        <option value="delivered">ডেলিভার্ড</option>
                        <option value="cancelled">বাতিল</option>
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
              <table className="w-full min-w-[980px] text-left text-xs border-collapse">
                <thead className="bg-stone-50 border-b border-stone-200 text-stone-700 font-bold uppercase tracking-wider">
                  <tr>
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
                      <td colSpan={8} className="py-8 text-center text-stone-500">
                        কোনো অর্ডার পাওয়া যায়নি।
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((order) => {
                      const whatsappUrl = `https://wa.me/88${order.customerPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                        `সালামু আলাইকুম ${order.customerName}! প্যারামাউন্ট ফুডস থেকে আপনার লাচ্ছা সেমাই এর অর্ডার #${order.orderId} সম্পর্কে যোগাযোগ করছি।`
                      )}`;

                      return (
                        <tr key={order.orderId} className="hover:bg-amber-50/20 transition-colors">
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
                            <span className="font-bold text-stone-900">{order.bundleName}</span>
                            <span className="block text-[11px] text-stone-500">
                              পরিমাণ: <strong>{order.quantity} টি</strong>
                            </span>
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
                                      : order.status === 'shipped'
                                      ? 'bg-indigo-600 animate-pulse'
                                      : order.status === 'delivered'
                                      ? 'bg-emerald-600'
                                      : 'bg-rose-600'
                                  }`}
                                />
                                <span>
                                  {order.status === 'pending'
                                    ? 'পেন্ডিং (Pending)'
                                    : order.status === 'processing'
                                    ? 'প্রসেসিং (Processing)'
                                    : order.status === 'shipped'
                                    ? 'কুরিয়ারে (Shipped)'
                                    : order.status === 'delivered'
                                    ? 'ডেলিভার্ড (Delivered)'
                                    : 'বাতিল (Cancelled)'}
                                </span>
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
                  ল্যান্ডিং পেজে প্রদর্শিত ১ বক্স ট্রায়াল, ২ বক্স ফ্যামিলি এবং ৪ বক্স মেগা অফারের দাম ও স্টক এখানে থেকে কন্ট্রোল করুন।
                </p>
              </div>
            </div>

            {/* Combos Grid Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                    <button
                      onClick={() => {
                        setComboImageFile(null);
                        setEditingCombo({ ...combo });
                      }}
                      className="w-full bg-[#0073aa] hover:bg-[#005a87] text-white font-bold py-2 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>কম্বো মূল্য ও স্টক এডিট করুন</span>
                    </button>
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
                      কম্বো এডিট: {editingCombo.name}
                    </h4>
                    <span className="text-[10px] font-mono bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                      ID: {editingCombo.id}
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 mb-4">
                    কম্বো অফারের মূল্য, স্টক ও স্ট্যাটাস আপডেট করুন
                  </p>

                  <form onSubmit={handleSaveCombo} className="space-y-4">
                    <ImageUploadField
                      currentImageUrl={editingCombo.imageUrl}
                      onFileChange={setComboImageFile}
                    />
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">
                        বিক্রয় মূল্য (টাকা):
                      </label>
                      <input
                        type="number"
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
                        placeholder="যেমন: prod-shemai-450 (2x)"
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

                    <div className="flex gap-2 pt-3">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingCombo(null);
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
                        <span>{isSavingCatalogItem ? 'সেভ হচ্ছে...' : 'কম্বো আপডেট সেভ করুন'}</span>
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
      </main>
    </div>
  );
}
