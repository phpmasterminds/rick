'use client';

import React, { useState, useCallback, useEffect } from 'react';
import {
  Loader2, AlertCircle, ArrowLeft, Download, Send, Mail, Phone, MapPin, Calendar, DollarSign, Printer, Clock, CreditCard
} from 'lucide-react';
import { toast } from 'react-toastify';
import { useRouter, useParams } from 'next/navigation';
import axios from 'axios';

interface InvoiceData {
  id: string;
  registration_id: string;
  user_id: string;
  invoice_number: string;
  subtotal: string;
  tax: string;
  total_amount: string;
  trial_days: string;
  trial_end_date: string;
  billing_start_date: string;
  status: 'draft' | 'issued' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  payment_method: string | null;
  paid_at: string | null;
  due_date: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  module_id: string;
  module_name: string;
  amount: string;
  billing_cycle: string;
  variant_index: string;
  variant_name: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  customer_address?: string;
  business_name?: string;
}

interface UserData {
  data: {
    user_group_id?: number;
    business_id?: string;
    full_name?: string;
    email?: string;
    [key: string]: any;
  };
}

export default function InvoiceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const invoiceId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [sending, setSending] = useState(false);
  const [userData, setUserData] = useState<UserData['data'] | null>(null);

  // Get user info
  const getUserInfo = useCallback(() => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const userData: UserData = JSON.parse(userStr);
        setUserData(userData.data);
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
      const response = await axios.get(`/api/user/invoice-id?id=${invoiceId}`);

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
    getUserInfo();
    if (invoiceId) {
      fetchInvoice();
    }
  }, [invoiceId, fetchInvoice, getUserInfo]);

  const formatDate = (date: string) => {
    if (!date) return 'N/A';
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

  // Client-side PDF generation using dynamic import
  const handleDownload = async () => {
    if (!invoice) return;

    try {
      setDownloading(true);

      // Dynamically import jsPDF to avoid SSR issues
      const jsPDFModule = await import('jspdf');
      const jsPDF = jsPDFModule.default;

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      let yPos = 25;

      // Header - INVOICE title
      doc.setFontSize(28);
      doc.setTextColor(13, 148, 136); // Teal color
      doc.text('INVOICE', margin, yPos);

      // Invoice number below title
      yPos += 12;
      doc.setFontSize(12);
      doc.setTextColor(107, 114, 128); // Gray
      doc.text('#' + invoice.invoice_number, margin, yPos);

      // Status on the right
      const statusText = invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1);
      doc.setFontSize(11);
      doc.setTextColor(31, 41, 55);
      doc.text('Status: ' + statusText, pageWidth - margin - 50, yPos);

      // Dates section
      yPos += 20;
      doc.setFontSize(10);
      doc.setTextColor(107, 114, 128);
      doc.text('Invoice Date:', pageWidth - margin - 70, yPos);
      doc.setTextColor(31, 41, 55);
      doc.text(formatDate(invoice.created_at), pageWidth - margin - 70, yPos + 6);

      doc.setTextColor(107, 114, 128);
      doc.text('Due Date:', pageWidth - margin - 70, yPos + 16);
      doc.setTextColor(31, 41, 55);
      doc.text(formatDate(invoice.due_date), pageWidth - margin - 70, yPos + 22);

      // Horizontal line
      yPos += 35;
      doc.setDrawColor(229, 231, 235);
      doc.setLineWidth(0.5);
      doc.line(margin, yPos, pageWidth - margin, yPos);

      // Bill To section
      yPos += 15;
      doc.setFontSize(10);
      doc.setTextColor(107, 114, 128);
      doc.text('BILL TO', margin, yPos);

      yPos += 8;
      doc.setFontSize(12);
      doc.setTextColor(31, 41, 55);
      const customerName = invoice.customer_name || userData?.full_name || 'Customer';
      doc.text(customerName, margin, yPos);

      if (invoice.customer_email || userData?.email) {
        yPos += 6;
        doc.setFontSize(10);
        doc.setTextColor(107, 114, 128);
        doc.text(invoice.customer_email || userData?.email || '', margin, yPos);
      }

      if (invoice.customer_phone) {
        yPos += 6;
        doc.text(invoice.customer_phone, margin, yPos);
      }

      if (invoice.customer_address) {
        yPos += 6;
        doc.text(invoice.customer_address, margin, yPos);
      }

      // Subscription Details section
      yPos += 20;
      doc.setFontSize(10);
      doc.setTextColor(107, 114, 128);
      doc.text('SUBSCRIPTION DETAILS', margin, yPos);

      yPos += 8;
      doc.setTextColor(31, 41, 55);
      doc.text('Module: ' + invoice.module_name, margin, yPos);

      yPos += 6;
      doc.text('Variant: ' + invoice.variant_name, margin, yPos);

      yPos += 6;
      const billingCycleText = invoice.billing_cycle.charAt(0).toUpperCase() + invoice.billing_cycle.slice(1);
      doc.text('Billing Cycle: ' + billingCycleText, margin, yPos);

      // Trial info if applicable
      const trialDays = parseInt(invoice.trial_days || '0');
      if (trialDays > 0) {
        yPos += 6;
        doc.text('Trial Period: ' + invoice.trial_days + ' days', margin, yPos);
        yPos += 6;
        doc.text('Trial Ends: ' + formatDate(invoice.trial_end_date), margin, yPos);
        yPos += 6;
        doc.text('Billing Starts: ' + formatDate(invoice.billing_start_date), margin, yPos);
      }

      // Horizontal line before table
      yPos += 15;
      doc.setDrawColor(229, 231, 235);
      doc.line(margin, yPos, pageWidth - margin, yPos);

      // Table Header
      yPos += 10;
      doc.setFillColor(249, 250, 251);
      doc.rect(margin, yPos - 5, pageWidth - (margin * 2), 12, 'F');

      doc.setFontSize(10);
      doc.setTextColor(31, 41, 55);
      doc.text('Description', margin + 5, yPos + 2);
      doc.text('Cycle', pageWidth - margin - 70, yPos + 2);
      doc.text('Amount', pageWidth - margin - 25, yPos + 2);

      // Table Row - Line Item
      yPos += 18;
      doc.setTextColor(31, 41, 55);
      doc.text(invoice.module_name, margin + 5, yPos);

      yPos += 5;
      doc.setFontSize(9);
      doc.setTextColor(107, 114, 128);
      doc.text(invoice.variant_name, margin + 5, yPos);

      doc.setFontSize(10);
      doc.setTextColor(31, 41, 55);
      doc.text(billingCycleText, pageWidth - margin - 70, yPos - 2);
      doc.text(formatCurrency(parseFloat(invoice.amount || '0')), pageWidth - margin - 30, yPos - 2);

      // Line below table row
      yPos += 10;
      doc.setDrawColor(229, 231, 235);
      doc.line(margin, yPos, pageWidth - margin, yPos);

      // Totals Section
      yPos += 20;
      const totalsX = pageWidth - margin - 90;

      // Subtotal
      doc.setFontSize(10);
      doc.setTextColor(107, 114, 128);
      doc.text('Subtotal:', totalsX, yPos);
      doc.setTextColor(31, 41, 55);
      doc.text(formatCurrency(parseFloat(invoice.subtotal || '0')), totalsX + 55, yPos);

      // Tax
      yPos += 8;
      doc.setTextColor(107, 114, 128);
      doc.text('Tax:', totalsX, yPos);
      doc.setTextColor(31, 41, 55);
      doc.text(formatCurrency(parseFloat(invoice.tax || '0')), totalsX + 55, yPos);

      // Total line
      yPos += 5;
      doc.setDrawColor(229, 231, 235);
      doc.line(totalsX, yPos, pageWidth - margin, yPos);

      // Total
      yPos += 10;
      doc.setFontSize(12);
      doc.setTextColor(31, 41, 55);
      doc.text('Total:', totalsX, yPos);
      doc.setTextColor(13, 148, 136); // Teal
      doc.text(formatCurrency(parseFloat(invoice.total_amount || '0')), totalsX + 55, yPos);

      // Payment info if paid
      if (invoice.paid_at) {
        yPos += 20;
        doc.setFontSize(10);
        doc.setTextColor(34, 197, 94); // Green
        let paidText = 'Paid on ' + formatDate(invoice.paid_at);
        if (invoice.payment_method) {
          paidText += ' via ' + invoice.payment_method;
        }
        doc.text(paidText, margin, yPos);
      }

      // Notes section
      if (invoice.notes) {
        yPos += 25;
        doc.setDrawColor(229, 231, 235);
        doc.line(margin, yPos, pageWidth - margin, yPos);

        yPos += 10;
        doc.setFontSize(10);
        doc.setTextColor(107, 114, 128);
        doc.text('NOTES', margin, yPos);

        yPos += 8;
        doc.setTextColor(31, 41, 55);
        const splitNotes = doc.splitTextToSize(invoice.notes, pageWidth - (margin * 2));
        doc.text(splitNotes, margin, yPos);
      }

      // Footer
      const footerY = doc.internal.pageSize.getHeight() - 20;
      doc.setFontSize(9);
      doc.setTextColor(107, 114, 128);
      doc.text('Thank you for your business!', pageWidth / 2, footerY, { align: 'center' });

      // Save the PDF
      doc.save(invoice.invoice_number + '.pdf');

      toast.success('Invoice downloaded successfully', {
        position: 'bottom-center',
        autoClose: 3000,
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF. Please try again.', {
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
      case 'issued':
        return 'bg-blue-100 text-blue-800';
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
            onClick={() => router.push('/invoice')}
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
              onClick={() => router.push('/invoice')}
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
                <p className="text-lg font-semibold text-gray-900">{formatDate(invoice.created_at)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Due Date</p>
                <p className="text-lg font-semibold text-gray-900">{formatDate(invoice.due_date)}</p>
              </div>
            </div>
          </div>

          {/* Bill To & Subscription Info Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 pb-8 border-b border-gray-200">
            <div>
              <p className="text-sm font-semibold text-gray-700 uppercase mb-4">Bill To</p>
              <div className="space-y-2">
                <p className="font-semibold text-gray-900">
                  {invoice.customer_name || userData?.full_name || 'Customer'}
                </p>
                {(invoice.customer_email || userData?.email) && (
                  <div className="flex gap-2 text-gray-600 text-sm">
                    <Mail className="w-4 h-4 flex-shrink-0" />
                    <p>{invoice.customer_email || userData?.email}</p>
                  </div>
                )}
                {invoice.customer_phone && (
                  <div className="flex gap-2 text-gray-600 text-sm">
                    <Phone className="w-4 h-4 flex-shrink-0" />
                    <p>{invoice.customer_phone}</p>
                  </div>
                )}
                {invoice.customer_address && (
                  <div className="flex gap-2 text-gray-600 text-sm">
                    <MapPin className="w-4 h-4 flex-shrink-0" />
                    <p>{invoice.customer_address}</p>
                  </div>
                )}
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-gray-700 uppercase mb-4">Subscription Details</p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <CreditCard className="w-4 h-4 flex-shrink-0" />
                  <span className="font-medium text-gray-900">{invoice.module_name}</span>
                </div>
                <p className="text-gray-600 pl-6">{invoice.variant_name}</p>
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="w-4 h-4 flex-shrink-0" />
                  <span>Billing: {invoice.billing_cycle.charAt(0).toUpperCase() + invoice.billing_cycle.slice(1)}</span>
                </div>
                {parseInt(invoice.trial_days || '0') > 0 && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock className="w-4 h-4 flex-shrink-0" />
                    <span>{invoice.trial_days} day trial (ends {formatDate(invoice.trial_end_date)})</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Trial Info Banner */}
          {parseInt(invoice.trial_days || '0') > 0 && (
            <div className="mb-8 p-4 bg-teal-50 border border-teal-200 rounded-lg">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-teal-600" />
                <div>
                  <p className="font-semibold text-teal-800">Trial Period Active</p>
                  <p className="text-sm text-teal-700">
                    Your {invoice.trial_days}-day trial ends on {formatDate(invoice.trial_end_date)}. 
                    Billing will start on {formatDate(invoice.billing_start_date)}.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Items Table */}
          <div className="mb-8">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-900">
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Description</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-900">Billing Cycle</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-900">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-200">
                  <td className="py-4 px-4">
                    <p className="text-gray-900 font-medium">{invoice.module_name}</p>
                    <p className="text-gray-600 text-sm">{invoice.variant_name}</p>
                  </td>
                  <td className="text-right py-4 px-4 text-gray-800">
                    {invoice.billing_cycle.charAt(0).toUpperCase() + invoice.billing_cycle.slice(1)}
                  </td>
                  <td className="text-right py-4 px-4 font-semibold text-gray-900">
                    {formatCurrency(parseFloat(invoice.amount || '0'))}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Totals Section */}
          <div className="flex justify-end mb-8">
            <div className="w-full md:w-96">
              <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between text-gray-700">
                  <span>Subtotal</span>
                  <span>{formatCurrency(parseFloat(invoice.subtotal || '0'))}</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>Tax</span>
                  <span>{formatCurrency(parseFloat(invoice.tax || '0'))}</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-gray-900 border-t border-gray-200 pt-3">
                  <span>Total</span>
                  <span className="text-teal-600">{formatCurrency(parseFloat(invoice.total_amount || '0'))}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Status */}
          {invoice.paid_at && (
            <div className="mb-8 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-3">
                <DollarSign className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-semibold text-green-800">Payment Received</p>
                  <p className="text-sm text-green-700">
                    Paid on {formatDate(invoice.paid_at)}
                    {invoice.payment_method && ` via ${invoice.payment_method}`}
                  </p>
                </div>
              </div>
            </div>
          )}

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
            onClick={() => router.push('/invoice')}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Invoices
          </button>

          {/* Send Invoice button - hidden for now

          */}

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
                Generating...
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