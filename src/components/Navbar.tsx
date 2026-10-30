import { MessageCircle, ShoppingBag } from 'lucide-react';
import { scrollToCheckout } from '../utils/scrollToCheckout';
import logoImage from '../assets/images/shemai_packaging_box_1793156354481.jpg';

export default function Navbar() {
  const scrollToBundles = () => {
    const el = document.getElementById('bundles-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToReviews = () => {
    const el = document.getElementById('reviews-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <header className="sticky top-0 z-40 border-b border-stone-200/80 bg-white/95 shadow-sm backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2.5 sm:gap-4 sm:px-4 sm:py-3">
        {/* Brand / Logo */}
        <a
          href="#store-top"
          aria-label="প্যারামাউন্ট ফুডস — হোমে যান"
          className="flex shrink-0 items-center rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700"
        >
          <img
            src={logoImage}
            alt="প্যারামাউন্ট ফুডস"
            className="h-11 w-11 rounded-xl border border-amber-900/10 bg-amber-50 object-cover object-[35%_50%] shadow-sm sm:h-12 sm:w-12"
          />
        </a>

        {/* Center navigation links */}
        <nav aria-label="প্রধান নেভিগেশন" className="hidden items-center gap-6 text-sm font-semibold text-stone-700 lg:flex">
          <button type="button" onClick={scrollToBundles} className="cursor-pointer transition-colors hover:text-amber-700">
            অফার প্যাকেজ
          </button>
          <button type="button" onClick={scrollToReviews} className="cursor-pointer transition-colors hover:text-amber-700">
            গ্রাহক রিভিউ
          </button>
        </nav>

        {/* Action Controls */}
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          {/* WhatsApp Direct */}
          <a
            href="https://wa.me/8801798241344?text=আমি%20লাচ্ছা%20সেমাই%20অর্ডার%20করতে%20চাই"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="WhatsApp-এ লাচ্ছা সেমাই অর্ডার করুন"
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 transition-colors hover:bg-emerald-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 sm:h-10 sm:w-auto sm:gap-1.5 sm:px-3"
            title="WhatsApp এ মেসেজ দিন"
          >
            <MessageCircle className="h-[18px] w-[18px]" />
            <span className="hidden text-xs font-bold sm:inline">হোয়াটসঅ্যাপ</span>
          </a>

          {/* Primary Order Button */}
          <button
            type="button"
            onClick={scrollToCheckout}
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-emerald-800 px-4 text-sm font-bold text-white shadow-sm shadow-emerald-900/15 transition-colors hover:bg-emerald-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800 active:scale-[0.98] sm:h-10 sm:px-4"
          >
            <ShoppingBag className="h-4 w-4" />
            <span>অর্ডার করুন</span>
          </button>
        </div>
      </div>
    </header>
  );
}
