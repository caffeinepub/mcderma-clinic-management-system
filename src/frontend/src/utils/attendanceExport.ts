interface AttendanceRecord {
  name: string;
  role: string;
  timestamp: bigint;
}

interface MonthData {
  absentDates: number[];
  presentDays: number;
  absentDays: number;
}

interface StaffYearData {
  months: Record<number, MonthData>;
}

export function exportAttendanceData(
  attendanceRecords: AttendanceRecord[]
): Record<string, StaffYearData> {
  const currentYear = new Date().getFullYear();
  const result: Record<string, StaffYearData> = {};

  // Group records by staff name
  const recordsByStaff: Record<string, AttendanceRecord[]> = {};
  attendanceRecords.forEach((record) => {
    if (!recordsByStaff[record.name]) {
      recordsByStaff[record.name] = [];
    }
    recordsByStaff[record.name].push(record);
  });

  // Process each staff member
  Object.entries(recordsByStaff).forEach(([staffName, records]) => {
    const yearData: StaffYearData = { months: {} };

    // Filter records for current year
    const currentYearRecords = records.filter((record) => {
      const date = new Date(Number(record.timestamp) / 1000000);
      return date.getFullYear() === currentYear;
    });

    // Group by month
    const recordsByMonth: Record<number, Set<number>> = {};
    currentYearRecords.forEach((record) => {
      const date = new Date(Number(record.timestamp) / 1000000);
      const month = date.getMonth();
      const day = date.getDate();

      if (!recordsByMonth[month]) {
        recordsByMonth[month] = new Set();
      }
      recordsByMonth[month].add(day);
    });

    // Calculate absent dates and counts for each month
    for (let month = 0; month < 12; month++) {
      const daysInMonth = new Date(currentYear, month + 1, 0).getDate();
      const presentDays = recordsByMonth[month] || new Set();
      const absentDates: number[] = [];

      for (let day = 1; day <= daysInMonth; day++) {
        if (!presentDays.has(day)) {
          absentDates.push(day);
        }
      }

      yearData.months[month] = {
        absentDates,
        presentDays: presentDays.size,
        absentDays: absentDates.length,
      };
    }

    result[staffName] = yearData;
  });

  return result;
}
