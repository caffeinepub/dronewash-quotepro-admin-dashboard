import React, { useState } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAddGoal } from '@/hooks/useQueries';

interface AddGoalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultMonth?: string;
  defaultYear?: number;
}

export default function AddGoalDialog({
  open,
  onOpenChange,
  defaultMonth,
  defaultYear,
}: AddGoalDialogProps) {
  const currentDate = new Date();
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const [description, setDescription] = useState('');
  const [targetMetrics, setTargetMetrics] = useState('');
  const [targetValue, setTargetValue] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [milestoneTracking, setMilestoneTracking] = useState('');
  const [month, setMonth] = useState(defaultMonth || months[currentDate.getMonth()]);
  const [year, setYear] = useState(defaultYear || currentDate.getFullYear());

  const addGoal = useAddGoal();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!description.trim()) {
      toast.error('Please enter a goal description.');
      return;
    }

    const parsedTargetValue = parseFloat(targetValue);
    if (isNaN(parsedTargetValue) || parsedTargetValue < 0) {
      toast.error('Please enter a valid target value.');
      return;
    }

    // Encode extra fields into description for storage
    const fullDescription = [
      description.trim(),
      targetMetrics ? `[Metrics: ${targetMetrics.trim()}]` : '',
      targetDate ? `[Target Date: ${targetDate}]` : '',
      milestoneTracking ? `[Milestones: ${milestoneTracking.trim()}]` : '',
    ]
      .filter(Boolean)
      .join(' ');

    try {
      await addGoal.mutateAsync({
        month,
        year, // pass as number; the hook converts to BigInt internally
        description: fullDescription,
        targetValue: parsedTargetValue,
      });
      toast.success('Goal added successfully.');
      onOpenChange(false);
      setDescription('');
      setTargetMetrics('');
      setTargetValue('');
      setTargetDate('');
      setMilestoneTracking('');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to add goal';
      toast.error(message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Goal</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="month">Month</Label>
              <select
                id="month"
                className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
              >
                {months.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="year">Year</Label>
              <Input
                id="year"
                type="number"
                min="2020"
                max="2030"
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Goal Description *</Label>
            <Textarea
              id="description"
              placeholder="Describe the goal..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="targetMetrics">Target Metrics</Label>
            <Input
              id="targetMetrics"
              placeholder="e.g. Revenue, Jobs completed..."
              value={targetMetrics}
              onChange={(e) => setTargetMetrics(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="targetValue">Target Value (€)</Label>
            <Input
              id="targetValue"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={targetValue}
              onChange={(e) => setTargetValue(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="targetDate">Target Date</Label>
            <Input
              id="targetDate"
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="milestoneTracking">Milestone Tracking</Label>
            <Textarea
              id="milestoneTracking"
              placeholder="Describe milestones..."
              value={milestoneTracking}
              onChange={(e) => setMilestoneTracking(e.target.value)}
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={addGoal.isPending}>
              {addGoal.isPending ? 'Adding...' : 'Add Goal'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
