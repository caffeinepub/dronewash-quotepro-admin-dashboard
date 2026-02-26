import { lazy, Suspense, memo } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useGetCallerUserProfile, useSaveCallerUserProfile, useGetCallerUserRole } from './hooks/useQueries';
import LoginPage from './pages/LoginPage';
import ProfileSetupDialog from './components/ProfileSetupDialog';
import DataMigrationHandler from './components/DataMigrationHandler';
import { UserRole } from './backend';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';

// Lazy load Dashboard for better initial load performance
const Dashboard = lazy(() => import('./pages/Dashboard'));

// Configure React Query with optimized defaults for IC backend and performance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      retry: (failureCount, error) => {
        if (error instanceof Error && error.message.includes('Unauthorized')) {
          return false;
        }
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      networkMode: 'online',
    },
    mutations: {
      retry: 1,
      retryDelay: 1000,
      networkMode: 'online',
    },
  },
});

// Memoized loading component for better performance
const LoadingScreen = memo(({ message }: { message: string }) => (
  <div className="flex h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-cyan-50 dark:from-slate-900 dark:to-slate-800">
    <div className="text-center space-y-4">
      <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-cyan-600 border-r-transparent"></div>
      <div className="text-lg text-slate-700 dark:text-slate-300">{message}</div>
      <div className="text-sm text-slate-500 dark:text-slate-400">
        Fetching your data from the blockchain
      </div>
    </div>
  </div>
));

LoadingScreen.displayName = 'LoadingScreen';

function AppContent() {
  const { identity, loginStatus, clear } = useInternetIdentity();
  const { data: userProfile, isLoading: profileLoading, isFetched, error: profileError, refetch: refetchProfile } = useGetCallerUserProfile();
  const { data: userRole } = useGetCallerUserRole();
  const { mutate: saveProfile } = useSaveCallerUserProfile();
  const [showMigration, setShowMigration] = useState(false);

  const isAuthenticated = !!identity;
  const isLoggingIn = loginStatus === 'logging-in';

  const showProfileSetup = isAuthenticated && !profileLoading && isFetched && userProfile === null && !profileError;

  useEffect(() => {
    if (isAuthenticated && userProfile && !profileLoading) {
      const hasLocalData = checkForLocalStorageData();
      if (hasLocalData) {
        setShowMigration(true);
      }
    }
  }, [isAuthenticated, userProfile, profileLoading]);

  const checkForLocalStorageData = (): boolean => {
    const legacyKeys = ['jobs', 'expenses', 'quotes', 'invoices', 'funds', 'goals'];
    return legacyKeys.some(key => {
      const data = localStorage.getItem(key);
      if (data) {
        try {
          const parsed = JSON.parse(data);
          return Array.isArray(parsed) && parsed.length > 0;
        } catch {
          return false;
        }
      }
      return false;
    });
  };

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
  };

  const handleProfileSetup = (name: string, email: string, role: UserRole) => {
    saveProfile({ name, email, role });
  };

  const handleRetry = async () => {
    await refetchProfile();
  };

  const handleMigrationComplete = () => {
    setShowMigration(false);
    queryClient.invalidateQueries();
  };

  if (isLoggingIn || (isAuthenticated && profileLoading)) {
    return (
      <LoadingScreen 
        message={isLoggingIn ? 'Connecting to Internet Identity...' : 'Loading your dashboard...'}
      />
    );
  }

  if (isAuthenticated && profileError && !profileLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-cyan-50 dark:from-slate-900 dark:to-slate-800 p-4">
        <div className="max-w-md w-full space-y-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="space-y-4">
              <div>
                <p className="font-semibold">Backend Connection Failed</p>
                <p className="text-sm mt-2">
                  Unable to connect to the DroneWash backend canister. This could be due to:
                </p>
                <ul className="text-sm mt-2 ml-4 list-disc space-y-1">
                  <li>Network connectivity issues</li>
                  <li>Backend canister is not deployed or stopped</li>
                  <li>Incorrect canister ID configuration</li>
                  <li>Internet Computer network issues</li>
                </ul>
                <p className="text-sm mt-2 font-mono bg-slate-100 dark:bg-slate-800 p-2 rounded">
                  {profileError instanceof Error ? profileError.message : 'Unknown error'}
                </p>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleRetry} className="flex-1">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry Connection
                </Button>
                <Button variant="outline" onClick={handleLogout} className="flex-1">
                  Logout
                </Button>
              </div>
            </AlertDescription>
          </Alert>
          <div className="text-center text-sm text-slate-600 dark:text-slate-400">
            <p>If the problem persists, please contact your system administrator.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {!isAuthenticated ? (
        <LoginPage />
      ) : (
        <Suspense fallback={<LoadingScreen message="Loading dashboard..." />}>
          <Dashboard onLogout={handleLogout} userProfile={userProfile} userRole={userRole} />
          {showProfileSetup && <ProfileSetupDialog onSave={handleProfileSetup} />}
          {showMigration && <DataMigrationHandler onComplete={handleMigrationComplete} />}
        </Suspense>
      )}
      <Toaster />
    </>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <AppContent />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
