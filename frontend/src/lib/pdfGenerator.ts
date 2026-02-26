// PDF generation using browser-native APIs and data URLs

export function generateQuotePDF(quote: any) {
  // Create a printable HTML document (customer-facing, no internal costs)
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    throw new Error('Could not open print window');
  }

  // Helper to get rate per m² for a service
  const getRatePerM2 = (service: any): number => {
    if (!service.quantity || service.quantity === 0) return 0;
    return service.rate / service.quantity;
  };

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Quote ${quote.id}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          padding: 40px;
          max-width: 800px;
          margin: 0 auto;
        }
        .header {
          color: #0891b2;
          border-bottom: 3px solid #0891b2;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
        }
        .header h2 {
          margin: 5px 0 0 0;
          font-size: 20px;
          color: #333;
        }
        .info {
          margin-bottom: 30px;
        }
        .info p {
          margin: 5px 0;
          color: #666;
        }
        .section {
          margin-bottom: 25px;
        }
        .section h3 {
          margin: 0 0 10px 0;
          font-size: 16px;
          color: #333;
          border-bottom: 1px solid #ddd;
          padding-bottom: 5px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }
        th, td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #ddd;
        }
        th {
          background-color: #f8f9fa;
          font-weight: 600;
        }
        td.number {
          text-align: right;
        }
        .badge {
          display: inline-block;
          padding: 2px 8px;
          background-color: #e0f2fe;
          color: #0891b2;
          border-radius: 4px;
          font-size: 12px;
          margin-left: 8px;
        }
        .total-section {
          margin-top: 30px;
          padding: 20px;
          background-color: #f8f9fa;
          border-radius: 5px;
        }
        .total-row {
          display: flex;
          justify-content: space-between;
          margin: 8px 0;
          font-size: 14px;
        }
        .total-row.grand {
          margin-top: 15px;
          padding-top: 15px;
          border-top: 2px solid #0891b2;
          font-size: 18px;
          font-weight: bold;
          color: #0891b2;
        }
        .footer {
          margin-top: 50px;
          padding-top: 20px;
          border-top: 1px solid #ddd;
          color: #666;
          font-size: 12px;
        }
        @media print {
          body { padding: 20px; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>DroneWash QuotePro</h1>
        <h2>Service Quote</h2>
      </div>
      
      <div class="info">
        <p><strong>Quote ID:</strong> ${quote.id}</p>
        <p><strong>Date:</strong> ${new Date(Number(quote.date) / 1000000).toLocaleDateString()}</p>
      </div>

      ${quote.customerInfo.name ? `
      <div class="section">
        <h3>Customer Information</h3>
        <p><strong>Name:</strong> ${quote.customerInfo.name}</p>
        ${quote.customerInfo.coordinates ? `<p><strong>Email:</strong> ${quote.customerInfo.coordinates}</p>` : ''}
        ${quote.customerInfo.town ? `<p><strong>Phone:</strong> ${quote.customerInfo.town}</p>` : ''}
      </div>
      ` : ''}

      ${quote.chargeDescription ? `
      <div class="section">
        <h3>Charge Description</h3>
        <p>${quote.chargeDescription}</p>
      </div>
      ` : ''}

      <div class="section">
        <h3>Service Details</h3>
        <table>
          <tr>
            <th>Item</th>
            <th>Details</th>
          </tr>
          <tr>
            <td>Sector</td>
            <td>${quote.sector}${quote.subSector ? `<span class="badge">${quote.subSector}</span>` : ''}</td>
          </tr>
          <tr>
            <td>Town</td>
            <td>${quote.town}</td>
          </tr>
        </table>
      </div>

      <div class="section">
        <h3>Services</h3>
        <table>
          <thead>
            <tr>
              <th>Service</th>
              <th>Description</th>
              <th class="number">Area (m²)</th>
              <th class="number">Price per m²</th>
              <th class="number">Amount (€)</th>
            </tr>
          </thead>
          <tbody>
            ${quote.services.map((service: any) => {
              const area = service.quantity;
              const pricePerM2 = getRatePerM2(service);
              const amount = service.rate;
              return `
              <tr>
                <td>${service.serviceType}</td>
                <td>${quote.sector}${quote.subSector ? ` - ${quote.subSector}` : ''} - ${quote.town}</td>
                <td class="number">${area.toFixed(2)}</td>
                <td class="number">€${pricePerM2.toFixed(2)}</td>
                <td class="number">€${amount.toFixed(2)}</td>
              </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>

      ${quote.addOns.length > 0 ? `
      <div class="section">
        <h3>Add-ons</h3>
        <p>${quote.addOns.join(', ')}</p>
      </div>
      ` : ''}

      ${quote.volumeDiscount > 0 || quote.nightService ? `
      <div class="section">
        <h3>Options</h3>
        ${quote.volumeDiscount > 0 ? `<p>Volume Discount: ${(quote.volumeDiscount * 100).toFixed(0)}%</p>` : ''}
        ${quote.nightService ? `<p>Night Service: Yes (+20%)</p>` : ''}
      </div>
      ` : ''}

      <div class="total-section">
        <div class="total-row">
          <span>Subtotal:</span>
          <span>€${quote.finalPrice.toFixed(2)}</span>
        </div>
        <div class="total-row">
          <span>VAT (19%):</span>
          <span>€${quote.vatAmount.toFixed(2)}</span>
        </div>
        <div class="total-row grand">
          <span>Grand Total:</span>
          <span>€${quote.grandTotal.toFixed(2)}</span>
        </div>
      </div>

      <div class="footer">
        <p>DroneWash QuotePro - Professional Drone Washing Services</p>
        <p>Contact: info@dronewash.com | www.dronewash.com</p>
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
}

export function generateInternalQuotePDF(quote: any, costBreakdown: any) {
  // Create a printable HTML document with internal cost breakdown
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    throw new Error('Could not open print window');
  }

  // Helper to get rate per m² for a service
  const getRatePerM2 = (service: any): number => {
    if (!service.quantity || service.quantity === 0) return 0;
    return service.rate / service.quantity;
  };

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Internal Quote ${quote.id}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          padding: 40px;
          max-width: 800px;
          margin: 0 auto;
        }
        .header {
          color: #0891b2;
          border-bottom: 3px solid #0891b2;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
        }
        .header h2 {
          margin: 5px 0 0 0;
          font-size: 20px;
          color: #333;
        }
        .confidential {
          background-color: #fef3c7;
          border: 2px solid #f59e0b;
          padding: 10px;
          margin-bottom: 20px;
          border-radius: 5px;
          text-align: center;
          font-weight: bold;
          color: #92400e;
        }
        .info {
          margin-bottom: 30px;
        }
        .info p {
          margin: 5px 0;
          color: #666;
        }
        .section {
          margin-bottom: 25px;
        }
        .section h3 {
          margin: 0 0 10px 0;
          font-size: 16px;
          color: #333;
          border-bottom: 1px solid #ddd;
          padding-bottom: 5px;
        }
        .cost-breakdown {
          background: linear-gradient(to right, #ecfeff, #dbeafe);
          border: 2px solid #0891b2;
          padding: 20px;
          border-radius: 8px;
          margin: 20px 0;
        }
        .cost-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 15px;
          margin-top: 15px;
        }
        .cost-item {
          background: white;
          padding: 12px;
          border-radius: 5px;
          border: 1px solid #cbd5e1;
        }
        .cost-item label {
          display: block;
          font-size: 12px;
          color: #64748b;
          margin-bottom: 4px;
        }
        .cost-item .value {
          font-size: 18px;
          font-weight: bold;
          color: #0f172a;
        }
        .cost-item.profit .value {
          color: #16a34a;
        }
        .cost-item.margin .value {
          color: #0891b2;
        }
        .cogs-details {
          background: #fff7ed;
          border: 2px solid #f97316;
          padding: 15px;
          border-radius: 8px;
          margin: 20px 0;
        }
        .cogs-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
          margin-top: 10px;
        }
        .cogs-item {
          background: white;
          padding: 10px;
          border-radius: 4px;
          border: 1px solid #fed7aa;
        }
        .cogs-item .label {
          font-size: 11px;
          color: #9a3412;
          margin-bottom: 2px;
        }
        .cogs-item .value {
          font-size: 16px;
          font-weight: bold;
          color: #ea580c;
        }
        .cogs-item .detail {
          font-size: 10px;
          color: #9a3412;
          margin-top: 2px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }
        th, td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #ddd;
        }
        th {
          background-color: #f8f9fa;
          font-weight: 600;
        }
        td.number {
          text-align: right;
        }
        .expense-table {
          margin: 20px 0;
        }
        .expense-row {
          display: flex;
          justify-content: space-between;
          padding: 10px;
          background-color: #f8f9fa;
          margin: 5px 0;
          border-radius: 4px;
        }
        .expense-row.total {
          background-color: #e0f2fe;
          font-weight: bold;
          border: 1px solid #0891b2;
        }
        .badge {
          display: inline-block;
          padding: 2px 8px;
          background-color: #e0f2fe;
          color: #0891b2;
          border-radius: 4px;
          font-size: 12px;
          margin-left: 8px;
        }
        .total-section {
          margin-top: 30px;
          padding: 20px;
          background-color: #f8f9fa;
          border-radius: 5px;
        }
        .total-row {
          display: flex;
          justify-content: space-between;
          margin: 8px 0;
          font-size: 14px;
        }
        .total-row.grand {
          margin-top: 15px;
          padding-top: 15px;
          border-top: 2px solid #0891b2;
          font-size: 18px;
          font-weight: bold;
          color: #0891b2;
        }
        .footer {
          margin-top: 50px;
          padding-top: 20px;
          border-top: 1px solid #ddd;
          color: #666;
          font-size: 12px;
        }
        @media print {
          body { padding: 20px; }
        }
      </style>
    </head>
    <body>
      <div class="confidential">
        ⚠️ INTERNAL USE ONLY - CONFIDENTIAL
      </div>

      <div class="header">
        <h1>DroneWash QuotePro</h1>
        <h2>Internal Quote Analysis</h2>
      </div>
      
      <div class="info">
        <p><strong>Quote ID:</strong> ${quote.id}</p>
        <p><strong>Date:</strong> ${new Date(Number(quote.date) / 1000000).toLocaleDateString()}</p>
      </div>

      ${quote.customerInfo.name ? `
      <div class="section">
        <h3>Customer Information</h3>
        <p><strong>Name:</strong> ${quote.customerInfo.name}</p>
        ${quote.customerInfo.coordinates ? `<p><strong>Email:</strong> ${quote.customerInfo.coordinates}</p>` : ''}
        ${quote.customerInfo.town ? `<p><strong>Phone:</strong> ${quote.customerInfo.town}</p>` : ''}
      </div>
      ` : ''}

      <div class="cost-breakdown">
        <h3 style="margin-top: 0; color: #0891b2;">💰 Internal Cost Analysis</h3>
        <div class="cost-grid">
          <div class="cost-item">
            <label>COGS</label>
            <div class="value">€${costBreakdown.cogs.toFixed(2)}</div>
          </div>
          <div class="cost-item">
            <label>OpEx</label>
            <div class="value">€${costBreakdown.opEx.toFixed(2)}</div>
          </div>
          <div class="cost-item profit">
            <label>Net Profit</label>
            <div class="value">€${(costBreakdown.revenue - costBreakdown.cogs - costBreakdown.opEx).toFixed(2)}</div>
          </div>
          <div class="cost-item margin">
            <label>Profit Margin</label>
            <div class="value">${costBreakdown.profitMargin.toFixed(1)}%</div>
          </div>
        </div>
      </div>

      <div class="cogs-details">
        <h3 style="margin-top: 0; color: #ea580c; font-size: 14px;">🔧 COGS Component Breakdown</h3>
        <div class="cogs-grid">
          <div class="cogs-item">
            <div class="label">Van Fuel (${quote.town})</div>
            <div class="value">€${costBreakdown.vanFuel.toFixed(2)}</div>
            <div class="detail">City-based standard</div>
          </div>
          <div class="cogs-item">
            <div class="label">Generator Fuel</div>
            <div class="value">€${costBreakdown.generatorFuel.toFixed(2)}</div>
            <div class="detail">Hourly rate × €7/h</div>
          </div>
          <div class="cogs-item">
            <div class="label">Additional Pilot</div>
            <div class="value">€${costBreakdown.additionalPilot.toFixed(2)}</div>
            <div class="detail">€350 per job</div>
          </div>
          <div class="cogs-item">
            <div class="label">Chemicals</div>
            <div class="value">€${costBreakdown.chemicals.toFixed(2)}</div>
            <div class="detail">Hourly rate × cost/h</div>
          </div>
        </div>
        <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #fed7aa;">
          <div style="display: flex; justify-content: space-between; font-weight: bold; color: #9a3412;">
            <span>Total COGS:</span>
            <span>€${costBreakdown.cogs.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div class="section">
        <h3>Full Expense Breakdown</h3>
        <div class="expense-table">
          <div class="expense-row">
            <span>Cost of Goods Sold (COGS)</span>
            <span>€${costBreakdown.cogs.toFixed(2)}</span>
          </div>
          <div class="expense-row">
            <span>Operational Expenses (OpEx)</span>
            <span>€${costBreakdown.opEx.toFixed(2)}</span>
          </div>
          <div class="expense-row total">
            <span>Total Costs</span>
            <span>€${(costBreakdown.cogs + costBreakdown.opEx).toFixed(2)}</span>
          </div>
          <div class="expense-row">
            <span>Revenue</span>
            <span>€${costBreakdown.revenue.toFixed(2)}</span>
          </div>
          <div class="expense-row total" style="background-color: #dcfce7; border-color: #16a34a;">
            <span>Net Profit</span>
            <span style="color: #16a34a;">€${(costBreakdown.revenue - costBreakdown.cogs - costBreakdown.opEx).toFixed(2)}</span>
          </div>
        </div>
      </div>

      ${quote.chargeDescription ? `
      <div class="section">
        <h3>Charge Description</h3>
        <p>${quote.chargeDescription}</p>
      </div>
      ` : ''}

      <div class="section">
        <h3>Service Details</h3>
        <table>
          <tr>
            <th>Item</th>
            <th>Details</th>
          </tr>
          <tr>
            <td>Sector</td>
            <td>${quote.sector}${quote.subSector ? `<span class="badge">${quote.subSector}</span>` : ''}</td>
          </tr>
          <tr>
            <td>Town</td>
            <td>${quote.town}</td>
          </tr>
        </table>
      </div>

      <div class="section">
        <h3>Services</h3>
        <table>
          <thead>
            <tr>
              <th>Service</th>
              <th>Description</th>
              <th class="number">Area (m²)</th>
              <th class="number">Price per m²</th>
              <th class="number">Amount (€)</th>
            </tr>
          </thead>
          <tbody>
            ${quote.services.map((service: any) => {
              const area = service.quantity;
              const pricePerM2 = getRatePerM2(service);
              const amount = service.rate;
              return `
              <tr>
                <td>${service.serviceType}</td>
                <td>${quote.sector}${quote.subSector ? ` - ${quote.subSector}` : ''} - ${quote.town}</td>
                <td class="number">${area.toFixed(2)}</td>
                <td class="number">€${pricePerM2.toFixed(2)}</td>
                <td class="number">€${amount.toFixed(2)}</td>
              </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>

      ${quote.addOns.length > 0 ? `
      <div class="section">
        <h3>Add-ons</h3>
        <p>${quote.addOns.join(', ')}</p>
      </div>
      ` : ''}

      ${quote.volumeDiscount > 0 || quote.nightService ? `
      <div class="section">
        <h3>Options</h3>
        ${quote.volumeDiscount > 0 ? `<p>Volume Discount: ${(quote.volumeDiscount * 100).toFixed(0)}%</p>` : ''}
        ${quote.nightService ? `<p>Night Service: Yes (+20%)</p>` : ''}
      </div>
      ` : ''}

      <div class="total-section">
        <div class="total-row">
          <span>Subtotal:</span>
          <span>€${quote.finalPrice.toFixed(2)}</span>
        </div>
        <div class="total-row">
          <span>VAT (19%):</span>
          <span>€${quote.vatAmount.toFixed(2)}</span>
        </div>
        <div class="total-row grand">
          <span>Grand Total:</span>
          <span>€${quote.grandTotal.toFixed(2)}</span>
        </div>
      </div>

      <div class="footer">
        <p><strong>CONFIDENTIAL - FOR INTERNAL USE ONLY</strong></p>
        <p>DroneWash QuotePro - Professional Drone Washing Services</p>
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
}

export function generateInvoicePDF(invoice: any) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    throw new Error('Could not open print window');
  }

  // Helper to get rate per m² for a service
  const getRatePerM2 = (service: any): number => {
    if (!service.quantity || service.quantity === 0) return 0;
    return service.rate / service.quantity;
  };

  // Helper to get service types from quote
  const getServiceTypes = () => {
    if (!invoice.quote || !invoice.quote.services || invoice.quote.services.length === 0) {
      return 'Service';
    }
    return invoice.quote.services.map((s: any) => s.serviceType).join(', ');
  };

  // Helper to get service descriptions with proper calculations
  const getServiceDescriptions = () => {
    if (!invoice.quote || !invoice.quote.services || invoice.quote.services.length === 0) {
      return `<tr>
        <td>Service</td>
        <td>${invoice.quote?.sector || 'Commercial'}${invoice.quote?.subSector ? ` - ${invoice.quote.subSector}` : ''} - ${invoice.quote?.town || 'Larnaka'}</td>
        <td class="number">-</td>
        <td class="number">-</td>
        <td class="number">€${invoice.totalAmount.toFixed(2)}</td>
      </tr>`;
    }

    return invoice.quote.services.map((service: any) => {
      const area = service.quantity;
      const pricePerM2 = getRatePerM2(service);
      const amount = service.rate;
      
      return `
      <tr>
        <td>${service.serviceType}</td>
        <td>${invoice.quote.sector}${invoice.quote.subSector ? ` - ${invoice.quote.subSector}` : ''} - ${invoice.quote.town}</td>
        <td class="number">${area.toFixed(2)}</td>
        <td class="number">€${pricePerM2.toFixed(2)}</td>
        <td class="number">€${amount.toFixed(2)}</td>
      </tr>
      `;
    }).join('');
  };

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Invoice ${invoice.id}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          padding: 40px;
          max-width: 800px;
          margin: 0 auto;
        }
        .header {
          color: #0891b2;
          border-bottom: 3px solid #0891b2;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
        }
        .header h2 {
          margin: 5px 0 0 0;
          font-size: 24px;
          color: #333;
        }
        .info-section {
          margin-bottom: 30px;
        }
        .info-section h3 {
          margin: 0 0 10px 0;
          font-size: 16px;
          color: #333;
        }
        .info-section p {
          margin: 5px 0;
          color: #666;
        }
        .badge {
          display: inline-block;
          padding: 2px 8px;
          background-color: #e0f2fe;
          color: #0891b2;
          border-radius: 4px;
          font-size: 12px;
          margin-left: 8px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }
        th, td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #ddd;
        }
        th {
          background-color: #0891b2;
          color: white;
          font-weight: 600;
        }
        td.number {
          text-align: right;
        }
        .total {
          margin-top: 30px;
          padding: 20px;
          background-color: #f0f9ff;
          border-left: 4px solid #0891b2;
        }
        .total h3 {
          margin: 0;
          color: #0891b2;
          font-size: 24px;
        }
        .payment-terms {
          margin-top: 30px;
          padding: 15px;
          background-color: #f8f9fa;
          border-radius: 5px;
        }
        .payment-terms p {
          margin: 5px 0;
          color: #333;
        }
        .footer {
          margin-top: 50px;
          padding-top: 20px;
          border-top: 1px solid #ddd;
          color: #666;
          font-size: 12px;
          text-align: center;
        }
        @media print {
          body { padding: 20px; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>DroneWash QuotePro</h1>
        <h2>INVOICE</h2>
      </div>
      
      <div class="info-section">
        <p><strong>Invoice ID:</strong> ${invoice.id}</p>
        <p><strong>Date:</strong> ${invoice.date.toLocaleDateString()}</p>
      </div>

      <div class="info-section">
        <h3>Bill To:</h3>
        <p>${invoice.customerName}</p>
        <p>${invoice.customerEmail}</p>
      </div>

      <h3>Service Details</h3>
      <table>
        <thead>
          <tr>
            <th>Service</th>
            <th>Description</th>
            <th class="number">Area (m²)</th>
            <th class="number">Price per m²</th>
            <th class="number">Amount (€)</th>
          </tr>
        </thead>
        <tbody>
          ${getServiceDescriptions()}
          ${invoice.quote?.addOns && invoice.quote.addOns.length > 0
            ? invoice.quote.addOns.map((addOn: string) => `
          <tr>
            <td>Add-on</td>
            <td>${addOn}</td>
            <td class="number">-</td>
            <td class="number">-</td>
            <td class="number">Included</td>
          </tr>
          `).join('')
            : ''}
        </tbody>
      </table>

      <div class="total">
        <h3>Total Amount: €${invoice.totalAmount.toFixed(2)}</h3>
      </div>

      <div class="payment-terms">
        <p><strong>Payment Terms:</strong> Due within 30 days</p>
        <p><strong>Payment Methods:</strong> Bank Transfer, Credit Card</p>
      </div>

      <div class="footer">
        <p><strong>Thank you for your business!</strong></p>
        <p>DroneWash QuotePro - Professional Drone Washing Services</p>
        <p>Contact: info@dronewash.com | www.dronewash.com</p>
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
}

