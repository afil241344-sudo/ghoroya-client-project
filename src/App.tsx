import { useState, useEffect } from 'react';
import HeaderAnnouncement from './components/HeaderAnnouncement';
import HeroSlider from './components/HeroSlider';
import ProductCarousel from './components/ProductCarousel';
import WhyChooseUs from './components/WhyChooseUs';
import BundleSelector from './components/BundleSelector';
import RecipeGuide from './components/RecipeGuide';
import WooCommerceCheckout from './components/WooCommerceCheckout';
import CustomerReviews from './components/CustomerReviews';
import FaqSection from './components/FaqSection';
import OrderSuccessModal from './components/OrderSuccessModal';
import LiveSalesNotification from './components/LiveSalesNotification';
import StickyBottomMobileBar from './components/StickyBottomMobileBar';
import Footer from './components/Footer';
import AdminDashboard from './components/AdminDashboard';
import { SHEMAI_BUNDLES, CUSTOMER_REVIEWS } from './data/shemaiData';
import { PlacedOrder, ProductItem, ShemaiBundle } from './types';
import { fetchAllProducts, seedInitialCombosIfEmpty } from './services/dbService';
import { useCurrentRoute } from './router';

export default function App() {
  const [currentRoute, navigateToRoute] = useCurrentRoute();

  // Live products loaded from database (with fallback to default bundles)
  const [bundles, setBundles] = useState<ShemaiBundle[]>(SHEMAI_BUNDLES);
  const [selectedBundleId, setSelectedBundleId] = useState('bundle-double');
  const [placedOrder, setPlacedOrder] = useState<PlacedOrder | null>(null);
  const [catalogError, setCatalogError] = useState<string | null>(null);

  useEffect(() => {
    // Seed and sync products with database
    seedInitialCombosIfEmpty().then((prods) => {
      if (prods && prods.length > 0) {
        setBundles(prods);
      }
    }).catch((error: unknown) => {
      console.error('Could not load combos from Supabase:', error);
      setCatalogError(error instanceof Error ? error.message : 'কম্বো লোড করা যায়নি');
    });
  }, [currentRoute]);

  useEffect(() => {
    const refreshBundleStock = () => {
      void Promise.all([seedInitialCombosIfEmpty(), fetchAllProducts()]).then(([freshCombos, products]) => {
        setBundles((currentBundles) => {
          const currentProducts = currentBundles
            .filter((bundle) => !freshCombos.some((combo) => combo.id === bundle.id))
            .map((bundle) => {
              const product = products.find((item) => item.id === bundle.id);
              return product
                ? { ...bundle, inStock: product.inStock, stockCount: product.stockQuantity }
                : bundle;
            });
          return [...freshCombos, ...currentProducts];
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
    const convertedBundle: ShemaiBundle = {
      id: product.id,
      name: product.name,
      subtitle: `একক পণ্য (${product.unitWeight})`,
      weight: product.unitWeight,
      boxes: 1,
      originalPrice: Math.round(product.regularPrice * 1.25),
      salePrice: product.regularPrice,
      savings: Math.round(product.regularPrice * 0.25),
      badge: 'একক প্রোডাক্ট',
      badgeColor: 'bg-amber-600',
      freeDelivery: false,
      description: product.description,
      inStock: product.inStock,
      stockCount: product.stockQuantity,
    };

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
      <AdminDashboard onNavigateToStore={() => navigateToRoute('store')} />
    );
  }

  // Store Front Landing Page (/)
  return (
    <div className="min-h-screen bg-[#fbf9f4] text-stone-900 flex flex-col font-['Hind_Siliguri',sans-serif]">
      {/* 1. Urgency Countdown & Announcement Top Bar */}
      <HeaderAnnouncement />

      <main className="flex-1">
        {/* 2. Hero Section Image Slider */}
        <HeroSlider />

        {catalogError && (
          <p role="alert" className="mx-auto mt-4 max-w-7xl rounded-lg bg-rose-50 p-3 text-xs text-rose-700">
            Supabase থেকে কম্বো লোড করা যায়নি: {catalogError}
          </p>
        )}

        {/* 3. Dedicated Carousel Slider for Individual Products (Not Combo Pack) */}
        <ProductCarousel onSelectProduct={handleSelectProduct} />

        {/* 4. CartFlows 1-Click Package / Combo Pack Selector */}
        <BundleSelector
          bundles={bundles}
          selectedBundleId={selectedBundleId}
          onSelectBundle={setSelectedBundleId}
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
        <CustomerReviews reviews={CUSTOMER_REVIEWS} />

        {/* 9. Frequently Asked Questions (FAQ) Accordion */}
        <FaqSection />
      </main>

      {/* 10. Footer with Courier Partners & Admin portal link */}
      <Footer onOpenAdmin={() => navigateToRoute('admin')} />

      {/* 11. Live Sales Pop-up Notification (WordPress / CartFlows style social proof) */}
      <LiveSalesNotification />

      {/* 12. Sticky Mobile Action Bar for Fast Ordering */}
      <StickyBottomMobileBar />

      {/* 13. Order Confirmed Invoice Modal with Confetti Celebration */}
      <OrderSuccessModal
        order={placedOrder}
        onClose={handleCloseSuccessModal}
      />
    </div>
  );
}
