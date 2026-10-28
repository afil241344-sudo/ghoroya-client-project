import { Star, ShieldCheck, CheckCircle, ThumbsUp, MessageSquare } from 'lucide-react';
import { CustomerReview } from '../types';

interface CustomerReviewsProps {
  reviews: CustomerReview[];
}

export default function CustomerReviews({ reviews }: CustomerReviewsProps) {
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

        {/* Rating Score Summary Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-200 mb-10 max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center text-center md:text-left">
            <div className="md:border-r border-stone-200 md:pr-6">
              <span className="text-5xl font-extrabold text-stone-950">৪.৯</span>
              <div className="flex justify-center md:justify-start text-amber-500 my-2">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-current" />
                ))}
              </div>
              <p className="text-xs text-stone-500">
                ১২,৪৫০+ ভেরিফায়েড অর্ডারের ভিত্তিতে রেটিং
              </p>
            </div>

            <div className="space-y-1.5 text-xs text-stone-600 md:col-span-2">
              <div className="flex items-center gap-2">
                <span className="w-12 text-right font-medium">৫ স্টার</span>
                <div className="flex-1 bg-stone-100 rounded-full h-2.5 overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full" style={{ width: '96%' }}></div>
                </div>
                <span className="w-10 font-bold text-stone-800">৯৬%</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-12 text-right font-medium">৪ স্টার</span>
                <div className="flex-1 bg-stone-100 rounded-full h-2.5 overflow-hidden">
                  <div className="bg-amber-400 h-full rounded-full" style={{ width: '৪%' }}></div>
                </div>
                <span className="w-10 font-bold text-stone-800">৪%</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-12 text-right font-medium text-stone-400">৩ স্টার</span>
                <div className="flex-1 bg-stone-100 rounded-full h-2.5 overflow-hidden">
                  <div className="bg-amber-300 h-full rounded-full" style={{ width: '০%' }}></div>
                </div>
                <span className="w-10 font-bold text-stone-400">০%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Customer Review Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {reviews.map((rev) => (
            <div
              key={rev.id}
              className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-stone-200/90 flex flex-col justify-between hover:shadow-md transition-shadow"
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
                  <span className="text-xs bg-stone-100 text-stone-700 px-2 py-0.5 rounded font-medium">
                    {rev.orderType}
                  </span>
                </div>

                {/* Review Text */}
                <p className="text-xs sm:text-sm text-stone-700 leading-relaxed italic">
                  "{rev.comment}"
                </p>
              </div>

              {/* Bottom Guarantee micro */}
              <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
                <span className="flex items-center gap-1 text-emerald-700 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>ক্যাশ অন ডেলিভারিতে ক্রয়কৃত</span>
                </span>
                <span className="text-stone-400">সহমত প্রকাশ করেছেন ১২ জন</span>
              </div>
            </div>
          ))}
        </div>

        {/* Video / Photo Reviews Note */}
        <div className="mt-8 bg-amber-50/80 rounded-xl p-4 border border-amber-200/80 text-center max-w-2xl mx-auto text-xs sm:text-sm text-amber-900">
          <MessageSquare className="w-4 h-4 text-amber-700 mx-auto mb-1 inline mr-1.5" />
          <span>
            ফেসবুক পেজে আমাদের শত শত কাস্টমার আনবক্সিং ভিডিও ও রিভিউ দেখতে পারেন। প্রতিটি ব্যাচ সর্বোচ্চ মান বজায় রেখে ফ্রেশ ভাজা হয়।
          </span>
        </div>
      </div>
    </section>
  );
}
