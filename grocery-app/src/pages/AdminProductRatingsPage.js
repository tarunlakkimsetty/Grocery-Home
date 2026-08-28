import React from 'react';
import { toast } from 'react-toastify';

import feedbackService from '../services/feedbackService';
import LanguageContext from '../context/LanguageContext';
import Spinner from '../components/Spinner';
import { PageHeader } from '../styledComponents/LayoutStyles';
import { TableWrapper, EmptyState, ModalOverlay, ModalContent } from '../styledComponents/FormStyles';
import { SecondaryButton } from '../styledComponents/ButtonStyles';

const renderStars = (avg) => {
    const n = Number(avg || 0);
    if (!Number.isFinite(n) || n <= 0) return '☆☆☆☆☆';
    const rounded = Math.round(n);
    const filled = Math.max(0, Math.min(5, rounded));
    return '★'.repeat(filled) + '☆'.repeat(5 - filled);
};

class AdminProductRatingsPage extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            loading: true,
            fetching: false,
            search: '',
            products: [],
            pagination: { page: 1, limit: 50, total: 0, totalPages: 0 },
            showModal: false,
            selectedProduct: null,
            productReviews: [],
            loadingReviews: false,
            visibility: { showRatingsToCustomers: true, showCommentsToCustomers: false },
            loadingVisibility: true,
            savingVisibility: false,
        };

        this._searchTimer = null;
    }

    componentDidMount() {
        this.fetchProducts('', true);
        this.fetchVisibilitySettings();
    }

    componentWillUnmount() {
        if (this._searchTimer) clearTimeout(this._searchTimer);
    }

    fetchProducts = async (search, isInitial = false) => {
        if (isInitial) {
            this.setState({ loading: true });
        } else {
            this.setState({ fetching: true });
        }

        try {
            const result = await feedbackService.getAdminProductRatings({ search, page: 1, limit: 100 });
            this.setState({
                products: Array.isArray(result?.data) ? result.data : [],
                pagination: result?.pagination || { page: 1, limit: 100, total: 0, totalPages: 0 },
                loading: false,
                fetching: false,
            });
        } catch (err) {
            this.setState({ loading: false, fetching: false });
            toast.error(err?.message || 'Failed to load product ratings');
        }
    };

    fetchVisibilitySettings = async () => {
        try {
            const visibility = await feedbackService.getVisibilitySettings();
            this.setState({ visibility, loadingVisibility: false });
        } catch (err) {
            this.setState({ loadingVisibility: false });
            toast.error(err?.message || 'Failed to load customer visibility settings');
        }
    };

    updateVisibility = async (field) => {
        const visibility = { ...this.state.visibility, [field]: !this.state.visibility[field] };
        this.setState({ visibility, savingVisibility: true });
        try {
            const saved = await feedbackService.updateVisibilitySettings(visibility);
            this.setState({ visibility: saved, savingVisibility: false });
            toast.success('Customer visibility updated');
        } catch (err) {
            this.setState({ savingVisibility: false });
            toast.error(err?.message || 'Failed to update customer visibility');
        }
    };

    handleSearchChange = (event) => {
        const search = event?.target?.value || '';
        this.setState({ search });

        if (this._searchTimer) clearTimeout(this._searchTimer);
        this._searchTimer = setTimeout(() => {
            this.fetchProducts(search, false);
        }, 250);
    };

    openReviews = async (product) => {
        this.setState({ showModal: true, selectedProduct: product, loadingReviews: true, productReviews: [] });
        try {
            const result = await feedbackService.getAdminProductReviews(product.product_id, { page: 1, limit: 100 });
            this.setState({ productReviews: Array.isArray(result?.data) ? result.data : [], loadingReviews: false });
        } catch (err) {
            this.setState({ loadingReviews: false });
            toast.error(err?.message || 'Failed to load product reviews');
        }
    };

    closeReviews = () => {
        this.setState({ showModal: false, selectedProduct: null, productReviews: [], loadingReviews: false });
    };

    formatDate = (value) => {
        if (!value) return '-';
        const d = new Date(value);
        if (Number.isNaN(d.getTime())) return '-';
        return (
            d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) +
            ' | ' +
            d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
        );
    };

    render() {
        if (this.state.loading) {
            return <Spinner fullPage text="Loading product ratings..." />;
        }

        const products = Array.isArray(this.state.products) ? this.state.products : [];

        return (
            <LanguageContext.Consumer>
                {(langCtx) => (
                    <div>
                        <PageHeader>
                            <h1>⭐ {langCtx.getText('productRatings')}</h1>
                            <p>{langCtx.getText('customerProductRatingsSubtitle')}</p>
                        </PageHeader>

                        <div className="card mb-3" style={{ border: '1px solid #e5e7eb' }}>
                            <div className="card-body">
                                <h3 className="h5 mb-1">Customer Visibility</h3>
                                <p className="text-muted small mb-3">Control which product feedback customers can see.</p>
                                {this.state.loadingVisibility ? <Spinner text="Loading visibility settings..." /> : (
                                    <div className="d-flex flex-column gap-3">
                                        <label className="d-flex align-items-center justify-content-between gap-3 mb-0">
                                            <span><strong>⭐ Show Ratings to Customers</strong><small className="d-block text-muted">Controls whether customers can see product ratings.</small></span>
                                            <input type="checkbox" role="switch" checked={Boolean(this.state.visibility.showRatingsToCustomers)} disabled={this.state.savingVisibility} onChange={() => this.updateVisibility('showRatingsToCustomers')} />
                                        </label>
                                        <label className="d-flex align-items-center justify-content-between gap-3 mb-0">
                                            <span><strong>💬 Show Comments to Customers</strong><small className="d-block text-muted">Controls whether customers can see product comments/reviews.</small></span>
                                            <input type="checkbox" role="switch" checked={Boolean(this.state.visibility.showCommentsToCustomers)} disabled={this.state.savingVisibility} onChange={() => this.updateVisibility('showCommentsToCustomers')} />
                                        </label>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="mb-3">
                            <input
                                type="text"
                                className="form-control"
                                placeholder={langCtx.getText('searchProductsPlaceholder')}
                                value={this.state.search}
                                onChange={this.handleSearchChange}
                            />
                        </div>

                        {this.state.fetching && (
                            <div className="alert alert-light py-2">Refreshing...</div>
                        )}

                        {products.length === 0 ? (
                            <EmptyState>
                                <div className="empty-icon">⭐</div>
                                <h3>{langCtx.getText('productRatings')}</h3>
                                <p>{langCtx.getText('noRatedProductsFound')}</p>
                            </EmptyState>
                        ) : (
                            <TableWrapper>
                                <table className="table align-middle">
                                    <thead>
                                        <tr>
                                            <th>Product</th>
                                            <th>Category</th>
                                            <th className="text-center">{langCtx.getText('averageRating')}</th>
                                            <th className="text-center">{langCtx.getText('totalRatings')}</th>
                                            <th className="text-center">{langCtx.getText('reviews')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {products.map((product) => {
                                            const avg = Number(product.average_rating || 0);
                                            const count = Number(product.rating_count || 0);
                                            return (
                                                <tr key={product.product_id}>
                                                    <td>
                                                        <div className="fw-semibold">
                                                            <span style={{ marginRight: '0.45rem' }}>{product.product_emoji || '📦'}</span>
                                                            {product.product_name}
                                                        </div>
                                                    </td>
                                                    <td>{product.product_category || '-'}</td>
                                                    <td className="text-center">
                                                        <div style={{ color: '#f59e0b', fontWeight: 800 }}>{renderStars(avg)}</div>
                                                        <div style={{ fontWeight: 700 }}>{avg.toFixed(1)} / 5</div>
                                                    </td>
                                                    <td className="text-center fw-bold">{count}</td>
                                                    <td className="text-center">
                                                        <SecondaryButton type="button" onClick={() => this.openReviews(product)}>
                                                            {langCtx.getText('viewReviews')}
                                                        </SecondaryButton>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </TableWrapper>
                        )}

                        {this.state.showModal && (
                            <ModalOverlay onClick={this.closeReviews}>
                                <ModalContent style={{ maxWidth: '900px', width: '100%' }} onClick={(e) => e.stopPropagation()}>
                                    <div className="modal-header">
                                        <h3>
                                            {this.state.selectedProduct?.product_emoji || '📦'} {this.state.selectedProduct?.product_name || 'Product'} Reviews
                                        </h3>
                                        <button className="close-btn" onClick={this.closeReviews} type="button" aria-label="Close">
                                            ×
                                        </button>
                                    </div>

                                    <div className="modal-body">
                                        {this.state.loadingReviews ? (
                                            <Spinner text="Loading reviews..." />
                                        ) : this.state.productReviews.length === 0 ? (
                                            <div className="text-muted">No reviews found.</div>
                                        ) : (
                                            <TableWrapper>
                                                <table className="table align-middle">
                                                    <thead>
                                                        <tr>
                                                            <th>{langCtx.getText('customerLabel')}</th>
                                                            <th className="text-center">Rating</th>
                                                            <th>Comment</th>
                                                            <th>{langCtx.getText('orderLabel')}</th>
                                                            <th>{langCtx.getText('dateLabel')}</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {this.state.productReviews.map((review) => (
                                                            <tr key={review.id}>
                                                                <td>{review.customer_name || `Customer #${review.customer_id}`}</td>
                                                                <td className="text-center">
                                                                    <span style={{ color: '#f59e0b', fontWeight: 800 }}>
                                                                        {'★'.repeat(Math.max(0, Math.min(5, Number(review.rating || 0))))}
                                                                        {'☆'.repeat(5 - Math.max(0, Math.min(5, Number(review.rating || 0))))}
                                                                    </span>
                                                                    <div className="small">{Number(review.rating || 0)} / 5</div>
                                                                </td>
                                                                <td>{String(review.comment || '').trim() ? review.comment : <span className="text-muted">{langCtx.getText('noComment')}</span>}</td>
                                                                <td>#{review.order_id}</td>
                                                                <td>{this.formatDate(review.created_at)}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </TableWrapper>
                                        )}
                                    </div>
                                </ModalContent>
                            </ModalOverlay>
                        )}
                    </div>
                )}
            </LanguageContext.Consumer>
        );
    }
}

export default AdminProductRatingsPage;
