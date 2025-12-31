import axios, { AxiosInstance } from 'axios';

interface ChartDataPoint {
  date: string;
  sales: number;
  orders: number;
}

interface TopVendor {
  name: string;
  sales: number;
  orders: number;
}

interface Order {
  order_id: string;
  vendor_name: string;
  buyer_name: string;
  total: number;
  status: 'pending' | 'completed' | 'shipped';
  date: string;
}

interface AdminStats {
  totalSales: number;
  totalOrders: number;
  activeVendors: number;
  pendingApprovals: number;
  salesLast30Days: number;
  ordersLast30Days: number;
  chartData: ChartDataPoint[];
  recentOrders: Order[];
  topVendors: TopVendor[];
}

interface Client {
  name: string;
  total: number;
}

interface Product {
  name: string;
  qty: number;
  amount: number;
}

interface SalesRep {
  name: string;
  total: number;
}

interface SellerOrder {
  order_id: string;
  client_name: string;
  status: string;
  total: number;
  date: string;
}

interface SellerStats {
  totalSales: number;
  salesLast30Days: number;
  monthToDate: number;
  pastHours: number;
  ordersData: any[];
  topClients: Client[];
  topProducts: Product[];
  recentOrders: SellerOrder[];
  topSalesReps: SalesRep[];
}

interface BuyerBrand {
  name: string;
  total: number;
}

interface BuyerOrder {
  order_id: string;
  seller_name: string;
  total: number;
  ship_date: string;
}

interface BrandReorder {
  name: string;
  order_count: number;
  last_order: string;
}

interface SampleRequest {
  seller_name: string;
  user_name: string;
  note: string;
  date: string;
}

interface BuyerProduct {
  name: string;
  qty: number;
  amount: number;
}

interface BuyerStats {
  totalPurchases: number;
  pastDays: number;
  monthToDate: number;
  pastHours: number;
  ordersData: any[];
  topBrands: BuyerBrand[];
  recentOrders: BuyerOrder[];
  brandsForReorder: BrandReorder[];
  sampleRequests: SampleRequest[];
  topProducts: BuyerProduct[];
}

const API_BASE_URL = process.env.PHPFOX_API_URL || 'http://localhost/api';
const API_KEY = process.env.PHPFOX_API_KEY || '';

export class DashboardService {
  private axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      timeout: 10000,
    });
  }

  /**
   * Get Admin Dashboard Statistics
   */
  async getAdminDashboard(businessId: string): Promise<AdminStats> {
    try {
      const [salesData, vendorData, ordersData] = await Promise.all([
        this.fetchAdminSalesData(businessId),
        this.fetchAdminVendorData(businessId),
        this.fetchRecentOrders(businessId, 'admin'),
      ]);

      const chartData = this.generateChartData(salesData.daily, 'admin');

      return {
        totalSales: salesData.total,
        totalOrders: ordersData.total,
        activeVendors: vendorData.active,
        pendingApprovals: vendorData.pending,
        salesLast30Days: salesData.last30,
        ordersLast30Days: ordersData.last30,
        chartData,
        recentOrders: ordersData.recent,
        topVendors: vendorData.topVendors,
      };
    } catch (error) {
      console.error('Error in getAdminDashboard:', error);
      return this.getAdminDashboardFallback();
    }
  }

  /**
   * Get Seller Dashboard Statistics
   */
  async getSellerDashboard(businessId: string): Promise<SellerStats> {
    try {
      const [salesData, clientData, productsData, ordersData] = await Promise.all([
        this.fetchSellerSalesData(businessId),
        this.fetchTopClients(businessId),
        this.fetchTopProducts(businessId),
        this.fetchRecentOrders(businessId, 'seller'),
      ]);

      const chartData = this.generateChartData(salesData.daily, 'seller');

      return {
        totalSales: salesData.total,
        salesLast30Days: salesData.last30,
        monthToDate: salesData.monthToDate,
        pastHours: salesData.past24,
        ordersData: chartData,
        topClients: clientData,
        topProducts: productsData,
        recentOrders: ordersData.recent,
        topSalesReps: this.getDefaultSalesReps(),
      };
    } catch (error) {
      console.error('Error in getSellerDashboard:', error);
      return this.getSellerDashboardFallback();
    }
  }

  /**
   * Get Buyer Dashboard Statistics
   */
  async getBuyerDashboard(userId: string): Promise<BuyerStats> {
    try {
      const [purchasesData, brandsData, ordersData] = await Promise.all([
        this.fetchBuyerPurchases(userId),
        this.fetchBuyerBrands(userId),
        this.fetchBuyerOrders(userId),
      ]);

      const chartData = this.generateChartData(purchasesData.daily, 'buyer');

      return {
        totalPurchases: purchasesData.total,
        pastDays: purchasesData.last30,
        monthToDate: purchasesData.monthToDate,
        pastHours: purchasesData.past24,
        ordersData: chartData,
        topBrands: brandsData.topBrands,
        recentOrders: ordersData.recent,
        brandsForReorder: brandsData.reorder,
        sampleRequests: [],
        topProducts: this.getDefaultTopProducts(),
      };
    } catch (error) {
      console.error('Error in getBuyerDashboard:', error);
      return this.getBuyerDashboardFallback();
    }
  }

  /**
   * Fetch admin sales data
   */
  private async fetchAdminSalesData(businessId: string) {
    try {
      const response = await this.axiosInstance.get('/dashboard/admin/sales', {
        params: { business_id: businessId },
      });

      return response.data?.data || {
        total: 0,
        last30: 0,
        daily: [],
      };
    } catch (error) {
      console.error('Error fetching admin sales data:', error);
      return { total: 0, last30: 0, daily: [] };
    }
  }

  /**
   * Fetch admin vendor data
   */
  private async fetchAdminVendorData(businessId: string) {
    try {
      const response = await this.axiosInstance.get('/dashboard/admin/vendors', {
        params: { business_id: businessId },
      });

      return response.data?.data || {
        active: 0,
        pending: 0,
        topVendors: [],
      };
    } catch (error) {
      console.error('Error fetching admin vendor data:', error);
      return { active: 0, pending: 0, topVendors: [] };
    }
  }

  /**
   * Fetch seller sales data
   */
  private async fetchSellerSalesData(businessId: string) {
    try {
      const response = await this.axiosInstance.get('/dashboard/seller/sales', {
        params: { business_id: businessId },
      });

      return response.data?.data || {
        total: 0,
        last30: 0,
        monthToDate: 0,
        past24: 0,
        daily: [],
      };
    } catch (error) {
      console.error('Error fetching seller sales data:', error);
      return {
        total: 0,
        last30: 0,
        monthToDate: 0,
        past24: 0,
        daily: [],
      };
    }
  }

  /**
   * Fetch top clients
   */
  private async fetchTopClients(businessId: string): Promise<Client[]> {
    try {
      const response = await this.axiosInstance.get(
        '/dashboard/seller/clients',
        {
          params: { business_id: businessId, limit: 5 },
        }
      );

      return response.data?.data || [];
    } catch (error) {
      console.error('Error fetching top clients:', error);
      return [];
    }
  }

  /**
   * Fetch top products
   */
  private async fetchTopProducts(businessId: string): Promise<Product[]> {
    try {
      const response = await this.axiosInstance.get(
        '/dashboard/seller/products',
        {
          params: { business_id: businessId, limit: 5 },
        }
      );

      return response.data?.data || [];
    } catch (error) {
      console.error('Error fetching top products:', error);
      return [];
    }
  }

  /**
   * Fetch recent orders
   */
  private async fetchRecentOrders(businessId: string, type: string) {
    try {
      const endpoint =
        type === 'admin'
          ? '/dashboard/admin/orders'
          : type === 'seller'
            ? '/dashboard/seller/orders'
            : '/dashboard/buyer/orders';

      const response = await this.axiosInstance.get(endpoint, {
        params: { business_id: businessId, limit: 10 },
      });

      return response.data?.data || { recent: [], total: 0, last30: 0 };
    } catch (error) {
      console.error('Error fetching recent orders:', error);
      return { recent: [], total: 0, last30: 0 };
    }
  }

  /**
   * Fetch buyer purchases
   */
  private async fetchBuyerPurchases(userId: string) {
    try {
      const response = await this.axiosInstance.get(
        '/dashboard/buyer/purchases',
        {
          params: { user_id: userId },
        }
      );

      return response.data?.data || {
        total: 0,
        last30: 0,
        monthToDate: 0,
        past24: 0,
        daily: [],
      };
    } catch (error) {
      console.error('Error fetching buyer purchases:', error);
      return {
        total: 0,
        last30: 0,
        monthToDate: 0,
        past24: 0,
        daily: [],
      };
    }
  }

  /**
   * Fetch buyer brands
   */
  private async fetchBuyerBrands(userId: string) {
    try {
      const response = await this.axiosInstance.get(
        '/dashboard/buyer/brands',
        {
          params: { user_id: userId },
        }
      );

      return response.data?.data || {
        topBrands: [],
        reorder: [],
      };
    } catch (error) {
      console.error('Error fetching buyer brands:', error);
      return { topBrands: [], reorder: [] };
    }
  }

  /**
   * Fetch buyer orders
   */
  private async fetchBuyerOrders(userId: string) {
    try {
      const response = await this.axiosInstance.get(
        '/dashboard/buyer/orders',
        {
          params: { user_id: userId, limit: 10 },
        }
      );

      return response.data?.data || { recent: [], total: 0 };
    } catch (error) {
      console.error('Error fetching buyer orders:', error);
      return { recent: [], total: 0 };
    }
  }

  /**
   * Generate chart data for last 30 days
   */
  private generateChartData(dailyData: any[], type: string): any[] {
    const last30Days: any[] = [];
    const today = new Date();

    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });

      const dayData =
        dailyData?.find((d: any) => d.date === dateStr) || {};

      if (type === 'admin') {
        last30Days.push({
          date: dateStr,
          sales: dayData.sales || 0,
          orders: dayData.orders || 0,
        });
      } else if (type === 'seller') {
        last30Days.push({
          date: dateStr,
          total: dayData.sales || 0,
          count: dayData.orders || 0,
        });
      } else {
        last30Days.push({
          date: dateStr,
          total: dayData.purchases || 0,
          count: dayData.orders || 0,
        });
      }
    }

    return last30Days;
  }

  /**
   * Fallback data methods
   */
  private getAdminDashboardFallback(): AdminStats {
    return {
      totalSales: 0,
      totalOrders: 0,
      activeVendors: 0,
      pendingApprovals: 0,
      salesLast30Days: 0,
      ordersLast30Days: 0,
      chartData: [],
      recentOrders: [],
      topVendors: [],
    };
  }

  private getSellerDashboardFallback(): SellerStats {
    return {
      totalSales: 0,
      salesLast30Days: 0,
      monthToDate: 0,
      pastHours: 0,
      ordersData: [],
      topClients: [],
      topProducts: [],
      recentOrders: [],
      topSalesReps: [],
    };
  }

  private getBuyerDashboardFallback(): BuyerStats {
    return {
      totalPurchases: 0,
      pastDays: 0,
      monthToDate: 0,
      pastHours: 0,
      ordersData: [],
      topBrands: [],
      recentOrders: [],
      brandsForReorder: [],
      sampleRequests: [],
      topProducts: [],
    };
  }

  private getDefaultSalesReps(): SalesRep[] {
    return [
      { name: 'Unassigned', total: 0 },
    ];
  }

  private getDefaultTopProducts(): BuyerProduct[] {
    return [];
  }
}