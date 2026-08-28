import React from 'react';
import AuthContext from '../context/AuthContext';
import CartContext from '../context/CartContext';
import LanguageContext from '../context/LanguageContext';
import FavoritesContext from '../context/FavoritesContext';
import SuggestedProductsContext from '../context/SuggestedProductsContext';
import suggestedProductsService from '../services/suggestedProductsService';
import feedbackService from '../services/feedbackService';
import QuantityControl from './QuantityControl';
import Spinner from './Spinner';
import { validateQuantity, supportsDecimal } from '../utils/quantityValidator';
import formatQuantity from '../utils/quantityFormatter';
import { hasDiscount, getDiscountBadgeText, getSavingsText } from '../utils/pricingFormatter';
import { toast } from 'react-toastify';
import {
    ProductCardWrapper,
    CardImage,
    CardBody,
    CardActions,
    QuantitySection,
    ButtonSection,
    StockBadge,
} from '../styledComponents/CardStyles';
import { PrimaryButton, SecondaryButton, WarningButton, DangerButton } from '../styledComponents/ButtonStyles';
import { ModalOverlay, ModalContent } from '../styledComponents/FormStyles';
import { calculatePricing } from '../utils/pricing';
import { recordRecentlyViewedProduct } from '../utils/customerCollections';
import { getComparedProductIds, toggleComparedProduct } from '../utils/customerProfileStorage';

const CATEGORY_GRADIENTS = {
    grains: 'linear-gradient(135deg, #fff8e1, #ffecb3)',
    milk: 'linear-gradient(135deg, #e3f2fd, #bbdefb)',
    snacks: 'linear-gradient(135deg, #fce4ec, #f8bbd0)',
    spices: 'linear-gradient(135deg, #fff3e0, #ffe0b2)',
    oils: 'linear-gradient(135deg, #f1f8e9, #dcedc8)',
    condiments: 'linear-gradient(135deg, #fbe9e7, #ffccbc)',
    cleaning: 'linear-gradient(135deg, #e0f7fa, #b2ebf2)',
    personal: 'linear-gradient(135deg, #f3e5f5, #e1bee7)',
};

const CATEGORY_ICONS = {
    grains: '🌾',
    milk: '🥛',
    snacks: '🍿',
    spices: '🌶️',
    oils: '🍶',
    condiments: '🥫',
    cleaning: '🧼',
    personal: '🧴',
};

class ProductCard extends React.Component {
    static contextType = AuthContext;

    constructor(props) {
        super(props);
        const isWeightBased = supportsDecimal(props.product?.unit);
        this.state = {
            quantity: isWeightBased ? 0.1 : 1,
            showEditModal: false,
            editName: props.product.name,
            editOriginalPrice: props.product.originalPrice ?? props.product.price,
            editDiscountedPrice: props.product.discountedPrice ?? props.product.price,
            editStock: props.product.stock,
            editFreeItemName: props.product.freeItemName || '',
            editFreeItemQuantity: props.product.freeItemQuantity || '',
            editFreeItemUnit: props.product.freeItemUnit || '',
            editFreeItemDescription: props.product.freeItemDescription || '',
            editFreeItemActive: Boolean(props.product.freeItemActive),
            editErrors: {},
            showReviews: false,
            productReviews: [],
            loadingReviews: false,
        };
    }

    componentDidMount() {
        this.recordViewedProduct();
    }

    componentDidUpdate(prevProps) {
        if (prevProps.product?.id !== this.props.product?.id) {
            this.recordViewedProduct();
        }
    }

    recordViewedProduct = () => {
        const { product } = this.props;
        const { role, user } = this.context || {};
        if (role !== 'customer' || !product?.id) return;
        recordRecentlyViewedProduct(user?.id ?? null, product.id);
    };

    checkFavoriteStatus = async () => {
        // This method is no longer needed - favorites are managed by context
    };

    validateEdit = () => {
        const errors = {};

        const originalPrice = Number(this.state.editOriginalPrice);
        const discountedPrice = Number(this.state.editDiscountedPrice);
        if (!Number.isFinite(originalPrice) || originalPrice <= 0) {
            errors.price = 'Original price must be greater than 0';
        } else if (!Number.isFinite(discountedPrice) || discountedPrice <= 0 || discountedPrice > originalPrice) {
            errors.price = 'Discounted price must be greater than 0 and no more than original price';
        }

        const stockNum = Number(this.state.editStock);
        if (!Number.isFinite(stockNum) || stockNum < 0) {
            errors.stock = 'Stock cannot be less than 0';
        }

        this.setState({ editErrors: errors });
        return Object.keys(errors).length === 0;
    };

    handleToggleFavorite = async (langCtx, favCtx) => {
        try {
            const { product } = this.props;
            const isFavorited = favCtx.isFavorite(product.id);

            if (isFavorited) {
                // Remove from favorites
                await favCtx.removeFavorite(product.id);
                const translatedName = langCtx.getText(product.name) || product.name;
                const toast = require('react-toastify').toast;
                toast.success(`${translatedName} removed from favorites`);
            } else {
                // Add to favorites
                await favCtx.addFavorite(product.id);
                const translatedName = langCtx.getText(product.name) || product.name;
                const toast = require('react-toastify').toast;
                toast.success(`${translatedName} added to favorites ⭐`);
            }
        } catch (err) {
            console.error('Error toggling favorite:', err);
            const toast = require('react-toastify').toast;
            const errorMsg = err.response?.data?.message || 'Error updating favorites';
            toast.error(errorMsg);
        }
    };

    handleAddToCart = (cartCtx, langCtx) => {
        const { product } = this.props;
        const unit = product?.unit || '';
        
        // Validate quantity
        const validation = validateQuantity(this.state.quantity, {
            unit,
            stock: product.stock
        });
        
        if (!validation.isValid) {
            toast.error(validation.message);
            return;
        }
        
        const qty = validation.correctedValue;
        cartCtx.addToCart(product, qty);
        const translatedName = langCtx.getText(product.name) || product.name;
        toast.success(`${translatedName} ${langCtx.getText('addToCart')}🛒`);
        
        // Reset quantity to minimum
        const minQty = unit === 'kg' ? 0.1 : 1;
        this.setState({ quantity: minQty });
    };

    handleSaveEdit = async (langCtx) => {
        if (!this.validateEdit()) return;

        const { product, onUpdateProduct } = this.props;
        if (!onUpdateProduct) return;

        try {
            await onUpdateProduct(product.id, {
                    name: this.state.editName,
                    originalPrice: parseFloat(this.state.editOriginalPrice),
                    discountedPrice: parseFloat(this.state.editDiscountedPrice),
                    stock: parseInt(this.state.editStock),
                    freeItemName: this.state.editFreeItemName.trim() || null,
                    freeItemQuantity: this.state.editFreeItemQuantity === '' ? null : Number(this.state.editFreeItemQuantity),
                    freeItemUnit: this.state.editFreeItemUnit.trim() || null,
                    freeItemDescription: this.state.editFreeItemDescription.trim() || null,
                    freeItemActive: Boolean(this.state.editFreeItemActive && this.state.editFreeItemName.trim()),
                });
            this.setState({ showEditModal: false, editErrors: {} });
            toast.success(langCtx.getText('updateSuccess'));
        } catch {
            // The parent reports the authoritative API error; keep the modal open for correction.
        }
    };

    handleDeleteProduct = (langCtx) => {
        const { product, onDeleteProduct } = this.props;
        if (window.confirm(`${langCtx.getText('confirmDelete')}`)) {
            if (onDeleteProduct) {
                onDeleteProduct(product.id);
                toast.success(langCtx.getText('deleteSuccess'));
            }
        }
    };

    handleToggleSuggested = async (suggestedCtx) => {
        const { product } = this.props;
        const productId = Number(product.id);
        const isCurrentlySuggested = suggestedCtx?.isSuggested(productId) || false;

        if (suggestedCtx?.updateSuggestedProduct) {
            suggestedCtx.updateSuggestedProduct(productId, !isCurrentlySuggested);
        }

        try {
            if (isCurrentlySuggested) {
                await suggestedProductsService.removeSuggestedProduct(productId);
                toast.success('Suggestion removed');
            } else {
                await suggestedProductsService.addSuggestedProduct(productId);
                toast.success('Product marked as suggested');
            }
            await suggestedCtx.refreshSuggestedProducts();
        } catch (error) {
            if (suggestedCtx?.updateSuggestedProduct) {
                suggestedCtx.updateSuggestedProduct(productId, isCurrentlySuggested);
            }
            console.error('Error toggling suggestion:', error);
            toast.error(error?.message || 'Unable to update suggestion');
        }
    };

    openReviews = async () => {
        this.setState({ showReviews: true, loadingReviews: true, productReviews: [] });
        try {
            const result = await feedbackService.getCustomerProductReviews(this.props.product.id);
            this.setState({ productReviews: result.data, loadingReviews: false });
        } catch (error) {
            this.setState({ loadingReviews: false });
            toast.error(error?.message || 'Unable to load reviews');
        }
    };

    handleToggleCompare = () => {
        const { product } = this.props;
        const { role, user } = this.context || {};
        if (role !== 'customer' || !product?.id) return;

        const nextIds = toggleComparedProduct(user?.id ?? null, product.id);
        const isSelected = nextIds.includes(Number(product.id));
        toast.info(isSelected ? 'Added to comparison list' : 'Removed from comparison list');
        this.forceUpdate();
    };

    closeReviews = () => this.setState({ showReviews: false, productReviews: [], loadingReviews: false });

    formatReviewDate = (value) => {
        if (!value) return '';
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    render() {
        const { product } = this.props;
        const { role, user } = this.context || {};
        const isAdmin = role === 'admin';
        const isCompared = getComparedProductIds(user?.id ?? null).includes(Number(product.id));
        const gradient = CATEGORY_GRADIENTS[product.category] || CATEGORY_GRADIENTS.grains;
        const pricing = calculatePricing(product);

        return (
            <LanguageContext.Consumer>
                {(langCtx) => {
                    const translatedName = langCtx.getText(product.name) || product.name;
                    const inStockText = langCtx.getText('inStock');
                    const outOfStockText = langCtx.getText('outOfStock');

                    return (
                        <>
                            <ProductCardWrapper style={{ position: 'relative' }}>
                                {/* Suggestion control for admins and favorite star for customers */}
                                {isAdmin ? (
                                    <SuggestedProductsContext.Consumer>
                                        {(suggestedCtx) => {
                                            const isSuggested = suggestedCtx?.isSuggested(product.id) || false;
                                            return (
                                                <button
                                                    className="favorite-btn"
                                                    onClick={() => this.handleToggleSuggested(suggestedCtx)}
                                                    title={isSuggested ? 'Suggested Product' : 'Suggest Product'}
                                                    style={{
                                                        position: 'absolute',
                                                        top: '10px',
                                                        right: '10px',
                                                        background: isSuggested ? '#fff7b2' : 'rgba(255, 255, 255, 0.9)',
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
                                                        color: isSuggested ? '#f4b400' : '#444',
                                                    }}
                                                >
                                                    {isSuggested ? '★' : '☆'}
                                                </button>
                                            );
                                        }}
                                    </SuggestedProductsContext.Consumer>
                                ) : role === 'customer' && (
                                    <>
                                        <button
                                            className="favorite-btn"
                                            onClick={this.handleToggleCompare}
                                            title="Compare product"
                                            style={{
                                                position: 'absolute',
                                                top: '10px',
                                                right: '52px',
                                                background: isCompared ? '#dbeafe' : 'rgba(255, 255, 255, 0.9)',
                                                border: 'none',
                                                fontSize: '18px',
                                                cursor: 'pointer',
                                                padding: '6px 8px',
                                                borderRadius: '4px',
                                                zIndex: 10,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                minWidth: '32px',
                                                minHeight: '32px',
                                            }}
                                        >
                                            ⇄
                                        </button>
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
                                    </>
                                )}
                                <CardImage $bg={gradient} $inStock={product.stock > 0}>
                                    <span>{product.emoji || '📦'}</span>
                                    <span className="stock-badge">
                                        {product.stock > 0 ? `${product.stock} ${inStockText}` : outOfStockText}
                                    </span>
                                </CardImage>
                                <CardBody>
                                    <div className="card-title">
                                        <span className="card-category-icon">{CATEGORY_ICONS[product.category] || '📦'}</span>
                                        {translatedName}
                                    </div>
                                    <div className="card-category">{langCtx.getText(product.category)}</div>
                                    <div className="card-price">
                                        {hasDiscount(pricing.originalPrice, pricing.discountedPrice) && <span style={{ textDecoration: 'line-through', color: '#8a8a8a', fontSize: '0.85rem', marginRight: '0.4rem' }}>₹{pricing.originalPrice.toFixed(2)}</span>}
                                        <strong>₹{pricing.discountedPrice.toFixed(2)}</strong> <span className="unit">/{product.unit || 'unit'}</span>
                                    </div>
                                    {hasDiscount(pricing.originalPrice, pricing.discountedPrice) && (
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', alignItems: 'center', fontSize: '0.78rem' }}>
                                            <span style={{ background: '#fff0e6', color: '#c2410c', borderRadius: '999px', padding: '0.2rem 0.45rem', fontWeight: 800 }}>
                                                🔥 {getDiscountBadgeText(pricing.originalPrice, pricing.discountedPrice)}
                                            </span>
                                            <span style={{ color: '#15803d', fontWeight: 700 }}>
                                                {getSavingsText(pricing.originalPrice, pricing.discountedPrice)}
                                            </span>
                                        </div>
                                    )}
                                    {product.freeItemActive && product.freeItemName && (
                                        <div style={{ color: '#7c3aed', fontSize: '0.8rem', fontWeight: 700 }}>
                                            🎁 FREE: {product.freeItemQuantity ? `${formatQuantity(product.freeItemQuantity, product.freeItemUnit)} ` : ''}{product.freeItemName}
                                        </div>
                                    )}
                                    <div className="card-stock">
                                        {product.stock > 0 ? `${product.stock} ${inStockText}` : `❌ ${outOfStockText}`}
                                    </div>
                                    {!isAdmin && Number(product.rating_count || 0) > 0 && (
                                        <div style={{ color: '#f59e0b', fontWeight: 700, fontSize: '0.9rem' }}>
                                            {'★'.repeat(Math.max(0, Math.min(5, Math.round(Number(product.average_rating || 0)))))}
                                            {'☆'.repeat(5 - Math.max(0, Math.min(5, Math.round(Number(product.average_rating || 0)))))}
                                            <span style={{ color: '#4b5563', marginLeft: '0.35rem' }}>
                                                {Number(product.average_rating || 0).toFixed(1)} ({product.rating_count})
                                            </span>
                                        </div>
                                    )}
                                    {!isAdmin && Number(product.comment_count || 0) > 0 && (
                                        <button
                                            type="button"
                                            onClick={this.openReviews}
                                            style={{ background: 'none', border: 0, color: '#2563eb', padding: 0, textAlign: 'left', fontSize: '0.85rem', cursor: 'pointer' }}
                                        >
                                            💬 View {product.comment_count} Reviews
                                        </button>
                                    )}
                                </CardBody>
                                <CardActions>
                                    {isAdmin ? (
                                        <ButtonSection $adminMode={true}>
                                            <WarningButton
                                                onClick={() =>
                                                    this.setState({
                                                        showEditModal: true,
                                                        editName: product.name,
                                                        editOriginalPrice: product.originalPrice ?? product.price,
                                                        editDiscountedPrice: product.discountedPrice ?? product.price,
                                                        editStock: product.stock,
                                                        editFreeItemName: product.freeItemName || '', editFreeItemQuantity: product.freeItemQuantity || '', editFreeItemUnit: product.freeItemUnit || '', editFreeItemDescription: product.freeItemDescription || '', editFreeItemActive: Boolean(product.freeItemActive),
                                                        editErrors: {},
                                                    })
                                                }
                                            >
                                                ✏️ {langCtx.getText('edit')}
                                            </WarningButton>
                                            <DangerButton
                                                onClick={() => this.handleDeleteProduct(langCtx)}
                                            >
                                                🗑️ {langCtx.getText('delete')}
                                            </DangerButton>
                                        </ButtonSection>
                                    ) : (
                                        <>
                                            <CartContext.Consumer>
                                                {(cartCtx) => {
                                                    const unit = product?.unit || '';
                                                    // CRITICAL: Calculate available = stock - alreadyInCart
                                                    const alreadyInCart = (cartCtx.items || []).find(item => item.productId === product.id)?.quantity || 0;
                                                    const available = Math.max(0, product.stock - alreadyInCart);
                                                    const isOutOfStock = available <= 0;
                                                    const stockStatus = isOutOfStock ? 'outOfStock' : available <= 3 ? 'lowStock' : 'available';

                                                    return (
                                                        <>
                                                            {/* Quantity Section */}
                                                            <QuantitySection>
                                                                <label>📦 {unit || 'Quantity'}</label>
                                                                <QuantityControl
                                                                    value={this.state.quantity}
                                                                    onChange={(value) => this.setState({ quantity: value })}
                                                                    unit={unit}
                                                                    stock={available}
                                                                    disabled={isOutOfStock}
                                                                    title={supportsDecimal(unit) ? 'Enter weight' : 'Enter quantity'}
                                                                    showStockWarning={false}
                                                                    hideButtons={true}
                                                                />
                                                            </QuantitySection>

                                                            {/* Button Section */}
                                                            <ButtonSection $adminMode={false}>
                                                                <PrimaryButton
                                                                    onClick={() => this.handleAddToCart(cartCtx, langCtx)}
                                                                    disabled={isOutOfStock}
                                                                    title={isOutOfStock ? 'Out of stock' : 'Add to cart'}
                                                                >
                                                                    🛒 {langCtx.getText('addToCart')}
                                                                </PrimaryButton>
                                                            </ButtonSection>

                                                            {/* Stock Badge - Show ONLY available quantity */}
                                                            <StockBadge $status={stockStatus}>
                                                                {isOutOfStock
                                                                    ? `❌ ${outOfStockText}`
                                                                    : `Only ${available} available`}
                                                            </StockBadge>
                                                        </>
                                                    );
                                                }}
                                            </CartContext.Consumer>
                                        </>
                                    )}
                                </CardActions>
                            </ProductCardWrapper>

                            {/* Edit Modal for Admin */}
                            {this.state.showEditModal && (
                                <ModalOverlay onClick={() => this.setState({ showEditModal: false })}>
                                    <ModalContent onClick={(e) => e.stopPropagation()}>
                                        <div className="modal-header">
                                            <h3>{langCtx.getText('edit')}</h3>
                                            <button className="close-btn" onClick={() => this.setState({ showEditModal: false })}>×</button>
                                        </div>
                                        <div className="modal-body">
                                            <div className="mb-3">
                                                <label className="form-label fw-semibold">{langCtx.getText('productName')}</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    value={this.state.editName}
                                                    onChange={(e) => this.setState({ editName: e.target.value })}
                                                    placeholder={langCtx.getText('productName')}
                                                />
                                            </div>
                                            <div className="mb-3">
                                                    <label className="form-label fw-semibold">Original Price (₹)</label>
                                                <input
                                                    type="number"
                                                    className={`form-control ${this.state.editErrors?.price ? 'is-invalid' : ''}`}
                                                        value={this.state.editOriginalPrice}
                                                        onChange={(e) =>
                                                        this.setState({
                                                            editOriginalPrice: e.target.value,
                                                            editErrors: { ...this.state.editErrors, price: undefined },
                                                        })
                                                    }
                                                    min="0"
                                                    step="0.01"
                                                />
                                                {this.state.editErrors?.price && (
                                                    <div className="invalid-feedback">{this.state.editErrors.price}</div>
                                                )}
                                            </div>
                                            <div className="mb-3">
                                                <label className="form-label fw-semibold">Discounted Price (₹)</label>
                                                <input type="number" className="form-control" min="0.01" step="0.01" value={this.state.editDiscountedPrice} onChange={(e) => this.setState({ editDiscountedPrice: e.target.value })} />
                                                {calculatePricing({ originalPrice: this.state.editOriginalPrice, discountedPrice: this.state.editDiscountedPrice }).discountAmount > 0 && <small className="text-success fw-semibold">Save ₹{calculatePricing({ originalPrice: this.state.editOriginalPrice, discountedPrice: this.state.editDiscountedPrice }).discountAmount.toFixed(2)} ({calculatePricing({ originalPrice: this.state.editOriginalPrice, discountedPrice: this.state.editDiscountedPrice }).discountPercentage}% OFF)</small>}
                                            </div>
                                            <div className="border rounded p-3 mb-3">
                                                <div className="form-check mb-2"><input className="form-check-input" type="checkbox" checked={this.state.editFreeItemActive} onChange={(e) => this.setState({ editFreeItemActive: e.target.checked })} id={`freeItem-${product.id}`} /><label className="form-check-label fw-semibold" htmlFor={`freeItem-${product.id}`}>🎁 Free Item / Offer</label></div>
                                                {this.state.editFreeItemActive && <div className="row g-2"><div className="col-6"><input className="form-control" value={this.state.editFreeItemName} onChange={(e) => this.setState({ editFreeItemName: e.target.value })} placeholder="Free item name" /></div><div className="col-3"><input className="form-control" type="number" value={this.state.editFreeItemQuantity} onChange={(e) => this.setState({ editFreeItemQuantity: e.target.value })} placeholder="Qty" /></div><div className="col-3"><input className="form-control" value={this.state.editFreeItemUnit} onChange={(e) => this.setState({ editFreeItemUnit: e.target.value })} placeholder="Unit" /></div><div className="col-12"><input className="form-control" value={this.state.editFreeItemDescription} onChange={(e) => this.setState({ editFreeItemDescription: e.target.value })} placeholder="Description" /></div></div>}
                                            </div>
                                            <div className="mb-3">
                                                <label className="form-label fw-semibold">{langCtx.getText('stock')}</label>
                                                <input
                                                    type="number"
                                                    className={`form-control ${this.state.editErrors?.stock ? 'is-invalid' : ''}`}
                                                    value={this.state.editStock}
                                                    onChange={(e) =>
                                                        this.setState({
                                                            editStock: e.target.value,
                                                            editErrors: { ...this.state.editErrors, stock: undefined },
                                                        })
                                                    }
                                                    min="0"
                                                    step="1"
                                                />
                                                {this.state.editErrors?.stock && (
                                                    <div className="invalid-feedback">{this.state.editErrors.stock}</div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="modal-footer">
                                            <SecondaryButton onClick={() => this.setState({ showEditModal: false })}>{langCtx.getText('cancel')}</SecondaryButton>
                                            <PrimaryButton onClick={() => this.handleSaveEdit(langCtx)}>{langCtx.getText('save')}</PrimaryButton>
                                        </div>
                                    </ModalContent>
                                </ModalOverlay>
                            )}
                            {this.state.showReviews && (
                                <ModalOverlay onClick={this.closeReviews}>
                                    <ModalContent style={{ maxWidth: '640px', width: '100%' }} onClick={(e) => e.stopPropagation()}>
                                        <div className="modal-header">
                                            <h3>{product.emoji || '📦'} {translatedName} Reviews</h3>
                                            <button className="close-btn" onClick={this.closeReviews} type="button" aria-label="Close">×</button>
                                        </div>
                                        <div className="modal-body">
                                            {this.state.loadingReviews ? <Spinner text="Loading reviews..." /> : this.state.productReviews.length === 0 ? (
                                                <div className="text-muted">No comments found.</div>
                                            ) : this.state.productReviews.map((review, index) => (
                                                <div key={`${review.created_at || 'review'}-${index}`} style={{ borderBottom: '1px solid #e5e7eb', padding: '0.75rem 0' }}>
                                                    {Number(review.rating || 0) > 0 && (
                                                        <div style={{ color: '#f59e0b', fontWeight: 700 }}>{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</div>
                                                    )}
                                                    <div>{review.comment}</div>
                                                    {this.formatReviewDate(review.created_at) && <small className="text-muted">{this.formatReviewDate(review.created_at)}</small>}
                                                </div>
                                            ))}
                                        </div>
                                    </ModalContent>
                                </ModalOverlay>
                            )}
                        </>
                    );
                }}
            </LanguageContext.Consumer>
        );
    }
}

export default ProductCard;
