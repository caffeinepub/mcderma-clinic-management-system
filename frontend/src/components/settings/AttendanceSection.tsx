import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useGetAllAttendance } from '../../hooks/useQueries';
import { formatTimestamp12Hour } from '../../lib/utils';
import { exportAttendanceData } from '../../utils/attendanceExport';
import { ClipboardCheck } from 'lucide-react';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function AttendanceSection() {
  const { data: attendance = [] } = useGetAllAttendance();
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  
  // Sort attendance by timestamp (most recent first)
  const sortedAttendance = [...attendance].sort((a, b) => {
    return Number(b.timestamp) - Number(a.timestamp);
  });

  // Get today's attendance
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTimestamp = BigInt(today.getTime() * 1000000);
  
  const todayAttendance = sortedAttendance.filter(record => {
    const recordDate = new Date(Number(record.timestamp) / 1000000);
    recordDate.setHours(0, 0, 0, 0);
    return recordDate.getTime() === today.getTime();
  });

  // Process monthly attendance data
  const monthlyData = exportAttendanceData(attendance);

  return (
    <div className="space-y-6">
      {/* Today's Attendance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5" />
            Today's Attendance
          </CardTitle>
          <CardDescription>
            Staff members who checked in today
          </CardDescription>
        </CardHeader>
        <CardContent>
          {todayAttendance.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No attendance records for today</p>
            </div>
          ) : (
            <div className="space-y-3">
              {todayAttendance.map((record, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-border"
                >
                  <div>
                    <div className="font-medium">{record.name}</div>
                    <div className="text-sm text-muted-foreground">{record.role}</div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatTimestamp12Hour(record.timestamp)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Monthly Attendance Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Attendance Summary</CardTitle>
          <CardDescription>
            Present/Absent days and absent dates for each staff member
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Select Month:</label>
            <Select
              value={selectedMonth.toString()}
              onValueChange={(value) => setSelectedMonth(parseInt(value))}
            >
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((month, index) => (
                  <SelectItem key={index} value={index.toString()}>
                    {month} {new Date().getFullYear()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {Object.keys(monthlyData).length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No attendance data available</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium">Staff Name</th>
                    <th className="text-center p-3 font-medium">Total P</th>
                    <th className="text-center p-3 font-medium">Total A</th>
                    <th className="text-left p-3 font-medium">Absent Dates</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(monthlyData).map(([staffName, yearData], index) => {
                    const monthData = yearData.months[selectedMonth];
                    if (!monthData) return null;

                    return (
                      <tr
                        key={staffName}
                        className={`border-b hover:bg-muted/50 transition-colors ${
                          index % 2 === 0 ? 'bg-muted/20' : ''
                        }`}
                      >
                        <td className="p-3 font-medium">{staffName}</td>
                        <td className="p-3 text-center text-green-600 font-medium">
                          {monthData.presentDays}
                        </td>
                        <td className="p-3 text-center text-red-600 font-medium">
                          {monthData.absentDays}
                        </td>
                        <td className="p-3 text-sm text-muted-foreground">
                          {monthData.absentDates.length === 0
                            ? 'None'
                            : monthData.absentDates
                                .slice(0, 10)
                                .map(d => d.toString().padStart(2, '0'))
                                .join(', ') +
                              (monthData.absentDates.length > 10
                                ? ` +${monthData.absentDates.length - 10} more`
                                : '')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
