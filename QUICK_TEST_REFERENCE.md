# Quick Test Reference - Critical Checks

**Dev Server**: http://localhost:3001 ✓ Running
**Build**: ✓ 0 errors, ready to test

---

## 🔴 Critical Test 1: No Discount Display

**Test This Immediately**:
1. Find a product with NO discount (original = current price)
2. Check the product card
3. Verify:
   - ❌ Does NOT show "0% OFF" badge
   - ❌ Does NOT show "Save ₹0"
   - ✅ Shows only the price "₹60"

**If FAILED**: The discount filtering isn't working

---

## 🟢 Critical Test 2: Discount Display

**Test This Immediately**:
1. Find a product WITH discount (e.g., ₹420→₹400)
2. Check the product card
3. Verify:
   - ✅ Shows discount badge "5% OFF"
   - ✅ Shows savings text "Save ₹20"
   - ✅ Shows both on same product card

**If FAILED**: The discount display logic is broken

---

## 🟡 Critical Test 3: Cart Billing Summary

**Test This Immediately**:
1. Add a discounted product (qty 1) to cart
2. Go to cart page
3. Check billing summary at bottom
4. Verify shows:
   ```
   Original Total: ₹420
   💰 You Save: −₹20
   Final Total: ₹400
   ```

**If FAILED**: The billing summary format is wrong

---

## 🔵 Critical Test 4: Decimal Quantities

**Test This Immediately**:
1. Add a KG product with quantity 0.5
2. Check cart
3. Verify:
   - ✅ Shows "0.5 KG" (NOT "0.500 KG")
   - ✅ Calculation is correct (price × 0.5)

**If FAILED**: The decimal formatter isn't working

---

## ⚫ Critical Test 5: No Savings Row When No Discount

**Test This Immediately**:
1. Add a product with NO discount to cart
2. Check cart billing summary
3. Verify:
   - ❌ Does NOT show "Total Savings" row
   - ✅ Only shows "Final Total: ₹X"

**If FAILED**: The conditional display isn't working

---

## Quick Console Check

Press F12 → Console tab and look for:
- ❌ No red errors
- ❌ No "Cannot read property" messages
- ❌ No "is not defined" warnings
- ✅ Should be mostly clean

**If RED ERRORS**: There's a JavaScript issue to debug

---

## What Each File Does

| File | Responsibility | How to Test |
|------|-----------------|-------------|
| `pricingFormatter.js` | Prevents "0%" and "₹0" | Add no-discount product to cart |
| `quantityFormatter.js` | Formats 1.000→1 | Add 0.5 KG product |
| `ProductCard.js` | Shows clean quantity input | Check product card has no +/- buttons |
| `CartPage.js` | Shows billing summary | Add discounted product, check cart |
| `BillDetailsPage.js` | Shows bill with formatting | Generate order, view bill |

---

## If Something Breaks

**Problem**: "0% OFF" showing on products with no discount
- **Solution**: Check `hasDiscount()` in `pricingFormatter.js` returns false

**Problem**: "1.000 KG" showing instead of "1 KG"
- **Solution**: Check `formatQuantity()` in `quantityFormatter.js`

**Problem**: Cart total wrong
- **Solution**: Check calculation in `CartContext.js` (should be correct, just verify)

**Problem**: Console errors
- **Solution**: Check browser console (F12) for exact error message

---

## Most Important: The 5-Minute Test

1. ⏱️ Open http://localhost:3001
2. ⏱️ Find NO-discount product → Check it doesn't show "0%"
3. ⏱️ Find discounted product → Check it shows discount badge
4. ⏱️ Add discounted product to cart → Check billing summary format
5. ⏱️ Add 0.5 KG product → Check it shows "0.5" not "0.500"

**If all 5 pass** → Implementation is working ✅
**If any fails** → Need to debug that specific area

---

## How to Access Dev Server

```
URL: http://localhost:3001
Status: Ready to test
Features: Hot reload enabled (changes auto-refresh)
```

Press F12 to open Developer Tools if needed.
