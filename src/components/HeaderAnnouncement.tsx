import { useState, useEffect } from 'react';
import { Clock, PhoneCall, Sparkles } from 'lucide-react';
import { scrollToCheckout } from '../utils/scrollToCheckout';

export default function HeaderAnnouncement() {
  // Countdown timer for urgency
  const [timeLeft, setTimeLeft] = useState({
    hours: 7,
    minutes: 42,
    seconds: 19,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return { hours: 12, minutes: 0, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatNumber = (num: number) => {
    return num.toString().padStart(2, '0');
  };

  return (
    <div className="bg-gradient-to-r from-[#991b1b] via-[#b91c1c] to-[#991b1b] text-white text-xs sm:text-sm py-2 px-3 sticky top-0 z-50 shadow-md">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2 text-center md:text-left">
        {/* Left message */}
        <div className="flex items-center gap-2 font-medium justify-center">
          <span className="inline-flex items-center justify-center bg-amber-400 text-stone-900 px-2 py-0.5 rounded text-xs font-bold tracking-wide uppercase">
            সীমিত স্টক অফার
          </span>
          <span className="hidden sm:inline">খাঁটি গাওয়া ঘিয়ে ভাজা সেমাইয়ে বিশেষ ছাড় চলছে!</span>
          <span className="sm:hidden">ঘিয়ে ভাজা লাচ্ছা সেমাইয়ে ছাড় চলছে!</span>
          <span className="hidden lg:inline text-amber-200">· পণ্য হাতে পেয়ে টাকা দিন</span>
        </div>

        {/* Right side: Countdown and Contact */}
        <div className="flex items-center gap-3 sm:gap-4 justify-center">
          <div className="flex items-center gap-1.5 bg-black/25 px-2.5 py-1 rounded border border-white/10 font-mono text-xs">
            <Clock className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
            <span className="text-amber-100 font-sans hidden sm:inline">অফার শেষ হতে:</span>
            <span className="bg-white/20 text-white font-bold px-1 rounded">
              {formatNumber(timeLeft.hours)}
            </span>
            <span>:</span>
            <span className="bg-white/20 text-white font-bold px-1 rounded">
              {formatNumber(timeLeft.minutes)}
            </span>
            <span>:</span>
            <span className="bg-amber-400 text-stone-950 font-bold px-1 rounded">
              {formatNumber(timeLeft.seconds)}
            </span>
          </div>

          <a
            href="tel:01798241344"
            className="hidden sm:flex items-center gap-1 text-amber-200 hover:text-white transition-colors text-xs font-semibold"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>01798-241344</span>
          </a>

          <button
            onClick={scrollToCheckout}
            className="bg-amber-400 hover:bg-amber-300 text-stone-900 font-bold text-xs px-2.5 py-1 rounded shadow-sm hover:shadow transition-all transform active:scale-95 flex items-center gap-1 cursor-pointer"
          >
            <Sparkles className="w-3 h-3 text-red-700" />
            <span>অর্ডার করুন</span>
          </button>
        </div>
      </div>
    </div>
  );
}
