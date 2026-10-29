import { useCallback, useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import {
  HomepageImageCard,
  fetchHomepageImageCards,
  HOMEPAGE_IMAGE_CARD_LIMIT,
} from '../services/dbService';

export default function HomepageImageCards() {
  const [images, setImages] = useState<HomepageImageCard[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadImages = useCallback(async () => {
    setLoadError(null);
    setIsLoading(true);
    try {
      setImages(await fetchHomepageImageCards(true));
    } catch (error: unknown) {
      console.error('Could not load homepage image cards from Supabase:', error);
      setLoadError(error instanceof Error ? error.message : 'ছবিগুলো লোড করা যায়নি।');
      setImages([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadImages();
    window.addEventListener('homepage-images-updated', loadImages);
    return () => window.removeEventListener('homepage-images-updated', loadImages);
  }, [loadImages]);

  if (isLoading) {
    return (
      <div role="status" aria-label="ছবিগুলো লোড হচ্ছে" className="mx-auto my-5 grid w-[calc(100%-1rem)] max-w-6xl grid-cols-6 gap-1 sm:my-8 sm:gap-3">
        {Array.from({ length: HOMEPAGE_IMAGE_CARD_LIMIT }, (_, item) => (
          <div key={item} className="aspect-square animate-pulse rounded-md bg-stone-200 sm:rounded-xl" />
        ))}
      </div>
    );
  }

  if (loadError) {
    return (
      <div role="alert" className="mx-auto my-4 flex max-w-6xl items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
        <span>Homepage image cards লোড করা যায়নি। {loadError}</span>
        <button type="button" onClick={() => void loadImages()} className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-rose-300 bg-white px-3 py-2 text-xs font-bold hover:bg-rose-100">
          <RefreshCw className="h-3.5 w-3.5" />
          আবার চেষ্টা করুন
        </button>
      </div>
    );
  }

  if (images.length === 0) return null;

  return (
    <section aria-label="পণ্যের ছবির গ্যালারি" className="border-b border-amber-900/10 bg-[#fbf9f4] pb-2 pt-5 sm:pb-3 sm:pt-8">
      <div className="mx-auto grid max-w-6xl grid-cols-6 gap-1 px-2 sm:gap-3 sm:px-4">
        {images.slice(0, HOMEPAGE_IMAGE_CARD_LIMIT).map((image) => (
          <div key={image.id} className="overflow-hidden rounded-md bg-stone-100 shadow-sm sm:rounded-xl">
            <img
              src={image.imageUrl}
              alt={image.altText}
              className="aspect-square w-full object-cover"
              loading="lazy"
              decoding="async"
            />
          </div>
        ))}
      </div>
    </section>
  );
}
