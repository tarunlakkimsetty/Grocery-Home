import React from 'react';
import ProductCard from '../components/ProductCard';
import SearchBar from '../components/SearchBar';
import Spinner from '../components/Spinner';
import AuthContext from '../context/AuthContext';
import { toast } from 'react-toastify';
import { PageHeader } from '../styledComponents/LayoutStyles';
import { EmptyState } from '../styledComponents/FormStyles';
import productService from '../services/productService';
import { searchProducts } from '../utils/searchUtils';
import { getRecentViewedProducts } from '../utils/customerCollections';

class RecentlyViewedPage extends React.Component {
    static contextType = AuthContext;

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

    fetchProducts = async () => {
        this.setState({ loading: true, error: null });
        try {
            const response = await productService.getProducts();
            const products = Array.isArray(response)
                ? response
                : (response?.data || response?.products || []);
            const safeProducts = Array.isArray(products) ? products : [];
            const recentIds = getRecentViewedProducts(this.context?.user?.id ?? null);
            const recentProducts = safeProducts.filter((product) => recentIds.includes(Number(product.id)));
            const filteredProducts = this.state.searchQuery.trim()
                ? searchProducts(recentProducts, this.state.searchQuery, this.context?.getText || (() => ''))
                : recentProducts;

            this.setState({ products: recentProducts, filteredProducts, loading: false });
        } catch (error) {
            console.error('Failed to fetch recent products:', error);
            this.setState({ loading: false, error: 'Unable to load your recent items.' });
            toast.error('Unable to load your recent items.');
        }
    };

    handleSearch = (searchQuery) => {
        const { products } = this.state;
        const filteredProducts = searchQuery.trim()
            ? searchProducts(products, searchQuery, this.context?.getText || (() => ''))
            : products;

        this.setState({ filteredProducts, searchQuery });
    };

    render() {
        const { getText } = this.context || {};
        const { filteredProducts, loading, error } = this.state;

        if (loading) {
            return <Spinner fullPage text={getText?.('loading') || 'Loading recently viewed products...'} />;
        }

        return (
            <div>
                <PageHeader>
                    <h1>👀 Recently Viewed</h1>
                    <p>Quickly jump back to products you recently checked out</p>
                </PageHeader>

                <div className="mt-3 mb-3">
                    <SearchBar onSearch={this.handleSearch} />
                </div>

                {error && <div className="alert alert-danger">{error}</div>}

                {!loading && !error && filteredProducts.length === 0 && (
                    <EmptyState>
                        <h3>No recent products</h3>
                        <p>Browse the catalog and your recently viewed items will appear here.</p>
                    </EmptyState>
                )}

                {!loading && !error && filteredProducts.length > 0 && (
                    <div className="row g-3 mt-2">
                        {filteredProducts.map((product) => (
                            <div key={product.id || product.product_id} className="col-12 col-sm-6 col-lg-4 col-xl-3">
                                <ProductCard product={product} />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }
}

export default RecentlyViewedPage;
