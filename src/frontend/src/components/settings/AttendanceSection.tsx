import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useGetTodaysAttendance } from '../../hooks/useQueries';
import { Clock, Users } from 'lucide-react';

export default function AttendanceSection() {
  const { data: todaysAttendance = [], isLoading } = useGetTodaysAttendance();

  const formatTime = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) / 1000000);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Today's Attendance
        </CardTitle>
        <CardDescription>Staff members who have registered attendance today</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading attendance...</div>
        ) : todaysAttendance.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No attendance records for today
          </div>
        ) : (
          <div className="space-y-3">
            {todaysAttendance.map((record, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex-1">
                  <p className="font-medium">{record.name}</p>
                  <p className="text-sm text-muted-foreground">{record.role}</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{formatTime(record.timestamp)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
