import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorPanelProps {
  title: string;
  error: Error | unknown;
  onRetry?: () => void;
}

export default function ErrorPanel({ title, error, onRetry }: ErrorPanelProps) {
  const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="space-y-3">
            <div>
              <p className="font-semibold">Failed to load data</p>
              <p className="text-sm mt-1">{errorMessage}</p>
            </div>
            {onRetry && (
              <Button onClick={onRetry} variant="outline" size="sm" className="w-full">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            )}
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
