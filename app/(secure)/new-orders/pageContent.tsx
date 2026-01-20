'use client';

import React, { useEffect, useState, useMemo } from 'react';
import {
  Search, Filter, ChevronDown, ChevronLeft, ChevronRight, MoreVertical,
  Copy, Lock, FileText, Eye, Edit, CreditCard, Truck, X, Download, AlertCircle,
  Loader2
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  10: 'Packaged',
};

const STATUS_COLORS: { [key: string]: string } = {
  'New Order': 'bg-blue-100 text-blue-700',
  'Opened': 'bg-yellow-100 text-yellow-700',
  'Order Approved': 'bg-green-100 text-green-700',
  'Pending': 'bg-orange-100 text-orange-700',
  'Processing': 'bg-purple-100 text-purple-700',
  'Shipped': 'bg-cyan-100 text-cyan-700',
  'Canceled': 'bg-red-100 text-red-700',
  'Completed': 'bg-emerald-100 text-emerald-700',
  'POD': 'bg-teal-100 text-teal-700',
  'Packaged': 'bg-teal-100 text-teal-700',
};

const STATUS_DROPDOWN_COLORS: { [key: string]: string } = {
  'New Order': 'bg-blue-500 hover:bg-blue-600 text-white',
  'Opened': 'bg-yellow-500 hover:bg-yellow-600 text-white',
  'Order Approved': 'bg-green-500 hover:bg-green-600 text-white',
  'Pending': 'bg-orange-500 hover:bg-orange-600 text-white',
  'Processing': 'bg-purple-500 hover:bg-purple-600 text-white',
  'Shipped': 'bg-cyan-500 hover:bg-cyan-600 text-white',
  'Canceled': 'bg-red-500 hover:bg-red-600 text-white',
  'Completed': 'bg-emerald-500 hover:bg-emerald-600 text-white',
  'POD': 'bg-teal-500 hover:bg-teal-600 text-white',
};

interface Order {
  order_id: string;
  full_name: string;
  account_name: string;
  contact_email: string;
  total_balance: string;
  cart_total_cost: string;
  order_time: string;
  order_status: string;
  total_cart_items: string;
  sales_person_name: string;
  order_update_time: string;
  cart_cost: string;
  shipping_cost: string;
  contact_address: string;
  contact_phone: string;
  age: string;
  total_commission: string;
  to_address_detail_t_locs?: {
    locs_city?: string;
    locs_zip?: string;
    locs_street?: string;
  };
}

interface PaymentModalProps {
  isOpen: boolean;
  order: Order | null;
  onClose: () => void;
  business: string;
  onPaymentSuccess?: () => void;
}

interface SalesRep {
  user_id: string;
  full_name: string;
}

interface ActionMenuProps {
  order: Order; // Replace 'Order' with your actual order type
  business: string;
  onPaymentClick: (order: any) => void; // Replace 'any' with your actual type
}

// Payment Modal Component
const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, order, onClose, business, onPaymentSuccess }) => {
  const [paymentData, setPaymentData] = useState({
    paymentToApply: 'Partial payment',
    amount: '',
    paymentDate: new Date().toISOString().split('T')[0],
    paymentType: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-detect and update payment type when amount equals outstanding
  useEffect(() => {
    if (!isOpen || !order) return; // Early return inside effect
    
    const outstanding = parseFloat(order.total_balance);
    const amount = parseFloat(paymentData.amount || '0');
    
    if (Math.abs(amount - outstanding) < 0.01 && paymentData.amount !== '') {
      // Only update if it's not already set to 'Full payment'
      if (paymentData.paymentToApply !== 'Full payment') {
        setPaymentData(prev => ({ ...prev, paymentToApply: 'Full payment' }));
      }
    }
  }, [isOpen, order, paymentData.amount, paymentData.paymentToApply]);

  // Early return only happens in render after hooks
  if (!isOpen || !order) return null;

  const outstanding = parseFloat(order.total_balance);
  const amount = parseFloat(paymentData.amount || '0');
  const isFullyPaid = outstanding <= 0;

  // Validation checks
  const isPaymentMethodSelected = paymentData.paymentType !== '';
  const isAmountValid = amount > 0;
  const isAmountNotExceedingOutstanding = amount <= outstanding;
  
  // Smart payment type validation
  const isPartialPayment = paymentData.paymentToApply === 'Partial payment';
  const isFullPayment = paymentData.paymentToApply === 'Full payment';
  
  // If partial payment selected, amount should be less than total
  const isPartialPaymentValid = !isPartialPayment || (isPartialPayment && amount < outstanding);
  // If full payment, amount should equal outstanding
  const isFullPaymentValid = !isFullPayment || (isFullPayment && Math.abs(amount - outstanding) < 0.01);
  
  const isFormValid = isPaymentMethodSelected && isAmountValid && isAmountNotExceedingOutstanding && isPartialPaymentValid && isFullPaymentValid;

  const handleApplyPayment = async () => {
    // Validation
    if (!paymentData.paymentType) {
      toast.error('Please select a payment method');
      return;
    }

    if (amount <= 0) {
      toast.error('Amount must be greater than 0');
      return;
    }

    if (amount > outstanding) {
      toast.error(`Amount cannot exceed outstanding balance of $${outstanding.toFixed(2)}`);
      return;
    }

    // Partial payment validation
    if (isPartialPayment && amount >= outstanding) {
      toast.error(`For partial payment, amount must be less than $${outstanding.toFixed(2)}`);
      return;
    }

    // Full payment validation
    if (isFullPayment && Math.abs(amount - outstanding) > 0.01) {
      toast.error(`For full payment, amount must equal $${outstanding.toFixed(2)}`);
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Determine final payment type based on amount
      let finalPaymentType = isPartialPayment ? 'partial' : 'full';
      if (Math.abs(amount - outstanding) < 0.01) {
        finalPaymentType = 'full'; // Auto-switch to full if amount matches outstanding
      }

      const response = await axios.post(`/api/business/payments/`, {
        business,
        order_id: order.order_id,
        amount: paymentData.amount,
        payment_date: paymentData.paymentDate,
        payment_method: paymentData.paymentType,
        payment_type: finalPaymentType,
      });

      toast.success('Payment applied successfully!');
      
      // Reset form
      setPaymentData({
        paymentToApply: 'Partial payment',
        amount: '',
        paymentDate: new Date().toISOString().split('T')[0],
        paymentType: '',
      });

      // Close modal
      onClose();
      
      // Callback to refresh orders if provided
      if (onPaymentSuccess) {
        onPaymentSuccess();
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to apply payment';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r accent-bg accent-hover px-6 py-4 flex justify-between items-center rounded-t-xl">
          <h2 className="text-white text-lg font-semibold">Apply Payment</h2>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-white hover:bg-white hover:bg-opacity-20 p-1 rounded-lg transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Show message if fully paid */}
          {isFullyPaid && (
            <div className="bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded-lg p-4 flex items-center gap-3">
              <AlertCircle size={20} className="text-green-600 dark:text-green-400" />
              <div>
                <p className="font-semibold text-green-600 dark:text-green-400">Order is Fully Paid</p>
                <p className="text-sm text-green-600 dark:text-green-400">No payment is needed for this order.</p>
              </div>
            </div>
          )}

          {!isFullyPaid && (
            <>
              <div className="grid grid-cols-2 gap-6">
                {/* Payment to Apply */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Payment to apply
                  </label>
                  <select
                    value={paymentData.paymentToApply}
                    onChange={(e) =>
                      setPaymentData({ ...paymentData, paymentToApply: e.target.value })
                    }
                    disabled={isSubmitting}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-gray-100 disabled:opacity-50"
                  >
                    <option>Partial payment</option>
                    <option>Full payment</option>
                  </select>
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Amount
                  </label>
                  <div className="flex items-center">
                    <span className="text-gray-500 text-lg mr-3 font-semibold">$</span>
                    <input
                      type="number"
                      value={paymentData.amount}
                      onChange={(e) =>
                        setPaymentData({ ...paymentData, amount: e.target.value })
                      }
                      disabled={isSubmitting}
                      step="0.01"
                      min="0"
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-gray-100 disabled:opacity-50"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                {/* Payment Date */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Payment Date
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={paymentData.paymentDate}
                      onChange={(e) =>
                        setPaymentData({ ...paymentData, paymentDate: e.target.value })
                      }
                      disabled={isSubmitting}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-gray-100 disabled:opacity-50"
                    />
                    <button className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50" disabled={isSubmitting}>
                      <X size={18} />
                    </button>
                  </div>
                </div>

                {/* Payment Type */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Payment Type
                  </label>
                  <select
                    value={paymentData.paymentType}
                    onChange={(e) =>
                      setPaymentData({ ...paymentData, paymentType: e.target.value })
                    }
                    disabled={isSubmitting}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-gray-100 disabled:opacity-50"
                  >
                    <option value="">Select option</option>
                    <option value="1">Cash</option>
                    <option value="2">Check</option>
                    <option value="3">Credit Card</option>
                    <option value="4">Bank Transfer</option>
                    <option value="5">Other</option>
                  </select>
                </div>
              </div>

              {/* Summary */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg px-6 py-4 flex justify-center gap-12">
                <div className="text-center">
                  <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Order Total</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    ${parseFloat(order.cart_total_cost).toFixed(2)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Outstanding</p>
                  <p className="text-2xl font-bold text-red-600">${outstanding.toFixed(2)}</p>
                </div>
              </div>
            </>
          )}

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="px-6 py-3 bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700 font-semibold transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            {!isFullyPaid && (
              <button
                onClick={handleApplyPayment}
                disabled={!isFormValid || isSubmitting}
                className={`px-6 py-3 text-white rounded-lg font-semibold transition-all duration-300 flex items-center gap-2 ${
                  isFormValid && !isSubmitting
                    ? 'accent-bg accent-hover hover:scale-105 active:scale-95'
                    : 'bg-gray-400 cursor-not-allowed opacity-50'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Applying...
                  </>
                ) : (
                  'Apply'
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Action Menu Component
/*const ActionMenu: React.FC<{ order: Order }> = ({ order }) => {
  const [isOpen, setIsOpen] = useState(false);

  const actions = [
    { icon: Copy, label: 'Clone Order', action: 'clone' },
    { icon: Lock, label: 'Lock order', action: 'lock' },
    { icon: FileText, label: 'Invoice PDF (Print)', action: 'invoice' },
    { icon: Eye, label: 'View Order', action: 'view' },
    { icon: Edit, label: 'Edit Order', action: 'edit' },
    { icon: CreditCard, label: 'Payments', action: 'payments' },
    { icon: Truck, label: 'Shipping Manifest (Print)', action: 'manifest' },
    { icon: FileText, label: 'Pack List (Print)', action: 'pack' },
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
      >
        <MoreVertical size={20} className="text-gray-600 dark:text-gray-400" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-xl z-10">
          {actions.map((action, idx) => (
            <button
              key={action.action}
              className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm transition ${
                idx !== actions.length - 1 ? 'border-b border-gray-200 dark:border-gray-800' : ''
              }`}
            >
              <action.icon size={18} />
              <span className="font-medium">{action.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};*/
const ActionMenu: React.FC<ActionMenuProps> = ({ order, business, onPaymentClick }) => {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  // Clone Order Handler
  const handleCloneOrder = async () => {
    try {
      const response = await axios.post(
        `/api/business/clone-order/`,
        {
          business,
          order_id: order.order_id,
        }
      );
      toast.success('Order cloned successfully');
      setIsOpen(false);
    } catch (error) {
      toast.error('Failed to clone order');
    }
  };

  // Lock Order Handler
  const handleLockOrder = async () => {
    try {
      const response = await axios.post(
        `/api/business/lock-order/`,
        {
          business,
          order_id: order.order_id,
        }
      );
      toast.success('Order locked');
      setIsOpen(false);
    } catch (error) {
      toast.error('Failed to lock order');
    }
  };

  // Print Invoice Handler
  const handlePrintInvoice = () => {
	  /*window.open(
      `/api/business/invoice-pdf/?business=${business}&order_id=${order.order_id}`,
      '_blank'
	  );*/
	/*if (order) {
		console.log(business);
		generateInvoicePDF(order, business, order.to_address_detail_t_locs?.pages_image_path);
		setIsOpen(false);
		toast.success('Invoice PDF opened for printing');
	}*/
    setIsOpen(false);
  };

  // Print Shipping Manifest Handler
  const handlePrintManifest = () => {
    window.open(
      `/api/business/shipping-manifest/?business=${business}&order_id=${order.order_id}`,
      '_blank'
    );
    setIsOpen(false);
  };

  // Print Pack List Handler
  const handlePrintPackList = () => {
    window.open(
      `/api/business/pack-list/?business=${business}&order_id=${order.order_id}`,
      '_blank'
    );
    setIsOpen(false);
  };

  // Navigation Handler
  const handleViewOrder = () => {
    router.push(`/new-orders/${order.order_id}`);
    setIsOpen(false);
  };

  const handleEditOrder = () => {
    router.push(`/new-orders/${order.order_id}/edit`);
    setIsOpen(false);
  };

  // Payment Handler
	const handlePayments = () => {
		if (onPaymentClick) {
			onPaymentClick(order);  // Pass the order as an argument
		}
		setIsOpen(false);
	};

  const actions = [
  /*{
      icon: Copy,
      label: 'Clone Order',
      action: 'clone',
      handler: handleCloneOrder,
      type: 'function',
    },
    {
      icon: Lock,
      label: 'Lock Order',
      action: 'lock',
      handler: handleLockOrder,
      type: 'function',
  },*/
    {
      icon: FileText,
      label: 'Invoice PDF (Print)',
      action: 'invoice',
      handler: handlePrintInvoice,
      type: 'function',
    },
    {
      icon: Eye,
      label: 'View Order',
      action: 'view',
      handler: handleViewOrder,
      type: 'function',
    },
    {
      icon: Edit,
      label: 'Edit Order',
      action: 'edit',
      handler: handleEditOrder,
      type: 'function',
    },
    {
      icon: CreditCard,
      label: 'Payments',
      action: 'payments',
      handler: handlePayments,
      type: 'function',
    },
    {
      icon: Truck,
      label: 'Shipping Manifest (Print)',
      action: 'manifest',
      handler: handlePrintManifest,
      type: 'function',
    },
    {
      icon: FileText,
      label: 'Pack List (Print)',
      action: 'pack',
      handler: handlePrintPackList,
      type: 'function',
    },
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
      >
        <MoreVertical size={20} className="text-gray-600 dark:text-gray-400" />
      </button>

      {isOpen && (
        <>
          {/* Backdrop to close menu */}
          <div
            className="fixed inset-0 z-20"
            onClick={() => setIsOpen(false)}
          />

          {/* Menu */}
          <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-xl z-30">
            {actions.map((action, idx) => (
              <button
                key={action.action}
                onClick={action.handler}
                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm transition ${
                  idx !== actions.length - 1 ? 'border-b border-gray-200 dark:border-gray-800' : ''
                }`}
              >
                <action.icon size={18} />
                <span className="font-medium">{action.label}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};


// Status Dropdown Component
const StatusDropdown: React.FC<{ order: Order; onStatusChange: (orderId: string, status: string) => void }> = ({
  order,
  onStatusChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const currentStatus = ORDER_STEPS[parseInt(order.order_status)] || 'Unknown';
  const colorClass = STATUS_DROPDOWN_COLORS[currentStatus] || 'bg-gray-500';

  return (
    <div className="relative inline-block w-full">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-4 py-2 rounded-lg font-semibold flex items-center justify-between transition ${colorClass}`}
      >
        <span>{currentStatus}</span>
        <ChevronDown size={16} className={`transform transition ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-xl z-10">
          {Object.entries(ORDER_STEPS).map(([key, value]) => (
            <button
              key={key}
              onClick={() => {
                onStatusChange(order.order_id, key);
                setIsOpen(false);
              }}
              className={`w-full text-left px-4 py-3 text-sm font-medium transition flex items-center gap-2 ${
                parseInt(key) === parseInt(order.order_status)
                  ? 'bg-blue-50 dark:bg-gray-800 text-blue-600 dark:text-blue-400'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
              }`}
            >
              <div
                className={`w-3 h-3 rounded-full ${
                  parseInt(key) === parseInt(order.order_status) ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              />
              {value}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// Sales Person Dropdown Component
const SalesPersonDropdown: React.FC<{
  order: Order;
  salesReps: SalesRep[];
  onSalesPersonChange: (orderId: string, salesPersonId: string) => void;
}> = ({ order, salesReps, onSalesPersonChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div>
      <div className="relative">
        <select
          value={order.sales_person_name || ''}
          onChange={(e) => {
            onSalesPersonChange(order.order_id, e.target.value);
            setIsOpen(false);
          }}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-800 dark:text-gray-100 dark:bg-gray-800 hover:border-blue-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none cursor-pointer"
          onFocus={() => setIsOpen(true)}
          onBlur={() => setIsOpen(false)}
        >
          <option value="">Select Sales Person</option>
          {salesReps.map((rep) => (
            <option key={rep.user_id} value={rep.user_id}>
              {rep.full_name}
            </option>
          ))}
        </select>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 font-medium">
        Commission: <span className="text-gray-700 dark:text-gray-300 font-bold">${parseFloat(order.total_commission).toFixed(2)}</span>
      </p>
    </div>
  );
};

export default function OrderPageContent({ business }: { business: string }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [salesReps, setSalesReps] = useState<SalesRep[]>([]);
  const [pageId, setPageId] = useState<string | null>(null);
  const [paymentModal, setPaymentModal] = useState({ isOpen: false, order: null as Order | null });
  const [filterStatus, setFilterStatus] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'order_id', ascending: false });
  const [totalOrders, setTotalOrders] = useState(0); // Track total from API

  const itemsPerPage = 10;

	useEffect(() => {
	  const fetchOrders = async () => {
		try {
		  setLoading(true);
		  
		  const searchParams = new URLSearchParams(window.location.search);
		  const wholesale = searchParams.get("wholesale") || 0;
		  const response = await axios.get(
			`/api/business/save-whole-sale-order/?business=${business}&page=${currentPage}&wholesale=${wholesale}`
		  );
		  
		  if (response.data?.data?.orders) {
			setOrders(response.data.data.orders);
			setTotalOrders(response.data.data.total || 0);
			
			// Extract page_id from first order
			const pageId = response.data.data.orders[0]?.page_id;
			setPageId(pageId || null);
		  }
		} catch (err) {
		  setError('Failed to load orders');
		  toast.error('Failed to load orders');
		  setPageId(null);
		} finally {
		  setLoading(false);
		}
	  };
	  
	  fetchOrders();
	}, [business, currentPage]);

	// Fetch sales representatives - only when page_id is available
	useEffect(() => {
	  const fetchSalesReps = async () => {
		if (!pageId) return; // Don't fetch if no page_id
		
		try {
		  const response = await axios.get(
			`/api/business/sales-persons?page_id=${pageId}`
		  );
		  console.log(response.data.data);
		  if (response.data?.data) {
			setSalesReps(response.data.data);
		  }
		} catch (err) {
		  console.error('Failed to load sales reps');
		  setSalesReps([]);
		}
	  };
	  
	  fetchSalesReps();
	}, [pageId]); // Only depends on pageId

  const formatDate = (timestamp: string) => {
    const date = new Date(parseInt(timestamp) * 1000);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Note: Filtering and sorting should ideally be done server-side
  // For now, we're using the orders directly from the API
  // If you want client-side filtering, the API should return all orders
  // and you can filter them below
  
  const filteredOrders = useMemo(() => {
    // Apply client-side filtering on current page orders
    let filtered = orders.filter((order) => {
      const searchMatch =
        order.order_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.account_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.contact_email.toLowerCase().includes(searchTerm.toLowerCase());

      const statusMatch = filterStatus === '' || order.order_status === filterStatus;

      return searchMatch && statusMatch;
    });

    return filtered;
  }, [orders, searchTerm, filterStatus]);

  const totalPages = Math.ceil(totalOrders / itemsPerPage) || 1;

  // Reset to first page if current page exceeds total pages
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  // No need to filter/sort on client since API handles pagination
  // Just use the orders returned by API for current page

  const paginatedOrders = filteredOrders;

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      // API call would go here
      toast.success('Order status updated');
	  
	  const response = await axios.put(`/api/business/order-items/change-order-status/`, {
        business,
        order_id: orderId,
        order_status: newStatus,
      });
	  
      setOrders((prev) =>
        prev.map((order) =>
          order.order_id === orderId ? { ...order, order_status: newStatus } : order
        )
      );
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const handleSalesPersonChange = async (orderId: string, salesPersonId: string) => {
    try {
      // API call would go here
      toast.success('Sales person updated');
      setOrders((prev) =>
        prev.map((order) =>
          order.order_id === orderId
            ? { ...order, sales_person_name: salesPersonId }
            : order
        )
      );
    } catch (err) {
      toast.error('Failed to update sales person');
    }
  };

  if (loading) {
    return (
      <div className="flex-1 p-4 md:p-6 overflow-auto bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 capitalize">Orders Management</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Loading orders...</p>
          <div className="h-1 bg-gradient-to-r accent-bg accent-hover mt-3 rounded-full"></div>
        </div>
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 size={48} className="animate-spin text-blue-500 mb-4" />
          <p className="text-gray-600 dark:text-gray-400 font-medium">Loading orders...</p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">This may take a few moments</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 p-4 md:p-6 overflow-auto bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 capitalize">Orders Management</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Error loading orders</p>
          <div className="h-1 bg-gradient-to-r accent-bg accent-hover mt-3 rounded-full"></div>
        </div>
        
        <div className="flex items-center justify-center min-h-[70vh]">
          <div className="max-w-md w-full">
            {/* Error Card */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 p-8 text-center">
              {/* Icon */}
              <div className="relative inline-block mb-6">
                <div className="absolute inset-0 bg-red-500 rounded-full opacity-10 blur-lg"></div>
                <div className="relative w-20 h-20 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/30 rounded-full flex items-center justify-center border-2 border-red-200 dark:border-red-800">
                  <AlertCircle size={40} className="text-red-600 dark:text-red-400" />
                </div>
              </div>

              {/* Error Title */}
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                Failed to Load Orders
              </h2>

              {/* Error Message */}
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  {error}
                </p>
              </div>

              {/* Help Text */}
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-8">
                If you believe this is an error, please try refreshing the page or contact support.
              </p>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => window.location.reload()}
                  className="flex-1 px-6 py-3 text-white rounded-lg font-semibold transition-all duration-300 hover:scale-105 active:scale-95 accent-bg accent-hover shadow-md hover:shadow-lg"
                >
                  Try Again
                </button>
                <button
                  onClick={() => window.history.back()}
                  className="flex-1 px-6 py-3 bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg font-semibold transition-all duration-300 hover:bg-gray-300 dark:hover:bg-gray-700 active:scale-95"
                >
                  Go Back
                </button>
              </div>
            </div>

            {/* Support Text */}
            <p className="text-xs text-gray-500 dark:text-gray-500 text-center mt-6">
              Need help? Contact support@example.com
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 md:p-6 overflow-auto bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 capitalize">Orders Management</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Manage your wholesale orders • {totalOrders} orders total
        </p>
        <div className="h-1 bg-gradient-to-r accent-bg accent-hover mt-3 rounded-full"></div>
      </div>

      {/* Search and Filter Section */}
      <div className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-800 mb-6">
        <div className="flex gap-6 items-end">
          {/* Search on Left */}
          <div className="flex-1">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Search Orders</label>
            <div className="relative">
              <Search size={20} className="absolute left-3 top-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by Order ID or Customer"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-gray-100"
              />
            </div>
          </div>

          {/* Status Filter on Right */}
          <div className="w-64">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Filter by Status</label>
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Status</option>
              {Object.entries(ORDER_STEPS).map(([key, value]) => (
                <option key={key} value={key}>
                  {value}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
        {/* Header with Pagination Only */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-800 rounded-t-lg">
          <div className="text-sm text-gray-600 dark:text-gray-400 font-semibold">
            {(currentPage - 1) * itemsPerPage + 1} -{' '}
            {Math.min(currentPage * itemsPerPage, totalOrders)} of{' '}
            {totalOrders}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                if (currentPage > 1) setCurrentPage(currentPage - 1);
              }}
              disabled={currentPage <= 1}
              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
              title="Previous page"
            >
              <ChevronLeft size={20} className="text-gray-600 dark:text-gray-400" />
            </button>
            <button
              onClick={() => {
                if (currentPage < totalPages) setCurrentPage(currentPage + 1);
              }}
              disabled={currentPage >= totalPages}
              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
              title="Next page"
            >
              <ChevronRight size={20} className="text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800">
                <th className="px-6 py-4 text-left">
                  <input type="checkbox" className="rounded" />
                </th>
                <th className="px-6 py-4 text-left">
                  <button
                    onClick={() =>
                      setSortConfig({
                        key: 'order_id',
                        ascending: sortConfig.key === 'order_id' ? !sortConfig.ascending : false,
                      })
                    }
                    className="flex items-center gap-2 font-bold text-gray-700 dark:text-gray-300 text-sm hover:text-gray-900 dark:hover:text-gray-100"
                  >
                    Order
                    <ChevronDown size={16} />
                  </button>
                </th>
                <th className="px-6 py-4 text-left">
                  <button
                    onClick={() =>
                      setSortConfig({
                        key: 'full_name',
                        ascending: sortConfig.key === 'full_name' ? !sortConfig.ascending : false,
                      })
                    }
                    className="flex items-center gap-2 font-bold text-gray-700 dark:text-gray-300 text-sm hover:text-gray-900 dark:hover:text-gray-100"
                  >
                    Customer
                    <ChevronDown size={16} />
                  </button>
                </th>
                <th className="px-6 py-4 text-left font-bold text-gray-700 dark:text-gray-300 text-sm">Date</th>
                <th className="px-6 py-4 text-left font-bold text-gray-700 dark:text-gray-300 text-sm">Ship Date</th>
                <th className="px-6 py-4 text-left font-bold text-gray-700 dark:text-gray-300 text-sm">Balance</th>
                <th className="px-6 py-4 text-left font-bold text-gray-700 dark:text-gray-300 text-sm">Total</th>
                <th className="px-6 py-4 text-left font-bold text-gray-700 dark:text-gray-300 text-sm">Sales Person</th>
                <th className="px-6 py-4 text-left font-bold text-gray-700 dark:text-gray-300 text-sm">Status</th>
                {/*<th className="px-6 py-4 text-left font-bold text-gray-700 dark:text-gray-300 text-sm">Actions</th>*/}
              </tr>
            </thead>
            <tbody>
              {paginatedOrders.length > 0 ? (
                paginatedOrders.map((order, idx) => (
                  <tr
                    key={order.order_id}
                    className={`border-b border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition ${
                      idx % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800'
                    }`}
                  >
                    <td className="px-6 py-4">
                      <input type="checkbox" className="rounded" />
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-bold text-blue-600 dark:text-blue-400">
							<Link href={`/new-orders/${order.order_id}`}>
								{order.order_id}
							</Link>
						</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{order.account_name}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-gray-100">{order.full_name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Sales Reps: {order.sales_person_name || '-'}</p>{/*
                        <div className="flex gap-1 mt-2">
                          <span className="inline-block bg-yellow-300 text-yellow-900 text-xs px-2 py-0.5 rounded font-bold">
                            MED
                          </span>
                          <span className="inline-block bg-yellow-300 text-yellow-900 text-xs px-2 py-0.5 rounded font-bold">
                            MED
                          </span>
                        </div>*/}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                      {formatDate(order.order_time)}
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="date"
                        defaultValue={new Date(parseInt(order.order_update_time) * 1000)
                          .toISOString()
                          .split('T')[0]}
                        className="px-2 py-1 border border-gray-300 dark:border-gray-700 rounded text-sm dark:bg-gray-800 dark:text-gray-100"
                      />
                    </td>
                    <td className="px-6 py-4">
                      {parseFloat(order.total_balance) > 0 ? (
                        <button
                          onClick={() => setPaymentModal({ isOpen: true, order })}
                          className="text-red-600 dark:text-red-400 font-bold hover:text-red-700 dark:hover:text-red-300 cursor-pointer"
                        >
                          ${parseFloat(order.total_balance).toFixed(2)}
                        </button>
                      ) : (
                        <span className="text-green-600 dark:text-green-400 font-bold">
                          $0.00
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-900 dark:text-gray-100">
                      ${parseFloat(order.cart_total_cost).toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      <SalesPersonDropdown
                        order={order}
                        salesReps={salesReps}
                        onSalesPersonChange={handleSalesPersonChange}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <StatusDropdown order={order} onStatusChange={handleStatusChange} />
                    </td>
                    {/*<td className="px-6 py-4">
                      <ActionMenu business={business} order={order} onPaymentClick={() => setPaymentModal({ isOpen: true, order })} />
                    </td>*/}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    No orders found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={paymentModal.isOpen}
        order={paymentModal.order}
        business={business}
        onClose={() => setPaymentModal({ isOpen: false, order: null })}
        onPaymentSuccess={() => {
          // Refresh orders after successful payment
          setCurrentPage(1);
          // Trigger re-fetch by causing useEffect to run
          setPaymentModal({ isOpen: false, order: null });
        }}
      />
    </div>
  );
}