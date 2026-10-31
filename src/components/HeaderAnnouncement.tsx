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
    /* Brand forest green gradient — replaces previous red */
    <div
      className="relative z-50 px-3 py-2 text-xs text-white shadow-md sm:text-sm"
      style={{
        background: 'linear-gradient(to right, var(--brand-forest-dark), var(--brand-forest), var(--brand-forest-dark))',
      }}
    >
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2 text-center md:text-left">
        {/* Left message */}
        <div className="hidden items-center gap-2 font-medium justify-center sm:flex">
          {/* Golden amber badge for urgency contrast on dark green */}
          <span
            className="inline-flex items-center justify-center px-2 py-0.5 rounded text-xs font-bold tracking-wide uppercase text-stone-900"
            style={{ backgroundColor: 'var(--brand-amber)' }}
          >
            সীমিত স্টক অফার
          </span>
          <span className="hidden sm:inline">খাঁটি গাওয়া ঘিয়ে ভাজা সেমাইয়ে বিশেষ ছাড় চলছে!</span>
          <span className="sm:hidden">ঘিয়ে ভাজা লাচ্ছা সেমাইয়ে ছাড় চলছে!</span>
          <span className="hidden lg:inline" style={{ color: 'color-mix(in srgb, var(--brand-amber-light) 80%, white)' }}>· পণ্য হাতে পেয়ে টাকা দিন</span>
        </div>

        {/* Right side: Countdown and Contact */}
        <div className="flex items-center gap-3 sm:gap-4 justify-center">
          <div className="flex items-center gap-1.5 bg-black/25 px-2.5 py-1 rounded border border-white/10 font-mono text-xs">
            <Clock className="w-3.5 h-3.5 animate-pulse" style={{ color: 'var(--brand-amber)' }} />
            <span className="font-sans hidden sm:inline" style={{ color: 'var(--brand-amber-light)' }}>অফার শেষ হতে:</span>
            <span className="bg-white/20 text-white font-bold px-1 rounded">
              {formatNumber(timeLeft.hours)}
            </span>
            <span>:</span>
            <span className="bg-white/20 text-white font-bold px-1 rounded">
              {formatNumber(timeLeft.minutes)}
            </span>
            <span>:</span>
            {/* Seconds in golden amber — maximum urgency */}
            <span className="font-bold px-1 rounded text-stone-900" style={{ backgroundColor: 'var(--brand-amber)' }}>
              {formatNumber(timeLeft.seconds)}
            </span>
          </div>

          <a
            href="tel:01798241344"
            className="hidden sm:flex items-center gap-1 hover:text-white transition-colors text-xs font-semibold"
            style={{ color: 'var(--brand-amber-light)' }}
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>01798-241344</span>
          </a>

          {/* CTA in brand amber — stands out on forest green background */}
          <button
            onClick={scrollToCheckout}
            className="font-bold text-xs px-2.5 py-1 rounded shadow-sm hover:shadow transition-all transform active:scale-95 flex items-center gap-1 cursor-pointer text-stone-900"
            style={{ backgroundColor: 'var(--brand-amber)' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--brand-amber-light)'; (e.currentTarget as HTMLElement).style.color = 'var(--brand-amber-dark)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--brand-amber)'; (e.currentTarget as HTMLElement).style.color = 'var(--stone-900)'; }}
          >
            <Sparkles className="w-3 h-3" style={{ color: 'var(--brand-forest)' }} />
            <span>অর্ডার করুন</span>
          </button>
        </div>
      </div>
    </div>
  );
}
