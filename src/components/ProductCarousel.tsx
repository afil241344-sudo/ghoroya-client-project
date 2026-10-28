import React, { useState, useEffect, useRef } from 'react';
import { 
  ShoppingBag, 
  Package, 
  Eye, 
  X,
  Play,
  Pause,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { ProductItem } from '../types';
import { fetchAllProducts, seedInitialProductsCatalogIfEmpty } from '../services/dbService';

// Authentic Product Images
import shemaiBowlImg from '../assets/images/shemai_hero_bowl_1793156337325.jpg';
import gheeCloseupImg from '../assets/images/shemai_ghee_closeup_1793175979653.jpg';
import packagingBoxImg from '../assets/images/shemai_packaging_box_1793156354481.jpg';
import gheeJarImg from '../assets/images/shemai_ghee_jar_1793175996687.jpg';
import preparedDishImg from '../assets/images/prepared_malai_shemai_1793156370328.jpg';

// Image map for products
const PRODUCT_IMAGE_MAP: Record<string, string> = {
  'prod-shemai-450': shemaiBowlImg,
  'prod-ghee-250': gheeJarImg,
  'prod-topping-nuts': gheeCloseupImg,
  'prod-kismis-gold': preparedDishImg,
  'prod-shemai-shahi-box': packagingBoxImg,
};

const DEFAULT_IMAGE = shemaiBowlImg;

// Default fallback products if database is empty or loading
const FALLBACK_PRODUCTS: ProductItem[] = [
  {
    id: 'prod-shemai-450',
    name: 'শাহী গাওয়া ঘিয়ে ভাজা লাচ্ছা সেমাই',
    sku: 'LCH-SHM-450',
    category: 'লাচ্ছা সেমাই',
    unitWeight: '৪৫০ গ্রাম',
    costPrice: 280,
    regularPrice: 420,
    stockQuantity: 280,
    inStock: true,
    description: 'সিরাজগঞ্জের খাঁটি গাওয়া ঘিয়ে ভাজা প্রিমিয়াম মুচমুচে সোনালী সেমাই। কোনো ডালডা নেই।',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-ghee-250',
    name: 'খাঁটি দেশি গাওয়া ঘি স্পেশাল জার',
    sku: 'GHEE-JAR-250',
    category: 'গাওয়া ঘি',
    unitWeight: '২৫০ গ্রাম',
    costPrice: 320,
    regularPrice: 480,
    stockQuantity: 95,
    inStock: true,
    description: 'দেশি গাভীর খাঁটি দুধের সর থেকে ঐতিহ্যবাহী নিয়মে প্রস্তুতকৃত সুঘ্রাণযুক্ত গাওয়া ঘি।',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-topping-nuts',
    name: 'পেস্তা, কাঠবাদাম ও জাফরান টপিং',
    sku: 'TOP-NUT-100',
    category: 'টপিং ও বাদাম',
    unitWeight: '১০০ গ্রাম',
    costPrice: 150,
    regularPrice: 240,
    stockQuantity: 140,
    inStock: true,
    description: 'আসল ইরানি জাফরান, পেস্তা ও কাঠবাদাম স্লাইসের রাজকীয় ব্লেন্ড যা সেমাইয়ের স্বাদ দ্বিগুণ করে।',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-kismis-gold',
    name: 'প্রিমিয়াম গোল্ডেন কিশমিশ প্যাক',
    sku: 'KSM-GLD-150',
    category: 'ড্রাই ফ্রুটস',
    unitWeight: '১৫০ গ্রাম',
    costPrice: 110,
    regularPrice: 180,
    stockQuantity: 110,
    inStock: true,
    description: 'স্বাদ ও আকারে বড় মিষ্টি বাছাইকৃত আফগান গোল্ডেন কিশমিশ।',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-shemai-shahi-box',
    name: 'শাহী ফ্যামিলি গিফট বক্স লাচ্ছা সেমাই',
    sku: 'LCH-BOX-900',
    category: 'লাচ্ছা সেমাই',
    unitWeight: '৯০০ গ্রাম',
    costPrice: 520,
    regularPrice: 780,
    stockQuantity: 65,
    inStock: true,
    description: 'পরিবারের সবার জন্য প্রিমিয়াম উপহার বক্স। গাওয়া ঘিয়ে ভাজা ক্রিস্পি রাজকীয় লাচ্ছা সেমাই।',
    createdAt: new Date().toISOString(),
  },
];

interface ProductCarouselProps {
  onSelectProduct?: (product: ProductItem) => void;
}

export default function ProductCarousel({ onSelectProduct }: ProductCarouselProps) {
  const [products, setProducts] = useState<ProductItem[]>(FALLBACK_PRODUCTS);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [quickViewProduct, setQuickViewProduct] = useState<ProductItem | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const marqueeContainerRef = useRef<HTMLDivElement>(null);

  // Load products from Firestore / localStorage
  useEffect(() => {
    seedInitialProductsCatalogIfEmpty().then((items) => {
      if (items && items.length > 0) {
        setProducts(items);
      }
    });

    fetchAllProducts().then((items) => {
      if (items && items.length > 0) {
        setProducts(items);
      }
    });
  }, []);

  // Filter products by category if selected
  const activeProducts = activeCategory === 'all'
    ? products
    : products.filter((p) => p.category === activeCategory);

  // Repeat products array so the continuous animation has no gaps
  // If active products are fewer than 6, replicate more times to ensure seamless infinite scroll
  const repeatCount = activeProducts.length <= 3 ? 6 : activeProducts.length <= 6 ? 4 : 2;
  const marqueeItems = Array.from({ length: repeatCount }, () => activeProducts).flat();

  const getProductImage = (product: ProductItem): string => {
    if (product.imageUrl) return product.imageUrl;
    return PRODUCT_IMAGE_MAP[product.id] || DEFAULT_IMAGE;
  };

  const handleOrderClick = (product: ProductItem) => {
    if (onSelectProduct) {
      onSelectProduct(product);
    }
    const checkoutEl = document.getElementById('checkout-section');
    if (checkoutEl) {
      checkoutEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Available categories
  const categories = [
    { id: 'all', label: 'সব প্রোডাক্ট' },
    { id: 'লাচ্ছা সেমাই', label: 'লাচ্ছা সেমাই' },
    { id: 'গাওয়া ঘি', label: 'গাওয়া ঘি' },
    { id: 'টপিং ও বাদাম', label: 'টপিং ও ড্রাই ফ্রুটস' },
  ];

  return (
    <section 
      id="product-carousel-section"
      className="py-8 sm:py-12 bg-gradient-to-b from-[#fbf9f4] via-[#f5ede0] to-[#fbf9f4] border-b border-amber-900/10 relative overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 mb-5">
        {/* Header Ribbon */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-amber-100/90 text-amber-900 border border-amber-300/80 px-2.5 py-0.5 rounded-full text-xs font-bold shadow-2xs mb-2">
              <Package className="w-3.5 h-3.5 text-amber-700" />
              <span>একক প্রোডাক্ট থাম্বনেইল গ্যালারি (নট কম্বো)</span>
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-stone-900 tracking-tight flex items-center gap-2">
              <span>আমাদের প্রোডাক্ট কালেকশন</span>
              <span className="hidden sm:inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-300">
                <Sparkles className="w-3 h-3 text-amber-600 animate-spin" />
                চলমান প্রোডাক্ট
              </span>
            </h2>
            <p className="text-stone-600 text-xs sm:text-sm mt-1">
              যেকোনো থাম্বনেইলে ক্লিক করে বা &apos;অর্ডার&apos; বাটনে চাপ দিয়ে সরাসরি এককভাবে অর্ডার করুন
            </p>
          </div>

          {/* Action / Animation Controls */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            {/* Category Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  className={`text-[11px] sm:text-xs font-bold px-3 py-1.5 rounded-full whitespace-nowrap transition-all cursor-pointer ${
                    activeCategory === cat.id
                      ? 'bg-amber-700 text-white shadow-xs'
                      : 'bg-white/80 hover:bg-white text-stone-700 border border-stone-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Play / Pause Toggle Button */}
            <button
              type="button"
              onClick={() => setIsPaused((prev) => !prev)}
              title={isPaused ? 'মুভিং চালু করুন' : 'মুভিং থামান'}
              className="p-1.5 sm:p-2 rounded-full bg-white hover:bg-amber-50 text-stone-700 hover:text-amber-800 border border-stone-200 shadow-2xs transition-all cursor-pointer shrink-0"
            >
              {isPaused ? <Play className="w-4 h-4 text-emerald-600 fill-emerald-600" /> : <Pause className="w-4 h-4 text-amber-700" />}
            </button>
          </div>
        </div>
      </div>

      {/* CONTINUOUS MOVING THUMBNAIL TRACK */}
      <div 
        className="relative w-full overflow-hidden py-2"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        ref={marqueeContainerRef}
      >
        {/* Soft edge fade overlays for infinite flow effect */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-8 sm:w-20 bg-gradient-to-r from-[#fbf9f4] via-[#fbf9f4]/80 to-transparent z-10" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-8 sm:w-20 bg-gradient-to-l from-[#fbf9f4] via-[#fbf9f4]/80 to-transparent z-10" />

        {/* Endless Moving Flex Marquee */}
        <div 
          className="flex gap-3 sm:gap-4.5 animate-continuous-marquee"
          style={{
            animationPlayState: isPaused ? 'paused' : 'running',
            width: 'max-content',
          }}
        >
          {marqueeItems.map((product, index) => {
            const imgUrl = getProductImage(product);
            const originalPrice = Math.round(product.regularPrice * 1.25);

            return (
              <div
                key={`${product.id}-${index}`}
                onClick={() => handleOrderClick(product)}
                className="w-48 sm:w-56 shrink-0 bg-white rounded-2xl border border-stone-200/90 hover:border-amber-500 shadow-xs hover:shadow-xl transition-all duration-300 p-2.5 flex flex-col justify-between group cursor-pointer hover:-translate-y-1 select-none"
              >
                {/* 1. Thumbnail Image Container */}
                <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-stone-100 mb-2.5">
                  <img
                    src={imgUrl}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-108"
                    loading="lazy"
                  />

                  {/* Category Chip */}
                  <div className="absolute top-2 left-2 z-10">
                    <span className="text-[10px] font-bold bg-stone-900/85 backdrop-blur-2xs text-amber-300 px-2 py-0.5 rounded-md shadow-2xs">
                      {product.category}
                    </span>
                  </div>

                  {/* In-Stock Indicator */}
                  <div className="absolute top-2 right-2 z-10">
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-1 shadow-2xs ${
                      product.inStock 
                        ? 'bg-emerald-600/95 text-white' 
                        : 'bg-rose-600/95 text-white'
                    }`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      {product.inStock ? 'স্টকে আছে' : 'শেষ'}
                    </span>
                  </div>

                  {/* Quick Inspect Button on Hover */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setQuickViewProduct(product);
                    }}
                    title="বিস্তারিত দেখুন"
                    className="absolute bottom-2 right-2 bg-white/95 hover:bg-white text-stone-800 p-1.5 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-10"
                  >
                    <Eye className="w-3.5 h-3.5 text-amber-700" />
                  </button>
                </div>

                {/* 2. Thumbnail Info */}
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    {/* Unit Weight / SKU */}
                    <div className="flex items-center justify-between text-[11px] text-stone-500 mb-1">
                      <span className="font-semibold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded text-[10px]">
                        {product.unitWeight}
                      </span>
                      <span className="text-[10px] text-stone-400">একক প্যাক</span>
                    </div>

                    {/* Title */}
                    <h3 className="font-bold text-xs sm:text-sm text-stone-900 group-hover:text-amber-800 transition-colors line-clamp-1 leading-snug">
                      {product.name}
                    </h3>
                  </div>

                  {/* 3. Price & Quick Order Bar */}
                  <div className="mt-2.5 pt-2 border-t border-stone-100 flex items-center justify-between gap-1">
                    <div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-base sm:text-lg font-black text-stone-900">
                          ৳{product.regularPrice}
                        </span>
                        <span className="text-[11px] text-stone-400 line-through">
                          ৳{originalPrice}
                        </span>
                      </div>
                    </div>

                    {/* Compact Order CTA Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOrderClick(product);
                      }}
                      disabled={!product.inStock}
                      className="bg-amber-700 hover:bg-amber-800 active:scale-95 text-white font-bold text-[11px] py-1.5 px-2.5 rounded-lg shadow-2xs transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ShoppingBag className="w-3 h-3" />
                      <span>অর্ডার</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Helper text below */}
      <div className="max-w-7xl mx-auto px-4 mt-3 flex items-center justify-between text-[11px] sm:text-xs text-stone-500">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-2 h-2 rounded-full bg-amber-500 animate-ping" />
          মাউস নিলে বা আঙুল রাখলে মুভিং থেমে যাবে • কার্ডে ক্লিক করলে অর্ডার পেইজে যাবে
        </span>
        <button
          onClick={() => {
            const checkoutEl = document.getElementById('checkout-section');
            if (checkoutEl) checkoutEl.scrollIntoView({ behavior: 'smooth' });
          }}
          className="text-amber-800 font-bold hover:underline flex items-center gap-1 cursor-pointer"
        >
          <span>চেকআউট ফর্ম</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Quick View Modal */}
      {quickViewProduct && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setQuickViewProduct(null)}
        >
          <div 
            className="bg-white rounded-2xl max-w-sm sm:max-w-md w-full overflow-hidden shadow-2xl border border-stone-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative aspect-[4/3] bg-stone-100">
              <img
                src={getProductImage(quickViewProduct)}
                alt={quickViewProduct.name}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => setQuickViewProduct(null)}
                className="absolute top-3 right-3 p-1.5 rounded-full bg-stone-900/70 hover:bg-stone-900 text-white transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="absolute bottom-3 left-3">
                <span className="bg-stone-900/80 text-amber-300 text-xs font-bold px-2.5 py-1 rounded-md">
                  {quickViewProduct.category} • {quickViewProduct.unitWeight}
                </span>
              </div>
            </div>
            
            <div className="p-4 sm:p-5">
              <h3 className="text-base sm:text-lg font-bold text-stone-900 leading-snug">
                {quickViewProduct.name}
              </h3>
              <p className="text-stone-600 text-xs sm:text-sm mt-1.5 leading-relaxed">
                {quickViewProduct.description}
              </p>

              <div className="mt-3.5 p-3 bg-stone-50 rounded-xl flex items-center justify-between border border-stone-100">
                <div>
                  <span className="text-[11px] text-stone-500">মূল্য:</span>
                  <div className="text-xl sm:text-2xl font-black text-stone-900">
                    ৳{quickViewProduct.regularPrice}
                  </div>
                </div>
                <div className="text-right text-[11px] text-stone-600">
                  <div className="text-emerald-700 font-bold">ক্যাশ অন ডেলিভারি</div>
                  <div>সারা দেশে হোম ডেলিভারি</div>
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const prod = quickViewProduct;
                    setQuickViewProduct(null);
                    handleOrderClick(prod);
                  }}
                  className="flex-1 bg-amber-700 hover:bg-amber-800 text-white font-bold py-2 px-3 rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 text-xs sm:text-sm cursor-pointer"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>এখনই অর্ডার করুন</span>
                </button>
                <button
                  type="button"
                  onClick={() => setQuickViewProduct(null)}
                  className="px-3.5 py-2 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-50 font-bold text-xs sm:text-sm transition-all cursor-pointer"
                >
                  বন্ধ করুন
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
