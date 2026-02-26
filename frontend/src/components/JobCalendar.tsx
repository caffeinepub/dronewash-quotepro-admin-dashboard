import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAllJobs } from '@/hooks/useQueries';
import JobDetailsDialog from './JobDetailsDialog';
import type { Job } from '../backend';

export default function JobCalendar() {
  const { data: jobs, isLoading } = useAllJobs();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const getJobsForDate = (date: Date): Job[] => {
    if (!jobs) return [];
    
    return jobs.filter((job) => {
      const jobDate = new Date(Number(job.date) / 1000000);
      return (
        jobDate.getDate() === date.getDate() &&
        jobDate.getMonth() === date.getMonth() &&
        jobDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentDate);
  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Create array of days including empty slots for alignment
  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  if (isLoading) {
    return (
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-slate-900">Job Calendar</h2>
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-slate-500">Loading calendar...</div>
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-bold text-slate-900">Job Calendar</h2>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-cyan-600" />
              {monthName}
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={previousMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={nextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {/* Week day headers */}
            {weekDays.map((day) => (
              <div key={day} className="text-center font-semibold text-sm text-slate-600 py-2">
                {day}
              </div>
            ))}

            {/* Calendar days */}
            {calendarDays.map((day, index) => {
              if (day === null) {
                return <div key={`empty-${index}`} className="aspect-square" />;
              }

              const date = new Date(year, month, day);
              const dayJobs = getJobsForDate(date);
              const isToday =
                date.getDate() === new Date().getDate() &&
                date.getMonth() === new Date().getMonth() &&
                date.getFullYear() === new Date().getFullYear();

              return (
                <div
                  key={day}
                  className={`aspect-square border rounded-lg p-2 ${
                    isToday ? 'border-cyan-600 bg-cyan-50' : 'border-slate-200'
                  } ${dayJobs.length > 0 ? 'bg-slate-50' : ''}`}
                >
                  <div className="text-sm font-medium text-slate-900 mb-1">{day}</div>
                  {dayJobs.length > 0 && (
                    <div className="space-y-1">
                      {dayJobs.slice(0, 2).map((job) => (
                        <button
                          key={Number(job.id)}
                          onClick={() => setSelectedJob(job)}
                          className="w-full text-xs bg-cyan-100 text-cyan-800 rounded px-1 py-0.5 truncate hover:bg-cyan-200 transition-colors text-left"
                          title={`${job.clientName || 'No client'} - ${job.sector}`}
                        >
                          {job.clientName || 'No client'}
                        </button>
                      ))}
                      {dayJobs.length > 2 && (
                        <button
                          onClick={() => setSelectedJob(dayJobs[2])}
                          className="text-xs text-slate-500 hover:text-slate-700"
                        >
                          +{dayJobs.length - 2} more
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-4 flex items-center gap-4 text-sm text-slate-600">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-cyan-600 rounded"></div>
              <span>Today</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-slate-50 border border-slate-200 rounded"></div>
              <span>Has Jobs</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Job Details Dialog */}
      {selectedJob && <JobDetailsDialog job={selectedJob} onClose={() => setSelectedJob(null)} />}
    </section>
  );
}
