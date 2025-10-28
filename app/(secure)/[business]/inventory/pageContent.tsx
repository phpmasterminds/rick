'use client';
import React, { useState } from 'react';
import {
  Bell, Home, Megaphone, Package, CreditCard, Settings, HelpCircle,
  Plus, X, Upload, Target, DollarSign, MousePointer, Eye, CheckCircle,
  ChevronDown, ChevronRight, Menu, User, LogOut, Users, Folder, Edit
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import StatCard from "@/components/StatCard";
import Link from "next/link";

export default function PageContent({ business }: { business: string }) {
  const readableName = business.replace(/-/g, " ");

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedSubcategory, setSelectedSubcategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);

  // Category list
  const categories = [
    { name: 'All', subcategories: [] },
    { name: 'Flower', subcategories: ['Indica', 'Sativa', 'Hybrid', 'CBD'] },
    { name: 'Edibles', subcategories: ['Gummies', 'Chocolates', 'Baked Goods', 'Beverages', 'Tinctures'] },
    { name: 'Topicals', subcategories: ['Lotions', 'Balms', 'Patches', 'Bath Products'] },
    { name: 'Vaping', subcategories: ['Cartridges', 'Disposables', 'Pods', 'Batteries'] },
    { name: 'Pre Rolls', subcategories: ['Singles', 'Packs', 'Infused'] },
    { name: 'Hemp/CBD', subcategories: ['Flower', 'Oils', 'Capsules', 'Topicals'] },
    { name: 'Drinks', subcategories: ['Sodas', 'Teas', 'Coffee', 'Water', 'Energy Drinks'] },
    { name: 'Concentrates', subcategories: ['Wax', 'Shatter', 'Live Resin', 'Rosin', 'Distillate'] },
    { name: 'Shake/Trim', subcategories: ['Shake', 'Trim', 'Mixed'] },
  ];

  const currentCategory = categories.find(c => c.name === selectedCategory);
  const subcategories = currentCategory?.subcategories || [];

    // Product data
  const products = [
    { id: 1, name: '007 PREROLL', label: 'ITEM LABEL', coa: 'COA List', type: 'Pre Rolls', subtype: 'Singles', sku: '1A40E01000173EC000015311', safe: true, rooms: 'None selected', published: true, price: 3.75, deals: 0, par: 0, itemWeight: 1, onHand: 13, totalWeight: 13 },
    { id: 2, name: '1 Gram Cartridge | NORTHERN LIGHTS', label: 'ITEM LABEL', coa: 'COA List', type: 'Vaping', subtype: 'Cartridges', sku: '1A40E01000186440000077750', safe: true, rooms: 'None selected', published: true, price: 10.00, deals: 0, par: 0, itemWeight: 1, onHand: 9, totalWeight: 9 },
    { id: 3, name: '1 Gram Cartridge | STRAWBERRY COUGH', label: 'ITEM LABEL', coa: 'COA List', type: 'Vaping', subtype: 'Cartridges', sku: '1A40E01000186440000077751', safe: true, rooms: 'None selected', published: true, price: 10.00, deals: 0, par: 0, itemWeight: 1, onHand: 13, totalWeight: 13 },
    { id: 4, name: '1 Gram Cartridge | SUPER BOOF', label: 'ITEM LABEL', coa: 'COA List', type: 'Vaping', subtype: 'Cartridges', sku: '1A40E01000186440000077752', safe: true, rooms: 'None selected', published: true, price: 10.00, deals: 0, par: 0, itemWeight: 1, onHand: 14, totalWeight: 14 },
    { id: 5, name: 'Blue Dream Flower | Indica', label: 'ITEM LABEL', coa: 'COA List', type: 'Flower', subtype: 'Indica', sku: '1A40E01000186440000077754', safe: true, rooms: 'Storage A', published: true, price: 12.00, deals: 1, par: 10, itemWeight: 3.5, onHand: 25, totalWeight: 87.5 },
  ];

  const filteredProducts = products.filter(p =>
    (selectedCategory === 'All' || p.type === selectedCategory) &&
    (selectedSubcategory === 'All' || p.subtype === selectedSubcategory) &&
    (searchTerm === '' || p.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Handlers
  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    setSelectedSubcategory('All');
  };

  const handleEditProduct = (product: any) => {
    setEditingProduct(product);
    setShowEditModal(true);
  };

  const handleSaveProduct = () => {
    alert('Product updated successfully!');
    setShowEditModal(false);
    setEditingProduct(null);
  };

  return (
    <div className="flex-1 p-4 md:p-6 overflow-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Inventory Management</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your product inventory for {readableName}</p>
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

      {/* Search + Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <input
          type="text"
          placeholder="Search by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
        />
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
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                          <Package size={20} className="text-gray-400" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-gray-100">{product.name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{product.label} • {product.coa}</div>
                          <div className="text-xs text-gray-400 dark:text-gray-500">{product.type}</div>
                          <div className="text-xs text-gray-400 dark:text-gray-500 font-mono">{product.sku}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className={`inline-flex w-8 h-8 rounded-full items-center justify-center ${product.safe ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'}`}>
                        {product.safe ? <CheckCircle size={16} className="text-green-600 dark:text-green-400" /> : <X size={16} className="text-red-600 dark:text-red-400" />}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">{product.rooms}</td>
                    <td className="px-4 py-4 text-center">
                      <input type="checkbox" checked={product.published} readOnly />
                    </td>
                    <td className="px-4 py-4 text-right font-medium text-gray-900 dark:text-gray-100">${product.price.toFixed(2)}</td>
                    <td className="px-4 py-4 text-center text-gray-600 dark:text-gray-400">{product.deals}</td>
                    <td className="px-4 py-4 text-center"><input type="number" defaultValue={product.par} className="w-16 text-center border dark:border-gray-700 rounded bg-white dark:bg-gray-800" /></td>
                    <td className="px-4 py-4 text-center"><input type="number" defaultValue={product.itemWeight} className="w-16 text-center border dark:border-gray-700 rounded bg-white dark:bg-gray-800" /></td>
                    <td className="px-4 py-4 text-center font-semibold text-gray-900 dark:text-gray-100">{product.onHand}</td>
                    <td className="px-4 py-4 text-center"><input type="number" defaultValue={product.totalWeight} className="w-16 text-center border dark:border-gray-700 rounded bg-white dark:bg-gray-800" /></td>
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
                  <td colSpan={11} className="py-6 text-center text-gray-500">No products found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
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
                    defaultValue={editingProduct.price}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">On Hand</label>
                  <input
                    type="number"
                    defaultValue={editingProduct.onHand}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">SKU</label>
                <input
                  type="text"
                  defaultValue={editingProduct.sku}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-mono text-sm"
                  readOnly
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Type</label>
                <select
                  defaultValue={editingProduct.type}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                >
                  {categories.filter(c => c !== 'All').map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
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
