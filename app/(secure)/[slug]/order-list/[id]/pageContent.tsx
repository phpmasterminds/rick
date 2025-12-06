'use client';

import React, { useState, useCallback, useEffect } from 'react';
import {
  Loader2, AlertCircle, ArrowLeft, Download, Mail, Phone, MapPin, Calendar, DollarSign, Printer
} from 'lucide-react';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';
import axios from 'axios';

interface CartItem {
  cart_id: string;
  order_id: string;
  selected_qty: string;
  selected_qty_price: string;
  name: string;
  img: string;
  no_of: string;
  discount: string | null;
  commission: string;
  total: string;
  med_id: string;
  page_id: string;
  is_removed: string;
  prod_id: string;
}

interface LocationDetail {
  locs_city?: string;
  locs_zip?: string;
  locs_street?: string;
  contact_phone?: string;
  locs_email?: string;
  email?: string;
  contact_name?: string;
  last_name?: string;
  page_title?: string;
  [key: string]: any;
}

interface OrderData {
  order_id: string;
  page_id: string;
  user_id: string;
  contact_fname: string;
  contact_lname: string;
  contact_email: string;
  contact_phone: string;
  contact_address: string | null;
  state_license_number: string;
  cart_cost: string;
  cart_sales_tax_percentage: string;
  cart_tax_cost: string;
  shipping_cost: string;
  cart_total_cost: string;
  order_complete: string;
  order_time: string;
  order_update_time: string;
  order_status: string;
  total_discount: string;
  contact_age: string;
  pickup_time: string;
  pickup_instructions: string;
  pickup_method: string;
  payment_method: string;
  cart: CartItem[];
  total_cart_items: number;
  from_address_detail: LocationDetail;
  to_address_detail: LocationDetail;
  from_address_detail_f_locs?: LocationDetail;
  [key: string]: any;
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

interface PageContentProps {
  business: string;
  orderId: string;
}

const ORDER_STATUS_MAP: { [key: string]: string } = {
  '1': 'New Order',
  '2': 'Opened',
  '3': 'Order Approved',
  '4': 'Pending',
  '5': 'Processing',
  '6': 'Shipped',
  '7': 'Canceled',
  '8': 'Completed',
  '9': 'POD',
};

const PAYMENT_METHOD_MAP: { [key: string]: string } = {
  '1': 'Cash',
  '2': 'Card',
  '3': 'Check',
  '4': 'Bank Transfer',
};

const PICKUP_METHOD_MAP: { [key: string]: string } = {
  '1': 'Pickup',
  '2': 'Delivery',
  '3': 'Curbside',
};

export default function PageContent({ business, orderId }: PageContentProps) {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<OrderData | null>(null);
  const [downloading, setDownloading] = useState(false);
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

  // Fetch order details
  const fetchOrder = useCallback(async () => {
    try {
      const response = await axios.get(`/api/business/order-list/order-id?id=${orderId}`);

      if (response.data.status === 'success') {
        setOrder(response.data.data);
      } else {
        toast.error(response.data.error || 'Failed to load order', {
          position: 'bottom-center',
          autoClose: 3000,
        });
      }
    } catch (error) {
      console.error('Error fetching order:', error);
      toast.error('Failed to load order', {
        position: 'bottom-center',
        autoClose: 3000,
      });
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  // Initialize
  useEffect(() => {
    getUserInfo();
    if (orderId) {
      fetchOrder();
    }
  }, [orderId, fetchOrder, getUserInfo]);

  const formatDate = (timestamp: string | number) => {
    if (!timestamp) return 'N/A';
    const date = new Date(typeof timestamp === 'string' ? parseInt(timestamp) * 1000 : timestamp * 1000);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (timestamp: string | number) => {
    if (!timestamp) return 'N/A';
    const date = new Date(typeof timestamp === 'string' ? parseInt(timestamp) * 1000 : timestamp * 1000);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(typeof amount === 'string' ? parseFloat(amount) : amount);
  };

  const getStatusBadgeClass = (status: string): string => {
    const baseClass = 'px-4 py-2 rounded-full text-sm font-semibold';
    switch (status) {
      case '1':
        return `${baseClass} bg-blue-100 text-blue-800`;
      case '2':
        return `${baseClass} bg-yellow-100 text-yellow-800`;
      case '3':
        return `${baseClass} bg-purple-100 text-purple-800`;
      case '4':
        return `${baseClass} bg-orange-100 text-orange-800`;
      case '5':
        return `${baseClass} bg-indigo-100 text-indigo-800`;
      case '6':
        return `${baseClass} bg-teal-100 text-teal-800`;
      case '7':
        return `${baseClass} bg-red-100 text-red-800`;
      case '8':
        return `${baseClass} bg-green-100 text-green-800`;
      case '9':
        return `${baseClass} bg-gray-100 text-gray-800`;
      default:
        return `${baseClass} bg-gray-100 text-gray-800`;
    }
  };

  // Client-side PDF generation using dynamic import
  const handleDownloadPDF = async () => {
    if (!order) return;

    try {
      setDownloading(true);

      const jsPDFModule = await import('jspdf');
      const jsPDF = jsPDFModule.default;

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      let yPos = 25;

      // Header - ORDER title
      doc.setFontSize(28);
      doc.setTextColor(13, 148, 136); // Teal color
      doc.text('ORDER', margin, yPos);

      // Order number below title
      yPos += 12;
      doc.setFontSize(12);
      doc.setTextColor(107, 114, 128); // Gray
      doc.text('#' + order.order_id, margin, yPos);

      // Status on the right
      const statusText = ORDER_STATUS_MAP[order.order_status] || 'Unknown';
      doc.setFontSize(11);
      doc.setTextColor(31, 41, 55);
      doc.text('Status: ' + statusText, pageWidth - margin - 50, yPos);

      yPos += 20;

      // Customer Section
      doc.setFontSize(10);
      doc.setTextColor(55, 65, 81);
      doc.setFont('helvetica', 'bold');
      doc.text('CUSTOMER INFORMATION', margin, yPos);

      yPos += 8;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(75, 85, 99);

      const customerLines = [
        `Name: ${order.contact_fname} ${order.contact_lname}`,
        `Email: ${order.contact_email || 'N/A'}`,
        `Phone: ${order.contact_phone || 'N/A'}`,
      ];

      if (order.state_license_number) {
        customerLines.push(`License: ${order.state_license_number}`);
      }

      customerLines.forEach((line) => {
        doc.text(line, margin, yPos);
        yPos += 6;
      });

      yPos += 6;

      // Order Details Section
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(55, 65, 81);
      doc.text('ORDER INFORMATION', margin, yPos);

      yPos += 8;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(75, 85, 99);

      const orderDetailsLines = [
        `Order Date: ${formatDate(order.order_time)}`,
        `Pickup Time: ${order.pickup_time || 'N/A'}`,
        `Pickup Method: ${PICKUP_METHOD_MAP[order.pickup_method] || 'N/A'}`,
        `Payment Method: ${PAYMENT_METHOD_MAP[order.payment_method] || 'N/A'}`,
      ];

      orderDetailsLines.forEach((line) => {
        doc.text(line, margin, yPos);
        yPos += 6;
      });

      yPos += 6;

      // Dispensary Section
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(55, 65, 81);
      doc.text('DISPENSARY INFORMATION', margin, yPos);

      yPos += 8;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(75, 85, 99);

      if (order.from_address_detail) {
        const dispensaryLines = [
          order.from_address_detail.page_title || 'Dispensary',
          order.from_address_detail.locs_street || '',
          `${order.from_address_detail.locs_city || ''}, ${order.from_address_detail.locs_zip || ''}`,
          order.from_address_detail.contact_phone ? `Phone: ${order.from_address_detail.contact_phone}` : '',
        ].filter(Boolean);

        dispensaryLines.forEach((line) => {
          doc.text(line, margin, yPos);
          yPos += 6;
        });
      }

      yPos += 10;

      // Items Table
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(55, 65, 81);
      doc.text('ORDER ITEMS', margin, yPos);

      yPos += 8;

      // Table headers
      doc.setFontSize(9);
      doc.setTextColor(75, 85, 99);
      doc.setFont('helvetica', 'bold');

      const tableHeaders = ['Item', 'Qty', 'Price', 'Total'];
      const columnWidths = [80, 30, 30, 30];
      let xPos = margin;

      tableHeaders.forEach((header, i) => {
        doc.text(header, xPos, yPos);
        xPos += columnWidths[i];
      });

      yPos += 8;
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, yPos - 2, pageWidth - margin, yPos - 2);

      // Table rows
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(50, 50, 50);

      order.cart.forEach((item) => {
        const itemName = item.name || 'Unknown Item';
        const qty = item.no_of || '0';
        const price = formatCurrency(item.selected_qty_price);
        const total = formatCurrency(item.total);

        xPos = margin;
        doc.text(itemName.substring(0, 30), xPos, yPos);
        xPos += columnWidths[0];
        doc.text(qty, xPos, yPos, { align: 'center' });
        xPos += columnWidths[1];
        doc.text(price, xPos, yPos, { align: 'right' });
        xPos += columnWidths[2];
        doc.text(total, xPos, yPos, { align: 'right' });

        yPos += 7;
      });

      yPos += 5;
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, yPos, pageWidth - margin, yPos);

      yPos += 8;

      // Totals section
      const totalX = pageWidth - margin - 60;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(75, 85, 99);

      const totalsData = [
        { label: 'Subtotal:', value: formatCurrency(order.cart_cost) },
        {
          label: `Tax (${parseFloat(order.cart_sales_tax_percentage).toFixed(1)}%):`,
          value: formatCurrency(order.cart_tax_cost),
        },
        { label: 'Shipping:', value: formatCurrency(order.shipping_cost) },
      ];

      if (parseFloat(order.total_discount) > 0) {
        totalsData.push({
          label: 'Discount:',
          value: `-${formatCurrency(order.total_discount)}`,
        });
      }

      totalsData.forEach(({ label, value }) => {
        doc.text(label, totalX, yPos);
        doc.text(value, pageWidth - margin, yPos, { align: 'right' });
        yPos += 7;
      });

      yPos += 5;
      doc.setDrawColor(150, 150, 150);
      doc.line(totalX - 5, yPos, pageWidth - margin + 5, yPos);

      yPos += 8;

      // Grand total
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(13, 148, 136);
      doc.text('TOTAL:', totalX, yPos);
      doc.text(formatCurrency(order.cart_total_cost), pageWidth - margin, yPos, { align: 'right' });

      yPos += 20;

      // Footer
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(107, 114, 128);
      doc.text('Thank you for your order!', pageWidth / 2, yPos, { align: 'center' });

      // Save PDF
      doc.save(`Order_${order.order_id}.pdf`);
      toast.success('PDF downloaded successfully!', {
        position: 'bottom-center',
        autoClose: 2000,
      });
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('Failed to generate PDF', {
        position: 'bottom-center',
        autoClose: 3000,
      });
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-teal-600 animate-spin" />
          <p className="text-gray-600 font-medium">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex gap-4">
            <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
            <div>
              <h2 className="text-xl font-semibold text-red-800 mb-2">Order Not Found</h2>
              <p className="text-red-700 mb-4">Unable to retrieve order details. Please try again or contact support.</p>
              <button
                onClick={() => router.back()}
                className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const statusText = ORDER_STATUS_MAP[order.order_status] || 'Unknown';

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 print:bg-white">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 print:mb-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors print:hidden"
              title="Back to orders"
            >
              <ArrowLeft className="w-6 h-6 text-gray-600" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 print:text-2xl">Order #{order.order_id}</h1>
              <p className="text-gray-600 mt-1">Order Details</p>
            </div>
          </div>
          <span className={`${getStatusBadgeClass(order.order_status)} print:hidden`}>
            {statusText}
          </span>
        </div>

        {/* Order Document */}
        <div className="bg-white rounded-lg shadow-lg p-8 print:shadow-none print:rounded-none print:p-0 mb-8 print:mb-0">
          {/* Top Section */}
          <div className="flex justify-between items-start mb-8 pb-8 border-b border-gray-200">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">ORDER</h2>
              <p className="text-gray-600">#{order.order_id}</p>
            </div>
            <div className="text-right">
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-1">Order Date</p>
                <p className="text-lg font-semibold text-gray-900">{formatDate(order.order_time)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Pickup Time</p>
                <p className="text-lg font-semibold text-gray-900">{order.pickup_time || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Customer & Order Info Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 pb-8 border-b border-gray-200">
            {/* Customer Info */}
            <div>
              <p className="text-sm font-semibold text-gray-700 uppercase mb-4">Customer Information</p>
              <div className="space-y-2">
                <p className="font-semibold text-gray-900">
                  {order.contact_fname} {order.contact_lname}
                </p>
                {order.contact_email && (
                  <div className="flex gap-2 text-gray-600 text-sm">
                    <Mail className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <p>{order.contact_email}</p>
                  </div>
                )}
                {order.contact_phone && (
                  <div className="flex gap-2 text-gray-600 text-sm">
                    <Phone className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <p>{order.contact_phone}</p>
                  </div>
                )}
                {order.state_license_number && (
                  <div className="flex gap-2 text-gray-600 text-sm">
                    <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <p>License #: {order.state_license_number}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Order Details */}
            <div>
              <p className="text-sm font-semibold text-gray-700 uppercase mb-4">Order Information</p>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <p className="font-semibold text-gray-900">{statusText}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Pickup Method</p>
                  <p className="font-semibold text-gray-900">{PICKUP_METHOD_MAP[order.pickup_method] || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Payment Method</p>
                  <p className="font-semibold text-gray-900">{PAYMENT_METHOD_MAP[order.payment_method] || 'Unknown'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Dispensary Info */}
          <div className="mb-8 pb-8 border-b border-gray-200">
            <p className="text-sm font-semibold text-gray-700 uppercase mb-4">Dispensary Information</p>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="font-semibold text-gray-900 mb-2">
                {order.from_address_detail?.page_title || 'Dispensary'}
              </p>
              <div className="space-y-1 text-sm text-gray-600">
                {order.from_address_detail?.locs_street && (
                  <p>{order.from_address_detail.locs_street}</p>
                )}
                {order.from_address_detail?.locs_city && order.from_address_detail?.locs_zip && (
                  <p>
                    {order.from_address_detail.locs_city}, {order.from_address_detail.locs_zip}
                  </p>
                )}
                {order.from_address_detail?.contact_phone && (
                  <p>Phone: {order.from_address_detail.contact_phone}</p>
                )}
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-gray-700 uppercase mb-4">Order Items</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-300">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Item</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Quantity</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Price</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.cart.map((item) => (
                    <tr key={item.cart_id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm text-gray-900">{item.name}</td>
                      <td className="py-3 px-4 text-center text-sm text-gray-600">{item.no_of}</td>
                      <td className="py-3 px-4 text-right text-sm text-gray-600">
                        {formatCurrency(item.selected_qty_price)}
                      </td>
                      <td className="py-3 px-4 text-right text-sm font-semibold text-gray-900">
                        {formatCurrency(item.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals */}
          <div className="flex justify-end mb-8">
            <div className="w-full md:w-80">
              <div className="space-y-3 border-t-2 border-gray-300 pt-4">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(order.cart_cost)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Tax ({parseFloat(order.cart_sales_tax_percentage)}%):</span>
                  <span>{formatCurrency(order.cart_tax_cost)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Shipping:</span>
                  <span>{formatCurrency(order.shipping_cost)}</span>
                </div>
                {parseFloat(order.total_discount) > 0 && (
                  <div className="flex justify-between text-sm text-red-600">
                    <span>Discount:</span>
                    <span>-{formatCurrency(order.total_discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold text-gray-900 bg-teal-50 p-3 rounded border border-teal-200 mt-4">
                  <span>Total:</span>
                  <span className="text-teal-600">{formatCurrency(order.cart_total_cost)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes/Instructions */}
          {order.pickup_instructions && (
            <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm font-semibold text-blue-900 mb-2">Pickup Instructions</p>
              <p className="text-sm text-blue-800">{order.pickup_instructions}</p>
            </div>
          )}

          {/* Footer */}
          <div className="text-center pt-8 border-t border-gray-200 text-sm text-gray-600">
            <p>Thank you for your order! Please arrive at the pickup time.</p>
            <p className="mt-2">Order ID: {order.order_id} | Order Date: {formatDate(order.order_time)}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-center print:hidden">
          <button
            onClick={handleDownloadPDF}
            disabled={downloading}
            className="flex items-center gap-2 px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-5 h-5" />
            {downloading ? 'Generating PDF...' : 'Download PDF'}
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium transition-colors"
          >
            <Printer className="w-5 h-5" />
            Print
          </button>
        </div>
      </div>
    </div>
  );
}