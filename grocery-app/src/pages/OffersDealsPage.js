import React from 'react';
import ProductCard from '../components/ProductCard';
import SearchBar from '../components/SearchBar';
import Spinner from '../components/Spinner';
import LanguageContext from '../context/LanguageContext';
import { toast } from 'react-toastify';
import { PageHeader } from '../styledComponents/LayoutStyles';
import { EmptyState } from '../styledComponents/FormStyles';
import productService from '../services/productService';
import { searchProducts } from '../utils/searchUtils';
import { getOfferProducts } from '../utils/customerCollections';

class OffersDealsPage extends React.Component {
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

    fetchProducts = async () => {
        this.setState({ loading: true, error: null });
        try {
            const response = await productService.getProducts();
            const products = Array.isArray(response)
                ? response
                : (response?.data || response?.products || []);
            const safeProducts = Array.isArray(products) ? products : [];
            const offerProducts = getOfferProducts(safeProducts);
            const filteredProducts = this.state.searchQuery.trim()
                ? searchProducts(offerProducts, this.state.searchQuery, this.context.getText)
                : offerProducts;

            this.setState({ products: offerProducts, filteredProducts, loading: false });
        } catch (error) {
            console.error('Failed to fetch offers:', error);
            this.setState({ loading: false, error: 'Unable to load offers right now.' });
            toast.error('Unable to load offers right now.');
        }
    };

    handleSearch = (searchQuery) => {
        const { products } = this.state;
        const filteredProducts = searchQuery.trim()
            ? searchProducts(products, searchQuery, this.context.getText)
            : products;

        this.setState({ filteredProducts, searchQuery });
    };

    render() {
        const { getText } = this.context;
        const { filteredProducts, loading, error } = this.state;

        if (loading) {
            return <Spinner fullPage text={getText('loading') || 'Loading offers...'} />;
        }

        return (
            <div>
                <PageHeader>
                    <h1>🔥 Offers & Deals</h1>
                    <p>Special discounts and free offers available right now</p>
                </PageHeader>

                <div className="mt-3 mb-3">
                    <SearchBar onSearch={this.handleSearch} />
                </div>

                {error && <div className="alert alert-danger">{error}</div>}

                {!loading && !error && filteredProducts.length === 0 && (
                    <EmptyState>
                        <h3>No offers available</h3>
                        <p>Check back soon for fresh savings and free item deals.</p>
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

export default OffersDealsPage;
