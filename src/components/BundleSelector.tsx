import { Check, Flame, Gift, Sparkles, ArrowRight, Package } from 'lucide-react';
import { ShemaiBundle } from '../types';
import { scrollToCheckout } from '../utils/scrollToCheckout';
import { getBundleImage } from '../utils/bundleImages';

interface BundleSelectorProps {
  bundles: ShemaiBundle[];
  selectedBundleId: string;
  onSelectBundle: (bundleId: string) => void;
}

export default function BundleSelector({
  bundles,
  selectedBundleId,
  onSelectBundle,
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
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full mb-3 uppercase tracking-wider">
            <Flame className="w-3.5 h-3.5 text-amber-600 fill-current" />
            <span>স্পেশাল অফার বান্ডেল</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-stone-900">
            আপনার পছন্দের প্যাকেজটি নির্বাচন করুন
          </h2>
          <p className="mt-3 text-stone-600 text-sm sm:text-base">
            যে প্যাকেজটি নিতে চান সেটি সিলেক্ট করুন, সাথে সাথেই নিচের ফর্মটি আপডেট হয়ে যাবে।
          </p>
        </div>

        {/* 3 Bundle Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {bundles.map((bundle) => {
            const isSelected = selectedBundleId === bundle.id;
            const packImg = getBundleImage(bundle);

            return (
              <div
                key={bundle.id}
                onClick={() => {
                  if (bundle.inStock !== false && (bundle.stockCount === undefined || bundle.stockCount > 0)) {
                    onSelectBundle(bundle.id);
                  }
                }}
                className={`relative rounded-2xl bg-white p-5 sm:p-6 flex flex-col justify-between transition-all duration-300 cursor-pointer border-2 shadow-sm hover:shadow-xl ${
                  isSelected
                    ? 'border-emerald-600 ring-4 ring-emerald-500/20 transform -translate-y-1'
                    : 'border-stone-200 hover:border-amber-400'
                } ${bundle.popular ? 'md:-translate-y-2 border-amber-500' : ''} ${
                  bundle.inStock === false || bundle.stockCount === 0 ? 'cursor-not-allowed opacity-70' : ''
                }`}
              >
                {/* Top Badge */}
                {bundle.badge && (
                  <div className="absolute -top-3.5 left-1/2 transform -translate-x-1/2 z-20">
                    <span
                      className={`text-white text-xs font-bold px-3 py-1 rounded-full shadow-md flex items-center gap-1 whitespace-nowrap ${
                        bundle.badgeColor || 'bg-amber-600'
                      }`}
                    >
                      {bundle.popular ? (
                        <Flame className="w-3 h-3 fill-current text-yellow-300" />
                      ) : bundle.freeDelivery ? (
                        <Gift className="w-3 h-3" />
                      ) : (
                        <Sparkles className="w-3 h-3" />
                      )}
                      <span>{bundle.badge}</span>
                    </span>
                  </div>
                )}

                <div>
                  {/* Pack Thumbnail Image */}
                  <div className="relative aspect-[16/10] w-full rounded-xl overflow-hidden bg-stone-100 mb-4 border border-stone-100 group">
                    <img
                      src={packImg}
                      alt={bundle.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />

                    {/* Weight badge overlay */}
                    <div className="absolute bottom-2 left-2 z-10">
                      <span className="text-[11px] font-bold bg-stone-900/85 backdrop-blur-xs text-amber-300 px-2.5 py-0.5 rounded-md shadow-xs flex items-center gap-1">
                        <Package className="w-3 h-3 text-amber-400" />
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

                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-600 text-white'
                          : 'border-stone-300'
                      }`}
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
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
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
                    <p className={`mt-2 text-xs font-semibold ${
                      bundle.stockCount > 0 && bundle.inStock !== false ? 'text-emerald-700' : 'text-rose-700'
                    }`}>
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
                    disabled={bundle.inStock === false || bundle.stockCount === 0}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelect(bundle.id);
                    }}
                    className={`w-full py-2.5 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${
                      isSelected
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md'
                        : 'bg-stone-100 hover:bg-amber-100 text-stone-800 hover:text-amber-900 border border-stone-200'
                    }`}
                  >
                    <span>{bundle.inStock === false || bundle.stockCount === 0
                      ? 'স্টক শেষ'
                      : isSelected
                        ? '✓ নির্বাচিত প্যাকেজ'
                        : 'এই প্যাকেজটি নিন'}</span>
                    {bundle.inStock !== false && bundle.stockCount !== 0 && <ArrowRight className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Note below bundles */}
        <div className="mt-8 text-center text-xs sm:text-sm text-stone-600 bg-white/70 backdrop-blur-sm p-3 rounded-xl border border-amber-900/10 max-w-2xl mx-auto">
          💡 <strong>পরামর্শ:</strong> ৪ বক্সের গ্র্যান্ড প্যাকেজে পুরো <strong>৳৭১০ টাকা সাশ্রয়</strong> এবং সারাদেশের যেকোনো জেলায় <strong>ডেলিভারি চার্জ সম্পূর্ণ ফ্রি!</strong>
        </div>
      </div>
    </section>
  );
}
