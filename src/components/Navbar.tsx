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
    <header className="sticky top-0 z-40 border-b border-amber-900/10 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-3 py-2 sm:gap-4 sm:px-4 sm:py-2.5">
        {/* Brand / Logo */}
        <a href="#store-top" aria-label="প্যারামাউন্ট ফুডস — হোমে যান" className="flex min-w-0 items-center gap-2.5 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-700 sm:gap-3">
          <img
            src={logoImage}
            alt=""
            className="h-10 w-10 shrink-0 rounded-xl border border-amber-900/15 object-cover object-[35%_50%] shadow-sm sm:h-12 sm:w-12"
          />
          <span className="min-w-0">
            <span className="block truncate text-sm font-extrabold tracking-tight text-stone-900 sm:text-lg">
              প্যারামাউন্ট ফুডস
            </span>
            <span className="hidden text-[11px] font-medium text-stone-500 sm:block">
              শাহী ঘি লাচ্ছা সেমাই
            </span>
          </span>
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
            href="https://wa.me/8801798241344?text=আমি%20খাঁটি%20ঘিয়ে%20ভাজা%20লাচ্ছা%20সেমাই%20সম্পর্কে%20জানতে%20ও%20অর্ডার%20করতে%20চাই"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden items-center gap-1.5 rounded-lg border border-[#25D366]/30 bg-[#25D366]/10 px-2.5 py-2 text-xs font-bold text-[#128C7E] transition-all hover:bg-[#25D366]/20 md:flex sm:text-sm"
            title="WhatsApp এ কথা বলুন"
          >
            <MessageCircle className="w-4 h-4 fill-current" />
            <span className="hidden md:inline">হোয়াটসঅ্যাপ</span>
          </a>

          {/* Primary Order Button */}
          <button
            type="button"
            onClick={scrollToCheckout}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-gradient-to-r from-emerald-700 to-emerald-800 px-3 text-xs font-bold text-white shadow-sm transition-all hover:from-emerald-800 hover:to-emerald-900 active:scale-95 sm:px-4 sm:text-sm"
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="sm:hidden">অর্ডার</span>
            <span className="hidden sm:inline">অর্ডার করুন</span>
          </button>
        </div>
      </div>
    </header>
  );
}
