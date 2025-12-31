'use client';

import React, { useState, useEffect } from 'react';
import { TrendingUp, Users, Package, DollarSign } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import StatCard from "@/components/StatCard";
import PageHeading from "@/components/PageHeading";
import { useTheme } from 'next-themes';

interface SellerStats {
  totalSales: number;
  salesLast30Days: number;
  monthToDate: number;
  pastHours: number;
  ordersData: any[];
  topClients: any[];
  topProducts: any[];
  recentOrders: any[];
  topSalesReps: any[];
}

export default function SellerDashboard() {
  const { theme } = useTheme();
  const [stats, setStats] = useState<SellerStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSellerStats();
  }, []);

  const fetchSellerStats = async () => {
    try {
      const response = await fetch('/api/dashboard/seller');
      const data = await response.json();
      if (data.status === 'success') {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching seller stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 p-4 md:p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading seller dashboard...</p>
        </div>
      </div>
    );
  }

  const isDark = theme === 'dark';
  const tooltipBg = isDark ? '#1F2937' : '#FFFFFF';
  const tooltipBorder = isDark ? '#374151' : '#E5E7EB';
  const tooltipText = isDark ? '#FFFFFF' : '#000000';

  return (
    <div className="flex-1 p-4 md:p-6 overflow-auto">
      <div className="mb-6">
        <PageHeading 
          pageName="Seller Dashboard" 
          description="Track your sales performance and orders"
        />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Sales"
          value={`$${stats?.totalSales?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}`}
          icon={DollarSign}
          color="bg-emerald-500"
          trend={`${stats?.totalSales ? Math.round((stats.totalSales / 100) * 100) : 0} orders`}
        />
        <StatCard
          title="Past 30 Days"
          value={`$${stats?.salesLast30Days?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}`}
          icon={TrendingUp}
          color="bg-blue-500"
          trend={`40 orders`}
        />
        <StatCard
          title="Month to Date"
          value={`$${stats?.monthToDate?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}`}
          icon={Package}
          color="bg-purple-500"
          trend={`40 orders`}
        />
        <StatCard
          title="Past 24 Hours"
          value={`$${stats?.pastHours?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}`}
          icon={Users}
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
              <XAxis dataKey="date" stroke={isDark ? "#6B7280" : "#9CA3AF"} angle={-45} textAnchor="end" height={80} />
              <YAxis stroke={isDark ? "#6B7280" : "#9CA3AF"} yAxisId="left" />
              <YAxis stroke={isDark ? "#6B7280" : "#9CA3AF"} yAxisId="right" orientation="right" />
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

        {/* Top Clients Table */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 md:p-6 transition-colors duration-300">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">Top Ordering Clients</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800">
                  <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-gray-400">Account</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-600 dark:text-gray-400">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {stats?.topClients && stats.topClients.length > 0 ? (
                  stats.topClients.map((client: any, idx: number) => (
                    <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="py-3 px-4 text-blue-600 dark:text-blue-400 font-medium">{client.name}</td>
                      <td className="py-3 px-4 text-right text-gray-900 dark:text-gray-100 font-semibold">${client.total}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={2} className="py-8 text-center text-gray-500 dark:text-gray-400">No data available</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Top Selling Products */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 md:p-6 transition-colors duration-300">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">Top Selling Products</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800">
                  <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-gray-400">Product</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-600 dark:text-gray-400">Qty. Sold</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-600 dark:text-gray-400">Amount Sold ($)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {stats?.topProducts && stats.topProducts.length > 0 ? (
                  stats.topProducts.map((product: any, idx: number) => (
                    <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="py-3 px-4 text-blue-600 dark:text-blue-400 font-medium">{product.name}</td>
                      <td className="py-3 px-4 text-right text-gray-900 dark:text-gray-100">{product.qty}</td>
                      <td className="py-3 px-4 text-right text-gray-900 dark:text-gray-100 font-semibold">${product.amount}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-gray-500 dark:text-gray-400">No products sold yet</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 md:p-6 transition-colors duration-300">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">Recent Orders</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800">
                  <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-gray-400">Order #</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-gray-400">Client</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-600 dark:text-gray-400">Status</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-600 dark:text-gray-400">Total</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-600 dark:text-gray-400">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {stats?.recentOrders && stats.recentOrders.length > 0 ? (
                  stats.recentOrders.map((order: any) => (
                    <tr key={order.order_id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="py-3 px-4 text-blue-600 dark:text-blue-400 font-medium">{order.order_id}</td>
                      <td className="py-3 px-4 text-gray-900 dark:text-gray-100">{order.client_name}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          order.status === 'Accepted' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                          'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-gray-900 dark:text-gray-100 font-semibold">${order.total}</td>
                      <td className="py-3 px-4 text-right text-gray-600 dark:text-gray-400 text-xs">{order.date}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-500 dark:text-gray-400">No orders found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Top Sales Representatives */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 md:p-6 transition-colors duration-300">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">Top Sales Representatives</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800">
                <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-gray-400">Sales Representative</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-600 dark:text-gray-400">Total Sold (YTD)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {stats?.topSalesReps && stats.topSalesReps.length > 0 ? (
                stats.topSalesReps.map((rep: any, idx: number) => (
                  <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="py-3 px-4 text-gray-900 dark:text-gray-100 font-medium">{rep.name}</td>
                    <td className="py-3 px-4 text-right text-gray-900 dark:text-gray-100 font-semibold">${rep.total}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={2} className="py-8 text-center text-gray-500 dark:text-gray-400">No data available</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="mt-4 text-right">
          <button className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium">
            View Full Summary →
          </button>
        </div>
      </div>
    </div>
  );
}