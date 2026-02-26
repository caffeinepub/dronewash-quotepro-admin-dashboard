import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Receipt, Search, Filter, X, Edit, Trash2, CheckSquare } from 'lucide-react';
import { useAllExpenses, useAllFunds, useDeleteExpense } from '@/hooks/useQueries';
import { toast } from 'sonner';
import EditExpenseDialog from './EditExpenseDialog';
import DeleteConfirmDialog from './DeleteConfirmDialog';
import type { Expense } from '../backend';

interface ExpensesManagementProps {
  isAdmin: boolean;
}

export default function ExpensesManagement({ isAdmin }: ExpensesManagementProps) {
  const { data: expenses, isLoading } = useAllExpenses();
  const { data: funds } = useAllFunds();
  const { mutate: deleteExpense, isPending: isDeleting } = useDeleteExpense();

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null);
  const [selectedExpenses, setSelectedExpenses] = useState<Set<bigint>>(new Set());

  const categories = useMemo(() => {
    if (!expenses) return [];
    return Array.from(new Set(expenses.map(e => e.category)));
  }, [expenses]);

  const filteredExpenses = useMemo(() => {
    if (!expenses) return [];
    
    return expenses.filter(expense => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm || 
        expense.category.toLowerCase().includes(searchLower) ||
        expense.additionalInfo.toLowerCase().includes(searchLower);

      const matchesCategory = categoryFilter === 'all' || expense.category === categoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [expenses, searchTerm, categoryFilter]);

  const totalExpenses = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  }, [filteredExpenses]);

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

  const handleBulkDelete = () => {
    if (selectedExpenses.size === 0) return;
    toast.info(`Bulk delete of ${selectedExpenses.size} expenses would be implemented here`);
  };

  const toggleExpenseSelection = (id: bigint) => {
    const newSelection = new Set(selectedExpenses);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedExpenses(newSelection);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setCategoryFilter('all');
  };

  const formatDate = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) / 1000000);
    return date.toLocaleDateString();
  };

  const formatCurrency = (amount: number) => {
    return `€${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  if (isLoading) {
    return (
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-slate-900">Expense Management</h2>
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-slate-500">Loading expenses...</div>
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900">Expense Management</h2>
        <div className="flex gap-2">
          {isAdmin && selectedExpenses.size > 0 && (
            <Button variant="destructive" size="sm" onClick={handleBulkDelete} className="gap-2">
              <Trash2 className="h-4 w-4" />
              Delete Selected ({selectedExpenses.size})
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="gap-2"
          >
            <Filter className="h-4 w-4" />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </Button>
        </div>
      </div>

      {/* Summary Card */}
      <Card className="border-l-4 border-l-red-600">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-slate-600">Total Expenses</CardTitle>
          <Receipt className="h-5 w-5 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-slate-900">{formatCurrency(totalExpenses)}</div>
          <p className="mt-1 text-xs text-slate-500">
            {filteredExpenses.length} expense{filteredExpenses.length !== 1 ? 's' : ''} 
            {(searchTerm || categoryFilter !== 'all') && ` (filtered from ${expenses?.length || 0})`}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-red-600" />
            All Expenses
            {filteredExpenses.length !== expenses?.length && (
              <Badge variant="secondary" className="ml-2">
                {filteredExpenses.length} of {expenses?.length || 0}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Filters */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search by category or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {showFilters && (
              <div className="grid gap-3 md:grid-cols-2 rounded-lg border bg-slate-50 p-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Category</label>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map(category => (
                        <SelectItem key={category} value={category}>{category}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end">
                  <Button variant="outline" onClick={clearFilters} className="w-full">
                    Clear Filters
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Expenses Table */}
          {filteredExpenses.length === 0 ? (
            <div className="py-8 text-center text-slate-500">
              {searchTerm || categoryFilter !== 'all' 
                ? 'No expenses match your filters' 
                : 'No expenses recorded yet'}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    {isAdmin && (
                      <TableHead className="w-[50px]">
                        <CheckSquare className="h-4 w-4" />
                      </TableHead>
                    )}
                    <TableHead>Date</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    {isAdmin && <TableHead className="w-[100px]">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredExpenses.map((expense) => (
                    <TableRow key={Number(expense.id)}>
                      {isAdmin && (
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedExpenses.has(expense.id)}
                            onChange={() => toggleExpenseSelection(expense.id)}
                            className="h-4 w-4 rounded border-slate-300"
                          />
                        </TableCell>
                      )}
                      <TableCell className="text-sm">{formatDate(expense.date)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{expense.category}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {expense.additionalInfo || 'No description'}
                      </TableCell>
                      <TableCell className="text-right font-semibold">{formatCurrency(expense.amount)}</TableCell>
                      {isAdmin && (
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
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {editingExpense && <EditExpenseDialog expense={editingExpense} onClose={() => setEditingExpense(null)} />}
      {deletingExpense && (
        <DeleteConfirmDialog
          title="Delete Expense"
          description="Are you sure you want to delete this expense? This action cannot be undone."
          onConfirm={handleDeleteExpense}
          onCancel={() => setDeletingExpense(null)}
          isDeleting={isDeleting}
        />
      )}
    </section>
  );
}
