# Appointment ID-Based Operations - QA Regression Test

## Purpose
This test plan verifies that appointment edit and delete operations correctly target the intended appointment using stable IDs, regardless of list ordering or duplicate patient names.

## Prerequisites
- Application deployed and accessible
- User logged in with Internet Identity
- Ability to create multiple appointments

## Test Scenarios

### Scenario 1: Delete from Today's List
**Steps:**
1. Create 3 appointments for today with different times (e.g., 9:00 AM, 11:00 AM, 2:00 PM)
2. Use different patient names (e.g., "Alice", "Bob", "Charlie")
3. Navigate to Schedule tab → Today's Schedule
4. Click delete on the middle appointment (Bob at 11:00 AM)
5. Confirm deletion in the alert dialog

**Expected Result:**
- Only Bob's 11:00 AM appointment is deleted
- Alice's 9:00 AM and Charlie's 2:00 PM appointments remain unchanged
- List shows 2 appointments in correct chronological order

### Scenario 2: Delete from Tomorrow's List
**Steps:**
1. Create 3 appointments for tomorrow with different times
2. Navigate to Schedule tab → Tomorrow section
3. Click delete on the first appointment
4. Confirm deletion

**Expected Result:**
- Only the first appointment is deleted
- Other two appointments remain in correct order

### Scenario 3: Delete from Upcoming List
**Steps:**
1. Create 3 appointments for 3 days from now
2. Navigate to Schedule tab → Upcoming section
3. Click delete on the last appointment in the horizontal scroll
4. Confirm deletion

**Expected Result:**
- Only the last appointment is deleted
- First two appointments remain unchanged

### Scenario 4: Edit from Today's List
**Steps:**
1. Create 3 appointments for today
2. Click edit on the second appointment
3. Change the patient name to "Updated Name"
4. Save the appointment

**Expected Result:**
- Only the second appointment's name is updated to "Updated Name"
- First and third appointments remain unchanged
- All appointments maintain their original times

### Scenario 5: Duplicate Patient Names - Delete
**Steps:**
1. Create 3 appointments for today:
   - 9:00 AM - Rohan - Mobile: 1111111111
   - 11:00 AM - Rohan - Mobile: 2222222222
   - 2:00 PM - Rohan - Mobile: 3333333333
2. Click delete on the middle appointment (11:00 AM, mobile 2222222222)
3. Confirm deletion

**Expected Result:**
- Only the 11:00 AM appointment with mobile 2222222222 is deleted
- 9:00 AM appointment (mobile 1111111111) remains
- 2:00 PM appointment (mobile 3333333333) remains
- Both remaining appointments still show "Rohan" as patient name

### Scenario 6: Duplicate Patient Names - Edit
**Steps:**
1. Create 2 appointments for today with same name "Rohan" but different times and mobiles
2. Click edit on the first appointment
3. Change the mobile number
4. Save

**Expected Result:**
- Only the first appointment's mobile number is updated
- Second appointment remains unchanged with original mobile number

### Scenario 7: Same Day Different Times
**Steps:**
1. Create 5 appointments for today at: 8:00 AM, 9:30 AM, 11:00 AM, 1:00 PM, 4:00 PM
2. Delete the 11:00 AM appointment
3. Verify remaining appointments
4. Edit the 1:00 PM appointment to change time to 12:00 PM
5. Verify the list re-sorts correctly

**Expected Result:**
- After deletion: 4 appointments remain (8:00 AM, 9:30 AM, 1:00 PM, 4:00 PM)
- After edit: The edited appointment shows at 12:00 PM
- List maintains chronological order: 8:00 AM, 9:30 AM, 12:00 PM, 4:00 PM

### Scenario 8: Cross-List Operations
**Steps:**
1. Create 2 appointments for today, 2 for tomorrow, 2 for upcoming
2. Delete one from each list
3. Edit one from each remaining list

**Expected Result:**
- Each delete operation removes only the clicked appointment
- Each edit operation updates only the clicked appointment
- No cross-contamination between Today/Tomorrow/Upcoming lists

## Pass Criteria
- All scenarios pass without any incorrect appointment being deleted or edited
- React list keys use stable appointment IDs (verify in browser DevTools)
- No console errors related to duplicate keys or missing IDs
- UI updates immediately after operations without requiring manual refresh

## Notes
- Test with both mobile and desktop viewports
- Verify that appointment IDs are stable across page refreshes
- Check that migrated appointments (created before ID system) also work correctly
