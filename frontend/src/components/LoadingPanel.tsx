import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

interface LoadingPanelProps {
  title: string;
  message?: string;
}

export default function LoadingPanel({ title, message = 'Loading data from blockchain...' }: LoadingPanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center py-8 space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-600" />
        <p className="text-sm text-slate-600">{message}</p>
      </CardContent>
    </Card>
  );
}
