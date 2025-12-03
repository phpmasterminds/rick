// CheckoutPage.tsx - Complete with Axios, Phone Verification & Place Order API
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import {
  ChevronDown,
  AlertCircle,
  CheckCircle,
  MapPin,
  CreditCard,
  ShoppingBag,
  Phone,
  Clock,
} from 'lucide-react';
import { toast } from 'react-toastify';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  unit: string;
  image?: string;
  dispensary_id: string;
  dispensary_name: string;
}

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  birthDate: string;
  stateLicense: string;
  phone: string;
  pickupTime: string;
  pickupMethod: 'in-store' | 'curbside';
  pickupInstructions: string;
  paymentMethod: 'cash' | 'debit';
}

interface FormErrors {
  [key: string]: string;
}

interface OrderData {
  orderId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  birthDate: string;
  stateLicense: string;
  pickupTime: string;
  pickupMethod: 'in-store' | 'curbside';
  pickupInstructions: string;
  paymentMethod: 'cash' | 'debit';
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  tax: number;
  total: number;
  createdAt: string;
  status: 'confirmed';
  pickupLocation?: string;
}

interface UserData {
  full_name: string;
  email: string;
  user_id: string;
  [key: string]: any;
}

interface VerificationState {
  step: 'phone-input' | 'code-verification';
  isVerified: boolean;
  loading: boolean;
  error: string;
}

const TAX_RATE = 0.045; // 4.5%

// ✅ Create axios instance with default config
const axiosInstance = axios.create({
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default function CheckoutPage() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    customer: true,      // Customer Information - OPEN by default
    pickup: false,       // Pickup Information - CLOSED by default
    payment: false,      // Payment Method - CLOSED by default
    review: false,       // Review Order - CLOSED by default
  });

  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    birthDate: '',
    stateLicense: '',
    phone: '',
    pickupTime: '',
    pickupMethod: 'curbside',
    pickupInstructions: '',
    paymentMethod: 'cash',
  });

  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [verification, setVerification] = useState<VerificationState>({
    step: 'phone-input',
    isVerified: false,
    loading: false,
    error: '',
  });
  const [verificationCode, setVerificationCode] = useState('');

  // ✅ Load cart and user data from localStorage
  useEffect(() => {
    try {
      const checkoutCart = sessionStorage.getItem('checkout_cart');
      const localCart = localStorage.getItem('cart');
      const cart = checkoutCart ? JSON.parse(checkoutCart) : JSON.parse(localCart || '[]');

      if (cart.length === 0) {
        toast.warning('Cart is empty. Redirecting...');
        setTimeout(() => router.push('/'), 2000);
        return;
      }

      setCartItems(cart);

      // ✅ Load user data from localStorage
      const userDataStr = localStorage.getItem('user');
      if (userDataStr) {
        const userData: UserData = JSON.parse(userDataStr);
        const nameParts = userData.data.full_name?.split(' ') || ['', ''];
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        setFormData((prev) => ({
          ...prev,
          firstName: firstName,
          lastName: lastName,
          email: userData.data.email || '',
        }));
      }
    } catch (error) {
      console.error('Error loading cart or user data:', error);
      toast.error('Error loading cart');
      router.push('/');
    } finally {
      setLoading(false);
    }
  }, [router]);

  // ✅ Calculate totals
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax;
  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  // ✅ Group cart items by dispensary
  const groupedByDispensary = cartItems.reduce(
    (acc, item) => {
      if (!acc[item.dispensary_name]) {
        acc[item.dispensary_name] = [];
      }
      acc[item.dispensary_name].push(item);
      return acc;
    },
    {} as Record<string, CartItem[]>
  );

  // ✅ Validate email
  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // ✅ Calculate age from birth date
  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }

    return age;
  };

  // ✅ Format US phone number to (XXX) XXX-XXXX
  const formatUSPhone = (value: string): string => {
    // Remove all non-digits
    const cleaned = value.replace(/\D/g, '');
    
    // Handle only US numbers (10 digits)
    if (cleaned.length === 0) return '';
    if (cleaned.length <= 3) return `(${cleaned}`;
    if (cleaned.length <= 6) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
  };

  // ✅ Validate US phone number (10 digits)
  const isValidPhone = (phone: string): boolean => {
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length === 10;
  };

  // ✅ Validate form
  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    if (!formData.firstName.trim()) errors.firstName = 'First name is required';
    if (!formData.lastName.trim()) errors.lastName = 'Last name is required';
    if (!formData.email.trim()) errors.email = 'Email is required';
    if (!isValidEmail(formData.email)) errors.email = 'Please enter a valid email address';
    if (!formData.birthDate) errors.birthDate = 'Birth date is required';
    else if (calculateAge(formData.birthDate) < 21) {
      errors.birthDate = 'You must be at least 21 years old';
    }
    if (!formData.stateLicense.trim()) errors.stateLicense = 'State license is required';
    if (!formData.phone.trim()) errors.phone = 'Phone number is required';
    else if (!isValidPhone(formData.phone)) errors.phone = 'Please enter a valid 10-digit US phone number';
    if (!formData.pickupTime.trim()) errors.pickupTime = 'Pickup time is required';
    if (!formData.pickupMethod) errors.pickupMethod = 'Please select a pickup method';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ✅ Send phone verification code using Axios
  const sendVerificationCode = async () => {
    if (!isValidPhone(formData.phone)) {
      setFormErrors((prev) => ({
        ...prev,
        phone: 'Please enter a valid phone number',
      }));
      return;
    }

    setVerification((prev) => ({ ...prev, loading: true, error: '' }));

    try {
      const response = await axiosInstance.post('/api/business/send-verification-code', {
        phone: formData.phone.replace(/\D/g, ''), // Send unformatted phone
      });

      if (response.status === 200 || response.status === 201) {
        toast.success('Verification code sent to your phone');
        setVerification((prev) => ({
          ...prev,
          step: 'code-verification',
          loading: false,
        }));
      }
    } catch (error) {
      console.error('Error sending verification code:', error);
      const errorMessage = 
        axios.isAxiosError(error) && error.response?.data?.message
          ? error.response.data.message
          : error instanceof Error 
          ? error.message
          : 'Failed to send verification code';
      
      setVerification((prev) => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      toast.error(errorMessage);
    }
  };

  // ✅ Verify phone code using Axios
  const verifyPhoneCode = async () => {
    if (!verificationCode.trim()) {
      setVerification((prev) => ({
        ...prev,
        error: 'Please enter the verification code',
      }));
      return;
    }

    setVerification((prev) => ({ ...prev, loading: true, error: '' }));

    try {
      const response = await axiosInstance.post('/api/business/verify-verification-code', {
        phone: formData.phone.replace(/\D/g, ''), // Send unformatted phone
        code: verificationCode,
      });

      if (response.status === 200 || response.status === 201) {
        setVerification((prev) => ({
          ...prev,
          isVerified: true,
          loading: false,
          step: 'code-verification',
        }));
        toast.success('Phone verified successfully');
      }
    } catch (error) {
      console.error('Error verifying code:', error);
      const errorMessage =
        axios.isAxiosError(error) && error.response?.data?.message
          ? error.response.data.message
          : error instanceof Error
          ? error.message
          : 'Failed to verify code';
      
      setVerification((prev) => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      toast.error(errorMessage);
    }
  };

  // ✅ Place order using Axios
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // ✅ Validate form first
    if (!validateForm()) {
      toast.error('Please fix the form errors above');
      return;
    }

    // ✅ Check phone verification
    if (!verification.isVerified) {
      toast.error('Please verify your phone number before placing the order');
      return;
    }

    setIsSubmitting(true);

    try {
      // ✅ Prepare order data
      const orderPayload = {
        customer: {
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          phone: formData.phone.replace(/\D/g, ''), // Send unformatted phone
          date_of_birth: formData.birthDate,
          state_license: formData.stateLicense,
        },
        pickup: {
          method: formData.pickupMethod, // 'in-store' or 'curbside'
          time: formData.pickupTime,
          instructions: formData.pickupInstructions,
        },
        payment: {
          method: formData.paymentMethod, // 'cash' or 'debit'
        },
        items: cartItems.map((item) => ({
          product_id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          unit: item.unit,
          dispensary_id: item.dispensary_id,
          dispensary_name: item.dispensary_name,
        })),
        order_summary: {
          item_count: itemCount,
          subtotal: subtotal,
          tax: tax,
          total: total,
        },
      };

      // ✅ Make API call to place order
      const response = await axiosInstance.post('/api/business/medicine-place-order', orderPayload);

      if (response.status === 200 || response.status === 201) {
        const responseData = response.data;
        const orderId = responseData.order_id || responseData.orderId || `ORD-${Date.now()}`;

        // ✅ Create order object for local storage
        const orderData: OrderData = {
          orderId: orderId,
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          birthDate: formData.birthDate,
          stateLicense: formData.stateLicense,
          pickupTime: formData.pickupTime,
          pickupMethod: formData.pickupMethod,
          pickupInstructions: formData.pickupInstructions,
          paymentMethod: formData.paymentMethod,
          items: cartItems,
          itemCount: itemCount,
          subtotal: subtotal,
          tax: tax,
          total: total,
          createdAt: new Date().toISOString(),
          status: 'confirmed',
          pickupLocation: 'Store Location',
        };

        // ✅ Save order to sessionStorage
        sessionStorage.setItem('last_order', JSON.stringify(orderData));

        // ✅ Clear cart
        localStorage.removeItem('cart');
        sessionStorage.removeItem('checkout_cart');

        // ✅ Show success message
        toast.success('Order placed successfully!', {
          position: 'bottom-right',
          autoClose: 3000,
        });

        // ✅ Redirect to confirmation page with order ID
        setTimeout(() => {
          router.push(`/order-confirmation?orderId=${orderId}`);
        }, 1000);
      }
    } catch (error) {
      console.error('Error placing order:', error);
      
      const errorMessage =
        axios.isAxiosError(error) && error.response?.data?.message
          ? error.response.data.message
          : error instanceof Error
          ? error.message
          : 'Failed to place order. Please try again.';

      toast.error(errorMessage);
      setIsSubmitting(false);
    }
  };

  // ✅ Handle input change with phone formatting
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Special handling for phone field - format it
    if (name === 'phone') {
      const formatted = formatUSPhone(value);
      setFormData((prev) => ({
        ...prev,
        [name]: formatted,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }

    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  // ✅ Toggle section
  const toggleSection = (section: 'customer' | 'pickup' | 'payment' | 'review') => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading checkout...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* ✅ Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Confirm Your Order</h1>
          <p className="text-gray-600">Complete your cannabis purchase safely and securely</p>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ✅ Main Form (2/3 width on desktop) */}
          <div className="lg:col-span-2 space-y-6">
            {/* ✅ Customer Information Section */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <button
                type="button"
                onClick={() => toggleSection('customer')}
                className="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <AlertCircle className="w-5 h-5 text-blue-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Customer Information</h2>
                </div>
                <ChevronDown
                  className={`w-5 h-5 text-gray-600 transition-transform ${
                    expandedSections.customer ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {expandedSections.customer && (
                <div className="px-6 pb-6 space-y-4 border-t border-gray-200">
                  {/* First Name & Last Name */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        First Name *
                      </label>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                          formErrors.firstName
                            ? 'border-red-500 focus:ring-red-500'
                            : 'border-gray-300 focus:ring-blue-500'
                        }`}
                        placeholder="John"
                      />
                      {formErrors.firstName && (
                        <p className="text-red-600 text-xs mt-1">{formErrors.firstName}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Last Name *
                      </label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                          formErrors.lastName
                            ? 'border-red-500 focus:ring-red-500'
                            : 'border-gray-300 focus:ring-blue-500'
                        }`}
                        placeholder="Doe"
                      />
                      {formErrors.lastName && (
                        <p className="text-red-600 text-xs mt-1">{formErrors.lastName}</p>
                      )}
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                        formErrors.email
                          ? 'border-red-500 focus:ring-red-500'
                          : 'border-gray-300 focus:ring-blue-500'
                      }`}
                      placeholder="john@example.com"
                    />
                    {formErrors.email && (
                      <p className="text-red-600 text-xs mt-1">{formErrors.email}</p>
                    )}
                  </div>

                  {/* Birth Date */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Date of Birth * (Must be 21+)
                    </label>
                    <input
                      type="date"
                      name="birthDate"
                      value={formData.birthDate}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                        formErrors.birthDate
                          ? 'border-red-500 focus:ring-red-500'
                          : 'border-gray-300 focus:ring-blue-500'
                      }`}
                    />
                    {formErrors.birthDate && (
                      <p className="text-red-600 text-xs mt-1">{formErrors.birthDate}</p>
                    )}
                  </div>

                  {/* State License */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      State License (ID) *
                    </label>
                    <input
                      type="text"
                      name="stateLicense"
                      value={formData.stateLicense}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                        formErrors.stateLicense
                          ? 'border-red-500 focus:ring-red-500'
                          : 'border-gray-300 focus:ring-blue-500'
                      }`}
                      placeholder="AB123456"
                    />
                    {formErrors.stateLicense && (
                      <p className="text-red-600 text-xs mt-1">{formErrors.stateLicense}</p>
                    )}
                  </div>

                  {/* Phone Number with Verification */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        Phone Number * (Required for verification)
                      </div>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        disabled={verification.isVerified}
                        className={`flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors disabled:bg-gray-100 ${
                          formErrors.phone
                            ? 'border-red-500 focus:ring-red-500'
                            : 'border-gray-300 focus:ring-blue-500'
                        }`}
                        placeholder="(123) 456-7890"
                      />
                      <button
                        type="button"
                        onClick={sendVerificationCode}
                        disabled={
                          verification.loading ||
                          verification.isVerified ||
                          !isValidPhone(formData.phone)
                        }
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-lg font-semibold transition-colors whitespace-nowrap"
                      >
                        {verification.loading
                          ? 'Sending...'
                          : verification.isVerified
                          ? '✓ Verified'
                          : 'Verify'}
                      </button>
                    </div>
                    {formErrors.phone && (
                      <p className="text-red-600 text-xs mt-1">{formErrors.phone}</p>
                    )}

                    {/* Phone Verification Step */}
                    {verification.step === 'code-verification' && !verification.isVerified && (
                      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-900 mb-3">
                          Enter the 6-digit code we sent to your phone
                        </p>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            maxLength={6}
                            value={verificationCode}
                            onChange={(e) => setVerificationCode(e.target.value.toUpperCase())}
                            placeholder="000000"
                            className="flex-1 px-4 py-2 border border-blue-300 rounded-lg text-center text-2xl tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <button
                            type="button"
                            onClick={verifyPhoneCode}
                            disabled={verification.loading || verificationCode.length !== 6}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white rounded-lg font-semibold transition-colors whitespace-nowrap"
                          >
                            {verification.loading ? 'Verifying...' : 'Verify'}
                          </button>
                        </div>
                        {verification.error && (
                          <div className="flex items-center gap-1 mt-2 text-red-600 text-xs">
                            <AlertCircle className="w-3 h-3" />
                            {verification.error}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* ✅ Pickup Information Section */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <button
                type="button"
                onClick={() => toggleSection('pickup')}
                className="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-green-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Pickup Information</h2>
                </div>
                <ChevronDown
                  className={`w-5 h-5 text-gray-600 transition-transform ${
                    expandedSections.pickup ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {expandedSections.pickup && (
                <div className="px-6 pb-6 space-y-4 border-t border-gray-200">
                  {/* Pickup Time */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Preferred Pickup Time *
                      </div>
                    </label>
                    <input
                      type="datetime-local"
                      name="pickupTime"
                      value={formData.pickupTime}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                        formErrors.pickupTime
                          ? 'border-red-500 focus:ring-red-500'
                          : 'border-gray-300 focus:ring-green-500'
                      }`}
                    />
                    {formErrors.pickupTime && (
                      <p className="text-red-600 text-xs mt-1">{formErrors.pickupTime}</p>
                    )}
                  </div>

                  {/* Pickup Method */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Pickup Method *
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center gap-3 p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors has-[:checked]:border-green-600 has-[:checked]:bg-green-50">
                        <input
                          type="radio"
                          name="pickupMethod"
                          value="in-store"
                          checked={formData.pickupMethod === 'in-store'}
                          onChange={handleInputChange}
                          className="w-4 h-4 text-green-600"
                        />
                        <div>
                          <p className="font-semibold text-gray-900">In-Store Pickup</p>
                          <p className="text-sm text-gray-600">Pick up your order inside the store</p>
                        </div>
                      </label>

                      <label className="flex items-center gap-3 p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors has-[:checked]:border-green-600 has-[:checked]:bg-green-50">
                        <input
                          type="radio"
                          name="pickupMethod"
                          value="curbside"
                          checked={formData.pickupMethod === 'curbside'}
                          onChange={handleInputChange}
                          className="w-4 h-4 text-green-600"
                        />
                        <div>
                          <p className="font-semibold text-gray-900">Curbside Pickup</p>
                          <p className="text-sm text-gray-600">We'll bring your order to your car</p>
                        </div>
                      </label>
                    </div>
                    {formErrors.pickupMethod && (
                      <p className="text-red-600 text-xs mt-1">{formErrors.pickupMethod}</p>
                    )}
                  </div>

                  {/* Pickup Instructions */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Special Pickup Instructions (Optional)
                    </label>
                    <textarea
                      name="pickupInstructions"
                      value={formData.pickupInstructions}
                      onChange={handleInputChange}
                      placeholder="E.g., Park in spot 5, I'm driving a blue sedan..."
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* ✅ Payment Method Section */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <button
                type="button"
                onClick={() => toggleSection('payment')}
                className="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-purple-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Payment Method</h2>
                </div>
                <ChevronDown
                  className={`w-5 h-5 text-gray-600 transition-transform ${
                    expandedSections.payment ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {expandedSections.payment && (
                <div className="px-6 pb-6 space-y-3 border-t border-gray-200">
                  <label className="flex items-center gap-3 p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors has-[:checked]:border-purple-600 has-[:checked]:bg-purple-50">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cash"
                      checked={formData.paymentMethod === 'cash'}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-purple-600"
                    />
                    <div>
                      <p className="font-semibold text-gray-900">Cash at Pickup</p>
                      <p className="text-sm text-gray-600">Pay with cash when you pick up your order</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors has-[:checked]:border-purple-600 has-[:checked]:bg-purple-50">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="debit"
                      checked={formData.paymentMethod === 'debit'}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-purple-600"
                    />
                    <div>
                      <p className="font-semibold text-gray-900">Debit Card</p>
                      <p className="text-sm text-gray-600">Pay with your debit card at pickup</p>
                    </div>
                  </label>
                </div>
              )}
            </div>

            {/* ✅ Review Order Section */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <button
                type="button"
                onClick={() => toggleSection('review')}
                className="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                    <ShoppingBag className="w-5 h-5 text-indigo-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Review Your Order</h2>
                </div>
                <ChevronDown
                  className={`w-5 h-5 text-gray-600 transition-transform ${
                    expandedSections.review ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {expandedSections.review && (
                <div className="px-6 pb-6 space-y-4 border-t border-gray-200">
                  {Object.entries(groupedByDispensary).map(([dispensary, items]) => (
                    <div key={dispensary} className="mb-4">
                      <h4 className="font-bold text-gray-900 mb-3 text-sm uppercase text-gray-600">
                        {dispensary}
                      </h4>
                      <div className="space-y-2">
                        {items.map((item) => (
                          <div key={item.id} className="flex items-center justify-between text-sm">
                            <div>
                              <p className="font-semibold text-gray-900">{item.name}</p>
                              <p className="text-gray-600">
                                {item.quantity} × {item.unit}
                              </p>
                            </div>
                            <p className="font-semibold text-gray-900">
                              ${(item.price * item.quantity).toFixed(2)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ✅ Sidebar (1/3 width on desktop) */}
          <div className="lg:col-span-1">
            {/* ✅ Order Summary - Sticky */}
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-24 lg:top-8">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Order Summary</h3>

              <div className="space-y-3 mb-6 pb-6 border-b border-gray-200">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-semibold text-gray-900">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax (4.5%)</span>
                  <span className="font-semibold text-gray-900">${tax.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex justify-between mb-6">
                <span className="text-lg font-bold text-gray-900">Total</span>
                <span className="text-2xl font-bold text-teal-600">${total.toFixed(2)}</span>
              </div>

              {/* Verification Status */}
              {!verification.isVerified && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-xs text-yellow-800">
                    ⚠️ Phone verification required before checkout
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting || !verification.isVerified}
                className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-colors flex items-center justify-center gap-2 ${
                  isSubmitting || !verification.isVerified
                    ? 'bg-teal-400 cursor-not-allowed'
                    : 'bg-teal-600 hover:bg-teal-700'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </>
                ) : !verification.isVerified ? (
                  <>
                    <AlertCircle className="w-5 h-5" />
                    Verify Phone First
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Place Order
                  </>
                )}
              </button>

              <Link
                href="/dispensary"
                className="block text-center text-teal-600 hover:text-teal-700 text-sm font-semibold mt-4 py-2 transition-colors"
              >
                Continue Shopping
              </Link>

              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900">
                By placing an order you agree to our Terms and Conditions. You also agree to receive automated SMS text message updates and product information notifications.
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}