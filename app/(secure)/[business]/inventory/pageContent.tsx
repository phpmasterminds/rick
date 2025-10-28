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
  s_rooms: string | null;
  enable_product: string;
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

export default function PageContent({ business }: { business: string }) {
  const readableName = business.replace(/-/g, " ");

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedSubcategory, setSelectedSubcategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // API data state
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([{ name: 'All', subcategories: [] }]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  
  useEffect(() => {
    const fetchInventoryDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await axios.get(`/api/business/posinventory?business=${business}&page=${currentPage}`);
        
        if (response.data.status === 'success') {
          // Transform products data
          const productsData = response.data.data.products || [];
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
          throw new Error(response.data.message || 'Failed to load inventory');
        }
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch inventory';
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchInventoryDetails();
  }, []);

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

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setShowEditModal(true);
  };

  const handleSaveProduct = async () => {
    try {
      // Add your save API call here
      toast.success('Product updated successfully!');
      setShowEditModal(false);
      setEditingProduct(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update product');
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleItemsPerPageChange = (value: number) => {
    setItemsPerPage(value);
  };
  
  const handlePublishToggle = async (productId: string | number, currentStatus: boolean) => {
    //const newStatus = currentStatus === "1" ? "0" : "1";
		  const newStatus = !currentStatus;

    try {
      // Call your backend API
     /* await axios.post("/api/products/toggle", {
        product_id: productId,
        enable_product: newStatus,
      });
*/
      // Update the UI instantly (no need to reload)
     /* setCurrentProducts((prev) =>
        prev.map((p) =>
          p.id === productId ? { ...p, enable_product: newStatus } : p
        )
      );*/
	  toast.success(`Changed successfully`);
    } catch (error: any) {
	  toast.error(error);
    } 
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
  if (loading) {
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
  if (error) {
    return (
      <div className="flex-1 p-4 md:p-6 overflow-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Inventory Management</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Error loading inventory for {readableName}</p>
        </div>
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mb-4">
            <AlertCircle size={32} className="text-red-600 dark:text-red-400" />
          </div>
          <p className="text-gray-900 dark:text-gray-100 font-semibold mb-2">Failed to load inventory</p>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 text-white rounded-lg transition-all duration-300 hover:scale-105 accent-bg accent-hover"
          >
            Retry
          </button>
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
            <option value={25}>25 per page</option>
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
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Par</th>
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
					  <div className={`inline-flex w-8 h-8 rounded-full items-center justify-center ${product.is_safe === '1' ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'}`}>
						{product.is_safe === '1' ? <CheckCircle size={16} className="text-green-600 dark:text-green-400" /> : <X size={16} className="text-red-600 dark:text-red-400" />}
					  </div>
					</td>
					<td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">{product.s_rooms || 'None selected'}</td>
					<td className="px-4 py-4 text-center">
					  <label className="relative inline-flex items-center cursor-pointer">
						<input
						  type="checkbox"
						  checked={product.enable_product === "1"}
						  onChange={() =>
							handlePublishToggle(product.product_id, product.enable_product)
						  }
						  className="sr-only peer"
						/>
						<div
						  className={`w-11 h-6 rounded-full transition-all
							${product.enable_product ? "bg-green-500" : "bg-gray-300"} 
							peer-focus:ring-2 peer-focus:ring-green-300`}
						></div>
						<div
						  className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform
							${product.enable_product ? "translate-x-5" : ""}`}
						></div>
					  </label>
					</td>
                    <td className="px-4 py-4 text-right font-medium text-gray-900 dark:text-gray-100">${parseFloat(product.p_offer_price).toFixed(2)}</td>
                    <td className="px-4 py-4 text-center text-gray-600 dark:text-gray-400">{product.i_deals || 0}</td>
                    <td className="px-4 py-4 text-center"><input type="number" defaultValue={product.i_par || 0} className="w-16 text-center border dark:border-gray-700 rounded bg-white dark:bg-gray-800" /></td>
                    <td className="px-4 py-4 text-center"><input type="number" defaultValue={product.i_weight} className="w-16 text-center border dark:border-gray-700 rounded bg-white dark:bg-gray-800" /></td>
                    <td className="px-4 py-4 text-center font-semibold text-gray-900 dark:text-gray-100">{product.i_onhand}</td>
                    <td className="px-4 py-4 text-center"><input type="number" defaultValue={product.i_total_weight} className="w-16 text-center border dark:border-gray-700 rounded bg-white dark:bg-gray-800" /></td>
                    <td className="px-4 py-4 text-center">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => handleEditProduct(product)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><Edit size={16} /></button>
                        <button className="px-3 py-1 text-xs text-white rounded accent-bg accent-hover" >SAVE</button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={11} className="py-12 text-center">
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
                onClick={handleSaveProduct}
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
                  alert('Products imported successfully!');
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
