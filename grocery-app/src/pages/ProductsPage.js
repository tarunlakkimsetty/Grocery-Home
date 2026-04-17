import React from 'react';
import productService from '../services/productService';
import ProductCard from '../components/ProductCard';
import SearchBar from '../components/SearchBar';
import Spinner from '../components/Spinner';
import LanguageContext from '../context/LanguageContext';
import { toast } from 'react-toastify';
import { PageHeader } from '../styledComponents/LayoutStyles';
import { EmptyState } from '../styledComponents/FormStyles';
import { searchProducts } from '../utils/searchUtils';

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
            
            console.log('Fetched products:', products);

            const searchQuery = (this.state.searchQuery || '').trim();
            const safeProducts = Array.isArray(products) ? products : [];
            // Use enhanced search with Telugu and English support
            const filteredProducts = searchQuery
                ? searchProducts(safeProducts, searchQuery, this.context.getText)
                : safeProducts;

            this.setState({ products: safeProducts, filteredProducts, loading: false });
        } catch (err) {
            this.setState({ error: 'Failed to load products', loading: false });
            toast.error('Failed to load products');
        }
    };

    handleSearch = (searchQuery) => {
        const { products } = this.state;
        const safeProducts = Array.isArray(products) ? products : [];
        
        if (!searchQuery.trim()) {
            this.setState({ filteredProducts: safeProducts, searchQuery: '' });
            return;
        }

        // Use enhanced search with Telugu and English support
        const filtered = searchProducts(safeProducts, searchQuery, this.context.getText);

        this.setState({ filteredProducts: filtered, searchQuery });
    };

    handleUpdateProduct = async (id, data) => {
        try {
            await productService.updateProduct(id, data);
            this.fetchProducts();
        } catch (err) {
            toast.error('Failed to update product');
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
        const { filteredProducts, loading, error } = this.state;
        
        // Safety fallback: ensure filteredProducts is always an array
        const safeFilteredProducts = Array.isArray(filteredProducts) ? filteredProducts : [];

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

        return (
            <div>
                <PageHeader>
                    <h1>{title}</h1>
                    <p>{safeFilteredProducts.length} {getText('available')}</p>
                </PageHeader>

                <SearchBar onSearch={this.handleSearch} />

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
                        <p>{getText('noItemsFound')}</p>
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
