import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { FileText, Plus, Edit, Trash2, Search, Filter } from 'lucide-react';
import { useAllContracts, useCreateContract, useUpdateContract, useDeleteContract } from '@/hooks/useQueries';
import type { Contract } from '../backend';
import DeleteConfirmDialog from './DeleteConfirmDialog';

const STANDARDIZED_SERVICES = [
  'Façade/Wall Cleaning',
  'Full Building Cleaning',
  'Roof Cleaning',
  'Solar Panel Cleaning',
  'Window Cleaning',
];

const AREA_TIERS = [
  { value: 'tier1', label: 'Tier 1 (Small)' },
  { value: 'tier2', label: 'Tier 2 (Medium)' },
  { value: 'tier3', label: 'Tier 3 (Large)' },
  { value: 'tier4', label: 'Tier 4 (Extra Large)' },
];

interface ContractsManagementProps {
  isAdmin: boolean;
}

export default function ContractsManagement({ isAdmin }: ContractsManagementProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);

  // Form state
  const [contractName, setContractName] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientCompany, setClientCompany] = useState('');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [areaTier, setAreaTier] = useState('');
  const [agreedPrices, setAgreedPrices] = useState<Record<string, string>>({});
  const [contractStatus, setContractStatus] = useState('active');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const { data: contracts = [], isLoading } = useAllContracts();
  const { mutate: createContract, isPending: isCreating } = useCreateContract();
  const { mutate: updateContract, isPending: isUpdating } = useUpdateContract();
  const { mutate: deleteContract, isPending: isDeleting } = useDeleteContract();

  // Filter contracts
  const filteredContracts = useMemo(() => {
    return contracts.filter((contract) => {
      const matchesSearch =
        contract.contractName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contract.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contract.clientCompany.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || contract.contractStatus === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [contracts, searchTerm, statusFilter]);

  const resetForm = () => {
    setContractName('');
    setClientName('');
    setClientEmail('');
    setClientPhone('');
    setClientCompany('');
    setSelectedServices([]);
    setAreaTier('');
    setAgreedPrices({});
    setContractStatus('active');
    setStartDate('');
    setEndDate('');
  };

  const handleOpenCreate = () => {
    resetForm();
    setShowCreateDialog(true);
  };

  const handleOpenEdit = (contract: Contract) => {
    setSelectedContract(contract);
    setContractName(contract.contractName);
    setClientName(contract.clientName);
    setClientEmail(contract.clientEmail);
    setClientPhone(contract.clientPhone);
    setClientCompany(contract.clientCompany);
    setSelectedServices(contract.servicesCovered);
    setAreaTier(contract.areaTier);
    
    const pricesMap: Record<string, string> = {};
    contract.agreedPrices.forEach(([service, price]) => {
      pricesMap[service] = price.toString();
    });
    setAgreedPrices(pricesMap);
    
    setContractStatus(contract.contractStatus);
    setStartDate(new Date(Number(contract.startDate) / 1000000).toISOString().split('T')[0]);
    setEndDate(contract.endDate ? new Date(Number(contract.endDate) / 1000000).toISOString().split('T')[0] : '');
    setShowEditDialog(true);
  };

  const handleOpenDelete = (contract: Contract) => {
    setSelectedContract(contract);
    setShowDeleteDialog(true);
  };

  const handleCreate = () => {
    if (!contractName || !clientName || !clientEmail || selectedServices.length === 0 || !areaTier || !startDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Validate agreed prices for selected services
    const missingPrices = selectedServices.filter(service => !agreedPrices[service] || parseFloat(agreedPrices[service]) <= 0);
    if (missingPrices.length > 0) {
      toast.error(`Please set agreed prices for: ${missingPrices.join(', ')}`);
      return;
    }

    const pricesArray: [string, number][] = selectedServices.map(service => [
      service,
      parseFloat(agreedPrices[service])
    ]);

    const startDateBigInt = BigInt(new Date(startDate).getTime() * 1000000);
    const endDateBigInt = endDate ? BigInt(new Date(endDate).getTime() * 1000000) : null;

    createContract(
      {
        contractName,
        clientName,
        clientEmail,
        clientPhone,
        clientCompany,
        servicesCovered: selectedServices,
        areaTier,
        agreedPrices: pricesArray,
        contractStatus,
        startDate: startDateBigInt,
        endDate: endDateBigInt,
      },
      {
        onSuccess: () => {
          toast.success('Contract created successfully!');
          setShowCreateDialog(false);
          resetForm();
        },
        onError: (error) => {
          toast.error(error instanceof Error ? error.message : 'Failed to create contract');
        },
      }
    );
  };

  const handleUpdate = () => {
    if (!selectedContract) return;

    if (!contractName || !clientName || !clientEmail || selectedServices.length === 0 || !areaTier || !startDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    const missingPrices = selectedServices.filter(service => !agreedPrices[service] || parseFloat(agreedPrices[service]) <= 0);
    if (missingPrices.length > 0) {
      toast.error(`Please set agreed prices for: ${missingPrices.join(', ')}`);
      return;
    }

    const pricesArray: [string, number][] = selectedServices.map(service => [
      service,
      parseFloat(agreedPrices[service])
    ]);

    const startDateBigInt = BigInt(new Date(startDate).getTime() * 1000000);
    const endDateBigInt = endDate ? BigInt(new Date(endDate).getTime() * 1000000) : null;

    updateContract(
      {
        id: selectedContract.id,
        contractName,
        clientName,
        clientEmail,
        clientPhone,
        clientCompany,
        servicesCovered: selectedServices,
        areaTier,
        agreedPrices: pricesArray,
        contractStatus,
        startDate: startDateBigInt,
        endDate: endDateBigInt,
      },
      {
        onSuccess: () => {
          toast.success('Contract updated successfully!');
          setShowEditDialog(false);
          setSelectedContract(null);
          resetForm();
        },
        onError: (error) => {
          toast.error(error instanceof Error ? error.message : 'Failed to update contract');
        },
      }
    );
  };

  const handleDelete = () => {
    if (!selectedContract) return;

    deleteContract(selectedContract.id, {
      onSuccess: () => {
        toast.success('Contract deleted successfully!');
        setShowDeleteDialog(false);
        setSelectedContract(null);
      },
      onError: (error) => {
        toast.error(error instanceof Error ? error.message : 'Failed to delete contract');
      },
    });
  };

  const handleServiceToggle = (service: string) => {
    if (selectedServices.includes(service)) {
      setSelectedServices(selectedServices.filter(s => s !== service));
      const newPrices = { ...agreedPrices };
      delete newPrices[service];
      setAgreedPrices(newPrices);
    } else {
      setSelectedServices([...selectedServices, service]);
    }
  };

  const handlePriceChange = (service: string, value: string) => {
    setAgreedPrices({ ...agreedPrices, [service]: value });
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Contract Management</h2>
        {isAdmin && (
          <Button onClick={handleOpenCreate} className="gap-2 bg-cyan-600 hover:bg-cyan-700">
            <Plus className="h-4 w-4" />
            New Contract
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-cyan-600" />
            Client Contracts
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search contracts, clients, or companies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-400" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Results Counter */}
          <div className="text-sm text-slate-600 dark:text-slate-400">
            Showing {filteredContracts.length} of {contracts.length} contracts
          </div>

          {/* Contracts Table */}
          {isLoading ? (
            <div className="py-8 text-center text-slate-600">Loading contracts...</div>
          ) : filteredContracts.length === 0 ? (
            <div className="py-8 text-center text-slate-600">
              {searchTerm || statusFilter !== 'all' ? 'No contracts match your filters' : 'No contracts yet'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Contract Name</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Services</TableHead>
                    <TableHead>Area Tier</TableHead>
                    <TableHead>Status</TableHead>
                    {isAdmin && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredContracts.map((contract) => (
                    <TableRow key={contract.id.toString()}>
                      <TableCell className="font-medium">{contract.contractName}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{contract.clientName}</div>
                          <div className="text-xs text-slate-500">{contract.clientEmail}</div>
                        </div>
                      </TableCell>
                      <TableCell>{contract.clientCompany || '-'}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {contract.servicesCovered.slice(0, 2).map((service) => (
                            <Badge key={service} variant="secondary" className="text-xs">
                              {service}
                            </Badge>
                          ))}
                          {contract.servicesCovered.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{contract.servicesCovered.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{contract.areaTier}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            contract.contractStatus === 'active'
                              ? 'default'
                              : contract.contractStatus === 'inactive'
                              ? 'secondary'
                              : 'destructive'
                          }
                        >
                          {contract.contractStatus}
                        </Badge>
                      </TableCell>
                      {isAdmin && (
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenEdit(contract)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenDelete(contract)}
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

      {/* Create/Edit Dialog */}
      <Dialog open={showCreateDialog || showEditDialog} onOpenChange={(open) => {
        if (!open) {
          setShowCreateDialog(false);
          setShowEditDialog(false);
          setSelectedContract(null);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{showEditDialog ? 'Edit Contract' : 'Create New Contract'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Contract Information */}
            <div className="space-y-4">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">Contract Information</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="contract-name">Contract Name *</Label>
                  <Input
                    id="contract-name"
                    value={contractName}
                    onChange={(e) => setContractName(e.target.value)}
                    placeholder="e.g., Annual Cleaning Contract 2025"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contract-status">Status</Label>
                  <Select value={contractStatus} onValueChange={setContractStatus}>
                    <SelectTrigger id="contract-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="start-date">Start Date *</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end-date">End Date</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Client Information */}
            <div className="space-y-4">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">Client Information</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="client-name">Client Name *</Label>
                  <Input
                    id="client-name"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="John Doe"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client-company">Company</Label>
                  <Input
                    id="client-company"
                    value={clientCompany}
                    onChange={(e) => setClientCompany(e.target.value)}
                    placeholder="Company Name Ltd"
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="client-email">Email *</Label>
                  <Input
                    id="client-email"
                    type="email"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    placeholder="john@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client-phone">Phone</Label>
                  <Input
                    id="client-phone"
                    type="tel"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="+357 99 123456"
                  />
                </div>
              </div>
            </div>

            {/* Services and Pricing */}
            <div className="space-y-4">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">Services & Pricing</h3>
              <div className="space-y-2">
                <Label htmlFor="area-tier">Area Tier *</Label>
                <Select value={areaTier} onValueChange={setAreaTier}>
                  <SelectTrigger id="area-tier">
                    <SelectValue placeholder="Select area tier" />
                  </SelectTrigger>
                  <SelectContent>
                    {AREA_TIERS.map((tier) => (
                      <SelectItem key={tier.value} value={tier.value}>
                        {tier.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-3">
                <Label>Services Covered *</Label>
                {STANDARDIZED_SERVICES.map((service) => (
                  <div key={service} className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`service-${service}`}
                        checked={selectedServices.includes(service)}
                        onCheckedChange={() => handleServiceToggle(service)}
                      />
                      <Label htmlFor={`service-${service}`} className="cursor-pointer font-normal">
                        {service}
                      </Label>
                    </div>
                    {selectedServices.includes(service) && (
                      <div className="ml-6 space-y-2">
                        <Label htmlFor={`price-${service}`} className="text-sm">
                          Agreed Price (€ per m²)
                        </Label>
                        <Input
                          id={`price-${service}`}
                          type="number"
                          step="0.01"
                          min="0"
                          value={agreedPrices[service] || ''}
                          onChange={(e) => handlePriceChange(service, e.target.value)}
                          placeholder="0.00"
                          className="w-full"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateDialog(false);
                setShowEditDialog(false);
                setSelectedContract(null);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={showEditDialog ? handleUpdate : handleCreate}
              disabled={isCreating || isUpdating}
              className="bg-cyan-600 hover:bg-cyan-700"
            >
              {isCreating || isUpdating ? 'Saving...' : showEditDialog ? 'Update Contract' : 'Create Contract'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && selectedContract && (
        <DeleteConfirmDialog
          title="Delete Contract"
          description={`Are you sure you want to delete the contract "${selectedContract.contractName}"? This action cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => {
            setShowDeleteDialog(false);
            setSelectedContract(null);
          }}
          isDeleting={isDeleting}
        />
      )}
    </section>
  );
}
