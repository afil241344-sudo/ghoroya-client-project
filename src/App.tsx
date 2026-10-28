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
import { PlacedOrder, ShemaiBundle, ProductItem } from './types';
import { seedInitialProductsIfEmpty } from './services/dbService';
import { useCurrentRoute } from './router';

export default function App() {
  const [currentRoute, navigateToRoute] = useCurrentRoute();

  // Live products loaded from database (with fallback to default bundles)
  const [bundles, setBundles] = useState<ShemaiBundle[]>(SHEMAI_BUNDLES);
  const [selectedBundleId, setSelectedBundleId] = useState('bundle-double');
  const [placedOrder, setPlacedOrder] = useState<PlacedOrder | null>(null);

  useEffect(() => {
    // Seed and sync products with database
    seedInitialProductsIfEmpty().then((prods) => {
      if (prods && prods.length > 0) {
        setBundles(prods);
      }
    });
  }, [currentRoute]);

  const handleOrderSuccess = (order: PlacedOrder) => {
    setPlacedOrder(order);
  };

  const handleCloseSuccessModal = () => {
    setPlacedOrder(null);
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
    };

    setBundles((prev) => {
      if (prev.some((b) => b.id === product.id)) {
        return prev.map((b) => (b.id === product.id ? convertedBundle : b));
      }
      return [...prev, convertedBundle];
    });
    setSelectedBundleId(product.id);
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
