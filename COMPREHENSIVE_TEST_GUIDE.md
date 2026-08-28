# Comprehensive Testing Guide - UI/Quantity/Discount Improvements

**Dev Server**: Running on http://localhost:3001
**Build Status**: ✓ Successful, 0 errors

## Test Scenarios (from requirements)

### TEST 1: Basic Discount - Single Quantity
**Scenario**: 
- Product: Original ₹420, Discounted ₹400
- Quantity: 1
- Expected Output:
  - Product Card: Shows "₹400", shows discount badge "5% OFF" (not 0%)
  - Cart Item: Shows "₹420 → ₹400", "💰 Save ₹20"
  - Cart Total: Shows calculation flow: Original ₹420, You Save ₹20, Final ₹400

**Verify**:
- [ ] Product card shows discount badge (not "0%")
- [ ] Product card shows savings text (not "₹0")
- [ ] Cart shows strikethrough price and discounted price
- [ ] Savings text shows with emoji
- [ ] Cart total shows 3-line summary with calculation flow

---

### TEST 2: Discount - Multiple Quantities
**Scenario**:
- Product: Original ₹420, Discounted ₹400
- Quantity: 3
- Expected Output:
  - Original Total: ₹1260 (420 × 3)
  - Savings: ₹60 (20 × 3)
  - Final Total: ₹1200 (400 × 3)

**Verify**:
- [ ] Cart displays: Original ₹1260
- [ ] Cart displays: You Save ₹60
- [ ] Cart displays: Final ₹1200
- [ ] All calculations are correct (multiply by quantity)

---

### TEST 3: High-Value Discount
**Scenario**:
- Product: Original ₹35, Discounted ₹20
- Quantity: 1
- Expected Output:
  - Discount: 43% OFF (approximately)
  - Savings: ₹15
  - Final: ₹20

**Verify**:
- [ ] Shows correct discount percentage (43% OFF, not 0%)
- [ ] Shows savings: "💰 Save ₹15"
- [ ] Cart total shows ₹20 as final

---

### TEST 4: No Discount Product
**Scenario**:
- Product: Original ₹60, No discount
- Quantity: 1
- Expected Output:
  - Product Card: Shows ₹60 ONLY (no discount badge, no savings text)
  - Cart: Shows ₹60 ONLY (no strikethrough, no savings message)
  - Cart Total: Shows ₹60 ONLY (no "0%" or "₹0 saved")

**Verify**:
- [ ] Product card does NOT show "0%" badge
- [ ] Product card does NOT show "₹0 saved"
- [ ] Cart does NOT show strikethrough price
- [ ] Cart does NOT show "Save ₹0"
- [ ] Cart total does NOT show "Total Savings" row when no savings

---

### TEST 5: Decimal Quantity - 0.5 KG
**Scenario**:
- Product Unit: KG (decimal unit)
- Quantity: 0.5
- Expected Output: Displays as "0.5 KG" (not "0.500 KG")

**Verify**:
- [ ] Quantity shows "0.5" in cart
- [ ] Quantity shows "0.5" in product card input
- [ ] Price calculation is correct: Price × 0.5
- [ ] Billing shows: 0.5 KG in quantity column

---

### TEST 6: Decimal Quantity - 1.25 KG
**Scenario**:
- Product Unit: KG (decimal unit)
- Quantity: 1.25
- Expected Output: Displays as "1.25 KG" (not "1.250 KG")

**Verify**:
- [ ] Quantity shows "1.25" (trailing zero removed)
- [ ] Price calculation: Price × 1.25
- [ ] Billing shows: 1.25 KG

---

### TEST 7: Integer Unit - PACK
**Scenario**:
- Product Unit: PACK
- Quantity: 1
- Expected Output: Displays as "1 PACK" (or just "1")

**Verify**:
- [ ] Quantity input only accepts integers (no decimals)
- [ ] Displays as "1" or "1 PACK" consistently
- [ ] Unit label follows product unit setting

---

### TEST 8: Invalid Decimal for Integer Unit
**Scenario**:
- Product Unit: PACK
- User attempts: 1.5
- Expected Output: Input rejected or rounded/truncated

**Verify**:
- [ ] Quantity input does NOT allow 1.5 for PACK
- [ ] Validation prevents decimal entry
- [ ] Error message shown (if applicable)

---

### TEST 9: Refresh Cart - Data Persistence
**Scenario**:
- Add 3 products to cart with varying quantities and discounts
- Refresh browser (F5)
- Expected Output: All quantities, prices, discounts, totals remain correct

**Verify**:
- [ ] Cart persists after refresh
- [ ] All quantities display correctly
- [ ] All prices display correctly
- [ ] All discount badges show correctly
- [ ] Cart total recalculates correctly
- [ ] Savings amount is correct

---

### TEST 10: Generate Order - Verify Data Integrity
**Scenario**:
- Add products with discounts to cart
- Proceed to checkout and generate order
- View order in Bill Details page
- Expected Output: 
  - Quantities: Show formatted (1.25 kg not 1.250 kg)
  - Discount: Shows only if actual discount exists
  - Savings: Shows calculation for each item
  - Final total: Correct sum

**Verify**:
- [ ] Order shows all items with correct quantities
- [ ] Quantities formatted correctly (no trailing zeros)
- [ ] Discount badges only show for discounted items
- [ ] Savings calculated correctly per item (discount × quantity)
- [ ] Savings row shown only if total savings > 0
- [ ] Final bill total is correct
- [ ] Free items display with formatted quantity

---

## Pages to Test

### Critical Pages:
1. **ProductsPage** - Product listing with cards
2. **CartPage** - Shopping cart with billing summary
3. **BillDetailsPage** - Order confirmation/history
4. **SuggestedProductsPage** - Suggested products section

### Admin Pages:
5. **AdminOfflineBillsPage** - Offline bills listing
6. **AdminListOrderBillsPage** - List order bills
7. **AdminOnlineBillsPage** - Online bills (if exists)

---

## Regression Testing Checklist

- [ ] Can add products to cart
- [ ] Can remove products from cart
- [ ] Can update quantities in cart
- [ ] Quantity validation works (decimals for KG, integers for PACK)
- [ ] Cart total updates on quantity change
- [ ] Free items display in cart
- [ ] Favorites functionality works
- [ ] Suggested products display
- [ ] Search functionality works
- [ ] Filter functionality works
- [ ] Admin pages load without errors
- [ ] Responsive design on mobile (test with F12 dev tools)
- [ ] No console errors (F12 console)

---

## Browser Console Check

Open Developer Tools (F12) → Console tab and verify:
- [ ] No red errors
- [ ] No unhandled promise rejections
- [ ] No "Cannot read property" errors
- [ ] No undefined variable warnings

---

## Test Execution Log

**Date Started**: [Current Date]
**Tester**: [Your Name]

### Results Summary:
| Test # | Status | Notes |
|--------|--------|-------|
| 1 | [ ] | |
| 2 | [ ] | |
| 3 | [ ] | |
| 4 | [ ] | |
| 5 | [ ] | |
| 6 | [ ] | |
| 7 | [ ] | |
| 8 | [ ] | |
| 9 | [ ] | |
| 10 | [ ] | |

---

## Known Limitations / Edge Cases

1. **Floating Point Precision**: JavaScript may show 1.2000000000001
   - Mitigated by: `formatQuantity()` using regex replacement
   - Verify: Test with products priced at ₹99.99 × 3 items

2. **Mobile Keyboard**: Decimal input on mobile may not show decimal point
   - Workaround: Show "KG" label clearly
   - Verify: Test on mobile or tablet

3. **Theme Change**: Some colors may vary by theme
   - Verify: Test light and dark themes if applicable

---

## Files Modified (for reference)

1. `src/utils/pricingFormatter.js` - NEW: Centralized discount/savings utilities
2. `src/utils/quantityFormatter.js` - MODIFIED: Fixed decimal formatting
3. `src/components/QuantityControl.js` - MODIFIED: Added hideButtons prop
4. `src/components/ProductCard.js` - MODIFIED: Uses new utilities
5. `src/components/CartItem.js` - MODIFIED: Uses new utilities
6. `src/pages/CartPage.js` - MODIFIED: Fixed billing summary
7. `src/pages/BillDetailsPage.js` - MODIFIED: Uses new utilities

---

## Quick Reference - What Changed

### Before:
```
1.000 KG displayed as "1.000"
Product card: Shows ₹0 saved even when no discount
Cart: Shows "Save ₹0" on no-discount items
Bill: Shows "Save ₹35" as "-₹35" (confusing)
```

### After:
```
1.000 KG displayed as "1"
Product card: No discount display if no actual discount
Cart: Shows "💰 Save ₹X" only if X > 0
Bill: Shows calculation flow - Original → You Save → Final
```
