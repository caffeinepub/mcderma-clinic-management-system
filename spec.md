# Specification

## Summary
**Goal:** Add a doctor assignment dropdown to Today's Schedule appointment cards, fix the Next Appointment widget to only show today's appointments, increase the appointment date picker calendar size by 30%, and add "Staff" as a role option in the Admin tab.

**Planned changes:**
- Add a doctor assignment dropdown in the bottom-right area of each appointment card in Today's Schedule; the dropdown lists only staff members with the role "Doctor" and persists the selection to the backend.
- Fix the Next Appointment widget on the Schedule tab to only consider today's appointments, showing the next upcoming appointment by time or displaying "No Appointment For Today" if the list is empty.
- Increase the calendar size in the appointment date picker (AppointmentDialog) by 30% using explicit CSS overrides targeting rdp/react-day-picker classes, with adequate spacing between date cells.
- Add "Staff" as a selectable option in the Role dropdown in the Admin tab's staff management form.

**User-visible outcome:** Clinic staff can assign a doctor directly from each today's appointment card, the Next Appointment widget accurately reflects only today's schedule, the date picker calendar is larger and easier to read, and "Staff" is available as a role when adding or editing staff members.
