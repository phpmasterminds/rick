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
  if (product.med_image_path && typeof product.med_image_path === 'string') {
    if (product.med_image_path.trim()) {
      return product.med_image_path;
    }
  }
  
  if (product.image_url && typeof product.image_url === 'string') {
    if (product.image_url.trim()) {
      return product.image_url;
    }
  }
  
  return 'https://www.api.natureshigh.com/PF.Site/Apps/core-business/assets/no_image.png';
};

interface Product {
  product_id: string;
  name: string;
  cat_name: string;
  sub_cat_name: string;
  strain?: string;
  i_price: string;
  i_deals: string;
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
  name: string;
  subcategories: string[];
}

interface PageCache {
  products: Product[];
  total: number;
  totalPages: number;
}

export default function PageContent() {
  const { addToCart } = useShopCart();

  // Products state - ALL products loaded in background
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Background loading state
  const [isLoadingBackground, setIsLoadingBackground] = useState(false);
  const [backgroundLoadProgress, setBackgroundLoadProgress] = useState(0);
  const [totalLoadedInBackground, setTotalLoadedInBackground] = useState(0);

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('All');
  const [sortBy, setSortBy] = useState('default');
  const [sellers, setSellers] = useState<string[]>([]);
  const [selectedSeller, setSelectedSeller] = useState('All');
  
  // INFINITE SCROLL STATE
  const [displayedCount, setDisplayedCount] = useState(30);
  const [totalProducts, setTotalProducts] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const observerTarget = useRef<HTMLDivElement>(null);

  // Modal state
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Cache for page data
  const pageCache = useRef<Map<number, PageCache>>(new Map());
  const backgroundLoadingRef = useRef<boolean>(false);

  // Initial load
  useEffect(() => {
    const initializeData = async () => {
      await fetchProducts(1);
      loadAllProductsInBackground();
    };
    initializeData();
  }, []);

  // Calculate categories from products whenever products change
  useEffect(() => {
    if (products.length > 0) {
      calculateCategoriesFromProducts();
    }
  }, [products]);

  // Apply filters when products, search, category, subcategory, sort, or seller changes
  useEffect(() => {
    applyFiltersAndSort();
  }, [products, searchTerm, selectedCategory, selectedSubCategory, sortBy, selectedSeller]);

  // Reset displayed count when filters change
  useEffect(() => {
    setDisplayedCount(30);
  }, [selectedCategory, selectedSubCategory, selectedSeller, searchTerm]);

  // INFINITE SCROLL: Setup Intersection Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingMore && displayedCount < filteredProducts.length) {
          loadMoreProducts();
        }
      },
      { threshold: 0.1 }
    );

    const target = observerTarget.current;
    if (target) {
      observer.observe(target);
    }

    return () => {
      if (target) {
        observer.unobserve(target);
      }
    };
  }, [displayedCount, filteredProducts.length, isLoadingMore]);

  // Load more products for infinite scroll
  const loadMoreProducts = () => {
    setIsLoadingMore(true);
    setTimeout(() => {
      setDisplayedCount((prev) => Math.min(prev + 30, filteredProducts.length));
      setIsLoadingMore(false);
    }, 300);
  };

  const getProductDiscount = (product: any): Discount | null => {
    if (product.discounts && typeof product.discounts === 'object') {
      return product.discounts as Discount;
    }
    return null;
  };

  // Calculate categories from products using the working pattern from inventory
  const calculateCategoriesFromProducts = () => {
    console.log('📥 Calculating categories from products...');
    
    const categoryMap = new Map<string, Set<string>>();

    products.forEach((product) => {
      const catName = (product.cat_name || '').trim();
      const subCatName = (product.sub_cat_name || '').trim();
      
      if (catName) {
        // Add category
        if (!categoryMap.has(catName)) {
          categoryMap.set(catName, new Set<string>());
        }
        
        // Add subcategory if it exists
        if (subCatName) {
          categoryMap.get(catName)?.add(subCatName);
        }
      }
    });
    
    // Transform the map into our category structure
    const transformedCategories = [
      { name: 'All', subcategories: [] },
      ...Array.from(categoryMap.entries()).map(([catName, subCats]) => ({
        name: catName,
        subcategories: Array.from(subCats)
      }))
    ];
    
    setCategories(transformedCategories);
    console.log(`✅ Calculated ${transformedCategories.length - 1} categories from products`);
  };

  // Get subcategories for selected category
  const getSubcategoriesForCategory = (): string[] => {
    if (selectedCategory === 'All') {
      return [];
    }
    const category = categories.find(cat => cat.name === selectedCategory);
    return category?.subcategories || [];
  };

  // Calculate category product counts
  const getCategoryProductCount = (catName: string): number => {
    if (catName === 'All') {
      return products.length;
    }
    return products.filter(p => (p.cat_name || '').trim() === catName).length;
  };

  // Calculate subcategory product counts
  const getSubcategoryProductCount = (subCatName: string): number => {
    if (subCatName === 'All') {
      if (selectedCategory === 'All') {
        return filteredProducts.length;
      }
      return filteredProducts.filter(p => (p.cat_name || '').trim() === selectedCategory).length;
    }
    return filteredProducts.filter(p => (p.sub_cat_name || '').trim() === subCatName).length;
  };

  // Load ALL products in background and accumulate them
  const loadAllProductsInBackground = async () => {
    if (backgroundLoadingRef.current) return;
    
    backgroundLoadingRef.current = true;
    setIsLoadingBackground(true);
    setBackgroundLoadProgress(0);
    setTotalLoadedInBackground(0);

    try {
      const firstPageCache = pageCache.current.get(1);
      const totalProductsCount = firstPageCache?.total || 0;
      const pagesNeeded = totalProductsCount > 0 ? Math.ceil(totalProductsCount / 30) : 0;
      
      console.log(`📊 Total products available: ${totalProductsCount}`);
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

        // ACCUMULATE products from all pages
        accumulatedProducts = [...accumulatedProducts, ...pageProducts];
        const loadedCount = Math.min(accumulatedProducts.length, totalProductsCount);
        setTotalLoadedInBackground(loadedCount);
        
        const progressPercentage = totalProductsCount > 0 
          ? Math.min((loadedCount / totalProductsCount) * 100, 100)
          : 0;
        setBackgroundLoadProgress(progressPercentage);

        if (accumulatedProducts.length >= totalProductsCount && totalProductsCount > 0) {
          console.log(`✅ Background load complete: ${loadedCount} of ${totalProductsCount} products`);
          // UPDATE main products state with ALL accumulated products
          setProducts(accumulatedProducts);
          break;
        }

        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Make sure products are set even if loop completes normally
      if (accumulatedProducts.length > 0) {
        console.log(`🎉 Setting ${accumulatedProducts.length} total products`);
        setProducts(accumulatedProducts);
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

  // Fetch products for initial page load
  const fetchProducts = async (page: number = 1) => {
    try {
      const cachedPage = pageCache.current.get(page);
      if (cachedPage) {
        console.log(`📦 Using cached data for page ${page}`);
        setProducts(cachedPage.products);
        setTotalProducts(cachedPage.total);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      console.log(`📥 Fetching products for page ${page}...`);

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
          response = await axios.get(endpoint);
          break;
        } catch (err) {
          lastError = err;
          continue;
        }
      }

      if (!response) {
        throw lastError || new Error('No response from any endpoint');
      }

      let productsData: Product[] = [];
      let total = 0;

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
        total = productsData.length;
      }

      const enabledProducts = productsData.filter(
        (p: any) => p.enable_catalog === '1' || p.enable_catalog === 1
      );

      // Extract unique sellers
      const uniqueSellers = [...new Set(enabledProducts.map((p) => p.bus_title).filter(Boolean))];
      setSellers(uniqueSellers as string[]);

      setProducts(enabledProducts);
      setTotalProducts(total);

      const cacheData: PageCache = {
        products: enabledProducts,
        total,
        totalPages: Math.ceil(total / 30),
      };
      pageCache.current.set(page, cacheData);

      console.log(`✅ Fetched page ${page}: ${enabledProducts.length} enabled products, ${total} total`);
    } catch (err: any) {
      console.error('Error fetching products:', err);
      setError('Failed to load products. Please try again.');
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  // Extract unique sellers
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

  // Apply filters and sorting
  const applyFiltersAndSort = useCallback(() => {
    let filtered = [...products];

    console.log('🔍 Applying filters to', products.length, 'products');

    // Filter by search term
    if (searchTerm.trim()) {
      const lowerSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(lowerSearch) ||
          p.cat_name?.toLowerCase().includes(lowerSearch) ||
          p.strain?.toLowerCase().includes(lowerSearch)
      );
      console.log(`  ✓ After search: ${filtered.length} products`);
    }

    // Filter by category
    if (selectedCategory !== 'All') {
      filtered = filtered.filter((product) => (product.cat_name || '').trim() === selectedCategory);
      console.log(`  ✓ After category filter: ${filtered.length} products`);
    }

    // Filter by subcategory
    if (selectedSubCategory && selectedSubCategory !== 'All') {
      filtered = filtered.filter((product) => (product.sub_cat_name || '').trim() === selectedSubCategory);
      console.log(`  ✓ After subcategory filter: ${filtered.length} products`);
    }

    // Filter by seller
    if (selectedSeller !== 'All') {
      filtered = filtered.filter((product) => product.bus_title === selectedSeller);
      console.log(`  ✓ After seller filter: ${filtered.length} products`);
    }

    // Sort
    switch (sortBy) {
      case 'price-asc':
        filtered.sort((a, b) => parseFloat(a.i_price || '0') - parseFloat(b.i_price || '0'));
        break;
      case 'price-desc':
        filtered.sort((a, b) => parseFloat(b.i_price || '0') - parseFloat(a.i_price || '0'));
        break;
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        break;
    }

    console.log(`📊 Final filtered result: ${filtered.length} products`);
    setFilteredProducts(filtered);
  }, [products, searchTerm, selectedCategory, selectedSubCategory, sortBy, selectedSeller]);

  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProduct(null);
  };

  const handleAddToCart = (product: Product) => {
    try {
      const basePrice = parseFloat(product.i_price || '0');
      const productDiscount = getProductDiscount(product);
      const appliedDiscount = calculateApplicableDiscount(
        basePrice,
        1,
        productDiscount,
        product.i_deals
      );
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
        dealString: product.i_deals || undefined,
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

  // Display products with infinite scroll
  const displayProducts = filteredProducts.slice(0, displayedCount);

  // Calculate current product index and total for modal
  const currentProductIndex = displayProducts.findIndex(
    (p) => p.product_id === selectedProduct?.product_id
  );
  const totalProductsInModal = displayProducts.length;

  // Get subcategories for selected category
  const subcategories = getSubcategoriesForCategory();

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
            </div>
          )}
        </div>

        {/* Search Bar */}
        <div className="mb-6">
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
        </div>

        {/* Category Filters - with counts */}
        <div className="flex flex-wrap gap-2 mb-6 overflow-x-auto pb-2">
          {categories.map((cat) => (
            <button
              key={cat.name}
              onClick={() => {
                setSelectedCategory(cat.name);
                setSelectedSubCategory('All');
              }}
              className={`px-4 py-2 rounded-full font-medium whitespace-nowrap transition-all duration-300 ${
                selectedCategory === cat.name
                  ? 'text-white shadow-lg accent-bg accent-hover'
                  : 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              {cat.name} <span className="text-xs ml-1">({getCategoryProductCount(cat.name)})</span>
            </button>
          ))}
        </div>

        {/* Subcategories - with counts */}
        {subcategories.length > 0 && (
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Subcategory</label>
            <div className="flex flex-wrap gap-2">
              {['All', ...subcategories].map((sub) => {
                const subCount = getSubcategoryProductCount(sub);
                
                return (
                  <button
                    key={sub}
                    onClick={() => setSelectedSubCategory(sub)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                      selectedSubCategory === sub
                        ? 'text-white shadow-md accent-bg accent-hover'
                        : 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700'
                    }`}
                  >
                    {sub} <span className="text-xs ml-1">({subCount})</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Sort and Seller Filter */}
        <div className="flex gap-4 mb-6">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700 dark:text-white"
          >
            <option value="default">Sort: Default</option>
            <option value="price-asc">Sort: Price Low to High</option>
            <option value="price-desc">Sort: Price High to Low</option>
            <option value="name">Sort: Name A-Z</option>
          </select>

          {sellers.length > 0 && (
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
          )}
        </div>

        {/* Results Info */}
        <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          {filteredProducts.length === 0 && (selectedCategory !== 'All' || selectedSubCategory !== 'All') ? (
            <span className="text-red-600 dark:text-red-400 font-medium">
              No products found with current filters - Try adjusting your selection
            </span>
          ) : (
            <span>
              Showing {displayProducts.length} of {filteredProducts.length} filtered products (Total: {products.length})
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
              {selectedCategory !== 'All' || selectedSubCategory !== 'All' || selectedSeller !== 'All'
                ? 'Try adjusting your filters'
                : searchTerm
                ? 'Try a different search term'
                : 'Please try again later'}
            </p>
          </div>
        )}

        {/* Products Grid */}
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
                      loading="lazy"
                      decoding="async"
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
                      const basePrice = parseFloat(product.i_price || '0');
                      const appliedDiscount = calculateApplicableDiscount(
                        basePrice,
                        1,
                        getProductDiscount(product),
                        product.i_deals
                      );

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
                        const basePrice = parseFloat(product.i_price || '0');
                        const appliedDiscount = calculateApplicableDiscount(
                          basePrice,
                          1,
                          getProductDiscount(product),
                          product.i_deals
                        );
                        const finalPrice = calculateFinalPrice(basePrice, appliedDiscount);
                        
                        return appliedDiscount && appliedDiscount.isApplicable ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs line-through text-gray-400 dark:text-gray-500">
                              ${basePrice.toFixed(2)}
                            </span>
                            <p className="text-lg font-bold text-teal-600 dark:text-teal-400">
                              ${finalPrice.toFixed(2)}
                            </p>
                          </div>
                        ) : (
                          <p className="text-lg font-bold text-teal-600 dark:text-teal-400">
                            ${basePrice.toFixed(2)}
                          </p>
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

            {/* INFINITE SCROLL TRIGGER */}
            <div ref={observerTarget} className="text-center py-8">
              {displayedCount < filteredProducts.length && (
                <>
                  {isLoadingMore ? (
                    <Loader2 className="animate-spin text-teal-500 mx-auto mb-4" size={32} />
                  ) : (
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      ⬇️ Scroll down to load more products...
                    </p>
                  )}
                </>
              )}
              {displayedCount >= filteredProducts.length && filteredProducts.length > 0 && (
                <p className="text-gray-500 dark:text-gray-500 text-sm">
                  ✅ Showing all {filteredProducts.length} products
                </p>
              )}
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
                    loading="lazy"
                    decoding="async"
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
                      const basePrice = parseFloat(selectedProduct.i_price || '0');
                      const appliedDiscount = calculateApplicableDiscount(
                        basePrice,
                        1,
                        getProductDiscount(selectedProduct),
                        selectedProduct.i_deals
                      );
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