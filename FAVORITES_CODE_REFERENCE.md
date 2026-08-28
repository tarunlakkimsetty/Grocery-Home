# Favorites Feature - Code Reference Guide

## 📍 All Code Locations

### Backend - Routes (CRITICAL FIX)
**File:** `backend/routes/favoriteRoutes.js`

**Route Order (Lines 1-27):**
```javascript
Lines 6-8:   router.get('/count', getFavoritesCount);
Lines 11-14: router.get('/:productId/check', checkFavorite);
Lines 18-20: router.get('/', getFavorites);
Lines 25-27: router.post('/:productId', addFavorite);
Lines 32-34: router.delete('/:productId', removeFavorite);
```

**Why These Line Numbers Matter:**
- `/count` MUST be before `/:id`
- `/:id/check` MUST be before `/:id`
- Root `/` can be anywhere
- Dynamic routes `/:id` go at the end

---

### Backend - Controllers
**File:** `backend/controllers/favoriteController.js`

**Functions:**
- Line 7-38: `addFavorite()` - Add to favorites
- Line 45-78: `removeFavorite()` - Remove from favorites
- Line 85-119: `getFavorites()` - Get paginated list
- Line 126-149: `getFavoritesCount()` - Get count
- Line 156-189: `checkFavorite()` - Check if favorited
- Line 192-198: `module.exports` - Export all functions

**Export Order (Must match favoriteRoutes.js):**
```javascript
module.exports = {
  addFavorite,
  removeFavorite,
  getFavorites,
  getFavoritesCount,
  checkFavorite
};
```

---

### Backend - Models
**File:** `backend/models/favoriteModel.js`

**Methods:**
- Line 6-19: `add(customerId, productId)` - Add favorite
- Line 25-31: `remove(customerId, productId)` - Remove favorite
- Line 37-44: `isFavorited(customerId, productId)` - Check status
- Line 50-77: `getByCustomerId(customerId, options)` - Get list
- Line 83-90: `getCountByCustomerId(customerId)` - Get count

---

### Backend - Database
**File:** `backend/schema.sql`

**Favorites Table (Added after order_images table):**
```sql
CREATE TABLE IF NOT EXISTS favorites (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    product_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_favorites_customer 
        FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_favorites_product 
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    
    UNIQUE KEY unique_customer_product (customer_id, product_id),
    
    INDEX idx_customer_id (customer_id),
    INDEX idx_product_id (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Migration File:** `backend/migrations/008_create_favorites_table.sql` (already exists)

---

### Frontend - Context (NEW)
**File:** `grocery-app/src/context/FavoritesContext.js`

**Structure:**
- Line 1-4: Imports
- Line 6-14: Context creation
- Line 16-114: FavoritesProvider class
  - Line 23-31: constructor() - Initialize state
  - Line 33-37: componentDidMount() - Load on init
  - Line 40-57: loadFavorites() - Fetch from API
  - Line 60-63: isFavorite() - Check (O(1))
  - Line 66-77: addFavorite() - Add and update
  - Line 80-91: removeFavorite() - Remove and update
  - Line 94-112: render() - Provide context
- Line 114-116: Export

**Key Context Value:**
```javascript
const value = {
  favoriteIds: new Set(),        // All favorite product IDs
  isFavorite: this.isFavorite,   // Check if product favorited
  addFavorite: this.addFavorite, // Add to favorites
  removeFavorite: this.removeFavorite, // Remove from favorites
  loadFavorites: this.loadFavorites,   // Refresh from API
  loading: this.state.loading,
  error: this.state.error,
};
```

---

### Frontend - App Integration
**File:** `grocery-app/src/App.js`

**Import (Top of file):**
```javascript
Line 6: import { FavoritesProvider } from './context/FavoritesContext';
```

**Provider Wrapper (render method):**
```javascript
Line ~125:
  <BrowserRouter future={routerFutureFlags}>
    <LanguageProvider>
      <AuthProvider>
        <CartProvider>
          <FavoritesProvider>     ← Added this
            <LegalModalProvider>
              <AppContentWithRouter />
            </LegalModalProvider>
          </FavoritesProvider>
        </CartProvider>
      </AuthProvider>
    </LanguageProvider>
  </BrowserRouter>
```

---

### Frontend - ProductCard Updates
**File:** `grocery-app/src/components/ProductCard.js`

**Import (Line ~5):**
```javascript
import FavoritesContext from '../context/FavoritesContext';
```

**State Changes (Line ~46-54):**
```javascript
// REMOVED: isFavorited, checkingFavorite
// KEPT: quantity, showEditModal, editName, editPrice, editStock, editErrors

constructor(props) {
  super(props);
  const isWeightBased = supportsDecimal(props.product?.unit);
  this.state = {
    quantity: isWeightBased ? 0.1 : 1,
    showEditModal: false,
    editName: props.product.name,
    editPrice: props.product.price,
    editStock: props.product.stock,
    editErrors: {},
    // isFavorited, checkingFavorite removed ✓
  };
}
```

**Lifecycle Changes (Line ~57-65):**
```javascript
componentDidMount() {
  // Favorites loaded from context, no per-card API call needed
}

checkFavoriteStatus = async () => {
  // Method no longer needed - kept for reference only
};
```

**Toggle Favorite (Line ~68-97):**
```javascript
handleToggleFavorite = async (langCtx, favCtx) => {
  try {
    const { product } = this.props;
    const isFavorited = favCtx.isFavorite(product.id); // Context lookup

    if (isFavorited) {
      await favCtx.removeFavorite(product.id); // Context method
      toast.success(`${translatedName} removed from favorites`);
    } else {
      await favCtx.addFavorite(product.id); // Context method
      toast.success(`${translatedName} added to favorites ⭐`);
    }
  } catch (err) {
    console.error('Error toggling favorite:', err);
    const errorMsg = err.response?.data?.message || 'Error updating favorites';
    toast.error(errorMsg);
  }
};
```

**Render - Star Button (Line ~179-217):**
```javascript
{role === 'customer' && !isAdmin && (
  <FavoritesContext.Consumer>
    {(favCtx) => {
      const isFavorited = favCtx?.isFavorite(product.id) || false;
      return (
        <button
          className="favorite-btn"
          onClick={() => this.handleToggleFavorite(langCtx, favCtx)}
          title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            background: 'rgba(255, 255, 255, 0.9)',
            border: 'none',
            fontSize: '20px',
            cursor: 'pointer',
            padding: '6px 8px',
            transition: 'all 0.2s ease',
            borderRadius: '4px',
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: '32px',
            minHeight: '32px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          }}
          onMouseEnter={(e) => {
            e.target.style.background = 'rgba(255, 255, 255, 1)';
            e.target.style.transform = 'scale(1.15)';
            e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'rgba(255, 255, 255, 0.9)';
            e.target.style.transform = 'scale(1)';
            e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
          }}
        >
          {isFavorited ? '⭐' : '☆'}
        </button>
      );
    }}
  </FavoritesContext.Consumer>
)}
```

---

### Frontend - Starred Products Page
**File:** `grocery-app/src/pages/StarredProductsPage.js`

**Import (Line ~7):**
```javascript
import FavoritesContext from '../context/FavoritesContext';
```

**Fetch Favorites (Line ~33-65):**
```javascript
fetchFavorites = async () => {
  this.setState({ loading: true, error: null });
  try {
    const response = await favoriteService.getFavorites(1, 1000);
    
    const favorites = response.favorites || response.data || [];
    const total = response.total || favorites.length || 0;
    
    const searchQuery = (this.state.searchQuery || '').trim();
    const safeFavorites = Array.isArray(favorites) ? favorites : [];
    
    const filteredFavorites = searchQuery
      ? searchProducts(safeFavorites, searchQuery, this.context.getText)
      : safeFavorites;

    this.setState({ 
      favorites: safeFavorites, 
      filteredFavorites, 
      loading: false,
      count: total,
      error: null
    });
  } catch (err) {
    console.error('Error fetching favorites:', err);
    if (err.response?.status === 401) {
      this.setState({ error: 'Please log in to view favorites', loading: false });
    } else if (err.response?.status === 404 || !err.response) {
      this.setState({ 
        favorites: [], 
        filteredFavorites: [],
        loading: false,
        count: 0,
        error: null
      });
    } else {
      this.setState({ error: 'Failed to load starred products', loading: false });
      toast.error('Failed to load starred products');
    }
  }
};
```

**Render with Context (Line ~97-155):**
```javascript
render() {
  const { getText } = this.context;
  const { filteredFavorites, loading, error, count } = this.state;

  if (loading) {
    return <Spinner />;
  }

  return (
    <FavoritesContext.Consumer>
      {(favCtx) => {
        // Filter out products that were removed
        const validFavorites = filteredFavorites.filter(product => 
          favCtx?.isFavorite(product.id) || favCtx?.isFavorite(product.product_id)
        );

        return (
          <>
            <PageHeader>
              <h1>⭐ {getText('Starred Products')} ({favCtx?.favoriteIds?.size || count})</h1>
              <p>{getText('favoriteProductsDescription')}</p>
            </PageHeader>

            <SearchBar onSearch={this.handleSearch} />

            <div className="container mt-4 mb-5">
              {validFavorites.length === 0 && filteredFavorites.length === 0 ? (
                <EmptyState>
                  <h3>⭐ No Starred Products</h3>
                  <p>You haven't starred any products yet...</p>
                </EmptyState>
              ) : validFavorites.length === 0 ? (
                <EmptyState>
                  <h3>🔍 No results found</h3>
                </EmptyState>
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                  gap: '16px',
                  marginTop: '20px'
                }}>
                  {validFavorites.map((product) => (
                    <ProductCard
                      key={product.id || product.product_id}
                      product={product}
                      onFavoriteRemoved={this.handleFavoriteRemoved}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        );
      }}
    </FavoritesContext.Consumer>
  );
}
```

---

## 🔍 Search Pattern Reference

### Find Specific Code:

**Find where favorites context is used:**
```bash
grep -r "FavoritesContext" grocery-app/src --include="*.js"
```

**Find where favoriteService is called:**
```bash
grep -r "favoriteService\." grocery-app/src --include="*.js"
```

**Find all TODO comments:**
```bash
grep -r "TODO" . --include="*.js" | grep -i favorite
```

**Find API endpoint handlers:**
```bash
grep -r "router\.\(get\|post\|delete\)" backend/routes/favoriteRoutes.js
```

---

## 📊 Code Metrics

### Files Changed: 6
- Backend: 2 files modified, 4 files already complete
- Frontend: 4 files (1 created, 3 modified)

### Lines Added:
- `FavoritesContext.js`: ~116 lines (new)
- `App.js`: 2 lines (import + wrapper)
- `ProductCard.js`: ~30 lines (context integration)
- `StarredProductsPage.js`: ~10 lines (context integration)
- Total: ~160 lines added

### Lines Removed:
- `ProductCard.js`: ~15 lines (API call code)
- `StarredProductsPage.js`: ~5 lines (error handling)
- Total: ~20 lines removed

### Net Change: +140 lines (mostly in new context file)

---

## 🔐 Security Considerations

### Authentication
- **Location:** `backend/middleware/authMiddleware.js` (already exists)
- **Applied to:** All favorite routes via `router.use(authMiddleware)`
- **Verification:** Every request must have valid JWT token

### Authorization
- **Customer-Only:** No admin check needed (just requires auth)
- **User-Specific:** Can only access own favorites (enforced by `customerId` from `req.user`)
- **Database:** Foreign key constraints prevent invalid data

### Data Validation
- **Product ID:** Must be positive integer
- **Pagination:** Limits prevent abuse
- **Rate Limiting:** Applied via general API limiter

---

## 🐛 Debugging Commands

### Backend Debugging:

**Test favorite endpoints:**
```bash
# Get token first (from login response)
TOKEN="eyJhbGc..."

# Test GET /api/favorites
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/favorites?page=1&limit=10

# Test POST /api/favorites/:id
curl -X POST -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/favorites/5

# Test GET /api/favorites/:id/check
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/favorites/5/check

# Test DELETE /api/favorites/:id
curl -X DELETE -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/favorites/5

# Test GET /api/favorites/count
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/favorites/count
```

### Frontend Debugging:

**In browser console:**
```javascript
// Check if context exists
console.log(window.__FAVORITES_CONTEXT__);

// Check state
localStorage.getItem('token');
localStorage.getItem('user');

// Test favorite lookup
// (Note: Context only available through component)
```

**In DevTools:**
- Network tab: Check API requests
- Console: Look for errors
- Elements: Inspect star button DOM
- Sources: Set breakpoints in ProductCard.js

---

## 📚 Code References

### Context Pattern (from React docs):
- `React.createContext()` - Create context
- `Provider` - Supply value to children
- `Consumer` - Access value in children

### Express Middleware Pattern:
- `router.use()` - Apply to all routes
- `router.get()` - GET requests
- `router.post()` - POST requests
- `router.delete()` - DELETE requests

### Database Query Pattern:
- `promisePool.query()` - Execute query
- Prepared statements with `?` for safety
- Destructuring `[rows, fields]` from results

---

**Code Reference Complete**
