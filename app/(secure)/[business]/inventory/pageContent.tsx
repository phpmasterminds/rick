'use client';
import React, { useEffect, useState } from 'react';
import {
  Bell, Home, Megaphone, Package, CreditCard, Settings, HelpCircle,
  Plus, X, Upload, Target, DollarSign, MousePointer, Eye, CheckCircle,
  ChevronDown, ChevronRight, Menu, User, LogOut, Users, Folder, Edit, 
  Loader2, AlertCircle, ChevronLeft
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import StatCard from "@/components/StatCard";
import Link from "next/link";
import axios from "axios";
import { toast } from 'react-toastify';

interface Product {
  product_id: string;
  name: string;
  cat_name: string;
  strain_cat: string;
  tag_no: string;
  is_safe: string;
  is_pos: string; // "0" or "1"
  s_rooms: string | null;
  enable_product: string; // "0" or "1" for PAGE
  p_offer_price: string;
  i_deals: string | null;
  i_par: string | null;
  i_weight: string;
  i_onhand: string;
  i_total_weight: string;
  text_parsed: string;
  thc: string;
  cbd: string;
}

interface Category {
  cat_id: string;
  cat_name: string;
  sub: Array<{
    cat_id: string;
    cat_name: string;
  }>;
}

interface DealData {
  amount: string;
  percentage: string;
  scope: string;
  membership: string;
  type: string;
  minimum_quantity: string;
  minimum_spending: string;
  quantity_allowed: string;
  start_date: string;
  end_date: string;
  is_24_hours: boolean;
  days_of_week: string[];
}

// Reusable PublishedToggle Component - Toggle Switches
function PublishedToggle({ product, onToggle }: { product: Product, onToggle: (id: string, status: string, type?: string) => void }) {
  return (
    <div className="flex flex-col gap-3">
      {/* POS Toggle */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">POS</span>
        <button
          onClick={() => {
            const isCurrentlyPOS = product.is_pos === '1';
            onToggle(product.product_id, product.is_pos, 'POS');
          }}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all ${
            product.is_pos === '1'
              ? 'accent-bg'
              : 'bg-gray-300 dark:bg-gray-600'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              product.is_pos === '1' ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* PAGE Toggle */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Page</span>
        <button
          onClick={() => {
            const isCurrentlyPAGE = product.enable_product === '1';
            onToggle(product.product_id, product.enable_product, 'PAGE');
          }}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all ${
            product.enable_product === '1'
              ? 'accent-bg'
              : 'bg-gray-300 dark:bg-gray-600'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              product.enable_product === '1' ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
    </div>
  );
}

export default function PageContent({ business }: { business: string }) {
  const readableName = business.replace(/-/g, " ");

  // Helper function to show error toast
  const showErrorToast = (error: any, defaultMessage: string = 'Something went wrong') => {
    const errorMessage = error.response?.data?.error?.message || 
                        error.response?.data?.message || 
                        error.message || 
                        defaultMessage;
    toast.error(errorMessage, {
      position: 'bottom-center',
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });
  };

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedSubcategory, setSelectedSubcategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showDealsModal, setShowDealsModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [dealsProduct, setDealsProduct] = useState<Product | null>(null);
  const [dealData, setDealData] = useState<DealData>({
    amount: '',
    percentage: '',
    scope: 'All Rooms',
    membership: 'Regular',
    type: 'Select',
    minimum_quantity: '',
    minimum_spending: '',
    quantity_allowed: '',
    start_date: '',
    end_date: '',
    is_24_hours: false,
    days_of_week: []
  });
  
  // API data state
  const [products, setProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [apiPage, setApiPage] = useState(1);
  const [rooms, setRooms] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([{ name: 'All', subcategories: [] }]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [showSafeModal, setShowSafeModal] = useState(false);
  const [safeProduct, setSafeProduct] = useState<Product | null>(null);
  const [safeValues, setSafeValues] = useState({ onHand: 0, safeStorage: 0, posAvailable: 0 });
  
  // Row editing state for weight
  const [editingRows, setEditingRows] = useState<{ [key: string]: { weight: string; totalWeight: string } }>({});
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(30);
  
  useEffect(() => {
    const fetchInventoryDetails = async (page: number = 1) => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await axios.get(`/api/business/posinventory?business=${business}&page=${page}`);
        
        if (response.data.status === 'success') {
          const productsData = response.data.data.products || [];
          const roomsData = response.data.data.aRooms || [];
          
          setRooms(roomsData);
          setTotalProducts(response.data.data.total || 0);
          
          if (page === 1) {
            setAllProducts(productsData);
            setProducts(productsData);
            
            // Transform categories data
            const categoriesData = response.data.data.categories || {};
            const transformedCategories = [
              { name: 'All', subcategories: [] },
              ...Object.values(categoriesData).map((cat: any) => ({
                name: cat.cat_name,
                subcategories: cat.sub?.map((s: any) => s.cat_name) || []
              }))
            ];
            setCategories(transformedCategories);
            
            toast.success(`Loaded ${productsData.length} products successfully`);
          } else {
            setAllProducts(prev => [...prev, ...productsData]);
            setProducts(prev => [...prev, ...productsData]);
          }
        } else if (response.data.status === 'failed') {
          // Handle failed status without throwing
          let errorMsg = 'Failed to load inventory';
          
          if (response.data.error?.message) {
            errorMsg = response.data.error.message;
          } else if (response.data.message) {
            errorMsg = response.data.message;
          }
          
          // Strip HTML tags if present
          errorMsg = errorMsg.replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]*>/g, '');
          
          setError(errorMsg);
          toast.error(errorMsg, {
            position: 'bottom-center',
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          });
        } else {
          throw new Error('Unexpected response status');
        }
      } catch (error: any) {
        let errorMessage = 'Failed to fetch inventory';
        
        // Extract error message from various sources
        if (error.response?.data?.error?.message) {
          errorMessage = error.response.data.error.message;
        } else if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        // Strip HTML tags if present
        errorMessage = errorMessage.replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]*>/g, '');
        
        setError(errorMessage);
        toast.error(errorMessage, {
          position: 'bottom-center',
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchInventoryDetails(apiPage);
  }, [apiPage, business]);
  
  useEffect(() => {
    // Load more pages if needed
    if (allProducts.length < totalProducts && !loading) {
      setApiPage(prev => prev + 1);
    }
  }, [allProducts.length, totalProducts, loading]);

  const currentCategory = categories.find(c => c.name === selectedCategory);
  const subcategories = currentCategory?.subcategories || [];

  const filteredProducts = products.filter(p =>
    (selectedCategory === 'All' || p.cat_name === selectedCategory) &&
    (selectedSubcategory === 'All' || p.strain_cat === selectedSubcategory) &&
    (searchTerm === '' || p.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Pagination calculations
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProducts = filteredProducts.slice(startIndex, endIndex);
  
  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, selectedSubcategory, searchTerm, itemsPerPage]);

  // Handlers
  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    setSelectedSubcategory('All');
  };

  const handleSafeClick = (product: Product) => {
    const onHand = parseInt(product.i_onhand) || 0;
    const safeStorage = 0; // Calculate from API if available
    setSafeProduct(product);
    setSafeValues({
      onHand,
      safeStorage,
      posAvailable: onHand - safeStorage
    });
    setShowSafeModal(true);
  };

  const handleSafeSubmit = async () => {
    try {
      // API call to update safe storage
      const response = await axios.post('/api/business/update-safe-storage', {
        product_id: safeProduct?.product_id,
        safe_storage: safeValues.safeStorage
      });
      
      if (response.data.status === 'success') {
        toast.success('Safe storage updated successfully!');
        setShowSafeModal(false);
        // Refresh the product data
        setApiPage(1);
        setAllProducts([]);
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error?.message || error.response?.data?.message || 'Failed to update safe storage';
      toast.error(errorMessage, {
        position: 'bottom-center',
        autoClose: 5000,
      });
    }
  };

  const handleTogglePublish = async (productId: string, currentStatus: string, publishType?: string) => {
    try {
      const newStatus = currentStatus === '1' ? '0' : '1';
      
      const payload: any = {
        product_id: productId,
      };

      if (publishType === 'POS') {
        payload.is_pos = newStatus;
      } else if (publishType === 'PAGE') {
        payload.enable_product = newStatus;
      }
      
      const response = await axios.post('/api/business/toggle-product', payload);
      
      if (response.data.status === 'success') {
        // Update local state
        const updateFn = (prev: Product[]) => prev.map(p => 
          p.product_id === productId 
            ? { 
                ...p,
                ...(publishType === 'POS' && { is_pos: newStatus }),
                ...(publishType === 'PAGE' && { enable_product: newStatus })
              }
            : p
        );

        setProducts(updateFn);
        setAllProducts(updateFn);
        
        const typeLabel = publishType === 'POS' ? 'POS' : 'Page';
        const action = newStatus === '1' ? 'enabled for' : 'disabled for';
        toast.success(`Product ${action} ${typeLabel}!`);
      }
    } catch (error: any) {
      showErrorToast(error, 'Failed to update product');
    }
  };

  const handleToggleDeals = async (productId: string, currentDeals: string | null) => {
    try {
      const newDeals = currentDeals === '1' ? '0' : '1';
      const response = await axios.post('/api/business/toggle-deals', {
        product_id: productId,
        i_deals: newDeals
      });
      
      if (response.data.status === 'success') {
        // Update local state
        setProducts(prev => prev.map(p => 
          p.product_id === productId ? { ...p, i_deals: newDeals } : p
        ));
        setAllProducts(prev => prev.map(p => 
          p.product_id === productId ? { ...p, i_deals: newDeals } : p
        ));
        toast.success(`Deals ${newDeals === '1' ? 'enabled' : 'disabled'} successfully!`);
      }
    } catch (error: any) {
      showErrorToast(error, 'Failed to toggle deals');
    }
  };

  const handleRoomChange = async (productId: string, roomId: string) => {
    try {
      const response = await axios.post('/api/business/update-room', {
        product_id: productId,
        room_id: roomId
      });
      
      if (response.data.status === 'success') {
        // Update local state
        setProducts(prev => prev.map(p => 
          p.product_id === productId ? { ...p, s_rooms: roomId } : p
        ));
        setAllProducts(prev => prev.map(p => 
          p.product_id === productId ? { ...p, s_rooms: roomId } : p
        ));
        toast.success('Room updated successfully!');
      }
    } catch (error: any) {
      showErrorToast(error, 'Failed to update room');
    }
  };

  const handleEditClick = (product: Product) => {
    setEditingProduct(product);
    setShowEditModal(true);
  };

  const handleSaveProduct = async (product?: Product) => {
    try {
      const productToSave = product || editingProduct;
      if (!productToSave) return;
      
      // API call to update product
      const response = await axios.post('/api/business/update-product', {
        product_id: productToSave.product_id,
        // Add fields that need to be saved
      });
      
      if (response.data.status === 'success') {
        toast.success('Product updated successfully!');
        setShowEditModal(false);
        setEditingProduct(null);
      }
    } catch (error: any) {
      showErrorToast(error, 'Failed to update product');
    }
  };

  const handleDealsClick = (product: Product) => {
    setDealsProduct(product);
    setDealData({
      amount: '',
      percentage: '',
      scope: 'All Rooms',
      membership: 'Regular',
      type: 'Select',
      minimum_quantity: '',
      minimum_spending: '',
      quantity_allowed: '',
      start_date: '',
      end_date: '',
      is_24_hours: false,
      days_of_week: []
    });
    setShowDealsModal(true);
  };

  const handleDealSubmit = async () => {
    try {
      const response = await axios.post('/api/business/add-deal', {
        product_id: dealsProduct?.product_id,
        ...dealData
      });
      
      if (response.data.status === 'success') {
        toast.success('Deal created successfully!');
        setShowDealsModal(false);
      }
    } catch (error: any) {
      showErrorToast(error, 'Failed to create deal');
    }
  };

  // Weight handlers
  const handleWeightChange = (productId: string, newWeight: string) => {
    const product = products.find(p => p.product_id === productId);
    if (!product) return;

    const weight = parseFloat(newWeight) || 0;
    const onHand = parseInt(product.i_onhand) || 0;
    const totalWeight = weight * onHand;

    setEditingRows(prev => ({
      ...prev,
      [productId]: {
        weight: newWeight,
        totalWeight: totalWeight.toString()
      }
    }));
  };

  const handleSaveWeight = async (product: Product) => {
    try {
      const rowData = editingRows[product.product_id];
      if (!rowData) return;

      const response = await axios.post('/api/business/update-product-weight', {
        product_id: product.product_id,
        i_weight: rowData.weight,
        i_total_weight: rowData.totalWeight
      });

      if (response.data.status === 'success') {
        // Update products list
        setProducts(prev => prev.map(p => 
          p.product_id === product.product_id
            ? { ...p, i_weight: rowData.weight, i_total_weight: rowData.totalWeight }
            : p
        ));
        setAllProducts(prev => prev.map(p => 
          p.product_id === product.product_id
            ? { ...p, i_weight: rowData.weight, i_total_weight: rowData.totalWeight }
            : p
        ));

        // Clear editing state
        setEditingRows(prev => {
          const newState = { ...prev };
          delete newState[product.product_id];
          return newState;
        });

        toast.success('Weight updated successfully!', {
          position: 'bottom-center',
          autoClose: 3000,
        });
      }
    } catch (error: any) {
      showErrorToast(error, 'Failed to update weight');
    }
  };

  const handleCancelEdit = (productId: string) => {
    setEditingRows(prev => {
      const newState = { ...prev };
      delete newState[productId];
      return newState;
    });
  };

  const handleToggleDayOfWeek = (day: string) => {
    setDealData(prev => ({
      ...prev,
      days_of_week: prev.days_of_week.includes(day)
        ? prev.days_of_week.filter(d => d !== day)
        : [...prev.days_of_week, day]
    }));
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleItemsPerPageChange = (value: number) => {
    setItemsPerPage(value);
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  // Loading state
  if (loading && allProducts.length === 0) {
    return (
      <div className="flex-1 p-4 md:p-6 overflow-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Inventory Management</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Loading inventory for {readableName}</p>
        </div>
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 size={48} className="animate-spin text-blue-500 mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading products...</p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">This may take a few moments</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && allProducts.length === 0) {
    return (
      <div className="flex-1 p-4 md:p-6 overflow-auto bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Inventory Management</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Error loading inventory for {readableName}</p>
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
                Failed to Load Inventory
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
    <div className="flex-1 p-4 md:p-6 overflow-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Inventory Management</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Manage your product inventory for {readableName} • {filteredProducts.length} products
          {loading && allProducts.length > 0 && <span className="ml-2 text-blue-500">(Loading more...)</span>}
        </p>
      </div>

      {/* Category Filters */}
      <div className="flex flex-wrap gap-2 mb-6 overflow-x-auto pb-2">
        {categories.map((cat) => (
          <button
            key={cat.name}
            onClick={() => handleCategoryChange(cat.name)}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all duration-300 ${
              selectedCategory === cat.name
                ? 'text-white shadow-lg accent-bg accent-hover'
                : 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Subcategories */}
      {subcategories.length > 0 && (
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Subcategory</label>
          <div className="flex flex-wrap gap-2">
            {['All', ...subcategories].map((sub) => (
              <button
                key={sub}
                onClick={() => setSelectedSubcategory(sub)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                  selectedSubcategory === sub
                    ? 'text-white shadow-md accent-bg accent-hover'
                    : 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700'
                }`}
              >
                {sub}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search + Actions + Items Per Page */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="flex gap-2 items-center">
          <input
            type="text"
            placeholder="Search by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          />
          <select
            value={itemsPerPage}
            onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
            className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          >
            <option value={10}>10 per page</option>
            <option value={30}>30 per page</option>
            <option value={50}>50 per page</option>
            <option value={100}>100 per page</option>
          </select>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowImportModal(true)}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700 transition-all duration-300 flex items-center gap-2"
          >
            <Upload size={18} />
            <span>Import From Metrc</span>
          </button>
          <button
            className="px-4 py-2 text-white rounded-lg transition-all duration-300 hover:scale-105 flex items-center gap-2 accent-bg accent-hover"
          >
            <Plus size={18} />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Item Name</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Safe</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Rooms</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Published</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Price</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Deals</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Weight</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">On Hand</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Total</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {currentProducts.length > 0 ? (
                currentProducts.map((product) => (
                  <tr key={product.product_id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                          <Package size={20} className="text-gray-400" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-gray-100">{product.name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {product.text_parsed || 'No description'} • THC: {product.thc}% • CBD: {product.cbd}%
                          </div>
                          <div className="text-xs text-gray-400 dark:text-gray-500">{product.cat_name}</div>
                          <div className="text-xs text-gray-400 dark:text-gray-500 font-mono">{product.tag_no}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <button
                        onClick={() => handleSafeClick(product)}
                        className={`inline-flex w-8 h-8 rounded-full items-center justify-center cursor-pointer transition-colors ${product.is_safe === '1' ? 'bg-green-100 dark:bg-green-900 hover:bg-green-200 dark:hover:bg-green-800' : 'bg-red-100 dark:bg-red-900 hover:bg-red-200 dark:hover:bg-red-800'}`}
                      >
                        {product.is_safe === '1' ? <CheckCircle size={16} className="text-green-600 dark:text-green-400" /> : <X size={16} className="text-red-600 dark:text-red-400" />}
                      </button>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">
                      <select
                        value={product.s_rooms || ''}
                        onChange={(e) => handleRoomChange(product.product_id, e.target.value)}
                        className="px-2 py-1 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-sm"
                      >
                        <option value="">None selected</option>
                        {rooms.map((room) => (
                          <option key={room.room_id} value={room.room_id}>
                            {room.room_name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <PublishedToggle 
                        product={product}
                        onToggle={handleTogglePublish}
                      />
                    </td>
                    <td className="px-4 py-4 text-right font-medium text-gray-900 dark:text-gray-100">${parseFloat(product.p_offer_price).toFixed(2)}</td>
                    <td className="px-4 py-4 text-center">
                      <button
                        onClick={() => handleDealsClick(product)}
                        className={`inline-flex items-center justify-center w-8 h-8 rounded-full cursor-pointer transition-colors ${
                          product.i_deals === '1'
                            ? 'bg-blue-100 dark:bg-blue-900 hover:bg-blue-200 dark:hover:bg-blue-800 text-blue-600'
                            : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600'
                        }`}
                        title="Click to manage deals"
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <input 
                        type="number" 
                        step="0.01"
                        value={editingRows[product.product_id]?.weight ?? product.i_weight}
                        onChange={(e) => handleWeightChange(product.product_id, e.target.value)}
                        className="w-16 text-center border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-4 py-4 text-center font-semibold text-gray-900 dark:text-gray-100">{product.i_onhand}</td>
                    <td className="px-4 py-4 text-center bg-gray-50 dark:bg-gray-800/50 rounded">
                      <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {editingRows[product.product_id]?.totalWeight ?? product.i_total_weight}
                      </div>
                      
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="flex justify-center gap-2">
                        {editingRows[product.product_id] ? (
                          <>
                            <button 
                              onClick={() => handleCancelEdit(product.product_id)}
                              className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
                            >
                              Cancel
                            </button>
                            <button 
                              onClick={() => handleSaveWeight(product)}
                              className="px-3 py-1 text-xs text-white rounded accent-bg accent-hover transition-all duration-300 hover:scale-105" 
                            >
                              SAVE
                            </button>
                          </>
                        ) : (
                          <button onClick={() => handleEditClick(product)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                            <Edit size={16} className="text-gray-600 dark:text-gray-400" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="py-12 text-center">
                    <Package size={48} className="mx-auto mb-4 text-gray-300 dark:text-gray-700" />
                    <p className="text-gray-500 dark:text-gray-400 font-medium">No products found</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Try adjusting your filters or search term</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {filteredProducts.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Showing {startIndex + 1} to {Math.min(endIndex, filteredProducts.length)} of {filteredProducts.length} products
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`p-2 rounded-lg border ${
                    currentPage === 1
                      ? 'border-gray-200 dark:border-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                      : 'border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <ChevronLeft size={18} />
                </button>
                
                <div className="flex gap-1">
                  {getPageNumbers().map((page, index) => (
                    page === '...' ? (
                      <span key={`ellipsis-${index}`} className="px-3 py-2 text-gray-400">...</span>
                    ) : (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page as number)}
                        className={`px-3 py-2 rounded-lg font-medium ${
                          currentPage === page
                            ? 'text-white accent-bg'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                      >
                        {page}
                      </button>
                    )
                  ))}
                </div>
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`p-2 rounded-lg border ${
                    currentPage === totalPages
                      ? 'border-gray-200 dark:border-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                      : 'border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Safe Storage Modal */}
      {showSafeModal && safeProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Safe Storage</h2>
              <button
                onClick={() => setShowSafeModal(false)}
                className="w-8 h-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">On Hand</label>
                <input
                  type="number"
                  value={safeValues.onHand}
                  readOnly
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Safe Storage</label>
                <input
                  type="number"
                  value={safeValues.safeStorage}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 0;
                    setSafeValues(prev => ({
                      ...prev,
                      safeStorage: Math.min(val, prev.onHand),
                      posAvailable: prev.onHand - Math.min(val, prev.onHand)
                    }));
                  }}
                  min="0"
                  max={safeValues.onHand}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Pos Available</label>
                <input
                  type="number"
                  value={safeValues.posAvailable}
                  readOnly
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 dark:border-gray-800 flex justify-end gap-3">
              <button
                onClick={() => setShowSafeModal(false)}
                className="px-6 py-3 bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700 transition-all duration-300"
              >
                Cancel
              </button>
              <button
                onClick={handleSafeSubmit}
                className="px-6 py-3 text-white rounded-lg transition-all duration-300 hover:scale-105 accent-bg accent-hover"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deals Modal */}
      {showDealsModal && dealsProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-900">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Deals</h2>
              <button
                onClick={() => setShowDealsModal(false)}
                className="w-8 h-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Product Header */}
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                  <Package size={40} className="text-gray-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{dealsProduct.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{dealsProduct.tag_no}</p>
                </div>
              </div>

              {/* Amount and Percentage Row */}
              <div className="flex items-end gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Amount</label>
                  <div className="flex items-center">
                    <span className="text-2xl font-bold text-green-600 bg-green-50 dark:bg-green-900/20 px-4 py-2 rounded-l-lg">$</span>
                    <input
                      type="number"
                      value={dealData.amount}
                      onChange={(e) => setDealData(prev => ({ ...prev, amount: e.target.value }))}
                      placeholder="0"
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-r-lg focus:outline-none focus:ring-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                </div>

                <div className="flex-1">
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Percentage</label>
                  <div className="flex items-center">
                    <input
                      type="number"
                      value={dealData.percentage}
                      onChange={(e) => setDealData(prev => ({ ...prev, percentage: e.target.value }))}
                      placeholder="0"
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-l-lg focus:outline-none focus:ring-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    />
                    <span className="text-2xl font-bold text-green-600 bg-green-50 dark:bg-green-900/20 px-4 py-2 rounded-r-lg">%</span>
                  </div>
                </div>
              </div>

              {/* Scope, Membership, Type */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Scope</label>
                  <select
                    value={dealData.scope}
                    onChange={(e) => setDealData(prev => ({ ...prev, scope: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  >
                    <option>All Rooms</option>
                    {rooms.map(room => (
                      <option key={room.room_id} value={room.room_name}>{room.room_name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Membership</label>
                  <select
                    value={dealData.membership}
                    onChange={(e) => setDealData(prev => ({ ...prev, membership: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  >
                    <option>Regular</option>
                    <option>Premium</option>
                    <option>VIP</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Type</label>
                  <select
                    value={dealData.type}
                    onChange={(e) => setDealData(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  >
                    <option>Select</option>
                    <option>Discount</option>
                    <option>Bundle</option>
                    <option>Bundle Discount</option>
                  </select>
                </div>
              </div>

              {/* Minimum Quantity, Spending, Allowed */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Minimum Quantity</label>
                  <input
                    type="number"
                    value={dealData.minimum_quantity}
                    onChange={(e) => setDealData(prev => ({ ...prev, minimum_quantity: e.target.value }))}
                    placeholder="0"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Minimum Spending</label>
                  <input
                    type="number"
                    step="0.01"
                    value={dealData.minimum_spending}
                    onChange={(e) => setDealData(prev => ({ ...prev, minimum_spending: e.target.value }))}
                    placeholder="$0.00"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Quantity Allowed</label>
                  <input
                    type="number"
                    value={dealData.quantity_allowed}
                    onChange={(e) => setDealData(prev => ({ ...prev, quantity_allowed: e.target.value }))}
                    placeholder="0"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  />
                </div>
              </div>

              {/* Start and End Date */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Start Date</label>
                  <input
                    type="time"
                    value={dealData.start_date}
                    onChange={(e) => setDealData(prev => ({ ...prev, start_date: e.target.value }))}
                    disabled={dealData.is_24_hours}
                    className={`w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 ${
                      dealData.is_24_hours
                        ? 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-500 cursor-not-allowed opacity-50'
                        : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                    }`}
                  />
                </div>

                <div className="flex items-end gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">End Date</label>
                    <input
                      type="time"
                      value={dealData.end_date}
                      onChange={(e) => setDealData(prev => ({ ...prev, end_date: e.target.value }))}
                      disabled={dealData.is_24_hours}
                      className={`w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 ${
                        dealData.is_24_hours
                          ? 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-500 cursor-not-allowed opacity-50'
                          : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                      }`}
                    />
                  </div>
                  <label className="flex items-center gap-2 mb-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={dealData.is_24_hours}
                      onChange={(e) => setDealData(prev => ({ 
                        ...prev, 
                        is_24_hours: e.target.checked,
                        start_date: e.target.checked ? '' : prev.start_date,
                        end_date: e.target.checked ? '' : prev.end_date
                      }))}
                      className="w-4 h-4 rounded cursor-pointer"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">24 Hours</span>
                  </label>
                </div>
              </div>

              {/* Days of Week */}
              <div>
                <label className="block text-sm font-medium mb-3 text-gray-700 dark:text-gray-300">Days of Week</label>
                <div className="flex gap-2 flex-wrap">
                  {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
                    <button
                      key={day}
                      onClick={() => handleToggleDayOfWeek(day)}
                      className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                        dealData.days_of_week.includes(day)
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-800 flex justify-end gap-3">
              <button
                onClick={() => setShowDealsModal(false)}
                className="px-6 py-3 bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700 transition-all duration-300"
              >
                Cancel
              </button>
              <button
                onClick={handleDealSubmit}
                className="px-6 py-3 text-white rounded-lg transition-all duration-300 hover:scale-105 accent-bg accent-hover"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
	  
	  {/* Edit Product Modal */}
      {showEditModal && editingProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-900">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Edit Product</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="w-8 h-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Product Name</label>
                <input
                  type="text"
                  defaultValue={editingProduct.name}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Price</label>
                  <input
                    type="number"
                    step="0.01"
                    defaultValue={editingProduct.p_offer_price}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">On Hand</label>
                  <input
                    type="number"
                    defaultValue={editingProduct.i_onhand}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">SKU</label>
                <input
                  type="text"
                  defaultValue={editingProduct.tag_no}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-mono text-sm"
                  readOnly
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Type</label>
                <select
                  defaultValue={editingProduct.cat_name}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                >
                  {categories
					  .filter(c => c.name !== 'All')
					  .map(cat => (
						<option key={cat.name} value={cat.name}>
						  {cat.name}
						</option>
					  ))}
                </select>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 dark:border-gray-800 flex justify-end gap-3">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-6 py-3 bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700 transition-all duration-300"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSaveProduct()}
                className="px-6 py-3 text-white rounded-lg transition-all duration-300 hover:scale-105 accent-bg accent-hover"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import from Metrc Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Import from Metrc</h2>
              <button
                onClick={() => setShowImportModal(false)}
                className="w-8 h-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="text-center py-8">
                <Upload size={48} className="mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600 dark:text-gray-400 mb-4">Select Metrc package to import</p>
                <input
                  type="text"
                  placeholder="Enter package ID..."
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 mb-4"
                />
                <p className="text-sm text-gray-500 dark:text-gray-400">or</p>
                <button
                  className="mt-4 px-6 py-3 text-white rounded-lg transition-all duration-300 hover:scale-105 accent-bg accent-hover "
                >
                  Browse Metrc Packages
                </button>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 dark:border-gray-800 flex justify-end gap-3">
              <button
                onClick={() => setShowImportModal(false)}
                className="px-6 py-3 bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700 transition-all duration-300"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  toast.success('Products imported successfully!');
                  setShowImportModal(false);
                }}
                className="px-6 py-3 text-white rounded-lg transition-all duration-300 hover:scale-105 accent-bg accent-hover"
              >
                Import
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}