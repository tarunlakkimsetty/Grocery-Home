import React from 'react';
import AuthContext from '../context/AuthContext';
import CartContext from '../context/CartContext';
import LanguageContext from '../context/LanguageContext';
import { toast } from 'react-toastify';
import {
    ProductCardWrapper,
    CardImage,
    CardBody,
    CardActions,
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
        const isWeightBased = product?.unit === 'kg';
        
        // Parse quantity based on unit
        let qty = isWeightBased ? parseFloat(this.state.quantity) : parseInt(this.state.quantity);
        
        // Validate based on unit
        const minQty = isWeightBased ? 0.1 : 1;
        if (qty < minQty || qty > product.stock) {
            toast.warning(langCtx.getText('quantityInvalid'));
            return;
        }
        
        cartCtx.addToCart(product, qty);
        const translatedName = langCtx.getText(product.name) || product.name;
        toast.success(`${translatedName} ${langCtx.getText('addToCart')}🛒`);
        this.setState({ quantity: isWeightBased ? 0.1 : 1 });
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
                                    <div className="card-title">{translatedName}</div>
                                    <div className="card-category">{langCtx.getText(product.category)}</div>
                                    <div className="card-price">
                                        ₹{product.price} <span className="unit">/{product.unit || 'unit'}</span>
                                    </div>
                                </CardBody>
                                <CardActions>
                                    {isAdmin ? (
                                        <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
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
                                                style={{ flex: 1 }}
                                            >
                                                ✏️ {langCtx.getText('edit')}
                                            </WarningButton>
                                            <DangerButton
                                                onClick={() => this.handleDeleteProduct(langCtx)}
                                                style={{ flex: 1 }}
                                            >
                                                🗑️ {langCtx.getText('delete')}
                                            </DangerButton>
                                        </div>
                                    ) : (
                                        <>
                                            {(() => {
                                                const isWeightBased = product?.unit === 'kg';
                                                return (
                                                    <input
                                                        type="number"
                                                        className="qty-input"
                                                        min={isWeightBased ? "0.1" : "1"}
                                                        step={isWeightBased ? "0.1" : "1"}
                                                        max={product.stock}
                                                        value={this.state.quantity}
                                                        onChange={(e) => this.setState({ quantity: e.target.value })}
                                                        disabled={product.stock <= 0}
                                                    />
                                                );
                                            })()}
                                            <CartContext.Consumer>
                                                {(cartCtx) => (
                                                    <PrimaryButton
                                                        onClick={() => this.handleAddToCart(cartCtx, langCtx)}
                                                        disabled={product.stock <= 0}
                                                    >
                                                        🛒 {langCtx.getText('addToCart')}
                                                    </PrimaryButton>
                                                )}
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
