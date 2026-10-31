import { Sparkles, HeartPulse, Droplets, UtensilsCrossed, ShieldCheck } from 'lucide-react';

export default function WhyChooseUs() {
  const features = [
    {
      // Golden amber icon — brand secondary
      icon: <Droplets className="w-6 h-6" style={{ color: 'var(--brand-amber)' }} />,
      title: 'সিরাজগঞ্জের খাঁটি গাওয়া ঘি',
      description: 'শতভাগ খাঁটি দেশি গরুর দুধের মাখন থেকে তৈরি গাওয়া ঘিয়ে ভাজা হয়। কোনো উদ্ভিজ্জ ফ্যাট বা পাম তেলের স্পর্শ নেই।',
    },
    {
      icon: <UtensilsCrossed className="w-6 h-6" style={{ color: 'var(--brand-amber)' }} />,
      title: 'নিখুঁত কারিগরি মিহি সুতা',
      description: 'অভিজ্ঞ কারিগরদের নিখুঁত হাতে প্যাঁচানো সোনালী লাচ্ছা সেমাই। যার প্রতিটি স্তর সুষমভাবে ভাজা ও মুচমুচে।',
    },
    {
      // Leaf green for health — brand tertiary
      icon: <HeartPulse className="w-6 h-6" style={{ color: 'var(--brand-leaf)' }} />,
      title: 'পরিবারের স্বাস্থ্যের জন্য নিরাপদ',
      description: 'ট্রান্স-ফ্যাট মুক্ত এবং কোনো প্রকার কৃত্রিম ফ্লেভার বা রাসায়নিক নেই। শিশু থেকে বয়োজ্যেষ্ঠ সবার জন্য নিরাপদ।',
    },
    {
      // Forest green for trust/shield
      icon: <ShieldCheck className="w-6 h-6" style={{ color: 'var(--brand-forest)' }} />,
      title: 'ফুড-গ্রেড সিল্ড প্যাকেজিং',
      description: 'আন্তর্জাতিক মানসম্মত ডাবল-লেয়ার সিলিং বক্সে সংরক্ষিত। ভাঙার ভয় নেই এবং দীর্ঘ সময় পর্যন্ত ক্রিস্পি থাকে।',
    },
  ];

  return (
    <section className="py-12 sm:py-16 bg-white border-b border-stone-200">
      <div className="max-w-6xl mx-auto px-4">
        {/* Section Title */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          {/* Brand amber badge — matches section badge pattern in BundleSelector */}
          <div
            className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full mb-3 uppercase tracking-wider"
            style={{ color: 'var(--brand-amber-dark)', backgroundColor: 'var(--brand-amber-light)' }}
          >
            <Sparkles className="w-3.5 h-3.5" style={{ color: 'var(--brand-amber)' }} />
            <span>প্রকৃত গুণমান ও পার্থক্য</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-stone-900 leading-snug">
            কেন আমাদের স্পেশাল ঘিয়ে ভাজা লাচ্ছা সেমাই বাজারের সাধারণ সেমাই থেকে আলাদা?
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
              className="bg-[#faf7f0] rounded-xl p-5 border border-amber-900/10 hover:shadow-md transition-all group"
              style={{ borderColor: undefined }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'color-mix(in srgb, var(--brand-amber) 30%, transparent)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = ''; }}
            >
              {/* Icon container — brand amber light background */}
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"
                style={{ backgroundColor: 'var(--brand-amber-light)' }}
              >
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

      </div>
    </section>
  );
}
