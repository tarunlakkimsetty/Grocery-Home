# Price Filter Feature - Testing Guide

**Server Status**: ✅ Running on http://localhost:3002
**Build Status**: ✅ Compiled successfully (0 errors)

---

## 🎯 Quick Start Testing

### Browser Setup
1. **URL**: Open http://localhost:3002
2. **Dev Tools**: Press F12 to enable console monitoring
3. **Network Tab**: Click "Network" tab to verify requests
4. **Device Mode**: Press Ctrl+Shift+M to test mobile view

---

## 📋 Manual Test Cases

### TEST 1: Basic Price Range Filtering
**Objective**: Verify price slider filters products correctly

**Steps**:
1. Navigate to "Products" page
2. Scroll to find the "🏷️ Price Filter" component
3. Observe the current min/max range displayed
4. Drag the minimum price slider to the right (increase minimum)
5. Observe that products below that price disappear
6. Drag the maximum price slider to the left (decrease maximum)
7. Observe that products above that price disappear
8. Count the displayed products

**Expected Results**:
- ✅ Only products with effective price within range are shown
- ✅ Product count updates: "X products found in this price range"
- ✅ All visible products fall within the selected range
- ✅ Filtering happens instantly as slider moves
- ✅ No console errors or warnings

**Pass/Fail**: ___________

---

### TEST 2: Discounted Products Filter Correctly
**Objective**: Verify that discounted prices are used for filtering, not original prices

**Steps**:
1. Find a product with a discount (shows "XX% OFF" badge)
2. Note the discounted price (showing "💰 Save ₹X" text)
3. Set the price filter to a range that includes the DISCOUNTED price but NOT the original price
   - Example: If original ₹500, discounted ₹350, set filter to ₹300–₹400
4. Verify the discounted product appears
5. Now set the range to above the original price but below discounted
   - Example: ₹400–₹500
6. Verify the same discounted product does NOT appear

**Expected Results**:
- ✅ Product shows in TEST when filter includes discounted price
- ✅ Product hides when filter doesn't include discounted price
- ✅ Original price is NOT used for filtering
- ✅ Product details show both original and discounted prices
- ✅ "Save" amount is calculated correctly

**Pass/Fail**: ___________

---

### TEST 3: Combine Price Filter with Category Selection
**Objective**: Verify price filter works together with category selection

**Steps**:
1. Click on a product category (e.g., "Oils", "Spices", "Vegetables")
2. Observe the price range updates to show min/max for that category
3. Adjust the price slider to a specific range within that category
4. Observe that only products in that category AND price range appear
5. Change to a different category
6. Observe the price range updates for the new category
7. Adjust price slider again
8. Verify only the new category's products in the price range appear

**Expected Results**:
- ✅ Price range updates when category changes
- ✅ Both category AND price filters apply simultaneously
- ✅ Product count shows filtered results
- ✅ Category changes don't reset the price slider automatically
- ✅ Switching categories updates available price range

**Pass/Fail**: ___________

---

### TEST 4: Combine Price Filter with Search
**Objective**: Verify price filter works with search text

**Steps**:
1. Type a search term in the search box (e.g., "oil", "rice", "wheat")
2. Observe products matching search appear
3. Adjust the price filter to a specific range
4. Verify only products matching BOTH search AND price range appear
5. Try different search terms and price ranges
6. Verify results update correctly

**Expected Results**:
- ✅ Search + Price filter work together
- ✅ Products must match both filters
- ✅ Product count updates correctly
- ✅ Results are accurate
- ✅ No duplicate products shown

**Pass/Fail**: ___________

---

### TEST 5: Combine All Three Filters
**Objective**: Verify category + search + price filter work together

**Steps**:
1. Select a category (e.g., "Oils")
2. Type a search term (e.g., "coconut")
3. Adjust the price filter (e.g., ₹100–₹200)
4. Observe that all three filters apply simultaneously
5. Change the category to a different one
6. Verify search and price filter still apply to new category
7. Clear the search term
8. Verify category and price filter still work

**Expected Results**:
- ✅ All three filters apply at the same time
- ✅ Changing one filter updates results based on all filters
- ✅ Product count shows final filtered results
- ✅ No console errors
- ✅ Results are accurate

**Pass/Fail**: ___________

---

### TEST 6: Reset Button
**Objective**: Verify reset button restores full price range

**Steps**:
1. Set price filter to a narrow range (e.g., ₹100–₹150)
2. Observe limited products shown
3. Click the "↻ Reset" button next to price range display
4. Observe that price range expands back to full available range
5. Verify all products in category appear again
6. Repeat with different filters

**Expected Results**:
- ✅ Reset button is visible and clickable
- ✅ Price range expands to minimum and maximum available
- ✅ All products reappear
- ✅ Search term and category selection are NOT reset
- ✅ Product count increases to show all products

**Pass/Fail**: ___________

---

### TEST 7: Slider Drag Interaction
**Objective**: Verify smooth slider dragging and real-time updates

**Steps**:
1. Click and hold the minimum price slider handle (left side)
2. Drag it slowly to the right while watching products update
3. Release the mouse
4. Repeat for the maximum price slider handle (right side)
5. Try double-clicking on a slider to edit
6. Try dragging both sliders to create a very narrow range

**Expected Results**:
- ✅ Sliders drag smoothly
- ✅ Products filter in real-time as you drag
- ✅ No lag or stuttering
- ✅ Handle cursor changes to indicate draggable area
- ✅ Range text updates as you drag

**Pass/Fail**: ___________

---

### TEST 8: Direct Number Input
**Objective**: Verify typing prices directly into input fields

**Steps**:
1. Click the "From ₹" input field (minimum price)
2. Clear the existing value and type a new number (e.g., "150")
3. Press Enter or Tab
4. Observe products update based on new minimum
5. Repeat for the "To ₹" input field (maximum price)
6. Try typing invalid values (negative numbers, very large numbers, letters)
7. Verify error handling (should reject invalid input or auto-correct)

**Expected Results**:
- ✅ Input field accepts numeric values
- ✅ Products filter when you press Enter
- ✅ Invalid input is handled gracefully
- ✅ New values don't exceed available range
- ✅ Slider updates to match new input values
- ✅ Product count updates correctly

**Pass/Fail**: ___________

---

### TEST 9: No Results Empty State
**Objective**: Verify appropriate messaging when filter matches no products

**Steps**:
1. Set price range to an extremely high value (e.g., ₹50000–₹100000)
2. Observe that no products appear
3. Verify an empty state message is shown
4. Try a different extreme range (e.g., ₹1–₹5)
5. Verify empty state message appears again
6. Try a combination that yields no results (specific category + specific search + specific price)
7. Click "Reset" button to restore products

**Expected Results**:
- ✅ Empty state message displays
- ✅ Helpful text suggesting to adjust filter appears
- ✅ Products reappear when reset is clicked
- ✅ No console errors
- ✅ Reset button works from empty state

**Pass/Fail**: ___________

---

### TEST 10: Mobile Responsiveness
**Objective**: Verify price filter works on mobile/tablet sizes

**Steps**:
1. Press Ctrl+Shift+M to toggle device toolbar (DevTools)
2. Select "iPhone 12" or similar mobile device
3. Scroll to price filter component
4. Verify slider is visible and usable on small screen
5. Try dragging slider handles on mobile view
6. Try typing in input fields on mobile
7. Verify product grid is responsive below filter
8. Test on tablet size (iPad)
9. Test on desktop (reset to normal view)

**Expected Results**:
- ✅ Price filter displays correctly on mobile
- ✅ Slider handles are touch-friendly (large enough)
- ✅ Input fields are accessible on mobile
- ✅ Text is readable and not cut off
- ✅ Product grid wraps correctly
- ✅ No horizontal scrolling required
- ✅ Works on all screen sizes

**Pass/Fail**: ___________

---

### TEST 11: Category Switch Updates Range
**Objective**: Verify price range updates when switching categories

**Steps**:
1. Navigate to "Vegetables" category
2. Note the price range (e.g., ₹10–₹50)
3. Note the product count
4. Navigate to "Oils" category
5. Observe the price range changes to ₹100–₹500 (example)
6. Observe new product count
7. Try multiple categories to see different ranges

**Expected Results**:
- ✅ Price range updates for each category
- ✅ Minimum price matches category's cheapest product
- ✅ Maximum price matches category's most expensive product
- ✅ Product count reflects category products
- ✅ Filter resets to full range for new category
- ✅ No console errors

**Pass/Fail**: ___________

---

### TEST 12: Browser Console Check
**Objective**: Verify no errors or warnings in console

**Steps**:
1. Press F12 to open DevTools
2. Click "Console" tab
3. Perform several filter operations (drag slider, search, change category)
4. Observe console output
5. Look for any red error messages or yellow warnings

**Expected Results**:
- ✅ No red error messages
- ✅ No yellow warnings related to filtering
- ✅ No "undefined" messages
- ✅ No failed API calls
- ✅ Pre-existing warnings are acceptable (if any)

**Pass/Fail**: ___________

---

### TEST 13: Network Requests Check
**Objective**: Verify no unnecessary network requests

**Steps**:
1. Press F12 to open DevTools
2. Click "Network" tab
3. Set "All" or "XHR" filter to show requests
4. Drag the price slider several times
5. Type in search box
6. Change category

**Expected Results**:
- ✅ No new network requests when dragging slider
- ✅ Only API call is initial product fetch
- ✅ Search and category changes may cause API calls (expected)
- ✅ Price filtering is client-side (no API calls)
- ✅ No failed requests (HTTP 404, 500, etc.)

**Pass/Fail**: ___________

---

### TEST 14: Page Refresh with Filter Active
**Objective**: Verify filter doesn't persist incorrectly after refresh

**Steps**:
1. Set a specific price range (e.g., ₹150–₹250)
2. Perform a search (e.g., "rice")
3. Press F5 or Ctrl+R to refresh the page
4. Wait for page to reload
5. Check if filter is still active or reset

**Expected Results**:
- ✅ Page loads without errors
- ✅ Products display correctly after refresh
- ✅ Filter resets to default (acceptable behavior)
- ✅ All features work the same after refresh
- ✅ No data corruption

**Pass/Fail**: ___________

---

### TEST 15: Product Details Verification
**Objective**: Verify product cards show correct prices

**Steps**:
1. Set a price filter (e.g., ₹100–₹200)
2. Click on a product card to view details
3. Verify the product has:
   - Original price (if higher than selling price)
   - Discounted price or selling price
   - "Save ₹X" amount (if discounted)
4. Verify prices match filter logic
5. Verify quantity displays without trailing zeros

**Expected Results**:
- ✅ All prices displayed correctly
- ✅ Discount badge shows if applicable
- ✅ "Save" amount is accurate
- ✅ Quantities formatted properly (1, 2.5, not 1.000)
- ✅ Free items show correctly

**Pass/Fail**: ___________

---

## 📊 Test Summary

| Test | Name | Status | Notes |
|------|------|--------|-------|
| 1 | Basic Price Range Filtering | _____ | _________ |
| 2 | Discounted Products | _____ | _________ |
| 3 | Category + Price Filter | _____ | _________ |
| 4 | Search + Price Filter | _____ | _________ |
| 5 | All Three Filters | _____ | _________ |
| 6 | Reset Button | _____ | _________ |
| 7 | Slider Drag Interaction | _____ | _________ |
| 8 | Direct Number Input | _____ | _________ |
| 9 | Empty State | _____ | _________ |
| 10 | Mobile Responsiveness | _____ | _________ |
| 11 | Category Range Updates | _____ | _________ |
| 12 | Browser Console | _____ | _________ |
| 13 | Network Requests | _____ | _________ |
| 14 | Page Refresh | _____ | _________ |
| 15 | Product Details | _____ | _________ |

**Overall Status**: _____ (PASS / FAIL)
**Tested By**: _________________
**Date**: _________________

---

## 🐛 Bug Report Template (If Issues Found)

**Test Number**: _____
**Description**: _________________
**Steps to Reproduce**: 
1. _________________
2. _________________
3. _________________

**Expected**: _________________
**Actual**: _________________
**Screenshots**: _________________
**Console Errors**: _________________
**Severity**: (Low / Medium / High)

---

## ✅ Sign-Off

- [ ] All tests passed
- [ ] No console errors
- [ ] No network issues
- [ ] Mobile responsive
- [ ] Ready for production

**Signed By**: _________________
**Date**: _________________
