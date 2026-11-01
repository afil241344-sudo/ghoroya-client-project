import { Check, Flame, Gift, Sparkles, ArrowRight, Image as ImageIcon, Package, RefreshCw } from 'lucide-react';
import { ShemaiBundle } from '../types';
import { scrollToCheckout } from '../utils/scrollToCheckout';

interface BundleSelectorProps {
  bundles: ShemaiBundle[];
  selectedBundleId: string;
  onSelectBundle: (bundleId: string) => void;
  isLoading: boolean;
  loadError: string | null;
  onRetry: () => void;
}

export default function BundleSelector({
  bundles,
  selectedBundleId,
  onSelectBundle,
  isLoading,
  loadError,
  onRetry,
}: BundleSelectorProps) {
  const handleSelect = (id: string) => {
    onSelectBundle(id);
    scrollToCheckout();
  };

  return (
    <section id="bundles-section" className="py-12 sm:py-16 bg-[#faf6ed] border-b border-amber-900/10">
      <div className="max-w-6xl mx-auto px-4">
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          {bundles.length > 0 && (
            <div
              className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full mb-3 uppercase tracking-wider"
              style={{ color: 'var(--brand-forest)', backgroundColor: 'var(--brand-forest-light)' }}
            >
              <Flame className="w-3.5 h-3.5 fill-current" style={{ color: 'var(--brand-amber)' }} />
              <span>স্পেশাল অফার বান্ডেল</span>
            </div>
          )}
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-stone-900">
            আপনার পছন্দের প্যাকেজটি নির্বাচন করুন
          </h2>
          <p className="mt-3 text-stone-600 text-sm sm:text-base">
            যে প্যাকেজটি নিতে চান সেটি সিলেক্ট করুন, সাথে সাথেই নিচের ফর্মটি আপডেট হয়ে যাবে।
          </p>
        </div>

        {loadError && (
          <div role="alert" className="mx-auto mb-5 flex max-w-2xl flex-col items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-center text-sm text-rose-800 sm:flex-row sm:justify-between sm:text-left">
            <span>কম্বো অফার লোড করা যায়নি। {loadError}</span>
            <button type="button" onClick={onRetry} className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-rose-300 bg-white px-3 py-2 text-xs font-bold hover:bg-rose-100">
              <RefreshCw className="h-3.5 w-3.5" />
              আবার চেষ্টা করুন
            </button>
          </div>
        )}

        {isLoading ? (
          <div role="status" className="rounded-2xl border border-stone-200 bg-white p-8 text-center text-sm text-stone-600">
            অফার লোড হচ্ছে...
          </div>
        ) : bundles.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-stone-300 bg-white/80 px-5 py-9 text-center">
            <Package className="mx-auto h-9 w-9 text-stone-400" />
            <h3 className="mt-3 text-base font-bold text-stone-800">
              {loadError ? 'অফার সাময়িকভাবে দেখা যাচ্ছে না' : 'এখন কোনো কম্বো অফার নেই'}
            </h3>
            <p className="mt-1 text-sm text-stone-600">
              {loadError
                ? 'আবার চেষ্টা করুন অথবা উপরের প্রোডাক্ট তালিকা থেকে পণ্য নির্বাচন করুন।'
                : 'উপরের প্রোডাক্ট তালিকা থেকে পণ্য বেছে অর্ডার করতে পারবেন। নতুন অফার এলে এখানে দেখা যাবে।'}
            </p>
            <button
              type="button"
              onClick={() => document.getElementById('product-carousel-section')?.scrollIntoView({ behavior: 'smooth' })}
              className="mt-4 rounded-lg px-4 py-2.5 text-xs font-bold text-white"
              style={{ backgroundColor: 'var(--brand-forest)' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--brand-forest-dark)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--brand-forest)'; }}
            >
              প্রোডাক্ট দেখুন
            </button>
          </div>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {bundles.map((bundle) => {
            const isSelected = selectedBundleId === bundle.id;
            const outOfStock = bundle.inStock === false || bundle.stockCount === 0;

            return (
              <div
                key={bundle.id}
                onClick={() => {
                  if (!outOfStock) onSelectBundle(bundle.id);
                }}
                className={`relative rounded-2xl bg-white p-5 sm:p-6 flex flex-col justify-between transition-all duration-300 cursor-pointer border-2 shadow-sm hover:shadow-xl ${
                  outOfStock ? 'cursor-not-allowed opacity-70' : ''
                } ${bundle.popular ? 'md:-translate-y-2' : ''}`}
                style={{
                  borderColor: isSelected
                    ? 'var(--brand-forest)'
                    : bundle.popular
                    ? 'var(--brand-amber)'
                    : '#e7e5e4',
                  boxShadow: isSelected
                    ? '0 0 0 4px color-mix(in srgb, var(--brand-forest) 18%, transparent)'
                    : undefined,
                  transform: isSelected
                    ? 'translateY(-4px)'
                    : bundle.popular
                    ? 'translateY(-8px)'
                    : undefined,
                }}
              >
                {/* Top Floating Badge */}
                {bundle.badge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-20">
                    <div
                      className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold tracking-wide whitespace-nowrap shadow-md border"
                      style={
                        bundle.popular
                          ? {
                              backgroundColor: '#ffffff',
                              color: 'var(--brand-forest-dark)',
                              borderColor: 'var(--brand-forest)',
                              boxShadow: '0 4px 14px rgba(29, 92, 42, 0.15)',
                            }
                          : bundle.freeDelivery
                          ? {
                              backgroundColor: '#ffffff',
                              color: 'var(--brand-leaf-dark)',
                              borderColor: 'var(--brand-leaf)',
                              boxShadow: '0 4px 14px rgba(90, 158, 42, 0.15)',
                            }
                          : {
                              backgroundColor: '#ffffff',
                              color: 'var(--brand-amber-dark)',
                              borderColor: 'var(--brand-amber)',
                              boxShadow: '0 4px 14px rgba(200, 145, 46, 0.15)',
                            }
                      }
                    >
                      {bundle.popular ? (
                        <Flame className="w-3.5 h-3.5 fill-current" style={{ color: 'var(--brand-amber)' }} />
                      ) : bundle.freeDelivery ? (
                        <Gift className="w-3.5 h-3.5" style={{ color: 'var(--brand-leaf)' }} />
                      ) : (
                        <Sparkles className="w-3.5 h-3.5" style={{ color: 'var(--brand-amber)' }} />
                      )}
                      <span className="font-extrabold">{bundle.badge}</span>
                    </div>
                  </div>
                )}

                <div>
                  {/* Pack Thumbnail Image */}
                  <div className="relative aspect-[16/10] w-full rounded-xl overflow-hidden bg-stone-100 mb-4 border border-stone-100 group">
                    {bundle.imageUrl ? (
                      <img
                        src={bundle.imageUrl}
                        alt={bundle.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-stone-400" aria-label="ছবি নেই">
                        <ImageIcon className="h-10 w-10" />
                      </div>
                    )}

                    {/* Weight badge overlay */}
                    <div className="absolute bottom-2 left-2 z-10">
                      <span className="text-[11px] font-bold bg-stone-900/85 backdrop-blur-xs px-2.5 py-0.5 rounded-md shadow-xs flex items-center gap-1" style={{ color: 'var(--brand-amber)' }}>
                        <Package className="w-3 h-3" style={{ color: 'var(--brand-amber)' }} />
                        <span>{bundle.weight}</span>
                      </span>
                    </div>

                    {/* Boxes count badge */}
                    {bundle.boxes > 0 && (
                      <div className="absolute top-2 right-2 z-10">
                        <span className="text-[10px] font-bold bg-white/95 text-stone-800 px-2.5 py-0.5 rounded-full shadow-xs border border-stone-200">
                          {bundle.boxes} টি বক্স
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Radio indicator and Package Title */}
                  <div className="flex items-start justify-between gap-2 mt-1">
                    <div>
                      <h3 className="font-extrabold text-stone-900 text-lg sm:text-xl">
                        {bundle.name}
                      </h3>
                      <p className="text-xs text-stone-500 font-medium mt-0.5">
                        {bundle.subtitle}
                      </p>
                    </div>

                    {/* Selected radio circle — forest green */}
                    <div
                      className="w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors"
                      style={{
                        borderColor: isSelected ? 'var(--brand-forest)' : '#d6d3d1',
                        backgroundColor: isSelected ? 'var(--brand-forest)' : 'transparent',
                        color: 'white',
                      }}
                    >
                      {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                    </div>
                  </div>

                  {/* Price display */}
                  <div className="mt-4 pt-3.5 border-t border-stone-100">
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl sm:text-3xl font-extrabold text-stone-950">
                        ৳{bundle.salePrice}
                      </span>
                      <span className="text-sm sm:text-base text-stone-400 line-through">
                        ৳{bundle.originalPrice}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded">
                        সাশ্রয় ৳{bundle.savings}!
                      </span>
                      {bundle.freeDelivery ? (
                        <span
                          className="text-xs font-bold px-2 py-0.5 rounded"
                          style={{ color: 'var(--brand-leaf-dark)', backgroundColor: 'var(--brand-leaf-light)' }}
                        >
                          ফ্রি ডেলিভারি
                        </span>
                      ) : (
                        <span className="text-[11px] text-stone-500">
                          রেগুলার ডেলিভারি
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  <p className="mt-3 text-xs sm:text-sm text-stone-600 leading-relaxed">
                    {bundle.description}
                  </p>
                  {bundle.stockCount !== undefined && (
                    <p
                      className="mt-2 text-xs font-semibold"
                      style={{
                        color: bundle.stockCount > 0 && bundle.inStock !== false
                          ? 'var(--brand-leaf-dark)'
                          : '#be123c',
                      }}
                    >
                      {bundle.stockCount > 0 && bundle.inStock !== false
                        ? `স্টক আছে: ${bundle.stockCount} টি`
                        : 'স্টক শেষ'}
                    </p>
                  )}
                </div>

                {/* Bottom Select Action */}
                <div className="mt-5 pt-3.5 border-t border-stone-100">
                  <button
                    type="button"
                    disabled={outOfStock}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelect(bundle.id);
                    }}
                    className="w-full py-2.5 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                    style={
                      isSelected
                        ? { backgroundColor: 'var(--brand-forest)', color: 'white' }
                        : { backgroundColor: '#f5f5f4', color: '#1c1917', border: '1px solid #e7e5e4' }
                    }
                    onMouseEnter={(e) => {
                      if (outOfStock) return;
                      const el = e.currentTarget as HTMLElement;
                      if (isSelected) {
                        el.style.backgroundColor = 'var(--brand-forest-dark)';
                      } else {
                        el.style.backgroundColor = 'var(--brand-amber-light)';
                        el.style.color = 'var(--brand-amber-dark)';
                        el.style.borderColor = 'var(--brand-amber)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      const el = e.currentTarget as HTMLElement;
                      if (isSelected) {
                        el.style.backgroundColor = 'var(--brand-forest)';
                      } else {
                        el.style.backgroundColor = '#f5f5f4';
                        el.style.color = '#1c1917';
                        el.style.borderColor = '#e7e5e4';
                      }
                    }}
                  >
                    <span>{outOfStock
                      ? 'স্টক শেষ'
                      : isSelected
                        ? '✓ নির্বাচিত প্যাকেজ'
                        : 'এই প্যাকেজটি নিন'}</span>
                    {!outOfStock && <ArrowRight className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        )}

      </div>
    </section>
  );
}
