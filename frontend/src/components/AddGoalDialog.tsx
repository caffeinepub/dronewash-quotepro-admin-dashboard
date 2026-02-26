import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAddGoal } from '@/hooks/useQueries';
import { toast } from 'sonner';

interface AddGoalDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function AddGoalDialog({ open, onClose }: AddGoalDialogProps) {
  const [description, setDescription] = useState('');
  const [targetMetrics, setTargetMetrics] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [milestoneTracking, setMilestoneTracking] = useState('');

  const { mutate: addGoal, isPending } = useAddGoal();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!description.trim()) {
      toast.error('Please enter a goal description');
      return;
    }

    if (!targetMetrics.trim()) {
      toast.error('Please enter target metrics');
      return;
    }

    if (!targetDate) {
      toast.error('Please select a target date');
      return;
    }

    const targetDateTimestamp = BigInt(new Date(targetDate).getTime() * 1000000);

    addGoal(
      {
        description: description.trim(),
        targetMetrics: targetMetrics.trim(),
        targetDate: targetDateTimestamp,
        milestoneTracking: milestoneTracking.trim() || 'No milestones defined',
      },
      {
        onSuccess: () => {
          toast.success('Goal added successfully');
          setDescription('');
          setTargetMetrics('');
          setTargetDate('');
          setMilestoneTracking('');
          onClose();
        },
        onError: (error) => {
          toast.error('Failed to add goal', {
            description: error instanceof Error ? error.message : 'Unknown error',
          });
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add New Goal</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">Goal Description *</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Achieve €50,000 in monthly revenue"
              rows={3}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="targetMetrics">Target Metrics *</Label>
            <Input
              id="targetMetrics"
              value={targetMetrics}
              onChange={(e) => setTargetMetrics(e.target.value)}
              placeholder="e.g., €50,000 revenue, 20 jobs completed"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="targetDate">Target Date *</Label>
            <Input
              id="targetDate"
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="milestoneTracking">Milestone Tracking</Label>
            <Textarea
              id="milestoneTracking"
              value={milestoneTracking}
              onChange={(e) => setMilestoneTracking(e.target.value)}
              placeholder="e.g., Week 1: 5 jobs, Week 2: 10 jobs, Week 3: 15 jobs, Week 4: 20 jobs"
              rows={3}
            />
          </div>

          <div className="rounded-md bg-blue-50 p-3 text-sm text-blue-900">
            <p className="font-medium">Note:</p>
            <p className="mt-1">
              Goals help track business objectives and milestones. Set clear, measurable targets to monitor progress effectively.
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending} className="bg-cyan-600 hover:bg-cyan-700">
              {isPending ? 'Adding...' : 'Add Goal'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
