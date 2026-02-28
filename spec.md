# Specification

## Summary
**Goal:** Update the Next Appointment widget to only show appointments from today's list, never from tomorrow's or upcoming sections.

**Planned changes:**
- Modify `NextAppointmentWidget` to filter and evaluate only today's appointments when finding the next upcoming appointment.
- If today has no appointments (or all have passed), display "No Appointment For Today" instead of pulling from future sections.
- Apply the same today-only logic in `WidgetView.tsx` if it also renders next-appointment data.

**User-visible outcome:** The Next Appointment widget will only display upcoming appointments from today. If there are no remaining appointments today, it shows "No Appointment For Today" rather than pulling in tomorrow's or upcoming appointments.
