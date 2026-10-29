import { useState } from 'react';
import { X, Copy, Check, Download, Layers, ExternalLink, Settings, ShoppingCart, Truck, CheckCircle2, FileCode, Sparkles } from 'lucide-react';
import heroBowlImg from '../assets/images/shemai_hero_bowl_1793156337325.jpg';
import packagingBoxImg from '../assets/images/shemai_packaging_box_1793156354481.jpg';
import preparedDishImg from '../assets/images/prepared_malai_shemai_1793156370328.jpg';

interface WordPressGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WordPressGuideModal({ isOpen, onClose }: WordPressGuideModalProps) {
  const [activeTab, setActiveTab] = useState<'steps' | 'plugins' | 'code' | 'images'>('steps');
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, sectionKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionKey);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const customCssCode = `/* === Bangladeshi Lachcha Shemai High-Converting Styles for WordPress === */
@import url('https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;600;700;800&display=swap');

body, .elementor, .woocommerce-checkout {
  font-family: 'Hind Siliguri', sans-serif !important;
}

/* Pulsing animated order button */
@keyframes pulseButton {
  0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.6); }
  70% { transform: scale(1.02); box-shadow: 0 0 0 15px rgba(220, 38, 38, 0); }
  100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(220, 38, 38, 0); }
}

.shemai-order-btn, 
.woocommerce #place_order, 
.wcf-btn-checkout {
  background: linear-gradient(135deg, #dc2626, #b91c1c) !important;
  color: #ffffff !important;
  font-size: 18px !important;
  font-weight: 800 !important;
  border-radius: 12px !important;
  padding: 16px 28px !important;
  border: 1px solid rgba(254, 202, 202, 0.4) !important;
  animation: pulseButton 2s infinite ease-in-out !important;
  cursor: pointer !important;
}

.shemai-order-btn:hover, 
.woocommerce #place_order:hover {
  background: linear-gradient(135deg, #b91c1c, #991b1b) !important;
}

/* 1-Page CartFlows / WooCommerce simplified checkout styling */
.woocommerce-billing-fields__field-wrapper p {
  margin-bottom: 12px !important;
}
.woocommerce-billing-fields label {
  font-weight: 700 !important;
  color: #1c1917 !important;
}
.woocommerce-checkout input.input-text, 
.woocommerce-checkout textarea {
  border-radius: 8px !important;
  border: 1.5px solid #d6d3d1 !important;
  padding: 10px 14px !important;
}
.woocommerce-checkout input.input-text:focus {
  border-color: #059669 !important;
  box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.15) !important;
}`;

  const elementorShortcodeHtml = `<!-- ওয়ার্ডপ্রেস এলিমেন্টরে 'HTML' বা 'Shortcode' উইজেটে পেস্ট করুন -->
<div class="shemai-landing-wrapper" style="font-family:'Hind Siliguri',sans-serif; background:#fffdfa; padding:20px; border-radius:16px;">
  <!-- অফার হেডিং -->
  <div style="text-align:center; margin-bottom:24px;">
    <span style="background:#fef3c7; color:#92400e; padding:4px 12px; border-radius:20px; font-weight:700; font-size:12px;">
      ১০০% খাঁটি সিরাজগঞ্জের গাওয়া ঘি ভাজা
    </span>
    <h2 style="color:#1c1917; font-size:28px; font-weight:800; margin-top:10px;">
      স্পেশাল শাহী লাচ্ছা সেমাই - ক্যাশ অন ডেলিভারিতে অর্ডার করুন
    </h2>
    <p style="color:#57534e; font-size:15px;">
      পণ্য হাতে পেয়ে চেক করে ডেলিভারি ম্যানকে টাকা পরিশোধ করবেন। কোনো অগ্রিম পেমেন্ট লাগবে না।
    </p>
  </div>

  <!-- কার্টফ্লোস অথবা উকমার্স চেকআউট শর্টকোড -->
  <div style="background:#ffffff; padding:24px; border-radius:16px; border:1px solid #e7e5e4; box-shadow:0 4px 20px rgba(0,0,0,0.05);">
    [cartflows_checkout]
    <!-- অথবা সরাসরি উকমার্স ব্যবহার করলে নিচের শর্টকোডটি দিন: -->
    <!-- [woocommerce_checkout] -->
  </div>
</div>`;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="relative bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-stone-200 overflow-hidden my-4 max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#21759b] via-[#0073aa] to-[#135e96] text-white p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center font-bold text-xl border border-white/30">
              W
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold flex items-center gap-2">
                <span>ওয়ার্ডপ্রেস, কার্টফ্লোস ও উকমার্স সম্পূর্ণ সমাধান</span>
                <span className="text-[10px] bg-amber-400 text-stone-900 font-extrabold px-2 py-0.5 rounded">
                  WordPress Guide
                </span>
              </h3>
              <p className="text-xs text-sky-100">
                এই ল্যান্ডিং পেজটি আপনার ওয়ার্ডপ্রেস ওয়েবসাইটে হুবহু সেটআপ করার সহজ নির্দেশিকা
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-stone-200 bg-stone-50 px-4 text-xs sm:text-sm font-bold overflow-x-auto no-scrollbar shrink-0">
          <button
            onClick={() => setActiveTab('steps')}
            className={`py-3 px-4 border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'steps'
                ? 'border-[#0073aa] text-[#0073aa] bg-white'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>ধাপে ধাপে সেটআপ গাইড</span>
          </button>
          <button
            onClick={() => setActiveTab('plugins')}
            className={`py-3 px-4 border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'plugins'
                ? 'border-[#0073aa] text-[#0073aa] bg-white'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>প্রয়োজনীয় প্লাগইন তালিকা</span>
          </button>
          <button
            onClick={() => setActiveTab('code')}
            className={`py-3 px-4 border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'code'
                ? 'border-[#0073aa] text-[#0073aa] bg-white'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            <FileCode className="w-4 h-4" />
            <span>কাস্টম CSS ও শর্টকোড</span>
          </button>
          <button
            onClick={() => setActiveTab('images')}
            className={`py-3 px-4 border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'images'
                ? 'border-[#0073aa] text-[#0073aa] bg-white'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>ছবি ও অ্যাসেটস ডাউনলোড</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-stone-800 text-xs sm:text-sm">
          {/* TAB 1: Step by step setup */}
          {activeTab === 'steps' && (
            <div className="space-y-6">
              <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 text-amber-950">
                <p className="font-bold flex items-center gap-2 text-sm text-amber-900">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>ওয়ার্ডপ্রেসে ১-পেজ ফানেল তৈরির মূল রহস্য</span>
                </p>
                <p className="mt-1 text-xs text-amber-900/80 leading-relaxed">
                  বাংলাদেশে পণ্য বিক্রির সবচেয়ে কার্যকর পদ্ধতি হলো: কোনো জটিল কার্ট বা আলাদা চেকআউট পেজে না পাঠিয়ে <strong>একই পেজে ল্যান্ডিং কন্টেন্ট + বান্ডেল সিলেক্টর + নিচে সরাসরি ১-পেজ ক্যাশ অন ডেলিভারি ফর্ম</strong> রাখা।
                </p>
              </div>

              {/* Step 1 */}
              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-[#0073aa] text-white flex items-center justify-center font-bold text-sm shrink-0">
                  ১
                </div>
                <div>
                  <h4 className="font-extrabold text-stone-900 text-sm sm:text-base">
                    WooCommerce এ প্রোডাক্ট যোগ করুন
                  </h4>
                  <p className="text-stone-600 mt-1 leading-relaxed">
                    WordPress ড্যাশবোর্ড থেকে <code>Products &gt; Add New</code> এ যান। ৩টি প্যাকেজ তৈরি করুন:
                  </p>
                  <ul className="list-disc list-inside mt-2 space-y-1 text-stone-700 bg-stone-50 p-3 rounded-lg border border-stone-200">
                    <li><strong>১ বক্স ট্রায়াল প্যাক (৪৫০ গ্রাম)</strong> — Regular Price: ৳550, Sale Price: ৳420</li>
                    <li><strong>২ বক্স ফ্যামিলি প্যাক (৯০০ গ্রাম)</strong> — Regular Price: ৳1100, Sale Price: ৳790</li>
                    <li><strong>৪ বক্স মেগা প্যাক (১৮০০ গ্রাম)</strong> — Regular Price: ৳2200, Sale Price: ৳1490</li>
                  </ul>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-[#0073aa] text-white flex items-center justify-center font-bold text-sm shrink-0">
                  ২
                </div>
                <div>
                  <h4 className="font-extrabold text-stone-900 text-sm sm:text-base">
                    CartFlows দিয়ে ১-পেজ সেলস ফানেল তৈরি করুন
                  </h4>
                  <p className="text-stone-600 mt-1 leading-relaxed">
                    WordPress ড্যাশবোর্ড থেকে <code>CartFlows &gt; Flows &gt; Add New</code> এ ক্লিক করুন:
                  </p>
                  <div className="mt-2 bg-stone-50 p-3 rounded-lg border border-stone-200 space-y-1.5">
                    <p>• টেমপ্লেট নির্বাচন করুন <strong>&quot;Create Your Own&quot;</strong> অথবা <strong>&quot;Lead / Product Flow&quot;</strong>।</p>
                    <p>• চেকআউট স্টেপ (Checkout Step) এ ক্লিক করে আপনার তৈরি করা লাচ্ছা সেমাই প্রোডাক্টটি সংযুক্ত করুন।</p>
                    <p>• <strong>Checkout Design</strong> ট্যাবে গিয়ে <strong>Elementor Canvas</strong> সিলেক্ট করুন যাতে কোনো হেডার/ফুটার ঝামেলা ছাড়া ক্লিন ল্যান্ডিং পেজ হয়।</p>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-[#0073aa] text-white flex items-center justify-center font-bold text-sm shrink-0">
                  ৩
                </div>
                <div>
                  <h4 className="font-extrabold text-stone-900 text-sm sm:text-base">
                    চেকআউট ফর্ম ফিল্ড সহজ করুন (বাংলাদেশের জন্য অপ্টিমাইজড)
                  </h4>
                  <p className="text-stone-600 mt-1 leading-relaxed">
                    বাংলাদেশি ক্রেতারা পোস্টকোড, কোম্পানি নেম বা অপ্রয়োজনীয় ফিল্ড পছন্দ করেন না।
                  </p>
                  <div className="mt-2 bg-stone-50 p-3 rounded-lg border border-stone-200">
                    <p className="font-semibold text-emerald-800">শুধুমাত্র এই ৪টি ফিল্ড রাখুন:</p>
                    <div className="grid grid-cols-2 gap-2 mt-1 text-xs">
                      <span className="bg-white p-1.5 rounded border border-stone-200">✓ আপনার নাম (Full Name)</span>
                      <span className="bg-white p-1.5 rounded border border-stone-200">✓ মোবাইল নাম্বার (Phone)</span>
                      <span className="bg-white p-1.5 rounded border border-stone-200">✓ সম্পূর্ণ ঠিকানা (Address)</span>
                      <span className="bg-white p-1.5 rounded border border-stone-200">✓ ডেলিভারি এরিয়া (Dhaka / Outside)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-[#0073aa] text-white flex items-center justify-center font-bold text-sm shrink-0">
                  ৪
                </div>
                <div>
                  <h4 className="font-extrabold text-stone-900 text-sm sm:text-base">
                    Cash on Delivery (COD) ও ডেলিভারি চার্জ নির্ধারণ
                  </h4>
                  <p className="text-stone-600 mt-1 leading-relaxed">
                    <code>WooCommerce &gt; Settings &gt; Payments</code> থেকে <strong>Cash on delivery</strong> অন করে দিন।
                  </p>
                  <div className="mt-2 rounded-lg border border-stone-200 bg-stone-50 p-3 text-xs text-stone-600">
                    ঢাকার ভেতরে ও বাইরে ডেলিভারি চার্জ Admin Dashboard-এর <strong>সেটিংস</strong> ট্যাব থেকে নির্ধারণ করুন।
                  </div>
                </div>
              </div>

              {/* Step 5 */}
              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-[#0073aa] text-white flex items-center justify-center font-bold text-sm shrink-0">
                  ৫
                </div>
                <div>
                  <h4 className="font-extrabold text-stone-900 text-sm sm:text-base">
                    কুরিয়ার অটোমেশন (Steadfast বা Pathao API)
                  </h4>
                  <p className="text-stone-600 mt-1 leading-relaxed">
                    WordPress এর ফ্রি <strong>Steadfast Courier Plugin</strong> ইনস্টল করে API কি বসিয়ে দিলে, গ্রাহক অর্ডার কনফার্ম করার সাথে সাথেই অটোমেটিক কুরিয়ার পার্সেল তৈরি হয়ে যাবে!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Recommended Plugins */}
          {activeTab === 'plugins' && (
            <div className="space-y-4">
              <p className="text-stone-600">
                এই ধরণের হাই-কনভার্টিং ল্যান্ডিং পেজ ওয়ার্ডপ্রেসে চালানোর জন্য নিচের প্লাগইনগুলো সেরা:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-4 bg-stone-50 rounded-xl border border-stone-200">
                  <div className="flex items-center justify-between">
                    <h5 className="font-bold text-stone-900">WooCommerce</h5>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
                      অবশ্যই লাগবে
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 mt-1">
                    পণ্য তৈরি, অর্ডার ডাটাবেস ও ইনভয়েস ম্যানেজমেন্টের জন্য।
                  </p>
                </div>

                <div className="p-4 bg-stone-50 rounded-xl border border-stone-200">
                  <div className="flex items-center justify-between">
                    <h5 className="font-bold text-stone-900">CartFlows (Free or Pro)</h5>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
                      ফানেল প্লাগইন
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 mt-1">
                    ১-ক্লিক ফানেল, বান্ডেল অফার ও ১-পেজ সরাসরি চেকআউটের জন্য সবচেয়ে জনপ্রিয়।
                  </p>
                </div>

                <div className="p-4 bg-stone-50 rounded-xl border border-stone-200">
                  <div className="flex items-center justify-between">
                    <h5 className="font-bold text-stone-900">Elementor Page Builder</h5>
                    <span className="text-[10px] bg-stone-200 text-stone-800 font-bold px-2 py-0.5 rounded">
                      ডিজাইনার
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 mt-1">
                    ড্র্যাগ-এন্ড-ড্রপ ভিজ্যুয়াল সেকশন ও ইমেজ গ্যালারি সাজানোর জন্য।
                  </p>
                </div>

                <div className="p-4 bg-stone-50 rounded-xl border border-stone-200">
                  <div className="flex items-center justify-between">
                    <h5 className="font-bold text-stone-900">Checkout Field Editor for WC</h5>
                    <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded">
                      রিকমেন্ডেড
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 mt-1">
                    অপ্রয়োজনীয় ফিল্ড (Zip code, Country) মুছে ফেলে শুধু ফোন, নাম ও ঠিকানা রাখার প্লাগইন।
                  </p>
                </div>

                <div className="p-4 bg-stone-50 rounded-xl border border-stone-200">
                  <div className="flex items-center justify-between">
                    <h5 className="font-bold text-stone-900">Steadfast Courier Plugin</h5>
                    <span className="text-[10px] bg-sky-100 text-sky-800 font-bold px-2 py-0.5 rounded">
                      বাংলাদেশি কুরিয়ার
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 mt-1">
                    অর্ডার হলেই স্টিডফাস্ট কুরিয়ারে অটোমেটিক পার্সেল ও ট্র্যাকিং তৈরি করে।
                  </p>
                </div>

                <div className="p-4 bg-stone-50 rounded-xl border border-stone-200">
                  <div className="flex items-center justify-between">
                    <h5 className="font-bold text-stone-900">NotificationX বা WP Social Ninja</h5>
                    <span className="text-[10px] bg-stone-200 text-stone-800 font-bold px-2 py-0.5 rounded">
                      সোশ্যাল প্রুফ
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 mt-1">
                    নিচে বাম পাশে লাইভ পপ-আপ: &quot;অমুক এইমাত্র ২ বক্স অর্ডার করেছেন!&quot; দেখানোর জন্য।
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Code & Custom CSS */}
          {activeTab === 'code' && (
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h5 className="font-bold text-stone-900 text-sm">
                    ১. কাস্টম সিএসএস (Customizer &gt; Additional CSS এ দিন)
                  </h5>
                  <button
                    onClick={() => copyToClipboard(customCssCode, 'css')}
                    className="flex items-center gap-1 text-xs bg-stone-100 hover:bg-stone-200 px-3 py-1 rounded border border-stone-300 font-bold cursor-pointer"
                  >
                    {copiedSection === 'css' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">কপি হয়েছে!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>কপি করুন</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="bg-stone-900 text-emerald-400 p-4 rounded-xl text-xs overflow-x-auto font-mono max-h-52">
                  {customCssCode}
                </pre>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h5 className="font-bold text-stone-900 text-sm">
                    ২. এলিমেন্টর HTML ব্লক ও শর্টকোড (Elementor Shortcode Widget)
                  </h5>
                  <button
                    onClick={() => copyToClipboard(elementorShortcodeHtml, 'shortcode')}
                    className="flex items-center gap-1 text-xs bg-stone-100 hover:bg-stone-200 px-3 py-1 rounded border border-stone-300 font-bold cursor-pointer"
                  >
                    {copiedSection === 'shortcode' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">কপি হয়েছে!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>কপি করুন</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="bg-stone-900 text-amber-300 p-4 rounded-xl text-xs overflow-x-auto font-mono max-h-44">
                  {elementorShortcodeHtml}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 4: Download Images */}
          {activeTab === 'images' && (
            <div className="space-y-4">
              <p className="text-stone-600">
                এই ল্যান্ডিং পেজে ব্যবহৃত উচ্চমানের জেনারেটেড ছবিগুলো আপনার ওয়ার্ডপ্রেস <code>Media Library</code> তে আপলোড করে ব্যবহার করতে পারেন:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 flex flex-col justify-between">
                  <div className="aspect-[4/3] rounded-lg overflow-hidden border border-stone-200 mb-2">
                    <img src={heroBowlImg} alt="ঘিয়ে ভাজা লাচ্ছা সেমাই" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h6 className="font-bold text-xs text-stone-900">হিরো বোল (ঘিয়ে ভাজা সেমাই)</h6>
                    <a
                      href={heroBowlImg}
                      download="shahi_ghee_lachcha_shemai_hero.jpg"
                      className="mt-2 w-full bg-[#0073aa] hover:bg-[#005a87] text-white py-1.5 px-2 rounded text-xs font-bold flex items-center justify-center gap-1"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>ডাউনলোড করুন</span>
                    </a>
                  </div>
                </div>

                <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 flex flex-col justify-between">
                  <div className="aspect-[4/3] rounded-lg overflow-hidden border border-stone-200 mb-2">
                    <img src={packagingBoxImg} alt="প্রিমিয়াম বক্স প্যাকেজিং" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h6 className="font-bold text-xs text-stone-900">প্রিমিয়াম বক্স প্যাকেজিং</h6>
                    <a
                      href={packagingBoxImg}
                      download="shahi_ghee_shemai_box_packaging.jpg"
                      className="mt-2 w-full bg-[#0073aa] hover:bg-[#005a87] text-white py-1.5 px-2 rounded text-xs font-bold flex items-center justify-center gap-1"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>ডাউনলোড করুন</span>
                    </a>
                  </div>
                </div>

                <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 flex flex-col justify-between">
                  <div className="aspect-[4/3] rounded-lg overflow-hidden border border-stone-200 mb-2">
                    <img src={preparedDishImg} alt="শাহী মালাই সেমাই রেসিপি" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h6 className="font-bold text-xs text-stone-900">মালাই সেমাই রেসিপি বোল</h6>
                    <a
                      href={preparedDishImg}
                      download="shahi_malai_shemai_recipe.jpg"
                      className="mt-2 w-full bg-[#0073aa] hover:bg-[#005a87] text-white py-1.5 px-2 rounded text-xs font-bold flex items-center justify-center gap-1"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>ডাউনলোড করুন</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-stone-100 p-4 border-t border-stone-200 flex items-center justify-between shrink-0">
          <span className="text-xs text-stone-500 font-medium">
            WordPress 6.x + WooCommerce 9.x + CartFlows Ready
          </span>
          <button
            onClick={onClose}
            className="bg-stone-800 hover:bg-stone-900 text-white font-bold py-2 px-5 rounded-xl text-xs transition-colors cursor-pointer"
          >
            বুঝেছি, বন্ধ করুন
          </button>
        </div>
      </div>
    </div>
  );
}
