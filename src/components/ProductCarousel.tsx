import { useEffect, useState } from 'react';
import { ShoppingBag } from 'lucide-react';
import { ProductItem } from '../types';
import { fetchAllProducts } from '../services/dbService';
import { scrollToCheckout } from '../utils/scrollToCheckout';

import shemaiBowlImg from '../assets/images/shemai_hero_bowl_1793156337325.jpg';
import gheeCloseupImg from '../assets/images/shemai_ghee_closeup_1793175979653.jpg';
import packagingBoxImg from '../assets/images/shemai_packaging_box_1793156354481.jpg';
import gheeJarImg from '../assets/images/shemai_ghee_jar_1793175996687.jpg';
import preparedDishImg from '../assets/images/prepared_malai_shemai_1793156370328.jpg';

const PRODUCT_IMAGE_MAP: Record<string, string> = {
  'prod-shemai-450': shemaiBowlImg,
  'prod-ghee-250': gheeJarImg,
  'prod-topping-nuts': gheeCloseupImg,
  'prod-kismis-gold': preparedDishImg,
  'prod-shemai-shahi-box': packagingBoxImg,
};

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

const getProductImage = (product: ProductItem): string =>
  product.imageUrl || PRODUCT_IMAGE_MAP[product.id] || shemaiBowlImg;

interface ProductCarouselProps {
  onSelectProduct?: (product: ProductItem) => void;
}

export default function ProductCarousel({ onSelectProduct }: ProductCarouselProps) {
  const [products, setProducts] = useState<ProductItem[]>(FALLBACK_PRODUCTS);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const refreshProducts = () => {
      void fetchAllProducts().then((items) => {
        if (isMounted && items.length > 0) setProducts(items);
      }).catch((error: unknown) => {
        console.error('Could not fetch products from Supabase:', error);
        if (isMounted) {
          setLoadError(error instanceof Error ? error.message : 'প্রোডাক্ট লোড করা যায়নি');
        }
      });
    };

    refreshProducts();
    window.addEventListener('inventory-updated', refreshProducts);
    return () => {
      isMounted = false;
      window.removeEventListener('inventory-updated', refreshProducts);
    };
  }, []);

  const galleryProducts = Array.from(
    { length: 6 },
    (_, index) => products[index % products.length],
  );

  const handleOrderClick = (product: ProductItem) => {
    onSelectProduct?.(product);
    scrollToCheckout();
  };

  return (
    <section
      id="product-carousel-section"
      className="border-b border-amber-900/10 bg-gradient-to-b from-[#fbf9f4] via-[#f5ede0] to-[#fbf9f4] py-8 sm:py-12"
    >
      <div className="mx-auto grid max-w-7xl grid-cols-6 gap-0.5 px-2 sm:gap-1 sm:px-4">
        {galleryProducts.map((product, index) => (
          <div
            key={`${product.id}-${index}`}
            className="aspect-square min-w-0 overflow-hidden rounded-lg border border-stone-200/90 bg-white shadow-sm sm:rounded-xl"
          >
            <img
              src={getProductImage(product)}
              alt={product.name}
              className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
              loading="lazy"
            />
          </div>
        ))}
      </div>
      <div className="mx-auto mt-6 max-w-7xl px-3 sm:mt-8 sm:px-4">
        {loadError && (
          <p role="alert" className="mb-3 rounded-lg bg-rose-50 p-3 text-xs text-rose-700">
            Supabase থেকে প্রোডাক্ট লোড করা যায়নি: {loadError}
          </p>
        )}
        <h2 className="mb-3 text-lg font-extrabold text-stone-900 sm:mb-4 sm:text-2xl">
          সব প্রোডাক্ট
        </h2>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
          {products.map((product) => (
            <article
              key={product.id}
              className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm sm:rounded-2xl"
            >
              <div className="aspect-square overflow-hidden bg-stone-100">
                <img
                  src={getProductImage(product)}
                  alt={product.name}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="p-2.5 sm:p-4">
                <h3 className="line-clamp-2 min-h-10 text-xs font-bold leading-relaxed text-stone-900 sm:text-sm">
                  {product.name}
                </h3>
                <p className="mt-1 text-[11px] text-stone-500 sm:text-xs">
                  {product.unitWeight}
                </p>
                <div className="mt-2 flex items-center justify-between gap-1">
                  <span className="text-sm font-black text-stone-900 sm:text-lg">
                    ৳{product.regularPrice}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleOrderClick(product)}
                    disabled={!product.inStock || product.stockQuantity <= 0}
                    className="inline-flex items-center gap-1 rounded-lg bg-amber-700 px-2 py-1.5 text-[11px] font-bold text-white transition-colors hover:bg-amber-800 disabled:cursor-not-allowed disabled:opacity-50 sm:px-3 sm:text-xs"
                  >
                    <ShoppingBag className="h-3 w-3" />
                    {!product.inStock || product.stockQuantity <= 0 ? 'স্টক শেষ' : 'অর্ডার'}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
