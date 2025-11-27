'use client';
import React, { useState, useEffect } from 'react';
import { Bell, Home, Megaphone, Package, CreditCard, Settings, HelpCircle, Plus, X, Upload, Target, DollarSign, MousePointer, Eye, CheckCircle, ChevronDown, ChevronRight, Menu, User, LogOut, Users, Folder } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import StatCard from "@/components/StatCard";
import PageHeading from "@/components/PageHeading";
import Link from "next/link";


export default function DashboardPage() {
	const chartData = [
    { date: '3 Oct', clicks: 0, impressions: 0 },
    { date: '4 Oct', clicks: 0, impressions: 0 },
    { date: '5 Oct', clicks: 0, impressions: 0 },
    { date: '6 Oct', clicks: 0, impressions: 0 },
    { date: '7 Oct', clicks: 0, impressions: 0 },
    { date: '8 Oct', clicks: 0, impressions: 0 },
    { date: '9 Oct', clicks: 0, impressions: 0 },
	];

  return (
    <div className="flex-1 p-4 md:p-6 overflow-auto">
      {/* Dynamic Page Heading with Business Name */}
      <div className="mb-6">
        <PageHeading 
          pageName="Dashboard" 
          description="Track your advertising performance"
        />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Clicks"
          value="0"
          icon={MousePointer}
          color="bg-blue-500"
          trend="+0%"
        />
        <StatCard
          title="Impressions"
          value="0"
          icon={Eye}
          color="bg-red-500"
          trend="+0%"
        />
        <StatCard
          title="Ad Spend"
          value="$0.00"
          icon={DollarSign}
          color="bg-gray-700"
          trend="$0.00"
        />
        <StatCard
          title="Conversions"
          value="0"
          icon={CheckCircle}
          color="bg-gray-500"
          trend="+0%"
        />
      </div>

      {/* Campaign Insights Chart */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 md:p-6 transition-colors duration-300">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Campaign Insights</h2>
          <select className="px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-offset-0 accent-border">
            <option>Last 7 Days</option>
            <option>Last 30 Days</option>
            <option>Last 90 Days</option>
          </select>
        </div>

        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
            <XAxis dataKey="date" stroke="#6B7280" />
            <YAxis stroke="#6B7280" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1F2937',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
              }}
            />
            <Line
              type="monotone"
              dataKey="clicks"
              stroke="#3B82F6"
              strokeWidth={3}
              dot={{ fill: '#3B82F6', r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="impressions"
              stroke="#EF4444"
              strokeWidth={3}
              dot={{ fill: '#EF4444', r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}