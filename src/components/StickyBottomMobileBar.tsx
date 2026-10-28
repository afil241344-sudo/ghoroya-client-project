import { ShoppingBag, Phone, MessageCircle } from 'lucide-react';
import { scrollToCheckout } from '../utils/scrollToCheckout';

export default function StickyBottomMobileBar() {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-300 p-2 sm:hidden shadow-[0_-4px_15px_rgba(0,0,0,0.08)]">
      <div className="flex items-center gap-2 max-w-md mx-auto">
        {/* Call Button */}
        <a
          href="tel:01798241344"
          className="flex flex-col items-center justify-center bg-stone-100 hover:bg-stone-200 text-stone-800 p-2 rounded-xl text-[10px] font-bold border border-stone-300 shrink-0 w-14"
          title="কল করুন"
        >
          <Phone className="w-4 h-4 text-emerald-700" />
          <span className="mt-0.5">কল</span>
        </a>

        {/* WhatsApp Button */}
        <a
          href="https://wa.me/8801798241344?text=আমি%20লাচ্ছা%20সেমাই%20অর্ডার%20করতে%20চাই"
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center justify-center bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#128C7E] p-2 rounded-xl text-[10px] font-bold border border-[#25D366]/30 shrink-0 w-14"
          title="WhatsApp এ মেসেজ দিন"
        >
          <MessageCircle className="w-4 h-4 fill-current" />
          <span className="mt-0.5">চ্যাট</span>
        </a>

        {/* Big Order CTA */}
        <button
          onClick={scrollToCheckout}
          className="flex-1 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-extrabold py-3 px-3 rounded-xl text-sm flex items-center justify-center gap-1.5 shadow-md active:scale-98 transition-all cursor-pointer"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>অর্ডার করুন (৳৪২০ থেকে)</span>
        </button>
      </div>
    </div>
  );
}
