import { useState, useEffect, useId } from 'react';
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
import {
  fetchAllOrders,
  subscribeToOrders,
  updateOrderStatus,
  deleteOrder,
  fetchCombos,
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

interface AdminDashboardProps {
  onNavigateToStore: () => void;
  onClose?: () => void;
}

export default function AdminDashboard({ onNavigateToStore, onClose }: AdminDashboardProps) {
  const handleBackToStore = onNavigateToStore || onClose;
  const pinInputId = useId();

  // Simple admin PIN security (default '1234' or 'admin')
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

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
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    const savedAuth = sessionStorage.getItem('shemai_admin_auth');
    if (savedAuth === 'true') {
      setIsAuthenticated(true);
    }
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
    });

    // Real-time Firestore subscription for orders
    const unsubscribe = subscribeToOrders((liveOrders) => {
      setOrders(liveOrders);
      setIsLoading(false);
      setIsRefreshing(false);
    });

    return () => {
      unsubscribe();
    };
  }, [isAuthenticated]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === '1234' || pinInput === 'admin') {
      setIsAuthenticated(true);
      sessionStorage.setItem('shemai_admin_auth', 'true');
      setPinError(false);
    } else {
      setPinError(true);
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

    await updateCombo(editingCombo.id, {
      salePrice: Number(editingCombo.salePrice),
      originalPrice: Number(editingCombo.originalPrice),
      stockCount: Number(editingCombo.stockCount),
      inStock: editingCombo.inStock,
      includedProductIds: editingCombo.includedProductIds,
    });

    setCombos((prev) =>
      prev.map((c) => (c.id === editingCombo.id ? editingCombo : c))
    );
    setEditingCombo(null);
    showToast(`কম্বো অফার '${editingCombo.name}' ডাটাবেসে আপডেট হয়েছে!`);
  };

  // 2. Base Product Table Handlers
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductForm.name.trim()) {
      alert('প্রোডাক্টের নাম লিখুন');
      return;
    }

    try {
      const created = await createProductItem(newProductForm);
      setProductsList((prev) => [created, ...prev]);
      setIsAddingProduct(false);
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
      showToast('প্রোডাক্ট তৈরি করতে সমস্যা হয়েছে');
    }
  };

  const handleSaveSingleProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

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
    });

    setProductsList((prev) =>
      prev.map((p) => (p.id === editingProduct.id ? editingProduct : p))
    );
    setEditingProduct(null);
    showToast(`প্রোডাক্ট '${editingProduct.name}' ডাটাবেসে সফলভাবে আপডেট হয়েছে!`);
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

  // PIN Login Gate - Standalone Page
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
              <label htmlFor={pinInputId} className="block text-xs font-bold text-stone-700 text-left mb-1.5">
                অ্যাডমিন সিক্রেট পিন দিন:
              </label>
              <input
                id={pinInputId}
                type="password"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="ডিফল্ট পিন: 1234"
                className="w-full px-4 py-3 rounded-xl border border-stone-300 text-center text-lg font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-emerald-500"
                autoFocus
              />
              {pinError && (
                <p className="text-xs text-rose-600 mt-1 font-medium">
                  ভুল পিন কোড! (টেস্ট পিন: 1234 লিখুন)
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-700 hover:bg-emerald-800 text-white py-3 rounded-xl font-bold text-sm cursor-pointer shadow-md transition-all active:scale-98"
            >
              ড্যাশবোর্ডে প্রবেশ করুন
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

          <p className="text-[11px] text-stone-400 mt-4">
            ডিফল্ট টেস্ট পাসকোড: <code className="bg-stone-100 px-1 py-0.5 rounded font-mono font-bold text-stone-700">1234</code>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col font-['Hind_Siliguri',sans-serif]">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-5 right-5 z-50 bg-stone-900 text-white px-4 py-2.5 rounded-xl shadow-2xl border border-emerald-500 text-xs font-bold flex items-center gap-2 animate-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* Top Standalone Navbar */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-30 shadow-xs px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={handleBackToStore}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 hover:text-stone-900 rounded-xl text-xs font-bold transition-colors cursor-pointer border border-stone-200"
              title="স্টোরে ফিরে যান"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">স্টোরে ফিরে যান</span>
              <span className="sm:hidden">স্টোর</span>
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-800 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                প্যা
              </div>
              <div>
                <h1 className="font-extrabold text-stone-900 text-base sm:text-lg leading-none flex items-center gap-2">
                  <span>প্যারামাউন্ট ফুডস · অ্যাডমিন পোর্টাল</span>
                  <span className="text-[10px] font-mono bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded font-normal hidden md:inline">
                    /admin
                  </span>
                </h1>
                <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                  <span>লাইভ ফায়ারবেস ক্লাউড ডাটাবেস সংযুক্ত</span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              disabled={isRefreshing}
              className="p-2 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
              title="ডাটা রিফ্রেশ করুন"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">রিফ্রেশ</span>
            </button>

            <button
              onClick={exportToCsv}
              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">অর্ডার এক্সপোর্ট (CSV)</span>
              <span className="sm:hidden">CSV</span>
            </button>

            <button
              onClick={handleBackToStore}
              className="bg-stone-800 hover:bg-stone-900 text-white px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors flex items-center gap-1"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">ওয়েবসাইট ভিউ</span>
              <span className="sm:hidden">স্টোর</span>
            </button>

            <button
              onClick={() => {
                sessionStorage.removeItem('shemai_admin_auth');
                setIsAuthenticated(false);
              }}
              className="p-1.5 text-stone-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer text-xs font-bold"
              title="লগআউট"
            >
              লগআউট
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto w-full p-4 sm:p-6 space-y-6 flex-1">
        {/* Metric Cards Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-stone-500">মোট বিক্রয় (আয়)</span>
              <div className="text-xl sm:text-2xl font-black text-emerald-800 mt-1">
                ৳{totalRevenue.toLocaleString()}
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-stone-500">মোট অর্ডার</span>
              <div className="text-xl sm:text-2xl font-black text-stone-900 mt-1">
                {orders.length} টি
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-stone-500">কম্বো অফার</span>
              <div className="text-xl sm:text-2xl font-black text-amber-700 mt-1">
                {combos.length} টি
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-stone-500">প্রোডাক্ট আইটেম</span>
              <div className="text-xl sm:text-2xl font-black text-indigo-700 mt-1">
                {productsList.length} টি
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <Boxes className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Tab Controls: Orders | Combos Table | Products Table */}
        <div className="flex border-b border-stone-200 bg-white rounded-t-xl px-4 pt-2 overflow-x-auto no-scrollbar">
          {/* Tab 1: Orders */}
          <button
            onClick={() => setActiveTab('orders')}
            className={`py-3 px-4 font-bold text-xs sm:text-sm border-b-2 transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'orders'
                ? 'border-emerald-700 text-emerald-800'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>অর্ডার তালিকা ({orders.length})</span>
          </button>

          {/* Tab 2: Combos Table (Converted from previous products bundle table) */}
          <button
            onClick={() => setActiveTab('combos')}
            className={`py-3 px-4 font-bold text-xs sm:text-sm border-b-2 transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'combos'
                ? 'border-emerald-700 text-emerald-800'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>কম্বো অফার টেবিল ({combos.length})</span>
            <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-semibold">
              Combos
            </span>
          </button>

          {/* Tab 3: Products Table (Base catalog items) */}
          <button
            onClick={() => setActiveTab('products')}
            className={`py-3 px-4 font-bold text-xs sm:text-sm border-b-2 transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'products'
                ? 'border-emerald-700 text-emerald-800'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Boxes className="w-4 h-4" />
            <span>প্রোডাক্ট নাম টেবিল ({productsList.length})</span>
            <span className="text-[10px] bg-indigo-100 text-indigo-800 px-1.5 py-0.2 rounded font-semibold">
              Products
            </span>
          </button>
        </div>

        {/* TAB 1: ORDERS MANAGEMENT */}
        {activeTab === 'orders' && (
          <div className="bg-white rounded-b-xl border border-t-0 border-stone-200 p-4 sm:p-6 space-y-4">
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
              <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 no-scrollbar text-xs">
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
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
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

            {/* Orders Table */}
            <div className="overflow-x-auto border border-stone-200 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
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
          <div className="bg-white rounded-b-xl border border-t-0 border-stone-200 p-4 sm:p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="bg-amber-100 text-amber-900 text-xs font-bold px-2.5 py-0.5 rounded-md flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5" />
                    <span>Firestore Collection: /combos</span>
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
                      onClick={() => setEditingCombo({ ...combo })}
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
              <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200">
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
                        onClick={() => setEditingCombo(null)}
                        className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-700 py-2.5 rounded-xl font-bold text-xs cursor-pointer"
                      >
                        বাতিল
                      </button>
                      <button
                        type="submit"
                        className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white py-2.5 rounded-xl font-bold text-xs cursor-pointer shadow-md flex items-center justify-center gap-1.5"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>কম্বো আপডেট সেভ করুন</span>
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
          <div className="bg-white rounded-b-xl border border-t-0 border-stone-200 p-4 sm:p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="bg-indigo-100 text-indigo-900 text-xs font-bold px-2.5 py-0.5 rounded-md flex items-center gap-1">
                    <Boxes className="w-3.5 h-3.5" />
                    <span>Firestore Collection: /products</span>
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
                onClick={() => setIsAddingProduct(true)}
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-sm cursor-pointer transition-all self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>নতুন প্রোডাক্ট নাম যোগ করুন</span>
              </button>
            </div>

            {/* Products Table */}
            <div className="overflow-x-auto border border-stone-200 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
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
                            onClick={() => setEditingProduct({ ...prod })}
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
              <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-stone-200">
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

                    <div className="grid grid-cols-2 gap-3">
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

                    <div className="grid grid-cols-3 gap-3">
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
                        onClick={() => setIsAddingProduct(false)}
                        className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-700 py-2.5 rounded-xl font-bold text-xs cursor-pointer"
                      >
                        বাতিল
                      </button>
                      <button
                        type="submit"
                        className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white py-2.5 rounded-xl font-bold text-xs cursor-pointer shadow-md flex items-center justify-center gap-1.5"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>প্রোডাক্ট ডাটাবেসে সেভ করুন</span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Modal: Edit Existing Product */}
            {editingProduct && (
              <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-stone-200">
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

                    <div className="grid grid-cols-2 gap-3">
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

                    <div className="grid grid-cols-3 gap-3">
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
                        onClick={() => setEditingProduct(null)}
                        className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-700 py-2.5 rounded-xl font-bold text-xs cursor-pointer"
                      >
                        বাতিল
                      </button>
                      <button
                        type="submit"
                        className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white py-2.5 rounded-xl font-bold text-xs cursor-pointer shadow-md flex items-center justify-center gap-1.5"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>আপডেট সংরক্ষণ করুন</span>
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
