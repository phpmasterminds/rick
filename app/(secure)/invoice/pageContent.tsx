'use client';

import React, { useState, useCallback, useEffect } from 'react';
import {
  Loader2, AlertCircle, Search, Eye, ChevronRight, Download, Filter, Calendar
} from 'lucide-react';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';
import axios from 'axios';

interface UserData {
  data: {
    user_group_id?: number;
    business_id?: string;
    [key: string]: any;
  };
}

interface InvoiceItem {
  id: string | number;
  registration_id: string | number;
  user_id: string | number;
  invoice_number: string;
  subtotal: string | number;
  tax: string | number;
  total_amount: string | number;
  trial_days: string | number;
  trial_end_date: string;
  billing_start_date: string;
  status: 'draft' | 'issued' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  payment_method: string | null;
  paid_at: string | null;
  due_date: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  full_name: string;
  email: string;
  company_name: string;
  license_type: string;
}

export default function InvoiceListPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<InvoiceItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'issued' | 'sent' | 'paid' | 'overdue' | 'cancelled'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month' | 'year'>('all');

  // Get user info from localStorage
  const getUserInfo = useCallback(() => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const userData: UserData = JSON.parse(userStr);
        return userData.data;
      }
    } catch (error) {
      console.error('Error parsing user from localStorage:', error);
    }
    return null;
  }, []);

  // Fetch invoices
  const fetchInvoices = useCallback(async () => {
    try {
      const userInfo = getUserInfo();
      if (!userInfo?.user_id) {
        toast.error('User information not found', {
          position: 'bottom-center',
          autoClose: 3000,
        });
        setLoading(false);
        return;
      }

      const response = await axios.get('/api/user/invoice', {
        params: {
          user_id: userInfo.user_id,
        },
      });

      if (response.data.status === 'success' && response.data.data?.users) {
        // Convert string numbers to actual numbers for proper sorting/calculation
        const invoicesData = response.data.data.users.map((invoice: any) => ({
          ...invoice,
          id: String(invoice.id),
          total_amount: Number(invoice.total_amount),
          subtotal: Number(invoice.subtotal),
          tax: Number(invoice.tax),
          trial_days: Number(invoice.trial_days),
        }));
        setInvoices(invoicesData);
      } else {
        toast.error(response.data.error || 'Failed to load invoices', {
          position: 'bottom-center',
          autoClose: 3000,
        });
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
      toast.error('Failed to load invoices', {
        position: 'bottom-center',
        autoClose: 3000,
      });
    } finally {
      setLoading(false);
    }
  }, [getUserInfo]);

  // Initialize data
  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  // Filter invoices
  useEffect(() => {
    let filtered = invoices;

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(inv => inv.status === statusFilter);
    }

    // Apply date filter
    if (dateFilter !== 'all') {
      const now = new Date();

      filtered = filtered.filter(inv => {
        const date = new Date(inv.created_at);
        switch (dateFilter) {
          case 'today':
            return date.toDateString() === now.toDateString();
          case 'week':
            const weekAgo = new Date(now);
            weekAgo.setDate(weekAgo.getDate() - 7);
            return date >= weekAgo;
          case 'month':
            return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
          case 'year':
            return date.getFullYear() === now.getFullYear();
          default:
            return true;
        }
      });
    }

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(inv =>
        inv.invoice_number?.toLowerCase().includes(term) ||
        inv.full_name?.toLowerCase().includes(term) ||
        inv.email?.toLowerCase().includes(term) ||
        inv.company_name?.toLowerCase().includes(term)
      );
    }

    setFilteredInvoices(filtered);
  }, [searchTerm, statusFilter, dateFilter, invoices]);

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'issued':
        return 'bg-purple-100 text-purple-800';
      case 'sent':
        return 'bg-blue-100 text-blue-800';
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft':
        return '📝';
      case 'issued':
        return '📋';
      case 'sent':
        return '📧';
      case 'paid':
        return '✓';
      case 'overdue':
        return '⚠️';
      case 'cancelled':
        return '✕';
      default:
        return '•';
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-teal-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading invoices...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Invoices</h1>
          <p className="text-gray-600">Manage and track your invoices</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total</p>
                <p className="text-2xl font-bold text-gray-800">{invoices.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-xl">📋</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Paid</p>
                <p className="text-2xl font-bold text-green-600">
                  {invoices.filter(inv => inv.status === 'paid').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-xl">✓</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Pending</p>
                <p className="text-2xl font-bold text-blue-600">
                  {invoices.filter(inv => inv.status === 'sent').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-xl">📧</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Overdue</p>
                <p className="text-2xl font-bold text-red-600">
                  {invoices.filter(inv => inv.status === 'overdue').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-xl">⚠️</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Value</p>
                <p className="text-xl font-bold text-teal-600">
                  {formatCurrency(invoices.reduce((sum, inv) => sum + Number(inv.total_amount), 0))}
                </p>
              </div>
              <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center">
                <span className="text-xl">💰</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by invoice number, customer, or order..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="all">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="issued">Issued</option>
                <option value="sent">Sent</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Date Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Date Range
              </label>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">Last 7 Days</option>
                <option value="month">This Month</option>
                <option value="year">This Year</option>
              </select>
            </div>
          </div>
        </div>

        {/* Invoices Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {filteredInvoices.length === 0 ? (
            <div className="p-12 text-center">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">No invoices found</h3>
              <p className="text-gray-600">
                {invoices.length === 0
                  ? 'You have no invoices yet.'
                  : 'No invoices match your search criteria.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Invoice Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Company
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Due Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.map((invoice) => (
                    <tr key={invoice.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-sm font-semibold text-gray-900">{invoice.invoice_number}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-700 font-medium">{invoice.company_name}</p>
                        <p className="text-xs text-gray-500">{invoice.license_type}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-700">{invoice.full_name}</p>
                        <p className="text-xs text-gray-500">{invoice.email}</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-sm text-gray-600">{formatDate(invoice.created_at)}</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-sm text-gray-600">{formatDate(invoice.due_date)}</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">{formatCurrency(Number(invoice.total_amount))}</div>
                        <p className="text-xs text-gray-500">+{formatCurrency(Number(invoice.tax))} tax</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit ${getStatusBadgeClass(invoice.status)}`}>
                          <span>{getStatusIcon(invoice.status)}</span>
                          {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => router.push(`/invoice/${invoice.id}`)}
                            className="p-2 hover:bg-teal-50 rounded-lg transition-colors"
                            title="View invoice"
                          >
                            <Eye className="w-4 h-4 text-teal-600" />
                          </button>
                          <button
                            className="p-2 hover:bg-teal-50 rounded-lg transition-colors"
                            title="Download invoice"
                          >
                            <Download className="w-4 h-4 text-teal-600" />
                          </button>
                          <button
                            onClick={() => router.push(`/invoice/${invoice.id}`)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title="More options"
                          >
                            <ChevronRight className="w-4 h-4 text-gray-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>Showing {filteredInvoices.length} of {invoices.length} invoices</p>
        </div>
      </div>
    </div>
  );
}