# UI Restoration - Code Examples

## 1. CORRECT CART TABLE STRUCTURE

### CartPage.js - Table Headers

```jsx
<TableWrapper>
    <table className="table table-bordered align-middle">
        <thead>
            <tr>
                <th style={{ width: '70px', textAlign: 'center', verticalAlign: 'middle' }}>
                    {langCtx.getText('delivered')}
                </th>
                <th style={{ textAlign: 'left', verticalAlign: 'middle' }}>
                    {langCtx.getText('productName')}
                </th>
                <th style={{ width: '15%', textAlign: 'center', verticalAlign: 'middle' }}>
                    {langCtx.getText('price')}
                </th>
                <th style={{ width: '18%', textAlign: 'center', verticalAlign: 'middle' }}>
                    {langCtx.getText('quantity')}
                </th>
                <th style={{ width: '15%', textAlign: 'center', verticalAlign: 'middle' }}>
                    {langCtx.getText('total')}
                </th>
                <th style={{ width: '12%', textAlign: 'center', verticalAlign: 'middle' }}>
                    Action
                </th>
            </tr>
        </thead>
        <tbody>
            {this.state.filteredItems.map((item) => (
                <ItemRow key={item.productId} delivered={item.delivered}>
                    <td style={{ width: '70px', textAlign: 'center', verticalAlign: 'middle' }}>
                        <StatusDot
                            delivered={item.delivered}
                            onClick={() => cartCtx.toggleItemDelivered(item.productId)}
                            title={item.delivered ? 'Click to mark as not delivered' : 'Click to mark as delivered'}
                        />
                    </td>
                    <CartItem
                        item={item}
                        onUpdateQuantity={cartCtx.updateQuantity}
                        onRemove={cartCtx.removeFromCart}
                        isTableRow={true}
                    />
                </ItemRow>
            ))}
        </tbody>
    </table>
</TableWrapper>
```

**Key Points:**
- Uses Bootstrap classes: `table-bordered` (grid lines), `align-middle` (vertical centering)
- Fixed pixel width (70px) for Delivered column
- Percentage widths for flexible columns: 15%, 18%, 15%, 12%
- All headers use `verticalAlign: 'middle'` for consistency
- CartItem renders the remaining 5 columns as `<td>` elements

---

## 2. CORRECT CART ITEM COMPONENT

### CartItem.js - Individual Row Cells

```jsx
return (
    <React.Fragment>
        {/* Product Name Column */}
        <td style={{ textAlign: 'left', verticalAlign: 'middle', paddingRight: '0.75rem' }}>
            <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem', 
                minWidth: '0'  // Key: allows flex children to shrink
            }}>
                <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>
                    {item.emoji}
                </span>
                <span 
                    className="fw-semibold" 
                    style={{ 
                        whiteSpace: 'normal',
                        wordWrap: 'break-word',
                        overflowWrap: 'break-word',
                        minWidth: '0',
                        flex: 1  // Key: takes available space
                    }}
                >
                    {item.name}
                </span>
            </div>
        </td>

        {/* Price Column */}
        <td style={{ width: '15%', textAlign: 'center', verticalAlign: 'middle' }}>
            ₹{item.price.toFixed(2)}
        </td>

        {/* Quantity Column */}
        <td style={{ width: '18%', textAlign: 'center', verticalAlign: 'middle' }}>
            <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: '0.3rem' 
            }}>
                <GhostButton
                    onClick={handleDecrease}
                    disabled={isDecreaseDisabled}
                    style={{
                        padding: '0.2rem 0.4rem',
                        minWidth: '28px',
                        fontSize: '0.75rem'
                    }}
                >
                    −
                </GhostButton>
                <span style={{ minWidth: '25px', textAlign: 'center', fontSize: '0.9rem' }}>
                    {item.quantity}
                </span>
                <GhostButton
                    onClick={handleIncrease}
                    disabled={isIncreaseDisabled}
                    style={{
                        padding: '0.2rem 0.4rem',
                        minWidth: '28px',
                        fontSize: '0.75rem'
                    }}
                >
                    +
                </GhostButton>
            </div>
            {isIncreaseDisabled && (
                <div style={{ fontSize: '0.7rem', color: '#dc3545', marginTop: '0.2rem' }}>
                    Max: {item.stock}
                </div>
            )}
        </td>

        {/* Total Column */}
        <td 
            className="fw-bold" 
            style={{ 
                width: '15%', 
                textAlign: 'center', 
                verticalAlign: 'middle', 
                color: '#28a745' 
            }}
        >
            ₹{item.total.toFixed(2)}
        </td>

        {/* Action Column */}
        <td style={{ width: '12%', textAlign: 'center', verticalAlign: 'middle' }}>
            <DangerButton
                onClick={() => onRemove(item.productId)}
                style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', minWidth: 'auto' }}
                title={langCtx.getText('removeItem')}
            >
                ✕
            </DangerButton>
        </td>
    </React.Fragment>
);
```

**Key Points:**
- Returns `React.Fragment` with multiple `<td>` elements
- Product name uses flexbox with `minWidth: '0'` to allow proper text wrapping
- All widths match CartPage headers exactly
- Quantity controls are centered and compact
- Each cell has `verticalAlign: 'middle'` for proper alignment

---

## 3. CORRECT STATUS DOT COMPONENT

### CartPage.js - Dot Indicator

```jsx
const StatusDot = styled.span`
    display: inline-block;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background-color: ${props => props.delivered ? '#28a745' : '#dc3545'};
    cursor: pointer;
    transition: background-color 0.2s ease;
    
    &:hover {
        opacity: 0.85;
    }
`;

// Usage
<StatusDot
    delivered={item.delivered}
    onClick={() => cartCtx.toggleItemDelivered(item.productId)}
    title={item.delivered ? 'Click to mark as not delivered' : 'Click to mark as delivered'}
    role="button"
    tabIndex="0"
    onKeyPress={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            cartCtx.toggleItemDelivered(item.productId);
        }
    }}
/>
```

**Key Points:**
- Uses `span` instead of `div` for minimal layout impact
- Size: 18px (fits in table cells without alignment issues)
- Green: `#28a745` (Bootstrap success color)
- Red: `#dc3545` (Bootstrap danger color)
- Smooth transition only on `background-color` (no layout-affecting transforms)
- Simple hover opacity for feedback
- Fully keyboard accessible

---

## 4. CORRECT GREEN INFO BAR (Flexbox)

### Navbar.js - Store Details

```jsx
const StoreDetailsContainer = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    flex-wrap: wrap;
    gap: 2rem;
    padding: 0.75rem 0;
    width: 100%;
    
    @media (max-width: 1024px) {
        gap: 1.5rem;
        justify-content: space-around;
        padding: 0.5rem 0;
    }

    @media (max-width: 768px) {
        flex-direction: column;
        gap: 1rem;
        padding: 0.75rem 0;
        align-items: flex-start;
    }
`;

const DetailItem = styled.div`
    color: #fff;
    font-size: 0.85rem;
    font-family: 'Inter', sans-serif;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    flex: 0 1 auto;
    min-height: auto;

    .detail-label {
        font-weight: 600;
        color: #ffd700;
        margin-bottom: 0.35rem;
        display: block;
        font-size: 0.8rem;
    }

    .detail-value {
        font-size: 0.8rem;
        color: #fff;
        line-height: 1.6;
        word-wrap: break-word;
        overflow-wrap: break-word;
        word-break: break-word;
        white-space: normal;
        max-width: 100%;
    }

    @media (max-width: 768px) {
        .detail-label {
            font-size: 0.75rem;
        }

        .detail-value {
            font-size: 0.75rem;
            line-height: 1.5;
        }
    }
`;

// JSX
{isAuthenticated && (
    <div style={{ 
        background: '#1a472a', 
        padding: '0.75rem 1rem', 
        borderBottom: '1px solid #0d2818', 
        overflow: 'visible', 
        width: '100%' 
    }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 1rem' }}>
            <StoreDetailsContainer>
                <DetailItem>
                    <span className="detail-label">{langCtx.getText('ownerLabel')}:</span>
                    <span className="detail-value">{langCtx.getText('ownerName')}</span>
                </DetailItem>
                <DetailItem>
                    <span className="detail-label">{langCtx.getText('addressLabel')}:</span>
                    <span className="detail-value">
                        {langCtx.getText('address').split('\n').map((line, idx) => (
                            <React.Fragment key={idx}>
                                {line}
                                {idx < langCtx.getText('address').split('\n').length - 1 && <br />}
                            </React.Fragment>
                        ))}
                    </span>
                </DetailItem>
                <DetailItem>
                    <span className="detail-label">{langCtx.getText('phoneLabel')}:</span>
                    <span className="detail-value">
                        <a href="tel:+919441754505" style={{ color: '#ffd700', textDecoration: 'none' }}>
                            {langCtx.getText('phoneLink')}
                        </a>
                    </span>
                </DetailItem>
            </StoreDetailsContainer>
        </div>
    </div>
)}
```

**Key Points:**
- `display: flex` with `flex-wrap: wrap` for natural wrapping
- `space-between` distributes items evenly
- `gap: 2rem` provides breathing room
- `flex-direction: column` on mobile (`768px`)
- Each `DetailItem` has `flex: 0 1 auto` to prevent stretching
- Text uses `line-height: 1.6` for readable spacing
- All text wrapping properties applied

---

## 5. TABLE WRAPPER STYLING (Cleaned)

### FormStyles.js - TableWrapper

```javascript
export const TableWrapper = styled.div`
    background: ${({ theme }) => theme.colors.white};
    border-radius: ${({ theme }) => theme.borderRadius.md};
    box-shadow: ${({ theme }) => theme.shadows.sm};
    border: 1px solid ${({ theme }) => theme.colors.borderLight};
    overflow-x: auto;
    width: 100%;

    .table {
        margin: 0;
        width: 100%;
        table-layout: auto;

        thead th {
            background: ${({ theme }) => theme.colors.bodyBg};
            border-bottom: 2px solid ${({ theme }) => theme.colors.border};
            font-size: ${({ theme }) => theme.fontSizes.sm};
            font-weight: 700;
            color: ${({ theme }) => theme.colors.textSecondary};
            text-transform: uppercase;
            letter-spacing: 0.5px;
            padding: 0.85rem 0.75rem;
            line-height: 1.4;
            word-wrap: break-word;
            overflow-wrap: break-word;
            white-space: normal;
        }

        tbody tr {
            transition: ${({ theme }) => theme.transitions.fast};

            &:hover {
                background: rgba(46, 125, 50, 0.04);
            }

            td {
                padding: 0.85rem 0.75rem;
                vertical-align: middle;
                border-color: ${({ theme }) => theme.colors.borderLight};
                font-size: ${({ theme }} => theme.fontSizes.sm};
                word-wrap: break-word;
                overflow-wrap: break-word;
                white-space: normal;
            }
        }

        @media (max-width: 768px) {
            thead th,
            tbody td {
                padding: 0.65rem 0.5rem;
                font-size: ${({ theme }) => theme.fontSizes.xs};
            }
        }
    }
`;
```

**Key Points:**
- Global `word-wrap: break-word` and `overflow-wrap: break-word` on all cells
- No conflicting `:nth-child` selectors
- `white-space: normal` allows text wrapping
- Responsive padding and font sizes
- `overflow-x: auto` for mobile horizontal scroll if needed

---

## 6. BUTTON STYLING (Text Wrapping Support)

### ButtonStyles.js - Base Button

```javascript
const baseButton = css`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.55rem 1.25rem;
    border-radius: ${({ theme }) => theme.borderRadius.sm};
    font-size: ${({ theme }) => theme.fontSizes.sm};
    font-weight: 600;
    cursor: pointer;
    transition: ${({ theme }) => theme.transitions.fast};
    border: none;
    white-space: normal;
    word-wrap: break-word;
    overflow-wrap: break-word;
    word-break: break-word;
    line-height: 1.3;
    text-align: center;
    min-height: 36px;

    &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        transform: none !important;
    }

    &:hover:not(:disabled) {
        transform: translateY(-1px);
    }

    &:active:not(:disabled) {
        transform: translateY(0);
    }
`;
```

**Key Points:**
- `white-space: normal` allows multi-line button text
- `line-height: 1.3` for readable multi-line text
- `text-align: center` centers wrapped text
- `min-height: 36px` ensures consistent button sizing
- Simple `transform: translateY()` hover effect (no complex animations)

---

## Why These Changes Work

### 1. **Percentage-Based Widths**
- Scale with container
- Responsive without media query changes
- Distribute space fairly
- Better than fixed pixels

### 2. **Flexbox with `minWidth: 0`**
- Allows flex children to shrink below content size
- Enables proper text wrapping
- Prevents text from pushing beyond column
- Works with `flex: 1` to fill available space

### 3. **Simple StatusDot**
- `span` element = minimal layout impact
- 18px = fits table cells perfectly
- Only `background-color` transitions = instant color change
- No transform animations affecting layout

### 4. **Flexbox for Green Bar**
- `flex-wrap: wrap` = natural wrapping at breakpoints
- No fixed column count
- `flex-direction: column` on mobile = automatic stacking
- Responsive padding auto-adjusts spacing

### 5. **Bootstrap Integration**
- `table-bordered` = clear grid structure
- `align-middle` = vertical centering
- Works with percentage widths
- Classes vs conflicting CSS selectors

### 6. **Text Wrapping Rules**
- `word-wrap: break-word` = standard wrapping
- `overflow-wrap: break-word` = IE support
- `word-break: break-word` = handles long words
- `white-space: normal` = allows line breaks
- `line-height: 1.6` = readable spacing

---

## Testing This Layout

```html
<!-- HTML Structure (rendered) -->
<table class="table table-bordered align-middle">
    <thead>
        <tr>
            <th style="width: 70px; text-align: center;">✓</th>
            <th style="text-align: left;">Product</th>
            <th style="width: 15%; text-align: center;">Price</th>
            <th style="width: 18%; text-align: center;">Quantity</th>
            <th style="width: 15%; text-align: center;">Total</th>
            <th style="width: 12%; text-align: center;">Action</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td style="width: 70px; text-align: center;">●</td>
            <td style="text-align: left;">
                <div style="display: flex; gap: 0.5rem;">
                    <span>🥛</span>
                    <span>Curd (400g)</span>
                </div>
            </td>
            <td style="width: 15%; text-align: center;">₹80</td>
            <td style="width: 18%; text-align: center;">- 1 +</td>
            <td style="width: 15%; text-align: center;">₹80</td>
            <td style="width: 12%; text-align: center;">✕</td>
        </tr>
    </tbody>
</table>
```

When rendered, this produces:
- ✅ Proper column alignment
- ✅ No vertical text stacking
- ✅ All controls visible
- ✅ Responsive at all sizes
