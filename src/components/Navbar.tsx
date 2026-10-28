import { ShieldCheck, Truck, Phone, MessageCircle, ShoppingBag } from 'lucide-react';
import { scrollToCheckout } from '../utils/scrollToCheckout';

export default function Navbar() {
  const scrollToBundles = () => {
    const el = document.getElementById('bundles-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToRecipe = () => {
    const el = document.getElementById('recipe-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToReviews = () => {
    const el = document.getElementById('reviews-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-amber-900/10 sticky top-[37px] sm:top-[36px] z-40 transition-all">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-amber-600 via-amber-700 to-amber-900 text-amber-100 flex items-center justify-center font-bold text-xl sm:text-2xl shadow-inner border border-amber-400/40">
            <span>শাহী</span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-stone-900 text-lg sm:text-xl tracking-tight">
                প্যারামাউন্ট ফুডস
              </span>
              <span className="text-[10px] bg-amber-100 text-amber-800 font-semibold px-1.5 py-0.5 rounded border border-amber-300">
                অরিজিনাল
              </span>
            </div>
            <p className="text-xs text-stone-500 font-medium hidden sm:block">
              সিরাজগঞ্জের খাঁটি গাওয়া ঘিয়ে ভাজা স্পেশাল লাচ্ছা সেমাই
            </p>
          </div>
        </div>

        {/* Center navigation links */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-semibold text-stone-700">
          <button onClick={scrollToBundles} className="hover:text-amber-700 transition-colors cursor-pointer">
            অফার প্যাকেজ
          </button>
          <button onClick={scrollToRecipe} className="hover:text-amber-700 transition-colors cursor-pointer">
            রান্নার রেসিপি
          </button>
          <button onClick={scrollToReviews} className="hover:text-amber-700 transition-colors cursor-pointer">
            গ্রাহক রিভিউ
          </button>
          <a href="#faq-section" className="hover:text-amber-700 transition-colors">
            প্রশ্নোত্তর
          </a>
        </nav>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* WhatsApp Direct */}
          <a
            href="https://wa.me/8801798241344?text=আমি%20খাঁটি%20ঘিয়ে%20ভাজা%20লাচ্ছা%20সেমাই%20সম্পর্কে%20জানতে%20ও%20অর্ডার%20করতে%20চাই"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#128C7E] px-2.5 py-2 rounded-lg text-xs sm:text-sm font-bold border border-[#25D366]/30 transition-all"
            title="WhatsApp এ কথা বলুন"
          >
            <MessageCircle className="w-4 h-4 fill-current" />
            <span className="hidden md:inline">হোয়াটসঅ্যাপ</span>
          </a>

          {/* Direct Phone */}
          <a
            href="tel:01798241344"
            className="hidden xl:flex items-center gap-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 px-3 py-2 rounded-lg text-xs sm:text-sm font-bold border border-stone-300 transition-all"
          >
            <Phone className="w-4 h-4 text-emerald-600" />
            <span>01798-241344</span>
          </a>

          {/* Primary Order Button */}
          <button
            onClick={scrollToCheckout}
            className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all cursor-pointer transform active:scale-95"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>অর্ডার করুন</span>
          </button>
        </div>
      </div>

      {/* Trust micro-bar underneath navbar */}
      <div className="bg-[#faf5ea] border-t border-amber-900/5 py-1.5 px-4 text-stone-600 text-[11px] sm:text-xs">
        <div className="max-w-6xl mx-auto flex items-center justify-between sm:justify-around overflow-x-auto gap-4 no-scrollbar">
          <div className="flex items-center gap-1.5 shrink-0">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>১০০% খাঁটি গাওয়া ঘি</span>
          </div>
          <span className="text-stone-300 hidden sm:inline">|</span>
          <div className="flex items-center gap-1.5 shrink-0">
            <Truck className="w-3.5 h-3.5 text-amber-700" />
            <span>সারাদেশে ক্যাশ অন ডেলিভারি</span>
          </div>
          <span className="text-stone-300 hidden sm:inline">|</span>
          <div className="flex items-center gap-1.5 shrink-0 font-medium text-stone-700">
            <span>পণ্য চেক করে মূল্য পরিশোধের নিশ্চয়তা</span>
          </div>
        </div>
      </div>
    </header>
  );
}
