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
import { calculateApplicableDiscount, calculateFinalPrice, type Discount } from '@/app/utils/discountUtils';

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
  enable_product?: string | number;
  bus_title?: string;
  business_url?: string;
  business_user_id?: string;
  page_id?: string;
  is_sample?: string | number;
  med_image?: string;
   discounts?: Discount;
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

  // Background loading state
  const [isLoadingBackground, setIsLoadingBackground] = useState(false);
  const [backgroundLoadProgress, setBackgroundLoadProgress] = useState(0);
  const [totalLoadedInBackground, setTotalLoadedInBackground] = useState(0);

  // Filter state - UPDATED with selectedSubCategory ✅
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState('default');
  const [sellers, setSellers] = useState<string[]>([]);
  const [selectedSeller, setSelectedSeller] = useState('All');
  
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
      // Start background loading
      loadAllProductsInBackground();
    };
    initializeData();
  }, []);

  // Apply filters when products, search, category, subcategory, sort, or seller changes - UPDATED ✅
  useEffect(() => {
    applyFiltersAndSort();
  }, [products, searchTerm, selectedCategory, selectedSubCategory, sortBy, selectedSeller, categories]);

  // Reset subcategory and page when main category changes - UPDATED ✅
  useEffect(() => {
    setSelectedSubCategory(null);
    setCurrentPage(1);
  }, [selectedCategory]);

  // Reset page when seller/search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedSeller, searchTerm]);

	const getProductDiscount = (product: any): Discount | null => {
		
		if (product.discounts && typeof product.discounts === 'object') {
		return product.discounts as Discount;
		}
		return null;
	};

  // Load all products in background
  const loadAllProductsInBackground = async () => {
    if (backgroundLoadingRef.current) return;
    
    backgroundLoadingRef.current = true;
    setIsLoadingBackground(true);
    setBackgroundLoadProgress(0);
    setTotalLoadedInBackground(0);

    try {
      const firstPageCache = pageCache.current.get(1);
      const totalProducts = firstPageCache?.total || 0;
      const pagesNeeded = totalProducts > 0 ? Math.ceil(totalProducts / 30) : 0;
      
      console.log(`📊 Total products available: ${totalProducts}`);
      console.log(`📄 Pages needed to load all products: ${pagesNeeded}`);
      
      let accumulatedProducts: Product[] = [];

      for (let page = 1; page <= pagesNeeded; page++) {
        const cachedPage = pageCache.current.get(page);
        let pageProducts: Product[] = [];
        
        if (cachedPage) {
          pageProducts = cachedPage.products;
          console.log(`📦 Using cached page ${page} for background load`);
        } else {
          try {
            const params = new URLSearchParams({
              page: page.toString(),
              limit: '30',
            });

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

            if (!response) throw lastError;

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

            const enabledProducts = productsData.filter(
              (p: any) => p.enable_catalog === '1' || p.enable_catalog === 1
            );

            pageProducts = enabledProducts;

            const cacheData: PageCache = {
              products: enabledProducts,
              total: response.data.data?.total || response.data.total || 0,
              totalPages: Math.ceil((response.data.data?.total || response.data.total || 0) / 30),
            };
            pageCache.current.set(page, cacheData);

            console.log(`📥 Loaded page ${page}/${pagesNeeded} with ${enabledProducts.length} products`);
          } catch (err) {
            console.error(`Error loading page ${page}:`, err);
            continue;
          }
        }

        accumulatedProducts = [...accumulatedProducts, ...pageProducts];
        const loadedCount = Math.min(accumulatedProducts.length, totalProducts);
        setTotalLoadedInBackground(loadedCount);
        
        const progressPercentage = totalProducts > 0 
          ? Math.min((loadedCount / totalProducts) * 100, 100)
          : 0;
        setBackgroundLoadProgress(progressPercentage);

        if (accumulatedProducts.length >= totalProducts && totalProducts > 0) {
          console.log(`✅ Background load complete: ${loadedCount} of ${totalProducts} products`);
          break;
        }

        await new Promise(resolve => setTimeout(resolve, 100));
      }

      if (pagesNeeded === 0) {
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
        console.log(`📦 Using cached data for page ${page}`);
        setProducts(cachedPage.products);
        setTotalProducts(cachedPage.total);
        setTotalPages(cachedPage.totalPages);
        setCurrentPage(page);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      console.log(`📥 Fetching products for page ${page}...`);

      // Try multiple possible endpoints
      let response;
      const endpoints = [
        `/api/business/business-products?page=${page}&limit=30`,
        `/api/business/products?page=${page}&limit=30`,
        `/api/products?page=${page}&limit=30`,
        `/api/shop/products?page=${page}&limit=30`,
      ];

      let lastError: any = null;
      for (const endpoint of endpoints) {
        try {
          console.log(`🔍 Trying endpoint: ${endpoint}`);
          response = await axios.get(endpoint);
          console.log(`✅ Success! Endpoint: ${endpoint}`);
          break;
        } catch (err) {
          lastError = err;
          console.log(`❌ Failed: ${endpoint}`);
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
        console.log(`✅ Extracted from: data.data.products`);
      } else if (response.data.products && Array.isArray(response.data.products)) {
        productsData = response.data.products;
        total = response.data.total || 0;
        console.log(`✅ Extracted from: data.products`);
      } else if (response.data.data && Array.isArray(response.data.data)) {
        productsData = response.data.data;
        total = response.data.total || 0;
        console.log(`✅ Extracted from: data.data`);
      } else if (Array.isArray(response.data)) {
        productsData = response.data;
        total = response.data.length;
        console.log(`✅ Extracted from: direct array`);
      }

      console.log(`📊 Page ${page}: ${productsData.length} products received`);
      console.log(`📊 Total available: ${total}`);

      // Filter only enabled products
      const enabledProducts = productsData.filter(
        (p: any) => p.enable_catalog === '1' || p.enable_catalog === 1
      );

      console.log(`✅ Enabled products: ${enabledProducts.length}`);

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
        console.log(`⚠️ Total products changed from ${lastTotalRef.current} to ${total}. Updating pagination...`);
        pageCache.current.clear();
        pageCache.current.set(page, cacheData);
      }

      lastTotalRef.current = total;

      setProducts(enabledProducts);
      setTotalProducts(total);
      setTotalPages(calculatedTotalPages);
      setCurrentPage(page);
    } catch (err: any) {
      console.error('❌ Error fetching products:', err.message);
      console.error('Error response:', err.response?.data);
      
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
      const response = await axios.get('/api/business/non-empty-categories');
      
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

  // Extract unique sellers from products
  useEffect(() => {
    if (products.length > 0) {
      const uniqueSellers = Array.from(
        new Set(
          products
            .filter((p) => p.bus_title && p.bus_title.trim())
            .map((p) => p.bus_title)
        )
      ).sort() as string[];
      setSellers(uniqueSellers);
      console.log(`✅ Extracted ${uniqueSellers.length} unique sellers`);
    }
  }, [products]);

  // Apply filters and sort - UPDATED with subcategory support ✅
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

    // Filter by category and subcategory - FIXED with hierarchy ✅
    if (selectedCategory !== 'All') {
      if (selectedSubCategory && selectedSubCategory !== null) {
        // If subcategory is selected, filter by subcategory name only
        filtered = filtered.filter((p) => p.cat_name === selectedSubCategory);
        console.log(`  ✓ After subcategory filter: ${filtered.length} products`);
      } else {
        // If only main category is selected, include main category + all subcategories
        const categoryObj = categories.find(cat => cat.cat_name === selectedCategory);
        
        if (categoryObj) {
          const subcategoryNames = categoryObj.sub?.map(sub => sub.cat_name) || [];
          const validCategoryNames = [selectedCategory, ...subcategoryNames];
          
          filtered = filtered.filter((p) => validCategoryNames.includes(p.cat_name));
          
          console.log(`  ✓ After category filter: ${filtered.length} products`);
          console.log(`    Valid categories: ${validCategoryNames.join(', ')}`);
        }
      }
    }

    // Filter by seller
    if (selectedSeller !== 'All') {
      filtered = filtered.filter((p) => p.bus_title === selectedSeller);
      console.log(`  ✓ After seller filter: ${filtered.length} products`);
    }

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
  }, [products, searchTerm, selectedCategory, selectedSubCategory, sortBy, selectedSeller, categories]);

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
	  try {
		const basePrice = parseFloat(product.p_offer_price || '0');
		const productDiscount = getProductDiscount(product);
		const appliedDiscount = calculateApplicableDiscount(basePrice, 1, productDiscount);
		const finalPrice = calculateFinalPrice(basePrice, appliedDiscount);

		const cartItem: CartItem = {
		  cartItemId: `${product.product_id}_${Date.now()}`,
		  productId: product.product_id,
		  productName: product.name,
		  brand: product.cat_name,
		  price: finalPrice,
		  basePrice: basePrice,
		  quantity: 1,
		  imageUrl: getProductImageUrl(product),
		  business: product.bus_title || 'Nature\'s High',
		  business_user_id: product.business_user_id ? parseInt(product.business_user_id) : undefined,
		  page_id: product.page_id ? parseInt(product.page_id) : undefined,
		  discount: productDiscount || undefined,
		  appliedDiscount: appliedDiscount || undefined,
		};

		addToCart(cartItem);
		toast.success(`Added ${product.name} to cart!`, {
		  position: 'top-right',
		  autoClose: 2000,
		});
	  } catch (error) {
		console.error('Error adding to cart:', error);
		toast.error('Failed to add item to cart', {
		  position: 'top-right',
		  autoClose: 2000,
		});
	  }
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

  // Handle previous product in modal
  const handlePreviousProduct = () => {
    const currentIndex = displayProducts.findIndex(
      (p) => p.product_id === selectedProduct?.product_id
    );
    if (currentIndex > 0) {
      setSelectedProduct(displayProducts[currentIndex - 1]);
    }
  };

  // Handle next product in modal
  const handleNextProduct = () => {
    const currentIndex = displayProducts.findIndex(
      (p) => p.product_id === selectedProduct?.product_id
    );
    if (currentIndex < displayProducts.length - 1) {
      setSelectedProduct(displayProducts[currentIndex + 1]);
    }
  };

  const displayProducts = filteredProducts.length > 0 ? filteredProducts : [];

  // Calculate current product index and total for modal
  const currentProductIndex = displayProducts.findIndex(
    (p) => p.product_id === selectedProduct?.product_id
  );
  const totalProductsInModal = displayProducts.length;

  // Get current category object for subcategories - NEW ✅
  const currentCategoryObj = categories.find(cat => cat.cat_name === selectedCategory);
  const currentSubCategories = currentCategoryObj?.sub || [];

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 dark:text-white">Shop Products</h1>
          <p className="text-gray-600 dark:text-gray-400">Browse and add products</p>
          
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

          {/* SubCategories Display - NEW ✅ Show when category selected */}
          {selectedCategory !== 'All' && currentSubCategories.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2 border-t pt-3 dark:border-slate-700">
              <button
                onClick={() => setSelectedSubCategory(null)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition ${
                  selectedSubCategory === null
                    ? 'bg-teal-400 text-white'
                    : 'bg-gray-100 dark:bg-slate-700 dark:text-gray-300 text-gray-700 hover:bg-gray-200 dark:hover:bg-slate-600'
                }`}
              >
                All {selectedCategory}
              </button>
              {currentSubCategories.map((subCat) => (
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

            {/* Seller Dropdown */}
            <select
              value={selectedSeller}
              onChange={(e) => setSelectedSeller(e.target.value)}
              className="px-4 py-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700 dark:text-white"
            >
              <option value="All">All Sellers</option>
              {sellers.map((seller) => (
                <option key={seller} value={seller}>
                  {seller}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Results Info */}
        <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          {filteredProducts.length === 0 && (selectedCategory !== 'All' || selectedSubCategory !== null) ? (
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

        {/* No Products State */}
        {!loading && !error && displayProducts.length === 0 && (
          <div className="text-center py-12">
            <AlertCircle size={40} className="text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600 dark:text-gray-400 text-lg">No products found</p>
            <p className="text-gray-500 dark:text-gray-500 text-sm mt-1">
              {selectedCategory !== 'All' || selectedSubCategory !== null || selectedSeller !== 'All'
                ? 'Try adjusting your filters'
                : searchTerm
                ? 'Try a different search term'
                : 'Please try again later'}
            </p>
          </div>
        )}

        {/* Products Grid - Display 30 per page */}
        {!loading && !error && displayProducts.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
              {displayProducts.map((product) => (
                <div
                  key={product.product_id}
                  className="bg-gray-50 dark:bg-slate-900 rounded-lg overflow-hidden hover:shadow-lg transition cursor-pointer"
                  onClick={() => handleSelectProduct(product)}
                >
                  {/* Product Image */}
                  <div className="relative aspect-[1/1] overflow-hidden">
                    <img
                      src={getProductImageUrl(product)}
                      alt={product.name}
                      className="w-full h-full object-contain hover:scale-105 transition"
                      onError={(e) => {
                        e.currentTarget.src =
                          'https://www.api.natureshigh.com/PF.Site/Apps/core-business/assets/no_image.png';
                      }}
                    />
                    {product.thc && (
                      <div className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded text-xs font-bold">
                        THC: {product.thc}%
                      </div>
                    )}
					
					{(() => {
					  const basePrice = parseFloat(product.p_offer_price || '0');
					  const appliedDiscount = calculateApplicableDiscount(basePrice, 1, getProductDiscount(product));
					  console.log(getProductDiscount(product));

					  return appliedDiscount && appliedDiscount.isApplicable ? (
						<div className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 rounded text-xs font-bold border border-red-700 shadow-md">
						  <div className="text-center">
							<div className="font-bold text-sm">{appliedDiscount.discountDisplay}</div>
							<div className="text-xs leading-tight">OFF</div>
						  </div>
						</div>
					  ) : null;
					})()}
                  </div>

                  {/* Product Info */}
                  <div className="p-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{product.cat_name}</p>
                    <h3 className="font-semibold text-sm dark:text-white line-clamp-2 mb-2">
                      {product.name}
                    </h3>
					{product.bus_title && (
                      <p className="text-xs text-gray-600 dark:text-gray-300 mb-2 font-medium">
                        {product.bus_title}
                      </p>
                    )}
                    <div className="flex justify-between items-center">
					  {(() => {
						const basePrice = parseFloat(product.p_offer_price || '0');
						const appliedDiscount = calculateApplicableDiscount(basePrice, 1, getProductDiscount(product));
						const finalPrice = calculateFinalPrice(basePrice, appliedDiscount);
						
						return appliedDiscount && appliedDiscount.isApplicable ? (
						  <div className="flex items-center gap-2">
							<span className="text-xs line-through text-gray-400 dark:text-gray-500">
							  ${basePrice.toFixed(2)}
							</span>
							<span className="text-lg font-bold text-teal-600 dark:text-teal-400">
							  ${finalPrice.toFixed(2)}
							</span>
						  </div>
						) : (
						  <span className="text-lg font-bold text-teal-600 dark:text-teal-400">
							${basePrice.toFixed(2)}
						  </span>
						);
					  })()}
					  <span className="text-xs text-gray-500 dark:text-gray-400">
						{product.i_onhand} in stock
					  </span>
					</div>

                    {/* Action Buttons */}
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddToCart(product);
                        }}
                        className="flex-1 accent-bg accent-hover text-white py-1 rounded text-sm font-medium transition"
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
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
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

            <div className="text-center text-sm text-gray-600 dark:text-gray-400 py-2">
              📦 {totalProducts} total products available • {totalPages} pages
            </div>
          </>
        )}
      </div>

      {/* Product Detail Modal */}
      {isModalOpen && selectedProduct && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={handleCloseModal}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-lg max-w-2xl w-full max-h-[85vh] overflow-y-auto flex flex-col"
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
            <div className="p-6 flex-1 overflow-y-auto">
              <div className="grid grid-cols-2 gap-6">
                {/* Image */}
                <div>
                  <img
                    src={getProductImageUrl(selectedProduct)}
                    alt={selectedProduct.name}
                    className="w-full h-full object-contain hover:scale-105 transition"
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
					{(() => {
					  const basePrice = parseFloat(selectedProduct.p_offer_price || '0');
					  const appliedDiscount = calculateApplicableDiscount(basePrice, 1, getProductDiscount(selectedProduct));
					  const finalPrice = calculateFinalPrice(basePrice, appliedDiscount);
					  
					  return appliedDiscount && appliedDiscount.isApplicable ? (
						<div className="flex items-center gap-2">
						  <span className="text-lg line-through text-gray-400 dark:text-gray-500">
							${basePrice.toFixed(2)}
						  </span>
						  <p className="text-2xl font-bold text-teal-600 dark:text-teal-400">
							${finalPrice.toFixed(2)}
						  </p>
						</div>
					  ) : (
						<p className="text-2xl font-bold text-teal-600 dark:text-teal-400">
						  ${basePrice.toFixed(2)}
						</p>
					  );
					})()}
                  </div>
				  
				  {/* Details Grid */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {selectedProduct.strain && (
                    <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                      <p className="text-xs text-green-600 dark:text-green-400 font-semibold">Strain</p>
                      <p className="text-sm font-medium text-green-900 dark:text-green-200">{selectedProduct.strain}</p>
                    </div>
                  )}

                  {selectedProduct.thc && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                      <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold">THC</p>
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-200">{selectedProduct.thc}%</p>
                    </div>
                  )}

                  {selectedProduct.cbd && (
                    <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
                      <p className="text-xs text-purple-600 dark:text-purple-400 font-semibold">CBD</p>
                      <p className="text-sm font-medium text-purple-900 dark:text-purple-200">{selectedProduct.cbd}%</p>
                    </div>
                  )}

                  <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg">
                    <p className="text-xs text-orange-600 dark:text-orange-400 font-semibold">In Stock</p>
                    <p className="text-sm font-medium text-orange-900 dark:text-orange-200">{selectedProduct.i_onhand}</p>
                  </div>
                </div>
				{/*
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">In Stock</p>
                    <p className="text-lg font-semibold dark:text-white">{selectedProduct.i_onhand} units</p>
                  </div>

                  {selectedProduct.thc && (
					<div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                      <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold">THC</p>
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-200">{selectedProduct.thc}%</p>
                    </div>
					
                  )}

                  {selectedProduct.cbd && (
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">CBD</p>
                      <p className="text-lg font-semibold dark:text-white">{selectedProduct.cbd}%</p>
                    </div>
				)}*/}
                  {selectedProduct.bus_title && (
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Seller</p>
                      <p className="text-lg font-semibold dark:text-white">{selectedProduct.bus_title}</p>
                    </div>
                  )}

                  {/* Add to Cart Button */}
                  <button
                    onClick={() => {
                      handleAddToCart(selectedProduct);
                      handleCloseModal();
                    }}
                    className="w-full accent-bg accent-hover text-white py-2 rounded-lg font-semibold transition"
                  >
                    Add to Cart
                  </button>
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
            </div>

            {/* Modal Footer - Navigation */}
            <div className="sticky bottom-0 flex items-center justify-between p-4 border-t dark:border-slate-700 bg-white dark:bg-slate-900">
              <button
                onClick={handlePreviousProduct}
                disabled={currentProductIndex <= 0}
                className="flex items-center gap-2 px-4 py-2 bg-teal-500 text-white rounded-lg font-medium hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft size={20} />
                Previous
              </button>

              <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                {currentProductIndex + 1} of {totalProductsInModal}
              </span>

              <button
                onClick={handleNextProduct}
                disabled={currentProductIndex >= displayProducts.length - 1}
                className="flex items-center gap-2 px-4 py-2 bg-teal-500 text-white rounded-lg font-medium hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Next
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}