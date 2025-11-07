'use client';

import React, { useEffect, useState } from 'react';
import {
  ArrowLeft, Loader2, AlertCircle, MoreVertical,
  MapPin, Calendar, DollarSign, Package, Phone, Mail, User, Truck, CreditCard, Check
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';
import Link from 'next/link';

// Order Status Mapping
const ORDER_STEPS: { [key: number]: string } = {
  1: 'New Order',
  2: 'Opened',
  3: 'Order Approved',
  4: 'Pending',
  5: 'Processing',
  6: 'Shipped',
  7: 'Canceled',
  8: 'Completed',
  9: 'POD',
};

const STATUS_BADGE_COLORS: { [key: string]: string } = {
  'New Order': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  'Opened': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  'Order Approved': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  'Pending': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  'Processing': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  'Shipped': 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  'Canceled': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  'Completed': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  'POD': 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
};

interface Order {
  order_id: string;
  full_name: string;
  account_name?: string;
  contact_email: string;
  contact_phone?: string;
  contact_address?: string;
  cart_total_cost: string;
  cart_cost: string;
  shipping_cost: string;
  order_time: string;
  order_status: string;
  total_cart_items?: string;
  sales_person_name?: string;
  total_commission?: string;
  order_notes?: string;
  to_address_detail_t_locs?: {
    locs_city?: string;
    locs_zip?: string;
    locs_street?: string;
    locs_phone?: string;
  };
}

interface OrderItem {
  item_id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  quantity: string | number;
  unit_price: string;
  total_price: string;
  product_image?: string;
}

interface OrderPayment {
  payment_id: string;
  order_id: string;
  amount: string;
  payment_date: string | number;
  payment_method: string;
  transaction_id: string;
  status: 'success' | 'pending' | 'failed';
}

interface PageContentProps {
  business: string;
  orderId: string;
}

export default function PageContent({ business, orderId }: PageContentProps) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'items' | 'payments' | 'shipping'>('details');
  
  // Items and Payments states
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [orderPayments, setOrderPayments] = useState<OrderPayment[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [totalPaid, setTotalPaid] = useState('0');
  const [balanceDue, setBalanceDue] = useState('0');

  const readableName = business.replace(/-/g, " ");

  // Fetch order details
  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        setError(null);
        
        let response = await axios.get(
          `/api/business/save-whole-sale-order/?business=${business}&order_id=${orderId}`
        );
        
        if (response.data?.data?.order) {
          setOrder(response.data.data.order);
        } else if (response.data?.data?.orders && response.data.data.orders.length > 0) {
          const foundOrder = response.data.data.orders.find((o: Order) => o.order_id === orderId);
          if (foundOrder) {
            setOrder(foundOrder);
          } else {
            setError('Order not found');
          }
        } else {
          setError('Order not found');
        }
      } catch (err: any) {
        const errorMessage = err.response?.data?.error?.message || 
                            err.response?.data?.message || 
                            'Failed to load order';
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      fetchOrder();
    }
  }, [business, orderId]);

  // Fetch order items
  const fetchOrderItems = async () => {
    try {
      setItemsLoading(true);
      const response = await axios.get(
        `/api/business/order-items/?business=${business}&order_id=${orderId}`
      );
      if (response.data?.data?.items) {
        setOrderItems(response.data.data.items);
      }
    } catch (err) {
      console.error('Failed to fetch items:', err);
      // If endpoint doesn't exist, show empty state
    } finally {
      setItemsLoading(false);
    }
  };

  // Fetch order payments
  const fetchOrderPayments = async () => {
    try {
      setPaymentsLoading(true);
      const response = await axios.get(
        `/api/business/order-payments/?business=${business}&order_id=${orderId}`
      );
      if (response.data?.data?.payments) {
        setOrderPayments(response.data.data.payments);
        setTotalPaid(response.data.data.total_paid || '0');
        setBalanceDue(response.data.data.balance_due || '0');
      }
    } catch (err) {
      console.error('Failed to fetch payments:', err);
      // If endpoint doesn't exist, show empty state
    } finally {
      setPaymentsLoading(false);
    }
  };

  // Load items/payments when tab changes
  useEffect(() => {
    if (activeTab === 'items' && orderItems.length === 0 && !itemsLoading) {
      fetchOrderItems();
    } else if (activeTab === 'payments' && orderPayments.length === 0 && !paymentsLoading) {
      fetchOrderPayments();
    }
  }, [activeTab]);

  const formatDate = (timestamp: string | number) => {
    if (!timestamp) return 'N/A';
    
    try {
      const date = new Date(
        typeof timestamp === 'string' ? parseInt(timestamp) * 1000 : timestamp * 1000
      );
      
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return 'N/A';
    }
  };

  if (loading) {
    return (
      <div className="flex-1 p-4 md:p-6 overflow-auto bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Order Details</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Loading order information...</p>
          <div className="h-1 bg-gradient-to-r accent-bg accent-hover mt-3 rounded-full"></div>
        </div>
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 size={48} className="animate-spin text-blue-500 mb-4" />
          <p className="text-gray-600 dark:text-gray-400 font-medium">Loading order...</p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">This may take a few moments</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex-1 p-4 md:p-6 overflow-auto bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <Link href={`/${business}/order-list`}>
              <button className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition">
                <ArrowLeft size={24} className="text-gray-600 dark:text-gray-400" />
              </button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Order Details</h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1">Error loading order</p>
            </div>
          </div>
          <div className="h-1 bg-gradient-to-r accent-bg accent-hover mt-3 rounded-full"></div>
        </div>

        <div className="flex items-center justify-center min-h-[70vh]">
          <div className="max-w-md w-full">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 p-8 text-center">
              <div className="relative inline-block mb-6">
                <div className="absolute inset-0 bg-red-500 rounded-full opacity-10 blur-lg"></div>
                <div className="relative w-20 h-20 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/30 rounded-full flex items-center justify-center border-2 border-red-200 dark:border-red-800">
                  <AlertCircle size={40} className="text-red-600 dark:text-red-400" />
                </div>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                Order Not Found
              </h2>

              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  {error || 'The order you are looking for does not exist or cannot be accessed.'}
                </p>
              </div>

              <div className="flex gap-3">
                <Link href={`/${business}/order-list`} className="flex-1">
                  <button className="w-full px-6 py-3 text-white rounded-lg font-semibold transition-all duration-300 hover:scale-105 active:scale-95 accent-bg accent-hover shadow-md hover:shadow-lg">
                    Go Back
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const statusName = ORDER_STEPS[parseInt(order.order_status)] || 'Unknown';
  const statusColor = STATUS_BADGE_COLORS[statusName] || 'bg-gray-100 text-gray-700';

  return (
    <div className="flex-1 p-4 md:p-6 overflow-auto bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
      {/* Header with Back Button */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-3">
          <Link href={`/${business}/order-list`}>
            <button className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition">
              <ArrowLeft size={24} className="text-gray-600 dark:text-gray-400" />
            </button>
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Order #{order.order_id}</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">{readableName}</p>
          </div>
          <button className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition hidden md:block">
            <MoreVertical size={24} className="text-gray-600 dark:text-gray-400" />
          </button>
        </div>
        <div className="h-1 bg-gradient-to-r accent-bg accent-hover mt-3 rounded-full"></div>
      </div>

      {/* Order Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Status Card */}
        <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-800 shadow-sm">
          <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">Status</p>
          <div className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${statusColor}`}>
            {statusName}
          </div>
        </div>

        {/* Total Card */}
        <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-800 shadow-sm">
          <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3 flex items-center gap-2">
            <DollarSign size={16} /> Total Amount
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            ${parseFloat(order.cart_total_cost || '0').toFixed(2)}
          </p>
        </div>

        {/* Items Card */}
        <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-800 shadow-sm">
          <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3 flex items-center gap-2">
            <Package size={16} /> Items
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{order.total_cart_items || '0'}</p>
        </div>

        {/* Date Card */}
        <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-800 shadow-sm">
          <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3 flex items-center gap-2">
            <Calendar size={16} /> Order Date
          </p>
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {formatDate(order.order_time).split(',')[0]}
          </p>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 overflow-x-auto">
          {(['details', 'items', 'payments', 'shipping'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 font-medium capitalize transition text-sm whitespace-nowrap ${
                activeTab === tab
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              {tab === 'details' && '📋 Details'}
              {tab === 'items' && '📦 Items'}
              {tab === 'payments' && '💳 Payments'}
              {tab === 'shipping' && '🚚 Shipping'}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'details' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Customer Information */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                  <User size={20} /> Customer Information
                </h3>
                <div className="space-y-4">
                  <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                    <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">Name</p>
                    <p className="text-gray-900 dark:text-gray-100 font-medium">{order.full_name}</p>
                  </div>
                  {order.account_name && (
                    <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                      <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">Account</p>
                      <p className="text-gray-900 dark:text-gray-100 font-medium">{order.account_name}</p>
                    </div>
                  )}
                  <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                    <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1 flex items-center gap-2">
                      <Mail size={16} /> Email
                    </p>
                    <p className="text-blue-600 dark:text-blue-400 font-medium">{order.contact_email}</p>
                  </div>
                  {order.contact_phone && (
                    <div>
                      <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1 flex items-center gap-2">
                        <Phone size={16} /> Phone
                      </p>
                      <p className="text-gray-900 dark:text-gray-100 font-medium">{order.contact_phone}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Order Summary */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                  <Package size={20} /> Order Summary
                </h3>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      ${parseFloat(order.cart_cost || '0').toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Shipping</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      ${parseFloat(order.shipping_cost || '0').toFixed(2)}
                    </span>
                  </div>
                  {order.total_commission && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Commission</span>
                      <span className="font-semibold text-gray-900 dark:text-gray-100">
                        ${parseFloat(order.total_commission).toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-3 flex justify-between items-center">
                    <span className="font-bold text-gray-900 dark:text-gray-100">Total</span>
                    <span className="font-bold text-2xl text-gray-900 dark:text-gray-100">
                      ${parseFloat(order.cart_total_cost || '0').toFixed(2)}
                    </span>
                  </div>
                  <button className="w-full mt-6 px-4 py-3 text-white rounded-lg font-semibold transition-all duration-300 hover:scale-105 active:scale-95 accent-bg accent-hover shadow-md hover:shadow-lg flex items-center justify-center gap-2">
                    <CreditCard size={20} />
                    Apply Payment
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'items' && (
            <div>
              {itemsLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 size={40} className="animate-spin text-blue-500 mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">Loading items...</p>
                </div>
              ) : orderItems.length > 0 ? (
                <div className="space-y-4">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-400">Product</th>
                          <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600 dark:text-gray-400">Quantity</th>
                          <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-400">Unit Price</th>
                          <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-400">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orderItems.map((item) => (
                          <tr key={item.item_id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-3">
                                {item.product_image && (
                                  <img src={item.product_image} alt={item.product_name} className="w-12 h-12 object-cover rounded" />
                                )}
                                <div>
                                  <p className="font-semibold text-gray-900 dark:text-gray-100">{item.product_name}</p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">ID: {item.product_id}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4 text-center text-gray-900 dark:text-gray-100 font-medium">
                              {item.quantity}
                            </td>
                            <td className="px-4 py-4 text-right text-gray-900 dark:text-gray-100">
                              ${parseFloat(item.unit_price).toFixed(2)}
                            </td>
                            <td className="px-4 py-4 text-right">
                              <span className="font-bold text-gray-900 dark:text-gray-100">
                                ${parseFloat(item.total_price).toFixed(2)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <Package size={48} className="mx-auto mb-4 opacity-30" />
                  <p className="text-lg">No items found for this order</p>
                  <p className="text-sm mt-2">Items will appear here when available</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'payments' && (
            <div>
              {paymentsLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 size={40} className="animate-spin text-blue-500 mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">Loading payments...</p>
                </div>
              ) : orderPayments.length > 0 ? (
                <>
                  <div className="space-y-4 mb-6">
                    {orderPayments.map((payment) => (
                      <div key={payment.payment_id} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border-l-4 border-green-500">
                        <div className="flex justify-between items-start md:items-center gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Check size={18} className="text-green-600 dark:text-green-400" />
                              <h4 className="font-bold text-gray-900 dark:text-gray-100">{payment.payment_method}</h4>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                              {formatDate(payment.payment_date)}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-500">
                              Transaction ID: {payment.transaction_id}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                              ${parseFloat(payment.amount).toFixed(2)}
                            </p>
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mt-2 ${
                              payment.status === 'success' 
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                : payment.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            }`}>
                              {payment.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Payment Summary */}
                  <div className="grid grid-cols-2 gap-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
                    <div>
                      <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">Total Paid</p>
                      <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                        ${parseFloat(totalPaid || '0').toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">Balance Due</p>
                      <p className={`text-3xl font-bold ${
                        parseFloat(balanceDue || '0') > 0
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-green-600 dark:text-green-400'
                      }`}>
                        ${parseFloat(balanceDue || '0').toFixed(2)}
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <CreditCard size={48} className="mx-auto mb-4 opacity-30" />
                  <p className="text-lg">No payments recorded</p>
                  <p className="text-sm mt-2">Payments will appear here when added</p>
                  <button className="mt-6 px-6 py-2 text-white rounded-lg font-semibold transition-all duration-300 hover:scale-105 active:scale-95 accent-bg accent-hover">
                    <CreditCard size={18} className="inline mr-2" />
                    Add Payment
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'shipping' && (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <Truck size={48} className="mx-auto mb-4 opacity-30" />
              <p className="text-lg">Shipping information will be displayed here</p>
              <p className="text-sm mt-2">Coming soon...</p>
            </div>
          )}
        </div>
      </div>

      {/* Address Info */}
      <div className="mt-6 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
          <MapPin size={20} /> Shipping Address
        </h3>
        <div className="space-y-2">
          {order.contact_address && (
            <p className="text-gray-900 dark:text-gray-100 font-medium">{order.contact_address}</p>
          )}
          {order.to_address_detail_t_locs && (
            <>
              {order.to_address_detail_t_locs.locs_street && (
                <p className="text-gray-600 dark:text-gray-400">{order.to_address_detail_t_locs.locs_street}</p>
              )}
              <p className="text-gray-600 dark:text-gray-400">
                {order.to_address_detail_t_locs.locs_city}, {order.to_address_detail_t_locs.locs_zip}
              </p>
              {order.to_address_detail_t_locs.locs_phone && (
                <p className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
                  <Phone size={16} /> {order.to_address_detail_t_locs.locs_phone}
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}