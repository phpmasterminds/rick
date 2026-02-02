'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  X,
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';
import ProductCard from './components/ProductCard';
import { useShopCart, CartItem } from "../../contexts/ShopCartContext";

// Helper function to get product image URL
const getProductImageUrl = (product: any): string => {
  // Try med_image_path first (from API)
  if (product.med_image_path && typeof product.med_image_path === 'string') {
    if (product.med_image_path.trim()) {
      return product.med_image_path;
    }
  }
  
  // Try image_url
  if (product.image_url && typeof product.image_url === 'string') {
    if (product.image_url.trim()) {
      return product.image_url;
    }
  }
  
  // Default fallback
  return 'https://www.api.natureshigh.com/PF.Site/Apps/core-business/assets/no_image.png';
};

interface Product {
  product_id: string;
  name: string;
  cat_name: string;
  strain?: string;
  p_offer_price: string;
  i_onhand: string;
  thc?: string;
  cbd?: string;
  is_safe?: string;
  text_parsed?: string;
  image_url?: string;
  med_image_path?: string;
  flavors?: any[] | string[];
  variants?: string | string[];
  product_code?: string;
  batch_id?: string;
  med_measurements?: string;
  enable_catalog?: string | number;
  bus_title?: string;
  business_url?: string;
  business_user_id?: string;
  page_id?: string;
  is_sample?: string | number;
  med_image?: string;
}

interface Category {
  cat_id: string;
  cat_name: string;
  sub?: Category[];
}

interface PageCache {
  products: Product[];
  total: number;
  totalPages: number;
}

export default function PageContent() {
  const { addToCart } = useShopCart();

  // Products state
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Background loading state for initial 200 products load
  const [isLoadingBackground, setIsLoadingBackground] = useState(false);
  const [backgroundLoadProgress, setBackgroundLoadProgress] = useState(0);
  const [totalLoadedInBackground, setTotalLoadedInBackground] = useState(0);

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState('default');
  
  // Pagination state - 30 products per page (from API)
  const [currentPage, setCurrentPage] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 30; // Display 30 per page (API limit)

  // Modal state
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Cache for page data to avoid redundant API calls
  const pageCache = useRef<Map<number, PageCache>>(new Map());
  const lastTotalRef = useRef<number>(0);
  const backgroundLoadingRef = useRef<boolean>(false);

  // Initial load
  useEffect(() => {
    const initializeData = async () => {
      await fetchProducts(1);
      fetchCategories();
      // Start background loading of first 200 products
      loadFirst200ProductsInBackground();
    };
    initializeData();
  }, []);

  // Apply filters when products, search, category, subcategory, or sort changes
  useEffect(() => {
    applyFiltersAndSort();
  }, [products, searchTerm, selectedCategory, selectedSubCategory, sortBy]);

  // Reset subcategory and page when main category changes
  useEffect(() => {
    setSelectedSubCategory(null);
    setCurrentPage(1);
  }, [selectedCategory]);
  
	// Get vanity_url from cookies
	const getCookie = (name: string) => {
		const value = `; ${document.cookie}`;
		const parts = value.split(`; ${name}=`);
		if (parts.length === 2) return parts.pop()?.split(';').shift();
		return '';
	};

  // Load all products in background (dynamically based on total from first API response)
  const loadFirst200ProductsInBackground = async () => {
    if (backgroundLoadingRef.current) return; // Prevent multiple simultaneous loads
    
    backgroundLoadingRef.current = true;
    setIsLoadingBackground(true);
    setBackgroundLoadProgress(0);
    setTotalLoadedInBackground(0);

    try {
      // Get user_id from localStorage
      let userId = '';
      try {
        const userDataStr = localStorage.getItem('user');
        if (userDataStr) {
          const userData = JSON.parse(userDataStr);
          userId = userData.data?.user_id || '';
        }
      } catch (err) {
        console.log('Could not parse user data from localStorage');
      }

      const vanityUrl = getCookie('vanity_url');
      
      // Get total products from the already-loaded first page cache
      const firstPageCache = pageCache.current.get(1);
      const totalProducts = firstPageCache?.total || 0;
      
      // Calculate how many pages we need to load all products
      const pagesNeeded = totalProducts > 0 ? Math.ceil(totalProducts / 30) : 0;
      
      console.log(`📊 Total products available: ${totalProducts}`);
      console.log(`📄 Pages needed to load all products: ${pagesNeeded}`);
      
      let accumulatedProducts: Product[] = [];

      for (let page = 1; page <= pagesNeeded; page++) {
        // Check if already cached
        const cachedPage = pageCache.current.get(page);
        
        let pageProducts: Product[] = [];
        
        if (cachedPage) {
          pageProducts = cachedPage.products;
          console.log(`📦 Using cached page ${page} for background load`);
        } else {
          try {
            // Build query params
            const params = new URLSearchParams({
              page: page.toString(),
              limit: '30',
            });
            if (userId) params.append('user_id', userId);
            if (vanityUrl) params.append('vanity_url', vanityUrl);

            // Try multiple possible endpoints
            const endpoints = [
              `/api/business/business-products?${params.toString()}`,
              `/api/business/products?${params.toString()}`,
              `/api/products?${params.toString()}`,
              `/api/shop/products?${params.toString()}`,
            ];

            let response;
            let lastError: any = null;
            
            for (const endpoint of endpoints) {
              try {
                response = await axios.get(endpoint);
                break;
              } catch (err) {
                lastError = err;
                continue;
              }
            }

            if (!response) {
              throw lastError;
            }

            // Parse response
            let productsData: Product[] = [];
            
            if (response.data.data?.products && Array.isArray(response.data.data.products)) {
              productsData = response.data.data.products;
            } else if (response.data.products && Array.isArray(response.data.products)) {
              productsData = response.data.products;
            } else if (response.data.data && Array.isArray(response.data.data)) {
              productsData = response.data.data;
            } else if (Array.isArray(response.data)) {
              productsData = response.data;
            }

            // Filter only enabled products
            const enabledProducts = productsData.filter(
              (p: any) => p.enable_catalog === '1' || p.enable_catalog === 1
            );

            pageProducts = enabledProducts;

            // Cache this page
            const cacheData: PageCache = {
              products: enabledProducts,
              total: response.data.data?.total || response.data.total || 0,
              totalPages: Math.ceil((response.data.data?.total || response.data.total || 0) / 30),
            };
            pageCache.current.set(page, cacheData);

            console.log(`📥 Loaded page ${page}/${pagesNeeded} with ${enabledProducts.length} products in background`);
          } catch (err) {
            console.error(`Error loading page ${page} in background:`, err);
            // Continue to next page on error
            continue;
          }
        }

        // Add products to accumulation
        accumulatedProducts = [...accumulatedProducts, ...pageProducts];
        
        // Update progress (based on total products from API, not fixed 200)
        const loadedCount = Math.min(accumulatedProducts.length, totalProducts);
        setTotalLoadedInBackground(loadedCount);
        
        // Calculate progress percentage based on actual total
        const progressPercentage = totalProducts > 0 
          ? Math.min((loadedCount / totalProducts) * 100, 100)
          : 0;
        setBackgroundLoadProgress(progressPercentage);

        // Stop if we've loaded all products
        if (accumulatedProducts.length >= totalProducts && totalProducts > 0) {
          console.log(`✅ Background load complete: ${loadedCount} of ${totalProducts} products loaded`);
          break;
        }

        // Small delay between requests to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // If no pages were needed (0 products), show 100% completion
      if (pagesNeeded === 0) {
        console.log(`ℹ️ No additional products to load (all loaded already or 0 total)`);
        setBackgroundLoadProgress(100);
      }

    } catch (err) {
      console.error('Error in background loading:', err);
    } finally {
      setIsLoadingBackground(false);
      backgroundLoadingRef.current = false;
      setBackgroundLoadProgress(100);
    }
  };

  // Fetch products for a specific page with caching
  const fetchProducts = async (page: number = 1) => {
    try {
      // Check if page is already cached
      const cachedPage = pageCache.current.get(page);
      if (cachedPage) {
        setProducts(cachedPage.products);
        setTotalProducts(cachedPage.total);
        setTotalPages(cachedPage.totalPages);
        setCurrentPage(page);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      // Get user_id from localStorage
      let userId = '';
      try {
        const userDataStr = localStorage.getItem('user');
        if (userDataStr) {
          const userData = JSON.parse(userDataStr);
          userId = userData.data?.user_id || '';
        }
      } catch (err) {
        console.log('Could not parse user data from localStorage');
      }

      
      const vanityUrl = getCookie('vanity_url');

      // Build query params
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '30',
      });
      if (userId) params.append('user_id', userId);
      if (vanityUrl) params.append('vanity_url', vanityUrl);

      // Try multiple possible endpoints
      let response;
      const endpoints = [
        `/api/business/business-products?${params.toString()}`,
        `/api/business/products?${params.toString()}`,
        `/api/products?${params.toString()}`,
        `/api/shop/products?${params.toString()}`,
      ];

      let lastError: any = null;
      for (const endpoint of endpoints) {
        try {
          response = await axios.get(endpoint);
          break;
        } catch (err) {
          lastError = err;
          continue;
        }
      }

      if (!response) {
        throw lastError;
      }

      let productsData: Product[] = [];
      let total = 0;

      // Parse response based on structure
      if (response.data.data?.products && Array.isArray(response.data.data.products)) {
        productsData = response.data.data.products;
        total = response.data.data.total || 0;
      } else if (response.data.products && Array.isArray(response.data.products)) {
        productsData = response.data.products;
        total = response.data.total || 0;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        productsData = response.data.data;
        total = response.data.total || 0;
      } else if (Array.isArray(response.data)) {
        productsData = response.data;
        total = response.data.length;
      }

      // Filter only enabled products
      const enabledProducts = productsData.filter(
        (p: any) => p.enable_catalog === '1' || p.enable_catalog === 1
      );

      // Calculate total pages
      const calculatedTotalPages = total > 0 ? Math.ceil(total / 30) : 1;

      // Store in cache
      const cacheData: PageCache = {
        products: enabledProducts,
        total: total,
        totalPages: calculatedTotalPages,
      };
      pageCache.current.set(page, cacheData);

      // Check if total changed - if so, clear cache and update pagination
      if (lastTotalRef.current !== 0 && lastTotalRef.current !== total) {
        pageCache.current.clear();
        pageCache.current.set(page, cacheData);
      }

      lastTotalRef.current = total;

      setProducts(enabledProducts);
      setTotalProducts(total);
      setTotalPages(calculatedTotalPages);
      setCurrentPage(page);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch products');
      toast.error('Failed to load products', {
        position: 'bottom-center',
        autoClose: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch categories
  const fetchCategories = async () => {
    try {
      console.log('📥 Fetching categories...');
	  const vanityUrl = getCookie('vanity_url');
	  
      const response = await axios.get(`/api/business/non-empty-categories?business=${vanityUrl}`);
      
      if (response.data.data) {
        const categoryArray = Object.values(response.data.data) as Category[];
        setCategories(categoryArray);
        console.log(`✅ Loaded ${categoryArray.length} categories`);
        console.log('📋 Categories structure:', categoryArray);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  // Apply filters and sort
  const applyFiltersAndSort = useCallback(() => {
    let filtered = [...products];

    console.log('🔍 Applying filters:');
    console.log(`  - Search: "${searchTerm}"`);
    console.log(`  - Category: "${selectedCategory}"`);
    console.log(`  - SubCategory: "${selectedSubCategory}"`);

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.cat_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      console.log(`  ✓ After search: ${filtered.length} products`);
    }

    // Filter by category and subcategory
    if (selectedCategory !== 'All') {
      if (selectedSubCategory) {
        // Filtering by subcategory - match exact subcategory name
        filtered = filtered.filter((p) => p.cat_name === selectedSubCategory);
        console.log(`  ✓ After subcategory filter: ${filtered.length} products`);
      } else {
        // Filtering by main category - check category hierarchy
        const categoryObj = categories.find(cat => cat.cat_name === selectedCategory);
        
        if (categoryObj) {
          // Get all subcategory names from this category
          const subcategoryNames = categoryObj.sub?.map(sub => sub.cat_name) || [];
          
          // Include both the main category name AND all its subcategories
          const validCategoryNames = [selectedCategory, ...subcategoryNames];
          //filtered = filtered.filter((p) => p.cat_name === selectedCategory);
          filtered = filtered.filter((p) => validCategoryNames.includes(p.cat_name));
          
          console.log(`  ✓ After main category filter: ${filtered.length} products`);
          console.log(`    Valid categories: ${validCategoryNames.join(', ')}`);
        }
      }
    }
	
	// Filter by category and subcategory
   /* if (selectedCategory !== 'All') {
      if (selectedSubCategory) {
        // If subcategory is selected, filter by subcategory name
        filtered = filtered.filter((p) => p.cat_name === selectedSubCategory);
      } else {
        // If only main category is selected, filter by main category name
        filtered = filtered.filter((p) => p.cat_name === selectedCategory);
      }
    }*/

    // Sort
    switch (sortBy) {
      case 'price-asc':
        filtered.sort((a, b) => parseFloat(a.p_offer_price || '0') - parseFloat(b.p_offer_price || '0'));
        break;
      case 'price-desc':
        filtered.sort((a, b) => parseFloat(b.p_offer_price || '0') - parseFloat(a.p_offer_price || '0'));
        break;
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        break;
    }

    console.log(`📊 Final filtered result: ${filtered.length} products`);
    setFilteredProducts(filtered);
    
    // Reset to page 1 if filters result in empty set
    if (filtered.length === 0) {
      setCurrentPage(1);
    }
  }, [products, searchTerm, selectedCategory, selectedSubCategory, sortBy, categories]);

  // Handle previous page
  const handlePreviousPage = () => {
    if (currentPage > 1) {
      const nextPage = currentPage - 1;
      const isCached = pageCache.current.has(nextPage);
      console.log(`⬅️ ${isCached ? '📦 Using cached' : '📥 Fetching'} page ${nextPage}`);
      fetchProducts(nextPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Handle next page
  const handleNextPage = () => {
    if (currentPage < totalPages) {
      const nextPage = currentPage + 1;
      const isCached = pageCache.current.has(nextPage);
      console.log(`➡️ ${isCached ? '📦 Using cached' : '📥 Fetching'} page ${nextPage}`);
      fetchProducts(nextPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Handle add to cart
  const handleAddToCart = (product: Product) => {
	  console.log(product);
    const cartItem: CartItem = {
      productId: product.product_id,
      cartItemId: product.product_id,
      productName: product.name,
      price: parseFloat(product.p_offer_price || '0'),
      brand: product.cat_name,
      quantity: 1,
      imageUrl: getProductImageUrl(product),
      business: product.bus_title,
      business_user_id: product.business_user_id ? parseInt(product.business_user_id, 10) : undefined,
      name: product.name,
      page_id: product.page_id ? parseInt(product.page_id, 10) : undefined,
      is_sample: typeof product.is_sample === 'string' ? parseInt(product.is_sample, 10) : product.is_sample,
      med_image: product.med_image,
    };
    addToCart(cartItem);
    toast.success(`${product.name} added to cart!`, {
      position: 'bottom-right',
      autoClose: 2000,
    });
  };

  // Handle product selection
  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  // Handle modal close
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProduct(null);
  };

  const displayProducts = filteredProducts.length > 0 ? filteredProducts : products;

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 dark:text-white">Preview Your Products</h1>
          

          
          {/* Background Loading Progress Indicator */}
          {isLoadingBackground && (
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-3 mb-2">
                <Loader2 className="animate-spin text-blue-600 dark:text-blue-400" size={16} />
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  Loading product catalog in background... ({totalLoadedInBackground}/{totalProducts})
                </span>
              </div>
              <div className="w-full bg-blue-200 dark:bg-blue-800/50 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-blue-600 dark:bg-blue-400 h-full transition-all duration-300 ease-out"
                  style={{ width: `${backgroundLoadProgress}%` }}
                />
              </div>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                This happens in the background - you can browse while we load more products
              </p>
            </div>
          )}
        </div>

        {/* Search and Filter Bar */}
        <div className="mb-6 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search products by name, category, strain..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700 dark:text-white"
            />
          </div>

          {/* Category Buttons */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory('All')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                selectedCategory === 'All'
                  ? 'bg-teal-500 text-white'
                  : 'bg-gray-200 dark:bg-slate-800 dark:text-white'
              }`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat.cat_id}
                onClick={() => setSelectedCategory(cat.cat_name)}
                className={`px-4 py-2 rounded-lg font-medium transition whitespace-nowrap ${
                  selectedCategory === cat.cat_name
                    ? 'bg-teal-500 text-white'
                    : 'bg-gray-200 dark:bg-slate-800 dark:text-white'
                }`}
              >
                {cat.cat_name}
              </button>
            ))}
          </div>

          {/* SubCategories Display - ✅ KEPT ORIGINAL DESIGN */}
          {selectedCategory !== 'All' && (
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedSubCategory(null)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition ${
                  selectedSubCategory === null
                    ? 'bg-teal-400 text-white'
                    : 'bg-gray-100 dark:bg-slate-700 dark:text-gray-300 text-gray-700 hover:bg-gray-200 dark:hover:bg-slate-600'
                }`}
              >
                All Subcategories
              </button>
              {categories
                .find((cat) => cat.cat_name === selectedCategory)
                ?.sub?.map((subCat) => (
                  <button
                    key={subCat.cat_id}
                    onClick={() => setSelectedSubCategory(subCat.cat_name)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition whitespace-nowrap ${
                      selectedSubCategory === subCat.cat_name
                        ? 'bg-teal-500 text-white'
                        : 'bg-gray-100 dark:bg-slate-700 dark:text-gray-300 text-gray-700 hover:bg-gray-200 dark:hover:bg-slate-600'
                    }`}
                  >
                    {subCat.cat_name}
                  </button>
                ))}
            </div>
          )}

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2">
            <Filter size={20} className="text-gray-600 dark:text-gray-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700 dark:text-white"
            >
              <option value="default">Default</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="name">Name: A to Z</option>
            </select>
          </div>
        </div>

        {/* Results Info */}
        <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          {filteredProducts.length === 0 && selectedCategory !== 'All' ? (
            <span className="text-red-600 dark:text-red-400 font-medium">
              No products found with current filters - Try adjusting your selection
            </span>
          ) : (
            <span>
              Showing {displayProducts.length > 0 ? 'filtered results' : `${displayProducts.length} of ${products.length} products`} 
              (from {totalProducts} total products, page {currentPage} of {totalPages} available)
            </span>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin mr-2" size={24} />
            <span className="dark:text-white">Loading products...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6 flex items-start gap-3">
            <AlertCircle size={20} className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-600 dark:text-red-400">Error</h3>
              <p className="text-red-500 dark:text-red-300">{error}</p>
            </div>
          </div>
        )}

        {/* Products Grid */}
        {!loading && filteredProducts.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
            {filteredProducts.map((product) => (
              <div
                key={product.product_id}
                onClick={() => handleSelectProduct(product)}
                className="group bg-white dark:bg-slate-800 rounded-lg border dark:border-slate-700 overflow-hidden hover:shadow-lg dark:hover:shadow-lg dark:hover:shadow-teal-900/20 transition cursor-pointer"
              >
                {/* Image */}
                <div className="aspect-square bg-gray-100 dark:bg-slate-700 overflow-hidden relative">
                  <img
                    src={getProductImageUrl(product)}
                    alt={product.name}
                    className="w-full h-full object-contain group-hover:scale-105 transition"
                    onError={(e) => {
                      e.currentTarget.src =
                        'https://www.api.natureshigh.com/PF.Site/Apps/core-business/assets/no_image.png';
                    }}
                  />
                </div>

                {/* Product Info */}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2 mb-1">
                    {product.name}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                    {product.cat_name}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-teal-600 dark:text-teal-400">
                      ${product.p_offer_price}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {product.i_onhand} in stock
                    </span>
                  </div>

                  {/* Action Buttons 
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddToCart(product);
                      }}
                      className="flex-1 bg-teal-500 text-white py-1 rounded text-sm font-medium hover:bg-teal-600 transition"
                    >
                      Add to Cart
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectProduct(product);
                      }}
                      className="flex-1 bg-gray-200 dark:bg-slate-700 text-gray-900 dark:text-white py-1 rounded text-sm font-medium hover:bg-gray-300 dark:hover:bg-slate-600 transition"
                    >
                      View
                    </button>
                  </div>*/}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* No Products Message */}
        {!loading && filteredProducts.length === 0 && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <AlertCircle size={40} className="text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600 dark:text-gray-400 font-medium">No products found</p>
              <p className="text-gray-500 dark:text-gray-500 text-sm mt-1">
                {selectedCategory !== 'All' || selectedSubCategory
                  ? 'Try adjusting your filters'
                  : searchTerm
                  ? 'Try a different search term'
                  : 'Please try again later'}
              </p>
            </div>
          </div>
        )}

        {/* Pagination Controls */}
        {!loading && filteredProducts.length > 0 && (
          <div className="flex items-center justify-between py-6 border-t dark:border-slate-800">
            <button
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
              className="flex items-center gap-2 px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed dark:border-slate-700 dark:text-white hover:bg-gray-50 dark:hover:bg-slate-800 transition"
            >
              <ChevronLeft size={20} />
              Previous
            </button>

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                Page {currentPage} of {totalPages}
              </span>
            </div>

            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className="flex items-center gap-2 px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed dark:border-slate-700 dark:text-white hover:bg-gray-50 dark:hover:bg-slate-800 transition"
            >
              Next
              <ChevronRight size={20} />
            </button>
          </div>
        )}

        <div className="text-center text-sm text-gray-600 dark:text-gray-400 py-2">
          📦 {totalProducts} total products available • {totalPages} pages
        </div>
      </div>

      {/* Product Detail Modal */}
      {isModalOpen && selectedProduct && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={handleCloseModal}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 flex items-center justify-between p-6 border-b dark:border-slate-700 bg-white dark:bg-slate-900">
              <h2 className="text-2xl font-bold dark:text-white">{selectedProduct.name}</h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <div className="grid grid-cols-2 gap-6">
                {/* Image */}
                <div>
                  <img
                    src={getProductImageUrl(selectedProduct)}
                    alt={selectedProduct.name}
                    className="w-full h-80 object-contain rounded-lg hover:scale-105 transition"
                    onError={(e) => {
                      e.currentTarget.src =
                        'https://www.api.natureshigh.com/PF.Site/Apps/core-business/assets/no_image.png';
                    }}
                  />
                </div>

                {/* Details */}
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Category</p>
                    <p className="text-lg font-semibold dark:text-white">{selectedProduct.cat_name}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Price</p>
                    <p className="text-3xl font-bold text-teal-600 dark:text-teal-400">
                      ${selectedProduct.p_offer_price}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">In Stock</p>
                    <p className="text-lg font-semibold dark:text-white">{selectedProduct.i_onhand} units</p>
                  </div>

                  {selectedProduct.thc && (
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">THC</p>
                      <p className="text-lg font-semibold dark:text-white">{selectedProduct.thc}%</p>
                    </div>
                  )}

                  {selectedProduct.cbd && (
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">CBD</p>
                      <p className="text-lg font-semibold dark:text-white">{selectedProduct.cbd}%</p>
                    </div>
                  )}

                  {selectedProduct.bus_title && (
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Seller</p>
                      <p className="text-lg font-semibold dark:text-white">{selectedProduct.bus_title}</p>
                    </div>
                  )}

                  {/* Add to Cart Button 
                  <button
                    onClick={() => {
                      handleAddToCart(selectedProduct);
                      handleCloseModal();
                    }}
                    className="w-full bg-teal-500 text-white py-3 rounded-lg font-semibold hover:bg-teal-600 transition mt-6"
                  >
                    Add to Cart
                  </button>*/}
                </div>
              </div>

              {/* Description */}
              {selectedProduct.text_parsed && (
                <div className="mt-6 pt-6 border-t dark:border-slate-700">
                  <h3 className="font-semibold mb-2 dark:text-white">Description</h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    {selectedProduct.text_parsed}
                  </p>
                </div>
              )}

              {/* Previous/Next Navigation Buttons */}
              <div className="flex items-center justify-between mt-8 pt-6 border-t dark:border-slate-700">
                <button
                  onClick={() => {
                    const currentIndex = filteredProducts.findIndex(p => p.product_id === selectedProduct.product_id);
                    if (currentIndex > 0) {
                      setSelectedProduct(filteredProducts[currentIndex - 1]);
                    }
                  }}
                  disabled={filteredProducts.findIndex(p => p.product_id === selectedProduct.product_id) === 0}
                  className="flex items-center gap-2 px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  <ChevronLeft size={20} />
                  Previous
                </button>

                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {filteredProducts.findIndex(p => p.product_id === selectedProduct.product_id) + 1} of {filteredProducts.length}
                </span>

                <button
                  onClick={() => {
                    const currentIndex = filteredProducts.findIndex(p => p.product_id === selectedProduct.product_id);
                    if (currentIndex < filteredProducts.length - 1) {
                      setSelectedProduct(filteredProducts[currentIndex + 1]);
                    }
                  }}
                  disabled={filteredProducts.findIndex(p => p.product_id === selectedProduct.product_id) === filteredProducts.length - 1}
                  className="flex items-center gap-2 px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Next
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}