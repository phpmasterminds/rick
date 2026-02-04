'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { ChevronDown, ChevronUp, Download, FileText, Loader } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { toast } from 'react-toastify';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import Cookie from 'js-cookie';
import axios from 'axios';

// Customer Summary Interface
interface CustomerReportItem {
  total_orders: string;
  total_cost: string;
  total_discount: string;
  total_promotion_discount: string | null;
  total_shipping_cost: string;
  average_cost: string;
  total_edits: string;
  sales_commission: string;
  buyer_title: string;
  buyer_trade_name: string | null;
  address_page_id: string;
  user_id: string | null;
  profile_page_id: string | null;
  user_server_id: string | null;
  user_name: string | null;
  full_name: string | null;
  gender: string | null;
  user_image: string | null;
  is_invisible: string | null;
  user_group_id: string | null;
  language_id: string | null;
  birthday: string | null;
  country_iso: string | null;
}

// Product Summary Interface
interface ProductReportItem {
  product_id: string;
  page_id: string;
  product_name: string;
  business_user_id: string;
  bus_title: string;
  cat_name: string;
  med_type: string;
  org_med_type: string;
  total_sold: string;
  total_cost: string;
  average_cost: number;
  sales_commission: string;
  total_orders: string;
  user_id: string;
  profile_page_id: string;
  user_server_id: string;
  user_name: string | null;
  full_name: string | null;
  gender: string | null;
  user_image: string | null;
  is_invisible: string;
  user_group_id: string;
  language_id: string;
  birthday: string | null;
  country_iso: string | null;
  sold_by: any[];
}

// Product Detail Interface - for dropdown feature
interface ProductDetailItem {
  cart_id: string;
  order_id: string;
  selected_qty: string;
  selected_qty_price: string;
  name: string;
  img: string | null;
  no_of: string;
  discount: string;
  commission: string;
  total: string;
  product_id: string;
  page_id: string;
  is_removed: string;
  is_sample: string;
  flavors: string | null;
  is_packed: string;
  packaged_date: string;
  packaged_user_id: string;
  volume_discount: string | null;
  dealString: string | null;
  address_page_id: string;
  sales_person: string | null;
  order_update_time: string;
  locs_city: string;
  locs_zip: string;
  locs_country_iso: string;
  locs_country_child_id: string;
  cat_name: string | null;
  page_title: string;
}

// Customer Detail Interface - for customer detail dropdown
interface CustomerDetailItem {
  cart_id: string;
  order_id: string;
  selected_qty: string;
  selected_qty_price: string;
  name: string;
  img: string | null;
  no_of: string;
  discount: string;
  commission: string;
  total: string;
  product_id: string;
  page_id: string;
  is_removed: string;
  is_sample: string;
  flavors: string | null;
  is_packed: string;
  packaged_date: string;
  packaged_user_id: string;
  volume_discount: string | null;
  dealString: string | null;
  address_page_id: string;
  sales_person: string | null;
  order_update_time: string;
  locs_city: string;
  locs_zip: string;
  locs_country_iso: string;
  locs_country_child_id: string;
  cat_name: string | null;
  page_title: string;
}

type ReportItem = CustomerReportItem | ProductReportItem;

interface ApiResponse {
  status: string;
  data: {
    total: number;
    page: number;
    limit: number;
    reports: ReportItem[];
  };
  message: string | null;
  error: string | null;
}

interface SortConfig {
  key: string | null;
  direction: 'asc' | 'desc';
}

interface DateRange {
  start: string;
  end: string;
}

// Total types for customer and product reports
interface CustomerTotals {
  orders: number;
  totalSales: number;
  totalDiscount: number;
  shippingCost: number;
  netSales: number;
  commission: number;
}

interface ProductTotals {
  products: number;
  totalOrders: number;
  totalSales: number;
  avgCost: number;
  commission: number;
}

const ReportsSection = () => {
  const { isDark } = useTheme();
  const [viewType, setViewType] = useState<'customer' | 'product'>('customer'); // NEW: Switch between views
  const [reportType, setReportType] = useState('customer-summary');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: 'asc' });
  const [dateRange, setDateRange] = useState<DateRange>({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });

  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [businessInfo, setBusinessInfo] = useState<any>(null);

  // NEW: Product detail states for dropdown
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set());
  const [productDetails, setProductDetails] = useState<Map<string, ProductDetailItem[]>>(new Map());
  const [loadingDetails, setLoadingDetails] = useState<Set<string>>(new Set());

  // NEW: Customer detail states for dropdown
  const [expandedCustomers, setExpandedCustomers] = useState<Set<string>>(new Set());
  const [customerDetails, setCustomerDetails] = useState<Map<string, CustomerDetailItem[]>>(new Map());
  const [loadingCustomerDetails, setLoadingCustomerDetails] = useState<Set<string>>(new Set());

  const observerTarget = useRef<HTMLDivElement>(null);
  const businessName = Cookie.get('vanity_url') || 'chase-hayes-products';
  const limit = 30;

  // Fetch business info
  useEffect(() => {
    const fetchBusinessInfo = async () => {
      try {
        const response = await axios.get(`/api/business?business=${businessName}`);
        setBusinessInfo(response.data?.data);
      } catch (error) {
        console.error('Error fetching business info:', error);
      }
    };
    fetchBusinessInfo();
  }, [businessName]);

  // Handle view type change
  const handleViewTypeChange = (newViewType: 'customer' | 'product') => {
    setViewType(newViewType);
    const newReportType = newViewType === 'customer' ? 'customer-summary' : 'product-summary';
    setReportType(newReportType);
    setReports([]);
    setPage(1);
    setExpandedProducts(new Set());
    setProductDetails(new Map());
    setExpandedCustomers(new Set());
    setCustomerDetails(new Map());
  };

  // NEW: Fetch product details for a specific product
  const fetchProductDetails = useCallback(
    async (productId: string) => {
      if (productDetails.has(productId)) {
        return;
      }

      setLoadingDetails(prev => new Set([...prev, productId]));
      try {
        const response = await axios.get<any>(
          `/api/business/reports/seller?business=${businessName}&type=product-detail&product_id=${productId}&from_date=${dateRange.start}&to_date=${dateRange.end}`
        );

        if (response.data.status === 'success') {
          const details = response.data.data.reports || [];
          setProductDetails(prev => new Map([...prev, [productId, details]]));
        } else {
          toast.error(response.data.message || 'Failed to load product details');
        }
      } catch (error) {
        console.error('Error fetching product details:', error);
        toast.error('Error loading product details');
      } finally {
        setLoadingDetails(prev => {
          const newSet = new Set(prev);
          newSet.delete(productId);
          return newSet;
        });
      }
    },
    [businessName, dateRange, productDetails]
  );

  // NEW: Toggle product expansion
  const toggleProductExpanded = (productId: string) => {
    const newExpanded = new Set(expandedProducts);
    if (newExpanded.has(productId)) {
      newExpanded.delete(productId);
    } else {
      newExpanded.add(productId);
      fetchProductDetails(productId);
    }
    setExpandedProducts(newExpanded);
  };

  // NEW: Fetch customer details for a specific customer
  const fetchCustomerDetails = useCallback(
    async (customerId: string) => {
      if (customerDetails.has(customerId)) {
        return;
      }

      setLoadingCustomerDetails(prev => new Set([...prev, customerId]));
      try {
        const response = await axios.get<any>(
          `/api/business/reports/seller?business=${businessName}&type=customer-detail&customer_id=${customerId}&from_date=${dateRange.start}&to_date=${dateRange.end}`
        );

        if (response.data.status === 'success') {
          const details = response.data.data.reports || [];
          setCustomerDetails(prev => new Map([...prev, [customerId, details]]));
        } else {
          toast.error(response.data.message || 'Failed to load customer details');
        }
      } catch (error) {
        console.error('Error fetching customer details:', error);
        toast.error('Error loading customer details');
      } finally {
        setLoadingCustomerDetails(prev => {
          const newSet = new Set(prev);
          newSet.delete(customerId);
          return newSet;
        });
      }
    },
    [businessName, dateRange, customerDetails]
  );

  // NEW: Toggle customer expansion
  const toggleCustomerExpanded = (customerId: string) => {
    const newExpanded = new Set(expandedCustomers);
    if (newExpanded.has(customerId)) {
      newExpanded.delete(customerId);
    } else {
      newExpanded.add(customerId);
      fetchCustomerDetails(customerId);
    }
    setExpandedCustomers(newExpanded);
  };

  // Fetch reports data
  const fetchReports = useCallback(
    async (pageNum: number = 1, replace = false) => {
      setLoading(true);
      try {
        const response = await axios.get<ApiResponse>(
          `/api/business/reports/seller?business=${businessName}&type=${reportType}&limit=${limit}&page=${pageNum}&from_date=${dateRange.start}&to_date=${dateRange.end}`
        );

        if (response.data.status === 'success') {
          const newReports = response.data.data.reports || [];
          setReports(replace ? newReports : [...reports, ...newReports]);
          setTotalRecords(response.data.data.total);
          setHasMore(newReports.length === limit);
          setPage(pageNum);

          if (replace) {
            toast.success('Report loaded successfully');
          }
        } else {
          toast.error(response.data.message || 'Failed to load reports');
        }
      } catch (error) {
        console.error('Error fetching reports:', error);
        toast.error('Error loading reports. Please try again.');
      } finally {
        setLoading(false);
      }
    },
    [businessName, reportType, dateRange, reports]
  );

  // Initial load and on filter change
  useEffect(() => {
    setReports([]);
    setPage(1);
    setExpandedProducts(new Set());
    setProductDetails(new Map());
    setExpandedCustomers(new Set());
    setCustomerDetails(new Map());
    fetchReports(1, true);
  }, [reportType, dateRange]);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          fetchReports(page + 1);
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loading, page, fetchReports]);

  // Calculate totals - handles both customer and product data
  const calculateTotals = (): CustomerTotals | ProductTotals => {
    if (viewType === 'customer') {
      return reports.reduce(
        (acc, item: any) => {
          const totalDiscount = (parseFloat(item.total_discount || '0') || 0) + (parseFloat(item.total_promotion_discount || '0') || 0);
          const totalSales = parseFloat(item.total_cost || '0') || 0;
          const shippingCost = parseFloat(item.total_shipping_cost || '0') || 0;
          const netSales = totalSales - shippingCost;

          return {
            orders: acc.orders + parseInt(item.total_orders || '0'),
            totalSales: acc.totalSales + totalSales,
            totalDiscount: acc.totalDiscount + totalDiscount,
            shippingCost: acc.shippingCost + shippingCost,
            netSales: acc.netSales + netSales,
            commission: acc.commission + parseFloat(item.sales_commission || '0'),
          };
        },
        { orders: 0, totalSales: 0, totalDiscount: 0, shippingCost: 0, netSales: 0, commission: 0 }
      );
    } else {
      // Product summary
      return reports.reduce(
        (acc, item: any) => {
          const totalSales = parseFloat(item.total_cost || '0') || 0;
          const avgCost = item.average_cost || 0;
          const totalOrders = parseInt(item.total_orders || '0') || 0;

          return {
            products: acc.products + 1,
            totalOrders: acc.totalOrders + totalOrders,
            totalSales: acc.totalSales + totalSales,
            avgCost: acc.avgCost + avgCost,
            commission: acc.commission + parseFloat(item.sales_commission || '0'),
          };
        },
        { products: 0, totalOrders: 0, totalSales: 0, avgCost: 0, commission: 0 }
      );
    }
  };

  const totals = calculateTotals();

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (columnKey: string) => {
    if (sortConfig.key !== columnKey) {
      return <ChevronDown className="w-4 h-4 opacity-30" />;
    }
    return sortConfig.direction === 'asc' ? (
      <ChevronUp className="w-4 h-4" />
    ) : (
      <ChevronDown className="w-4 h-4" />
    );
  };

  const sortedData = React.useMemo(() => {
    let sortableData = [...reports];
    if (sortConfig.key) {
      sortableData.sort((a: any, b: any) => {
        const aVal = a[sortConfig.key!];
        const bVal = b[sortConfig.key!];

        if (aVal === null || aVal === undefined) return 1;
        if (bVal === null || bVal === undefined) return -1;

        const aNum = parseFloat(String(aVal));
        const bNum = parseFloat(String(bVal));

        if (!isNaN(aNum) && !isNaN(bNum)) {
          return sortConfig.direction === 'asc' ? aNum - bNum : bNum - aNum;
        }

        const aStr = String(aVal).toLowerCase();
        const bStr = String(bVal).toLowerCase();

        if (aStr < bStr) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aStr > bStr) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableData;
  }, [reports, sortConfig]);

  // Enhanced PDF Export
  const handleExportPDF = async () => {
    try {
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      let yPosition = 15;

      // Header
      const headerBgColor = isDark ? [20, 82, 98] : [0, 128, 128];
      doc.setFillColor(headerBgColor[0], headerBgColor[1], headerBgColor[2]);
      doc.rect(0, 0, pageWidth, 35, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text(businessInfo?.trade_name || businessInfo?.title || 'Nature\'s High', 15, 12);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const reportTitle = viewType === 'customer' ? 'Customer Summary' : 'Product Summary';
      doc.text(`Report: ${reportTitle}`, 15, 20);
      doc.text(`Period: ${dateRange.start} to ${dateRange.end}`, 15, 26);

      if (businessInfo?.business_logo) {
        try {
          doc.addImage(businessInfo.business_logo, 'PNG', pageWidth - 40, 3, 35, 30);
        } catch (imgError) {
          console.log('Logo could not be added');
        }
      }

      yPosition = 40;

      // Summary section
      doc.setFillColor(240, 240, 240);
      doc.rect(15, yPosition, pageWidth - 30, 20, 'F');
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);

      let summaryData;
      if (viewType === 'customer') {
        const customerTotals = totals as CustomerTotals;
        summaryData = [
          [`Total Orders: ${customerTotals.orders}`, `Total Sales: $${customerTotals.totalSales.toFixed(2)}`],
          [`Total Discount: $${customerTotals.totalDiscount.toFixed(2)}`, `Shipping Cost: $${customerTotals.shippingCost.toFixed(2)}`],
        ];
      } else {
        const productTotals = totals as ProductTotals;
        summaryData = [
          [`Total Products: ${productTotals.products}`, `Total Orders: ${productTotals.totalOrders}`],
          [`Total Sales: $${productTotals.totalSales.toFixed(2)}`, `Avg Product Cost: $${(productTotals.avgCost / Math.max(productTotals.products, 1)).toFixed(2)}`],
        ];
      }

      let summaryY = yPosition + 5;
      summaryData.forEach((row) => {
        doc.text(row[0], 20, summaryY);
        doc.text(row[1], pageWidth / 2, summaryY);
        summaryY += 7;
      });

      yPosition += 25;

      // Table columns and data
      let tableColumns, tableData;

      if (viewType === 'customer') {
        tableColumns = ['Customer', 'Orders', 'Total Sales', 'Discount', 'Promo Disc', 'Shipping', 'Net Sales', 'Avg Cost', 'Commission'];
        tableData = (sortedData as CustomerReportItem[]).map((item) => {
          const totalDiscount = parseFloat(item.total_discount || '0') || 0;
          const promoDiscount = parseFloat(item.total_promotion_discount || '0') || 0;
          const totalSales = parseFloat(item.total_cost || '0') || 0;
          const shippingCost = parseFloat(item.total_shipping_cost || '0') || 0;
          const netSales = totalSales - shippingCost;

          return [
            item.buyer_title || 'N/A',
            item.total_orders,
            `$${totalSales.toFixed(2)}`,
            `$${totalDiscount.toFixed(2)}`,
            `$${promoDiscount.toFixed(2)}`,
            `$${shippingCost.toFixed(2)}`,
            `$${netSales.toFixed(2)}`,
            `$${(parseFloat(item.average_cost) || 0).toFixed(2)}`,
            `$${(parseFloat(item.sales_commission) || 0).toFixed(2)}`,
          ];
        });
      } else {
        tableColumns = ['Product Name', 'Category', 'Total Orders', 'Total Cost', 'Average Cost'];
        tableData = (sortedData as ProductReportItem[]).map((item) => {
          const totalSales = parseFloat(item.total_cost || '0') || 0;
          const avgCost = item.average_cost || 0;

          return [
            item.product_name || 'N/A',
            item.cat_name || 'N/A',
            item.total_orders,
            `$${totalSales.toFixed(2)}`,
            `$${avgCost.toFixed(2)}`,
          ];
        });
      }

      autoTable(doc, {
        columns: tableColumns,
        body: tableData,
        startY: yPosition,
        theme: 'grid',
        headStyles: {
          fillColor: [0, 128, 128],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 9,
        },
        bodyStyles: {
          fontSize: 8,
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245],
        },
        margin: { left: 15, right: 15 },
      });

      // NEW: Add customer details if any customers are expanded
      if (viewType === 'customer' && expandedCustomers.size > 0) {
        let detailYPosition = (doc as any).lastAutoTable.finalY + 15;

        // Get sorted customers
        const sortedCustomers = (sortedData as CustomerReportItem[]);

        for (const customer of sortedCustomers) {
          if (customer.user_id && expandedCustomers.has(customer.user_id)) {
            const details = customerDetails.get(customer.user_id) || [];
            
            if (details.length > 0) {
              // Check if we need a new page
              if (detailYPosition > pageHeight - 40) {
                doc.addPage();
                detailYPosition = 15;
              }

              // Add customer detail header
              doc.setFillColor(100, 150, 150);
              doc.rect(15, detailYPosition, pageWidth - 30, 8, 'F');
              doc.setTextColor(255, 255, 255);
              doc.setFont('helvetica', 'bold');
              doc.setFontSize(10);
              doc.text(`Details for: ${customer.buyer_title}`, 20, detailYPosition + 5);
              detailYPosition += 12;

              // Create detail table
              const detailColumns = ['Order ID', 'Date', 'Product Name', 'Qty', 'Buyer', 'Cost'];
              const detailTableData = details.map((detail: CustomerDetailItem) => [
                detail.order_id,
                new Date(parseInt(detail.order_update_time) * 1000).toLocaleDateString(),
                detail.name || 'N/A',
                detail.no_of,
                detail.page_title || 'N/A',
                `$${parseFloat(detail.total).toFixed(2)}`,
              ]);

              autoTable(doc, {
                columns: detailColumns,
                body: detailTableData,
                startY: detailYPosition,
                theme: 'grid',
                headStyles: {
                  fillColor: [100, 150, 150],
                  textColor: [255, 255, 255],
                  fontStyle: 'bold',
                  fontSize: 8,
                },
                bodyStyles: {
                  fontSize: 7,
                },
                alternateRowStyles: {
                  fillColor: [250, 250, 250],
                },
                margin: { left: 15, right: 15 },
              });

              detailYPosition = (doc as any).lastAutoTable.finalY + 10;
            }
          }
        }
      }

      // NEW: Add product details if any products are expanded
      if (viewType === 'product' && expandedProducts.size > 0) {
        let detailYPosition = (doc as any).lastAutoTable.finalY + 15;

        // Get sorted products
        const sortedProducts = (sortedData as ProductReportItem[]);

        for (const product of sortedProducts) {
          if (expandedProducts.has(product.product_id)) {
            const details = productDetails.get(product.product_id) || [];
            
            if (details.length > 0) {
              // Check if we need a new page
              if (detailYPosition > pageHeight - 40) {
                doc.addPage();
                detailYPosition = 15;
              }

              // Add product detail header
              doc.setFillColor(100, 150, 150);
              doc.rect(15, detailYPosition, pageWidth - 30, 8, 'F');
              doc.setTextColor(255, 255, 255);
              doc.setFont('helvetica', 'bold');
              doc.setFontSize(10);
              doc.text(`Details for: ${product.product_name}`, 20, detailYPosition + 5);
              detailYPosition += 12;

              // Create detail table
              const detailColumns = ['Date', 'Order #', 'Qty', 'Revenue', 'Customer', 'City'];
              const detailTableData = details.map((detail: ProductDetailItem) => [
                new Date(parseInt(detail.order_update_time) * 1000).toLocaleDateString(),
                detail.order_id,
                detail.no_of,
                `$${parseFloat(detail.total).toFixed(2)}`,
                detail.page_title || 'N/A',
                detail.locs_city || 'N/A',
              ]);

              autoTable(doc, {
                columns: detailColumns,
                body: detailTableData,
                startY: detailYPosition,
                theme: 'grid',
                headStyles: {
                  fillColor: [100, 150, 150],
                  textColor: [255, 255, 255],
                  fontStyle: 'bold',
                  fontSize: 8,
                },
                bodyStyles: {
                  fontSize: 7,
                },
                alternateRowStyles: {
                  fillColor: [250, 250, 250],
                },
                margin: { left: 15, right: 15 },
              });

              detailYPosition = (doc as any).lastAutoTable.finalY + 10;
            }
          }
        }
      }

      // Footer
      const totalPages = (doc as any).internal.pages.length - 1;
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.text(
          `Generated on ${new Date().toLocaleDateString()} | Page ${i}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: 'center' }
        );
      }

      const fileName = viewType === 'customer' 
        ? `${businessInfo?.title || 'report'}-customer-summary-${new Date().getTime()}.pdf`
        : `${businessInfo?.title || 'report'}-product-summary-${new Date().getTime()}.pdf`;

      doc.save(fileName);
      toast.success('PDF exported successfully!');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error('Failed to export PDF');
    }
  };

  const handleExportCSV = () => {
    try {
      let csv: string;

      if (viewType === 'customer') {
        csv = 'Customer,Orders,Total Sales,Discount,Promo Discount,Shipping Cost,Net Sales,Avg Cost,Commission\n';
        (sortedData as CustomerReportItem[]).forEach((item) => {
          const totalDiscount = parseFloat(item.total_discount || '0') || 0;
          const promoDiscount = parseFloat(item.total_promotion_discount || '0') || 0;
          const totalSales = parseFloat(item.total_cost || '0') || 0;
          const shippingCost = parseFloat(item.total_shipping_cost || '0') || 0;
          const netSales = totalSales - shippingCost;

          csv += `"${item.buyer_title || 'N/A'}",${item.total_orders},$${totalSales.toFixed(2)},$${totalDiscount.toFixed(2)},$${promoDiscount.toFixed(2)},$${shippingCost.toFixed(2)},$${netSales.toFixed(2)},$${(parseFloat(item.average_cost) || 0).toFixed(2)},$${(parseFloat(item.sales_commission) || 0).toFixed(2)}\n`;
        });

        // NEW: Add customer details if any are expanded
        if (expandedCustomers.size > 0) {
          csv += '\n\n=== CUSTOMER DETAILS ===\n\n';
          
          (sortedData as CustomerReportItem[]).forEach((item) => {
            if (item.user_id && expandedCustomers.has(item.user_id)) {
              const details = customerDetails.get(item.user_id) || [];
              
              if (details.length > 0) {
                csv += `\nCustomer: ${item.buyer_title}\n`;
                csv += 'Order ID,Date,Product Name,Qty,Buyer,Cost\n';
                
                details.forEach((detail: CustomerDetailItem) => {
                  const date = new Date(parseInt(detail.order_update_time) * 1000).toLocaleDateString();
                  csv += `${detail.order_id},"${date}","${detail.name || 'N/A'}",${detail.no_of},"${detail.page_title || 'N/A'}",$${parseFloat(detail.total).toFixed(2)}\n`;
                });
              }
            }
          });
        }
      } else {
        csv = 'Product Name,Category,Total Orders,Total Cost,Average Cost\n';
        (sortedData as ProductReportItem[]).forEach((item) => {
          const totalSales = parseFloat(item.total_cost || '0') || 0;
          const avgCost = item.average_cost || 0;

          csv += `"${item.product_name || 'N/A'}","${item.cat_name || 'N/A'}",${item.total_orders},$${totalSales.toFixed(2)},$${avgCost.toFixed(2)}\n`;
        });

        // NEW: Add product details if any are expanded
        if (expandedProducts.size > 0) {
          csv += '\n\n=== PRODUCT DETAILS ===\n\n';
          
          (sortedData as ProductReportItem[]).forEach((item) => {
            if (expandedProducts.has(item.product_id)) {
              const details = productDetails.get(item.product_id) || [];
              
              if (details.length > 0) {
                csv += `\nProduct: ${item.product_name}\n`;
                csv += 'Date,Order #,Qty,Revenue,Customer,City\n';
                
                details.forEach((detail: ProductDetailItem) => {
                  const date = new Date(parseInt(detail.order_update_time) * 1000).toLocaleDateString();
                  csv += `"${date}",${detail.order_id},${detail.no_of},$${parseFloat(detail.total).toFixed(2)},"${detail.page_title || 'N/A'}","${detail.locs_city || 'N/A'}"\n`;
                });
              }
            }
          });
        }
      }

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const fileName = viewType === 'customer'
        ? `${businessInfo?.title || 'report'}-customer-summary-${new Date().getTime()}.csv`
        : `${businessInfo?.title || 'report'}-product-summary-${new Date().getTime()}.csv`;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success('CSV exported successfully!');
    } catch (error) {
      console.error('Error exporting CSV:', error);
      toast.error('Failed to export CSV');
    }
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'} transition-colors`}>
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className={`rounded-lg shadow-sm p-6 ${isDark ? 'bg-gray-800' : 'bg-white'} border ${isDark ? 'border-gray-700' : 'border-gray-200'} transition-colors`}>
          <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>
            Sales Reports
          </h1>
          <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Business: <span className="font-semibold">{businessInfo?.trade_name || businessInfo?.title || businessName}</span>
          </p>
        </div>

        {/* View Type Selector - Dropdown */}
        <div className={`rounded-lg shadow-sm p-6 ${isDark ? 'bg-gray-800' : 'bg-white'} border ${isDark ? 'border-gray-700' : 'border-gray-200'} transition-colors`}>
          <div className="mb-6">
            <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
              Report Type
            </label>
            <select
              value={viewType}
              onChange={(e) => handleViewTypeChange(e.target.value as 'customer' | 'product')}
              className={`w-full md:w-80 px-4 py-2 border ${isDark ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-gray-900'} rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors font-medium cursor-pointer`}
            >
              <option value="customer">👥 Customer Summary</option>
              <option value="product">📦 Product Summary</option>
            </select>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {/* Start Date */}
            <div>
              <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                Start Date
              </label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className={`w-full px-4 py-2 border ${isDark ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-gray-900'} rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors`}
              />
            </div>

            {/* End Date */}
            <div>
              <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                End Date
              </label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className={`w-full px-4 py-2 border ${isDark ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-gray-900'} rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors`}
              />
            </div>

            {/* Placeholder for alignment */}
            <div></div>
            <div></div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 dark:bg-teal-700 dark:hover:bg-teal-600 text-white rounded-lg transition-colors font-medium"
            >
              <FileText className="w-4 h-4" />
              Export PDF
            </button>
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 text-white rounded-lg transition-colors font-medium"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Report Section */}
        <div className={`rounded-lg shadow-sm overflow-hidden border ${isDark ? 'border-gray-700' : 'border-gray-200'} transition-colors`}>
          {/* Header */}
          <div className="bg-gradient-to-r from-teal-600 to-teal-700 dark:from-teal-700 dark:to-teal-800 text-white p-6">
            <h2 className="text-2xl font-bold mb-2">
              {viewType === 'customer' ? 'Customer Summary Report' : 'Product Summary Report'}
            </h2>
            <p className="text-teal-100">
              Period: {dateRange.start} to {dateRange.end}
            </p>
          </div>

          {/* Summary Stats */}
          {viewType === 'customer' ? (
            // Customer Summary Stats
            <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 p-6 ${isDark ? 'bg-gray-800' : 'bg-gray-50'} border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              {(() => {
                const customerTotals = totals as CustomerTotals;
                return (
                  <>
                    <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-white'} text-center`}>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Total Orders</p>
                      <p className="text-2xl font-bold text-teal-600">{customerTotals.orders}</p>
                    </div>
                    <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-white'} text-center`}>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Total Sales</p>
                      <p className="text-2xl font-bold text-teal-600">${customerTotals.totalSales.toFixed(2)}</p>
                    </div>
                    <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-white'} text-center`}>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Total Discount</p>
                      <p className="text-2xl font-bold text-orange-600">${customerTotals.totalDiscount.toFixed(2)}</p>
                    </div>
                    <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-white'} text-center`}>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Shipping Cost</p>
                      <p className="text-2xl font-bold text-blue-600">${customerTotals.shippingCost.toFixed(2)}</p>
                    </div>
                    <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-white'} text-center`}>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Net Sales</p>
                      <p className="text-2xl font-bold text-green-600">${customerTotals.netSales.toFixed(2)}</p>
                    </div>
                    <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-white'} text-center`}>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Commission</p>
                      <p className="text-2xl font-bold text-purple-600">${customerTotals.commission.toFixed(2)}</p>
                    </div>
                  </>
                );
              })()}
            </div>
          ) : (
            // Product Summary Stats
            <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 p-6 ${isDark ? 'bg-gray-800' : 'bg-gray-50'} border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              {(() => {
                const productTotals = totals as ProductTotals;
                return (
                  <>
                    <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-white'} text-center`}>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Total Products</p>
                      <p className="text-2xl font-bold text-teal-600">{productTotals.products}</p>
                    </div>
                    <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-white'} text-center`}>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Total Orders</p>
                      <p className="text-2xl font-bold text-blue-600">{productTotals.totalOrders}</p>
                    </div>
                    <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-white'} text-center`}>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Total Sales</p>
                      <p className="text-2xl font-bold text-green-600">${productTotals.totalSales.toFixed(2)}</p>
                    </div>
                    <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-white'} text-center`}>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Avg Product Cost</p>
                      <p className="text-2xl font-bold text-purple-600">${(productTotals.avgCost / Math.max(productTotals.products, 1)).toFixed(2)}</p>
                    </div>
                    <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-white'} text-center`}>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Commission</p>
                      <p className="text-2xl font-bold text-orange-600">${productTotals.commission.toFixed(2)}</p>
                    </div>
                  </>
                );
              })()}
            </div>
          )}

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={`${isDark ? 'bg-gray-700' : 'bg-gray-50'} border-b-2 ${isDark ? 'border-gray-600' : 'border-gray-200'} transition-colors`}>
                <tr>
                  {viewType === 'customer' ? (
                    <>
                      <th className="px-6 py-3 text-left w-10"></th>
                      <th
                        className="px-6 py-3 text-left cursor-pointer hover:bg-opacity-80"
                        onClick={() => requestSort('buyer_title')}
                      >
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'} uppercase`}>Customer</span>
                          {getSortIcon('buyer_title')}
                        </div>
                      </th>
                      <th
                        className="px-6 py-3 text-right cursor-pointer hover:bg-opacity-80"
                        onClick={() => requestSort('total_orders')}
                      >
                        <div className="flex items-center justify-end gap-2">
                          <span className={`text-xs font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'} uppercase`}>Orders</span>
                          {getSortIcon('total_orders')}
                        </div>
                      </th>
                      <th
                        className="px-6 py-3 text-right cursor-pointer hover:bg-opacity-80"
                        onClick={() => requestSort('total_cost')}
                      >
                        <div className="flex items-center justify-end gap-2">
                          <span className={`text-xs font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'} uppercase`}>Total Sales</span>
                          {getSortIcon('total_cost')}
                        </div>
                      </th>
                      <th
                        className="px-6 py-3 text-right cursor-pointer hover:bg-opacity-80"
                        onClick={() => requestSort('total_discount')}
                      >
                        <div className="flex items-center justify-end gap-2">
                          <span className={`text-xs font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'} uppercase`}>Discount</span>
                          {getSortIcon('total_discount')}
                        </div>
                      </th>
                      <th className="px-6 py-3 text-right">
                        <span className={`text-xs font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'} uppercase`}>Promo Disc</span>
                      </th>
                      <th
                        className="px-6 py-3 text-right cursor-pointer hover:bg-opacity-80"
                        onClick={() => requestSort('total_shipping_cost')}
                      >
                        <div className="flex items-center justify-end gap-2">
                          <span className={`text-xs font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'} uppercase`}>Shipping</span>
                          {getSortIcon('total_shipping_cost')}
                        </div>
                      </th>
                      <th className="px-6 py-3 text-right">
                        <span className={`text-xs font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'} uppercase`}>Net Sales</span>
                      </th>
                      <th
                        className="px-6 py-3 text-right cursor-pointer hover:bg-opacity-80"
                        onClick={() => requestSort('average_cost')}
                      >
                        <div className="flex items-center justify-end gap-2">
                          <span className={`text-xs font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'} uppercase`}>Avg Cost</span>
                          {getSortIcon('average_cost')}
                        </div>
                      </th>
                      <th className="px-6 py-3 text-right">
                        <span className={`text-xs font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'} uppercase`}>Commission</span>
                      </th>
                    </>
                  ) : (
                    <>
                      <th className="px-6 py-3 text-left w-10"></th>
                      <th
                        className="px-6 py-3 text-left cursor-pointer hover:bg-opacity-80"
                        onClick={() => requestSort('product_name')}
                      >
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'} uppercase`}>Product Name</span>
                          {getSortIcon('product_name')}
                        </div>
                      </th>
                      <th
                        className="px-6 py-3 text-left cursor-pointer hover:bg-opacity-80"
                        onClick={() => requestSort('cat_name')}
                      >
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'} uppercase`}>Category</span>
                          {getSortIcon('cat_name')}
                        </div>
                      </th>
                      <th
                        className="px-6 py-3 text-right cursor-pointer hover:bg-opacity-80"
                        onClick={() => requestSort('total_orders')}
                      >
                        <div className="flex items-center justify-end gap-2">
                          <span className={`text-xs font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'} uppercase`}>Total Orders</span>
                          {getSortIcon('total_orders')}
                        </div>
                      </th>
                      <th
                        className="px-6 py-3 text-right cursor-pointer hover:bg-opacity-80"
                        onClick={() => requestSort('total_cost')}
                      >
                        <div className="flex items-center justify-end gap-2">
                          <span className={`text-xs font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'} uppercase`}>Total Cost</span>
                          {getSortIcon('total_cost')}
                        </div>
                      </th>
                      <th
                        className="px-6 py-3 text-right cursor-pointer hover:bg-opacity-80"
                        onClick={() => requestSort('average_cost')}
                      >
                        <div className="flex items-center justify-end gap-2">
                          <span className={`text-xs font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'} uppercase`}>Average Cost</span>
                          {getSortIcon('average_cost')}
                        </div>
                      </th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-gray-700' : 'divide-gray-200'} transition-colors`}>
                {viewType === 'customer' ? (
                  (sortedData as CustomerReportItem[]).map((item, idx) => {
                    const totalDiscount = (parseFloat(item.total_discount || '0') || 0) + (parseFloat(item.total_promotion_discount || '0') || 0);
                    const totalSales = parseFloat(item.total_cost || '0') || 0;
                    const shippingCost = parseFloat(item.total_shipping_cost || '0') || 0;
                    const netSales = totalSales - shippingCost;
                    const promoDiscount = parseFloat(item.total_promotion_discount || '0') || 0;
                    const isExpanded = item.user_id ? expandedCustomers.has(item.user_id) : false;
                    const isLoading = item.user_id ? loadingCustomerDetails.has(item.user_id) : false;
                    const details = item.user_id ? (customerDetails.get(item.user_id) || []) : [];

                    return (
                      <React.Fragment key={idx}>
                        {/* Customer Row */}
                        <tr className={`${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} transition-colors`}>
                          <td className="px-6 py-4 text-center">
                            <button
                              onClick={() => item.user_id && toggleCustomerExpanded(item.user_id)}
                              className={`p-1 rounded hover:bg-opacity-80 transition-colors ${
                                isDark ? 'hover:bg-gray-600' : 'hover:bg-gray-200'
                              }`}
                              title={isExpanded ? 'Collapse details' : 'Expand details'}
                            >
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </button>
                          </td>
                          <td className={`px-6 py-4 text-sm ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                            <div>
                              <p className="font-medium">{item.buyer_title || 'N/A'}</p>
                              {item.full_name && (
                                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                  {item.full_name}
                                </p>
                              )}
                            </div>
                          </td>
                          <td className={`px-6 py-4 text-sm text-right ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                            {item.total_orders}
                          </td>
                          <td className={`px-6 py-4 text-sm text-right font-semibold ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                            ${totalSales.toFixed(2)}
                          </td>
                          <td className={`px-6 py-4 text-sm text-right ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>
                            ${(parseFloat(item.total_discount || '0') || 0).toFixed(2)}
                          </td>
                          <td className={`px-6 py-4 text-sm text-right ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>
                            ${promoDiscount.toFixed(2)}
                          </td>
                          <td className={`px-6 py-4 text-sm text-right ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                            ${shippingCost.toFixed(2)}
                          </td>
                          <td className={`px-6 py-4 text-sm text-right font-semibold ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                            ${netSales.toFixed(2)}
                          </td>
                          <td className={`px-6 py-4 text-sm text-right ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                            ${(parseFloat(item.average_cost) || 0).toFixed(2)}
                          </td>
                          <td className={`px-6 py-4 text-sm text-right ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>
                            ${(parseFloat(item.sales_commission) || 0).toFixed(2)}
                          </td>
                        </tr>

                        {/* Customer Detail Row */}
                        {isExpanded && (
                          <tr className={`${isDark ? 'bg-gray-700 bg-opacity-50' : 'bg-gray-50'}`}>
                            <td colSpan={10} className="px-6 py-4">
                              {isLoading ? (
                                <div className="flex items-center gap-2 py-4">
                                  <Loader className="w-5 h-5 animate-spin text-teal-600" />
                                  <span className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Loading details...</span>
                                </div>
                              ) : details.length > 0 ? (
                                <div className="overflow-x-auto">
                                  <table className={`w-full text-sm ${isDark ? 'bg-gray-800' : 'bg-white'} border ${isDark ? 'border-gray-600' : 'border-gray-300'} rounded`}>
                                    <thead className={`${isDark ? 'bg-gray-600' : 'bg-gray-100'}`}>
                                      <tr>
                                        <th className={`px-4 py-2 text-left font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Order ID</th>
                                        <th className={`px-4 py-2 text-left font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Date</th>
                                        <th className={`px-4 py-2 text-left font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Product Name</th>
                                        <th className={`px-4 py-2 text-right font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Qty</th>
                                        <th className={`px-4 py-2 text-left font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Buyer</th>
                                        <th className={`px-4 py-2 text-right font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Cost</th>
                                      </tr>
                                    </thead>
                                    <tbody className={`divide-y ${isDark ? 'divide-gray-600' : 'divide-gray-200'}`}>
                                      {details.map((detail, detailIdx) => (
                                        <tr key={detailIdx} className={`${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}>
                                          <td className={`px-4 py-2 font-medium ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                                            {detail.order_id}
                                          </td>
                                          <td className={`px-4 py-2 ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                                            {new Date(parseInt(detail.order_update_time) * 1000).toLocaleDateString()}
                                          </td>
                                          <td className={`px-4 py-2 ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                                            {detail.name || 'N/A'}
                                          </td>
                                          <td className={`px-4 py-2 text-right font-medium ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                                            {detail.no_of}
                                          </td>
                                          <td className={`px-4 py-2 ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                                            {detail.page_title || 'N/A'}
                                          </td>
                                          <td className={`px-4 py-2 text-right font-semibold ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                                            ${parseFloat(detail.total).toFixed(2)}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              ) : (
                                <div className={`py-4 text-center ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                  No details found
                                </div>
                              )}
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                ) : (
                  (sortedData as ProductReportItem[]).map((item, idx) => {
                    const totalSales = parseFloat(item.total_cost || '0') || 0;
                    const avgCost = item.average_cost || 0;
                    const isExpanded = expandedProducts.has(item.product_id);
                    const isLoading = loadingDetails.has(item.product_id);
                    const details = productDetails.get(item.product_id) || [];

                    return (
                      <React.Fragment key={idx}>
                        {/* Product Row */}
                        <tr className={`${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} transition-colors`}>
                          <td className="px-6 py-4 text-center">
                            <button
                              onClick={() => toggleProductExpanded(item.product_id)}
                              className={`p-1 rounded hover:bg-opacity-80 transition-colors ${
                                isDark ? 'hover:bg-gray-600' : 'hover:bg-gray-200'
                              }`}
                              title={isExpanded ? 'Collapse details' : 'Expand details'}
                            >
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </button>
                          </td>
                          <td className={`px-6 py-4 text-sm ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                            <div>
                              <p className="font-medium">{item.product_name || 'N/A'}</p>
                              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                SKU: {item.product_id}
                              </p>
                            </div>
                          </td>
                          <td className={`px-6 py-4 text-sm ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                            {item.cat_name || 'N/A'}
                          </td>
                          <td className={`px-6 py-4 text-sm text-right ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                            {item.total_orders}
                          </td>
                          <td className={`px-6 py-4 text-sm text-right font-semibold ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                            ${totalSales.toFixed(2)}
                          </td>
                          <td className={`px-6 py-4 text-sm text-right ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                            ${avgCost.toFixed(2)}
                          </td>
                        </tr>

                        {/* Detail Row - Product Details Dropdown */}
                        {isExpanded && (
                          <tr className={`${isDark ? 'bg-gray-700 bg-opacity-50' : 'bg-gray-50'}`}>
                            <td colSpan={6} className="px-6 py-4">
                              {isLoading ? (
                                <div className="flex items-center gap-2 py-4">
                                  <Loader className="w-5 h-5 animate-spin text-teal-600" />
                                  <span className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Loading details...</span>
                                </div>
                              ) : details.length > 0 ? (
                                <div className="overflow-x-auto">
                                  <table className={`w-full text-sm ${isDark ? 'bg-gray-800' : 'bg-white'} border ${isDark ? 'border-gray-600' : 'border-gray-300'} rounded`}>
                                    <thead className={`${isDark ? 'bg-gray-600' : 'bg-gray-100'}`}>
                                      <tr>
                                        <th className={`px-4 py-2 text-left font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Date</th>
                                        <th className={`px-4 py-2 text-left font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Order #</th>
                                        <th className={`px-4 py-2 text-left font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Product Name</th>
                                        <th className={`px-4 py-2 text-right font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Qty</th>
                                        <th className={`px-4 py-2 text-right font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Revenue</th>
                                        <th className={`px-4 py-2 text-left font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Customer</th>
                                        <th className={`px-4 py-2 text-left font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>City</th>
                                        <th className={`px-4 py-2 text-left font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Buyer</th>
                                      </tr>
                                    </thead>
                                    <tbody className={`divide-y ${isDark ? 'divide-gray-600' : 'divide-gray-200'}`}>
                                      {details.map((detail, detailIdx) => (
                                        <tr key={detailIdx} className={`${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}>
                                          <td className={`px-4 py-2 ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                                            {new Date(parseInt(detail.order_update_time) * 1000).toLocaleDateString()}
                                          </td>
                                          <td className={`px-4 py-2 font-medium ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                                            {detail.order_id}
                                          </td>
                                          <td className={`px-4 py-2 ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                                            {detail.name || 'N/A'}
                                          </td>
                                          <td className={`px-4 py-2 text-right font-medium ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                                            {detail.no_of}
                                          </td>
                                          <td className={`px-4 py-2 text-right font-semibold ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                                            ${parseFloat(detail.total).toFixed(2)}
                                          </td>
                                          <td className={`px-4 py-2 ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                                            {detail.page_title || 'N/A'}
                                          </td>
                                          <td className={`px-4 py-2 ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                                            {detail.locs_city || 'N/A'}
                                          </td>
                                          <td className={`px-4 py-2 ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                                            {detail.sales_person || '-'}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              ) : (
                                <div className={`py-4 text-center ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                  No details found
                                </div>
                              )}
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Loading indicator */}
          {loading && (
            <div className={`flex items-center justify-center gap-2 py-8 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
              <Loader className="w-5 h-5 animate-spin text-teal-600" />
              <span className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Loading more records...</span>
            </div>
          )}

          {/* Infinite scroll trigger */}
          <div ref={observerTarget} className="py-4" />

          {/* Empty state */}
          {sortedData.length === 0 && !loading && (
            <div className={`text-center py-12 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
              <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                No records found for the selected criteria
              </p>
            </div>
          )}

          {/* Footer */}
          <div className={`p-4 ${isDark ? 'bg-gray-700' : 'bg-gray-50'} border-t ${isDark ? 'border-gray-600' : 'border-gray-200'} text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            <p>
              Showing {sortedData.length} of {totalRecords} records | Generated on{' '}
              {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsSection;