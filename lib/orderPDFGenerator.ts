// lib/orderPDFGenerator.ts
// Client-side PDF generation and printing for orders

/**
 * Generate Invoice PDF and trigger download
 */
export const generateInvoicePDF = (order: any, businessName: string, businessLogo?: string) => {
  // Create a new window for printing
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please disable popup blocker');
    return;
  }

  const orderStatus = getOrderStatus(order.order_status);
  const subtotal = parseFloat(order.cart_cost || '0');
  //const tax = parseFloat(order.cart_tax_cost || '0');
  const tax = 0;
  const shipping = parseFloat(order.shipping_cost || '0');
  const commission = parseFloat(order.total_commission || '0');
  const total = subtotal + tax + shipping + commission;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Invoice ${order.order_id}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: Arial, sans-serif;
          color: #333;
          background: white;
          padding: 20px;
        }
        .container {
          max-width: 900px;
          margin: 0 auto;
          background: white;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: start;
          margin-bottom: 40px;
          border-bottom: 3px solid #2563eb;
          padding-bottom: 20px;
        }
        .company-info h1 {
          font-size: 28px;
          font-weight: bold;
          margin-bottom: 5px;
          color: #1f2937;
        }
        .company-info p {
          font-size: 12px;
          color: #666;
          margin: 2px 0;
        }
        .invoice-meta {
          text-align: right;
        }
        .invoice-meta div {
          margin: 5px 0;
          font-size: 13px;
        }
        .invoice-meta label {
          font-weight: bold;
          color: #555;
          min-width: 100px;
          display: inline-block;
          text-align: left;
        }
        .status-badge {
          display: inline-block;
          background: #fbbf24;
          color: #78350f;
          padding: 5px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: bold;
          margin-top: 5px;
        }
        .section-header {
          font-size: 13px;
          font-weight: bold;
          color: #374151;
          margin-top: 25px;
          margin-bottom: 10px;
          text-transform: uppercase;
          border-bottom: 2px solid #e5e7eb;
          padding-bottom: 5px;
        }
        .address-block {
          display: inline-block;
          margin-right: 40px;
          margin-bottom: 20px;
        }
        .address-block h3 {
          font-size: 12px;
          font-weight: bold;
          color: #555;
          margin-bottom: 5px;
        }
        .address-block p {
          font-size: 12px;
          color: #666;
          margin: 2px 0;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }
        .items-table {
          margin-top: 20px;
        }
        .items-table thead {
          background: #f3f4f6;
          border: 1px solid #d1d5db;
        }
        .items-table th {
          padding: 12px;
          text-align: left;
          font-size: 12px;
          font-weight: bold;
          color: #374151;
          border-right: 1px solid #d1d5db;
        }
        .items-table th:last-child {
          border-right: none;
        }
        .items-table td {
          padding: 10px 12px;
          font-size: 12px;
          color: #555;
          border-bottom: 1px solid #e5e7eb;
          border-right: 1px solid #e5e7eb;
        }
        .items-table td:last-child {
          border-right: none;
        }
        .items-table tbody tr:last-child td {
          border-bottom: 2px solid #d1d5db;
        }
        .text-right {
          text-align: right;
        }
        .text-center {
          text-align: center;
        }
        .totals {
          width: 100%;
          margin-top: 30px;
        }
        .totals table {
          width: 100%;
          max-width: 400px;
          margin-left: auto;
          margin-right: 0;
        }
        .totals td {
          padding: 10px 20px;
          font-size: 13px;
          border: none;
        }
        .totals .label {
          text-align: left;
          font-weight: normal;
          color: #666;
        }
        .totals .amount {
          text-align: right;
          font-weight: normal;
          color: #333;
        }
        .totals .total-row {
          background: #eff6ff;
          border-top: 2px solid #2563eb;
          border-bottom: 2px solid #2563eb;
          font-weight: bold;
          font-size: 14px;
        }
        .total-row .label {
          color: #1f2937;
        }
        .total-row .amount {
          color: #2563eb;
          font-size: 16px;
        }
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          text-align: center;
          font-size: 11px;
          color: #999;
        }
        @media print {
          body {
            padding: 0;
          }
          .container {
            box-shadow: none;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- Header -->
        <div class="header">
          <div class="company-info">
            ${businessLogo ? `<img src="${businessLogo}" style="max-width: 150px; margin-bottom: 10px;">` : ''}
            <h1>${businessName}</h1>
            <p>Order Invoice</p>
          </div>
          <div class="invoice-meta">
            <div><label>Invoice #:</label> ${order.order_id}</div>
            <div><label>Date:</label> ${new Date(parseInt(order.order_time) * 1000).toLocaleDateString()}</div>
            <div><span class="status-badge">${orderStatus}</span></div>
          </div>
        </div>

        <!-- Customer Info -->
        <div>
          ${order.to_address_detail_f_locs ? `
            <div class="address-block">
              <h3>Bill To</h3>
              <p><strong>${order.from_address_detail_f_locs.full_name || order.full_name || 'N/A'}</strong></p>
              ${order.from_address_detail_f_locs.locs_street ? `<p>${order.from_address_detail_f_locs.locs_street}</p>` : ''}
              <p>${order.from_address_detail_f_locs.locs_city || ''}, ${order.from_address_detail_f_locs.locs_state || ''} ${order.from_address_detail_f_locs.locs_zip || ''}</p>
              ${order.from_address_detail_f_locs.locs_phone ? `<p>${order.from_address_detail_f_locs.locs_phone}</p>` : ''}
            </div>
          ` : ''}

          ${order.to_address_detail_f_locs ? `
            <div class="address-block">
              <h3>Ship To</h3>
              <p><strong>${order.to_address_detail_f_locs.full_name || order.full_name || 'N/A'}</strong></p>
              ${order.to_address_detail_f_locs.locs_street ? `<p>${order.to_address_detail_f_locs.locs_street}</p>` : ''}
              <p>${order.to_address_detail_f_locs.locs_city || ''}, ${order.to_address_detail_f_locs.locs_state || ''} ${order.to_address_detail_f_locs.locs_zip || ''}</p>
              ${order.to_address_detail_f_locs.locs_phone ? `<p>${order.to_address_detail_f_locs.locs_phone}</p>` : ''}
            </div>
          ` : ''}
        </div>

        <!-- Items Table -->
        <div class="section-header">Order Items</div>
        <table class="items-table">
          <thead>
            <tr>
              <th>Product</th>
              <th class="text-center">Qty</th>
              <th class="text-right">Price</th>
              <th class="text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            ${order.cart && Array.isArray(order.cart) ? order.cart.map((item: any) => {
              const itemTotal = (parseFloat(item.selected_qty_price) || 0) * (typeof item.selected_qty === 'string' ? parseInt(item.selected_qty) : item.selected_qty);
              return `
                <tr>
                  <td>${item.name || 'Product'}</td>
                  <td class="text-center">${item.selected_qty || 0}</td>
                  <td class="text-right">$${parseFloat(item.selected_qty_price).toFixed(2)}</td>
                  <td class="text-right">$${itemTotal.toFixed(2)}</td>
                </tr>
              `;
            }).join('') : '<tr><td colspan="4">No items</td></tr>'}
          </tbody>
        </table>

        <!-- Totals -->
        <div class="totals">
          <table>
            <tr>
              <td class="label">Subtotal</td>
              <td class="amount">$${subtotal.toFixed(2)}</td>
            </tr>
            ${tax > 0 ? `
              <tr>
                <td class="label">Tax</td>
                <td class="amount">$${tax.toFixed(2)}</td>
              </tr>
            ` : ''}
            ${shipping > 0 ? `
              <tr>
                <td class="label">Shipping</td>
                <td class="amount">$${shipping.toFixed(2)}</td>
              </tr>
            ` : ''}
            ${commission > 0 ? `
              <tr>
                <td class="label">Commission</td>
                <td class="amount">$${commission.toFixed(2)}</td>
              </tr>
            ` : ''}
            <tr class="total-row">
              <td class="label">Total</td>
              <td class="amount">$${total.toFixed(2)}</td>
            </tr>
          </table>
        </div>

        <!-- Footer -->
        <div class="footer">
          <p>Thank you for your business!</p>
          <p>Generated on ${new Date().toLocaleDateString()}</p>
        </div>
      </div>

      <script>
        window.onload = function() {
          window.print();
          // Optionally close after printing
          // setTimeout(() => window.close(), 1000);
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
};

/**
 * Generate Shipping Manifest PDF and trigger download
 */
export const generateShippingManifestPDF = (order: any, businessName: string, businessLogo?: string) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please disable popup blocker');
    return;
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Shipping Manifest ${order.order_id}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: Arial, sans-serif;
          color: #333;
          padding: 20px;
        }
        .container {
          max-width: 900px;
          margin: 0 auto;
          background: white;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
          border-bottom: 3px solid #2563eb;
          padding-bottom: 20px;
        }
        .company-info {
          display: flex;
          align-items: center;
          gap: 20px;
        }
        .company-logo {
          max-width: 100px;
        }
        .title {
          font-size: 24px;
          font-weight: bold;
          color: #1f2937;
          text-align: center;
          margin: 30px 0;
        }
        .section {
          margin: 30px 0;
        }
        .section-title {
          font-size: 14px;
          font-weight: bold;
          background: #f3f4f6;
          padding: 10px 15px;
          margin-bottom: 15px;
          border-left: 4px solid #2563eb;
        }
        .address-box {
          background: #f9fafb;
          padding: 15px;
          border: 1px solid #e5e7eb;
          margin-bottom: 20px;
          min-height: 100px;
        }
        .address-box p {
          margin: 5px 0;
          font-size: 13px;
        }
        .address-box strong {
          font-size: 14px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }
        th {
          background: #e5e7eb;
          padding: 12px;
          text-align: left;
          font-size: 12px;
          font-weight: bold;
          border: 1px solid #d1d5db;
        }
        td {
          padding: 10px 12px;
          font-size: 12px;
          border: 1px solid #e5e7eb;
        }
        .text-center {
          text-align: center;
        }
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          text-align: center;
          font-size: 11px;
          color: #999;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- Header -->
        <div class="header">
          <div class="company-info">
            ${businessLogo ? `<img src="${businessLogo}" class="company-logo">` : ''}
            <div>
              <h1>${businessName}</h1>
              <p style="color: #666;">Shipping Manifest</p>
            </div>
          </div>
        </div>

        <div class="title">SHIPPING MANIFEST</div>

        <!-- Order Info -->
        <div class="section">
          <div class="section-title">Order Information</div>
          <table>
            <tr>
              <td><strong>Order #:</strong> ${order.order_id}</td>
              <td><strong>Date:</strong> ${new Date(parseInt(order.order_time) * 1000).toLocaleDateString()}</td>
              <td><strong>Items:</strong> ${order.total_cart_items || order.cart?.length || 0}</td>
            </tr>
          </table>
        </div>

        <!-- Ship From -->
        <div class="section">
          <div class="section-title">Ship From</div>
          <div class="address-box">
            <strong>${businessName}</strong>
            ${order.from_address_detail_f_locs ? `
              <p>${order.from_address_detail_f_locs.locs_street || ''}</p>
              <p>${order.from_address_detail_f_locs.locs_city || ''}, ${order.from_address_detail_f_locs.locs_state || ''} ${order.from_address_detail_f_locs.locs_zip || ''}</p>
              ${order.from_address_detail_f_locs.locs_phone ? `<p>Phone: ${order.from_address_detail_f_locs.locs_phone}</p>` : ''}
            ` : '<p style="color: #999;">Address not provided</p>'}
          </div>
        </div>

        <!-- Ship To -->
        <div class="section">
          <div class="section-title">Ship To</div>
          <div class="address-box">
            <strong>${order.to_address_detail_f_locs?.full_name || order.full_name || 'Customer'}</strong>
            ${order.to_address_detail_f_locs ? `
              <p>${order.to_address_detail_f_locs.locs_street || ''}</p>
              <p>${order.to_address_detail_f_locs.locs_city || ''}, ${order.to_address_detail_f_locs.locs_state || ''} ${order.to_address_detail_f_locs.locs_zip || ''}</p>
              ${order.to_address_detail_f_locs.locs_phone ? `<p>Phone: ${order.to_address_detail_f_locs.locs_phone}</p>` : ''}
              ${order.to_address_detail_f_locs.locs_email ? `<p>Email: ${order.to_address_detail_f_locs.locs_email}</p>` : ''}
            ` : `
              <p>${order.contact_address || ''}</p>
              ${order.contact_phone ? `<p>Phone: ${order.contact_phone}</p>` : ''}
            `}
          </div>
        </div>

        <!-- Footer -->
        <div class="footer">
          <p>Generated on ${new Date().toLocaleDateString()}</p>
        </div>
      </div>

      <script>
        window.onload = function() {
          window.print();
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
};

/**
 * Generate Pack List PDF and trigger download
 */
export const generatePackListPDF = (order: any, businessName: string, businessLogo?: string) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please disable popup blocker');
    return;
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Pack List ${order.order_id}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: Arial, sans-serif;
          color: #333;
          padding: 20px;
        }
        .container {
          max-width: 900px;
          margin: 0 auto;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
          border-bottom: 3px solid #2563eb;
          padding-bottom: 20px;
        }
        .company-info {
          display: flex;
          align-items: center;
          gap: 20px;
        }
        .company-logo {
          max-width: 100px;
        }
        .title {
          font-size: 24px;
          font-weight: bold;
          color: #1f2937;
          text-align: center;
          margin: 30px 0;
        }
        .order-info {
          background: #f9fafb;
          padding: 15px;
          border: 1px solid #e5e7eb;
          margin-bottom: 30px;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }
        .info-item {
          display: flex;
          flex-direction: column;
        }
        .info-label {
          font-size: 11px;
          font-weight: bold;
          color: #666;
          text-transform: uppercase;
          margin-bottom: 5px;
        }
        .info-value {
          font-size: 13px;
          color: #333;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }
        thead {
          background: #e5e7eb;
        }
        th {
          padding: 12px;
          text-align: left;
          font-size: 12px;
          font-weight: bold;
          border: 1px solid #d1d5db;
        }
        td {
          padding: 12px;
          font-size: 12px;
          border: 1px solid #e5e7eb;
        }
        .checkbox {
          width: 20px;
          height: 20px;
          border: 2px solid #d1d5db;
          display: inline-block;
        }
        .text-center {
          text-align: center;
        }
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          text-align: center;
          font-size: 11px;
          color: #999;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- Header -->
        <div class="header">
          <div class="company-info">
            ${businessLogo ? `<img src="${businessLogo}" class="company-logo">` : ''}
            <div>
              <h1>${businessName}</h1>
              <p style="color: #666;">Packing List</p>
            </div>
          </div>
        </div>

        <div class="title">PACK LIST</div>

        <!-- Order Info -->
        <div class="order-info">
          <div class="info-item">
            <span class="info-label">Order Number</span>
            <span class="info-value">${order.order_id}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Order Date</span>
            <span class="info-value">${new Date(parseInt(order.order_time) * 1000).toLocaleDateString()}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Total Items</span>
            <span class="info-value">${order.total_cart_items || order.cart?.length || 0}</span>
          </div>
        </div>

        <!-- Items Table -->
        <table>
          <thead>
            <tr>
              <th>Item Description</th>
              <th class="text-center">Qty</th>
              <th>SKU</th>
              <th class="text-center">Packed</th>
            </tr>
          </thead>
          <tbody>
            ${order.cart && Array.isArray(order.cart) ? order.cart.map((item: any, index: number) => `
              <tr>
                <td>${item.name || 'Product'}</td>
                <td class="text-center">${item.selected_qty || 0}</td>
                <td>SKU-${order.order_id}-${index + 1}</td>
                <td class="text-center"><div class="checkbox"></div></td>
              </tr>
            `).join('') : '<tr><td colspan="4" class="text-center">No items</td></tr>'}
          </tbody>
        </table>

        <!-- Footer -->
        <div class="footer">
          <p>Generated on ${new Date().toLocaleDateString()}</p>
          <p>Please verify all items before shipping</p>
        </div>
      </div>

      <script>
        window.onload = function() {
          window.print();
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
};

/**
 * Helper function to get order status name
 */
function getOrderStatus(statusCode: string | number): string {
  const statuses: { [key: string]: string } = {
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
  return statuses[statusCode.toString()] || 'Unknown';
}

/**
 * Print order directly (uses browser print dialog)
 */
export const printOrder = (order: any, businessName: string) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please disable popup blocker');
    return;
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Order ${order.order_id}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        .container { max-width: 800px; margin: 0 auto; }
        h1 { color: #2563eb; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 10px; text-align: left; border: 1px solid #ddd; }
        th { background: #f0f0f0; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Order #${order.order_id}</h1>
        <p><strong>Status:</strong> ${getOrderStatus(order.order_status)}</p>
        <p><strong>Date:</strong> ${new Date(parseInt(order.order_time) * 1000).toLocaleDateString()}</p>
        <h2>Order Items</h2>
        <table>
          <tr><th>Product</th><th>Qty</th><th>Price</th><th>Total</th></tr>
          ${order.cart && Array.isArray(order.cart) ? order.cart.map((item: any) => `
            <tr>
              <td>${item.name}</td>
              <td>${item.selected_qty}</td>
              <td>$${parseFloat(item.selected_qty_price).toFixed(2)}</td>
              <td>$${item.selected_qty_price}</td>
            </tr>
          `).join('') : ''}
        </table>
      </div>
      <script>
        window.print();
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
};