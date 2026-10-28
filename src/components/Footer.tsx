import { Phone, Mail, MapPin, ShieldCheck, Heart, Truck, RefreshCcw, Lock } from 'lucide-react';

interface FooterProps {
  onOpenAdmin?: () => void;
}

export default function Footer({ onOpenAdmin }: FooterProps) {
  return (
    <footer className="bg-stone-900 text-stone-300 pt-12 pb-24 sm:pb-12 border-t border-stone-800 text-xs sm:text-sm">
      <div className="max-w-6xl mx-auto px-4">
        {/* Top 3 Trust Columns */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pb-10 border-b border-stone-800 text-center sm:text-left">
          <div className="flex items-center gap-3 justify-center sm:justify-start">
            <div className="w-10 h-10 rounded-full bg-emerald-900/60 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-700/50">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">সারাদেশে হোম ডেলিভারি</h4>
              <p className="text-stone-400 text-xs mt-0.5">৪৮-৭২ ঘণ্টার মধ্যে আপনার ঠিকানায়</p>
            </div>
          </div>

          <div className="flex items-center gap-3 justify-center sm:justify-start">
            <div className="w-10 h-10 rounded-full bg-amber-900/60 text-amber-400 flex items-center justify-center shrink-0 border border-amber-700/50">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">১০০% খাঁটি পণ্য ও গ্যারান্টি</h4>
              <p className="text-stone-400 text-xs mt-0.5">খাঁটি গাওয়া ঘি ও সেরা খাদ্য মান</p>
            </div>
          </div>

          <div className="flex items-center gap-3 justify-center sm:justify-start">
            <div className="w-10 h-10 rounded-full bg-rose-900/60 text-rose-400 flex items-center justify-center shrink-0 border border-rose-700/50">
              <RefreshCcw className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">অন দ্য স্পট রিটার্ন</h4>
              <p className="text-stone-400 text-xs mt-0.5">পছন্দ না হলে সাথে সাথে ফেরত দিন</p>
            </div>
          </div>
        </div>

        {/* Main Footer Details */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 py-10">
          {/* Brand Info */}
          <div className="md:col-span-5 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-600 text-white font-bold flex items-center justify-center text-base">
                শাহী
              </div>
              <span className="text-white font-extrabold text-lg tracking-tight">
                প্যারামাউন্ট রয়েল ফুডস
              </span>
            </div>
            <p className="text-stone-400 text-xs sm:text-sm leading-relaxed max-w-sm">
              আমাদের লক্ষ্য ভেজালমুক্ত, স্বাস্থ্যসম্মত ও ঐতিহ্যবাহী খাঁটি বাঙালি মিষ্টান্ন প্রতিটি পরিবারের খাবার টেবিলে পৌঁছে দেওয়া।
            </p>
            <div className="pt-2 text-xs text-stone-400 space-y-1">
              <p className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-amber-500 shrink-0" />
                <span>ধানমন্ডি, রোড-৮/এ, ঢাকা-১২০৯, বাংলাদেশ</span>
              </p>
              <p className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>হটলাইন: 01798-241344 (সকাল ৯টা - রাত ১০টা)</span>
              </p>
              <p className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-sky-500 shrink-0" />
                <span>ইমেইল: support@paramountfoods.bd</span>
              </p>
            </div>
          </div>

          {/* Delivery Partners */}
          <div className="md:col-span-4 space-y-3">
            <h4 className="text-white font-bold text-sm uppercase tracking-wider">
              আমাদের ডেলিভারি পার্টনার্স
            </h4>
            <div className="flex flex-wrap gap-2 pt-1">
              <span className="bg-stone-800 text-stone-200 px-3 py-1.5 rounded-lg border border-stone-700 text-xs font-semibold">
                Steadfast Courier
              </span>
              <span className="bg-stone-800 text-stone-200 px-3 py-1.5 rounded-lg border border-stone-700 text-xs font-semibold">
                Sundarban Courier
              </span>
              <span className="bg-stone-800 text-stone-200 px-3 py-1.5 rounded-lg border border-stone-700 text-xs font-semibold">
                RedX Delivery
              </span>
              <span className="bg-stone-800 text-stone-200 px-3 py-1.5 rounded-lg border border-stone-700 text-xs font-semibold">
                Pathao Courier
              </span>
            </div>
            <p className="text-stone-400 text-xs">
              সারাদেশের ৬৪ জেলায় এবং প্রত্যন্ত থানা পর্যায়ে হোম ডেলিভারি প্রদান করা হয়।
            </p>
          </div>

          {/* Payment & Security */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-white font-bold text-sm uppercase tracking-wider">
              নিরাপদ পেমেন্ট মেথড
            </h4>
            <div className="flex flex-wrap gap-2 pt-1">
              <span className="bg-emerald-950 text-emerald-300 border border-emerald-800 px-2.5 py-1 rounded text-xs font-bold">
                ক্যাশ অন ডেলিভারি (COD)
              </span>
              <span className="bg-pink-950 text-pink-300 border border-pink-800 px-2.5 py-1 rounded text-xs font-bold font-mono">
                bKash
              </span>
              <span className="bg-orange-950 text-orange-300 border border-orange-800 px-2.5 py-1 rounded text-xs font-bold font-mono">
                Nagad
              </span>
            </div>
            <div className="text-[11px] text-stone-400">
              ট্রেড লাইসেন্স নং: TRAD/DNCC/041923/2024
            </div>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="border-t border-stone-800 pt-6 mt-2 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-400">
          <div className="flex items-center gap-3">
            <p>© {new Date().getFullYear()} প্যারামাউন্ট রয়েল ফুডস। সর্বস্বত্ব সংরক্ষিত।</p>
            {onOpenAdmin && (
              <>
                <span>·</span>
                <button
                  onClick={onOpenAdmin}
                  className="hover:text-emerald-400 underline cursor-pointer text-stone-500 hover:text-stone-300 flex items-center gap-1"
                >
                  <Lock className="w-3 h-3" />
                  <span>অ্যাডমিন পোর্টাল</span>
                </button>
              </>
            )}
          </div>
          <p className="flex items-center gap-1">
            <span>ভালোবাসা ও খাঁটি গাওয়া ঘিয়ে তৈরি</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-current" />
            <span>বাংলাদেশ</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
