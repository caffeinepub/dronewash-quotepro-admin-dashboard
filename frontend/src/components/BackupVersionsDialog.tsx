import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Download, Trash2, Clock, Database } from 'lucide-react';
import { toast } from 'sonner';
import { getBackupVersions, deleteBackupVersion, BackupVersion } from '@/hooks/useQueries';

interface BackupVersionsDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function BackupVersionsDialog({ open, onClose }: BackupVersionsDialogProps) {
  const [versions, setVersions] = useState<BackupVersion[]>(getBackupVersions());

  const handleRefresh = () => {
    setVersions(getBackupVersions());
  };

  const handleDelete = (id: string) => {
    try {
      deleteBackupVersion(id);
      setVersions(getBackupVersions());
      toast.success('Backup version deleted');
    } catch (error) {
      toast.error('Failed to delete backup version', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  const handleDownload = (version: BackupVersion) => {
    try {
      // Custom serialization for BigInt values
      const dataStr = JSON.stringify(version.data, (key, value) => {
        if (typeof value === 'bigint') {
          return value.toString();
        }
        return value;
      }, 2);
      
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `backup-${version.saveVersionId}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Backup downloaded successfully');
    } catch (error) {
      toast.error('Failed to download backup', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp / 1000000).toLocaleString();
  };

  const formatSize = (data: any) => {
    try {
      const str = JSON.stringify(data, (key, value) => {
        if (typeof value === 'bigint') {
          return value.toString();
        }
        return value;
      });
      const bytes = new Blob([str]).size;
      if (bytes < 1024) return `${bytes} B`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
      return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    } catch {
      return 'N/A';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-cyan-600" />
            Backups & Versions
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-600">
              {versions.length} backup version{versions.length !== 1 ? 's' : ''} stored locally
            </p>
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              Refresh
            </Button>
          </div>

          {versions.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <Database className="mx-auto h-12 w-12 text-slate-300 mb-4" />
              <p className="text-lg font-medium">No backup versions yet</p>
              <p className="text-sm mt-2">Create a backup to see versions here</p>
            </div>
          ) : (
            <ScrollArea className="h-[400px] rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Save Version ID</TableHead>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {versions
                    .sort((a, b) => b.timestamp - a.timestamp)
                    .map((version) => (
                      <TableRow key={version.id}>
                        <TableCell className="font-mono text-xs">
                          <Badge variant="outline" className="font-mono">
                            {version.saveVersionId}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-slate-400" />
                            {formatDate(version.timestamp)}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-slate-600">
                          {formatSize(version.data)}
                        </TableCell>
                        <TableCell className="text-xs text-slate-500">
                          <div className="space-y-1">
                            <div>{version.data.jobs.length} jobs</div>
                            <div>{version.data.expenses.length} expenses</div>
                            <div>{version.data.quotes.length} quotes</div>
                            <div>{version.data.invoices.length} invoices</div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDownload(version)}
                              title="Download backup"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(version.id)}
                              title="Delete backup"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}

          <div className="rounded-lg border bg-blue-50 p-4">
            <p className="text-sm text-blue-900">
              <strong>Note:</strong> Backup versions are stored locally in your browser. Each backup includes a unique Save Version ID for recovery purposes. Download important backups to keep them safe.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
