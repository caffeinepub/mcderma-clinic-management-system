# Specification

## Summary
**Goal:** Add a collapsible left sidebar for authenticated users, enable staff login with attendance tracking, introduce admin password-protected role-based access controls, and provide editable WhatsApp message templates.

**Planned changes:**
- Add a collapsible/expandable left-side sidebar for the authenticated app layout that works on both desktop and mobile (overlay + dismiss on small screens) without breaking existing tab pages.
- Add sidebar top actions “Staff Login” and “Auto Attendance” that open a staff login/attendance dialog.
- Build the staff login dialog UI (Staff Name dropdown, auto-filled read-only Role, Login button) and show a confirmation message: `"<name> your attendance have been registered."`
- Add backend support to store/manage staff records (name + role) per clinic owner and APIs to list staff and resolve role by staff name.
- Record attendance entries (name, role, timestamp) on staff login; prevent uncontrolled duplicates for the same staff member on the same day.
- Add a Settings > Attendance section showing today’s attendance entries as a vertical list (name + timestamp).
- Extend Settings export dropdown to include “Attendance” and export current-year, month-wise summaries per staff member including absent date lists and present/absent totals.
- Add Settings > Admin section locked by a numeric password; on first use require setup plus recovery question/answer with the question “Which is your favorite colour”.
- Implement an Admin permissions matrix (rows: Role, Appointment tab, Patient tab, Lead tab, Settings, Full control; columns: staff names), persist it in backend, and enforce permissions in the UI after staff login (hide/disable unauthorized sections and prevent access).
- Add a staff-mode “Log out” button at the bottom of the sidebar without changing existing Internet Identity logout flows.
- Add Settings editor for WhatsApp templates (at least “Appointment reminder” and “After appointment feedback”), persist in backend, and update WhatsApp sending to use stored templates instead of hardcoded strings where applicable.
- Update backend stable storage and migration so existing stored data remains intact while safely initializing new fields for existing users.

**User-visible outcome:** Authenticated users get a collapsible left sidebar with staff login/auto-attendance, staff attendance is recorded and visible in Settings (and exportable), admins can lock/unlock an Admin area to configure per-staff access to app sections, staff see only what they’re permitted to access, and WhatsApp message templates can be edited and reused.
