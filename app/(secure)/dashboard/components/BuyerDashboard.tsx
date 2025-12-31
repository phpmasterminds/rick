'use client';

import React, { useState, useEffect } from 'react';
import { ShoppingCart, TrendingUp, Package, Store } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import StatCard from "@/components/StatCard";
import PageHeading from "@/components/PageHeading";
import { useTheme } from 'next-themes';

interface BuyerStats {
  totalPurchases: number;
  pastDays: number;
  monthToDate: number;
  pastHours: number;
  ordersData: any[];
  topBrands: any[];
  recentOrders: any[];
  brandsForReorder: any[];
  sampleRequests: any[];
  topProducts: any[];
}

export default function BuyerDashboard() {
  const { theme } = useTheme();
  const [stats, setStats] = useState<BuyerStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBuyerStats();
  }, []);

  const fetchBuyerStats = async () => {
    try {
      const response = await fetch('/api/dashboard/buyer');
      const data = await response.json();
      if (data.status === 'success') {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching buyer stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 p-4 md:p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading buyer dashboard...</p>
        </div>
      </div>
    );
  }

  const isDark = theme === 'dark';
  const tooltipBg = isDark ? '#1F2937' : '#FFFFFF';
  const tooltipBorder = isDark ? '#374151' : '#E5E7EB';
  const tooltipText = isDark ? '#FFFFFF' : '#000000';
  const noResultsBg = isDark ? 'text-gray-600' : 'text-gray-400';

  return (
    <div className="flex-1 p-4 md:p-6 overflow-auto">
      <div className="mb-6">
        <PageHeading 
          pageName="Buyer Dashboard" 
          description="Track your purchases and orders"
        />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Purchases"
          value={`$${stats?.totalPurchases?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}`}
          icon={ShoppingCart}
          color="bg-emerald-500"
          trend={`0 orders`}
        />
        <StatCard
          title="Past 30 Days"
          value={`$${stats?.pastDays?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}`}
          icon={TrendingUp}
          color="bg-blue-500"
          trend={`0 orders`}
        />
        <StatCard
          title="Month to Date"
          value={`$${stats?.monthToDate?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}`}
          icon={Package}
          color="bg-purple-500"
          trend={`0 orders`}
        />
        <StatCard
          title="Past 24 Hours"
          value={`$${stats?.pastHours?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}`}
          icon={Store}
          color="bg-orange-500"
          trend={`0 orders`}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Orders Chart */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 md:p-6 transition-colors duration-300">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">Orders</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats?.ordersData || []}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#374151" : "#E5E7EB"} opacity={0.5} />
              <XAxis dataKey="date" stroke={isDark ? "#6B7280" : "#9CA3AF"} />
              <YAxis yAxisId="left" stroke={isDark ? "#6B7280" : "#9CA3AF"} />
              <YAxis yAxisId="right" orientation="right" stroke={isDark ? "#6B7280" : "#9CA3AF"} />
              <Tooltip
                contentStyle={{
                  backgroundColor: tooltipBg,
                  border: `1px solid ${tooltipBorder}`,
                  borderRadius: '8px',
                  color: tooltipText,
                }}
              />
              <Legend />
              <Bar yAxisId="left" dataKey="total" fill="#00D9A3" name="Order Totals ($)" />
              <Bar yAxisId="right" dataKey="count" fill="#3B82F6" name="Number of Orders (#)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Brands Table */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 md:p-6 transition-colors duration-300">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">Top Brands</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800">
                  <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-gray-400">Brand</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-600 dark:text-gray-400">Total Bought ($)</th>
                </tr>
              </thead>
              <tbody>
                {stats?.topBrands && stats.topBrands.length > 0 ? (
                  stats.topBrands.map((brand: any, idx: number) => (
                    <tr key={idx} className="border-b border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="py-3 px-4 text-gray-900 dark:text-gray-100">{brand.name}</td>
                      <td className="py-3 px-4 text-right text-gray-900 dark:text-gray-100 font-semibold">${brand.total}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={2} className={`py-8 text-center ${noResultsBg}`}>No results</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Middle Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Recently Shipped Orders */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 md:p-6 transition-colors duration-300">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">Recently Shipped Orders</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800">
                  <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-gray-400">Order #</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-gray-400">Seller</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-600 dark:text-gray-400">Total</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-600 dark:text-gray-400">Ship Date</th>
                </tr>
              </thead>
              <tbody>
                {stats?.recentOrders && stats.recentOrders.length > 0 ? (
                  stats.recentOrders.map((order: any, idx: number) => (
                    <tr key={idx} className="border-b border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="py-3 px-4 text-blue-600 dark:text-blue-400 font-medium">{order.order_id}</td>
                      <td className="py-3 px-4 text-gray-900 dark:text-gray-100">{order.seller_name}</td>
                      <td className="py-3 px-4 text-right text-gray-900 dark:text-gray-100 font-semibold">${order.total}</td>
                      <td className="py-3 px-4 text-right text-gray-600 dark:text-gray-400 text-xs">{order.ship_date}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className={`py-8 text-center ${noResultsBg}`}>No results</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Brands Up For Reorder */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 md:p-6 transition-colors duration-300">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">Top Brands Up For Reorder</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800">
                  <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-gray-400">Brand</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-600 dark:text-gray-400">Num. Orders</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-600 dark:text-gray-400">Last Order</th>
                </tr>
              </thead>
              <tbody>
                {stats?.brandsForReorder && stats.brandsForReorder.length > 0 ? (
                  stats.brandsForReorder.map((brand: any, idx: number) => (
                    <tr key={idx} className="border-b border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="py-3 px-4 text-gray-900 dark:text-gray-100">{brand.name}</td>
                      <td className="py-3 px-4 text-center text-gray-900 dark:text-gray-100">{brand.order_count}</td>
                      <td className="py-3 px-4 text-right text-gray-600 dark:text-gray-400 text-xs">{brand.last_order}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className={`py-8 text-center ${noResultsBg}`}>No results</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Sample Requests */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 md:p-6 transition-colors duration-300">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">Sample Requests</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800">
                  <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-gray-400">Seller</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-gray-400">User</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-gray-400">Note</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-600 dark:text-gray-400">Date</th>
                </tr>
              </thead>
              <tbody>
                {stats?.sampleRequests && stats.sampleRequests.length > 0 ? (
                  stats.sampleRequests.map((req: any, idx: number) => (
                    <tr key={idx} className="border-b border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="py-3 px-4 text-gray-900 dark:text-gray-100">{req.seller_name}</td>
                      <td className="py-3 px-4 text-gray-900 dark:text-gray-100">{req.user_name}</td>
                      <td className="py-3 px-4 text-gray-900 dark:text-gray-100">{req.note}</td>
                      <td className="py-3 px-4 text-right text-gray-600 dark:text-gray-400 text-xs">{req.date}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className={`py-8 text-center ${noResultsBg}`}>No results</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 md:p-6 transition-colors duration-300">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">Top Products</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800">
                  <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-gray-400">Product</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-600 dark:text-gray-400">Qty. Bought</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-600 dark:text-gray-400">Amount Bought ($)</th>
                </tr>
              </thead>
              <tbody>
                {stats?.topProducts && stats.topProducts.length > 0 ? (
                  stats.topProducts.map((product: any, idx: number) => (
                    <tr key={idx} className="border-b border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="py-3 px-4 text-gray-900 dark:text-gray-100">{product.name}</td>
                      <td className="py-3 px-4 text-right text-gray-900 dark:text-gray-100">{product.qty}</td>
                      <td className="py-3 px-4 text-right text-gray-900 dark:text-gray-100 font-semibold">${product.amount}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className={`py-8 text-center ${noResultsBg}`}>No results</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Orders From Last 30 Days */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 md:p-6 transition-colors duration-300">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">Orders From Last 30 Days</h2>
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[120px]">
            <div className="bg-gray-700 dark:bg-gray-800 text-white rounded-lg p-4 text-center">
              <div className="text-sm font-medium mb-1">Submitted</div>
              <div className="text-2xl font-bold">0</div>
            </div>
          </div>
          <div className="flex-1 min-w-[120px]">
            <div className="bg-emerald-500 text-white rounded-lg p-4 text-center">
              <div className="text-sm font-medium mb-1">Accepted</div>
              <div className="text-2xl font-bold">0</div>
            </div>
          </div>
          <div className="flex-1 min-w-[120px]">
            <div className="bg-blue-500 text-white rounded-lg p-4 text-center">
              <div className="text-sm font-medium mb-1">Shipped</div>
              <div className="text-2xl font-bold">0</div>
            </div>
          </div>
          <div className="flex-1 min-w-[120px]">
            <div className="bg-gray-400 dark:bg-gray-600 text-white rounded-lg p-4 text-center">
              <div className="text-sm font-medium mb-1">Complete</div>
              <div className="text-2xl font-bold">0</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}