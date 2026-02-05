# Specification

## Summary
**Goal:** Clean up the Schedule appointment card layout, remove the barcode/QR scanner action, and make phonebook import clearer by allowing review/edit and normalizing imported phone numbers.

**Planned changes:**
- Update appointment cards in Schedule (Today, Tomorrow, and Upcoming) to a consistent 3-row layout: (1) time + patient name on one line, (2) all action buttons moved into a dedicated row below, (3) mobile number displayed below the action row.
- Ensure action buttons wrap gracefully on small screens without overlapping or breaking the card layout.
- Remove the barcode/QR/scanner icon action from appointment entries everywhere it appears in the Schedule tab UI.
- Improve “Add from phonebook” flow in Appointment, Patient, and Lead dialogs by adding an in-app confirmation step showing name and mobile as editable fields with Cancel/Use actions.
- Normalize imported phone numbers to remove spaces before applying them to forms, consistently across Appointment/Patient/Lead contact imports, with English user-facing text.

**User-visible outcome:** Appointment cards look cleaner and consistent, the barcode/QR action is no longer shown, and importing a contact from the phonebook lets users review/edit details before filling the form with a space-free mobile number.
