import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Maximize2, 
  X 
} from 'lucide-react';
import heroBowlImg from '../assets/images/shemai_hero_bowl_1793156337325.jpg';
import gheeCloseupImg from '../assets/images/shemai_ghee_closeup_1793175979653.jpg';
import packagingBoxImg from '../assets/images/shemai_packaging_box_1793156354481.jpg';
import gheeJarImg from '../assets/images/shemai_ghee_jar_1793175996687.jpg';
import preparedDishImg from '../assets/images/prepared_malai_shemai_1793156370328.jpg';

interface ProductImage {
  id: number;
  src: string;
  alt: string;
  caption: string;
}

const PRODUCT_IMAGES: ProductImage[] = [
  {
    id: 1,
    src: heroBowlImg,
    alt: 'খাঁটি গাওয়া ঘিয়ে ভাজা শাহী লাচ্ছা সেমাই বোল',
    caption: 'খাঁটি গাওয়া ঘিয়ে ভাজা শাহী লাচ্ছা সেমাই',
  },
  {
    id: 2,
    src: gheeCloseupImg,
    alt: 'মুচমুচে সোনালী মিহি সুতা ও পেস্তা বাদাম ক্লোজআপ',
    caption: 'মুচমুচে সোনালী মিহি সুতা ও কাজু-পেস্তা বাদাম',
  },
  {
    id: 3,
    src: packagingBoxImg,
    alt: 'প্রিমিয়াম ফুড-গ্রেড এক্সক্লুসিভ বক্স প্যাকেজিং',
    caption: 'প্রিমিয়াম ফুড-গ্রেড এয়ারটাইট বক্স প্যাকেজিং',
  },
  {
    id: 4,
    src: gheeJarImg,
    alt: 'সিরাজগঞ্জের খাঁটি গরুর গাওয়া ঘি ও এলাচ উপাদান',
    caption: 'সিরাজগঞ্জের খাঁটি দেশি গরুর দুধের গাওয়া ঘি',
  },
  {
    id: 5,
    src: preparedDishImg,
    alt: 'ঘন দুধ-মালাই দিয়ে তৈরি সুস্বাদু শাহী সেমাই',
    caption: 'ঘন দুধ-মালাই ও পেস্তা বাদামে তৈরি শাহী ডেজার্ট',
  }
];

export default function HeroSlider() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % PRODUCT_IMAGES.length);
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + PRODUCT_IMAGES.length) % PRODUCT_IMAGES.length);
  }, []);

  // Smooth Auto-play
  useEffect(() => {
    if (isPaused || lightboxOpen) {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
      return;
    }

    autoPlayRef.current = setInterval(() => {
      nextSlide();
    }, 4500);

    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    };
  }, [isPaused, lightboxOpen, nextSlide]);

  // Touch handlers for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        nextSlide();
      } else {
        prevSlide();
      }
    }
    touchStartX.current = null;
  };

  const currentProduct = PRODUCT_IMAGES[currentIndex];

  return (
    <section 
      aria-label="হিরো ইমেজ স্লাইডার"
      className="w-full bg-[#fbf9f4] pt-2 pb-5 sm:pt-4 sm:pb-8 border-b border-amber-900/10"
    >
      <div className="max-w-5xl mx-auto px-3 sm:px-4">
        {/* Minimalist Hero Slider Frame */}
        <div 
          className="relative bg-stone-900 rounded-2xl sm:rounded-3xl shadow-lg border border-stone-200/80 overflow-hidden select-none group"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Main Slide Images */}
          <div className="relative aspect-[4/3] sm:aspect-[16/9] md:aspect-[2.1/1] w-full overflow-hidden flex items-center justify-center">
            {PRODUCT_IMAGES.map((img, idx) => (
              <div
                key={img.id}
                className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                  currentIndex === idx ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                }`}
              >
                <img
                  src={img.src}
                  alt={img.alt}
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-102"
                  loading={idx === 0 ? 'eager' : 'lazy'}
                  draggable={false}
                />
              </div>
            ))}

            {/* Subtle Gradient Shadow at Bottom for Dots / Caption */}
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 via-black/20 to-transparent z-20 pointer-events-none" />

            {/* Zoom / Lightbox minimal button top-right */}
            <div className="absolute top-3 right-3 z-30 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <button
                type="button"
                onClick={() => setLightboxOpen(true)}
                title="বড় করে দেখুন"
                aria-label="বড় করে দেখুন"
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-xs flex items-center justify-center transition-all shadow-md cursor-pointer hover:scale-105 active:scale-95"
              >
                <Maximize2 className="w-4 h-4 text-white" />
              </button>
            </div>

            {/* Minimal Navigation Arrows */}
            <button
              type="button"
              onClick={prevSlide}
              aria-label="পূর্ববর্তী ছবি"
              className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/85 hover:bg-white text-stone-900 shadow-md border border-stone-200/50 flex items-center justify-center transition-all cursor-pointer opacity-70 group-hover:opacity-100 hover:scale-105 active:scale-95 z-30"
            >
              <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 text-stone-800" />
            </button>

            <button
              type="button"
              onClick={nextSlide}
              aria-label="পরবর্তী ছবি"
              className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/85 hover:bg-white text-stone-900 shadow-md border border-stone-200/50 flex items-center justify-center transition-all cursor-pointer opacity-70 group-hover:opacity-100 hover:scale-105 active:scale-95 z-30"
            >
              <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 text-stone-800" />
            </button>

            {/* Minimal Center Pagination Dots */}
            <div className="absolute bottom-3 sm:bottom-4 inset-x-0 flex items-center justify-center gap-1.5 sm:gap-2 z-30">
              {PRODUCT_IMAGES.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrentIndex(idx)}
                  aria-label={`স্লাইড ${idx + 1}`}
                  className={`transition-all duration-300 rounded-full cursor-pointer ${
                    currentIndex === idx 
                      ? 'w-6 sm:w-7 h-2 bg-amber-400 shadow-xs' 
                      : 'w-2 h-2 bg-white/60 hover:bg-white'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox Modal */}
      {lightboxOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-4 backdrop-blur-xs animate-fadeIn"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            aria-label="বন্ধ করুন"
            className="absolute top-4 right-4 text-white hover:text-amber-400 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-all cursor-pointer z-50"
          >
            <X className="w-6 h-6" />
          </button>

          <div 
            className="relative max-w-5xl max-h-[85vh] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={currentProduct.src}
              alt={currentProduct.alt}
              className="max-h-[80vh] max-w-full object-contain rounded-xl shadow-2xl"
            />

            <button
              type="button"
              onClick={prevSlide}
              aria-label="পূর্ববর্তী ছবি"
              className="absolute left-2 sm:-left-14 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center transition-all cursor-pointer"
            >
              <ChevronLeft className="w-7 h-7" />
            </button>

            <button
              type="button"
              onClick={nextSlide}
              aria-label="পরবর্তী ছবি"
              className="absolute right-2 sm:-right-14 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center transition-all cursor-pointer"
            >
              <ChevronRight className="w-7 h-7" />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
