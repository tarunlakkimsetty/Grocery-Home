import React from 'react';
import styled from 'styled-components';
import { toast } from 'react-toastify';

import AuthContext from '../context/AuthContext';
import LanguageContext from '../context/LanguageContext';
import feedbackService from '../services/feedbackService';
import { ModalOverlay, ModalContent } from '../styledComponents/FormStyles';
import { PrimaryButton, SecondaryButton } from '../styledComponents/ButtonStyles';

const Wrap = styled.div`
    .modal-header {
        background: #1e3a8a;
        color: #ffffff;
    }

    .modal-header h3 {
        color: #ffffff;
    }

    .close-btn {
        color: rgba(255, 255, 255, 0.9);
    }
`;

const Hint = styled.div`
    color: #4b5563;
    font-size: 0.9rem;
    margin-bottom: 0.8rem;
`;

const OrderBlock = styled.div`
    border: 1px solid #e5e7eb;
    border-radius: 10px;
    margin-bottom: 0.9rem;
    overflow: hidden;
`;

const OrderHead = styled.div`
    background: #f8fafc;
    color: #334155;
    padding: 0.55rem 0.75rem;
    font-size: 0.88rem;
    font-weight: 700;
`;

const ProductRow = styled.div`
    display: grid;
    grid-template-columns: auto 1fr auto;
    gap: 0.7rem;
    align-items: center;
    padding: 0.7rem 0.75rem;
    border-top: 1px solid #f1f5f9;

    @media (max-width: 768px) {
        grid-template-columns: 1fr;
        gap: 0.55rem;
    }
`;

const ProductIcon = styled.div`
    width: 34px;
    height: 34px;
    border-radius: 10px;
    background: #f1f5f9;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 1.1rem;
`;

const ProductMeta = styled.div`
    min-width: 0;

    .name {
        font-weight: 700;
        color: #0f172a;
        line-height: 1.2;
    }

    .sub {
        color: #64748b;
        font-size: 0.82rem;
        margin-top: 0.1rem;
    }
`;

const StarsRow = styled.div`
    display: flex;
    align-items: center;
    gap: 0.15rem;
`;

const StarButton = styled.button`
    border: none;
    background: transparent;
    color: ${(p) => (p.$active ? '#fbbf24' : '#cbd5e1')};
    font-size: 1.35rem;
    line-height: 1;
    padding: 0 0.05rem;
    cursor: pointer;
    transition: color 120ms ease, transform 120ms ease;

    &:hover {
        transform: translateY(-1px);
    }
`;

const TextArea = styled.textarea`
    width: 100%;
    min-height: 90px;
    border: 1px solid #d1d5db;
    border-radius: 10px;
    padding: 0.65rem 0.75rem;
    resize: vertical;
    outline: none;
    font-size: 0.94rem;

    &:focus {
        border-color: #2563eb;
        box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
    }
`;

const FooterActions = styled.div`
    display: flex;
    justify-content: flex-end;
    gap: 0.65rem;
    margin-top: 1rem;

    @media (max-width: 576px) {
        flex-direction: column-reverse;

        button {
            width: 100%;
        }
    }
`;

const getSignature = (orders) => {
    const rows = Array.isArray(orders) ? orders : [];
    const keys = [];
    rows.forEach((order) => {
        const orderId = Number(order?.orderId || 0);
        const products = Array.isArray(order?.products) ? order.products : [];
        products.forEach((p) => {
            const productId = Number(p?.productId || 0);
            if (orderId > 0 && productId > 0) {
                keys.push(`${orderId}:${productId}`);
            }
        });
    });
    keys.sort();
    return keys.join('|');
};

class FeedbackManager extends React.Component {
    static contextType = AuthContext;

    constructor(props) {
        super(props);
        this.state = {
            loading: false,
            submitting: false,
            pendingOrders: [],
            ratings: {},
            comment: '',
            open: false,
        };

        this._isMounted = false;
        this._lastFetchKey = '';
        this.languageContext = null;
    }

    componentDidMount() {
        this._isMounted = true;
        this.maybeLoad();
    }

    componentDidUpdate(prevProps) {
        if (prevProps.active !== this.props.active) {
            this.maybeLoad();
            return;
        }

        const prevAuth = `${prevProps.active}:${this.getAuthKey()}`;
        const nextAuth = `${this.props.active}:${this.getAuthKey()}`;
        if (prevAuth !== nextAuth) {
            this.maybeLoad();
        }
    }

    componentWillUnmount() {
        this._isMounted = false;
    }

    getAuthKey = () => {
        const { isAuthenticated, role, user } = this.context || {};
        const uid = Number(user?.id || 0) || 0;
        return `${Boolean(isAuthenticated)}:${String(role || '')}:${uid}`;
    };

    isDismissed = (userId, signature) => {
        if (!userId || !signature) return false;
        return localStorage.getItem(`ratings_popup_dismissed:${userId}:${signature}`) === '1';
    };

    dismiss = (userId, signature) => {
        if (!userId || !signature) return;
        localStorage.setItem(`ratings_popup_dismissed:${userId}:${signature}`, '1');
    };

    maybeLoad = async () => {
        const { active } = this.props;
        const { isAuthenticated, role, user } = this.context || {};

        if (!active || !isAuthenticated || String(role || '').toLowerCase() !== 'customer') {
            if (this._isMounted) {
                this.setState({ open: false, pendingOrders: [], ratings: {}, comment: '' });
            }
            return;
        }

        const key = `${this.getAuthKey()}:${active}`;
        if (key === this._lastFetchKey) return;
        this._lastFetchKey = key;

        await this.fetchPendingProducts(Number(user?.id || 0));
    };

    fetchPendingProducts = async (userId) => {
        this.setState({ loading: true });
        try {
            const pendingOrders = await feedbackService.getPendingProducts();
            if (!this._isMounted) return;

            const signature = getSignature(pendingOrders);
            const hasAny = Array.isArray(pendingOrders) && pendingOrders.some((o) => Array.isArray(o?.products) && o.products.length > 0);
            const shouldOpen = hasAny && !this.isDismissed(userId, signature);

            this.setState({
                loading: false,
                pendingOrders: Array.isArray(pendingOrders) ? pendingOrders : [],
                ratings: {},
                comment: '',
                open: shouldOpen,
            });
        } catch (err) {
            if (!this._isMounted) return;
            this.setState({ loading: false, open: false });
            const msg = err?.message || 'Failed to load pending product ratings';
            if (!String(msg).toLowerCase().includes('session expired')) {
                toast.error(msg);
            }
        }
    };

    setRating = (orderId, productId, rating) => {
        const key = `${orderId}:${productId}`;
        const r = Number(rating);
        if (!Number.isInteger(r) || r < 1 || r > 5) return;
        this.setState((prev) => ({
            ratings: {
                ...prev.ratings,
                [key]: r,
            },
        }));
    };

    handleClose = () => {
        const userId = Number(this.context?.user?.id || 0) || 0;
        const signature = getSignature(this.state.pendingOrders);
        this.dismiss(userId, signature);
        this.setState({ open: false });
    };

    handleSubmit = async () => {
        const items = [];
        const orders = Array.isArray(this.state.pendingOrders) ? this.state.pendingOrders : [];

        orders.forEach((order) => {
            const orderId = Number(order?.orderId || 0);
            const products = Array.isArray(order?.products) ? order.products : [];
            products.forEach((product) => {
                const productId = Number(product?.productId || 0);
                const key = `${orderId}:${productId}`;
                const rating = Number(this.state.ratings[key] || 0);
                if (orderId > 0 && productId > 0 && Number.isInteger(rating) && rating >= 1 && rating <= 5) {
                    items.push({ orderId, productId, rating });
                }
            });
        });

        this.setState({ submitting: true });
        try {
            const response = await feedbackService.submitProductRatings({
                items,
                comment: this.state.comment,
            });

            const inserted = Number(response?.data?.insertedCount || 0);
            if (inserted > 0) {
                toast.success(this.languageContext?.getText('productRatingsSaved') || 'Product ratings saved successfully');
            } else {
                toast.info(this.languageContext?.getText('noRatingsSelectedInfo') || 'No ratings selected. You can continue shopping.');
            }

            this.handleClose();
            await this.fetchPendingProducts(Number(this.context?.user?.id || 0));
        } catch (err) {
            toast.error(err?.message || 'Failed to submit product ratings');
        } finally {
            if (this._isMounted) {
                this.setState({ submitting: false });
            }
        }
    };

    renderStars = (orderId, productId) => {
        const selected = Number(this.state.ratings[`${orderId}:${productId}`] || 0);

        return (
            <StarsRow>
                {[1, 2, 3, 4, 5].map((n) => (
                    <StarButton
                        key={n}
                        type="button"
                        $active={selected >= n}
                        onClick={() => this.setRating(orderId, productId, n)}
                        aria-label={`${n} star`}
                    >
                        ★
                    </StarButton>
                ))}
            </StarsRow>
        );
    };

    render() {
        if (!this.props.active) return null;
        if (!this.state.open) return null;

        const pendingOrders = Array.isArray(this.state.pendingOrders) ? this.state.pendingOrders : [];

        return (
            <LanguageContext.Consumer>
                {(langCtx) => {
                    this.languageContext = langCtx;
                    return (
                        <Wrap>
                            <ModalOverlay onClick={this.handleClose}>
                                <ModalContent style={{ maxWidth: '760px', width: '100%' }} onClick={(e) => e.stopPropagation()}>
                                    <div className="modal-header">
                                        <h3>{langCtx.getText('ratePurchasedProductsTitle')}</h3>
                                        <button className="close-btn" onClick={this.handleClose} aria-label="Close" type="button">
                                            ×
                                        </button>
                                    </div>

                                    <div className="modal-body">
                                        <Hint>{langCtx.getText('ratingAndCommentOptional')}</Hint>

                            {pendingOrders.map((order) => (
                                <OrderBlock key={order.orderId}>
                                    <OrderHead>
                                        Order #{order.orderId} • {order.orderType || '-'}
                                    </OrderHead>

                                    {(Array.isArray(order.products) ? order.products : []).map((product) => (
                                        <ProductRow key={`${order.orderId}:${product.productId}`}>
                                            <ProductIcon>{product.productEmoji || '📦'}</ProductIcon>

                                            <ProductMeta>
                                                <div className="name">{product.productName || `Product #${product.productId}`}</div>
                                                <div className="sub">
                                                    {product.productCategory || '-'} • Qty {Number(product.quantityPurchased || 0)}
                                                </div>
                                            </ProductMeta>

                                            {this.renderStars(order.orderId, product.productId)}
                                        </ProductRow>
                                    ))}
                                </OrderBlock>
                            ))}

                                        <div style={{ marginTop: '0.5rem' }}>
                                            <label className="form-label fw-semibold">Comment ({langCtx.getText('optional')})</label>
                                            <TextArea
                                                value={this.state.comment}
                                                onChange={(e) => this.setState({ comment: e.target.value })}
                                                placeholder="Share your experience (optional)"
                                            />
                                        </div>

                                        <FooterActions>
                                            <SecondaryButton type="button" onClick={this.handleClose} disabled={this.state.submitting || this.state.loading}>
                                                {langCtx.getText('close')}
                                            </SecondaryButton>
                                            <PrimaryButton type="button" onClick={this.handleSubmit} disabled={this.state.submitting || this.state.loading}>
                                                {this.state.submitting ? `${langCtx.getText('save')}...` : langCtx.getText('saveFeedback')}
                                            </PrimaryButton>
                                        </FooterActions>
                                    </div>
                                </ModalContent>
                            </ModalOverlay>
                        </Wrap>
                    );
                }}
            </LanguageContext.Consumer>
        );
    }
}

export default FeedbackManager;
