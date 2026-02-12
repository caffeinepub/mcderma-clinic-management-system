# Specification

## Summary
**Goal:** Remove the Settings entry point for opening the widget view and standardize all user-facing date displays to DD/MM/YY.

**Planned changes:**
- Remove the Settings UI action/button that opens the widget view (e.g., “Open Widget View”) so it no longer renders or can be tapped.
- Delete the now-unused click handler and related imports used only for the open-widget Settings action.
- Update all user-facing date formatting across the app so the date portion is displayed as DD/MM/YY (including date-only and date+time strings), while keeping existing 12-hour time formatting with AM/PM where applicable.

**User-visible outcome:** Users will no longer see an “Open Widget View” button in Settings, and dates throughout the app will display in DD/MM/YY format.
