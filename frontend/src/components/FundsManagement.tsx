import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Wallet, TrendingUp, TrendingDown, ArrowRightLeft, AlertCircle,
  Plus, Edit, Trash2, Paperclip, Eye, Download,
} from 'lucide-react';
import { useAllFunds, useAllFundTransactions, useAllFundTransfers, useAllFundAlerts, useDeleteFund } from '@/hooks/useQueries';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import CreateFundDialog from './CreateFundDialog';
import EditFundDialog from './EditFundDialog';
import AddFundTransactionDialog from './AddFundTransactionDialog';
import InvestmentFundManagement from './InvestmentFundManagement';
import { savePdf, getPdf, hasAttachment } from '@/hooks/usePdfAttachments';

interface FundsManagementProps {
  isAdmin: boolean;
  activeSubTab?: string;
  onSubTabChange?: (tab: string) => void;
}

export default function FundsManagement({ isAdmin, activeSubTab, onSubTabChange }: FundsManagementProps) {
  const { data: funds, isLoading: fundsLoading } = useAllFunds();
  const { data: transactions, isLoading: transactionsLoading } = useAllFundTransactions();
  const { data: transfers, isLoading: transfersLoading } = useAllFundTransfers();
  const { data: alerts } = useAllFundAlerts();
  const { mutate: deleteFund } = useDeleteFund();

  const [selectedFund, setSelectedFund] = useState<bigint | null>(null);
  const [showCreateFundDialog, setShowCreateFundDialog] = useState(false);
  const [showEditFundDialog, setShowEditFundDialog] = useState(false);
  const [showAddTransactionDialog, setShowAddTransactionDialog] = useState(false);
  const [internalActiveTab, setInternalActiveTab] = useState('operational');

  // Track which transaction IDs have PDF attachments: key = string(transactionId), value = true
  const [attachmentMap, setAttachmentMap] = useState<Record<string, boolean>>({});

  // Ref for the hidden PDF file input
  const pdfInputRef = useRef<HTMLInputElement>(null);

  // Use controlled or uncontrolled tab state
  const currentTab = activeSubTab !== undefined ? activeSubTab : internalActiveTab;
  const handleTabChange = (tab: string) => {
    if (onSubTabChange) {
      onSubTabChange(tab);
    } else {
      setInternalActiveTab(tab);
    }
  };

  const fundTypeLabels: Record<string, string> = {
    main: 'Main Fund',
    maintenance: 'Maintenance Fund',
    salaries: 'Salaries Fund',
    investment: 'Investment Fund',
  };

  const fundTypeColors: Record<string, string> = {
    main: 'bg-blue-600',
    maintenance: 'bg-orange-600',
    salaries: 'bg-green-600',
    investment: 'bg-purple-600',
  };

  const operationalFunds = useMemo(() => {
    return funds?.filter(f => f.isActive && f.fundType !== 'investment') || [];
  }, [funds]);

  const selectedFundData = useMemo(() => {
    return funds?.find(f => f.id === selectedFund);
  }, [funds, selectedFund]);

  const selectedFundTransactions = useMemo(() => {
    if (!selectedFund || !transactions) return [];
    return transactions.filter(t => t.fundId === selectedFund).sort((a, b) => Number(b.date - a.date));
  }, [transactions, selectedFund]);

  const activeAlerts = useMemo(() => {
    return alerts?.filter(a => a.isActive && a.fundType !== 'investment') || [];
  }, [alerts]);

  // Check if the currently selected fund is the Quotations Fund
  const isQuotationsFund = useMemo(() => {
    if (!selectedFundData) return false;
    return selectedFundData.name.toLowerCase().includes('quotation');
  }, [selectedFundData]);

  // Refresh attachment status for all visible Quotations Fund transactions
  const refreshAttachments = useCallback(async (txList: typeof selectedFundTransactions) => {
    if (!txList.length) return;
    const entries = await Promise.all(
      txList.map(async (tx) => {
        const has = await hasAttachment(tx.id).catch(() => false);
        return [String(tx.id), has] as [string, boolean];
      })
    );
    setAttachmentMap((prev) => {
      const next = { ...prev };
      for (const [key, val] of entries) {
        next[key] = val;
      }
      return next;
    });
  }, []);

  // Refresh attachments whenever the visible transactions change (fund selection or data update)
  useEffect(() => {
    if (isQuotationsFund && selectedFundTransactions.length > 0) {
      refreshAttachments(selectedFundTransactions);
    }
  }, [isQuotationsFund, selectedFundTransactions, refreshAttachments]);

  const formatDate = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) / 1000000);
    return date.toLocaleDateString();
  };

  const formatCurrency = (amount: number) => {
    return `€${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const handleDeleteFund = (fundId: bigint) => {
    if (!confirm('Are you sure you want to delete this fund? This action cannot be undone.')) {
      return;
    }

    deleteFund(fundId, {
      onSuccess: () => {
        toast.success('Fund deleted successfully');
        if (selectedFund === fundId) {
          setSelectedFund(null);
        }
      },
      onError: (error) => {
        toast.error('Failed to delete fund', {
          description: error instanceof Error ? error.message : 'Unknown error',
        });
      },
    });
  };

  const handleAttachPdf = (transactionId: bigint) => {
    if (pdfInputRef.current) {
      pdfInputRef.current.dataset.transactionId = String(transactionId);
      pdfInputRef.current.value = '';
      pdfInputRef.current.click();
    }
  };

  const handlePdfFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const transactionIdStr = pdfInputRef.current?.dataset.transactionId;
    if (!file || !transactionIdStr) return;

    const transactionId = BigInt(transactionIdStr);

    try {
      await savePdf(transactionId, file);
      // Update attachment map immediately so indicator appears without reload
      setAttachmentMap((prev) => ({ ...prev, [transactionIdStr]: true }));
      toast.success(`PDF attached: ${file.name}`);
    } catch (err) {
      console.error('Failed to save PDF:', err);
      toast.error('Failed to attach PDF', {
        description: 'Could not save the file to local storage.',
      });
    }
  };

  const handleViewPdf = async (transactionId: bigint) => {
    try {
      const result = await getPdf(transactionId);
      if (!result) {
        toast.error('No PDF found for this transaction.');
        return;
      }
      const objectUrl = URL.createObjectURL(result.blob);
      window.open(objectUrl, '_blank');
      // Revoke after a short delay to allow the tab to load
      setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    } catch (err) {
      console.error('Failed to retrieve PDF:', err);
      toast.error('Failed to open PDF', {
        description: 'Could not retrieve the file from local storage.',
      });
    }
  };

  const handleDownloadPdf = async (transactionId: bigint) => {
    try {
      const result = await getPdf(transactionId);
      if (!result) {
        toast.error('No PDF found for this transaction.');
        return;
      }
      const objectUrl = URL.createObjectURL(result.blob);
      const anchor = document.createElement('a');
      anchor.href = objectUrl;
      anchor.download = result.filename;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(objectUrl);
    } catch (err) {
      console.error('Failed to download PDF:', err);
      toast.error('Failed to download PDF', {
        description: 'Could not retrieve the file from local storage.',
      });
    }
  };

  if (fundsLoading) {
    return (
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-slate-900">Fund Management</h2>
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-slate-500">Loading funds...</div>
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <TooltipProvider>
      <section className="space-y-4">
        {/* Hidden PDF file input */}
        <input
          ref={pdfInputRef}
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={handlePdfFileSelected}
        />

        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-900">Fund Management</h2>
          {isAdmin && currentTab === 'operational' && (
            <Button
              className="gap-2 bg-cyan-600 hover:bg-cyan-700"
              onClick={() => setShowCreateFundDialog(true)}
            >
              <Plus className="h-4 w-4" />
              Create Fund
            </Button>
          )}
        </div>

        <Tabs value={currentTab} onValueChange={handleTabChange} className="space-y-4">
          <TabsList>
            <TabsTrigger value="operational">Operational Funds</TabsTrigger>
            <TabsTrigger value="investment">Investment Fund</TabsTrigger>
          </TabsList>

          <TabsContent value="operational" className="space-y-4">
            {/* Active Alerts */}
            {activeAlerts.length > 0 && (
              <div className="space-y-2">
                {activeAlerts.map((alert) => (
                  <Alert key={Number(alert.id)} variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>{fundTypeLabels[alert.fundType] || alert.fundType}:</strong> {alert.message}
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            )}

            {/* Fund Overview Cards */}
            <div className="grid gap-4 md:grid-cols-3">
              {operationalFunds.map((fund) => {
                const fundTransactions = transactions?.filter(t => t.fundId === fund.id) || [];
                const totalInflow = fundTransactions.filter(t => t.transactionType === 'inflow').reduce((sum, t) => sum + t.amount, 0);
                const totalOutflow = fundTransactions.filter(t => t.transactionType === 'outflow').reduce((sum, t) => sum + t.amount, 0);

                return (
                  <Card
                    key={Number(fund.id)}
                    className={`border-l-4 cursor-pointer transition-all hover:shadow-md ${selectedFund === fund.id ? 'ring-2 ring-cyan-600' : ''}`}
                    style={{ borderLeftColor: fundTypeColors[fund.fundType] ? fundTypeColors[fund.fundType].replace('bg-', '#') : '#0891b2' }}
                    onClick={() => setSelectedFund(fund.id)}
                  >
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-slate-600">{fund.name}</CardTitle>
                      <Wallet className={`h-5 w-5 ${fundTypeColors[fund.fundType]?.replace('bg-', 'text-')}`} />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-slate-900">{formatCurrency(fund.balance)}</div>
                      <div className="mt-2 flex items-center gap-4 text-xs text-slate-500">
                        <div className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3 text-green-600" />
                          {formatCurrency(totalInflow)}
                        </div>
                        <div className="flex items-center gap-1">
                          <TrendingDown className="h-3 w-3 text-red-600" />
                          {formatCurrency(totalOutflow)}
                        </div>
                      </div>
                      <div className="mt-2 text-xs text-slate-500">
                        {fundTransactions.length} transaction{fundTransactions.length !== 1 ? 's' : ''}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Fund Details */}
            {selectedFundData && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{selectedFundData.name} - Details</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{fundTypeLabels[selectedFundData.fundType] || selectedFundData.fundType}</Badge>
                      {isAdmin && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowAddTransactionDialog(true)}
                            className="gap-2"
                          >
                            <Plus className="h-4 w-4" />
                            Add Entry
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowEditFundDialog(true)}
                            className="gap-2"
                          >
                            <Edit className="h-4 w-4" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteFund(selectedFundData.id)}
                            className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </Button>
                        </>
                      )}
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="transactions" className="space-y-4">
                    <TabsList>
                      <TabsTrigger value="transactions">Transactions</TabsTrigger>
                      <TabsTrigger value="info">Fund Info</TabsTrigger>
                    </TabsList>

                    <TabsContent value="transactions" className="space-y-4">
                      {transactionsLoading ? (
                        <div className="py-8 text-center text-slate-500">Loading transactions...</div>
                      ) : selectedFundTransactions.length === 0 ? (
                        <div className="py-8 text-center text-slate-500">No transactions yet</div>
                      ) : (
                        <div className="rounded-md border">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                                <TableHead className="text-right">Balance</TableHead>
                                {isQuotationsFund && (
                                  <TableHead className="text-center">PDF</TableHead>
                                )}
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {selectedFundTransactions.map((transaction) => {
                                const txKey = String(transaction.id);
                                const hasPdf = attachmentMap[txKey] === true;

                                return (
                                  <TableRow key={Number(transaction.id)}>
                                    <TableCell className="text-sm">{formatDate(transaction.date)}</TableCell>
                                    <TableCell>
                                      <Badge variant={transaction.transactionType === 'inflow' ? 'default' : 'secondary'} className="text-xs">
                                        {transaction.transactionType === 'inflow' ? (
                                          <TrendingUp className="mr-1 h-3 w-3" />
                                        ) : (
                                          <TrendingDown className="mr-1 h-3 w-3" />
                                        )}
                                        {transaction.transactionType}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="text-sm">{transaction.description}</TableCell>
                                    <TableCell className="text-sm">{transaction.category}</TableCell>
                                    <TableCell className={`text-right font-medium ${transaction.transactionType === 'inflow' ? 'text-green-600' : 'text-red-600'}`}>
                                      {transaction.transactionType === 'inflow' ? '+' : '-'}{formatCurrency(transaction.amount)}
                                    </TableCell>
                                    <TableCell className="text-right font-semibold">{formatCurrency(transaction.remainingBalance)}</TableCell>
                                    {isQuotationsFund && (
                                      <TableCell className="text-center">
                                        <div className="flex items-center justify-center gap-1">
                                          {/* Paperclip indicator when PDF is attached */}
                                          {hasPdf && (
                                            <Paperclip className="h-3.5 w-3.5 text-cyan-600 shrink-0" aria-label="PDF attached" />
                                          )}

                                          {/* Attach / Replace button */}
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                className={`h-7 w-7 ${hasPdf ? 'text-cyan-600 hover:text-cyan-700 hover:bg-cyan-50' : 'text-slate-400 hover:text-cyan-600 hover:bg-cyan-50'}`}
                                                onClick={() => handleAttachPdf(transaction.id)}
                                              >
                                                <Plus className="h-3.5 w-3.5" />
                                              </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                              <p>{hasPdf ? 'Replace PDF' : 'Attach PDF'}</p>
                                            </TooltipContent>
                                          </Tooltip>

                                          {/* View button — only when PDF exists */}
                                          {hasPdf && (
                                            <Tooltip>
                                              <TooltipTrigger asChild>
                                                <Button
                                                  variant="ghost"
                                                  size="icon"
                                                  className="h-7 w-7 text-slate-500 hover:text-cyan-600 hover:bg-cyan-50"
                                                  onClick={() => handleViewPdf(transaction.id)}
                                                >
                                                  <Eye className="h-3.5 w-3.5" />
                                                </Button>
                                              </TooltipTrigger>
                                              <TooltipContent>
                                                <p>View PDF</p>
                                              </TooltipContent>
                                            </Tooltip>
                                          )}

                                          {/* Download button — only when PDF exists */}
                                          {hasPdf && (
                                            <Tooltip>
                                              <TooltipTrigger asChild>
                                                <Button
                                                  variant="ghost"
                                                  size="icon"
                                                  className="h-7 w-7 text-slate-500 hover:text-cyan-600 hover:bg-cyan-50"
                                                  onClick={() => handleDownloadPdf(transaction.id)}
                                                >
                                                  <Download className="h-3.5 w-3.5" />
                                                </Button>
                                              </TooltipTrigger>
                                              <TooltipContent>
                                                <p>Download PDF</p>
                                              </TooltipContent>
                                            </Tooltip>
                                          )}
                                        </div>
                                      </TableCell>
                                    )}
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="info" className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <p className="text-sm text-slate-600">Current Balance</p>
                          <p className="text-2xl font-bold text-slate-900">{formatCurrency(selectedFundData.balance)}</p>
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm text-slate-600">Spending Limit</p>
                          <p className="text-2xl font-bold text-slate-900">{formatCurrency(selectedFundData.spendingLimit)}</p>
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm text-slate-600">Approval Threshold</p>
                          <p className="text-2xl font-bold text-slate-900">{formatCurrency(selectedFundData.approvalThreshold)}</p>
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm text-slate-600">Status</p>
                          <Badge variant={selectedFundData.isActive ? 'default' : 'secondary'}>
                            {selectedFundData.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm text-slate-600">Created Date</p>
                          <p className="text-sm font-medium">{formatDate(selectedFundData.createdDate)}</p>
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm text-slate-600">Last Updated</p>
                          <p className="text-sm font-medium">{formatDate(selectedFundData.lastUpdated)}</p>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            )}

            {/* Fund Transfers */}
            {isAdmin && transfers && transfers.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ArrowRightLeft className="h-5 w-5 text-cyan-600" />
                    Fund Transfers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {transfersLoading ? (
                    <div className="py-4 text-center text-slate-500">Loading transfers...</div>
                  ) : (
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>From</TableHead>
                            <TableHead>To</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                            <TableHead>Reason</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {transfers.map((transfer) => {
                            const sourceFund = funds?.find(f => f.id === transfer.sourceFundId);
                            const destFund = funds?.find(f => f.id === transfer.destinationFundId);
                            return (
                              <TableRow key={Number(transfer.id)}>
                                <TableCell className="text-sm">{formatDate(transfer.date)}</TableCell>
                                <TableCell className="text-sm">{sourceFund?.name || `Fund #${transfer.sourceFundId}`}</TableCell>
                                <TableCell className="text-sm">{destFund?.name || `Fund #${transfer.destinationFundId}`}</TableCell>
                                <TableCell className="text-right font-medium">{formatCurrency(transfer.amount)}</TableCell>
                                <TableCell className="text-sm">{transfer.reason}</TableCell>
                                <TableCell>
                                  <Badge
                                    variant={
                                      transfer.status === 'approved' ? 'default' :
                                      transfer.status === 'rejected' ? 'destructive' : 'secondary'
                                    }
                                    className="text-xs"
                                  >
                                    {transfer.status}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="investment">
            <InvestmentFundManagement isAdmin={isAdmin} />
          </TabsContent>
        </Tabs>

        {/* Dialogs — use onClose prop as required by each dialog's interface */}
        {showCreateFundDialog && (
          <CreateFundDialog
            open={showCreateFundDialog}
            onClose={() => setShowCreateFundDialog(false)}
          />
        )}

        {showEditFundDialog && selectedFundData && (
          <EditFundDialog
            open={showEditFundDialog}
            onClose={() => setShowEditFundDialog(false)}
            fund={selectedFundData}
          />
        )}

        {showAddTransactionDialog && selectedFundData && (
          <AddFundTransactionDialog
            open={showAddTransactionDialog}
            onClose={() => setShowAddTransactionDialog(false)}
            fundId={selectedFundData.id}
            fundName={selectedFundData.name}
          />
        )}
      </section>
    </TooltipProvider>
  );
}
