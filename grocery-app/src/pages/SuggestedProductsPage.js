import React from 'react';
import suggestedProductsService from '../services/suggestedProductsService';
import ProductCard from '../components/ProductCard';
import SearchBar from '../components/SearchBar';
import Spinner from '../components/Spinner';
import LanguageContext from '../context/LanguageContext';
import SuggestedProductsContext from '../context/SuggestedProductsContext';
import { toast } from 'react-toastify';
import { PageHeader } from '../styledComponents/LayoutStyles';
import { EmptyState } from '../styledComponents/FormStyles';
import { searchProducts } from '../utils/searchUtils';

class SuggestedProductsPage extends React.Component {
    static contextType = LanguageContext;

    constructor(props) {
        super(props);
        this.state = {
            suggestedProducts: [],
            filteredProducts: [],
            loading: true,
            error: null,
            searchQuery: '',
            categoryFilter: 'All'
        };
    }

    componentDidMount() {
        this.fetchSuggestedProducts();
    }

    componentDidUpdate(prevProps) {
        const prevIds = Array.from(prevProps.suggestedCtx?.suggestedProductIds || []).sort((a, b) => a - b).join(',');
        const nextIds = Array.from(this.props.suggestedCtx?.suggestedProductIds || []).sort((a, b) => a - b).join(',');

        if (prevIds !== nextIds) {
            this.fetchSuggestedProducts();
        }
    }

    fetchSuggestedProducts = async () => {
        this.setState({ loading: true, error: null });
        try {
            const response = await suggestedProductsService.getSuggestedProducts();
            const suggestedProducts = response?.suggestedProducts || [];
            const safeProducts = Array.isArray(suggestedProducts) ? suggestedProducts : [];
            const query = this.state.searchQuery || '';
            const filteredProducts = this.applyFilters(safeProducts, query, this.state.categoryFilter);

            this.setState({ suggestedProducts: safeProducts, filteredProducts, loading: false });
        } catch (error) {
            console.error('Failed to fetch suggested products:', error);
            this.setState({ loading: false, error: 'Unable to load suggested products' });
            toast.error('Unable to load suggested products');
        }
    };

    applyFilters = (products, searchQuery, categoryFilter) => {
        const safeProducts = Array.isArray(products) ? products : [];
        const filteredBySearch = searchQuery.trim()
            ? searchProducts(safeProducts, searchQuery, this.context.getText)
            : safeProducts;

        if (!categoryFilter || categoryFilter === 'All') {
            return filteredBySearch;
        }

        return filteredBySearch.filter((product) => (product.category || '').toLowerCase() === categoryFilter.toLowerCase());
    };

    handleSearch = (searchQuery) => {
        const { suggestedProducts, categoryFilter } = this.state;
        const safeProducts = Array.isArray(suggestedProducts) ? suggestedProducts : [];
        const filteredProducts = this.applyFilters(safeProducts, searchQuery, categoryFilter);

        this.setState({ filteredProducts, searchQuery });
    };

    handleCategoryChange = (e) => {
        const categoryFilter = e.target.value;
        const { suggestedProducts, searchQuery } = this.state;
        const safeProducts = Array.isArray(suggestedProducts) ? suggestedProducts : [];
        const filteredProducts = this.applyFilters(safeProducts, searchQuery, categoryFilter);

        this.setState({ filteredProducts, categoryFilter });
    };

    render() {
        const { getText } = this.context;
        const { filteredProducts, loading, error, categoryFilter, suggestedProducts } = this.state;
        const categories = ['All', ...new Set((suggestedProducts || []).map((product) => product.category).filter(Boolean))];

        if (loading) {
            return <Spinner fullPage text={getText('loading')} />;
        }

        return (
            <div>
                <PageHeader>
                    <h1>🌟 Suggested Products</h1>
                    <p>Products recommended by the admin</p>
                </PageHeader>

                <div className="d-flex flex-wrap gap-2 mt-3 mb-3 align-items-center">
                    <SearchBar onSearch={this.handleSearch} />
                    <select className="form-select" style={{ maxWidth: '220px' }} value={categoryFilter} onChange={this.handleCategoryChange}>
                        {categories.map((category) => (
                            <option key={category} value={category}>{category === 'All' ? 'All Categories' : category}</option>
                        ))}
                    </select>
                </div>

                {error && <div className="alert alert-danger">{error}</div>}

                {!loading && !error && filteredProducts.length === 0 && (
                    <EmptyState>
                        <h3>No suggested products</h3>
                        <p>Nothing is suggested by the admin right now.</p>
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

const SuggestedProductsPageWithContext = (props) => (
    <SuggestedProductsContext.Consumer>
        {(suggestedCtx) => <SuggestedProductsPage {...props} suggestedCtx={suggestedCtx} />}
    </SuggestedProductsContext.Consumer>
);

export default SuggestedProductsPageWithContext;
