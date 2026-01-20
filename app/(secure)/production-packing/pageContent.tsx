'use client';

import React, { useEffect, useState, useMemo, useRef } from 'react';
import {
  Search, ChevronDown, ChevronLeft, ChevronRight,
  X, AlertCircle, Loader2, CheckCircle2, Package
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';

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

// Updated interface based on actual API response (cart items instead of order_items)
interface CartItem {
  cart_id: string;
  product_id: string;
  order_id: string;
  selected_qty: string;
  selected_qty_price: string;
  name: string;
  cart_cost: string;
  flavors?: string;
  no_of?: string;
  med_image?: string;
  is_packed?: string | number | boolean; // ✅ Added - packed status from API
}

interface Order {
  order_id: string;
  page_id: string;
  user_id: string;
  full_name: string;
  account_name?: string;
  address_page_id: string;
  contact_detail: {
    contact_id: string;
    page_type: string;
    page_id: string;
    user_id: string;
    country_iso: string;
  };
  address_page_id_detail: {
    address_id: string;
    page_type: string;
    page_id: string;
    user_id: string;
  };
  age: string;
  birthday?: string;
  cart: CartItem[];
}

// Confirmation Modal Component
const ConfirmationModal: React.FC<{
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}> = ({ isOpen, title, message, onConfirm, onCancel, isLoading }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-500 to-teal-600 px-6 py-4 rounded-t-lg flex items-center gap-3">
          <Package size={24} className="text-white" />
          <h2 className="text-lg font-bold text-white">{title}</h2>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-700 dark:text-gray-300 text-center">{message}</p>
        </div>

        {/* Buttons */}
        <div className="bg-gray-50 dark:bg-gray-800 px-6 py-4 rounded-b-lg flex gap-3 justify-end border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="px-6 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-100 dark:hover:bg-gray-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="px-6 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CheckCircle2 size={16} />
                Confirm
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// Packaging Modal Component
const PackagingDetailModal: React.FC<{
  isOpen: boolean;
  order: Order | null;
  onClose: () => void;
  onPackagingComplete?: () => void;
}> = ({ isOpen, order, onClose, onPackagingComplete }) => {
  const [packedItems, setPackedItems] = useState<{ [key: string]: boolean }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [itemLoading, setItemLoading] = useState<{ [key: string]: boolean }>({});
  const [showConfirmation, setShowConfirmation] = useState(false);

  useEffect(() => {
    if (order?.cart) {
      const initialState: { [key: string]: boolean } = {};
      order.cart.forEach(item => {
		// ✅ Check if item already has is_packed status from API
        const isPacked = item.is_packed === 1 || 
                        item.is_packed === '1' || 
                        item.is_packed === true ||
                        item.is_packed === 'true';
        initialState[item.cart_id] = isPacked;
		
        //initialState[item.cart_id] = false;
      });
      setPackedItems(initialState);
    }
  }, [order]);

  if (!isOpen || !order) return null;

  const items = order.cart || [];
  const allItemsPacked = items.length > 0 && items.every(item => packedItems[item.cart_id]);

  // ✅ API call to mark item as packed
  const handleTogglePacked = async (cartId: string, currentState: boolean) => {
    try {
      setItemLoading(prev => ({ ...prev, [cartId]: true }));

      const newState = !currentState;
      
      // Call API to save packed status
      const response = await axios.put(`/api/business/order-items/change-order-status/`, {
        cart_id: cartId,
        order_id: order.order_id,
        is_packed: newState ? 1 : 0,
		page:'cart_pack'
      });

      // Update local state
      setPackedItems(prev => ({
        ...prev,
        [cartId]: newState
      }));

      toast.success(`Item ${newState ? 'marked' : 'unmarked'} as packed`);
    } catch (error: any) {
      console.error('Error updating packed status:', error);
      toast.error(error?.response?.data?.message || 'Failed to update packed status');
    } finally {
      setItemLoading(prev => ({ ...prev, [cartId]: false }));
    }
  };

  // ✅ Handle confirm from modal
  const handleConfirmMarkAsPackaged = async () => {
    try {
      setIsSubmitting(true);

      const now = new Date();
      const packedDate = now.toISOString().split('T')[0];
      const packedTime = now.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });

      // ✅ API call to update order status to Packaged
      const response = await axios.put(
		  "/api/business/order-items/change-order-status/",
		  {
			order_id: order.order_id, // ✅ fixed
			order_status: 10,
			packaged_date: packedDate,
			packaged_time: packedTime,
			packed_items: packedItems,
			page:'order_pack'
		  }
		);

      toast.success(`Order ${order.order_id} marked as Packaged!`);
      setShowConfirmation(false);
      onClose();
      onPackagingComplete?.();
    } catch (error: any) {
      console.error('Error marking order as packaged:', error);
      toast.error(error?.response?.data?.message || 'Failed to mark order as packaged');
      setShowConfirmation(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Production & Packaging</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Order #{order.order_id}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition"
            >
              <X size={24} className="text-gray-600 dark:text-gray-400" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Order Info Section */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <p className="text-xs uppercase text-gray-600 dark:text-gray-400 font-semibold">Order Number</p>
                <p className="text-lg font-bold text-gray-900 dark:text-gray-100 mt-1">{order.order_id}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <p className="text-xs uppercase text-gray-600 dark:text-gray-400 font-semibold">Customer</p>
                <p className="text-lg font-bold text-gray-900 dark:text-gray-100 mt-1">{order.full_name}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <p className="text-xs uppercase text-gray-600 dark:text-gray-400 font-semibold">Total Items</p>
                <p className="text-lg font-bold text-gray-900 dark:text-gray-100 mt-1">{items.length}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <p className="text-xs uppercase text-gray-600 dark:text-gray-400 font-semibold">Items Packed</p>
                <p className="text-lg font-bold text-teal-600 dark:text-teal-400 mt-1">
                  {Object.values(packedItems).filter(Boolean).length}/{items.length}
                </p>
              </div>
            </div>

            {/* Items Table with Images */}
            <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Product</th>
                    <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-300">Qty</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Price</th>
                    <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-300">Packed</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => {
                    const isPacked = packedItems[item.cart_id];
                    const isLoading = itemLoading[item.cart_id];

                    return (
                      <tr
                        key={item.cart_id}
                        className={`border-b border-gray-200 dark:border-gray-700 ${
                          idx % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800'
                        }`}
                      >
                        {/* Product with Image */}
                        <td className="px-6 py-4">
                          <div className="flex gap-3 items-start">
                            {/* ✅ Product Image */}
                            {item.med_image && (
                              <div className="flex-shrink-0">
                                <img
                                  src={item.med_image}
                                  alt={item.name}
                                  className="w-16 h-16 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                                />
                              </div>
                            )}
                            
                            {/* Product Details */}
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                                {item.name}
                              </p>
                              {item.flavors && (
                                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                  Flavor: {item.flavors}
                                </p>
                              )}
                              {item.no_of && (
                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                  Units: {item.no_of}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Quantity */}
                        <td className="px-6 py-4 text-center text-gray-900 dark:text-gray-100 font-medium">
                          {item.selected_qty}
                        </td>

                        {/* Price */}
                        <td className="px-6 py-4 text-gray-600 dark:text-gray-400 font-semibold">
                          ${parseFloat(item.selected_qty_price || '0').toFixed(2)}
                        </td>

                        {/* Checkbox with Loading State */}
                        <td className="px-6 py-4 text-center">
                          <div className="flex justify-center">
                            {isLoading ? (
                              <Loader2 size={20} className="animate-spin text-teal-600" />
                            ) : (
                              <button
                                onClick={() => handleTogglePacked(item.cart_id, isPacked)}
                                className={`relative w-6 h-6 rounded border-2 transition ${
                                  isPacked
                                    ? 'bg-teal-600 border-teal-600'
                                    : 'border-gray-300 dark:border-gray-600 hover:border-teal-500'
                                }`}
                              >
                                {isPacked && (
                                  <CheckCircle2 size={20} className="text-white absolute -inset-1" />
                                )}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Packing Notes Section */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex gap-3">
              <AlertCircle size={20} className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-blue-900 dark:text-blue-200">Packing Instructions</p>
                <p className="text-sm text-blue-800 dark:text-blue-300 mt-1">
                  Click the checkbox for each item as you pack it. The API will save immediately. 
                  Once all items are checked, you can mark the entire order as Packaged.
                </p>
              </div>
            </div>

            {/* Status Change Section */}
            <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg border-l-4 border-teal-500">
              <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                <Package size={20} className="text-teal-600 dark:text-teal-400" />
                Mark Order as Packaged
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {allItemsPacked ? (
                  <span className="flex items-center gap-2 text-green-600 dark:text-green-400">
                    <CheckCircle2 size={16} />
                    All items packed - Ready to proceed
                  </span>
                ) : (
                  <span className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
                    <AlertCircle size={16} />
                    {items.length - Object.values(packedItems).filter(Boolean).length} items still need to be marked as packed
                  </span>
                )}
              </p>
              <button
                onClick={() => setShowConfirmation(true)}
                disabled={!allItemsPacked}
                className={`w-full py-3 px-4 rounded-lg font-semibold flex items-center justify-center gap-2 transition ${
                  allItemsPacked
                    ? 'bg-teal-500 hover:bg-teal-600 text-white cursor-pointer'
                    : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed opacity-50'
                }`}
              >
                <CheckCircle2 size={20} />
                Mark as Packaged
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmation}
        title="Mark Order as Packaged?"
        message={`This will mark order #${order.order_id} as Packaged and remove it from the packaging queue.`}
        onConfirm={handleConfirmMarkAsPackaged}
        onCancel={() => setShowConfirmation(false)}
        isLoading={isSubmitting}
      />
    </>
  );
};

// Status Dropdown Component
const StatusDropdown: React.FC<{
  order: Order;
  onStatusChange: (order: Order, newStatus: number) => void;
}> = ({ order, onStatusChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Get order_status from localStorage or use default
  const orderStatus = localStorage.getItem(`order_${order.order_id}_status`) || '2';
  const currentStatusId = parseInt(orderStatus);
  const currentStatusName = ORDER_STEPS[currentStatusId];

  // ✅ Handle outside click to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`px-3 py-1 rounded-lg text-sm font-semibold text-white ${
          STATUS_DROPDOWN_COLORS[currentStatusName] || 'bg-gray-500'
        } flex items-center gap-2`}
      >
        {currentStatusName}
        <ChevronDown size={16} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-40">
          {Object.entries(ORDER_STEPS).map(([id, status]) => (
            <button
              key={id}
              onClick={() => {
                onStatusChange(order, parseInt(id));
                setIsOpen(false);
              }}
              className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${
                parseInt(id) === currentStatusId
                  ? 'bg-gray-100 dark:bg-gray-700 font-bold'
                  : ''
              } text-gray-900 dark:text-gray-100`}
            >
              {status}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// Main Component
export default function OrdersPageContent({ business = 'dispensary' }: { business?: string }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: 'order_id', ascending: false });
  const [filters, setFilters] = useState({
    search: '',
  });
  const [packagingModal, setPackagingModal] = useState({ isOpen: false, order: null as Order | null });
  const [totalOrders, setTotalOrders] = useState(0);

  const itemsPerPage = 10;

  // Fetch orders with pagination
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Get wholesale parameter from URL
        const searchParams = new URLSearchParams(window.location.search);
        const wholesale = searchParams.get("wholesale") || 0;
        
        // ✅ Fetch orders with pagination
        const ordersRes = await axios.get(
          `/api/business/save-whole-sale-order/?business=${business}&page=${currentPage}&wholesale=${wholesale}&curpage=packing`
        );

        // Parse response based on API structure
        if (ordersRes.data?.data?.orders) {
          setOrders(ordersRes.data.data.orders);
          setTotalOrders(ordersRes.data.data.total || 0);
        } else if (Array.isArray(ordersRes.data)) {
          setOrders(ordersRes.data);
          setTotalOrders(ordersRes.data.length);
        } else {
          setOrders([]);
          setTotalOrders(0);
        }
      } catch (error: any) {
        toast.error('Failed to load orders');
        console.error('Fetch error:', error);
        setOrders([]);
        setTotalOrders(0);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [business, currentPage]);

  // Filter and sort orders
  const filteredOrders = useMemo(() => {
    let result = [...orders];

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(order =>
        order.order_id.toLowerCase().includes(searchLower) ||
        order.full_name.toLowerCase().includes(searchLower)
      );
    }

    // Sort
    result.sort((a, b) => {
      if (sortConfig.key === 'order_id') {
        return sortConfig.ascending
          ? a.order_id.localeCompare(b.order_id)
          : b.order_id.localeCompare(a.order_id);
      } else if (sortConfig.key === 'full_name') {
        return sortConfig.ascending
          ? a.full_name.localeCompare(b.full_name)
          : b.full_name.localeCompare(a.full_name);
      }
      return 0;
    });

    return result;
  }, [orders, filters, sortConfig]);

  // Calculate pagination
  const totalPages = Math.ceil(totalOrders / itemsPerPage) || 1;
  const paginatedOrders = filteredOrders;

  const handleStatusChange = async (order: Order, newStatus: number) => {
    try {
      // Save to localStorage
      localStorage.setItem(`order_${order.order_id}_status`, newStatus.toString());

      // Update state
      setOrders(prev =>
        prev.map(o =>
          o.order_id === order.order_id ? { ...o } : o
        )
      );

      toast.success(`Order status updated to ${ORDER_STEPS[newStatus]}`);
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const handlePackagingComplete = () => {
    // ✅ Remove the completed order from the list immediately
    setOrders(prevOrders => 
      prevOrders.filter(o => o.order_id !== packagingModal.order?.order_id)
    );
    
    // Update total count
    setTotalOrders(prevTotal => Math.max(0, prevTotal - 1));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-white dark:bg-gray-900">
        <div className="text-center">
          <Loader2 className="animate-spin mx-auto mb-4 text-teal-600" size={40} />
          <p className="text-gray-600 dark:text-gray-400">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-100 dark:bg-gray-950 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Orders</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Manage and track your orders</p>
      </div>

      {/* Filters Section */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Search size={16} className="inline mr-2" />
              Search
            </label>
            <input
              type="text"
              placeholder="Order ID, Customer..."
              value={filters.search}
              onChange={(e) => setFilters({...filters, search: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
        {/* Header with Pagination */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-800 rounded-t-lg">
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

        {/* Table - REMOVED Checkbox and Total Cost columns */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800">
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
                <th className="px-6 py-4 text-left font-bold text-gray-700 dark:text-gray-300 text-sm">Total Items</th>
                <th className="px-6 py-4 text-left font-bold text-gray-700 dark:text-gray-300 text-sm">Status</th>
              </tr>
            </thead>
            <tbody>
              {paginatedOrders.length > 0 ? (
                paginatedOrders.map((order, idx) => {
                  return (
                    <tr
                      key={order.order_id}
                      className={`border-b border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition ${
                        idx % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800'
                      }`}
                    >
                      <td className="px-6 py-4">
                        <p className="font-bold text-blue-600 dark:text-blue-400">
                          <button
                            onClick={() => setPackagingModal({ isOpen: true, order })}
                            className="hover:underline cursor-pointer"
                          >
                            {order.order_id}
                          </button>
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-gray-900 dark:text-gray-100">{order.full_name}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                        {new Date().toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        {order.cart?.length || 0}
                      </td>
                      <td className="px-6 py-4">
                        <StatusDropdown order={order} onStatusChange={handleStatusChange} />
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    No orders found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Packaging Modal */}
      <PackagingDetailModal
        isOpen={packagingModal.isOpen}
        order={packagingModal.order}
        onClose={() => setPackagingModal({ isOpen: false, order: null })}
        onPackagingComplete={handlePackagingComplete}
      />
    </div>
  );
}