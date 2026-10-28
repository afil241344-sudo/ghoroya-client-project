import { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { CheckCircle2, MessageCircle, Printer, X, PackageCheck, Phone, ShieldCheck, MapPin } from 'lucide-react';
import { PlacedOrder } from '../types';

interface OrderSuccessModalProps {
  order: PlacedOrder | null;
  onClose: () => void;
}

export default function OrderSuccessModal({ order, onClose }: OrderSuccessModalProps) {
  useEffect(() => {
    if (order) {
      // Fire confetti burst
      try {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#059669', '#d97706', '#dc2626', '#f59e0b'],
        });
      } catch {
        // fallback silently
      }
    }
  }, [order]);

  if (!order) return null;

  const whatsappMessage = encodeURIComponent(
    `সালামু আলাইকুম! আমি লাচ্ছা সেমাই এর একটি অর্ডার করেছি।\n\n` +
      `অর্ডার আইডি: ${order.orderId}\n` +
      `নাম: ${order.customer.fullName}\n` +
      `মোবাইল: ${order.customer.phone}\n` +
      `ঠিকানা: ${order.customer.address}\n` +
      `প্যাকেজ: ${order.bundle.name} (${order.quantity}টি)\n` +
      `পেমেন্ট: ${order.customer.paymentMethod === 'cod' ? 'ক্যাশ অন ডেলিভারি' : 'বিকাশ/নগদ'}\n` +
      `সর্বমোট বিল: ৳${order.totalAmount}\n\n` +
      `অনুগ্রহ করে দ্রুত ডেলিভারি নিশ্চিত করুন। ধন্যবাদ!`
  );

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="relative bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-stone-200 overflow-hidden my-6">
        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-emerald-800 text-white p-5 text-center relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-emerald-200 hover:text-white p-1 rounded-full hover:bg-emerald-900/50 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2 backdrop-blur-sm border border-white/30">
            <CheckCircle2 className="w-8 h-8 text-amber-300" />
          </div>

          <h3 className="text-xl sm:text-2xl font-extrabold">
            আলহামদুলিল্লাহ! আপনার অর্ডারটি নিশ্চিত হয়েছে
          </h3>
          <p className="text-emerald-100 text-xs sm:text-sm mt-1">
            শীঘ্রই আমাদের কাস্টমার কেয়ার প্রতিনিধি আপনার সাথে ফোনে যোগাযোগ করবেন।
          </p>

          <div className="inline-block mt-3 bg-emerald-950/40 border border-emerald-400/30 px-3.5 py-1 rounded-full text-xs font-mono font-bold text-amber-300">
            অর্ডার আইডি: {order.orderId}
          </div>
        </div>

        {/* Invoice Body */}
        <div className="p-5 sm:p-6 space-y-5 text-stone-800 text-xs sm:text-sm">
          {/* Order Status Stepper */}
          <div className="bg-stone-50 p-3 rounded-xl border border-stone-200">
            <div className="flex items-center justify-between text-center text-[10px] sm:text-xs font-semibold">
              <div className="flex flex-col items-center text-emerald-700">
                <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center mb-1 text-[11px] font-bold">
                  ✓
                </div>
                <span>অর্ডার গৃহীত</span>
              </div>
              <div className="h-0.5 flex-1 bg-emerald-500 mx-1 mb-3"></div>
              <div className="flex flex-col items-center text-emerald-700">
                <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center mb-1 text-[11px] font-bold">
                  ২
                </div>
                <span>প্যাকেজিং</span>
              </div>
              <div className="h-0.5 flex-1 bg-stone-300 mx-1 mb-3"></div>
              <div className="flex flex-col items-center text-stone-400">
                <div className="w-6 h-6 rounded-full bg-stone-200 text-stone-600 flex items-center justify-center mb-1 text-[11px] font-bold">
                  ৩
                </div>
                <span>কুরিয়ারে হস্তান্তর</span>
              </div>
              <div className="h-0.5 flex-1 bg-stone-300 mx-1 mb-3"></div>
              <div className="flex flex-col items-center text-stone-400">
                <div className="w-6 h-6 rounded-full bg-stone-200 text-stone-600 flex items-center justify-center mb-1 text-[11px] font-bold">
                  ৪
                </div>
                <span>ডেলিভারি</span>
              </div>
            </div>
          </div>

          {/* Delivery Details */}
          <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-2">
            <h4 className="font-bold text-stone-900 flex items-center gap-1.5 text-xs uppercase tracking-wider text-emerald-800">
              <MapPin className="w-3.5 h-3.5" />
              <span>ডেলিভারি ঠিকানা ও গ্রাহক তথ্য</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-stone-500">গ্রাহকের নাম:</span>
                <p className="font-bold text-stone-900">{order.customer.fullName}</p>
              </div>
              <div>
                <span className="text-stone-500">মোবাইল নম্বর:</span>
                <p className="font-mono font-bold text-stone-900">{order.customer.phone}</p>
              </div>
              <div className="sm:col-span-2">
                <span className="text-stone-500">পূর্ণ ঠিকানা:</span>
                <p className="font-medium text-stone-900">{order.customer.address}</p>
              </div>
              <div>
                <span className="text-stone-500">পেমেন্ট মেথড:</span>
                <p className="font-bold text-emerald-700">
                  {order.customer.paymentMethod === 'cod'
                    ? 'ক্যাশ অন ডেলিভারি (পণ্য পেয়ে টাকা)'
                    : `বিকাশ / নগদ (TrxID: ${order.customer.bkashTxId})`}
                </p>
              </div>
              <div>
                <span className="text-stone-500">আনুমানিক ডেলিভারি:</span>
                <p className="font-bold text-stone-900">
                  {order.customer.deliveryArea === 'dhaka'
                    ? '২৪ থেকে ৪৮ ঘণ্টার মধ্যে'
                    : '৪৮ থেকে ৭২ ঘণ্টার মধ্যে'}
                </p>
              </div>
            </div>
          </div>

          {/* Items & Financial Table */}
          <div className="border border-stone-200 rounded-xl overflow-hidden">
            <div className="bg-stone-100 px-3 py-2 font-bold text-xs text-stone-700 flex justify-between">
              <span>পণ্য বিবরণ</span>
              <span>মূল্য</span>
            </div>
            <div className="p-3 divide-y divide-stone-100">
              <div className="py-2 flex justify-between items-center text-xs sm:text-sm">
                <div>
                  <span className="font-bold text-stone-900">{order.bundle.name}</span>
                  <p className="text-xs text-stone-500">
                    {order.bundle.weight} x {order.quantity} টি
                  </p>
                </div>
                <span className="font-bold text-stone-900">৳{order.itemSubtotal}</span>
              </div>

              <div className="py-2 flex justify-between items-center text-xs">
                <span className="text-stone-600">ডেলিভারি চার্জ</span>
                <span className="font-medium">
                  {order.deliveryCharge === 0 ? (
                    <span className="text-emerald-700 font-bold">ফ্রি (৳০)</span>
                  ) : (
                    `৳${order.deliveryCharge}`
                  )}
                </span>
              </div>

              {order.discount > 0 && (
                <div className="py-2 flex justify-between items-center text-xs text-rose-700">
                  <span>কুপন ছাড়</span>
                  <span className="font-bold">-৳{order.discount}</span>
                </div>
              )}

              <div className="py-2.5 flex justify-between items-center text-base font-extrabold text-stone-950 bg-stone-50 -mx-3 px-3">
                <span>সর্বমোট প্রদেয় টাকা</span>
                <span className="text-xl font-black text-emerald-800">
                  ৳{order.totalAmount}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2.5 pt-2">
            <a
              href={`https://wa.me/8801798241344?text=${whatsappMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-[#25D366] hover:bg-[#20ba59] text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-sm shadow-md transition-all cursor-pointer"
            >
              <MessageCircle className="w-5 h-5 fill-current" />
              <span>WhatsApp এ দ্রুত অর্ডার নিশ্চিত করুন</span>
            </a>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handlePrint}
                className="bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold py-2.5 px-3 rounded-xl border border-stone-300 flex items-center justify-center gap-1.5 text-xs transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4 text-stone-600" />
                <span>রসিদ প্রিন্ট করুন</span>
              </button>

              <button
                onClick={onClose}
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 text-xs transition-colors cursor-pointer"
              >
                <PackageCheck className="w-4 h-4" />
                <span>সম্পন্ন করুন</span>
              </button>
            </div>
          </div>

          {/* Hotline */}
          <div className="text-center text-xs text-stone-500 pt-2 border-t border-stone-100">
            যেকোনো প্রয়োজনে আমাদের হেল্পলাইনে কল করুন: <a href="tel:01798241344" className="font-bold text-stone-800 hover:underline">01798-241344</a>
          </div>
        </div>
      </div>
    </div>
  );
}
