'use client';

import React, { useEffect, useState, useRef } from 'react';
import {
  ArrowLeft, Loader2, AlertCircle, MoreVertical, X,
  MapPin, Calendar, DollarSign, Package, Phone, Mail, User, Truck, CreditCard, Check,
  Copy, Lock, FileText, Eye, Edit3, List
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';
import Link from 'next/link';
import { 
  generateInvoicePDF, 
  generateShippingManifestPDF, 
  generatePackListPDF,
  printOrder 
} from '@/lib/orderPDFGenerator';

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

interface CartItem {
  cart_id: string;
  order_id: string;
  product_id: string;
  name: string;
  selected_qty: string | number;
  selected_qty_price: string;
  img?: string | null;
  commission?: string;
  total?: string;
  flavors?: string;
  description?: string;
  batch_id?: string | null;
}

interface Order {
  order_id: string;
  page_id?: string;
  contact_fname?: string;
  contact_lname?: string;
  full_name?: string;
  account_name?: string;
  contact_email: string;
  contact_phone?: string;
  contact_address?: string;
  cart_total_cost: string;
  cart_cost: string;
  cart_tax_cost?: string | null;
  shipping_cost: string;
  order_time: string;
  order_update_time?: string;
  order_status: string;
  order_complete?: string | number;
  total_cart_items?: string | number;
  sales_person?: string | null;
  sales_person_name?: string | null;
  total_commission?: string;
  order_notes?: string | null;
  estimated_delivery?: string;
  contact_pod_person?: string | null;
  contact_pod_time?: string | number | null;
  contact_pod_deliverer?: string | null;
  contact_city?: string;
  contact_state?: string;
  wholesale_order?: string | number;
  sample_order?: string | number;
  to_address_detail_f_locs?: {
	trade_name?: string;
    title?: string;
    locs_city?: string;
    locs_zip?: string;
    locs_street?: string;
    locs_phone?: string;
    locs_email?: string;
    locs_state?: string;
    license_number?: string;
    full_name?: string;
    pages_image_url?: string;
	invoice_logo?: string;
  };
  from_address_detail_f_locs?: {
	trade_name?: string;
    title?: string;
    locs_city?: string;
    locs_zip?: string;
    locs_state?: string;
    license_number?: string;
    locs_street?: string;
    locs_phone?: string;
    locs_email?: string;
    full_name?: string;
	pages_image_url?: string;
	invoice_logo?: string;
  };
  seller_information?: {
    title?: string;
    locs_city?: string;
    locs_zip?: string;
    locs_street?: string;
    locs_phone?: string;
    locs_email?: string;
    full_name?: string;
	pages_image_url?: string;
  };
  cart?: CartItem[];
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

interface SalesPerson {
  sales_person_id?: string;
  user_id?: string;
  full_name?: string;
  sales_person_name?: string;
  email?: string;
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

  // Dropdown and Modal states
  const [showDropdown, setShowDropdown] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<Order>>({});
  const [paymentFormData, setPaymentFormData] = useState({
    payment_type: 'partial',
    amount: '0',
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: '',
  });
  
  // Sales person and status states
  const [salesPersons, setSalesPersons] = useState<SalesPerson[]>([]);
  const [loadingSalesPersons, setLoadingSalesPersons] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);
  const [changingSalesPerson, setChangingSalesPerson] = useState(false);
  const [taxPercentage, setTaxPercentage] = useState('0');
  
  const dropdownRef = useRef<HTMLDivElement>(null);

  const readableName = business.replace(/-/g, " ");

  // Fetch order details
  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await axios.get(
          `/api/business/order-items/?business=${business}&order_id=${orderId}`
        );
        
        if (response.data?.data) {
          const orderData = response.data.data;
          setOrder(orderData);
          
          // Fetch sales persons if page_id is available
          if (orderData.page_id) {
            fetchSalesPersons(orderData.page_id);
          }
          
          // Extract cart items and set them
          if (orderData.cart && Array.isArray(orderData.cart)) {
            const mappedItems = orderData.cart.map((item: CartItem) => ({
              item_id: item.cart_id,
              order_id: item.order_id,
              product_id: item.product_id,
              product_name: item.name,
              quantity: item.selected_qty,
              // FIX: Use selected_qty_price directly as unit price
              unit_price: (parseFloat(item.selected_qty_price) || 0).toString(),
              total_price: item.total || item.selected_qty_price,
              product_image: item.img || undefined
            }));
            setOrderItems(mappedItems);
          }
          
          // Fetch payment data on page load
          fetchOrderPayments();
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

  // Fetch order items (already loaded from main API, but can refetch if needed)
  const fetchOrderItems = async () => {
    try {
      setItemsLoading(true);
      const response = await axios.get(
        `/api/business/order-items/?business=${business}&order_id=${orderId}`
      );
      if (response.data?.data?.cart && Array.isArray(response.data.data.cart)) {
        const mappedItems = response.data.data.cart.map((item: CartItem) => ({
          item_id: item.cart_id,
          order_id: item.order_id,
          product_id: item.product_id,
          product_name: item.name,
          quantity: item.selected_qty,
          // FIX: Use selected_qty_price directly as unit price
          unit_price: (parseFloat(item.selected_qty_price) || 0).toString(),
          total_price: item.total || item.selected_qty_price,
          product_image: item.img || undefined
        }));
        setOrderItems(mappedItems);
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
        `/api/business/payments/?business=${business}&order_id=${orderId}`
      );
      if (response.data && response.data.data) {
        const paymentsData = response.data.data;
        // Convert object with numeric keys to array, excluding 'summary'
        const paymentsArray = Object.entries(paymentsData)
          .filter(([key]) => key !== 'summary')
          .map(([, payment]) => payment) as OrderPayment[];
        setOrderPayments(paymentsArray);
        setTotalPaid(paymentsData.summary?.total_paid || '0');
        setBalanceDue(paymentsData.summary?.balance_due || '0');
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

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch sales persons
  const fetchSalesPersons = async (pageId: string) => {
    try {
      setLoadingSalesPersons(true);
      const response = await axios.get(
        `/api/business/sales-persons?page_id=${pageId}`
      );
      if (response.data?.data) {
        setSalesPersons(Array.isArray(response.data.data) ? response.data.data : []);
      }
    } catch (err) {
      console.error('Failed to fetch sales persons:', err);
    } finally {
      setLoadingSalesPersons(false);
    }
  };

  // Handle status change
  const handleStatusChange = async (newStatus: string) => {
    try {
      setChangingStatus(true);
      const response = await axios.put(`/api/business/order-items/change-order-status/`, {
        business,
        order_id: orderId,
        order_status: newStatus,
      });
      toast.success('Order status updated successfully!');
      if (order) {
        setOrder({ ...order, order_status: newStatus });
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to update order status';
      toast.error(errorMessage);
    } finally {
      setChangingStatus(false);
    }
  };

  // Handle sales person change
  const handleSalesPersonChange = async (salesPersonId: string) => {
    try {
      setChangingSalesPerson(true);
      const response = await axios.put(`/api/business/sales-persons/`, {
        business,
        order_id: orderId,
        sales_person: salesPersonId,
      });
      
      // Extract updated commission if available in response
      const updatedCommission = response.data?.data?.total_commission || order?.total_commission || '0';
      
      toast.success('Sales person updated successfully!');
      const selectedPerson = salesPersons.find((sp) => (sp.user_id || sp.sales_person_id) === salesPersonId);
      if (order) {
        setOrder({ 
          ...order, 
          sales_person: salesPersonId,
          sales_person_name: selectedPerson?.full_name || selectedPerson?.sales_person_name || '',
          total_commission: updatedCommission
        });
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to update sales person';
      toast.error(errorMessage);
    } finally {
      setChangingSalesPerson(false);
    }
  }

  // Dropdown Action Handlers
  const handleCloneOrder = async () => {
    try {
      const response = await axios.post(`/api/business/clone-order/`, {
        business,
        order_id: orderId,
      });
      toast.success('Order cloned successfully!');
      setShowDropdown(false);
      setTimeout(() => window.location.reload(), 1000);
    } catch (err) {
      toast.error('Failed to clone order');
    }
  };

  const handleLockOrder = async () => {
    try {
      await axios.post(`/api/business/lock-order/`, {
        business,
        order_id: orderId,
      });
      toast.success('Order locked successfully!');
      setShowDropdown(false);
    } catch (err) {
      toast.error('Failed to lock order');
    }
  };

  const handleGenerateInvoicePDF = () => {
    if (order) {
      generateInvoicePDF(
        order, 
        order.from_address_detail_f_locs?.title || '',
        order.from_address_detail_f_locs?.invoice_logo || order.from_address_detail_f_locs?.pages_image_url || ''
      );
      setShowDropdown(false);
      toast.success('Invoice PDF opened for printing');
    }
  };

  const handleGenerateManifestPDF = () => {
    if (order) {
      generateShippingManifestPDF(order, order.from_address_detail_f_locs?.title || '',
        order.from_address_detail_f_locs?.invoice_logo || order.from_address_detail_f_locs?.pages_image_url || '');
      setShowDropdown(false);
      toast.success('Shipping Manifest opened for printing');
    }
  };

  const handleGeneratePackListPDF = () => {
    if (order) {
      generatePackListPDF(order,  order.from_address_detail_f_locs?.title || '',
        order.from_address_detail_f_locs?.invoice_logo || order.from_address_detail_f_locs?.pages_image_url || '');
      setShowDropdown(false);
      toast.success('Pack List opened for printing');
    }
  };

  const handlePrintOrder = () => {
    if (order) {
      printOrder(order, order.from_address_detail_f_locs?.title || '');
      setShowDropdown(false);
    }
  };

  const handleEditOrder = () => {
    if (order) {
      setEditFormData(order);
      setShowEditModal(true);
      setShowDropdown(false);
    }
  };

  const handleSaveEdit = async () => {
    try {
      if (!order) {
        toast.error('Order data not loaded');
        return;
      }

      // Calculate totals
      let subtotal = 0;
      if (order.cart && Array.isArray(order.cart)) {
        order.cart.forEach((item: any, index: number) => {
          const unitPrice = parseFloat(item.selected_qty_price);
          const quantity = editFormData.cart?.[index]?.selected_qty || item.selected_qty;
          subtotal += unitPrice * (typeof quantity === 'string' ? parseInt(quantity) : quantity);
        });
      }

      //const taxCost = (4.5 / 100) * subtotal;
      const taxCost = 0;
      const shippingCost = parseFloat(editFormData.shipping_cost || order.shipping_cost || '0');
      const totalCost = subtotal + taxCost + shippingCost;

      // Build cart items array with new quantities
      const cartItems = editFormData.cart || order.cart;

      const response = await axios.put(`/api/business/order-items/update-order-items/`, {
        business,
        order_id: orderId,
        page_id: order.page_id,
        cart: cartItems,
        tax_cost: taxCost.toFixed(2),
        shipping_cost: shippingCost.toFixed(2),
        total_cost: totalCost.toFixed(2),
      });

      toast.success('Order updated successfully!');
      setShowEditModal(false);
      if (order) {
        setOrder({ 
          ...order, 
          cart: cartItems,
          cart_cost: subtotal.toFixed(2),
          cart_tax_cost: taxCost.toFixed(2),
          shipping_cost: shippingCost.toFixed(2),
          cart_total_cost: totalCost.toFixed(2),
        });
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to update order';
      toast.error(errorMessage);
    }
  };

  const handleApplyPayment = async () => {
    // Validation
    const amount = parseFloat(paymentFormData.amount || '0');
    const balanceDueAmount = parseFloat(balanceDue || '0');

    // Check all fields are filled
    if (!paymentFormData.payment_method) {
      toast.error('Please select a payment method');
      return;
    }

    // Check amount is valid
    if (amount <= 0) {
      toast.error('Amount must be greater than 0');
      return;
    }

    // Check amount doesn't exceed balance due
    if (amount > balanceDueAmount) {
      toast.error(`Amount cannot exceed balance due of $${balanceDueAmount.toFixed(2)}`);
      return;
    }

    try {
      await axios.post(`/api/business/payments/`, {
        business,
        order_id: orderId,
        ...paymentFormData,
      });
      toast.success('Payment applied successfully!');
      setShowPaymentModal(false);
      setPaymentFormData({
        payment_type: 'partial',
        amount: '0',
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: '',
      });
      // Refresh payments
      fetchOrderPayments();
    } catch (err) {
      toast.error('Failed to apply payment');
    }
  };

  const formatDate = (timestamp: string | number | undefined) => {
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
            <Link href={`/open-orders`}>
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
                <Link href={`/open-orders`} className="flex-1">
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
          <Link href={`/open-orders`}>
            <button className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition">
              <ArrowLeft size={24} className="text-gray-600 dark:text-gray-400" />
            </button>
          </Link>

          {/* Business Logo */}
          {order.to_address_detail_f_locs?.pages_image_url && (
            <img
              src= {order.from_address_detail_f_locs?.pages_image_url ?? '—'}
              alt={order.from_address_detail_f_locs?.title}
              className="h-12 md:h-16 object-contain rounded"
            />
          )}

          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Order #{order.order_id}</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">{order.from_address_detail_f_locs?.trade_name || order.from_address_detail_f_locs?.title}</p>
          </div>

          {/* Dropdown Menu Button */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition hidden md:block"
            >
              <MoreVertical size={24} className="text-gray-600 dark:text-gray-400" />
            </button>

            {/* Dropdown Menu */}
            {showDropdown && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                {/* Status Badge */}
                <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">Status</span>
                    <button className="text-xs bg-yellow-400 text-white px-2 py-1 rounded font-medium hover:bg-yellow-500">
                      {statusName}
                    </button>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="py-2">
                  {/* Clone Order 
                  <button
                    onClick={handleCloneOrder}
                    className="w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition flex items-center gap-3 text-gray-700 dark:text-gray-300"
                  >
                    <Copy size={18} />
                    <span>Clone Order</span>
                  </button>*/}

                  {/* Divider 
                  <div className="my-2 border-t border-gray-200 dark:border-gray-700"></div>*/}

                  {/* Invoice PDF */}
                  <button
                    onClick={handleGenerateInvoicePDF}
                    className="w-full px-4 py-3 text-left hover:bg-blue-50 dark:hover:bg-blue-900/20 transition flex items-center gap-3 text-blue-600 dark:text-blue-400 border-l-4 border-transparent hover:border-blue-600"
                  >
                    <FileText size={18} />
                    <div>
                      <div className="font-medium">Invoice PDF (Print)</div>
                      <div className="text-xs text-gray-500">Client-side PDF</div>
                    </div>
                  </button>

                  {/* Edit Order */}
                  <button
                    onClick={handleEditOrder}
                    className="w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition flex items-center gap-3 text-gray-700 dark:text-gray-300"
                  >
                    <Edit3 size={18} />
                    <span>Edit Order</span>
                  </button>


                  {/* Divider */}
                  <div className="my-2 border-t border-gray-200 dark:border-gray-700"></div>

                  {/* Shipping Manifest */}
                  <button
                    onClick={handleGenerateManifestPDF}
                    className="w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition flex items-center gap-3 text-gray-700 dark:text-gray-300"
                  >
                    <Truck size={18} />
                    <div>
                      <div className="font-medium">Shipping Manifest (Print)</div>
                      <div className="text-xs text-gray-500">Client-side PDF</div>
                    </div>
                  </button>

                  {/* Pack List */}
                  <button
                    onClick={handleGeneratePackListPDF}
                    className="w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition flex items-center gap-3 text-gray-700 dark:text-gray-300"
                  >
                    <List size={18} />
                    <div>
                      <div className="font-medium">Pack List (Print)</div>
                      <div className="text-xs text-gray-500">Client-side PDF</div>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="h-1 bg-gradient-to-r accent-bg accent-hover mt-3 rounded-full"></div>
      </div>

      {/* Order Summary Cards - Single Row */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {/* Status Card */}
        <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-800 shadow-sm">
          <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">Status</p>
          <div className="flex items-center gap-2">
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
              STATUS_BADGE_COLORS[ORDER_STEPS[parseInt(order.order_status || '1')]] || 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
            }`}>
              {ORDER_STEPS[parseInt(order.order_status || '1')] || 'Unknown'}
            </span>
          </div>
        </div>

        {/* Sales Person Card */}
        <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-800 shadow-sm">
          <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">Sales Person</p>
          <p className="text-gray-900 dark:text-gray-100 font-medium">
            {order.sales_person_name || 'Not Assigned'}
          </p>
        </div>

        {/* Total Card - Fixed to include commission */}
        <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-800 shadow-sm">
          <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3 flex items-center gap-2">
            <DollarSign size={16} /> Total Amount
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            ${(() => {
              const subtotal = parseFloat(order.cart_cost || '0');
              const shipping = parseFloat(order.shipping_cost || '0');
              const commission = parseFloat(order.total_commission || '0');
              const total = subtotal + shipping + commission;
              return total.toFixed(2);
            })()}
          </p>
        </div>

        {/* Items Card */}
        <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-800 shadow-sm">
          <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3 flex items-center gap-2">
            <Package size={16} /> Items
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{order.total_cart_items || '0'}</p>
        </div>
      </div>

      {/* Order Date Card - Below if needed */}
      <div className="grid grid-cols-1 gap-4 mb-6">
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
                  <User size={20} /> Seller Information
                </h3>
                <div className="space-y-4">
                  <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                    {order.from_address_detail_f_locs ? (
					  <>
						<p className="text-gray-900 dark:text-gray-100 font-medium">
						  {order.from_address_detail_f_locs.trade_name || order.from_address_detail_f_locs.title || 'N/A'}
						</p>
						<p className="text-gray-900 dark:text-gray-100 font-medium">{order.from_address_detail_f_locs?.locs_street}</p>
						<p className="text-gray-900 dark:text-gray-100 font-medium">{order.from_address_detail_f_locs?.locs_city}</p>
						<p className="text-gray-900 dark:text-gray-100 font-medium">{order.from_address_detail_f_locs?.locs_state || ''}</p>
						<p className="text-gray-900 dark:text-gray-100 font-medium">{order.from_address_detail_f_locs?.locs_zip}</p>
						<p className="text-gray-900 dark:text-gray-100 font-medium">{order.from_address_detail_f_locs?.license_number}</p>
					  </>
					) : (
					  <p className="text-gray-900 dark:text-gray-100 font-medium">No address details available</p>
					)}
                  </div>
                  
                  <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                    <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1 flex items-center gap-2">
                      <Mail size={16} /> Email
                    </p>
                    <p className="text-blue-600 dark:text-blue-400 font-medium">{order.from_address_detail_f_locs?.locs_email ?? 'N/A'}</p>
                  </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1 flex items-center gap-2">
                        <Phone size={16} /> Phone
                      </p>
                      <p className="text-gray-900 dark:text-gray-100 font-medium">{order.from_address_detail_f_locs?.locs_phone ?? 'N/A'}</p>
                    </div>
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
                  {/*{order.total_commission && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Commission</span>
                      <span className="font-semibold text-gray-900 dark:text-gray-100">
                        ${parseFloat(order.total_commission).toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Tax (4.5%)</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      ${(() => {
                        const subtotal = parseFloat(order.cart_cost || '0');
                        const tax = (4.5 / 100) * subtotal;
                        return tax.toFixed(2);
                      })()}
                    </span>
                  </div>*/}
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-3 flex justify-between items-center">
                    <span className="font-bold text-gray-900 dark:text-gray-100">Total</span>
                    <span className="font-bold text-2xl text-gray-900 dark:text-gray-100">
                      ${(() => {
                        const subtotal = parseFloat(order.cart_cost || '0');
                        const shipping = parseFloat(order.shipping_cost || '0');
                        const commission = parseFloat(order.total_commission || '0');
                        //const tax = (4.5 / 100) * subtotal;
						const tax = 0;
                        const total = subtotal + shipping + commission + tax;
                        return total.toFixed(2);
                      })()}
                    </span>
                  </div>
                  
                  {/* Payment Status Section */}
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-3 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Total Paid</span>
                      <span className="font-semibold text-green-600 dark:text-green-400">
                        ${parseFloat(totalPaid || '0').toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Balance Due</span>
                      <span className={`font-semibold ${parseFloat(balanceDue || '0') <= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        ${parseFloat(balanceDue || '0').toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Apply Payment Button - Only show if balance is due */}
                  
                  {/* Fully Paid Badge */}
                  {parseFloat(balanceDue || '0') <= 0 && (
                    <div className="w-full mt-6 px-4 py-3 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center gap-2">
                      <Check size={20} className="text-green-600 dark:text-green-400" />
                      <span className="font-semibold text-green-600 dark:text-green-400">Fully Paid</span>
                    </div>
                  )}
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
                              {payment.payment_date}
                            </p>
                            {/*<p className="text-xs text-gray-500 dark:text-gray-500">
                              Transaction ID: {payment.payment_id}
                            </p>*/}
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                              ${parseFloat(payment.amount).toFixed(2)}
                            </p>
                            {/*<span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mt-2 ${
                              payment.status === 'success' 
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                : payment.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            }`}>
                              {payment.status}
                            </span>*/}
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
                  {/*<button className="mt-6 px-6 py-2 text-white rounded-lg font-semibold transition-all duration-300 hover:scale-105 active:scale-95 accent-bg accent-hover" onClick={() => {
                      setShowPaymentModal(true);
                    }}>
                    <CreditCard size={18} className="inline mr-2" />
                    Add Payment
                  </button>*/}
                </div>
              )}
            </div>
          )}

          {activeTab === 'shipping' && (
            <div className="space-y-6">
              {/* Shipping Status Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/10 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                  <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">Order Placed</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    {formatDate(order.order_time).split(',')[0]}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {formatDate(order.order_time).split(',')[1]}
                  </p>
                </div>

                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-900/10 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800">
                  <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">Last Update</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    {formatDate(order.order_update_time).split(',')[0]}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {formatDate(order.order_update_time).split(',')[1]}
                  </p>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-900/10 rounded-lg p-4 border border-orange-200 dark:border-orange-800">
                  <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">Estimated Delivery</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    {order.estimated_delivery || '-'}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Pending confirmation</p>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-900/10 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                  <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">Shipping Cost</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    ${parseFloat(order.shipping_cost || '0').toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Standard shipping</p>
                </div>
              </div>

              {/* Delivery Address */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                <h4 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                  <MapPin size={20} className="text-blue-600 dark:text-blue-400" />
                  Delivery Address
                </h4>
                {order.to_address_detail_f_locs ? (
                  <div className="space-y-3">
                    {order.to_address_detail_f_locs.full_name && (
                      <div className="flex items-start gap-3">
                        <User size={18} className="text-gray-400 mt-1 flex-shrink-0" />
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Recipient</p>
                          <p className="text-gray-900 dark:text-gray-100 font-medium">{order.to_address_detail_f_locs.full_name}</p>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-start gap-3">
                      <MapPin size={18} className="text-gray-400 mt-1 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Address</p>
                        <p className="text-gray-900 dark:text-gray-100 font-medium">
                          {order.to_address_detail_f_locs.locs_street || 'N/A'}
                        </p>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">
                          {order.to_address_detail_f_locs.locs_city}, {order.to_address_detail_f_locs.locs_state || order.contact_state} {order.to_address_detail_f_locs.locs_zip}
                        </p>
                      </div>
                    </div>

                    {order.to_address_detail_f_locs.locs_phone && (
                      <div className="flex items-start gap-3">
                        <Phone size={18} className="text-gray-400 mt-1 flex-shrink-0" />
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Phone</p>
                          <p className="text-blue-600 dark:text-blue-400 font-medium">{order.to_address_detail_f_locs.locs_phone}</p>
                        </div>
                      </div>
                    )}

                    {order.to_address_detail_f_locs.locs_email && (
                      <div className="flex items-start gap-3">
                        <Mail size={18} className="text-gray-400 mt-1 flex-shrink-0" />
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Email</p>
                          <p className="text-blue-600 dark:text-blue-400 font-medium">{order.to_address_detail_f_locs.locs_email}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-600 dark:text-gray-400">No delivery address available</p>
                )}
              </div>

              {/* Shipping Cost Breakdown */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                <h4 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                  <DollarSign size={20} className="text-green-600 dark:text-green-400" />
                  Shipping Cost Breakdown
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center pb-3 border-b border-gray-200 dark:border-gray-700">
                    <p className="text-gray-600 dark:text-gray-400">Subtotal</p>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">
                      ${parseFloat(order.cart_cost || '0').toFixed(2)}
                    </p>
                  </div>
                  
                  {order.cart_tax_cost && parseFloat(order.cart_tax_cost) > 0 && (
                    <div className="flex justify-between items-center pb-3 border-b border-gray-200 dark:border-gray-700">
                      <p className="text-gray-600 dark:text-gray-400">Tax</p>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">
                        ${parseFloat(order.cart_tax_cost).toFixed(2)}
                      </p>
                    </div>
                  )}

                  <div className="flex justify-between items-center pb-3 border-b border-gray-200 dark:border-gray-700">
                    <p className="text-gray-600 dark:text-gray-400">Shipping Fee</p>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">
                      ${parseFloat(order.shipping_cost || '0').toFixed(2)}
                    </p>
                  </div>

                  <div className="flex justify-between items-center pt-3 bg-blue-50 dark:bg-blue-900/20 rounded p-3">
                    <p className="font-bold text-gray-900 dark:text-gray-100">Total</p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      ${parseFloat(order.cart_total_cost || '0').toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Proof of Delivery */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                <h4 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                  <Check size={20} className="text-green-600 dark:text-green-400" />
                  Proof of Delivery
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-700 rounded p-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Delivered By</p>
                    <p className="text-gray-900 dark:text-gray-100 font-semibold">
                      {order.contact_pod_deliverer || 'Pending'}
                    </p>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-700 rounded p-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Received By</p>
                    <p className="text-gray-900 dark:text-gray-100 font-semibold">
                      {order.contact_pod_person || 'Pending'}
                    </p>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-700 rounded p-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Delivery Time</p>
                    <p className="text-gray-900 dark:text-gray-100 font-semibold">
                      {order.contact_pod_time ? formatDate(order.contact_pod_time) : 'Pending'}
                    </p>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-700 rounded p-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Order Complete</p>
                    <p className={`text-sm font-semibold ${order.order_complete === '1' || order.order_complete === 1 ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}`}>
                      {order.order_complete === '1' || order.order_complete === 1 ? '✓ Completed' : 'In Progress'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Shipping Timeline */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                <h4 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2">
                  <Truck size={20} className="text-blue-600 dark:text-blue-400" />
                  Shipping Timeline
                </h4>
                
                <div className="space-y-4">
                  {/* Order Placed */}
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white mb-2">
                        <Check size={16} />
                      </div>
                      <div className="w-1 h-12 bg-green-200 dark:bg-green-800"></div>
                    </div>
                    <div className="pb-4">
                      <p className="font-bold text-gray-900 dark:text-gray-100">Order Placed</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{formatDate(order.order_time)}</p>
                    </div>
                  </div>

                  {/* Processing */}
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white mb-2 ${
                        parseInt(order.order_status) >= 5 ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                      }`}>
                        {parseInt(order.order_status) >= 5 ? <Check size={16} /> : <span className="w-2 h-2 bg-current rounded-full"></span>}
                      </div>
                      <div className={`w-1 h-12 ${parseInt(order.order_status) >= 6 ? 'bg-green-200 dark:bg-green-800' : 'bg-gray-200 dark:bg-gray-700'}`}></div>
                    </div>
                    <div className="pb-4">
                      <p className="font-bold text-gray-900 dark:text-gray-100">Processing</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Your order is being prepared</p>
                    </div>
                  </div>

                  {/* Shipped */}
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white mb-2 ${
                        parseInt(order.order_status) >= 6 ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                      }`}>
                        {parseInt(order.order_status) >= 6 ? <Check size={16} /> : <span className="w-2 h-2 bg-current rounded-full"></span>}
                      </div>
                      <div className={`w-1 h-12 ${parseInt(order.order_status) >= 8 ? 'bg-green-200 dark:bg-green-800' : 'bg-gray-200 dark:bg-gray-700'}`}></div>
                    </div>
                    <div className="pb-4">
                      <p className="font-bold text-gray-900 dark:text-gray-100">Shipped</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Package is on its way</p>
                    </div>
                  </div>

                  {/* Delivered */}
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white mb-2 ${
                        parseInt(order.order_status) === 8 || (order.order_complete === '1' || order.order_complete === 1) ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                      }`}>
                        {parseInt(order.order_status) === 8 || (order.order_complete === '1' || order.order_complete === 1) ? <Check size={16} /> : <span className="w-2 h-2 bg-current rounded-full"></span>}
                      </div>
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 dark:text-gray-100">Delivered</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {order.contact_pod_time ? formatDate(order.contact_pod_time) : 'Awaiting delivery'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
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
          <p className="text-gray-900 dark:text-gray-100 font-medium">{order.to_address_detail_f_locs?.trade_name || order.to_address_detail_f_locs?.title || ''}</p>
          {order.to_address_detail_f_locs && (
            <>
              {order.to_address_detail_f_locs.locs_street && (
                <p className="text-gray-600 dark:text-gray-400">{order.to_address_detail_f_locs.locs_street}</p>
              )}
              <p className="text-gray-600 dark:text-gray-400">
                {order.to_address_detail_f_locs.locs_city}, {order.to_address_detail_f_locs.locs_zip}
              </p>
              {order.to_address_detail_f_locs.locs_phone && (
                <p className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
                  <Phone size={16} /> {order.to_address_detail_f_locs.locs_phone}
                </p>
              )}
            </>
          )}
        </div>
      </div>

      {/* Edit Order Modal */}
      {showEditModal && order && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg max-w-4xl w-full max-h-96 overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-900 px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Edit Order #{order.order_id}</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition"
              >
                <X size={24} className="text-gray-600 dark:text-gray-400" />
              </button>
            </div>

            <div className="p-6">
              {/* Order Items Table */}
              <div className="mb-8">
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Order Items</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-100 dark:bg-gray-800">
                      <tr>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">Item Name</th>
                        <th className="px-4 py-2 text-center text-sm font-semibold text-gray-900 dark:text-gray-100">Unit Price</th>
                        <th className="px-4 py-2 text-center text-sm font-semibold text-gray-900 dark:text-gray-100">Quantity</th>
                        <th className="px-4 py-2 text-right text-sm font-semibold text-gray-900 dark:text-gray-100">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.cart && Array.isArray(order.cart) ? (
                        order.cart.map((item: any, index: number) => {
                          const unitPrice = parseFloat(item.selected_qty_price);
                          const quantity = editFormData.cart?.[index]?.selected_qty || item.selected_qty;
                          const itemTotal = unitPrice * (typeof quantity === 'string' ? parseInt(quantity) : quantity);
                          
                          return (
                            <tr key={index} className="border-b border-gray-200 dark:border-gray-700">
                              <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                                <div>
                                  <p className="font-medium">{item.name}</p>
                                  {item.flavors && <p className="text-xs text-gray-600 dark:text-gray-400">{item.flavors}</p>}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-center text-sm text-gray-900 dark:text-gray-100 font-medium">
                                ${unitPrice.toFixed(2)}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <input
                                  type="number"
                                  value={quantity}
                                  onChange={(e) => {
                                    const newCart = [...(editFormData.cart || order?.cart || [])];
                                    newCart[index] = { ...newCart[index], selected_qty: parseInt(e.target.value) || 1 };
                                    setEditFormData({ ...editFormData, cart: newCart });
                                  }}
                                  min="1"
                                  className="w-16 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-center"
                                />
                              </td>
                              <td className="px-4 py-3 text-right text-sm text-gray-900 dark:text-gray-100 font-semibold">
                                ${itemTotal.toFixed(2)}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={4} className="px-4 py-3 text-center text-gray-600 dark:text-gray-400">
                            No items
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Order Summary Section */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column - Inputs */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Delivery Fee
                      </label>
                      <div className="flex items-center">
                        <span className="text-lg font-bold text-gray-700 dark:text-gray-300 mr-2">$</span>
                        <input
                          type="number"
                          value={editFormData.shipping_cost || order.shipping_cost || '0'}
                          onChange={(e) => setEditFormData({ ...editFormData, shipping_cost: e.target.value })}
                          step="0.01"
                          min="0"
                          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Right Column - Summary */}
                  <div className="space-y-3">
                    {/* Subtotal */}
                    <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                      <span className="text-gray-700 dark:text-gray-300 font-medium">SubTotal:</span>
                      <span className="font-bold text-gray-900 dark:text-gray-100">
                        ${(() => {
                          let subtotal = 0;
                          if (order.cart && Array.isArray(order.cart)) {
                            order.cart.forEach((item: any, index: number) => {
                              const unitPrice = parseFloat(item.selected_qty_price);
                              const quantity = editFormData.cart?.[index]?.selected_qty || item.selected_qty;
                              subtotal += unitPrice * (typeof quantity === 'string' ? parseInt(quantity) : quantity);
                            });
                          }
                          return subtotal.toFixed(2);
                        })()}
                      </span>
                    </div>

                    {/* Tax (Display Only) 
                    <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                      <span className="text-gray-700 dark:text-gray-300 font-medium">Estimated Excise Tax (4.5%):</span>
                      <span className="font-bold text-gray-900 dark:text-gray-100">
                        ${(() => {
                          let subtotal = 0;
                          if (order && order.cart && Array.isArray(order.cart)) {
                            order.cart.forEach((item: any, index: number) => {
                              const unitPrice = parseFloat(item.selected_qty_price);
                              const quantity = editFormData.cart?.[index]?.selected_qty || item.selected_qty;
                              subtotal += unitPrice * (typeof quantity === 'string' ? parseInt(quantity) : quantity);
                            });
                          }
                          const tax = (4.5 / 100) * subtotal;
                          return tax.toFixed(2);
                        })()}
                      </span>
                    </div>*/}

                    {/* Shipping */}
                    <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                      <span className="text-gray-700 dark:text-gray-300 font-medium">Delivery Fee:</span>
                      <span className="font-bold text-gray-900 dark:text-gray-100">
                        ${(parseFloat(editFormData.shipping_cost || order?.shipping_cost || '0')).toFixed(2)}
                      </span>
                    </div>

                    {/* Commission */}
                    {(editFormData.total_commission || order?.total_commission) && (
                      <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                        <span className="text-gray-700 dark:text-gray-300 font-medium">Commission:</span>
                        <span className="font-bold text-gray-900 dark:text-gray-100">
                          ${(parseFloat(editFormData.total_commission || order?.total_commission || '0')).toFixed(2)}
                        </span>
                      </div>
                    )}

                    {/* Total */}
                    <div className="flex justify-between items-center py-3 bg-blue-50 dark:bg-blue-900/20 px-3 rounded-lg border-2 border-blue-200 dark:border-blue-800">
                      <span className="font-bold text-gray-900 dark:text-gray-100 text-lg">Total:</span>
                      <span className="font-bold text-blue-600 dark:text-blue-400 text-2xl">
                        ${(() => {
                          let subtotal = 0;
                          if (order && order.cart && Array.isArray(order.cart)) {
                            order.cart.forEach((item: any, index: number) => {
                              const unitPrice = parseFloat(item.selected_qty_price);
                              const quantity = editFormData.cart?.[index]?.selected_qty || item.selected_qty;
                              subtotal += unitPrice * (typeof quantity === 'string' ? parseInt(quantity) : quantity);
                            });
                          }
                          const tax = (parseFloat(taxPercentage) / 100) * subtotal;
                          const shipping = parseFloat(editFormData.shipping_cost || order?.shipping_cost || '0');
                          const commission = parseFloat(editFormData.total_commission || order?.total_commission || '0');
                          const total = subtotal + tax + shipping + commission;
                          return total.toFixed(2);
                        })()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-800 px-6 py-4 border-t border-gray-200 dark:border-gray-800 flex gap-3 justify-end">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && order && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Add Payment</h2>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition"
              >
                <X size={24} className="text-gray-600 dark:text-gray-400" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Payment to apply */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Payment to apply
                </label>
                <select
                  value={paymentFormData.payment_type}
                  onChange={(e) => setPaymentFormData({ ...paymentFormData, payment_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                >
                  <option value="partial">Partial payment</option>
                  <option value="full">Full payment</option>
                </select>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Amount
                </label>
                <div className="flex items-center">
                  <span className="text-lg font-bold text-gray-700 dark:text-gray-300 mr-2">$</span>
                  <input
                    type="number"
                    value={paymentFormData.amount}
                    onChange={(e) => setPaymentFormData({ ...paymentFormData, amount: e.target.value })}
                    step="0.01"
                    min="0"
                    max={order?.cart_total_cost}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Payment Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Payment Date
                </label>
                <input
                  type="date"
                  value={paymentFormData.payment_date}
                  onChange={(e) => setPaymentFormData({ ...paymentFormData, payment_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
              </div>

              {/* Payment Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Payment Type
                </label>
                <select
                  value={paymentFormData.payment_method}
                  onChange={(e) => setPaymentFormData({ ...paymentFormData, payment_method: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                >
                  <option value="">Select option</option>
                  <option value="1">Cash</option>
                  <option value="2">Check</option>
                  <option value="3">Credit Card</option>
                  <option value="4">Bank Transfer</option>
                  <option value="5">Other</option>
                </select>
              </div>

              {/* Order Total & Outstanding */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                <div className="flex justify-between mb-2">
                  <span className="font-medium text-gray-700 dark:text-gray-300">Order Total</span>
                  <span className="font-bold text-gray-900 dark:text-gray-100">
                    ${parseFloat(order?.cart_total_cost || '0').toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="font-medium text-gray-700 dark:text-gray-300">Total Paid</span>
                  <span className="font-bold text-green-600 dark:text-green-400">
                    ${parseFloat(totalPaid || '0').toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-700 dark:text-gray-300">Outstanding</span>
                  <span className={`font-bold ${parseFloat(balanceDue || '0') <= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    ${parseFloat(balanceDue || '0').toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 px-6 py-4 border-t border-gray-200 dark:border-gray-800 flex gap-3 justify-end">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleApplyPayment}
                disabled={parseFloat(paymentFormData.amount || '0') <= 0 || !paymentFormData.payment_method || parseFloat(paymentFormData.amount || '0') > parseFloat(balanceDue || '0')}
                className={`px-4 py-2 text-white rounded-lg transition font-medium ${
                  parseFloat(paymentFormData.amount || '0') <= 0 || !paymentFormData.payment_method || parseFloat(paymentFormData.amount || '0') > parseFloat(balanceDue || '0')
                    ? 'bg-gray-400 cursor-not-allowed opacity-50'
                    : 'bg-teal-500 hover:bg-teal-600'
                }`}
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}