import { useEffect, useRef, useState } from 'react';
import {
  Star,
  ShieldCheck,
  CheckCircle,
  ThumbsUp,
  MessageSquare,
  ImagePlus,
  Send,
  X,
  Eye,
} from 'lucide-react';
import { CustomerReview } from '../types';
import {
  CustomerReviewSubmission,
  fetchApprovedCustomerReviews,
  submitCustomerReview,
} from '../services/dbService';
import { uploadReviewImage } from '../services/imageUpload';

export default function CustomerReviews() {
  const [submittedReviews, setSubmittedReviews] = useState<CustomerReview[]>([]);
  const [isReviewFormOpen, setIsReviewFormOpen] = useState(false);
  const [author, setAuthor] = useState('');
  const [location, setLocation] = useState('');
  const [orderType, setOrderType] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionMessage, setSubmissionMessage] = useState<string | null>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [reviewLoadError, setReviewLoadError] = useState<string | null>(null);
  const [selectedReviewImage, setSelectedReviewImage] = useState<{ url: string; alt: string } | null>(null);
  const reviewImageModalRef = useRef<HTMLDivElement>(null);
  const reviewImageTriggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let active = true;
    fetchApprovedCustomerReviews()
      .then((records) => {
        if (!active) return;
        setSubmittedReviews(records.map((record) => ({
          id: record.id,
          author: record.author,
          location: record.location,
          rating: record.rating,
          date: new Date(record.createdAt).toLocaleDateString('bn-BD', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          }),
          verified: record.verified,
          comment: record.comment,
          orderType: record.orderType,
          screenshotUrl: record.screenshotUrl,
          screenshotError: record.screenshotError,
        })));
      })
      .catch((error: unknown) => {
        console.error('Could not load approved customer reviews:', error);
        if (active) setReviewLoadError(error instanceof Error ? error.message : 'রিভিউ লোড করা যায়নি।');
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!screenshot) {
      setScreenshotPreview(null);
      return;
    }
    const previewUrl = URL.createObjectURL(screenshot);
    setScreenshotPreview(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [screenshot]);

  useEffect(() => {
    if (!selectedReviewImage) return;

    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelectedReviewImage(null);
    };

    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', closeOnEscape);
    reviewImageModalRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', closeOnEscape);
      reviewImageTriggerRef.current?.focus();
    };
  }, [selectedReviewImage]);

  const visibleReviews = submittedReviews;
  const averageRating = visibleReviews.length
    ? visibleReviews.reduce((total, review) => total + review.rating, 0) / visibleReviews.length
    : 0;
  const ratingDistribution = Array.from({ length: 5 }, (_, index) => 5 - index).map((value) => {
    const count = visibleReviews.filter((review) => review.rating === value).length;
    return { value, count, percentage: visibleReviews.length ? Math.round((count / visibleReviews.length) * 100) : 0 };
  });

  const handleReviewSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmissionError(null);
    setSubmissionMessage(null);
    if (author.trim().length < 2 || comment.trim().length < 10) {
      setSubmissionError('নাম কমপক্ষে ২ অক্ষর এবং রিভিউ কমপক্ষে ১০ অক্ষরের হতে হবে।');
      return;
    }
    if (screenshot && (!screenshot.type.startsWith('image/') || screenshot.size > 15 * 1024 * 1024)) {
      setSubmissionError('১৫ MB-এর মধ্যে একটি image screenshot নির্বাচন করুন।');
      return;
    }

    setIsSubmitting(true);
    let screenshotPath: string | null = null;
    try {
      if (screenshot) {
        screenshotPath = await uploadReviewImage(screenshot, crypto.randomUUID());
      }
      const submission: CustomerReviewSubmission = {
        author: author.trim(),
        location: location.trim(),
        orderType: orderType.trim(),
        rating,
        comment: comment.trim(),
        screenshotPath,
      };
      await submitCustomerReview(submission);
      setAuthor('');
      setLocation('');
      setOrderType('');
      setRating(5);
      setComment('');
      setScreenshot(null);
      setSubmissionMessage('ধন্যবাদ! আপনার রিভিউটি অনুমোদনের জন্য পাঠানো হয়েছে। অনুমোদনের পর এটি এখানে দেখা যাবে।');
      setIsReviewFormOpen(false);
    } catch (error) {
      if (screenshotPath) {
        console.error('Review submission failed; its unlinked screenshot remains private in Storage.');
      }
      console.error('Could not submit customer review:', error);
      setSubmissionError(error instanceof Error ? error.message : 'রিভিউ পাঠানো যায়নি। আবার চেষ্টা করুন।');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="reviews-section" className="py-12 sm:py-16 bg-[#faf7f0] border-b border-amber-900/10">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 bg-amber-100 px-3 py-1 rounded-full mb-3 uppercase tracking-wider">
            <ThumbsUp className="w-3.5 h-3.5 text-amber-600" />
            <span>সন্তুষ্ট গ্রাহকদের মতামত</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-stone-900">
            দেশজুড়ে হাজারো পরিবারের আস্থার প্রতীক
          </h2>
          <p className="mt-3 text-stone-600 text-sm sm:text-base">
            যারা আমাদের স্পেশাল খাঁটি গাওয়া ঘিয়ে ভাজা লাচ্ছা সেমাই নিয়ে নিয়মিত খাচ্ছেন, তাদের বাস্তব অভিজ্ঞতা জেনে নিন।
          </p>
        </div>

        <div className="mb-8 text-center">
          <button
            type="button"
            onClick={() => {
              setIsReviewFormOpen((open) => !open);
              setSubmissionError(null);
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-800"
          >
            <MessageSquare className="h-4 w-4" />
            আপনার অভিজ্ঞতা লিখুন
          </button>
        </div>

        {submissionMessage && (
          <p role="status" className="mx-auto mb-6 max-w-2xl rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-center text-sm text-emerald-800">
            {submissionMessage}
          </p>
        )}
        {reviewLoadError && (
          <p role="status" className="mx-auto mb-6 max-w-2xl rounded-xl border border-amber-200 bg-amber-50 p-3 text-center text-xs text-amber-800">
            নতুন রিভিউ দেখানো যাচ্ছে না। {reviewLoadError}
          </p>
        )}

        {isReviewFormOpen && (
          <form
            onSubmit={(event) => void handleReviewSubmit(event)}
            className="mx-auto mb-10 max-w-3xl space-y-4 rounded-2xl border border-emerald-200 bg-white p-4 shadow-sm sm:p-6"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-extrabold text-stone-900">আপনার রিভিউ লিখুন</h3>
                <p className="mt-1 text-xs text-stone-600">
                  রিভিউ যাচাই করে অনুমোদনের পর প্রকাশ করা হবে। Screenshot-ও অনুমোদনের আগে private থাকবে।
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsReviewFormOpen(false)}
                aria-label="রিভিউ ফর্ম বন্ধ করুন"
                className="rounded-lg p-2 text-stone-500 hover:bg-stone-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-xs font-bold text-stone-700">
                আপনার নাম *
                <input
                  required
                  minLength={2}
                  maxLength={80}
                  value={author}
                  onChange={(event) => setAuthor(event.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm font-normal"
                />
              </label>
              <label className="text-xs font-bold text-stone-700">
                এলাকা (ঐচ্ছিক)
                <input
                  maxLength={120}
                  value={location}
                  onChange={(event) => setLocation(event.target.value)}
                  placeholder="যেমন: মিরপুর, ঢাকা"
                  className="mt-1.5 w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm font-normal"
                />
              </label>
            </div>
            <label className="block text-xs font-bold text-stone-700">
              কোন পণ্য নিয়েছেন? (ঐচ্ছিক)
              <input
                maxLength={100}
                value={orderType}
                onChange={(event) => setOrderType(event.target.value)}
                placeholder="যেমন: ফ্যামিলি প্যাক"
                className="mt-1.5 w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm font-normal"
              />
            </label>
            <fieldset>
              <legend className="text-xs font-bold text-stone-700">আপনার রেটিং *</legend>
              <div className="mt-1 flex items-center gap-1" role="radiogroup" aria-label="রেটিং নির্বাচন করুন">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={rating === value}
                    aria-label={`${value} স্টার`}
                    onClick={() => setRating(value)}
                    className="rounded p-1 text-amber-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-600"
                  >
                    <Star className={`h-7 w-7 ${rating >= value ? 'fill-current' : ''}`} />
                  </button>
                ))}
              </div>
            </fieldset>
            <label className="block text-xs font-bold text-stone-700">
              আপনার অভিজ্ঞতা *
              <textarea
                required
                minLength={10}
                maxLength={1500}
                rows={4}
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                placeholder="পণ্য ও ডেলিভারি সম্পর্কে আপনার মতামত লিখুন..."
                className="mt-1.5 w-full resize-y rounded-lg border border-stone-300 px-3 py-2.5 text-sm font-normal"
              />
            </label>
            <div>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-stone-300 px-3 py-2.5 text-xs font-bold text-stone-700 hover:bg-stone-50">
                <ImagePlus className="h-4 w-4 text-emerald-700" />
                Screenshot / ছবি যোগ করুন (ঐচ্ছিক)
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null;
                    setScreenshot(file);
                    setSubmissionError(null);
                    event.target.value = '';
                  }}
                  className="sr-only"
                  aria-label="রিভিউ screenshot নির্বাচন করুন"
                />
              </label>
              {screenshot && (
                <div className="mt-3 flex items-center gap-3">
                  {screenshotPreview && (
                    <img src={screenshotPreview} alt="Screenshot preview" className="h-16 w-16 rounded-lg object-cover" />
                  )}
                  <span className="min-w-0 flex-1 truncate text-xs text-stone-600">{screenshot.name}</span>
                  <button
                    type="button"
                    onClick={() => setScreenshot(null)}
                    className="rounded-lg p-2 text-rose-600 hover:bg-rose-50"
                    aria-label="Screenshot সরান"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
              <p className="mt-1.5 text-[11px] text-stone-500">JPEG, PNG, WebP বা AVIF · সর্বোচ্চ ১৫ MB (আপলোডে optimize হবে)</p>
            </div>
            {submissionError && (
              <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                {submissionError}
              </p>
            )}
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-800 disabled:cursor-wait disabled:opacity-60 sm:w-auto"
            >
              <Send className="h-4 w-4" />
              {isSubmitting ? 'পাঠানো হচ্ছে...' : 'রিভিউ জমা দিন'}
            </button>
          </form>
        )}

        {/* Rating Score Summary Card */}
        {visibleReviews.length > 0 ? (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-200 mb-10 max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center text-center md:text-left">
            <div className="md:border-r border-stone-200 md:pr-6">
              <span className="text-5xl font-extrabold text-stone-950">
                {averageRating.toLocaleString('bn-BD', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
              </span>
              <div className="flex justify-center md:justify-start text-amber-500 my-2">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-current" />
                ))}
              </div>
              <p className="text-xs text-stone-500">
                {visibleReviews.length.toLocaleString('bn-BD')}টি প্রকাশিত রিভিউয়ের ভিত্তিতে
              </p>
            </div>

            <div className="space-y-1.5 text-xs text-stone-600 md:col-span-2">
              {ratingDistribution.map(({ value, count, percentage }) => (
                <div key={value} className={`flex items-center gap-2 ${count === 0 ? 'text-stone-400' : ''}`}>
                  <span className="w-12 text-right font-medium">{value.toLocaleString('bn-BD')} স্টার</span>
                  <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-stone-100">
                    <div
                      className="h-full rounded-full bg-amber-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className={`w-10 font-bold ${count ? 'text-stone-800' : ''}`}>
                    {percentage.toLocaleString('bn-BD')}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
        ) : (
          <div className="mb-8 rounded-2xl border border-dashed border-stone-300 bg-white p-6 text-center text-sm text-stone-600">
            এখনো কোনো review প্রকাশিত হয়নি। আপনার অভিজ্ঞতা প্রথমে শেয়ার করুন।
          </div>
        )}

        {/* Customer Review Cards Row */}
        {visibleReviews.length > 0 && (
          <div className="reviews-marquee-viewport" role="region" aria-label="গ্রাহকদের রিভিউ">
            <div className="reviews-marquee-track animate-continuous-marquee">
              {[0, 1, 2, 3].map((group) => (
                <div key={group} className="reviews-marquee-group" aria-hidden={group > 0}>
                  {visibleReviews.map((rev) => (
                    <div
                      key={`${group}-${rev.id}`}
                      className="w-[min(85vw,24rem)] shrink-0 snap-start bg-white p-5 sm:w-[min(44vw,24rem)] lg:w-[min(30vw,24rem)] sm:p-6 rounded-2xl shadow-sm border border-stone-200/90 flex flex-col justify-between hover:shadow-md transition-shadow"
                    >
              <div>
                {/* Author Info & Verified Badge */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-bold text-stone-900 text-sm sm:text-base">
                        {rev.author}
                      </h4>
                      {rev.verified && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-1.5 py-0.5 rounded-full">
                          <CheckCircle className="w-3 h-3 text-emerald-600 fill-current text-white" />
                          <span>ভেরিফায়েড ক্রেতা</span>
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-stone-500 mt-0.5">{rev.location}</p>
                  </div>

                  <span className="text-[11px] text-stone-400 font-medium">{rev.date}</span>
                </div>

                {/* Stars and Ordered Product */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex text-amber-500">
                    {[...Array(rev.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-current" />
                    ))}
                  </div>
                  {rev.orderType && (
                    <span className="text-xs bg-stone-100 text-stone-700 px-2 py-0.5 rounded font-medium">
                      {rev.orderType}
                    </span>
                  )}
                </div>

                {/* Review Text */}
                <p className="text-xs sm:text-sm text-stone-700 leading-relaxed italic">
                  "{rev.comment}"
                </p>
                {rev.screenshotUrl && (
                  <button
                    type="button"
                    onClick={(event) => {
                      reviewImageTriggerRef.current = event.currentTarget;
                      setSelectedReviewImage({
                        url: rev.screenshotUrl!,
                        alt: `${rev.author}-এর review screenshot`,
                      });
                    }}
                    aria-label={`${rev.author}-এর রিভিউ ছবি বড় করে দেখুন`}
                    className="mt-4 inline-flex max-w-full items-center gap-3 rounded-xl border border-stone-200 bg-stone-50 p-2.5 text-left transition-colors hover:border-emerald-200 hover:bg-emerald-50/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-700"
                  >
                    <img
                      src={rev.screenshotUrl}
                      alt={`${rev.author}-এর review screenshot`}
                      className="h-[4.5rem] w-[4.5rem] shrink-0 rounded-lg border border-stone-200 bg-white object-contain p-0.5 sm:h-20 sm:w-20"
                      loading="lazy"
                      decoding="async"
                    />
                    <span className="min-w-0">
                      <span className="block text-xs font-semibold text-stone-700">ক্রেতার পাঠানো ছবি</span>
                      <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800">
                        পূর্ণ ছবি দেখুন
                        <Eye className="h-3 w-3" />
                      </span>
                    </span>
                  </button>
                )}
                {rev.screenshotError && (
                  <p role="status" className="mt-2 text-[11px] text-amber-700">
                    Screenshot দেখা যাচ্ছে না: {rev.screenshotError}
                  </p>
                )}
              </div>

              {/* Bottom Guarantee micro */}
              <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
                {rev.verified ? (
                  <span className="flex items-center gap-1 text-emerald-700 font-medium">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>ভেরিফায়েড ক্রেতা</span>
                  </span>
                ) : <span>গ্রাহকের মতামত</span>}
              </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedReviewImage && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-950/85 p-4 backdrop-blur-sm"
            onClick={() => setSelectedReviewImage(null)}
          >
            <div
              ref={reviewImageModalRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="review-image-modal-title"
              tabIndex={-1}
              className="relative flex max-h-[92vh] w-full max-w-4xl flex-col items-center rounded-2xl bg-white p-3 shadow-2xl outline-none sm:p-5"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mb-3 flex w-full items-center justify-between gap-3 px-1">
                <h3 id="review-image-modal-title" className="text-sm font-bold text-stone-800">
                  ক্রেতার পাঠানো ছবি
                </h3>
                <button
                  type="button"
                  onClick={() => setSelectedReviewImage(null)}
                  aria-label="ছবি বন্ধ করুন"
                  className="rounded-full p-2 text-stone-600 transition hover:bg-stone-100 hover:text-stone-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <img
                src={selectedReviewImage.url}
                alt={selectedReviewImage.alt}
                className="max-h-[calc(92vh-5rem)] max-w-full rounded-lg object-contain"
              />
            </div>
          </div>
        )}

        {/* Video / Photo Reviews Note */}
        <div className="mt-8 bg-amber-50/80 rounded-xl p-4 border border-amber-200/80 text-center max-w-2xl mx-auto text-xs sm:text-sm text-amber-900">
          <MessageSquare className="w-4 h-4 text-amber-700 mx-auto mb-1 inline mr-1.5" />
          <span>
            আপনার অভিজ্ঞতা শেয়ার করলে অন্য ক্রেতারাও পণ্য সম্পর্কে জানতে পারবেন। রিভিউ প্রকাশের আগে আমাদের টিম যাচাই করে।
          </span>
        </div>
      </div>
    </section>
  );
}
