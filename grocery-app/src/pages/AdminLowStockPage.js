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
import { getLowStockProducts, getLowStockThreshold } from '../utils/customerCollections';

class AdminLowStockPage extends React.Component {
    static contextType = LanguageContext;

    constructor(props) {
        super(props);
        this.state = {
            products: [],
            filteredProducts: [],
            loading: true,
            error: null,
            searchQuery: '',
            threshold: getLowStockThreshold(),
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
            const threshold = Number(this.state.threshold) || getLowStockThreshold();
            const lowStockProducts = getLowStockProducts(safeProducts, threshold);
            const filteredProducts = this.state.searchQuery.trim()
                ? searchProducts(lowStockProducts, this.state.searchQuery, this.context.getText)
                : lowStockProducts;

            this.setState({ products: lowStockProducts, filteredProducts, loading: false });
        } catch (error) {
            console.error('Failed to fetch low stock products:', error);
            this.setState({ loading: false, error: 'Unable to load low stock alerts.' });
            toast.error('Unable to load low stock alerts.');
        }
    };

    handleSearch = (searchQuery) => {
        const { products } = this.state;
        const filteredProducts = searchQuery.trim()
            ? searchProducts(products, searchQuery, this.context.getText)
            : products;

        this.setState({ filteredProducts, searchQuery });
    };

    handleThresholdChange = (event) => {
        const threshold = Number(event.target.value) || 0;
        localStorage.setItem('grocery_low_stock_threshold', String(threshold));
        this.setState({ threshold }, () => this.fetchProducts());
    };

    render() {
        const { getText } = this.context;
        const { filteredProducts, loading, error, threshold } = this.state;

        if (loading) {
            return <Spinner fullPage text={getText('loading') || 'Loading low stock alerts...'} />;
        }

        return (
            <div>
                <PageHeader>
                    <h1>⚠️ Low Stock Alerts</h1>
                    <p>Track items nearing the stock threshold</p>
                </PageHeader>

                <div className="d-flex flex-wrap gap-3 align-items-center mt-3 mb-3">
                    <SearchBar onSearch={this.handleSearch} />
                    <div className="d-flex align-items-center gap-2">
                        <label className="fw-semibold mb-0">Threshold</label>
                        <input
                            type="number"
                            min="0"
                            className="form-control"
                            style={{ maxWidth: '120px' }}
                            value={threshold}
                            onChange={this.handleThresholdChange}
                        />
                    </div>
                </div>

                {error && <div className="alert alert-danger">{error}</div>}

                {!loading && !error && filteredProducts.length === 0 && (
                    <EmptyState>
                        <h3>All stocked up</h3>
                        <p>No products are currently below the selected low stock threshold.</p>
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

export default AdminLowStockPage;
