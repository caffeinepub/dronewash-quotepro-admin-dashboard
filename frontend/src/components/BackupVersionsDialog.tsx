import React, { useState } from 'react';
import { toast } from 'sonner';
import { Download, Trash2, Clock, Database } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getBackupVersions, deleteBackupVersion, BackupVersion } from '@/hooks/useQueries';

interface BackupVersionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function safeStringify(obj: unknown): string {
  return JSON.stringify(obj, (_key, value) =>
    typeof value === 'bigint' ? value.toString() : value
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function BackupVersionsDialog({ open, onOpenChange }: BackupVersionsDialogProps) {
  const [versions, setVersions] = useState<BackupVersion[]>(() => getBackupVersions());

  const handleRefresh = () => {
    setVersions(getBackupVersions());
  };

  const handleDownload = (version: BackupVersion) => {
    try {
      const json = safeStringify(version.data);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dronewash-backup-${version.id}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Backup downloaded successfully.');
    } catch {
      toast.error('Failed to download backup.');
    }
  };

  const handleDelete = (id: string) => {
    deleteBackupVersion(id);
    setVersions(getBackupVersions());
    toast.success('Backup version deleted.');
  };

  const formatTimestamp = (timestamp: bigint) => {
    const ms = Number(timestamp) / 1_000_000;
    return new Date(ms).toLocaleString('en-IE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getDataSize = (version: BackupVersion) => {
    try {
      return formatBytes(new Blob([safeStringify(version.data)]).size);
    } catch {
      return 'N/A';
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (o) handleRefresh(); onOpenChange(o); }}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Backup Versions
          </DialogTitle>
        </DialogHeader>

        {versions.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            <Database className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p>No backup versions saved yet.</p>
            <p className="text-sm mt-1">Use the Backup Data button to create a backup.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Clock className="h-4 w-4 inline mr-1" />
                  Timestamp
                </TableHead>
                <TableHead>ID</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Records</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {versions.map((version) => (
                <TableRow key={version.id}>
                  <TableCell className="text-sm">{formatTimestamp(version.timestamp)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs font-mono">
                      {version.id.slice(-8)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {getDataSize(version)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {version.data.jobs.length} jobs, {version.data.expenses.length} expenses,{' '}
                    {version.data.quotes.length} quotes
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownload(version)}
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Download
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(version.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DialogContent>
    </Dialog>
  );
}
