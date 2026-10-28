import { useState, useEffect } from 'react';
import { ShoppingBag, CheckCircle, X } from 'lucide-react';
import { LIVE_SALES_NOTIFICATIONS } from '../data/shemaiData';
import packagingBoxImg from '../assets/images/shemai_packaging_box_1793156354481.jpg';

export default function LiveSalesNotification() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    if (isDismissed) return;

    // Show initial notification after 3 seconds
    const initialTimer = setTimeout(() => {
      setIsVisible(true);
    }, 2500);

    // Loop interval
    const interval = setInterval(() => {
      // Hide
      setIsVisible(false);

      // Change item & show after 2s
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % LIVE_SALES_NOTIFICATIONS.length);
        setIsVisible(true);
      }, 1500);
    }, 9000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [isDismissed]);

  if (isDismissed || !isVisible) return null;

  const current = LIVE_SALES_NOTIFICATIONS[currentIndex];

  return (
    <div className="fixed bottom-20 left-4 z-40 max-w-xs sm:max-w-sm bg-white/95 backdrop-blur-md p-3 rounded-2xl shadow-xl border border-amber-900/15 animate-in slide-in-from-bottom-5 duration-300">
      <button
        onClick={() => setIsDismissed(true)}
        className="absolute top-2 right-2 text-stone-400 hover:text-stone-700 p-0.5 rounded cursor-pointer"
        title="বন্ধ করুন"
      >
        <X className="w-3.5 h-3.5" />
      </button>

      <div className="flex items-center gap-3 pr-4">
        <div className="relative w-11 h-11 rounded-xl overflow-hidden shrink-0 border border-stone-200">
          <img
            src={packagingBoxImg}
            alt="লাচ্ছা সেমাই বক্স"
            className="w-full h-full object-cover"
          />
          <div className="absolute -bottom-1 -right-1 bg-emerald-600 rounded-full p-0.5 text-white">
            <CheckCircle className="w-2.5 h-2.5 fill-current" />
          </div>
        </div>

        <div className="text-xs">
          <div className="flex items-center gap-1 font-bold text-stone-900">
            <span>{current.name}</span>
            <span className="text-[10px] text-stone-500 font-normal">
              ({current.location})
            </span>
          </div>
          <p className="text-[11px] text-emerald-800 font-medium line-clamp-1 mt-0.5">
            এইমাত্র <strong>{current.bundleTitle}</strong> অর্ডার করেছেন
          </p>
          <div className="flex items-center gap-1 text-[10px] text-stone-400 mt-0.5">
            <ShoppingBag className="w-2.5 h-2.5 text-amber-600" />
            <span>{current.timeAgo} · ক্যাশ অন ডেলিভারি</span>
          </div>
        </div>
      </div>
    </div>
  );
}
