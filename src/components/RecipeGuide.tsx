import { ChefHat, Flame, Sparkles, Clock, Utensils, Heart } from 'lucide-react';
import preparedDishImg from '../assets/images/prepared_malai_shemai_1793156370328.jpg';
import { RECIPE_STEPS } from '../data/shemaiData';
import { scrollToCheckout } from '../utils/scrollToCheckout';

export default function RecipeGuide() {
  return (
    <section id="recipe-section" className="hidden py-12 sm:py-16 bg-white border-b border-stone-200 lg:block">
      <div className="max-w-6xl mx-auto px-4">
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 bg-amber-100 px-3 py-1 rounded-full mb-3 uppercase tracking-wider">
            <ChefHat className="w-3.5 h-3.5 text-amber-600" />
            <span>স্পেশাল রন্ধন প্রণালী</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-stone-900">
            কীভাবে তৈরি করবেন জিভে জল আনা রাজকীয় মালাই লাচ্ছা সেমাই?
          </h2>
          <p className="mt-3 text-stone-600 text-sm sm:text-base">
            আমাদের সেমাই যেহেতু খাঁটি গাওয়া ঘিয়ে ভাজা, তাই এটি চুলায় জ্বাল দেওয়ার প্রয়োজন হয় না। ফুটন্ত গরম দুধ ঢাললেই তৈরি হয়ে যায় অতুলনীয় স্বাদের মালাই সেমাই।
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Prepared Dish Imagery & Quick Specs */}
          <div className="lg:col-span-5">
            <div className="relative rounded-2xl overflow-hidden shadow-xl border border-stone-200 group">
              <img
                src={preparedDishImg}
                alt="শাহী মালাই লাচ্ছা সেমাই রেসিপি"
                className="w-full h-auto aspect-[4/3] object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
                decoding="async"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
              <div className="absolute bottom-4 left-4 right-4 text-white">
                <span className="bg-amber-500 text-stone-950 text-xs font-bold px-2.5 py-1 rounded-md mb-2 inline-block">
                  ১০ মিনিটে তৈরি
                </span>
                <h3 className="text-lg font-bold">ঘরোয়া শাহী ক্ষীর ও মালাই সেমাই</h3>
                <p className="text-xs text-amber-100 mt-0.5">
                  গাওয়া ঘিয়ের ঘ্রাণ ও জাফরানের রঙে এক রাজকীয় অভিজ্ঞতা
                </p>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-3 mt-4 text-center">
              <div className="bg-[#faf7f0] p-3 rounded-xl border border-amber-900/10">
                <Clock className="w-4 h-4 text-amber-700 mx-auto mb-1" />
                <span className="block text-[11px] text-stone-500">প্রস্তুতি সময়</span>
                <span className="font-bold text-xs sm:text-sm text-stone-800">১০ মিনিট</span>
              </div>
              <div className="bg-[#faf7f0] p-3 rounded-xl border border-amber-900/10">
                <Utensils className="w-4 h-4 text-amber-700 mx-auto mb-1" />
                <span className="block text-[11px] text-stone-500">পরিবেশন</span>
                <span className="font-bold text-xs sm:text-sm text-stone-800">৪-৬ জন</span>
              </div>
              <div className="bg-[#faf7f0] p-3 rounded-xl border border-amber-900/10">
                <Heart className="w-4 h-4 text-rose-600 mx-auto mb-1" />
                <span className="block text-[11px] text-stone-500">পছন্দের রেটিং</span>
                <span className="font-bold text-xs sm:text-sm text-stone-800">১০০% হিট</span>
              </div>
            </div>
          </div>

          {/* Right Column: 4 Step-by-Step Cooking Instructions */}
          <div className="lg:col-span-7">
            <div className="space-y-4">
              {RECIPE_STEPS.map((item) => (
                <div
                  key={item.step}
                  className="flex items-start gap-4 p-4 rounded-xl bg-[#fdfbf7] border border-amber-900/10 hover:border-amber-400 transition-colors"
                >
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-600 to-amber-700 text-white font-extrabold flex items-center justify-center shrink-0 shadow-sm text-sm">
                    {item.step}
                  </div>
                  <div>
                    <h4 className="font-bold text-stone-900 text-sm sm:text-base">
                      {item.title}
                    </h4>
                    <p className="text-xs sm:text-sm text-stone-600 mt-1 leading-relaxed">
                      {item.detail}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Secret Tip Card */}
            <div className="mt-6 p-4 rounded-xl bg-amber-50 border border-amber-300 flex items-start gap-3 text-xs sm:text-sm text-amber-950">
              <Sparkles className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <strong>শেফ স্পেশাল টিপস:</strong> লাচ্ছা সেমাই কখনোই দুধের পাত্রে চুলায় বসিয়ে ফোটাবেন না! বাটিতে সেমাই সাজিয়ে তার ওপর গরম দুধ ঢাললে সেমাইয়ের ভেতরের মুচমুচে ক্রিস্পি ভাব এবং ঘিয়ের আসল স্বাদ সবচেয়ে ভালো বজায় থাকে।
              </div>
            </div>

            {/* Order CTA from Recipe */}
            <div className="mt-6 text-center sm:text-left">
              <button
                onClick={scrollToCheckout}
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm sm:text-base py-3 px-6 rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer inline-flex items-center gap-2"
              >
                <Flame className="w-4 h-4 text-amber-300" />
                <span>আজই রেসিপির জন্য প্রিমিয়াম সেমাই অর্ডার করুন</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
