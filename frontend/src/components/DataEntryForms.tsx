import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Hash } from 'lucide-react';
import { useAddJob, useAddExpense, useAllJobs, useAllExpenses, useDeleteJob, useDeleteExpense } from '@/hooks/useQueries';
import EditJobDialog from './EditJobDialog';
import EditExpenseDialog from './EditExpenseDialog';
import DeleteConfirmDialog from './DeleteConfirmDialog';
import type { Job, Expense, CustomerInfo } from '../backend';

export default function DataEntryForms() {
  const [jobRevenue, setJobRevenue] = useState('');
  const [jobDate, setJobDate] = useState('');
  const [jobSector, setJobSector] = useState('');
  const [jobClientName, setJobClientName] = useState('');

  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('');
  const [expenseDate, setExpenseDate] = useState('');
  const [expenseAdditionalInfo, setExpenseAdditionalInfo] = useState('');

  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deletingJob, setDeletingJob] = useState<Job | null>(null);
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null);

  const { mutate: addJob, isPending: isAddingJob } = useAddJob();
  const { mutate: addExpense, isPending: isAddingExpense } = useAddExpense();
  const { mutate: deleteJob, isPending: isDeletingJob } = useDeleteJob();
  const { mutate: deleteExpense, isPending: isDeletingExpense } = useDeleteExpense();
  const { data: jobs } = useAllJobs();
  const { data: expenses } = useAllExpenses();

  const handleAddJob = (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobRevenue || !jobDate || !jobSector || !jobClientName) {
      toast.error('Please fill in all job fields');
      return;
    }

    const dateTimestamp = BigInt(new Date(jobDate).getTime() * 1000000);
    const customerInfo: CustomerInfo = {
      name: '',
      coordinates: '',
      town: '',
      jobType: '',
      additionalInfo: '',
    };

    addJob(
      { 
        revenue: parseFloat(jobRevenue), 
        date: dateTimestamp, 
        sector: jobSector,
        clientName: jobClientName,
        customerInfo,
        cleanProfit: 0,
        costs: 0,
      },
      {
        onSuccess: () => {
          toast.success('Job added successfully!');
          setJobRevenue('');
          setJobDate('');
          setJobSector('');
          setJobClientName('');
        },
        onError: (error: any) => {
          toast.error(error.message || 'Failed to add job');
        },
      }
    );
  };

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseAmount || !expenseCategory || !expenseDate) {
      toast.error('Please fill in all expense fields');
      return;
    }

    const dateTimestamp = BigInt(new Date(expenseDate).getTime() * 1000000);
    
    addExpense(
      { 
        amount: parseFloat(expenseAmount), 
        category: expenseCategory, 
        date: dateTimestamp, 
        additionalInfo: expenseAdditionalInfo 
      },
      {
        onSuccess: () => {
          toast.success('Expense added successfully!');
          setExpenseAmount('');
          setExpenseCategory('');
          setExpenseDate('');
          setExpenseAdditionalInfo('');
        },
        onError: (error: any) => {
          toast.error(error.message || 'Failed to add expense');
        },
      }
    );
  };

  const handleDeleteJob = () => {
    if (!deletingJob) return;
    deleteJob(deletingJob.id, {
      onSuccess: () => {
        toast.success('Job deleted successfully!');
        setDeletingJob(null);
      },
      onError: (error: any) => {
        toast.error(error.message || 'Failed to delete job');
        setDeletingJob(null);
      },
    });
  };

  const handleDeleteExpense = () => {
    if (!deletingExpense) return;
    deleteExpense(deletingExpense.id, {
      onSuccess: () => {
        toast.success('Expense deleted successfully!');
        setDeletingExpense(null);
      },
      onError: (error: any) => {
        toast.error(error.message || 'Failed to delete expense');
        setDeletingExpense(null);
      },
    });
  };

  const formatDate = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) / 1000000);
    return date.toLocaleDateString();
  };

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-bold text-slate-900">Data Entry</h2>
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Add Job Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-cyan-600" />
              Add Job
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleAddJob} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="job-client-name">Client Name</Label>
                <Input
                  id="job-client-name"
                  type="text"
                  placeholder="Client name"
                  value={jobClientName}
                  onChange={(e) => setJobClientName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="job-revenue">Revenue (€)</Label>
                <Input
                  id="job-revenue"
                  type="number"
                  step="0.01"
                  placeholder="1500.00"
                  value={jobRevenue}
                  onChange={(e) => setJobRevenue(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="job-date">Date</Label>
                <Input
                  id="job-date"
                  type="date"
                  value={jobDate}
                  onChange={(e) => setJobDate(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="job-sector">Sector</Label>
                <Select value={jobSector} onValueChange={setJobSector} required>
                  <SelectTrigger id="job-sector">
                    <SelectValue placeholder="Select sector" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Commercial">Commercial</SelectItem>
                    <SelectItem value="Residential">Residential</SelectItem>
                    <SelectItem value="Industrial">Industrial</SelectItem>
                    <SelectItem value="Agricultural">Agricultural</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-700" disabled={isAddingJob}>
                {isAddingJob ? 'Adding...' : 'Add Job'}
              </Button>
            </form>

            {/* Jobs List */}
            {jobs && jobs.length > 0 && (
              <div className="mt-6">
                <h4 className="mb-2 font-semibold text-slate-900">Recent Jobs</h4>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Sector</TableHead>
                        <TableHead className="text-right">Revenue</TableHead>
                        <TableHead className="w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {jobs.slice(-5).reverse().map((job) => (
                        <TableRow key={Number(job.id)}>
                          <TableCell>
                            <Badge variant="outline" className="font-mono text-xs">
                              <Hash className="h-3 w-3 mr-1" />
                              {Number(job.id)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm font-medium">{job.clientName || 'N/A'}</TableCell>
                          <TableCell className="text-sm">{formatDate(job.date)}</TableCell>
                          <TableCell className="text-sm">{job.sector}</TableCell>
                          <TableCell className="text-right text-sm font-medium">€{job.revenue.toFixed(2)}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditingJob(job)}
                                className="h-8 w-8 p-0"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeletingJob(job)}
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add Expense Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-red-600" />
              Add Expense
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleAddExpense} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="expense-amount">Amount (€)</Label>
                <Input
                  id="expense-amount"
                  type="number"
                  step="0.01"
                  placeholder="500.00"
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expense-category">Category</Label>
                <Select value={expenseCategory} onValueChange={setExpenseCategory} required>
                  <SelectTrigger id="expense-category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Equipment">Equipment</SelectItem>
                    <SelectItem value="Maintenance">Maintenance</SelectItem>
                    <SelectItem value="Fuel">Fuel</SelectItem>
                    <SelectItem value="Insurance">Insurance</SelectItem>
                    <SelectItem value="Marketing">Marketing</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="expense-additional-info">Additional Information</Label>
                <Input
                  id="expense-additional-info"
                  type="text"
                  placeholder="Optional notes or details..."
                  value={expenseAdditionalInfo}
                  onChange={(e) => setExpenseAdditionalInfo(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expense-date">Date</Label>
                <Input
                  id="expense-date"
                  type="date"
                  value={expenseDate}
                  onChange={(e) => setExpenseDate(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full bg-red-600 hover:bg-red-700" disabled={isAddingExpense}>
                {isAddingExpense ? 'Adding...' : 'Add Expense'}
              </Button>
            </form>

            {/* Expenses List */}
            {expenses && expenses.length > 0 && (
              <div className="mt-6">
                <h4 className="mb-2 font-semibold text-slate-900">Recent Expenses</h4>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {expenses.slice(-5).reverse().map((expense) => (
                        <TableRow key={Number(expense.id)}>
                          <TableCell>
                            <Badge variant="outline" className="font-mono text-xs">
                              <Hash className="h-3 w-3 mr-1" />
                              {Number(expense.id)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">{formatDate(expense.date)}</TableCell>
                          <TableCell className="text-sm">
                            {expense.category}
                            {expense.additionalInfo && (
                              <div className="text-xs text-slate-500 mt-1">{expense.additionalInfo}</div>
                            )}
                          </TableCell>
                          <TableCell className="text-right text-sm font-medium">€{expense.amount.toFixed(2)}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditingExpense(expense)}
                                className="h-8 w-8 p-0"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeletingExpense(expense)}
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit/Delete Dialogs */}
      {editingJob && <EditJobDialog job={editingJob} onClose={() => setEditingJob(null)} />}
      {editingExpense && <EditExpenseDialog expense={editingExpense} onClose={() => setEditingExpense(null)} />}
      {deletingJob && (
        <DeleteConfirmDialog
          title="Delete Job"
          description="Are you sure you want to delete this job? This action cannot be undone."
          onConfirm={handleDeleteJob}
          onCancel={() => setDeletingJob(null)}
          isDeleting={isDeletingJob}
        />
      )}
      {deletingExpense && (
        <DeleteConfirmDialog
          title="Delete Expense"
          description="Are you sure you want to delete this expense? This action cannot be undone."
          onConfirm={handleDeleteExpense}
          onCancel={() => setDeletingExpense(null)}
          isDeleting={isDeletingExpense}
        />
      )}
    </section>
  );
}
