'use client';

import React, { useEffect, useState, useMemo } from 'react';
import {
  Search, Filter, ChevronDown, ChevronLeft, ChevronRight, MoreVertical,
  Copy, Lock, FileText, Eye, Edit, CreditCard, Truck, X, Download, AlertCircle,
  Loader2, Calendar
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

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

// Sample data for development/testing
const SAMPLE_ORDERS: Order[] = [
  {
    order_id: '455',
    full_name: 'Developer Last',
    account_name: '12356PPO',
    contact_email: 'developer@example.com',
    cart_total_cost: '34.49',
    order_time: String(Math.floor(Date.now() / 1000) - 172800),
    order_status: '2',
    total_cart_items: '1',
    sales_person_name: 'John Doe',
    order_update_time: String(Math.floor(Date.now() / 1000) - 172800),
    cart_cost: '34.49',
    shipping_cost: '0',
    contact_address: '34453 Highway 9',
    contact_phone: '9659848223',
    age: '38',
    total_commission: '0',
  },
  {
    order_id: '456',
    full_name: 'Jane Smith',
    account_name: '54321PPO',
    contact_email: 'jane@example.com',
    cart_total_cost: '125.75',
    order_time: String(Math.floor(Date.now() / 1000) - 86400),
    order_status: '1',
    total_cart_items: '3',
    sales_person_name: 'Sarah Johnson',
    order_update_time: String(Math.floor(Date.now() / 1000) - 86400),
    cart_cost: '125.75',
    shipping_cost: '0',
    contact_address: '789 Oak Street',
    contact_phone: '5559876543',
    age: '42',
    total_commission: '0',
  },
];

const SAMPLE_SALES_REPS: SalesRep[] = [
  { user_id: '1', full_name: 'John Doe' },
  { user_id: '2', full_name: 'Sarah Johnson' },
  { user_id: '3', full_name: 'Mike Wilson' },
];

interface Order {
  order_id: string;
  full_name: string;
  account_name: string;
  contact_email: string;
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

// Helper function to map API response to Order interface
const mapApiOrderToOrder = (apiOrder: any): Order => {
  const fullName = `${apiOrder.contact_fname || ''} ${apiOrder.contact_lname || ''}`.trim();
  const address = apiOrder.contact_address || (apiOrder.from_address_detail_f_locs?.locs_street || '');
  
  return {
    order_id: apiOrder.order_id,
    full_name: fullName || apiOrder.full_name,
    account_name: apiOrder.state_license_number || '',
    contact_email: apiOrder.contact_email || '',
    cart_total_cost: apiOrder.cart_total_cost || '0',
    order_time: apiOrder.order_time || '0',
    order_status: apiOrder.order_status || '0',
    total_cart_items: apiOrder.total_cart_items || '0',
    sales_person_name: apiOrder.sales_person_name || 'No Sales Person',
    order_update_time: apiOrder.order_update_time || apiOrder.order_time || '0',
    cart_cost: apiOrder.cart_cost || '0',
    shipping_cost: apiOrder.shipping_cost || '0',
    contact_address: address,
    contact_phone: apiOrder.contact_phone || '',
    age: apiOrder.age || apiOrder.user_age || '0',
    total_commission: apiOrder.total_commission || '0',
    to_address_detail_t_locs: apiOrder.from_address_detail_f_locs,
  };
};

interface PaymentModalProps {
  isOpen: boolean;
  order: Order | null;
  onClose: () => void;
}

interface SalesRep {
  user_id: string;
  full_name: string;
}

// Payment Modal Component
const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, order, onClose }) => {
  const [paymentData, setPaymentData] = useState({
    paymentToApply: 'Partial payment',
    amount: '',
    paymentDate: new Date().toISOString().split('T')[0],
    paymentType: '',
  });

  if (!isOpen || !order) return null;

  const outstanding = parseFloat(order.cart_total_cost);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r accent-bg accent-hover px-6 py-4 flex justify-between items-center rounded-t-xl">
          <h2 className="text-white text-lg font-semibold">Apply Payment</h2>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 p-1 rounded-lg transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
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
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-gray-100"
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
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-gray-100"
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
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-gray-100"
                />
                <button className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
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
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-gray-100"
              >
                <option value="">Select payment type</option>
                <option value="cash">Cash</option>
                <option value="check">Check</option>
                <option value="card">Card</option>
                <option value="transfer">Bank Transfer</option>
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Notes
            </label>
            <textarea
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-gray-100"
              rows={4}
              placeholder="Add any additional notes..."
            />
          </div>

          {/* Outstanding Balance Info */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              <span className="font-semibold">Outstanding Balance:</span> ${outstanding.toFixed(2)}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end pt-4 border-t border-gray-200 dark:border-gray-800">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 font-semibold transition"
            >
              Cancel
            </button>
            <button
              onClick={onClose}
              className="px-6 py-2 text-white rounded-lg font-semibold transition-all duration-300 accent-bg accent-hover"
            >
              Apply Payment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Status Dropdown Component
interface StatusDropdownProps {
  order: Order;
  onStatusChange: (orderId: string, newStatus: string) => void;
}

const StatusDropdown: React.FC<StatusDropdownProps> = ({ order, onStatusChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const currentStatus = ORDER_STEPS[parseInt(order.order_status)] || 'Unknown';
  const currentStatusColor = STATUS_DROPDOWN_COLORS[currentStatus] || 'bg-gray-500 text-white';

  return (
    <div className="relative inline-block w-full">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-4 py-2 rounded-lg font-semibold flex items-center justify-between ${currentStatusColor}`}
      >
        {currentStatus}
        <ChevronDown size={16} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10">
          {Object.entries(ORDER_STEPS).map(([key, value]) => (
            <button
              key={key}
              onClick={() => {
                onStatusChange(order.order_id, key);
                setIsOpen(false);
              }}
              className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition ${STATUS_DROPDOWN_COLORS[value]}`}
            >
              {value}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// Sales Person Dropdown Component
interface SalesPersonDropdownProps {
  order: Order;
  salesReps: SalesRep[];
  onSalesPersonChange: (orderId: string, salesPersonId: string) => void;
}

const SalesPersonDropdown: React.FC<SalesPersonDropdownProps> = ({
  order,
  salesReps,
  onSalesPersonChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative inline-block w-full">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center justify-between"
      >
        {order.sales_person_name || 'Assign'}
        <ChevronDown size={16} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10">
          {salesReps.map((rep) => (
            <button
              key={rep.user_id}
              onClick={() => {
                onSalesPersonChange(order.order_id, rep.user_id);
                setIsOpen(false);
              }}
              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            >
              {rep.full_name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// Main Page Component

export default function PageContent() {
  const business = 'default';
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState(''); // Active by default
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [salesReps, setSalesReps] = useState<SalesRep[]>([]);
  const [paymentModal, setPaymentModal] = useState({ isOpen: false, order: null as Order | null });
  const itemsPerPage = 10;
  
	const [userId, setUserId] = useState<string | null>(null);

	useEffect(() => {
		
		const id = Cookies.get('user_id');   // reads cookie value
		setUserId(id || null);
	}, []);

  const [sortConfig, setSortConfig] = useState<{ key: string; ascending: boolean }>({
    key: 'order_id',
    ascending: false,
  });

  useEffect(() => {
    fetchOrders();
    //fetchSalesReps();
  }, [userId]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
	 console.log("userId"+userId);
	 if(userId === null)
		return;
		
      const response = await axios.get(`/api/business/order-list`, {
        params: {
      user_id: String(userId)    // force send
        },
      });
      // API response structure: { status, data: { orders: [...], total, page, limit } }
      const apiOrders = response.data?.data?.orders || [];
      console.log('API Response:', response.data);
      console.log('Raw API orders:', apiOrders);
      
      // Map API orders to component Order interface
      const mappedOrders = apiOrders.map(mapApiOrderToOrder);
      console.log('Mapped orders:', mappedOrders);
      
      setOrders(mappedOrders);
      setError(null);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Failed to load orders. Please try again.');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSalesReps = async () => {
    try {
      if (!business || business === 'default') {
        setSalesReps(SAMPLE_SALES_REPS);
        return;
      }
      const response = await axios.get(`/api/sales-reps`, {
        params: { business },
      });
      setSalesReps(response.data.data || []);
    } catch (err) {
      console.error('Error fetching sales reps:', err);
      setSalesReps(SAMPLE_SALES_REPS);
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      await axios.put(`/api/orders/${orderId}`, {
        order_status: newStatus,
        business,
      });
      setOrders(
        orders.map((order) =>
          order.order_id === orderId ? { ...order, order_status: newStatus } : order
        )
      );
      toast.success('Order status updated successfully');
    } catch (err) {
      console.error('Error updating order status:', err);
      toast.error('Failed to update order status');
    }
  };

  const handleSalesPersonChange = async (orderId: string, salesPersonId: string) => {
    try {
      await axios.put(`/api/orders/${orderId}`, {
        sales_person_id: salesPersonId,
        business,
      });
      const salesPerson = salesReps.find((rep) => rep.user_id === salesPersonId);
      setOrders(
        orders.map((order) =>
          order.order_id === orderId
            ? { ...order, sales_person_name: salesPerson?.full_name || '' }
            : order
        )
      );
      toast.success('Sales person updated successfully');
    } catch (err) {
      console.error('Error updating sales person:', err);
      toast.error('Failed to update sales person');
    }
  };

  const handleFilter = () => {
    setCurrentPage(1);
  };

  const formatDate = (timestamp: string | number) => {
    const date = new Date(typeof timestamp === 'string' ? parseInt(timestamp) * 1000 : timestamp * 1000);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Filter and search logic
  const filteredOrders = useMemo(() => {
    if (!Array.isArray(orders)) {
      return [];
    }
    let result = [...orders];

    if (searchTerm) {
      result = result.filter(
        (order) =>
          order.order_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.full_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedStatus && selectedStatus !== '99') {
      result = result.filter((order) => order.order_status === selectedStatus);
    } else if (selectedStatus === '99') {
      // Active orders - filter by recent status
      result = result.filter((order) => ['1', '2', '4', '5', '6'].includes(order.order_status));
    }

    if (fromDate) {
      const from = new Date(fromDate).getTime() / 1000;
      result = result.filter((order) => parseInt(order.order_time) >= from);
    }

    if (toDate) {
      const to = new Date(toDate).getTime() / 1000;
      result = result.filter((order) => parseInt(order.order_time) <= to);
    }

    return result;
  }, [orders, searchTerm, selectedStatus, fromDate, toDate]);

  // Sort logic
  const sortedOrders = useMemo(() => {
    const sorted = [...filteredOrders].sort((a, b) => {
      let aValue: any = a[sortConfig.key as keyof Order];
      let bValue: any = b[sortConfig.key as keyof Order];

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = (bValue as string).toLowerCase();
      }

      if (aValue < bValue) return sortConfig.ascending ? -1 : 1;
      if (aValue > bValue) return sortConfig.ascending ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [filteredOrders, sortConfig]);

  // Pagination
  const totalOrders = sortedOrders.length;
  const totalPages = Math.ceil(totalOrders / itemsPerPage);
  const paginatedOrders = sortedOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

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
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 p-8 text-center">
              <div className="relative inline-block mb-6">
                <div className="absolute inset-0 bg-red-500 rounded-full opacity-10 blur-lg"></div>
                <div className="relative w-20 h-20 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/30 rounded-full flex items-center justify-center border-2 border-red-200 dark:border-red-800">
                  <AlertCircle size={40} className="text-red-600 dark:text-red-400" />
                </div>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                Failed to Load Orders
              </h2>

              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  {error}
                </p>
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-400 mb-8">
                If you believe this is an error, please try refreshing the page or contact support.
              </p>

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

      {/* Simplified Filter Section */}
      <div className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-800 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Search by Order ID */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Search by Order ID
            </label>
            <input
              type="text"
              placeholder="Order ID#"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-gray-100"
            />
          </div>

          {/* From Date */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              From Date
            </label>
            <div className="relative">
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-gray-100"
              />
              <button className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <Calendar size={18} />
              </button>
            </div>
          </div>

          {/* To Date */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              To Date
            </label>
            <div className="relative">
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-gray-100"
              />
              <button className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <Calendar size={18} />
              </button>
            </div>
          </div>

          {/* Order Status */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Order Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-gray-100"
            >
              <option value="99">Active</option>
              <option value="">All Status</option>
              <option value="1">New Order</option>
              <option value="2">Opened</option>
              <option value="3">Order Approved</option>
              <option value="4">Pending</option>
              <option value="5">Processing</option>
              <option value="6">Shipped</option>
              <option value="9">POD</option>
            </select>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex gap-3">
          <button
            onClick={handleFilter}
            className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition"
          >
            Submit
          </button>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
        {/* Table Header with Pagination */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-800">
          <div className="text-sm text-gray-600 dark:text-gray-400 font-semibold">
            {(currentPage - 1) * itemsPerPage + 1} -{' '}
            {Math.min(currentPage * itemsPerPage, totalOrders)} of {totalOrders}
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
                <th className="px-6 py-4 text-left font-bold text-gray-700 dark:text-gray-300 text-sm">
                  Order Info
                </th>
                <th className="px-6 py-4 text-left font-bold text-gray-700 dark:text-gray-300 text-sm">
                  Phone
                </th>
                <th className="px-6 py-4 text-left font-bold text-gray-700 dark:text-gray-300 text-sm">
                  User Age
                </th>
                <th className="px-6 py-4 text-left font-bold text-gray-700 dark:text-gray-300 text-sm">
                  License Number
                </th>
                <th className="px-6 py-4 text-left font-bold text-gray-700 dark:text-gray-300 text-sm">
                  Total Items
                </th>
                <th className="px-6 py-4 text-left font-bold text-gray-700 dark:text-gray-300 text-sm">
                  Total Cost
                </th>
                <th className="px-6 py-4 text-left font-bold text-gray-700 dark:text-gray-300 text-sm">
                  Status
                </th>
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
                    {/* Order Info */}
                    <td className="px-6 py-4">
                      <div>
                        <Link 
                          href={`/${business}/order-list/${order.order_id}`}
                          className="font-bold text-green-600 dark:text-green-400 hover:underline"
                        >
                          Order #: {order.order_id}
                        </Link>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Order Date: {formatDate(order.order_time)}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {order.full_name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {order.contact_address}
                        </p>
                      </div>
                    </td>

                    {/* Phone */}
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                      {order.contact_phone || '-'}
                    </td>

                    {/* User Age */}
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                      {order.age || '-'}
                    </td>

                    {/* License Number */}
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                      {order.account_name || '-'}
                    </td>

                    {/* Total Items */}
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {order.total_cart_items} Items
                    </td>

                    {/* Total Cost */}
                    <td className="px-6 py-4 text-sm font-bold text-gray-900 dark:text-gray-100">
                      ${parseFloat(order.cart_total_cost).toFixed(2)}
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      <div className="min-w-[140px]">
                        <StatusDropdown order={order} onStatusChange={handleStatusChange} />
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
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
        onClose={() => setPaymentModal({ isOpen: false, order: null })}
      />
    </div>
  );
}