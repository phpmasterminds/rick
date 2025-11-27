'use client';

import React, { useState, useCallback, useEffect } from 'react';
import {
  Loader2, AlertCircle, ArrowLeft, Download, Send, Mail, Phone, MapPin, Calendar, DollarSign, Printer
} from 'lucide-react';
import { toast } from 'react-toastify';
import { useRouter, useParams } from 'next/navigation';
import axios from 'axios';

interface InvoiceItem {
  id: string | number;
  invoice_number: string;
  business_id: string;
  order_id: string | number;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  customer_address?: string;
  amount: number;
  total_amount: number;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  invoice_date: string;
  due_date: string;
  notes?: string;
  items?: InvoiceLineItem[];
  created_at: string;
  updated_at?: string;
}

interface InvoiceLineItem {
  id: string | number;
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
  tax_rate?: number;
}

interface UserData {
  data: {
    user_group_id?: number;
    business_id?: string;
    [key: string]: any;
  };
}

export default function InvoiceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const invoiceId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [invoice, setInvoice] = useState<InvoiceItem | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [sending, setSending] = useState(false);

  // Get user info
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

  // Fetch invoice details
  const fetchInvoice = useCallback(async () => {
    try {
      const response = await axios.get(`/api/invoices/${invoiceId}`);

      if (response.data.status === 'success') {
        setInvoice(response.data.data);
      } else {
        toast.error(response.data.error || 'Failed to load invoice', {
          position: 'bottom-center',
          autoClose: 3000,
        });
      }
    } catch (error) {
      console.error('Error fetching invoice:', error);
      toast.error('Failed to load invoice', {
        position: 'bottom-center',
        autoClose: 3000,
      });
    } finally {
      setLoading(false);
    }
  }, [invoiceId]);

  // Initialize
  useEffect(() => {
    if (invoiceId) {
      fetchInvoice();
    }
  }, [invoiceId, fetchInvoice]);

  // Handle download
  const handleDownload = async () => {
    try {
      setDownloading(true);
      const response = await axios.get(`/api/invoices/${invoiceId}/download`, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${invoice?.invoice_number}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Invoice downloaded successfully', {
        position: 'bottom-center',
        autoClose: 3000,
      });
    } catch (error) {
      console.error('Error downloading invoice:', error);
      toast.error('Failed to download invoice', {
        position: 'bottom-center',
        autoClose: 3000,
      });
    } finally {
      setDownloading(false);
    }
  };

  // Handle send/email
  const handleSendEmail = async () => {
    try {
      setSending(true);
      const response = await axios.post(`/api/invoices/${invoiceId}/send`, {});

      if (response.data.status === 'success') {
        toast.success('Invoice sent successfully', {
          position: 'bottom-center',
          autoClose: 3000,
        });
        setInvoice(prev => prev ? { ...prev, status: 'sent' } : null);
      } else {
        toast.error(response.data.error || 'Failed to send invoice', {
          position: 'bottom-center',
          autoClose: 3000,
        });
      }
    } catch (error) {
      console.error('Error sending invoice:', error);
      toast.error('Failed to send invoice', {
        position: 'bottom-center',
        autoClose: 3000,
      });
    } finally {
      setSending(false);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
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

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
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
          <p className="text-gray-600 font-medium">Loading invoice...</p>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Invoice Not Found</h2>
          <p className="text-gray-600 mb-6">The invoice you're looking for doesn't exist or has been deleted.</p>
          <button
            onClick={() => router.push('/invoices')}
            className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium transition-colors"
          >
            Back to Invoices
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/invoices')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Back to invoices"
            >
              <ArrowLeft className="w-6 h-6 text-gray-600" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{invoice.invoice_number}</h1>
              <p className="text-gray-600 mt-1">Invoice Details</p>
            </div>
          </div>
          <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusBadgeClass(invoice.status)}`}>
            {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
          </span>
        </div>

        {/* Invoice Document */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          {/* Top Section */}
          <div className="flex justify-between items-start mb-8 pb-8 border-b border-gray-200">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">INVOICE</h2>
              <p className="text-gray-600">#{invoice.invoice_number}</p>
            </div>
            <div className="text-right">
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-1">Invoice Date</p>
                <p className="text-lg font-semibold text-gray-900">{formatDate(invoice.invoice_date)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Due Date</p>
                <p className="text-lg font-semibold text-gray-900">{formatDate(invoice.due_date)}</p>
              </div>
            </div>
          </div>

          {/* Bill To Section */}
          <div className="grid grid-cols-2 gap-8 mb-8 pb-8 border-b border-gray-200">
            <div>
              <p className="text-sm font-semibold text-gray-700 uppercase mb-4">Bill To</p>
              <div className="space-y-2">
                <p className="font-semibold text-gray-900">{invoice.customer_name}</p>
                {invoice.customer_address && (
                  <div className="flex gap-2 text-gray-600 text-sm">
                    <MapPin className="w-4 h-4 flex-shrink-0" />
                    <p>{invoice.customer_address}</p>
                  </div>
                )}
                {invoice.customer_email && (
                  <div className="flex gap-2 text-gray-600 text-sm">
                    <Mail className="w-4 h-4 flex-shrink-0" />
                    <p>{invoice.customer_email}</p>
                  </div>
                )}
                {invoice.customer_phone && (
                  <div className="flex gap-2 text-gray-600 text-sm">
                    <Phone className="w-4 h-4 flex-shrink-0" />
                    <p>{invoice.customer_phone}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="text-right">
              <p className="text-sm font-semibold text-gray-700 uppercase mb-4">Order Details</p>
              <div className="space-y-2 text-gray-600 text-sm">
                <p><span className="font-semibold">Order ID:</span> {invoice.order_id}</p>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="mb-8">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-900">
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Description</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-900">Qty</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-900">Unit Price</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-900">Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items && invoice.items.length > 0 ? (
                  invoice.items.map((item) => (
                    <tr key={item.id} className="border-b border-gray-200">
                      <td className="py-4 px-4 text-gray-800">{item.description}</td>
                      <td className="text-right py-4 px-4 text-gray-800">{item.quantity}</td>
                      <td className="text-right py-4 px-4 text-gray-800">{formatCurrency(item.unit_price)}</td>
                      <td className="text-right py-4 px-4 font-semibold text-gray-900">{formatCurrency(item.amount)}</td>
                    </tr>
                  ))
                ) : (
                  <tr className="border-b border-gray-200">
                    <td colSpan={4} className="py-4 px-4 text-center text-gray-600">
                      No items on this invoice
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Totals Section */}
          <div className="flex justify-end mb-8">
            <div className="w-full md:w-96">
              <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between text-gray-700">
                  <span>Subtotal</span>
                  <span>{formatCurrency(invoice.subtotal)}</span>
                </div>
                {invoice.discount_amount > 0 && (
                  <div className="flex justify-between text-gray-700">
                    <span>Discount</span>
                    <span>-{formatCurrency(invoice.discount_amount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-700">
                  <span>Tax</span>
                  <span>{formatCurrency(invoice.tax_amount)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-gray-900 border-t border-gray-200 pt-3">
                  <span>Total</span>
                  <span className="text-teal-600">{formatCurrency(invoice.total_amount)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes Section */}
          {invoice.notes && (
            <div className="pt-8 border-t border-gray-200">
              <p className="text-sm font-semibold text-gray-700 uppercase mb-2">Notes</p>
              <p className="text-gray-700 whitespace-pre-wrap">{invoice.notes}</p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 justify-center">
          <button
            onClick={() => router.push('/invoices')}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Invoices
          </button>

          {invoice.status === 'draft' && (
            <button
              onClick={handleSendEmail}
              disabled={sending}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium transition-colors flex items-center gap-2"
            >
              {sending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send Invoice
                </>
              )}
            </button>
          )}

          <button
            onClick={() => window.print()}
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium transition-colors flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            Print
          </button>

          <button
            onClick={handleDownload}
            disabled={downloading}
            className="px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 font-medium transition-colors flex items-center gap-2"
          >
            {downloading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Downloading...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Download PDF
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}