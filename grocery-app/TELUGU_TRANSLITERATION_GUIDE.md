# Telugu Transliteration Search Guide

## Overview
The search system now supports **bidirectional English ↔ Telugu transliteration**, allowing users to search using either English typing or direct Telugu input.

## Search Modes

### Mode 1: Direct Telugu Input
User types Telugu characters directly:
```
Input: బియ్యం (basmati rice in Telugu)
Results: Shows all rice products
```

### Mode 2: English Transliteration (NEW)
User types English transliteration:
```
Input: biyyam
Results: Shows all rice products (బియ్యం)

Input: paalu
Results: Shows all milk products (పాలు)

Input: mirchi
Results: Shows all chilli products (మిరపకాయ)
```

### Mode 3: Mixed Input
Supports partial or mixed input:
```
Input: rice basmati
Results: Shows Basmati Rice products

Input: బియ్యం rice
Results: Shows rice products (mixed Telugu + English)
```

## Supported Transliteration Mappings

### Food Products
| English Transliteration | Telugu | Product |
|---------------------------|--------|---------|
| biyyam, rice | బియ్యం | Rice |
| paalu, milk | పాలు | Milk & Dairy |
| paalam, jaggery | బెల్లం | Jaggery |
| mirchi, mirapa | మిరపకాయ | Chilli |
| turmeric, paspu | పసుపు | Turmeric Powder |
| gongura | గుంటూరు | Gongura |
| ullipai, onion | ఉల్లిపాయ | Onion |
| tomata, tamata | టమోటా | Tomato |

### Spices & Condiments
| English Transliteration | Telugu | Product |
|---------------------------|--------|---------|
| jeera, cumin | జీలకర్ర | Cumin Seeds |
| dhaniya, coriander | ధనియాలు | Coriander |
| varus, masala | వరుస | Spices |
| garam | గరం | Garam Masala |

### Categories
| English Transliteration | Telugu | Category |
|---------------------------|--------|----------|
| dhaniyalu, grains | ధాన్యాలు | Grains, Rice & Pulses |
| pappu, pulses | పప్పులు | Pulses |
| koora, vegetables | కూరలు | Vegetables |
| varus, spices | వరుస | Spices |

### Measurements
| English Transliteration | Telugu | Unit |
|---------------------------|--------|------|
| kilo, kg | కిలో | Kilogram |
| litre, liter | లీటర్ | Liter |
| gram | గ్రాము | Gram |

## Examples of Search Patterns

### Products Page
```
User Search → System Processing → Results

"biyyam" → Converts to బియ్యం → Shows:
├─ Basmati Rice (5kg)
├─ Brown Rice (2kg)
└─ All other rice products

"paalu" → Converts to పాలు → Shows:
├─ Full Cream Milk
├─ Toned Milk
├─ Paneer
├─ Curd
└─ Other dairy products

"mirchi" → Converts to మిరపకాయ → Shows:
└─ Red Chilli Powder (200g)

"దహి" (direct Telugu) → Shows:
└─ Curd (400g)
```

### Admin Search Pages
```
Order Search by Customer Name:

"నారాయణ" (direct Telugu)
→ Shows orders from customer named నారాయణ

"narayana" (English transliteration)
→ Shows orders from customer named నారాయణ

Both find the same customer!
```

## How It Works Technically

### 1. Search Input Processing
```javascript
User Input: "biyyam"
    ↓
Detect Language: English
    ↓
Generate Variants: ["biyyam", "బియ్యం"]
    ↓
Search: Match against all products
```

### 2. Bidirectional Matching
```
Query Variants: ["biyyam", "బియ్యం"]

Product: "Basmati Rice"
├─ Check "basmati rice" includes "biyyam" ✓
└─ Match Found!

Product Telugu Name: "బాస్మతి బియ్యం"
├─ Check బాస్మతి బియ్యం includes బియ్యం ✓
└─ Match Found!
```

### 3. Transliteration Algorithm
```
englishToTelugu("biyyam"):
  b → బ
  i → ి
  y → య
  y → య
  a → ా
  m → ము
  Result: బియ్యం
```

## Features

✅ **Case-Insensitive**
- "BIYYAM", "Biyyam", "biyyam" all work

✅ **Flexible Matching**
- "rice" matches both "Basmati Rice" and "බយ్యం" 
- "బియ్యం" matches "Basmati Rice"

✅ **Real-Time Search**
- Results update as user types
- No additional API calls needed

✅ **Performance**
- Client-side filtering (fast)
- Optimized for mobile and desktop

✅ **Unicode Support**
- Full Telugu Unicode character set (U+0C00 to U+0C7F)

## Search Pages Supported

| Page | Search Capability |
|------|------------------|
| **Products Page** | Product name, category, units (Telugu/English) |
| **Cart Page** | Cart item names (Telugu/English) |
| **Admin Online Orders** | Customer name, phone (Telugu/English) |
| **Admin Offline Orders** | Customer name, phone (Telugu/English) |
| **Admin Customers** | Customer name, phone, email (Telugu/English) |

## User Experience Examples

### Scenario 1: User with English Keyboard
```
Step 1: User opens Products page
Step 2: Types "biyyam" in search
Step 3: System shows all rice products
Step 4: User can browse "బాస్మతి బియ్యం" with Telugu labels
```

### Scenario 2: User with Telugu Keyboard
```
Step 1: User opens Products page
Step 2: Types "బియ్యం" in search
Step 3: System shows all rice products
Step 4: User can see both English and Telugu names
```

### Scenario 3: Mixed Language User
```
Step 1: User opens Admin Orders page
Step 2: Types "నారాయణ" (Telugu name)
Step 3: System shows all orders from that customer
Step 4: User can also search with "narayana" next time
```

## Common Transliteration Patterns

### Consonants
```
క → ka       ఖ → kha      గ → ga
చ → cha      జ → ja       ట → ta
న → na       ప → pa       బ → ba
म → ma       య → ya       ర → ra
ల → la       వ → va       శ → sha
స → sa       హ → ha
```

### Vowels
```
అ → a        ఆ → aa       ఇ → i
ఈ → ii       ఉ → u        ఊ → uu
ఋ → ri       ఎ → e        ఏ → ay
ఐ → ai       ఒ → o        ఓ → oh
ఔ → ou
```

## Implementation Details

### Files Modified
- `src/utils/searchUtils.js` - Core search logic with transliteration

### New Functions
- `englishToTelugu()` - English → Telugu conversion
- `generateSearchVariants()` - Creates multiple search forms
- `bidirectionalMatch()` - Bidirectional matching algorithm

### Updated Functions
- `searchProducts()` - Uses bidirectional matching
- `searchOrders()` - Uses bidirectional matching
- `searchCustomers()` - Uses bidirectional matching

### Backward Compatible
- Existing search functionality preserved
- No API changes required
- Works with both mock data and API responses

## Tips for Users

1. **For English Keyboard Users**
   - Type English transliteration naturally
   - Example: "biyyam", "paalu", "mirchi"

2. **For Telugu Keyboard Users**
   - Type Telugu characters directly
   - Search results will show English names too

3. **For Best Results**
   - Use product names: "biyyam rice", "full cream milk"
   - Use common terms: "rice", "milk", "spice"
   - Phone searches work with numbers: "9876543210"

## Future Enhancements (Optional)

- [ ] Phonetic suggestion dropdown (like Google Input Tools)
- [ ] Search history with transliteration variants
- [ ] Accent-insensitive matching
- [ ] Advanced ITRANS support (Ch/Sh combinations)
- [ ] Hindi transliteration support (if needed)

## Troubleshooting

### Issue: Search not finding Telugu products
**Solution**: Use transliteration variant or type directly in Telugu

### Issue: Transliteration producing wrong characters
**Solution**: This is a known limitation - try alternate spelling
- Example: "chilli" or "mircha" both work for మిరపకాయ

### Issue: Search slow on large datasets
**Solution**: This is client-side and should be fast. If slow:
- Check network (API calls)
- Try reducing dataset size in admin views
- Clear browser cache

## References

- Telugu Script Unicode Range: U+0C00 to U+0C7F
- ITRANS Transliteration Scheme
- Google Input Tools (Telugu IME)

---
*Last Updated: April 17, 2026*
