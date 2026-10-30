import { lazy, Suspense, useState, useEffect } from 'react';
import HeaderAnnouncement from './components/HeaderAnnouncement';
import Navbar from './components/Navbar';
import HeroSlider from './components/HeroSlider';
import HomepageImageCards from './components/HomepageImageCards';
import ProductCarousel from './components/ProductCarousel';
import WhyChooseUs from './components/WhyChooseUs';
import BundleSelector from './components/BundleSelector';
import RecipeGuide from './components/RecipeGuide';
import WooCommerceCheckout from './components/WooCommerceCheckout';
import CustomerReviews from './components/CustomerReviews';
import FaqSection from './components/FaqSection';
import OrderSuccessModal from './components/OrderSuccessModal';
// import StickyBottomMobileBar from './components/StickyBottomMobileBar';
import Footer from './components/Footer';
import { PlacedOrder, ProductItem, ShemaiBundle } from './types';
import { fetchAllProducts, fetchCombos } from './services/dbService';
import { useCurrentRoute } from './router';

const AdminDashboard = lazy(() => import('./components/AdminDashboard'));

function productToBundle(product: ProductItem): ShemaiBundle {
  return {
    id: product.id,
    name: product.name,
    subtitle: `একক পণ্য (${product.unitWeight})`,
    weight: product.unitWeight,
    boxes: 1,
    originalPrice: product.regularPrice,
    salePrice: product.regularPrice,
    savings: 0,
    freeDelivery: false,
    description: product.description,
    inStock: product.inStock,
    stockCount: product.stockQuantity,
    imageUrl: product.imageUrl,
  };
}

export default function App() {
  const [currentRoute, navigateToRoute] = useCurrentRoute();

  const [bundles, setBundles] = useState<ShemaiBundle[]>([]);
  const [selectedBundleId, setSelectedBundleId] = useState('');
  const [placedOrder, setPlacedOrder] = useState<PlacedOrder | null>(null);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [isLoadingCombos, setIsLoadingCombos] = useState(true);
  const [comboRetryKey, setComboRetryKey] = useState(0);

  useEffect(() => {
    if (currentRoute !== 'store') return;
    let active = true;
    setIsLoadingCombos(true);
    setCatalogError(null);
    fetchCombos().then((loadedCombos) => {
      if (!active) return;
      setBundles(loadedCombos);
      setSelectedBundleId((selectedId) => (
        loadedCombos.some((combo) => combo.id === selectedId)
          ? selectedId
          : loadedCombos[0]?.id ?? ''
      ));
    }).catch((error: unknown) => {
      console.error('Could not load combos from Supabase:', error);
      if (active) setCatalogError(error instanceof Error ? error.message : 'কম্বো লোড করা যায়নি');
    }).finally(() => {
      if (active) setIsLoadingCombos(false);
    });

    return () => {
      active = false;
    };
  }, [currentRoute, comboRetryKey]);

  useEffect(() => {
    const refreshBundleStock = () => {
      void Promise.all([fetchCombos(), fetchAllProducts()]).then(([freshCombos, products]) => {
        setBundles((currentBundles) => {
          const comboIds = new Set(freshCombos.map((combo) => combo.id));
          const selectedProducts = currentBundles
            .filter((bundle) => !comboIds.has(bundle.id))
            .flatMap((bundle) => {
              const product = products.find((item) => item.id === bundle.id);
              return product ? [productToBundle(product)] : [];
            });
          return [...freshCombos, ...selectedProducts];
        });
      }).catch((error: unknown) => {
        console.error('Could not refresh combo stock after order:', error);
      });
    };

    window.addEventListener('inventory-updated', refreshBundleStock);
    return () => window.removeEventListener('inventory-updated', refreshBundleStock);
  }, []);

  const handleOrderSuccess = (order: PlacedOrder) => {
    setPlacedOrder(order);
    window.dispatchEvent(new Event('inventory-updated'));
  };

  const handleSelectProduct = (product: ProductItem) => {
    const convertedBundle = productToBundle(product);

    setBundles((prev) => {
      if (prev.some((bundle) => bundle.id === product.id)) {
        return prev.map((bundle) => (bundle.id === product.id ? convertedBundle : bundle));
      }
      return [...prev, convertedBundle];
    });
    setSelectedBundleId(product.id);
  };

  const handleCloseSuccessModal = () => {
    setPlacedOrder(null);
  };

  // Dedicated Separate Page for Admin Dashboard (/admin)
  if (currentRoute === 'admin') {
    return (
      <Suspense fallback={<div className="min-h-screen bg-[#fbf9f4]" role="status" aria-label="অ্যাডমিন প্যানেল লোড হচ্ছে" />}>
        <AdminDashboard onNavigateToStore={() => navigateToRoute('store')} />
      </Suspense>
    );
  }

  // Store Front Landing Page (/)
  return (
    <div id="store-top" className="min-h-screen bg-[#fbf9f4] text-stone-900 flex flex-col font-['Hind_Siliguri',sans-serif]">
      {/* 1. Urgency Countdown & Announcement Top Bar */}
      <HeaderAnnouncement />
      <Navbar />

      <main className="flex-1">
        {/* 2. Hero Section Image Slider */}
        <HeroSlider />

        {/* 3. Admin-managed image cards */}
        <HomepageImageCards />

        {/* 4. Dedicated Carousel Slider for Individual Products (Not Combo Pack) */}
        <ProductCarousel onSelectProduct={handleSelectProduct} />

        {/* 4. CartFlows 1-Click Package / Combo Pack Selector */}
        <BundleSelector
          bundles={bundles}
          selectedBundleId={selectedBundleId}
          onSelectBundle={setSelectedBundleId}
          isLoading={isLoadingCombos}
          loadError={catalogError}
          onRetry={() => setComboRetryKey((current) => current + 1)}
        />

        {/* 5. Why Choose Us: 4 Pillars & Comparison with ordinary market shemai */}
        <WhyChooseUs />

        {/* 6. Traditional Culinary Recipe & Preparation Guide */}
        <RecipeGuide />

        {/* 7. WooCommerce & CartFlows 1-Page Express Checkout with Cash On Delivery & BD Zones */}
        <WooCommerceCheckout
          bundles={bundles}
          selectedBundleId={selectedBundleId}
          onSelectBundle={setSelectedBundleId}
          onOrderSuccess={handleOrderSuccess}
        />

        {/* 8. Verified Bangladeshi Customer Reviews & Social Proof */}
        <CustomerReviews />

        {/* 9. Frequently Asked Questions (FAQ) Accordion */}
        <div className="hidden sm:block">
          <FaqSection />
        </div>
      </main>

      {/* 10. Footer with Courier Partners & Admin portal link */}
      <Footer onOpenAdmin={() => navigateToRoute('admin')} />

      {/* Keep for future use: <StickyBottomMobileBar canOrder={Boolean(selectedBundleId)} /> */}

      {/* 13. Order Confirmed Invoice Modal with Confetti Celebration */}
      <OrderSuccessModal
        order={placedOrder}
        onClose={handleCloseSuccessModal}
      />
    </div>
  );
}
