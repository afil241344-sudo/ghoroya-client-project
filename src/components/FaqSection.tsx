import { useState } from 'react';
import { HelpCircle, ChevronDown } from 'lucide-react';
import { FAQS } from '../data/shemaiData';

export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section id="faq-section" className="py-12 sm:py-16 bg-white border-b border-stone-200">
      <div className="max-w-4xl mx-auto px-4">
        {/* Section Heading */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-800 bg-stone-100 px-3 py-1 rounded-full mb-3 uppercase tracking-wider">
            <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
            <span>সচরাচর জিজ্ঞাসা (FAQ)</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900">
            অর্ডার করার আগে আপনার মনের সাধারণ প্রশ্নগুলো
          </h2>
          <p className="mt-2 text-stone-600 text-xs sm:text-sm">
            যেকোনো দ্বিধা দূর করতে নিচের উত্তরগুলো পড়ে নিন
          </p>
        </div>

        {/* Accordion */}
        <div className="space-y-3">
          {FAQS.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="border border-stone-200 rounded-xl overflow-hidden transition-all bg-[#faf8f3]"
              >
                <button
                  type="button"
                  onClick={() => toggle(idx)}
                  className="w-full text-left p-4 sm:p-5 flex items-center justify-between gap-4 font-bold text-stone-900 text-sm sm:text-base hover:bg-amber-50/50 transition-colors cursor-pointer"
                >
                  <span>{faq.question}</span>
                  <div
                    className={`w-6 h-6 rounded-full bg-stone-200/70 flex items-center justify-center shrink-0 transition-transform duration-300 ${
                      isOpen ? 'rotate-180 bg-amber-200 text-amber-900' : ''
                    }`}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-0 text-stone-600 text-xs sm:text-sm leading-relaxed border-t border-stone-200/50 bg-white">
                    <p className="pt-3">{faq.answer}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Need more help banner */}
        <div className="mt-8 text-center text-xs sm:text-sm text-stone-600">
          অন্য কোনো প্রশ্ন আছে? সরাসরি কল করুন আমাদের হটলাইনে:{' '}
          <a
            href="tel:01798241344"
            className="font-bold text-emerald-700 hover:text-emerald-800 underline"
          >
            01798-241344
          </a>
        </div>
      </div>
    </section>
  );
}
