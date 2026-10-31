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
          className="flex shrink-0 items-center rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          style={{ outlineColor: 'var(--brand-amber)' }}
        >
          <img
            src={logoImage}
            alt="প্যারামাউন্ট ফুডস"
            className="h-11 w-11 rounded-xl border border-amber-900/10 bg-amber-50 object-cover object-[35%_50%] shadow-sm sm:h-12 sm:w-12"
          />
        </a>

        {/* Center navigation links */}
        <nav aria-label="প্রধান নেভিগেশন" className="hidden items-center gap-6 text-sm font-semibold text-stone-700 lg:flex">
          <button
            type="button"
            onClick={scrollToBundles}
            className="cursor-pointer transition-colors"
            style={{ color: 'inherit' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--brand-forest)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = ''; }}
          >
            অফার প্যাকেজ
          </button>
          <button
            type="button"
            onClick={scrollToReviews}
            className="cursor-pointer transition-colors"
            style={{ color: 'inherit' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--brand-forest)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = ''; }}
          >
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
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 sm:h-10 sm:w-auto sm:gap-1.5 sm:px-3"
            style={{
              borderColor: 'color-mix(in srgb, var(--brand-leaf) 35%, transparent)',
              backgroundColor: 'var(--brand-leaf-light)',
              color: 'var(--brand-leaf-dark)',
              outlineColor: 'var(--brand-leaf)',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = '#d4edcc'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--brand-leaf-light)'; }}
            title="WhatsApp এ মেসেজ দিন"
          >
            <MessageCircle className="h-[18px] w-[18px]" />
            <span className="hidden text-xs font-bold sm:inline">হোয়াটসঅ্যাপ</span>
          </a>

          {/* Primary Order Button — brand forest green */}
          <button
            type="button"
            onClick={scrollToCheckout}
            className="inline-flex h-11 items-center gap-2 rounded-xl px-4 text-sm font-bold text-white shadow-sm transition-all active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 sm:h-10 sm:px-4"
            style={{ backgroundColor: 'var(--brand-forest)', outlineColor: 'var(--brand-forest)' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--brand-forest-dark)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--brand-forest)'; }}
          >
            <ShoppingBag className="h-4 w-4" />
            <span>অর্ডার করুন</span>
          </button>
        </div>
      </div>
    </header>
  );
}
