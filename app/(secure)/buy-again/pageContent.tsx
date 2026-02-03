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
import { cookies } from "next/headers";

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
  sub_cat_name: string;
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
}

interface Category {
  cat_id: string;
  cat_name: string;
  sub?: Category[];
}

interface CategoryWithCount {
  cat_id: string;
  cat_name: string;
  count: number;
  subcategories: SubcategoryWithCount[];
}

interface SubcategoryWithCount {
  sub_cat_id: string;
  sub_cat_name: string;
  count: number;
}

interface PageCache {
  products: Product[];
  total: number;
  totalPages: number;
}

export default function PageContent({ business }: { business: string }) {
  const { addToCart } = useShopCart();

  // Products state
  const [products, setProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]); // Store all loaded products for filtering
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<CategoryWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedSubcategory, setSelectedSubcategory] = useState('All');
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
  const allProductsLoadedRef = useRef(false);

  // Initial load
  useEffect(() => {
    fetchProducts(1);
  }, [business]);

  // Apply filters when products, search, category, subcategory, sort, or seller changes
  useEffect(() => {
    applyFiltersAndSort();
  }, [products, searchTerm, selectedCategory, selectedSubcategory, sortBy, selectedSeller]);

  // Build categories from all products (extracted from loaded products)
  useEffect(() => {
    if (allProducts.length > 0) {
      const categoryMap = new Map<string, Map<string, number>>();

      allProducts.forEach((product) => {
        const catName = product.cat_name || 'Uncategorized';
        const subCatName = product.sub_cat_name || 'All';

        if (!categoryMap.has(catName)) {
          categoryMap.set(catName, new Map());
        }

        const subCategoryMap = categoryMap.get(catName)!;
        subCategoryMap.set(subCatName, (subCategoryMap.get(subCatName) || 0) + 1);
      });

      // Convert map to array format
      const categoriesArray: CategoryWithCount[] = Array.from(categoryMap.entries()).map(
        ([catName, subCategoryMap]) => {
          const subcategories = Array.from(subCategoryMap.entries()).map(([subCatName, count]) => ({
            sub_cat_id: `${catName}_${subCatName}`,
            sub_cat_name: subCatName,
            count,
          }));

          const totalCount = subcategories.reduce((sum, sub) => sum + sub.count, 0);

          return {
            cat_id: catName,
            cat_name: catName,
            count: totalCount,
            subcategories: subcategories.sort((a, b) => a.sub_cat_name.localeCompare(b.sub_cat_name)),
          };
        }
      );

      setCategories(categoriesArray.sort((a, b) => a.cat_name.localeCompare(b.cat_name)));
    }
  }, [allProducts]);

  // Fetch products for a specific page with caching
  const fetchProducts = async (page: number = 1) => {
    try {
      // Check if page is already cached
      const cachedPage = pageCache.current.get(page);
      /*if (cachedPage) {
        setProducts(cachedPage.products);
        setTotalProducts(cachedPage.total);
        setTotalPages(cachedPage.totalPages);
        setCurrentPage(page);
        setLoading(false);
        return;
      }*/

      page === 1 ? setLoading(true) : setLoadingMore(true);
      setError(null);
      // Try multiple possible endpoints
      let response;
			
      const endpoints = [
        `/api/business/business-products?page=${page}&limit=30&section=buy-again&slug=${business}`,
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
      /*const enabledProducts = productsData.filter(
        (p: any) => p.enable_product === '1' || p.enable_product === 1
      );*/
	  const enabledProducts = productsData;

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
      
      // Accumulate all products for category extraction
      setAllProducts((prevProducts) => {
        const combinedProducts = page === 1 ? enabledProducts : [...prevProducts, ...enabledProducts];
        // Remove duplicates based on product_id
        const uniqueProducts = Array.from(
          new Map(combinedProducts.map((p) => [p.product_id, p])).values()
        );
        return uniqueProducts;
      });

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
      page === 1 ? setLoading(false) : setLoadingMore(false);
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
    }
  }, [products]);

  // Apply filters and sort
  const applyFiltersAndSort = useCallback(() => {
    let filtered = [...products];

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.cat_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.sub_cat_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory !== 'All') {
      filtered = filtered.filter((p) => p.cat_name === selectedCategory);
    }

    // Filter by subcategory
    if (selectedSubcategory !== 'All') {
      filtered = filtered.filter((p) => p.sub_cat_name === selectedSubcategory);
    }

    // Filter by seller
    if (selectedSeller !== 'All') {
      filtered = filtered.filter((p) => p.bus_title === selectedSeller);
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

    setFilteredProducts(filtered);
  }, [products, searchTerm, selectedCategory, selectedSubcategory, sortBy, selectedSeller]);

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
  
  // In your product card or add to cart function
	/*const handleAddToCart = (product: any, businessData: any) => {
	  const cartItem = {
		cartItemId: `${product.id}-${Date.now()}`, // Unique ID
		productId: product.id,
		productName: product.title || product.name,
		price: product.price,
		quantity: 1,
		imageUrl: product.image_path || product.imageUrl, // Product image
		business: businessData?.title || "Nature's High",
		businessImage: businessData?.image_path,        // 🆕 Business logo/image
		businessId: businessData?.type_id,              // 🆕 Business ID
	  };

	  addToCart(cartItem);
	  // Show success toast
	  toast.success(`Added to cart from ${businessData?.title}`,{position: 'bottom-right',
      autoClose: 2000,});
	};*/

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

  // Get subcategories for selected category
  const getSubcategoriesForSelectedCategory = (): SubcategoryWithCount[] => {
    if (selectedCategory === 'All') {
      return [];
    }
    const category = categories.find((c) => c.cat_name === selectedCategory);
    return category ? category.subcategories : [];
  };

  // Count products for each category based on current filters (excluding category filter)
  const countProductsForCategory = (categoryName: string): number => {
    let filtered = [...products];

    // Apply all filters except category
    if (searchTerm) {
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.cat_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.sub_cat_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedSeller !== 'All') {
      filtered = filtered.filter((p) => p.bus_title === selectedSeller);
    }

    // Count products in this category
    return filtered.filter((p) => p.cat_name === categoryName).length;
  };

  // Count products for each subcategory based on current filters (excluding subcategory filter)
  const countProductsForSubcategory = (categoryName: string, subcategoryName: string): number => {
    let filtered = [...products];

    // Apply all filters except category and subcategory
    if (searchTerm) {
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.cat_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.sub_cat_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory !== 'All') {
      filtered = filtered.filter((p) => p.cat_name === selectedCategory);
    }

    if (selectedSeller !== 'All') {
      filtered = filtered.filter((p) => p.bus_title === selectedSeller);
    }

    // Count products in this subcategory
    return filtered.filter((p) => p.cat_name === categoryName && p.sub_cat_name === subcategoryName).length;
  };

  // Get total count across all categories
  const getTotalCategoryCount = (): number => {
    let filtered = [...products];

    if (searchTerm) {
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.cat_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.sub_cat_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedSeller !== 'All') {
      filtered = filtered.filter((p) => p.bus_title === selectedSeller);
    }

    return filtered.length;
  };

  const displayProducts = filteredProducts.length > 0 ? filteredProducts : products;

  // Calculate current product index and total for modal
  const currentProductIndex = displayProducts.findIndex(
    (p) => p.product_id === selectedProduct?.product_id
  );
  const totalProductsInModal = displayProducts.length;

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 dark:text-white">Buy Again Products</h1>
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

          {/* Category Section Header with Count */}
          {selectedCategory !== 'All' && (
            <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
              {selectedCategory} • {countProductsForCategory(selectedCategory)} product{countProductsForCategory(selectedCategory) !== 1 ? 's' : ''}
            </div>
          )}

          {/* Category Buttons */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                setSelectedCategory('All');
                setSelectedSubcategory('All');
              }}
              className={`px-4 py-2 rounded-full font-medium transition whitespace-nowrap ${
                selectedCategory === 'All'
                  ? 'bg-teal-500 text-white'
                  : 'bg-gray-200 dark:bg-slate-800 dark:text-white hover:bg-gray-300 dark:hover:bg-slate-700'
              }`}
            >
              All ({getTotalCategoryCount()})
            </button>
            {categories.map((cat) => (
              <button
                key={cat.cat_id}
                onClick={() => {
                  setSelectedCategory(cat.cat_name);
                  setSelectedSubcategory('All');
                }}
                className={`px-4 py-2 rounded-full font-medium transition whitespace-nowrap ${
                  selectedCategory === cat.cat_name
                    ? 'bg-teal-500 text-white'
                    : 'bg-gray-200 dark:bg-slate-800 dark:text-white hover:bg-gray-300 dark:hover:bg-slate-700'
                }`}
              >
                {cat.cat_name} ({countProductsForCategory(cat.cat_name)})
              </button>
            ))}
          </div>

          {/* Subcategory Section (shows when category selected) */}
          {selectedCategory !== 'All' && (
            <>
              <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                Subcategory
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedSubcategory('All')}
                  className={`px-4 py-2 rounded-full font-medium transition whitespace-nowrap ${
                    selectedSubcategory === 'All'
                      ? 'bg-teal-500 text-white'
                      : 'bg-gray-200 dark:bg-slate-800 dark:text-white hover:bg-gray-300 dark:hover:bg-slate-700'
                  }`}
                >
                  All ({countProductsForCategory(selectedCategory)})
                </button>
                {getSubcategoriesForSelectedCategory().map((subcat) => (
                  <button
                    key={subcat.sub_cat_id}
                    onClick={() => setSelectedSubcategory(subcat.sub_cat_name)}
                    className={`px-4 py-2 rounded-full font-medium transition whitespace-nowrap ${
                      selectedSubcategory === subcat.sub_cat_name
                        ? 'bg-teal-500 text-white'
                        : 'bg-gray-200 dark:bg-slate-800 dark:text-white hover:bg-gray-300 dark:hover:bg-slate-700'
                    }`}
                  >
                    {subcat.sub_cat_name} ({countProductsForSubcategory(selectedCategory, subcat.sub_cat_name)})
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2">
            <Filter size={20} className="text-gray-600 dark:text-gray-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700 dark:text-white"
            >
              <option value="default">Sort by default</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="name">Name: A to Z</option>
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
        </div>

        {/* Products Grid or Loading State */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="animate-spin text-teal-500 mb-4" size={40} />
            <p className="text-gray-600 dark:text-gray-400">Loading products...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="text-red-500 mb-4" size={40} />
            <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
            <button
              onClick={() => fetchProducts(1)}
              className="px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition"
            >
              Retry
            </button>
          </div>
        ) : displayProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="text-gray-400 mb-4" size={40} />
            <p className="text-gray-600 dark:text-gray-400">No products found matching your filters</p>
          </div>
        ) : (
          <>
            {/* Products Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {displayProducts.map((product) => (
                <div
                  key={product.product_id}
                  className="bg-white dark:bg-slate-900 rounded-lg shadow hover:shadow-lg transition overflow-hidden cursor-pointer border dark:border-slate-800"
                >
                  {/* Product Image */}
                  <div className="relative aspect-[1/1] overflow-hidden">
                    <img
                      src={getProductImageUrl(product)}
                      alt={product.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src =
                          'https://www.api.natureshigh.com/PF.Site/Apps/core-business/assets/no_image.png';
                      }}
                    />

                    {/* Stock Badge */}
                    <div className="absolute top-2 right-2 bg-teal-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                      {product.i_onhand} in stock
                    </div>

                    {/* THC Badge (if available) */}
                    {product.thc && (
                      <div className="absolute top-2 left-2 bg-green-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                        THC: {product.thc}%
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="p-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{product.cat_name}</p>
                    <h3 className="font-semibold text-sm dark:text-white line-clamp-2 mb-1">
                      {product.name}
                    </h3>
                    {product.bus_title && (
                      <p className="text-xs text-gray-600 dark:text-gray-300 mb-2 font-medium">
                        {product.bus_title}
                      </p>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-teal-600 dark:text-teal-400">
                        ${product.p_offer_price}
                      </span>
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
                    className="w-full h-64 object-cover rounded-lg"
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
                    <p className="text-2xl font-bold text-teal-600 dark:text-teal-400">
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

                  {/* Add to Cart Button */}
                  <button
                    onClick={() => {
                      handleAddToCart(selectedProduct);
                      handleCloseModal();
                    }}
                    className="w-full bg-teal-500 text-white py-2 rounded-lg font-semibold hover:bg-teal-600 transition"
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