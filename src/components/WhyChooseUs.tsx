import { Check, X, Sparkles, HeartPulse, Droplets, UtensilsCrossed, ShieldCheck } from 'lucide-react';

export default function WhyChooseUs() {
  const comparisonItems = [
    {
      feature: 'ভাজার মাধ্যম',
      ourProduct: '১০০% খাঁটি দেশি গরুর দুধের গাওয়া ঘি',
      normalMarket: 'পোড়া ডালডা, পাম তেল বা চর্বি মিশ্রিত তেল',
    },
    {
      feature: 'সুঘ্রাণ ও স্বাদ',
      ourProduct: 'খাঁটি ঘিয়ে ভাজার মনমাতানো প্রাকৃতিক সুবাস, মুখে দিলে গলে যায়',
      normalMarket: 'ডালডার বাজে গন্ধ, মুখে চটচটে তৈলাক্ত ভাব লেগে থাকে',
    },
    {
      feature: 'রান্নার পরের টেক্সচার',
      ourProduct: 'নরম তুলতুলে কিন্তু সহজে গলে ভর্তা হয়ে যায় না',
      normalMarket: 'দুধে দেওয়ার সাথে সাথেই গলে নরম দলা পেকে যায়',
    },
    {
      feature: 'স্বাস্থ্যঝুঁকি ও প্রিজারভেটিভ',
      ourProduct: 'সম্পূর্ণ ভেজালমুক্ত, কৃত্রিম রঙ বা ক্ষতিকর কেমিক্যাল মুক্ত',
      normalMarket: 'ট্রান্স ফ্যাট ও পোড়া তেলের ক্ষতিকর বিষাক্ত উপাদান',
    },
    {
      feature: 'প্যাকেজিং ও ফ্রেশনেস',
      ourProduct: 'ফুড গ্রেড এয়ার-টাইট বক্স সিলিং, ৪-৬ মাস মুচমুচে থাকে',
      normalMarket: 'পাতলা সাধারণ পলিথিন, খুব দ্রুত স্যাঁতসেঁতে বা নষ্ট হয়ে যায়',
    },
    {
      feature: 'পণ্য যাচাই ও নিশ্চয়তা',
      ourProduct: 'পণ্য হাতে পেয়ে চেক করে ডেলিভারি ম্যানকে টাকা পরিশোধ',
      normalMarket: 'কোনো গ্যারান্টি নেই, কেনার পর ফেরত নেওয়ার সুযোগ নেই',
    },
  ];

  const features = [
    {
      icon: <Droplets className="w-6 h-6 text-amber-600" />,
      title: 'সিরাজগঞ্জের খাঁটি গাওয়া ঘি',
      description: 'শতভাগ খাঁটি দেশি গরুর দুধের মাখন থেকে তৈরি গাওয়া ঘিয়ে ভাজা হয়। কোনো উদ্ভিজ্জ ফ্যাট বা পাম তেলের স্পর্শ নেই।',
    },
    {
      icon: <UtensilsCrossed className="w-6 h-6 text-amber-600" />,
      title: 'নিখুঁত কারিগরি মিহি সুতা',
      description: 'অভিজ্ঞ কারিগরদের নিখুঁত হাতে প্যাঁচানো সোনালী লাচ্ছা সেমাই। যার প্রতিটি স্তর সুষমভাবে ভাজা ও মুচমুচে।',
    },
    {
      icon: <HeartPulse className="w-6 h-6 text-emerald-600" />,
      title: 'পরিবারের স্বাস্থ্যের জন্য নিরাপদ',
      description: 'ট্রান্স-ফ্যাট মুক্ত এবং কোনো প্রকার কৃত্রিম ফ্লেভার বা রাসায়নিক নেই। শিশু থেকে বয়োজ্যেষ্ঠ সবার জন্য নিরাপদ।',
    },
    {
      icon: <ShieldCheck className="w-6 h-6 text-amber-600" />,
      title: 'ফুড-গ্রেড সিল্ড প্যাকেজিং',
      description: 'আন্তর্জাতিক মানসম্মত ডাবল-লেয়ার সিলিং বক্সে সংরক্ষিত। ভাঙার ভয় নেই এবং দীর্ঘ সময় পর্যন্ত ক্রিস্পি থাকে।',
    },
  ];

  return (
    <section className="py-12 sm:py-16 bg-white border-b border-stone-200">
      <div className="max-w-6xl mx-auto px-4">
        {/* Section Title */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 bg-amber-100 px-3 py-1 rounded-full mb-3 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>প্রকৃত গুণমান ও পার্থক্য</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-stone-900 leading-snug">
            কেন আমাদের স্পেশাল ঘিয়ে ভাজা লাচ্ছা সেমাই বাজারের সাধারণ সেমাই থেকে আলাদা?
          </h2>
          <p className="mt-3 text-stone-600 text-sm sm:text-base">
            আপনার কষ্টার্জিত অর্থে পরিবারের মুখে স্বাস্থ্যকর ও সেরা খাবার তুলে দিতে কোনো আপস করবেন না।
          </p>
        </div>

        {/* 4 Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-12">
          {features.map((item, idx) => (
            <div
              key={idx}
              className="bg-[#faf7f0] rounded-xl p-5 border border-amber-900/10 hover:border-amber-400/50 hover:shadow-md transition-all group"
            >
              <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                {item.icon}
              </div>
              <h3 className="font-bold text-stone-900 text-base sm:text-lg mb-2">
                {item.title}
              </h3>
              <p className="text-stone-600 text-xs sm:text-sm leading-relaxed">
                {item.description}
              </p>
            </div>
          ))}
        </div>

        {/* Comparison Table */}
        <div className="bg-[#faf9f5] rounded-2xl p-4 sm:p-6 border border-stone-200 shadow-sm overflow-hidden">
          <div className="text-center mb-6">
            <h3 className="text-lg sm:text-2xl font-bold text-stone-900">
              সরাসরি তুলনা: খাঁটি সেমাই বনাম বাজারী ডালডার সেমাই
            </h3>
            <p className="text-xs sm:text-sm text-stone-500 mt-1">
              এক নজরে দেখে নিন আমাদের প্রিমিয়াম সেমাই কেন সেরা
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="border-b border-stone-200 text-stone-800">
                  <th className="py-3 px-3 sm:px-4 font-bold bg-stone-100/60 rounded-tl-lg">
                    বৈশিষ্ট্য / মানদণ্ড
                  </th>
                  <th className="py-3 px-3 sm:px-4 font-extrabold text-emerald-800 bg-emerald-50/80 border-x border-emerald-200">
                    ✨ আমাদের প্রিমিয়াম শাহী লাচ্ছা সেমাই
                  </th>
                  <th className="py-3 px-3 sm:px-4 font-semibold text-rose-800 bg-rose-50/60 rounded-tr-lg">
                    ❌ বাজারের সাধারণ খোলা সেমাই
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200/80">
                {comparisonItems.map((row, index) => (
                  <tr key={index} className="hover:bg-amber-50/30 transition-colors">
                    <td className="py-3 px-3 sm:px-4 font-semibold text-stone-800 align-top">
                      {row.feature}
                    </td>
                    <td className="py-3 px-3 sm:px-4 bg-emerald-50/30 border-x border-emerald-100 text-stone-900 align-top">
                      <div className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span className="font-medium text-emerald-950">{row.ourProduct}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 sm:px-4 bg-rose-50/20 text-stone-700 align-top">
                      <div className="flex items-start gap-2">
                        <X className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                        <span className="text-stone-600">{row.normalMarket}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
