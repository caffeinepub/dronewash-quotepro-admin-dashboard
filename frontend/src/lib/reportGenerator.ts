import type { Job, Expense } from '../backend';

export function generateCashFlowCSV(jobs: Job[], expenses: Expense[]) {
  const headers = ['Date', 'Type', 'Description', 'Amount', 'Balance'];
  
  // Combine and sort all transactions
  const transactions: any[] = [];
  
  jobs.forEach((job) => {
    transactions.push({
      date: Number(job.date) / 1000000,
      type: 'Revenue',
      description: `Job - ${job.sector}`,
      amount: job.revenue,
    });
  });

  expenses.forEach((expense) => {
    transactions.push({
      date: Number(expense.date) / 1000000,
      type: 'Expense',
      description: expense.category,
      amount: -expense.amount,
    });
  });

  transactions.sort((a, b) => a.date - b.date);

  // Calculate running balance
  let balance = 85000; // Starting investment
  const rows = transactions.map((t) => {
    balance += t.amount;
    return [
      new Date(t.date).toLocaleDateString(),
      t.type,
      t.description,
      `€${Math.abs(t.amount).toFixed(2)}`,
      `€${balance.toFixed(2)}`,
    ];
  });

  // Create CSV content
  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map(cell => `"${cell}"`).join(',')),
  ].join('\n');

  // Download
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `cashflow-${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export function generateCashFlowPDF(jobs: Job[], expenses: Expense[]) {
  // Combine and sort transactions
  const transactions: any[] = [];
  
  jobs.forEach((job) => {
    transactions.push({
      date: Number(job.date) / 1000000,
      type: 'Revenue',
      description: `Job - ${job.sector}`,
      amount: job.revenue,
    });
  });

  expenses.forEach((expense) => {
    transactions.push({
      date: Number(expense.date) / 1000000,
      type: 'Expense',
      description: expense.category,
      amount: -expense.amount,
    });
  });

  transactions.sort((a, b) => a.date - b.date);

  // Calculate running balance
  let balance = 85000;
  const rows = transactions.map((t) => {
    balance += t.amount;
    return {
      date: new Date(t.date).toLocaleDateString(),
      type: t.type,
      description: t.description,
      amount: Math.abs(t.amount).toFixed(2),
      balance: balance.toFixed(2),
    };
  });

  // Create printable HTML
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    throw new Error('Could not open print window');
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Cash Flow Report</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          padding: 40px;
          max-width: 1000px;
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
          margin-bottom: 20px;
          color: #666;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }
        th, td {
          padding: 10px;
          text-align: left;
          border-bottom: 1px solid #ddd;
        }
        th {
          background-color: #0891b2;
          color: white;
          font-weight: 600;
        }
        tr:nth-child(even) {
          background-color: #f8f9fa;
        }
        .revenue {
          color: #10b981;
        }
        .expense {
          color: #ef4444;
        }
        @media print {
          body { padding: 20px; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>DroneWash QuotePro</h1>
        <h2>Cash Flow Report</h2>
      </div>
      
      <div class="info">
        <p><strong>Generated:</strong> ${new Date().toLocaleDateString()}</p>
      </div>

      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Type</th>
            <th>Description</th>
            <th>Amount</th>
            <th>Balance</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map(row => `
          <tr>
            <td>${row.date}</td>
            <td class="${row.type.toLowerCase()}">${row.type}</td>
            <td>${row.description}</td>
            <td>€${row.amount}</td>
            <td><strong>€${row.balance}</strong></td>
          </tr>
          `).join('')}
        </tbody>
      </table>

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

export function generateUnitEconomicsCSV(jobs: Job[], expenses: Expense[]) {
  const totalRevenue = jobs.reduce((sum, job) => sum + job.revenue, 0);
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const jobCount = jobs.length;

  const avgRevenuePerJob = jobCount > 0 ? totalRevenue / jobCount : 0;
  const avgExpensePerJob = jobCount > 0 ? totalExpenses / jobCount : 0;
  const avgProfitPerJob = avgRevenuePerJob - avgExpensePerJob;

  const headers = ['Metric', 'Value'];
  const rows = [
    ['Total Jobs', jobCount.toString()],
    ['Total Revenue', `€${totalRevenue.toFixed(2)}`],
    ['Total Expenses', `€${totalExpenses.toFixed(2)}`],
    ['Net Profit', `€${(totalRevenue - totalExpenses).toFixed(2)}`],
    ['Average Revenue per Job', `€${avgRevenuePerJob.toFixed(2)}`],
    ['Average Expense per Job', `€${avgExpensePerJob.toFixed(2)}`],
    ['Average Profit per Job', `€${avgProfitPerJob.toFixed(2)}`],
  ];

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map(cell => `"${cell}"`).join(',')),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `unit-economics-${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
