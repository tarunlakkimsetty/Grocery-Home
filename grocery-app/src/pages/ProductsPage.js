import React from 'react';
import productService from '../services/productService';
import ProductCard from '../components/ProductCard';
import SearchBar from '../components/SearchBar';
import Spinner from '../components/Spinner';
import PriceRangeFilter, { PriceFilterToggle } from '../components/PriceRangeFilter';
import DiscountRangeFilter from '../components/DiscountRangeFilter';
import LanguageContext from '../context/LanguageContext';
import { toast } from 'react-toastify';
import { PageHeader } from '../styledComponents/LayoutStyles';
import { EmptyState } from '../styledComponents/FormStyles';
import { searchProducts } from '../utils/searchUtils';
import { filterByPrice, filterByDiscount, getDiscountRange, getFullPriceRange } from '../utils/priceFilterUtils';

class ProductsPage extends React.Component {
    static contextType = LanguageContext;

    constructor(props) {
        super(props);
        this.state = {
            products: [],
            filteredProducts: [],
            loading: true,
            error: null,
            searchQuery: '',
            // Price filter state
            minPrice: 0,
            maxPrice: 1000,
            availableMinPrice: 0,
            availableMaxPrice: 1000,
            isPriceFilterOpen: false,
            minDiscount: 0,
            maxDiscount: 0,
            availableMinDiscount: 0,
            availableMaxDiscount: 0,
            isDiscountFilterOpen: false,
        };
    }

    componentDidMount() {
        this.fetchProducts();
    }

    componentDidUpdate(prevProps) {
        if (prevProps.activeCategory !== this.props.activeCategory) {
            this.fetchProducts();
        }
    }

    fetchProducts = async () => {
        this.setState({ loading: true, error: null });
        try {
            const { activeCategory } = this.props;
            const categoryParam = activeCategory && activeCategory !== 'ALL' ? activeCategory : null;
            const response = await productService.getProducts(categoryParam);
            
            // Handle both { success, data: [...] } and direct array responses
            const products = Array.isArray(response) 
                ? response 
                : (response?.data || response?.products || []);
            
            const safeProducts = Array.isArray(products) ? products : [];
            
            // Calculate available price range from current products
            const { min, max } = getFullPriceRange(safeProducts);
            const discountRange = getDiscountRange(safeProducts);
            
            // Apply all filters with initial values
            const filtered = this.applyAllFilters(
                safeProducts,
                this.state.searchQuery,
                min,
                max,
                discountRange.min,
                discountRange.max
            );

            this.setState({ 
                products: safeProducts, 
                filteredProducts: filtered, 
                loading: false,
                availableMinPrice: min,
                availableMaxPrice: max,
                minPrice: min,
                maxPrice: max,
                minDiscount: discountRange.min,
                maxDiscount: discountRange.max,
                availableMinDiscount: discountRange.min,
                availableMaxDiscount: discountRange.max,
            });
        } catch (err) {
            this.setState({ error: 'Failed to load products', loading: false });
            toast.error('Failed to load products');
        }
    };

    /**
     * Apply all filters: search + price
     * Internal helper to reapply filters consistently
     */
    applyAllFilters = (products, searchQuery, minPrice, maxPrice, minDiscount = this.state.minDiscount, maxDiscount = this.state.maxDiscount) => {
        let filtered = Array.isArray(products) ? [...products] : [];
        
        // Step 1: Category filter (already applied in fetchProducts)
        // Step 2: Search filter
        if (searchQuery && searchQuery.trim()) {
            filtered = searchProducts(filtered, searchQuery, this.context.getText);
        }
        
        // Step 3: Price filter
        if (Number.isFinite(minPrice) && Number.isFinite(maxPrice)) {
            filtered = filterByPrice(filtered, minPrice, maxPrice);
        }

        // Step 4: Discount filter
        if (Number.isFinite(minDiscount) && Number.isFinite(maxDiscount)) {
            filtered = filterByDiscount(filtered, minDiscount, maxDiscount);
        }
        
        return filtered;
    };

    handleSearch = (searchQuery) => {
        const { products, minPrice, maxPrice, minDiscount, maxDiscount } = this.state;
        const safeProducts = Array.isArray(products) ? products : [];
        
        // Apply all filters with current price range
        const filtered = this.applyAllFilters(safeProducts, searchQuery, minPrice, maxPrice, minDiscount, maxDiscount);

        this.setState({ filteredProducts: filtered, searchQuery });
    };

    /**
     * Handle minimum price change
     */
    handleMinPriceChange = (newMin) => {
        const { products, maxPrice, searchQuery, minDiscount, maxDiscount } = this.state;
        const safeProducts = Array.isArray(products) ? products : [];
        
        // Validate
        if (!Number.isFinite(newMin) || newMin < 0) return;
        if (newMin > maxPrice) return;
        
        // Apply all filters with new min price
        const filtered = this.applyAllFilters(safeProducts, searchQuery, newMin, maxPrice, minDiscount, maxDiscount);
        
        this.setState({ 
            minPrice: newMin,
            filteredProducts: filtered 
        });
    };

    /**
     * Handle maximum price change
     */
    handleMaxPriceChange = (newMax) => {
        const { products, minPrice, searchQuery, minDiscount, maxDiscount } = this.state;
        const safeProducts = Array.isArray(products) ? products : [];
        
        // Validate
        if (!Number.isFinite(newMax) || newMax < 0) return;
        if (newMax < minPrice) return;
        
        // Apply all filters with new max price
        const filtered = this.applyAllFilters(safeProducts, searchQuery, minPrice, newMax, minDiscount, maxDiscount);
        
        this.setState({ 
            maxPrice: newMax,
            filteredProducts: filtered 
        });
    };

    /**
     * Handle price filter reset
     */
    handlePriceReset = () => {
        const { products, availableMinPrice, availableMaxPrice, searchQuery, minDiscount, maxDiscount } = this.state;
        const safeProducts = Array.isArray(products) ? products : [];
        
        // Reset to available range
        const filtered = this.applyAllFilters(safeProducts, searchQuery, availableMinPrice, availableMaxPrice, minDiscount, maxDiscount);
        
        this.setState({
            minPrice: availableMinPrice,
            maxPrice: availableMaxPrice,
            filteredProducts: filtered,
        });
    };

    togglePriceFilter = () => {
        this.setState((prevState) => ({ isPriceFilterOpen: !prevState.isPriceFilterOpen }));
    };

    toggleDiscountFilter = () => {
        this.setState((prevState) => ({ isDiscountFilterOpen: !prevState.isDiscountFilterOpen }));
    };

    handleMinDiscountChange = (newMin) => {
        const { products, maxDiscount, minPrice, maxPrice, searchQuery } = this.state;
        if (!Number.isFinite(newMin) || newMin < 0 || newMin > maxDiscount) return;
        const filtered = this.applyAllFilters(products, searchQuery, minPrice, maxPrice, newMin, maxDiscount);
        this.setState({ minDiscount: newMin, filteredProducts: filtered });
    };

    handleMaxDiscountChange = (newMax) => {
        const { products, minDiscount, minPrice, maxPrice, searchQuery, availableMaxDiscount } = this.state;
        if (!Number.isFinite(newMax) || newMax < minDiscount || newMax > availableMaxDiscount) return;
        const filtered = this.applyAllFilters(products, searchQuery, minPrice, maxPrice, minDiscount, newMax);
        this.setState({ maxDiscount: newMax, filteredProducts: filtered });
    };

    handleDiscountReset = () => {
        const { products, availableMinDiscount, availableMaxDiscount, minPrice, maxPrice, searchQuery } = this.state;
        const filtered = this.applyAllFilters(products, searchQuery, minPrice, maxPrice, availableMinDiscount, availableMaxDiscount);
        this.setState({
            minDiscount: availableMinDiscount,
            maxDiscount: availableMaxDiscount,
            filteredProducts: filtered,
        });
    };

    handleUpdateProduct = async (id, data) => {
        try {
            const response = await productService.updateProduct(id, data);
            await this.fetchProducts();
            return response?.product || null;
        } catch (err) {
            toast.error(err?.response?.data?.message || err?.message || 'Failed to update product');
            throw err;
        }
    };

    handleDeleteProduct = async (id) => {
        try {
            await productService.deleteProduct(id);
            toast.success(this.context.getText('deleteSuccess'));
            this.fetchProducts();
        } catch (err) {
            toast.error(this.context.getText('somethingWentWrong'));
        }
    };

    render() {
        const { getText } = this.context;
        const { activeCategory } = this.props;
        const { 
            filteredProducts, 
            products,
            loading, 
            error,
            minPrice,
            maxPrice,
            availableMinPrice,
            availableMaxPrice,
            isPriceFilterOpen,
            minDiscount,
            maxDiscount,
            availableMinDiscount,
            availableMaxDiscount,
            isDiscountFilterOpen,
        } = this.state;
        
        // Safety fallback: ensure filteredProducts is always an array
        const safeFilteredProducts = Array.isArray(filteredProducts) ? filteredProducts : [];
        const safeProducts = Array.isArray(products) ? products : [];

        const categoryKeys = {
            grains: 'grains',
            milk: 'milk',
            snacks: 'snacks',
            spices: 'spices',
            oils: 'oils',
            condiments: 'condiments',
            cleaning: 'cleaning',
            personal: 'personal',
        };

        const title = activeCategory && activeCategory !== 'ALL'
            ? getText(categoryKeys[activeCategory] || activeCategory)
            : getText('allProducts');

        // Show product count
        const displayCount = safeFilteredProducts.length;
        const totalCount = safeProducts.length;
        const countText = displayCount === totalCount 
            ? `${displayCount} ${getText('available')}`
            : `${displayCount} ${getText('available')} of ${totalCount}`;

        return (
            <div>
                <PageHeader>
                    <h1>{title}</h1>
                    <p>{countText}</p>
                </PageHeader>

                <SearchBar
                    onSearch={this.handleSearch}
                    actions={(
                        <>
                            <PriceFilterToggle
                                isOpen={isPriceFilterOpen}
                                minPrice={minPrice}
                                maxPrice={maxPrice}
                                availableMin={availableMinPrice}
                                availableMax={availableMaxPrice}
                                onToggle={this.togglePriceFilter}
                                disabled={loading || Boolean(error)}
                            />
                            <PriceFilterToggle
                                isOpen={isDiscountFilterOpen}
                                minPrice={minDiscount}
                                maxPrice={maxDiscount}
                                availableMin={availableMinDiscount}
                                availableMax={availableMaxDiscount}
                                onToggle={this.toggleDiscountFilter}
                                disabled={loading || Boolean(error)}
                                label="Discount Filter"
                                icon="🔥"
                                valuePrefix=""
                                valueSuffix="%"
                                panelId="discount-filter-panel"
                            />
                        </>
                    )}
                />

                {/* Price Filter Component */}
                {!loading && !error && (
                    <PriceRangeFilter
                        minPrice={minPrice}
                        maxPrice={maxPrice}
                        availableMin={availableMinPrice}
                        availableMax={availableMaxPrice}
                        onMinChange={this.handleMinPriceChange}
                        onMaxChange={this.handleMaxPriceChange}
                        onReset={this.handlePriceReset}
                        productsCount={displayCount}
                        disabled={loading}
                        isOpen={isPriceFilterOpen}
                    />
                )}

                {!loading && !error && (
                    <DiscountRangeFilter
                        minPrice={minDiscount}
                        maxPrice={maxDiscount}
                        availableMin={availableMinDiscount}
                        availableMax={availableMaxDiscount}
                        onMinChange={this.handleMinDiscountChange}
                        onMaxChange={this.handleMaxDiscountChange}
                        onReset={this.handleDiscountReset}
                        productsCount={displayCount}
                        disabled={loading}
                        isOpen={isDiscountFilterOpen}
                    />
                )}

                {loading && <Spinner fullPage text={getText('loading')} />}

                {error && (
                    <div className="alert alert-danger" role="alert">
                        {error}
                    </div>
                )}

                {!loading && !error && safeFilteredProducts.length === 0 && (
                    <EmptyState>
                        <div className="empty-icon">📦</div>
                        <h3>{getText('noResults')}</h3>
                        <p>
                            {safeProducts.length > 0
                                ? (minDiscount > 0 || maxDiscount < availableMaxDiscount
                                    ? 'No products found for this discount range.'
                                    : 'No products match your filters. Try adjusting the price range or search term.')
                                : getText('noItemsFound')}
                        </p>
                        {safeProducts.length > 0 && (minDiscount > 0 || maxDiscount < availableMaxDiscount) && (
                            <button type="button" onClick={this.handleDiscountReset}>Reset Discount Filter</button>
                        )}
                    </EmptyState>
                )}

                {!loading && !error && safeFilteredProducts.length > 0 && (
                    <div className="row g-3">
                        {safeFilteredProducts.map((product) => (
                            <div key={product.id} className="col-12 col-sm-6 col-lg-4 col-xl-3">
                                <ProductCard
                                    product={product}
                                    onUpdateProduct={this.handleUpdateProduct}
                                    onDeleteProduct={this.handleDeleteProduct}
                                />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }
}

export default ProductsPage;
