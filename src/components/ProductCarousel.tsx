import { useCallback, useEffect, useState } from 'react';
import { Image as ImageIcon, RefreshCw, ShoppingBag } from 'lucide-react';
import { ProductItem } from '../types';
import { fetchAllProducts } from '../services/dbService';
import { scrollToCheckout } from '../utils/scrollToCheckout';

interface ProductCarouselProps {
  onSelectProduct?: (product: ProductItem) => void;
}

export default function ProductCarousel({ onSelectProduct }: ProductCarouselProps) {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshProducts = useCallback(async (isActive: () => boolean = () => true) => {
    if (isActive()) {
      setIsLoading(true);
      setLoadError(null);
    }
    try {
      const loadedProducts = await fetchAllProducts();
      if (isActive()) setProducts(loadedProducts);
    } catch (error: unknown) {
      console.error('Could not fetch products from Supabase:', error);
      if (isActive()) {
        setLoadError(error instanceof Error ? error.message : 'প্রোডাক্ট লোড করা যায়নি');
      }
    } finally {
      if (isActive()) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const refresh = () => {
      void refreshProducts(() => isMounted);
    };
    refresh();
    window.addEventListener('inventory-updated', refresh);
    return () => {
      isMounted = false;
      window.removeEventListener('inventory-updated', refresh);
    };
  }, [refreshProducts]);

  const handleOrderClick = (product: ProductItem) => {
    onSelectProduct?.(product);
    scrollToCheckout();
  };

  return (
    <section
      id="product-carousel-section"
      className="border-b border-amber-900/10 bg-gradient-to-b from-[#fbf9f4] via-[#f5ede0] to-[#fbf9f4] pb-8 pt-2 sm:pb-12 sm:pt-3"
    >
      <div className="mx-auto max-w-7xl px-3 sm:px-4">
        <div className="mb-3 flex items-center justify-between gap-3 sm:mb-4">
          <h2 className="text-lg font-extrabold text-stone-900 sm:text-2xl">
            সব প্রোডাক্ট
          </h2>
          {loadError && (
            <button
              type="button"
              onClick={() => void refreshProducts()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs font-bold text-stone-700 hover:bg-stone-50"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              আবার চেষ্টা করুন
            </button>
          )}
        </div>
        {loadError && (
          <p role="alert" className="mb-3 rounded-lg bg-rose-50 p-3 text-xs text-rose-700">
            প্রোডাক্ট লোড করা যায়নি। {loadError}
          </p>
        )}
        {isLoading ? (
          <div role="status" className="rounded-2xl border border-stone-200 bg-white p-8 text-center text-sm text-stone-600">
            প্রোডাক্ট লোড হচ্ছে...
          </div>
        ) : products.length === 0 && loadError ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-10 text-center">
            <h3 className="text-base font-bold text-rose-800">প্রোডাক্ট দেখানো যাচ্ছে না</h3>
            <p className="mt-1 text-sm text-rose-700">সংযোগ ঠিক হলে আবার চেষ্টা করুন।</p>
          </div>
        ) : products.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-stone-300 bg-white/80 px-5 py-10 text-center">
            <ImageIcon className="mx-auto h-9 w-9 text-stone-400" />
            <h3 className="mt-3 text-base font-bold text-stone-800">এখনো কোনো প্রোডাক্ট পাওয়া যাচ্ছে না</h3>
            <p className="mt-1 text-sm text-stone-600">নতুন পণ্য যোগ হলে এই তালিকায় দেখা যাবে। অনুগ্রহ করে পরে আবার দেখুন।</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
            {products.map((product) => (
              <article
                key={product.id}
                className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm sm:rounded-2xl"
              >
                <div className="aspect-square overflow-hidden bg-stone-100">
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" loading="lazy" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-stone-400" aria-label="ছবি নেই">
                      <ImageIcon className="h-10 w-10" />
                    </div>
                  )}
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
        )}
      </div>
    </section>
  );
}
