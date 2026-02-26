import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';
import { useSaveUserPreferences, useGetUserPreferences } from '@/hooks/useQueries';

interface UserPreferencesDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function UserPreferencesDialog({ open, onClose }: UserPreferencesDialogProps) {
  const { theme, setTheme } = useTheme();
  const { data: preferences } = useGetUserPreferences();
  const { mutate: savePreferences, isPending } = useSaveUserPreferences();

  const [darkMode, setDarkMode] = useState(false);
  const [preferredLayout, setPreferredLayout] = useState('default');
  const [metricFilters, setMetricFilters] = useState<string[]>([]);

  useEffect(() => {
    if (preferences) {
      setDarkMode(preferences.darkMode);
      setPreferredLayout(preferences.preferredLayout);
      setMetricFilters(preferences.metricFilters);
    } else {
      setDarkMode(theme === 'dark');
    }
  }, [preferences, theme]);

  const handleSave = () => {
    const newPreferences = {
      darkMode,
      preferredLayout,
      metricFilters,
      displayPreferences: JSON.stringify({ theme: darkMode ? 'dark' : 'light' }),
      navigationPreferences: JSON.stringify({ layout: preferredLayout }),
    };

    savePreferences(newPreferences, {
      onSuccess: () => {
        setTheme(darkMode ? 'dark' : 'light');
        toast.success('Preferences saved successfully');
        onClose();
      },
      onError: (error) => {
        toast.error('Failed to save preferences', {
          description: error instanceof Error ? error.message : 'Unknown error',
        });
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>User Preferences</DialogTitle>
          <DialogDescription>
            Customize your dashboard experience. Your preferences are saved on-chain.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Dark Mode Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="dark-mode">Dark Mode</Label>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Enable dark theme for the dashboard
              </p>
            </div>
            <Switch
              id="dark-mode"
              checked={darkMode}
              onCheckedChange={setDarkMode}
            />
          </div>

          {/* Preferred Layout */}
          <div className="space-y-2">
            <Label htmlFor="layout">Preferred Dashboard Layout</Label>
            <Select value={preferredLayout} onValueChange={setPreferredLayout}>
              <SelectTrigger id="layout">
                <SelectValue placeholder="Select layout" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default</SelectItem>
                <SelectItem value="compact">Compact</SelectItem>
                <SelectItem value="expanded">Expanded</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Metric Filters */}
          <div className="space-y-2">
            <Label>Metric Filters</Label>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Select which metrics to display on your dashboard
            </p>
            <div className="space-y-2 mt-2">
              {['revenue', 'expenses', 'profit', 'jobs', 'funds'].map((metric) => (
                <div key={metric} className="flex items-center space-x-2">
                  <Switch
                    id={metric}
                    checked={metricFilters.includes(metric)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setMetricFilters([...metricFilters, metric]);
                      } else {
                        setMetricFilters(metricFilters.filter(m => m !== metric));
                      }
                    }}
                  />
                  <Label htmlFor={metric} className="capitalize cursor-pointer">
                    {metric}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isPending}>
            {isPending ? 'Saving...' : 'Save Preferences'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
