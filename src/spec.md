# Specification

## Summary
**Goal:** Add a lead status dropdown on each Lead card and make Lead cards more compact in the Leads tab.

**Planned changes:**
- Add a lead status dropdown to each Lead card, positioned on the right side below the existing rating display, with options: "Ringing", "will call and come", "follow up date given".
- Store the selected lead status in the backend Lead model, return it via the existing getLeads query, and update it through a backend update operation (including migration/defaulting for existing leads).
- Update the Leads UI to persist status changes (update locally immediately, then persist; refetch/invalidate leads cache after success).
- Reduce Lead card vertical height by ~20–30% by tightening spacing/padding while keeping all existing fields and actions (Call, WhatsApp, Edit, Delete) readable and tappable on mobile.

**User-visible outcome:** In the Leads tab, each lead shows a status dropdown under the rating; changing it updates instantly and remains saved after reload/sync, and lead cards take up noticeably less vertical space without losing information or usability.
