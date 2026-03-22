# Client Appointment Management

## Current State
McDerma Clinic Management System PWA with appointment scheduling, patient/lead management, prescriptions, staff attendance, and admin controls. Settings tab exists with Profile, Export, WhatsApp Templates, Attendance, Admin sections.

## Requested Changes (Diff)

### Add
- Privacy Policy page accessible from Settings tab under Profile section
- Privacy Policy covers: data collected (names, mobile numbers, appointments, prescriptions), how data is stored securely on Internet Computer, data not shared with third parties, contact information

### Modify
- App name updated to "Client Appointment Management" throughout the UI (header, PWA manifest, page title)

### Remove
- Nothing removed

## Implementation Plan
1. Add a Privacy Policy route/section inside the Settings tab (below Share App button in Profile section)
2. Privacy Policy page content: app name, data collected, storage/security, no third-party sharing, contact info, last updated date
3. Update app name from "McDerma Clinic" to "Client Appointment Management" in header, manifest, and page title
