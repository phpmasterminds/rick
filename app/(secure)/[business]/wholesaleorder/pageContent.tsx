'use client';

import React, { useEffect, useState } from 'react';
import { ChevronDown, Trash2, Plus, AlertCircle, Loader2, X } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';

interface Customer {
  customer_id: string;
  account_name: string;
  contact_first_name: string;
  contact_last_name: string;
  contact_email: string;
  contact_mobile: string;
  billing_street: string;
  billing_city: string;
  billing_state: string;
  billing_postal_code: string;
}

interface Product {
  product_id: string;
  name: string;
  i_onhand: string;
  i_price?: string;
  p_offer_price?: string;
  cat_id: string;
  cat_name?: string;
}

interface Category {
  cat_id: string;
  cat_name: string;
}

interface ProductFlavor {
  flavor_id: string;
  flavor_name: string;
}

interface OrderItem {
  product_id: string;
  product_name: string;
  cat_name?: string;
  flavor_id?: string;
  flavor_name?: string;
  unit_price: number;
  quantity: number;
  subtotal: number;
}

interface BusinessLocation {
  location_name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
}

export default function WholesaleOrderPage({ business }: { business: string }) {
  const readableName = business.replace(/-/g, " ");

  // Form state
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedFlavor, setSelectedFlavor] = useState<ProductFlavor | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [shippingFee, setShippingFee] = useState<number>(0);
  const [orderNotes, setOrderNotes] = useState<string>('');

  // Data state
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [flavors, setFlavors] = useState<ProductFlavor[]>([]);
  const [shippingFrom, setShippingFrom] = useState<BusinessLocation | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);

  // Loading state
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingFlavors, setLoadingFlavors] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);

  // UI state
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [showFlavorDropdown, setShowFlavorDropdown] = useState(false);
  const [searchProduct, setSearchProduct] = useState('');

  // Fetch customers on mount
  useEffect(() => {
    fetchCustomers();
    fetchProducts();
    fetchCategories();
    fetchShippingLocation();
  }, [business]);

  // Filter products based on category and search
  useEffect(() => {
    let filtered = allProducts;

    // Filter by category
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(p => p.cat_id === selectedCategory);
    }

    // Filter by search term
    if (searchProduct.trim()) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(searchProduct.toLowerCase())
      );
    }

    setFilteredProducts(filtered);
  }, [selectedCategory, searchProduct, allProducts]);

  const fetchCustomers = async () => {
    try {
      setLoadingCustomers(true);
      const response = await axios.get(`/api/business/customers?limit=1000&business=${business}`);
      
      if (response.data.status === 'success') {
        setCustomers(response.data.data?.customers || []);
        /*if (customers.length === 0) {
          toast.info('No customers found. Please add customers first.');
        }*/
      } else {
        toast.error(response.data.message || 'Failed to load customers');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to load customers';
      toast.error(errorMessage);
      console.error('Fetch customers error:', error);
    } finally {
      setLoadingCustomers(false);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoadingProducts(true);
      const response = await axios.get(`/api/wholesale/products?business=${business}`);
      
      if (response.data.success) {
        setAllProducts(response.data.products || []);
      } else {
        toast.error(response.data.message || 'Failed to load products');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to load products';
      toast.error(errorMessage);
      console.error('Fetch products error:', error);
    } finally {
      setLoadingProducts(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`/api/wholesale/categories?business=${business}`);
      
      if (response.data.success) {
        setCategories(response.data.categories || []);
      }
    } catch (error: any) {
      console.error('Fetch categories error:', error);
    }
  };

  const fetchProductFlavors = async (productId: string) => {
    try {
      setLoadingFlavors(true);
      const response = await axios.get(`/api/wholesale/product-flavors/${productId}?business=${business}`);
      
      if (response.data.success) {
        setFlavors(response.data.flavors || []);
      } else {
        setFlavors([]);
      }
    } catch (error: any) {
      console.error('Fetch flavors error:', error);
      setFlavors([]);
    } finally {
      setLoadingFlavors(false);
    }
  };

  const fetchShippingLocation = async () => {
    try {
      const response = await axios.get(`/api/wholesale/shipping-location?business=${business}`);
      
      if (response.data.success) {
        setShippingFrom(response.data.location);
      }
    } catch (error: any) {
      console.error('Fetch shipping location error:', error);
    }
  };

  const handleCustomerSelect = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowCustomerDropdown(false);
  };

  const handleCategorySelect = (catId: string) => {
    setSelectedCategory(catId);
    setSelectedProduct(null);
    setSelectedFlavor(null);
    setSearchProduct('');
  };

  const handleProductSelect = async (product: Product) => {
    setSelectedProduct(product);
    setSelectedFlavor(null);
    setShowProductDropdown(false);
    
    // Fetch flavors for selected product
    await fetchProductFlavors(product.product_id);
  };

  const handleFlavorSelect = (flavor: ProductFlavor) => {
    setSelectedFlavor(flavor);
    setShowFlavorDropdown(false);
  };

  const handleAddProduct = () => {
    if (!selectedCustomer) {
      toast.warning('Please select a customer first');
      return;
    }

    if (!selectedProduct) {
      toast.warning('Please select a product');
      return;
    }

    if (quantity <= 0) {
      toast.warning('Please enter a valid quantity');
      return;
    }

    const available = parseInt(selectedProduct.i_onhand || '0');
    if (quantity > available) {
      toast.warning(`Only ${available} items available`);
      return;
    }

    const unitPrice = parseFloat(selectedProduct.p_offer_price || selectedProduct.i_price || '0');
    if (unitPrice === 0) {
      toast.warning('Product price not available');
      return;
    }

    // Check if item already exists
    const existingIndex = orderItems.findIndex(item =>
      item.product_id === selectedProduct.product_id &&
      item.flavor_id === selectedFlavor?.flavor_id
    );

    if (existingIndex >= 0) {
      // Update quantity if item exists
      const updatedItems = [...orderItems];
      updatedItems[existingIndex].quantity += quantity;
      updatedItems[existingIndex].subtotal = updatedItems[existingIndex].unit_price * updatedItems[existingIndex].quantity;
      setOrderItems(updatedItems);
      toast.success('Product quantity updated');
    } else {
      // Add new item
      const newItem: OrderItem = {
        product_id: selectedProduct.product_id,
        product_name: selectedProduct.name,
        cat_name: selectedProduct.cat_name,
        flavor_id: selectedFlavor?.flavor_id,
        flavor_name: selectedFlavor?.flavor_name,
        unit_price: unitPrice,
        quantity: quantity,
        subtotal: unitPrice * quantity,
      };

      setOrderItems([...orderItems, newItem]);
      toast.success('Product added to order');
    }

    // Reset form
    setSelectedProduct(null);
    setSelectedFlavor(null);
    setQuantity(1);
    setShowProductDropdown(false);
    setShowFlavorDropdown(false);
  };

  const handleRemoveItem = (index: number) => {
    const updatedItems = orderItems.filter((_, i) => i !== index);
    setOrderItems(updatedItems);
    toast.info('Product removed from order');
  };

  const handleUpdateQuantity = (index: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemoveItem(index);
      return;
    }

    const available = parseInt(allProducts.find(p => p.product_id === orderItems[index].product_id)?.i_onhand || '0');
    if (newQuantity > available) {
      toast.warning(`Only ${available} items available`);
      return;
    }

    const updatedItems = [...orderItems];
    updatedItems[index].quantity = newQuantity;
    updatedItems[index].subtotal = updatedItems[index].unit_price * newQuantity;
    setOrderItems(updatedItems);
  };

  const subtotal = orderItems.reduce((sum, item) => sum + item.subtotal, 0);
  const orderTotal = subtotal + shippingFee;

  const handlePlaceOrder = async () => {
    if (!selectedCustomer) {
      toast.error('Please select a customer');
      return;
    }

    if (orderItems.length === 0) {
      toast.error('Please add at least one product to the order');
      return;
    }

    try {
      setPlacingOrder(true);

      const payload = {
        business: business,
        customer_id: selectedCustomer.customer_id,
        customer_name: `${selectedCustomer.contact_first_name} ${selectedCustomer.contact_last_name}`,
        customer_email: selectedCustomer.contact_email,
        shipping_to: `${selectedCustomer.billing_street}, ${selectedCustomer.billing_city}, ${selectedCustomer.billing_state} ${selectedCustomer.billing_postal_code}`,
        shipping_from: shippingFrom
          ? `${shippingFrom.location_name}, ${shippingFrom.address}, ${shippingFrom.city}, ${shippingFrom.state} ${shippingFrom.zip}`
          : '',
        order_items: orderItems,
        subtotal: parseFloat(subtotal.toFixed(2)),
        shipping_fee: parseFloat(shippingFee.toFixed(2)),
        order_total: parseFloat(orderTotal.toFixed(2)),
        order_notes: orderNotes,
      };

      const response = await axios.post(`/api/wholesale/orders`, payload);

      if (response.data.success) {
        toast.success(response.data.message || 'Order placed successfully');
        
        // Reset form
        setSelectedCustomer(null);
        setSelectedProduct(null);
        setSelectedFlavor(null);
        setOrderItems([]);
        setOrderNotes('');
        setShippingFee(0);
        setQuantity(1);
        setSearchProduct('');
      } else {
        toast.error(response.data.message || 'Failed to place order');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to place order';
      toast.error(errorMessage);
      console.error('Place order error:', error);
    } finally {
      setPlacingOrder(false);
    }
  };

  return (
    <div className="flex-1 p-4 md:p-6 overflow-auto bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 capitalize">
          {readableName} - Wholesale Order
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Create and manage wholesale orders
        </p>
      </div>

      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Selection */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Select Customer
              </h3>

              <div className="relative">
                <button
                  onClick={() => setShowCustomerDropdown(!showCustomerDropdown)}
                  className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 text-left flex justify-between items-center hover:border-gray-400 dark:hover:border-gray-600 transition"
                >
                  <span>
                    {selectedCustomer
                      ? `${selectedCustomer.account_name} (${selectedCustomer.contact_email})`
                      : 'Select a customer...'}
                  </span>
                  <ChevronDown size={20} />
                </button>

                {showCustomerDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg z-20 max-h-80 overflow-y-auto">
                    {loadingCustomers ? (
                      <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                        <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                      </div>
                    ) : customers.length === 0 ? (
                      <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                        No customers available
                      </div>
                    ) : (
                      customers.map((customer) => (
                        <button
                          key={customer.customer_id}
                          onClick={() => handleCustomerSelect(customer)}
                          className="w-full text-left px-4 py-3 hover:bg-blue-50 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-700 last:border-b-0 text-gray-900 dark:text-gray-100 transition"
                        >
                          <div className="font-medium">
                            {customer.account_name}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {customer.account_name} - {customer.contact_email}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              {selectedCustomer && (
                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Shipping To:</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {selectedCustomer.billing_street}<br />
                    {selectedCustomer.billing_city}, {selectedCustomer.billing_state} {selectedCustomer.billing_postal_code}
                  </p>
                </div>
              )}
            </div>

            {/* Product Selection */}
            {selectedCustomer && (
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Select Products
                </h3>

                {/* Category Filter */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Category
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleCategorySelect('All')}
                      className={`px-4 py-2 rounded-lg font-medium transition ${
                        selectedCategory === 'All'
                          ? 'accent-bg accent-hover text-white'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                      }`}
                    >
                      All
                    </button>
                    {categories.map((category) => (
                      <button
                        key={category.cat_id}
                        onClick={() => handleCategorySelect(category.cat_id)}
                        className={`px-4 py-2 rounded-lg font-medium transition ${
                          selectedCategory === category.cat_id
                            ? 'accent-bg accent-hover text-white'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                        }`}
                      >
                        {category.cat_name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Product Search */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Search Product
                  </label>
                  <input
                    type="text"
                    placeholder="Search by product name..."
                    value={searchProduct}
                    onChange={(e) => setSearchProduct(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  />
                </div>

                {/* Product Selection */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Product
                  </label>

                  <div className="relative">
                    <button
                      onClick={() => setShowProductDropdown(!showProductDropdown)}
                      className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 text-left flex justify-between items-center hover:border-gray-400 dark:hover:border-gray-600 transition"
                    >
                      <span>{selectedProduct?.name || 'Select a product...'}</span>
                      <ChevronDown size={20} />
                    </button>

                    {showProductDropdown && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg z-20 max-h-80 overflow-y-auto">
                        {loadingProducts ? (
                          <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                            <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                          </div>
                        ) : filteredProducts.length === 0 ? (
                          <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                            No products available
                          </div>
                        ) : (
                          filteredProducts.map((product) => (
                            <button
                              key={product.product_id}
                              onClick={() => handleProductSelect(product)}
                              className="w-full text-left px-4 py-3 hover:bg-blue-50 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-700 last:border-b-0 text-gray-900 dark:text-gray-100 transition"
                            >
                              <div className="font-medium">{product.name}</div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                Available: {product.i_onhand} | Price: ${parseFloat(product.p_offer_price || product.i_price || '0').toFixed(2)}
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Flavor Selection */}
                {selectedProduct && flavors.length > 0 && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Flavor
                    </label>

                    <div className="relative">
                      <button
                        onClick={() => setShowFlavorDropdown(!showFlavorDropdown)}
                        className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 text-left flex justify-between items-center hover:border-gray-400 dark:hover:border-gray-600 transition"
                      >
                        <span>{selectedFlavor?.flavor_name || 'Select a flavor...'}</span>
                        <ChevronDown size={20} />
                      </button>

                      {showFlavorDropdown && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg z-20 max-h-64 overflow-y-auto">
                          {loadingFlavors ? (
                            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                              <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                            </div>
                          ) : flavors.length === 0 ? (
                            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                              No flavors available
                            </div>
                          ) : (
                            flavors.map((flavor) => (
                              <button
                                key={flavor.flavor_id}
                                onClick={() => handleFlavorSelect(flavor)}
                                className="w-full text-left px-4 py-3 hover:bg-blue-50 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-700 last:border-b-0 text-gray-900 dark:text-gray-100 transition"
                              >
                                {flavor.flavor_name}
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Quantity Input */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  />
                </div>

                {/* Add Product Button */}
                <button
                  onClick={handleAddProduct}
                  disabled={!selectedProduct || !selectedCustomer}
                  className="w-full px-4 py-3 accent-bg accent-hover disabled:bg-gray-400 text-white font-medium rounded-lg transition flex items-center justify-center gap-2 hover:scale-105 active:scale-95"
                >
                  <Plus size={20} />
                  Add Product to Order
                </button>
              </div>
            )}

            {/* Order Notes */}
            {selectedCustomer && (
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Order Notes
                </h3>
                <textarea
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  placeholder="Add any special instructions or notes for this order..."
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-32 resize-none transition"
                />
              </div>
            )}
          </div>

          {/* Right Column - Shipping & Summary */}
          {selectedCustomer && (
            <div className="space-y-6">
              {/* Shipping From */}
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-md overflow-hidden">
                <div className="accent-bg accent-hover text-white px-6 py-4 font-semibold">
                  Shipping From
                </div>
                {shippingFrom ? (
                  <div className="p-6 text-gray-700 dark:text-gray-300 space-y-1">
                    <p className="font-medium">{shippingFrom.location_name}</p>
                    <p className="text-sm">{shippingFrom.address}</p>
                    <p className="text-sm">{shippingFrom.city}, {shippingFrom.state}</p>
                    <p className="text-sm">{shippingFrom.zip}</p>
                  </div>
                ) : (
                  <div className="p-6 text-gray-500 dark:text-gray-400">
                    Loading location...
                  </div>
                )}
              </div>

              {/* Order Summary */}
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-md overflow-hidden sticky top-6">
                <div className="accent-bg accent-hover text-white px-6 py-4 font-semibold">
                  Order Summary
                </div>

                <div className="p-6">
                  {orderItems.length === 0 ? (
                    <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                      No items added yet
                    </p>
                  ) : (
                    <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
                      {orderItems.map((item, index) => (
                        <div
                          key={index}
                          className="flex justify-between items-start pb-4 border-b border-gray-200 dark:border-gray-700 last:border-b-0 last:pb-0"
                        >
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 dark:text-gray-100">
                              {item.product_name}
                            </p>
                            {item.flavor_name && (
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Flavor: {item.flavor_name}
                              </p>
                            )}
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              ${item.unit_price.toFixed(2)} × {item.quantity}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-gray-900 dark:text-gray-100">
                              ${item.subtotal.toFixed(2)}
                            </p>
                            <div className="flex items-center gap-1 mt-2">
                              <input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => handleUpdateQuantity(index, parseInt(e.target.value) || 1)}
                                className="w-12 px-1 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-center"
                              />
                              <button
                                onClick={() => handleRemoveItem(index)}
                                className="text-red-500 hover:text-red-700 p-1"
                                title="Remove item"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Totals */}
                  <div className="space-y-3 border-t border-gray-200 dark:border-gray-700 pt-4">
                    <div className="flex justify-between text-gray-700 dark:text-gray-300">
                      <span>Subtotal</span>
                      <span>${subtotal.toFixed(2)}</span>
                    </div>

                    <div className="flex justify-between items-center text-gray-700 dark:text-gray-300">
                      <label htmlFor="shipping-fee" className="text-sm">
                        Shipping Fee
                      </label>
                      <div className="flex items-center gap-2">
                        <span>$</span>
                        <input
                          id="shipping-fee"
                          type="number"
                          min="0"
                          step="0.01"
                          value={shippingFee}
                          onChange={(e) => setShippingFee(parseFloat(e.target.value) || 0)}
                          className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-right text-sm"
                        />
                      </div>
                    </div>

                    <div className="flex justify-between text-lg font-bold text-gray-900 dark:text-gray-100 pt-3 border-t border-gray-200 dark:border-gray-700">
                      <span>Order Total</span>
                      <span>${orderTotal.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Place Order Button */}
                  <button
                    onClick={handlePlaceOrder}
                    disabled={orderItems.length === 0 || !selectedCustomer || placingOrder}
                    className="w-full mt-6 px-6 py-3 accent-bg accent-hover disabled:bg-gray-400 text-white font-semibold rounded-lg transition duration-200 hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                  >
                    {placingOrder ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Placing Order...
                      </>
                    ) : (
                      'Place Order'
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}