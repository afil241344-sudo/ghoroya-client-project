import { useState } from 'react';
import { Star, CheckCircle2, ShoppingCart, Sparkles, Phone, Award, ShieldAlert, ArrowDown } from 'lucide-react';
import heroBowlImg from '../assets/images/shemai_hero_bowl_1793156337325.jpg';
import packagingBoxImg from '../assets/images/shemai_packaging_box_1793156354481.jpg';
import preparedDishImg from '../assets/images/prepared_malai_shemai_1793156370328.jpg';

export default function HeroSection() {
  const images = [
    {
      src: heroBowlImg,
      alt: 'খাঁটি গাওয়া ঘিয়ে ভাজা শাহী লাচ্ছা সেমাই বোল',
      label: 'ঘিয়ে ভাজা লাচ্ছা সেমাই',
      badge: 'মুচমুচে সোনালী রং'
    },
    {
      src: packagingBoxImg,
      alt: 'শাহী ঘি লাচ্ছা সেমাই এক্সক্লুসিভ বক্স প্যাকেজিং',
      label: 'প্রিমিয়াম বক্স প্যাকেজিং',
      badge: 'আসল পণ্য যা পাবেন'
    },
    {
      src: preparedDishImg,
      alt: 'তৈরি শাহী দুধ মালাই লাচ্ছা সেমাই',
      label: 'দুধ মালাই দিয়ে রান্না',
      badge: 'মুখে দিলেই মিলিয়ে যায়'
    }
  ];

  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const scrollToCheckout = () => {
    const el = document.getElementById('checkout-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#fffbf2] via-[#faf5ea] to-[#f5eedc] pt-6 sm:pt-10 pb-12 sm:pb-16 border-b border-amber-900/10">
      {/* Subtle traditional Islamic/Bangladeshi decorative ambient shapes */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-600/5 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20"></div>

      <div className="max-w-6xl mx-auto px-4 relative z-10">
        {/* Top Urgency Hook Pill */}
        <div className="flex items-center justify-center mb-4">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-700 to-amber-800 text-white px-3.5 py-1.5 rounded-full shadow-sm text-xs sm:text-sm font-semibold border border-amber-400/30">
            <Sparkles className="w-4 h-4 text-amber-300 animate-spin" style={{ animationDuration: '6s' }} />
            <span>১০০% খাঁটি গাওয়া ঘি ও জাফরানের রাজকীয় মিশ্রণ</span>
            <span className="hidden sm:inline bg-amber-400 text-stone-900 text-[10px] font-bold px-2 py-0.5 rounded-full">
              হাতে পেয়ে টাকা দিন
            </span>
          </div>
        </div>

        {/* Main Headline */}
        <div className="text-center max-w-4xl mx-auto mb-8 sm:mb-10">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-stone-900 tracking-tight leading-tight sm:leading-tight">
            একবার খেলে বারবার মুখে লেগে থাকবে{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-700 via-amber-800 to-red-700 underline decoration-amber-400/60 decoration-wavy underline-offset-4">
              খাঁটি গাওয়া ঘিয়ে ভাজা
            </span>{' '}
            স্পেশাল শাহী লাচ্ছা সেমাই!
          </h1>
          <p className="mt-4 text-stone-700 text-base sm:text-lg md:text-xl font-medium max-w-3xl mx-auto leading-relaxed">
            কোনো প্রকার ডালডা বা পাম তেলের কৃত্রিম গন্ধ নেই। খাঁটি দেশি গরুর দুধের গাওয়া ঘি, প্রিমিয়াম জাফরান ও নিখুঁত কারিগরিতে ভাজা—যা রান্নার পরও বজায় রাখে অসাধারণ সুবাস ও ক্রিস্পি স্বাদ।
          </p>
        </div>

        {/* Main Two-Column Showcase */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          {/* Left Column: Interactive Image Gallery with Bangladeshi aesthetics */}
          <div className="lg:col-span-7">
            <div className="relative bg-white p-3 sm:p-4 rounded-2xl shadow-xl border border-amber-900/10">
              {/* Highlight Badge */}
              <div className="absolute top-6 left-6 z-20">
                <span className="bg-stone-950/80 backdrop-blur-md text-amber-300 text-xs sm:text-sm font-bold px-3 py-1.5 rounded-lg border border-amber-400/40 shadow-lg flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-400" />
                  {images[activeImageIndex].badge}
                </span>
              </div>

              {/* Main Active Image */}
              <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-stone-100 group">
                <img
                  src={images[activeImageIndex].src}
                  alt={images[activeImageIndex].alt}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-60"></div>
                <div className="absolute bottom-3 left-3 right-3 text-white text-xs sm:text-sm font-medium drop-shadow-md">
                  {images[activeImageIndex].label}
                </div>
              </div>

              {/* Thumbnails */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3 mt-3">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`relative rounded-lg overflow-hidden border-2 transition-all p-1 text-left cursor-pointer ${
                      activeImageIndex === idx
                        ? 'border-amber-600 bg-amber-50 shadow-md ring-2 ring-amber-400/40'
                        : 'border-stone-200 hover:border-amber-300 bg-white opacity-80 hover:opacity-100'
                    }`}
                  >
                    <div className="aspect-[4/3] rounded overflow-hidden">
                      <img src={img.src} alt={img.label} className="w-full h-full object-cover" />
                    </div>
                    <p className="text-[11px] sm:text-xs font-semibold text-stone-800 mt-1 line-clamp-1 text-center">
                      {img.label}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Key Selling Points & Conversion Triggers */}
          <div className="lg:col-span-5 flex flex-col justify-center">
            {/* Reviews Rating Pill */}
            <div className="flex items-center gap-2 mb-3">
              <div className="flex text-amber-500">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-current" />
                ))}
              </div>
              <span className="font-bold text-stone-900 text-sm">৪.৯/৫</span>
              <span className="text-xs text-stone-500 font-medium">(১২,৪৫০+ সন্তুষ্ট ক্রেতা)</span>
            </div>

            {/* Price Box */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-4 rounded-xl border border-amber-300/80 mb-5 shadow-sm">
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-xs font-bold text-amber-800 uppercase tracking-wider block">
                    বিশেষ ঈদ ও ফ্যামিলি অফার মূল্য
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-3xl sm:text-4xl font-extrabold text-stone-950">৳৪২০</span>
                    <span className="text-lg text-stone-400 line-through font-semibold">৳৫৫০</span>
                    <span className="text-xs font-bold bg-rose-600 text-white px-2 py-0.5 rounded">
                      ৳১৩০ ছাড়!
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-emerald-700 font-bold bg-emerald-100 px-2 py-1 rounded inline-block">
                    প্যাকেট: ৪৫০ গ্রাম
                  </span>
                  <p className="text-[11px] text-stone-500 mt-1">২ বক্স নিলে আরো সাশ্রয়ী</p>
                </div>
              </div>
            </div>

            {/* Bullet Highlights */}
            <div className="space-y-3 mb-6 text-sm sm:text-base text-stone-800">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>১০০% খাঁটি সিরাজগঞ্জের গাওয়া ঘি:</strong> কোনো ভেজাল ডালডা বা কেমিক্যাল তেল মেশানো হয় না।
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>মুচমুচে সোনালী মিহি সুতা:</strong> রান্নার পর নরম মোলায়েম হয় কিন্তু সহজে গলে ভর্তা হয়ে যায় না।
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>ভেজালমুক্ত ও নিরাপদ প্যাকেজিং:</strong> ফুড গ্রেড সিলিং যার কারণে মাসের পর মাস টাটকা থাকে।
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>পণ্য দেখে মূল্য পরিশোধ:</strong> ডেলিভারি ম্যানের সামনে বক্স খুলে সন্তুষ্ট হয়ে টাকা দিন।
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              {/* Primary Call To Action - Pulsing Attention */}
              <button
                onClick={scrollToCheckout}
                className="w-full bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-700 hover:to-rose-700 text-white font-extrabold text-base sm:text-lg py-3.5 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform active:scale-98 animate-pulse-attention flex items-center justify-center gap-2 cursor-pointer border border-red-400/30"
              >
                <ShoppingCart className="w-5 h-5" />
                <span>অর্ডার করতে এখানে ক্লিক করুন</span>
                <ArrowDown className="w-5 h-5 animate-bounce" />
              </button>

              {/* Direct Phone Call Alternative */}
              <a
                href="tel:01798241344"
                className="w-full bg-white hover:bg-stone-50 text-stone-800 font-bold text-sm sm:text-base py-3 px-4 rounded-xl border border-stone-300 hover:border-stone-400 shadow-sm transition-all flex items-center justify-center gap-2 text-center"
              >
                <Phone className="w-4 h-4 text-emerald-600" />
                <span>ফোনে সরাসরি অর্ডার করতে কল করুন: 01798-241344</span>
              </a>
            </div>

            {/* Micro Risk-Reversal Guarantee */}
            <div className="mt-4 flex items-center justify-center gap-2 text-stone-500 text-xs font-medium text-center">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
              <span>পছন্দ না হলে সাথে সাথে ডেলিভারি ম্যানের কাছে ফেরত দেওয়ার সুযোগ!</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
