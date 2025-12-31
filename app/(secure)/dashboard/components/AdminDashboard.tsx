'use client';

import React, { useState, useEffect } from 'react';
import { MousePointer, Eye, DollarSign, CheckCircle, TrendingUp } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import StatCard from "@/components/StatCard";
import PageHeading from "@/components/PageHeading";
import { useTheme } from 'next-themes';

interface AdminStats {
  totalSales: number;
  totalOrders: number;
  activeVendors: number;
  pendingApprovals: number;
  salesLast30Days: number;
  ordersLast30Days: number;
  chartData: any[];
  recentOrders: any[];
  topVendors: any[];
}

export default function AdminDashboard() {
  const { theme } = useTheme();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminStats();
  }, []);

  const fetchAdminStats = async () => {
    try {
      const response = await fetch('/api/dashboard/admin');
      const data = await response.json();
      if (data.status === 'success') {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching admin stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 p-4 md:p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading admin dashboard...</p>
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
          pageName="Admin Dashboard" 
          description="Platform overview and vendor management"
        />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Sales"
          value={`$${stats?.totalSales?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}`}
          icon={DollarSign}
          color="bg-emerald-500"
          trend={`+${stats?.salesLast30Days || 0} (30d)`}
        />
        <StatCard
          title="Total Orders"
          value={stats?.totalOrders?.toString() || '0'}
          icon={CheckCircle}
          color="bg-blue-500"
          trend={`+${stats?.ordersLast30Days || 0} (30d)`}
        />
        <StatCard
          title="Active Vendors"
          value={stats?.activeVendors?.toString() || '0'}
          icon={TrendingUp}
          color="bg-purple-500"
          trend="verified"
        />
        <StatCard
          title="Pending Approvals"
          value={stats?.pendingApprovals?.toString() || '0'}
          icon={MousePointer}
          color="bg-orange-500"
          trend="review needed"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Sales Chart */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 md:p-6 transition-colors duration-300">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">Sales Trend (30 Days)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stats?.chartData || []}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#374151" : "#E5E7EB"} opacity={0.5} />
              <XAxis dataKey="date" stroke={isDark ? "#6B7280" : "#9CA3AF"} />
              <YAxis stroke={isDark ? "#6B7280" : "#9CA3AF"} />
              <Tooltip
                contentStyle={{
                  backgroundColor: tooltipBg,
                  border: `1px solid ${tooltipBorder}`,
                  borderRadius: '8px',
                  color: tooltipText,
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="sales"
                stroke="#10B981"
                strokeWidth={3}
                dot={{ fill: '#10B981', r: 4 }}
                name="Sales ($)"
              />
              <Line
                type="monotone"
                dataKey="orders"
                stroke="#3B82F6"
                strokeWidth={3}
                dot={{ fill: '#3B82F6', r: 4 }}
                name="Orders (#)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Vendors Performance Chart */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 md:p-6 transition-colors duration-300">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">Top Vendors Performance</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats?.topVendors || []}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#374151" : "#E5E7EB"} opacity={0.5} />
              <XAxis dataKey="name" stroke={isDark ? "#6B7280" : "#9CA3AF"} />
              <YAxis stroke={isDark ? "#6B7280" : "#9CA3AF"} />
              <Tooltip
                contentStyle={{
                  backgroundColor: tooltipBg,
                  border: `1px solid ${tooltipBorder}`,
                  borderRadius: '8px',
                  color: tooltipText,
                }}
              />
              <Legend />
              <Bar dataKey="sales" fill="#8B5CF6" name="Sales" />
              <Bar dataKey="orders" fill="#06B6D4" name="Orders" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden transition-colors duration-300">
        <div className="p-4 md:p-6 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Recent Orders</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/50">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Order ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Vendor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Buyer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {stats?.recentOrders && stats.recentOrders.length > 0 ? (
                stats.recentOrders.map((order: any) => (
                  <tr key={order.order_id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600 dark:text-blue-400">{order.order_id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{order.vendor_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{order.buyer_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-gray-100">${order.total}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        order.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                        order.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                        'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">{order.date}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    No orders found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}