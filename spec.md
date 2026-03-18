# McDerma Clinic Management System

## Current State
Full-featured clinic PWA with appointment scheduling, patient/lead management, staff attendance, role-based access, prescriptions, WhatsApp integration, and analytics. Mobile number inputs are plain text fields with no country code prefix.

## Requested Changes (Diff)

### Add
- +91 country code prefix shown as a fixed visual tab before all mobile number input fields (AppointmentDialog, PatientDialog, LeadDialog, ContactImportReviewDialog if applicable)

### Modify
- Mobile number input layout: wrap in flex container with "+91" as a styled fixed prefix span and the input field beside it
- Fix "fail to save entry" error: improve error handling, ensure actor availability checks, add specific error messages to help diagnose failures. Also check that all mutations properly handle the actor state.

### Remove
- Nothing removed

## Implementation Plan
1. Update AppointmentDialog.tsx: change mobile input to show +91 prefix (fixed span + input side by side)
2. Update PatientDialog.tsx: same change for mobile input
3. Update LeadDialog.tsx: same change for mobile input
4. Add better error handling in mutations - log actual errors, not just generic messages
5. Ensure actor availability before each mutation
