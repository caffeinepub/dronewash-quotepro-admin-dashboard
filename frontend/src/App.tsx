import React, { Suspense, lazy, memo, useState, useEffect } from "react";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import LoginPage from "./pages/LoginPage";
import ProfileSetupDialog from "./components/ProfileSetupDialog";
import DataMigrationHandler from "./components/DataMigrationHandler";
import { useActor } from "./hooks/useActor";
import {
  useGetCallerUserProfile,
  useSaveCallerUserProfile,
  useGetCallerUserRole,
} from "./hooks/useQueries";
import { UserRole } from "./backend";

const Dashboard = lazy(() => import("./pages/Dashboard"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 10,
      retry: (failureCount, error) => {
        const msg = String(error);
        if (msg.includes("Unauthorized") || msg.includes("not found")) return false;
        return failureCount < 3;
      },
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000),
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
});

const LoadingScreen = memo(({ message }: { message?: string }) => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-cyan-50 dark:from-slate-900 dark:to-slate-800">
    <div className="text-center space-y-4">
      <div className="w-12 h-12 border-4 border-cyan-600 border-t-transparent rounded-full animate-spin mx-auto" />
      <p className="text-slate-600 dark:text-slate-400 font-medium">
        {message ?? "Loading DroneWash..."}
      </p>
      <p className="text-sm text-slate-500 dark:text-slate-500">
        Fetching your data from the blockchain
      </p>
    </div>
  </div>
));
LoadingScreen.displayName = "LoadingScreen";

function ConnectionErrorScreen({ onRetry }: { onRetry: () => void }) {
  const { clear } = useInternetIdentity();
  const qc = useQueryClient();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-cyan-50 dark:from-slate-900 dark:to-slate-800 p-4">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-6 shadow-lg space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
            <span className="text-red-600 dark:text-red-400 text-base font-bold">⊙</span>
          </div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Backend Connection Failed
          </h2>
        </div>
        <p className="text-slate-600 dark:text-slate-400 text-sm">
          Unable to connect to the DroneWash backend canister. This could be due to:
        </p>
        <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1 list-disc list-inside">
          <li>Network connectivity issues</li>
          <li>Backend canister is not deployed or stopped</li>
          <li>Incorrect canister ID configuration</li>
          <li>Internet Computer network issues</li>
        </ul>
        <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-3">
          <code className="text-xs text-slate-600 dark:text-slate-400 break-all">
            Backend actor not available. Please check your connection.
          </code>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onRetry}
            className="flex-1 flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <span className="inline-block">↻</span>
            Retry Connection
          </button>
          <button
            onClick={() => {
              qc.clear();
              clear();
            }}
            className="px-4 py-2 rounded-lg text-sm font-medium border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
          >
            Logout
          </button>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-500 text-center">
          If the problem persists, please contact your system administrator.
        </p>
      </div>
    </div>
  );
}

function AppInner() {
  const { identity, isInitializing } = useInternetIdentity();
  const { actor, isFetching: actorFetching } = useActor();
  const qc = useQueryClient();
  const { clear } = useInternetIdentity();

  const {
    data: userProfile,
    isLoading: profileLoading,
    isFetched,
    error: profileError,
  } = useGetCallerUserProfile();
  const { data: userRole } = useGetCallerUserRole();
  const { mutate: saveProfile } = useSaveCallerUserProfile();

  const [showMigration, setShowMigration] = useState(false);

  const isAuthenticated = !!identity;

  const showProfileSetup =
    isAuthenticated && !profileLoading && isFetched && userProfile === null && !profileError;

  useEffect(() => {
    if (isAuthenticated && userProfile && !profileLoading) {
      const legacyKeys = ["jobs", "expenses", "quotes", "invoices", "funds", "goals"];
      const hasLocalData = legacyKeys.some((key) => {
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
      if (hasLocalData) setShowMigration(true);
    }
  }, [isAuthenticated, userProfile, profileLoading]);

  const handleLogout = async () => {
    await clear();
    qc.clear();
  };

  const handleProfileSetup = (name: string, email: string, role: UserRole) => {
    saveProfile({ name, email, role });
  };

  const handleMigrationComplete = () => {
    setShowMigration(false);
    qc.invalidateQueries();
  };

  const handleRetry = () => {
    qc.clear();
    window.location.reload();
  };

  // Still determining auth state
  if (isInitializing) {
    return <LoadingScreen message="Initializing..." />;
  }

  // Not logged in
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // Actor is being created
  if (actorFetching) {
    return <LoadingScreen message="Connecting to backend..." />;
  }

  // Actor failed to initialize
  if (!actor) {
    return <ConnectionErrorScreen onRetry={handleRetry} />;
  }

  // Profile is loading after actor is ready
  if (profileLoading) {
    return <LoadingScreen message="Loading your dashboard..." />;
  }

  // Profile query errored (backend unreachable)
  if (profileError && !profileLoading) {
    return <ConnectionErrorScreen onRetry={handleRetry} />;
  }

  // Provide a safe default for userRole if still loading
  const resolvedRole: UserRole = userRole ?? UserRole.user;

  return (
    <>
      <Suspense fallback={<LoadingScreen message="Loading dashboard..." />}>
        <Dashboard
          onLogout={handleLogout}
          userProfile={userProfile ?? null}
          userRole={resolvedRole}
        />
      </Suspense>
      {showProfileSetup && <ProfileSetupDialog onSave={handleProfileSetup} />}
      {showMigration && <DataMigrationHandler onMigrationComplete={handleMigrationComplete} />}
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryClientProvider client={queryClient}>
        <AppInner />
        <Toaster richColors position="top-right" />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
