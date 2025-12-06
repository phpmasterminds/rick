// OrderConfirmationPage.tsx - Order confirmation and receipt page
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  CheckCircle,
  Package,
  Clock,
  MapPin,
  Phone,
  Mail,
  DollarSign,
  Download,
  ArrowRight,
  Home,
  ShoppingBag,
} from 'lucide-react';
import { toast } from 'react-toastify';

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  unit: string;
  image?: string;
  dispensary_id: string;
  dispensary_name: string;
}

interface OrderData {
  orderId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  birthDate: string;
  stateLicense: string;
  items: OrderItem[];
  itemCount: number;
  subtotal: number;
  tax: number;
  total: number;
  createdAt: string;
  status: 'pending' | 'confirmed' | 'processing' | 'ready';
  pickupLocation?: string;
}

export default function OrderConfirmationPage() {
  const router = useRouter();
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPrinting, setIsPrinting] = useState(false);

  // ✅ Load order data from sessionStorage on page load
  useEffect(() => {
    try {
      const savedOrder = sessionStorage.getItem('last_order');
	  console.log(savedOrder);
      if (savedOrder) {
        const orderInfo = JSON.parse(savedOrder);
        setOrderData(orderInfo);

        // ✅ Clear cart after successful order
        localStorage.removeItem('cart');
        sessionStorage.removeItem('checkout_cart');
        sessionStorage.removeItem('last_order');

        toast.success('Order confirmed!', {
          position: 'bottom-right',
          autoClose: 3000,
        });
      } else {
        // No order found - redirect to home
        toast.error('No order found. Redirecting...');
        //setTimeout(() => router.push('/'), 2000);
      }
    } catch (error) {
      console.error('Error loading order:', error);
      toast.error('Error loading order information');
      setTimeout(() => router.push('/'), 2000);
    } finally {
      setLoading(false);
    }
  }, [router]);

  // ✅ Handle printing/downloading as PDF
  const handlePrintOrder = () => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 100);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-white to-teal-50">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-teal-100 flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Package className="w-8 h-8 text-teal-600" />
          </div>
          <p className="text-gray-600 font-medium">Loading your order...</p>
        </div>
      </div>
    );
  }

  if (!orderData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-white to-teal-50 p-4">
        <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <ShoppingBag className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">No Order Found</h1>
          <p className="text-gray-600 mb-6">
            We couldn't find your order information. Please try placing a new order.
          </p>
          <Link
            href="/dispensary"
            className="inline-block bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  // ✅ Group items by dispensary
  const groupedByDispensary = orderData.items.reduce(
    (acc, item) => {
      const dispensary = item.dispensary_name;
      if (!acc[dispensary]) {
        acc[dispensary] = [];
      }
      acc[dispensary].push(item);
      return acc;
    },
    {} as Record<string, OrderItem[]>
  );

  const orderDate = new Date(orderData.createdAt);
  const formattedDate = orderDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const formattedTime = orderDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* ✅ Success Header */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Order Confirmed!</h1>
          <p className="text-lg text-gray-600 mb-4">
            Thank you for your purchase
          </p>
          <p className="text-sm text-gray-500">
            Order ID: <span className="font-mono font-bold text-teal-600">{orderData.orderId}</span>
          </p>
        </div>

        {/* ✅ Order Summary Card */}
        <div className="bg-white rounded-xl shadow-lg mb-8 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-teal-600 to-teal-700 px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">Order Summary</h2>
                <p className="text-teal-100 text-sm">
                  {formattedDate} at {formattedTime}
                </p>
              </div>
              <div className="bg-white/20 px-4 py-2 rounded-lg">
                <p className="text-white font-semibold text-lg">
                  ${orderData.total.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            {/* Pickup Information */}
            <div className="mb-8 pb-8 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-teal-600" />
                Pickup Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Name</p>
                  <p className="text-gray-900 font-semibold">
                    {orderData.firstName} {orderData.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Email</p>
                  <p className="text-gray-900 font-semibold break-all">
                    {orderData.email}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Phone</p>
                  <p className="text-gray-900 font-semibold">{orderData.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">State License</p>
                  <p className="text-gray-900 font-semibold">{orderData.stateLicense}</p>
                </div>
              </div>
            </div>

            {/* Status Information */}
            <div className="mb-8 pb-8 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                Order Status
              </h3>
              <div className="flex items-center gap-4 mb-4">
                <div className={`px-4 py-2 rounded-full font-semibold text-white ${
                  orderData.status === 'confirmed' ? 'bg-green-600' :
                  orderData.status === 'processing' ? 'bg-blue-600' :
                  orderData.status === 'ready' ? 'bg-teal-600' :
                  'bg-yellow-600'
                }`}>
                  {orderData.status.charAt(0).toUpperCase() + orderData.status.slice(1)}
                </div>
              </div>
              <p className="text-gray-600 text-sm">
                Your order has been confirmed. You will receive an email notification at {orderData.email} when it's ready for pickup.
              </p>
            </div>

            {/* Items by Dispensary */}
            <div className="mb-8">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Package className="w-5 h-5 text-purple-600" />
                Your Items
              </h3>

              {Object.entries(groupedByDispensary).map(([dispensary, items]) => (
                <div key={dispensary} className="mb-6 last:mb-0">
                  <div className="bg-gray-50 p-4 rounded-lg mb-3 border border-gray-200">
                    <h4 className="font-bold text-gray-900">{dispensary}</h4>
                    <p className="text-sm text-gray-600">
                      {items.length} item{items.length !== 1 ? 's' : ''}
                    </p>
                  </div>

                  <div className="space-y-3">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-start gap-4 p-3 bg-white border border-gray-200 rounded-lg"
                      >
                        {/* Item Image */}
                        {item.image && (
                          <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}

                        {/* Item Details */}
                        <div className="flex-1">
                          <h5 className="font-semibold text-gray-900">{item.name}</h5>
                          <p className="text-sm text-gray-600">
                            {item.quantity} × {item.unit}
                          </p>
                        </div>

                        {/* Item Price */}
                        <div className="text-right flex-shrink-0">
                          <p className="font-bold text-gray-900">
                            ${(item.price * item.quantity).toFixed(2)}
                          </p>
                          <p className="text-xs text-gray-600">
                            ${item.price.toFixed(2)} each
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Pricing Summary */}
            <div className="bg-gradient-to-br from-slate-50 to-gray-50 rounded-lg p-6 border border-gray-200">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-700">Subtotal ({orderData.itemCount} items)</span>
                  <span className="font-semibold text-gray-900">
                    ${orderData.subtotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Tax (4.5%)</span>
                  <span className="font-semibold text-gray-900">
                    ${orderData.tax.toFixed(2)}
                  </span>
                </div>
                <div className="border-t border-gray-300 pt-3 flex justify-between">
                  <span className="text-lg font-bold text-gray-900">Total</span>
                  <span className="text-2xl font-bold text-teal-600">
                    ${orderData.total.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ✅ Payment Note */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h3 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Payment
          </h3>
          <p className="text-blue-800 text-sm">
            Payment will be collected at pickup. Please bring a valid form of payment and your state ID.
          </p>
        </div>

        {/* ✅ What's Next */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6">What's Next?</h3>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-teal-100">
                  <span className="text-teal-600 font-bold">1</span>
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Confirmation Email</h4>
                <p className="text-gray-600 text-sm">
                  You'll receive a confirmation email at {orderData.email} shortly.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-teal-100">
                  <span className="text-teal-600 font-bold">2</span>
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Preparation</h4>
                <p className="text-gray-600 text-sm">
                  Your order will be prepared and you'll receive a notification when it's ready.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-teal-100">
                  <span className="text-teal-600 font-bold">3</span>
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Pickup</h4>
                <p className="text-gray-600 text-sm">
                  Visit the dispensary during business hours to complete your purchase and pick up your order.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ✅ Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={handlePrintOrder}
            disabled={isPrinting}
            className="flex-1 bg-slate-600 hover:bg-slate-700 disabled:bg-slate-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Download className="w-5 h-5" />
            {isPrinting ? 'Printing...' : 'Print Receipt'}
          </button>

          <Link
            href="/"
            className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Home className="w-5 h-5" />
            Back to Home
          </Link>

          <Link
            href="/dispensary"
            className="flex-1 bg-white hover:bg-gray-50 border-2 border-teal-600 text-teal-600 font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <ShoppingBag className="w-5 h-5" />
            Continue Shopping
          </Link>
        </div>

        {/* ✅ Contact Information */}
        <div className="bg-white rounded-xl shadow-lg p-8 mt-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Need Help?</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex gap-4">
              <Phone className="w-5 h-5 text-teal-600 flex-shrink-0 mt-1" />
              <div>
                <p className="font-semibold text-gray-900">Call Us</p>
                <p className="text-gray-600 text-sm">Available during business hours</p>
              </div>
            </div>

            <div className="flex gap-4">
              <Mail className="w-5 h-5 text-teal-600 flex-shrink-0 mt-1" />
              <div>
                <p className="font-semibold text-gray-900">Email Support</p>
                <p className="text-gray-600 text-sm">support@nature-high.com</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ✅ Print Styles */}
      <style>{`
        @media print {
          body {
            background: white;
          }
          .no-print {
            display: none;
          }
          .print-only {
            display: block;
          }
          .bg-gradient-to-br,
          .bg-gradient-to-r {
            background: white !important;
            border: 1px solid #e5e7eb;
          }
          .shadow-lg,
          .shadow-xl {
            box-shadow: none !important;
            border: 1px solid #e5e7eb;
          }
        }
      `}</style>
    </div>
  );
}