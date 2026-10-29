import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Maximize2, 
  X,
  RefreshCw,
} from 'lucide-react';
import { fetchSliderImages } from '../services/dbService';

interface ProductImage {
  id: string;
  src: string;
  alt: string;
  caption: string;
}

export default function HeroSlider() {
  const [slides, setSlides] = useState<ProductImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);

  const loadSlides = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const images = await fetchSliderImages(true);
      setSlides(images.map((image) => ({
        id: image.id,
        src: image.imageUrl,
        alt: image.altText,
        caption: image.caption,
      })));
      setCurrentIndex(0);
    } catch (error: unknown) {
      console.error('Could not load active homepage slider images:', error);
      setLoadError(error instanceof Error ? error.message : 'Slider image লোড করা যায়নি।');
      setSlides([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSlides();
  }, [loadSlides]);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => slides.length > 0 ? (prev + 1) % slides.length : 0);
  }, [slides.length]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => slides.length > 0 ? (prev - 1 + slides.length) % slides.length : 0);
  }, [slides.length]);

  // Smooth Auto-play
  useEffect(() => {
    if (isPaused || lightboxOpen || slides.length < 2) {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
      return;
    }

    autoPlayRef.current = setInterval(() => {
      nextSlide();
    }, 4500);

    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    };
  }, [isPaused, lightboxOpen, nextSlide, slides.length]);

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

  if (isLoading) {
    return (
      <div role="status" aria-label="Slider loading" className="mx-auto my-4 aspect-video w-[calc(100%-1.5rem)] max-w-5xl animate-pulse rounded-2xl bg-stone-200 sm:my-6" />
    );
  }
  if (slides.length === 0) {
    if (!loadError) return null;
    return (
      <div role="alert" className="mx-auto my-4 flex max-w-5xl items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
        <span>Homepage slider লোড করা যায়নি। {loadError}</span>
        <button type="button" onClick={() => void loadSlides()} className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-rose-300 bg-white px-3 py-2 text-xs font-bold hover:bg-rose-100">
          <RefreshCw className="h-3.5 w-3.5" />
          আবার চেষ্টা করুন
        </button>
      </div>
    );
  }
  const currentProduct = slides[currentIndex] ?? slides[0];

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
          <div className="relative aspect-video w-full overflow-hidden flex items-center justify-center">
            {slides.map((img, idx) => (
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

            {currentProduct.caption && (
              <p className="absolute bottom-8 left-4 z-30 max-w-[75%] text-left text-xs font-semibold text-white drop-shadow sm:bottom-9 sm:left-6 sm:text-sm">
                {currentProduct.caption}
              </p>
            )}

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
              {slides.map((_, idx) => (
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
