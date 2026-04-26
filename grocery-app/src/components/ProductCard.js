import React from 'react';
import AuthContext from '../context/AuthContext';
import CartContext from '../context/CartContext';
import LanguageContext from '../context/LanguageContext';
import QuantityControl from './QuantityControl';
import { getNextQuantity, getPreviousQuantity, validateQuantity } from '../utils/quantityValidator';
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
        const isWeightBased = props.product?.unit === 'kg';
        this.state = {
            quantity: isWeightBased ? 0.1 : 1,
            showEditModal: false,
            editName: props.product.name,
            editPrice: props.product.price,
            editStock: props.product.stock,
            editErrors: {},
        };
    }

    validateEdit = () => {
        const errors = {};

        const priceNum = Number(this.state.editPrice);
        if (!Number.isFinite(priceNum) || priceNum < 1) {
            errors.price = 'Price must be greater than or equal to 1';
        }

        const stockNum = Number(this.state.editStock);
        if (!Number.isFinite(stockNum) || stockNum < 0) {
            errors.stock = 'Stock cannot be less than 0';
        }

        this.setState({ editErrors: errors });
        return Object.keys(errors).length === 0;
    };

    handleAddToCart = (cartCtx, langCtx) => {
        const { product } = this.props;
        const unit = product?.unit || 'piece';
        
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

    handleSaveEdit = (langCtx) => {
        if (!this.validateEdit()) return;

        const { product, onUpdateProduct } = this.props;
        if (onUpdateProduct) {
            onUpdateProduct(product.id, {
                name: this.state.editName,
                price: parseFloat(this.state.editPrice),
                stock: parseInt(this.state.editStock),
            });
        }
        this.setState({ showEditModal: false, editErrors: {} });
        toast.success(langCtx.getText('updateSuccess'));
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

    render() {
        const { product } = this.props;
        const { role } = this.context;
        const isAdmin = role === 'admin';
        const gradient = CATEGORY_GRADIENTS[product.category] || CATEGORY_GRADIENTS.grains;

        return (
            <LanguageContext.Consumer>
                {(langCtx) => {
                    const translatedName = langCtx.getText(product.name) || product.name;
                    const inStockText = langCtx.getText('inStock');
                    const outOfStockText = langCtx.getText('outOfStock');

                    return (
                        <>
                            <ProductCardWrapper>
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
                                        ₹{product.price} <span className="unit">/{product.unit || 'unit'}</span>
                                    </div>
                                    <div className="card-stock">
                                        {product.stock > 0 ? `${product.stock} ${inStockText}` : `❌ ${outOfStockText}`}
                                    </div>
                                </CardBody>
                                <CardActions>
                                    {isAdmin ? (
                                        <ButtonSection $adminMode={true}>
                                            <WarningButton
                                                onClick={() =>
                                                    this.setState({
                                                        showEditModal: true,
                                                        editName: product.name,
                                                        editPrice: product.price,
                                                        editStock: product.stock,
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
                                                    const unit = product?.unit || 'piece';
                                                    // CRITICAL: Calculate available = stock - alreadyInCart
                                                    const alreadyInCart = (cartCtx.cart || []).find(item => item.productId === product.id)?.quantity || 0;
                                                    const available = Math.max(0, product.stock - alreadyInCart);
                                                    const isOutOfStock = available <= 0;
                                                    const stockStatus = isOutOfStock ? 'outOfStock' : available <= 3 ? 'lowStock' : 'available';

                                                    // Debug logging
                                                    console.log({ productId: product.id, stock: product.stock, alreadyInCart, available });

                                                    return (
                                                        <>
                                                            {/* Quantity Section */}
                                                            <QuantitySection>
                                                                <label>Qty: {unit}</label>
                                                                <QuantityControl
                                                                    value={this.state.quantity}
                                                                    onIncrease={() => {
                                                                        const next = getNextQuantity(this.state.quantity, { unit, stock: available });
                                                                        this.setState({ quantity: next });
                                                                    }}
                                                                    onDecrease={() => {
                                                                        const prev = getPreviousQuantity(this.state.quantity, { unit });
                                                                        this.setState({ quantity: prev });
                                                                    }}
                                                                    onChange={(value) => this.setState({ quantity: value })}
                                                                    unit={unit}
                                                                    stock={available}
                                                                    disabled={isOutOfStock}
                                                                    title={unit === 'kg' ? 'Adjust weight (kg)' : 'Adjust quantity'}
                                                                    showStockWarning={true}
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
                                                <label className="form-label fw-semibold">{langCtx.getText('price')} (₹)</label>
                                                <input
                                                    type="number"
                                                    className={`form-control ${this.state.editErrors?.price ? 'is-invalid' : ''}`}
                                                    value={this.state.editPrice}
                                                    onChange={(e) =>
                                                        this.setState({
                                                            editPrice: e.target.value,
                                                            editErrors: { ...this.state.editErrors, price: undefined },
                                                        })
                                                    }
                                                    min="1"
                                                    step="0.01"
                                                />
                                                {this.state.editErrors?.price && (
                                                    <div className="invalid-feedback">{this.state.editErrors.price}</div>
                                                )}
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
                        </>
                    );
                }}
            </LanguageContext.Consumer>
        );
    }
}

export default ProductCard;
