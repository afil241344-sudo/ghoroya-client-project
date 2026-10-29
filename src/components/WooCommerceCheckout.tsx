import { useState, useId, useEffect } from 'react';
import { ShieldCheck, Truck, Lock, CheckCircle2, ShoppingBag, Tag, AlertCircle, Image as ImageIcon } from 'lucide-react';
import { DBCoupon, ShemaiBundle, OrderFormData, PlacedOrder } from '../types';
import {
  fetchActiveCoupons,
  fetchDeliverySettings,
  InsufficientStockError,
  saveOrderToSupabase,
  StoreDeliverySettings,
} from '../services/dbService';

interface WooCommerceCheckoutProps {
  bundles: ShemaiBundle[];
  selectedBundleId: string;
  onSelectBundle: (bundleId: string) => void;
  onOrderSuccess: (order: PlacedOrder) => void;
}

export default function WooCommerceCheckout({
  bundles,
  selectedBundleId,
  onSelectBundle,
  onOrderSuccess,
}: WooCommerceCheckoutProps) {
  const formId = useId();
  const currentBundle =
    bundles.find((b) => b.id === selectedBundleId) || bundles[0];
  const availableStock = currentBundle?.stockCount;
  const isOutOfStock = !currentBundle || currentBundle.inStock === false || availableStock === 0;

  const [quantity, setQuantity] = useState(1);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [deliveryArea, setDeliveryArea] = useState<'dhaka' | 'outside_dhaka'>('dhaka');
  const [note, setNote] = useState('');
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [activeCoupons, setActiveCoupons] = useState<DBCoupon[]>([]);
  const [couponLoadError, setCouponLoadError] = useState<string | null>(null);
  const [isLoadingCoupons, setIsLoadingCoupons] = useState(true);
  const [deliverySettings, setDeliverySettings] = useState<StoreDeliverySettings | null>(null);
  const [deliverySettingsError, setDeliverySettingsError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const exceedsAvailableStock = availableStock !== undefined && quantity > availableStock;

  useEffect(() => {
    setQuantity(1);
    setSubmissionError(null);
  }, [currentBundle?.id]);

  useEffect(() => {
    if (availableStock !== undefined && availableStock > 0) {
      setQuantity((currentQuantity) => Math.min(currentQuantity, availableStock));
    }
  }, [availableStock]);

  useEffect(() => {
    let active = true;
    fetchActiveCoupons()
      .then((coupons) => {
        if (active) setActiveCoupons(coupons);
      })
      .catch((error: unknown) => {
        console.error('Could not load active coupons:', error);
        if (active) setCouponLoadError('কুপন সিস্টেম লোড হয়নি। অনুগ্রহ করে পরে আবার চেষ্টা করুন।');
      })
      .finally(() => {
        if (active) setIsLoadingCoupons(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    fetchDeliverySettings()
      .then((settings) => {
        if (active) setDeliverySettings(settings);
      })
      .catch((error: unknown) => {
        console.error('Could not load delivery settings:', error);
        if (active) {
          setDeliverySettingsError('ডেলিভারি চার্জ লোড করা যায়নি। অর্ডার করতে পেজ রিফ্রেশ করুন।');
        }
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!appliedCoupon) return;
    const coupon = activeCoupons.find((item) => item.code === appliedCoupon && item.isActive);
    if (!coupon) {
      setAppliedCoupon(null);
      return;
    }
    if (quantity < coupon.minQuantity) {
      setAppliedCoupon(null);
      setCouponError(`এই কুপনটি ব্যবহার করতে কমপক্ষে ${coupon.minQuantity} টি পণ্য লাগবে`);
    }
  }, [activeCoupons, appliedCoupon, quantity]);

  // Price calculations
  const itemSubtotal = (currentBundle?.salePrice ?? 0) * quantity;
  const selectedCoupon = activeCoupons.find(
    (coupon) => coupon.code === appliedCoupon && coupon.isActive && quantity >= coupon.minQuantity,
  );
  const isFreeShippingCoupon = selectedCoupon?.discountType === 'free_shipping';
  const deliveryCharge =
    currentBundle?.freeDelivery || isFreeShippingCoupon
      ? 0
      : deliveryArea === 'dhaka'
        ? deliverySettings?.dhakaDeliveryFee ?? 0
        : deliverySettings?.outsideDhakaDeliveryFee ?? 0;
  const discount = selectedCoupon?.discountType === 'fixed'
    ? Math.min(selectedCoupon.discountAmount, itemSubtotal)
    : 0;

  const totalAmount = Math.max(0, itemSubtotal + deliveryCharge - discount);

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError(null);
    const cleaned = couponInput.trim().toUpperCase();

    if (!cleaned) {
      setCouponError('অনুগ্রহ করে একটি কুপন কোড লিখুন');
      return;
    }

    if (couponLoadError) {
      return;
    }
    if (isLoadingCoupons) return;

    const coupon = activeCoupons.find((item) => item.code === cleaned && item.isActive);
    if (!coupon) {
      setCouponError('কুপন কোডটি সঠিক নয় বা মেয়াদ শেষ হয়ে গেছে');
      return;
    }

    if (quantity < coupon.minQuantity) {
      setCouponError(`এই কুপনটি পেতে কমপক্ষে ${coupon.minQuantity} টি পণ্য অর্ডার করুন`);
      return;
    }

    setAppliedCoupon(coupon.code);
    setCouponInput('');
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponError(null);
  };

  const validateForm = () => {
    const errors: { [key: string]: string } = {};

    if (!fullName.trim()) {
      errors.fullName = 'অনুগ্রহ করে আপনার পুরো নাম লিখুন';
    }

    const cleanPhone = phone.replace(/[\s-]/g, '');
    const phoneRegex = /^01[3-9]\d{8}$/;
    if (!cleanPhone) {
      errors.phone = 'অনুগ্রহ করে আপনার সচল মোবাইল নাম্বার দিন';
    } else if (!phoneRegex.test(cleanPhone)) {
      errors.phone = 'সঠিক ১১ ডিজিটের মোবাইল নাম্বার দিন (যেমন: 017XXXXXXXX)';
    }

    if (!address.trim()) {
      errors.address = 'অনুগ্রহ করে আপনার বিস্তারিত ঠিকানা লিখুন (বাসা, রোড, থানা, জেলা)';
    } else if (address.trim().length < 8) {
      errors.address = 'ঠিকানাটি আরেকটু বিস্তারিত লিখুন যাতে কুরিয়ার সহজে পৌঁছাতে পারে';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBundle) {
      setSubmissionError('অর্ডার করতে আগে প্রোডাক্ট তালিকা থেকে একটি পণ্য নির্বাচন করুন।');
      return;
    }
    if (!deliverySettings) {
      setSubmissionError(
        deliverySettingsError || 'ডেলিভারি চার্জ লোড হচ্ছে। কিছুক্ষণ পরে আবার চেষ্টা করুন।',
      );
      return;
    }
    if (isOutOfStock) {
      setSubmissionError('দুঃখিত, এই পণ্যটি বর্তমানে স্টকে নেই।');
      return;
    }
    if (exceedsAvailableStock) {
      setSubmissionError(`এই পণ্যের স্টক ${availableStock} টি। অনুগ্রহ করে পরিমাণ কমিয়ে আবার চেষ্টা করুন।`);
      return;
    }
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmissionError(null);
    try {
      const orderData: OrderFormData = {
        fullName: fullName.trim(),
        phone: phone.trim(),
        address: address.trim(),
        deliveryArea,
        note: note.trim() || undefined,
        paymentMethod: 'cod',
        bundleId: currentBundle.id,
        quantity,
        couponCode: appliedCoupon || undefined,
      };

      const placedOrder: PlacedOrder = {
        orderId: `LCH-${Math.floor(100000 + Math.random() * 900000)}`,
        orderDate: new Date().toLocaleString('bn-BD', {
          dateStyle: 'medium',
          timeStyle: 'short',
        }),
        customer: orderData,
        bundle: currentBundle,
        quantity,
        itemSubtotal,
        deliveryCharge,
        discount,
        totalAmount,
        status: 'confirmed',
      };

      const savedOrder = await saveOrderToSupabase(placedOrder);
      onOrderSuccess({
        ...placedOrder,
        itemSubtotal: savedOrder.itemSubtotal,
        deliveryCharge: savedOrder.deliveryCharge,
        discount: savedOrder.discount,
        totalAmount: savedOrder.totalAmount,
      });
    } catch (error) {
      console.error('Supabase order save failed:', error);
      window.dispatchEvent(new Event('inventory-updated'));
      if (error instanceof Error && error.message.includes('কুপনটি আর কার্যকর নেই')) {
        setAppliedCoupon(null);
        setCouponError(error.message);
      }
      setSubmissionError(
        error instanceof InsufficientStockError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'অর্ডার সংরক্ষণ করা যায়নি। আবার চেষ্টা করুন।',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!currentBundle) {
    return (
      <section id="checkout-section" className="scroll-mt-24 border-b border-amber-900/10 bg-[#f7f4ec] py-12 sm:py-16">
        <div className="mx-auto max-w-3xl px-4">
          <div className="rounded-2xl border border-stone-200 bg-white p-6 text-center shadow-sm sm:p-10">
            <ShoppingBag className="mx-auto h-10 w-10 text-stone-400" />
            <h2 className="mt-3 text-xl font-extrabold text-stone-900">অর্ডার করতে একটি পণ্য নির্বাচন করুন</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm text-stone-600">
              এখনো কোনো পণ্য বা কম্বো অর্ডারের জন্য নির্বাচিত নেই। প্রোডাক্ট তালিকায় পণ্য পাওয়া গেলে সেখানে থেকে বেছে নিন।
            </p>
            <button
              type="button"
              onClick={() => document.getElementById('product-carousel-section')?.scrollIntoView({ behavior: 'smooth' })}
              className="mt-5 rounded-lg bg-emerald-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-800"
            >
              প্রোডাক্ট দেখুন
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="checkout-section" className="scroll-mt-24 py-12 sm:py-16 bg-[#f7f4ec] border-b border-amber-900/10">
      <div className="max-w-6xl mx-auto px-4">
        {/* Checkout Header Banner */}
        <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-emerald-800 text-white p-5 rounded-2xl shadow-md mb-8 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-4 border border-emerald-600/40">
          <div>
            <div className="inline-flex items-center gap-2 bg-emerald-950/40 text-amber-300 text-xs font-bold px-3 py-1 rounded-full mb-1 border border-emerald-500/30">
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>১-পেজ এক্সপ্রেস চেকআউট (WordPress & WooCommerce Style)</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
              অর্ডার করতে নিচের তথ্যগুলো দিয়ে সম্পূর্ণ করুন
            </h2>
            <p className="text-emerald-100 text-xs sm:text-sm mt-0.5">
              কোনো অগ্রিম পেমেন্টের ঝামেলা নেই — পণ্য হাতে পেয়ে চেক করে টাকা দিন!
            </p>
          </div>

          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3.5 py-2 rounded-xl border border-white/20 text-xs text-amber-200">
            <ShieldCheck className="w-4 h-4 text-amber-300 shrink-0" />
            <span className="font-semibold">১০০% নিরাপদ ডেলিভারি</span>
          </div>
        </div>

        <form id="checkout-form" onSubmit={handleSubmitOrder}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left 7 Columns: Billing & Delivery Details */}
            <div className="lg:col-span-7 bg-white p-5 sm:p-7 rounded-2xl shadow-sm border border-stone-200">
              <div className="flex items-center justify-between border-b border-stone-200 pb-3 mb-5">
                <h3 className="text-lg font-bold text-stone-900 flex items-center gap-2">
                  <span className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-sm font-extrabold">
                    ১
                  </span>
                  <span>ডেলিভারি ও যোগাযোগের ঠিকানা</span>
                </h3>
                <span className="text-xs text-rose-600 font-semibold">* আবশ্যক</span>
              </div>

              <div className="space-y-4">
                {/* Full Name */}
                <div>
                  <label htmlFor={`${formId}-name`} className="block text-xs sm:text-sm font-bold text-stone-800 mb-1">
                    আপনার নাম <span className="text-rose-600">*</span>
                  </label>
                  <input
                    id={`${formId}-name`}
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="যেমন: মোঃ আশিকুর রহমান"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm sm:text-base transition-colors focus:outline-none focus:ring-2 ${
                      formErrors.fullName
                        ? 'border-rose-500 focus:ring-rose-200 bg-rose-50/20'
                        : 'border-stone-300 focus:border-emerald-600 focus:ring-emerald-100 bg-white'
                    }`}
                  />
                  {formErrors.fullName && (
                    <p className="text-xs text-rose-600 mt-1 flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {formErrors.fullName}
                    </p>
                  )}
                </div>

                {/* Mobile Phone */}
                <div>
                  <label htmlFor={`${formId}-phone`} className="block text-xs sm:text-sm font-bold text-stone-800 mb-1">
                    মোবাইল নাম্বার <span className="text-rose-600">*</span>
                  </label>
                  <input
                    id={`${formId}-phone`}
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="যেমন: 01712345678"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm sm:text-base font-mono transition-colors focus:outline-none focus:ring-2 ${
                      formErrors.phone
                        ? 'border-rose-500 focus:ring-rose-200 bg-rose-50/20'
                        : 'border-stone-300 focus:border-emerald-600 focus:ring-emerald-100 bg-white'
                    }`}
                  />
                  <p className="text-[11px] text-stone-500 mt-1">
                    ডেলিভারির সময় এই নাম্বারে কল করে নিশ্চিত করা হবে।
                  </p>
                  {formErrors.phone && (
                    <p className="text-xs text-rose-600 mt-1 flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {formErrors.phone}
                    </p>
                  )}
                </div>

                {/* Delivery Area Selection */}
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-stone-800 mb-2">
                    ডেলিভারি এরিয়া নির্বাচন করুন <span className="text-rose-600">*</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label
                      className={`flex items-center justify-between p-3 rounded-xl border-2 cursor-pointer transition-all ${
                        deliveryArea === 'dhaka'
                          ? 'border-emerald-600 bg-emerald-50/60 font-bold text-emerald-950'
                          : 'border-stone-200 hover:border-stone-300 bg-white text-stone-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="deliveryArea"
                          checked={deliveryArea === 'dhaka'}
                          onChange={() => setDeliveryArea('dhaka')}
                          className="accent-emerald-600 w-4 h-4"
                        />
                        <span className="text-xs sm:text-sm">ঢাকার ভেতরে</span>
                      </div>
                      <span className="text-xs font-bold bg-white px-2 py-0.5 rounded shadow-xs border border-stone-200">
                        {currentBundle.freeDelivery || isFreeShippingCoupon
                          ? 'ফ্রি'
                          : deliverySettings
                            ? `৳${deliverySettings.dhakaDeliveryFee.toLocaleString()}`
                            : 'লোড হচ্ছে...'}
                      </span>
                    </label>

                    <label
                      className={`flex items-center justify-between p-3 rounded-xl border-2 cursor-pointer transition-all ${
                        deliveryArea === 'outside_dhaka'
                          ? 'border-emerald-600 bg-emerald-50/60 font-bold text-emerald-950'
                          : 'border-stone-200 hover:border-stone-300 bg-white text-stone-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="deliveryArea"
                          checked={deliveryArea === 'outside_dhaka'}
                          onChange={() => setDeliveryArea('outside_dhaka')}
                          className="accent-emerald-600 w-4 h-4"
                        />
                        <span className="text-xs sm:text-sm">ঢাকার বাইরে (সারাদেশ)</span>
                      </div>
                      <span className="text-xs font-bold bg-white px-2 py-0.5 rounded shadow-xs border border-stone-200">
                        {currentBundle.freeDelivery || isFreeShippingCoupon
                          ? 'ফ্রি'
                          : deliverySettings
                            ? `৳${deliverySettings.outsideDhakaDeliveryFee.toLocaleString()}`
                            : 'লোড হচ্ছে...'}
                      </span>
                    </label>
                  </div>
                </div>

                {/* Detailed Address */}
                <div>
                  <label htmlFor={`${formId}-address`} className="block text-xs sm:text-sm font-bold text-stone-800 mb-1">
                    সম্পূর্ণ ঠিকানা <span className="text-rose-600">*</span>
                  </label>
                  <textarea
                    id={`${formId}-address`}
                    rows={3}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="যেমন: বাসা নং ১২, রোড নং ৫, ব্লক-বি, মিরপুর-১১, ঢাকা"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm sm:text-base transition-colors focus:outline-none focus:ring-2 ${
                      formErrors.address
                        ? 'border-rose-500 focus:ring-rose-200 bg-rose-50/20'
                        : 'border-stone-300 focus:border-emerald-600 focus:ring-emerald-100 bg-white'
                    }`}
                  ></textarea>
                  {formErrors.address && (
                    <p className="text-xs text-rose-600 mt-1 flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {formErrors.address}
                    </p>
                  )}
                </div>

                {/* Optional Note */}
                <div>
                  <label htmlFor={`${formId}-note`} className="block text-xs font-semibold text-stone-600 mb-1">
                    অতিরিক্ত নির্দেশনা (যদি থাকে)
                  </label>
                  <input
                    id={`${formId}-note`}
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="যেমন: সকাল ১০টার পর ডেলিভারি করবেন"
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 text-xs sm:text-sm bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Right 5 Columns: WooCommerce Order Review & Payment Selection */}
            <div className="lg:col-span-5 space-y-5">
              {/* WooCommerce Order Review Card */}
              <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-stone-200">
                <div className="flex items-center justify-between border-b border-stone-200 pb-3 mb-4">
                  <h3 className="text-lg font-bold text-stone-900 flex items-center gap-2">
                    <span className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-sm font-extrabold">
                      ২
                    </span>
                    <span>আপনার অর্ডার সারাংশ</span>
                  </h3>
                  <span className="text-xs text-stone-500">কার্ট রিভিউ</span>
                </div>

                {/* Selected Bundle Quick Dropdown/Switcher */}
                <div className="mb-4">
                  <label className="block text-xs font-bold text-stone-700 mb-1.5">
                    নির্বাচিত প্যাকেজ পরিবর্তন করতে পারেন:
                  </label>
                  <select
                    value={selectedBundleId}
                    onChange={(e) => onSelectBundle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-[#fdfbf7] text-xs sm:text-sm font-semibold text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                  >
                    {bundles.map((b) => (
                      <option
                        key={b.id}
                        value={b.id}
                        disabled={b.inStock === false || b.stockCount === 0}
                      >
                        {b.name} — ৳{b.salePrice} ({b.weight})
                        {b.inStock === false || b.stockCount === 0 ? ' — স্টক শেষ' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Product Item Row */}
                <div className="flex items-center justify-between gap-3 p-3 bg-stone-50 rounded-xl border border-stone-200/80 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 border border-stone-200">
                      {currentBundle.imageUrl ? (
                        <img src={currentBundle.imageUrl} alt={currentBundle.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-stone-100 text-stone-400" aria-label="ছবি নেই">
                          <ImageIcon className="h-6 w-6" />
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-stone-900 text-xs sm:text-sm">
                        {currentBundle.name}
                      </h4>
                      <p className="text-xs text-stone-500">{currentBundle.weight}</p>
                      <span className="text-xs font-extrabold text-emerald-700">
                        ৳{currentBundle.salePrice}
                      </span>
                    </div>
                  </div>

                  {/* Quantity Controller */}
                  <div className="flex items-center border border-stone-300 rounded-lg bg-white overflow-hidden shadow-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setQuantity(Math.max(1, quantity - 1));
                        setSubmissionError(null);
                      }}
                      disabled={quantity <= 1 || isSubmitting}
                      className="px-2.5 py-1 text-stone-600 hover:bg-stone-100 font-bold text-sm cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label="পরিমাণ কমান"
                    >
                      -
                    </button>
                    <span className="px-3 py-1 font-bold text-xs sm:text-sm text-stone-900 border-x border-stone-200">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setQuantity((currentQuantity) => currentQuantity + 1);
                        setSubmissionError(null);
                      }}
                      disabled={
                        isSubmitting ||
                        isOutOfStock ||
                        (availableStock !== undefined && quantity >= availableStock)
                      }
                      className="px-2.5 py-1 text-stone-600 hover:bg-stone-100 font-bold text-sm cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label="পরিমাণ বাড়ান"
                    >
                      +
                    </button>
                  </div>
                </div>
                <p className={`-mt-2 mb-4 text-right text-xs font-semibold ${
                  isOutOfStock ? 'text-rose-700' : 'text-emerald-700'
                }`}>
                  {isOutOfStock
                    ? 'এই পণ্যটি বর্তমানে স্টকে নেই'
                    : availableStock !== undefined
                      ? `স্টকে আছে ${availableStock} টি`
                      : ''}
                </p>

                {/* Coupon Code Section */}
                <div className="mb-4">
                  {appliedCoupon ? (
                    <div className="flex items-center justify-between bg-emerald-50 text-emerald-900 p-2.5 rounded-xl border border-emerald-200 text-xs font-medium">
                      <div className="flex items-center gap-1.5">
                        <Tag className="w-4 h-4 text-emerald-600" />
                        <span>
                          কুপন <strong>{appliedCoupon}</strong> সক্রিয়!
                          {selectedCoupon?.discountType === 'fixed'
                            ? ` — ৳${discount} ছাড়`
                            : ' — ফ্রি ডেলিভারি'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={removeCoupon}
                        className="text-rose-600 hover:text-rose-800 font-bold underline cursor-pointer"
                      >
                        মুছুন
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={couponInput}
                          onChange={(e) => setCouponInput(e.target.value)}
                          placeholder="আপনার কুপন কোড লিখুন"
                          className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-stone-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 uppercase"
                        />
                        <button
                          type="button"
                          onClick={handleApplyCoupon}
                          disabled={isLoadingCoupons}
                          className="bg-stone-800 hover:bg-stone-900 text-white text-xs font-bold px-3 py-1.5 rounded-lg cursor-pointer disabled:cursor-wait disabled:opacity-50"
                        >
                          {isLoadingCoupons ? 'লোড হচ্ছে...' : 'এপ্লাই'}
                        </button>
                      </div>
                      {couponError && (
                        <p className="text-[11px] text-rose-600 mt-1">{couponError}</p>
                      )}
                      {couponLoadError && (
                        <p className="text-[11px] text-rose-600 mt-1">{couponLoadError}</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Financial Summary Table */}
                <div className="space-y-2 border-t border-stone-200 pt-3 text-xs sm:text-sm text-stone-700">
                  <div className="flex justify-between">
                    <span>প্রোডাক্ট সাবটোটাল ({quantity}x)</span>
                    <span className="font-semibold text-stone-900">৳{itemSubtotal}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="flex items-center gap-1">
                      <Truck className="w-3.5 h-3.5 text-stone-500" />
                      <span>ডেলিভারি চার্জ ({deliveryArea === 'dhaka' ? 'ঢাকা' : 'ঢাকার বাইরে'})</span>
                    </span>
                    <span className="font-semibold text-stone-900">
                      {deliveryCharge === 0 ? (
                        <span className="text-emerald-700 font-bold">ফ্রি (৳০)</span>
                      ) : (
                        `৳${deliveryCharge}`
                      )}
                    </span>
                  </div>

                  {discount > 0 && (
                    <div className="flex justify-between text-rose-700 font-semibold">
                      <span>কুপন ছাড়</span>
                      <span>-৳{discount}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-baseline border-t-2 border-stone-900/10 pt-3 text-base sm:text-lg font-extrabold text-stone-950">
                    <span>সর্বমোট প্রদেয় টাকা</span>
                    <span className="text-2xl sm:text-3xl font-black text-emerald-800">
                      ৳{totalAmount}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Method Selector (WooCommerce Style) */}
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-stone-200">
                <h4 className="text-sm font-bold text-stone-900 mb-3 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-emerald-600" />
                  <span>পেমেন্ট পদ্ধতি</span>
                </h4>

                <div className="space-y-2.5">
                  <label
                    className="block p-3 rounded-xl border-2 border-emerald-600 bg-emerald-50/50"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="paymentMethod"
                          defaultChecked
                          readOnly
                          className="accent-emerald-600 w-4 h-4"
                        />
                        <span className="text-xs sm:text-sm font-bold text-stone-900">
                          ক্যাশ অন ডেলিভারি (Cash on Delivery)
                        </span>
                      </div>
                      <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                        জনপ্রিয়
                      </span>
                    </div>
                    <p className="mt-2 text-[11px] text-stone-600 pl-6 leading-relaxed">
                      পণ্য হাতে পেয়ে চেক করে ডেলিভারি ম্যানের কাছে মূল্য পরিশোধ করুন। কোনো অগ্রিম টাকা লাগবে না।
                    </p>
                  </label>
                </div>

                {/* Big Order Submit Button */}
                {submissionError && (
                  <p role="alert" className="mt-4 rounded-lg bg-rose-50 p-3 text-xs text-rose-700">
                    অর্ডারটি সংরক্ষণ করা যায়নি: {submissionError}
                  </p>
                )}
                {deliverySettingsError && (
                  <p role="alert" className="mt-4 rounded-lg bg-rose-50 p-3 text-xs text-rose-700">
                    {deliverySettingsError}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={isSubmitting || !deliverySettings || isOutOfStock || exceedsAvailableStock}
                  className="w-full mt-5 bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-700 hover:to-rose-700 text-white font-extrabold text-base sm:text-lg py-4 px-6 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 transform active:scale-98 flex items-center justify-center gap-2 cursor-pointer border border-red-400/40"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>অর্ডার প্রসেস হচ্ছে...</span>
                    </div>
                  ) : (
                    <>
                      <CheckCircle2 className="w-6 h-6 text-amber-300" />
                      <span>অর্ডার কনফার্ম করুন (৳{totalAmount})</span>
                    </>
                  )}
                </button>

                {/* Security Guarantee */}
                <div className="mt-3 text-center text-[11px] text-stone-500 flex items-center justify-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>আপনার তথ্য ১০০% গোপনীয় ও সুরক্ষিত রাখা হয়</span>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </section>
  );
}
