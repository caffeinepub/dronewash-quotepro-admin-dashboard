import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ArchivedInvestmentsProps {
  onNavigateToInvestmentFund?: () => void;
}

export default function ArchivedInvestments({ onNavigateToInvestmentFund }: ArchivedInvestmentsProps) {
  const handleNavigateToInvestmentFund = () => {
    // First try the callback if provided
    if (onNavigateToInvestmentFund) {
      onNavigateToInvestmentFund();
      return;
    }

    // Fallback: Try to navigate via DOM manipulation
    const fundsTab = document.querySelector('[value="funds"]') as HTMLElement;
    if (fundsTab) {
      fundsTab.click();
      // Wait for the tab to render, then switch to investment sub-tab
      setTimeout(() => {
        const investmentSubTab = document.querySelector('[value="investment"]') as HTMLElement;
        if (investmentSubTab) {
          investmentSubTab.click();
        }
      }, 100);
    }
  };

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-bold text-slate-900">Investment Tracking</h2>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5 text-cyan-600" />
            Investment Fund System
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="border-cyan-200 bg-cyan-50">
            <Info className="h-4 w-4 text-cyan-600" />
            <AlertDescription className="text-cyan-900">
              <p className="font-medium mb-2">Investment tracking has been upgraded!</p>
              <p className="text-sm">
                The archived investments feature has been replaced with a comprehensive Investment Fund system. 
                All investment tracking, payments, and allocations are now managed through the dedicated Investment Fund.
              </p>
            </AlertDescription>
          </Alert>

          <div className="rounded-lg border bg-slate-50 p-6 space-y-4">
            <h3 className="text-lg font-semibold text-slate-900">New Investment Fund Features</h3>
            <ul className="space-y-2 text-sm text-slate-700">
              <li className="flex items-start gap-2">
                <ArrowRight className="h-4 w-4 mt-0.5 text-cyan-600 flex-shrink-0" />
                <span><strong>Dedicated Fund:</strong> €85,000 initial capital completely isolated from operational funds</span>
              </li>
              <li className="flex items-start gap-2">
                <ArrowRight className="h-4 w-4 mt-0.5 text-cyan-600 flex-shrink-0" />
                <span><strong>Manual Transactions:</strong> Add investment payments and allocations with detailed descriptions</span>
              </li>
              <li className="flex items-start gap-2">
                <ArrowRight className="h-4 w-4 mt-0.5 text-cyan-600 flex-shrink-0" />
                <span><strong>Complete History:</strong> Track all investment transactions with allocation types and running balances</span>
              </li>
              <li className="flex items-start gap-2">
                <ArrowRight className="h-4 w-4 mt-0.5 text-cyan-600 flex-shrink-0" />
                <span><strong>Real-time Tracking:</strong> Monitor current balance, total payments, and allocations at any time</span>
              </li>
            </ul>
          </div>

          <div className="flex justify-center pt-4">
            <Button 
              className="gap-2 bg-cyan-600 hover:bg-cyan-700"
              onClick={handleNavigateToInvestmentFund}
            >
              Go to Investment Fund
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
