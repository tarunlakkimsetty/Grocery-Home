import React from 'react';
import CartContext from '../context/CartContext';
import AuthContext from '../context/AuthContext';
import LanguageContext from '../context/LanguageContext';
import SearchBar from '../components/SearchBar';
import CartItem from '../components/CartItem';
import billService from '../services/billService';
import orderService from '../services/orderService';
import { toast } from 'react-toastify';
import { Navigate } from 'react-router-dom';
import styled from 'styled-components';
import { PageHeader } from '../styledComponents/LayoutStyles';
import {
    TableWrapper,
    EmptyState,
    ModalOverlay,
    ModalContent,
    MobileCartWrapper,
    DesktopCartWrapper,
    CartCard,
    CartCardHeader,
    CartCardCheckbox,
    CartCardProductName,
    CartCardRow,
    CartCardLabel,
    CartCardValue,
    QuantityControlsMobile,
    RemoveButtonMobile,
} from '../styledComponents/FormStyles';
import { PrimaryButton, DangerButton, GhostButton } from '../styledComponents/ButtonStyles';
import LegalModalContext from '../context/LegalModalContext';

const ItemRow = styled.tr`
    transition: background-color 0.15s ease;
    ${props => props.$delivered && `
        background-color: rgba(25, 135, 84, 0.08) !important;
    `}
`;

const InlineLinkButton = styled.button`
    background: none;
    border: none;
    padding: 0;
    margin: 0;
    color: ${({ theme }) => theme.colors.primary};
    font-weight: 700;
    cursor: pointer;
    text-decoration: underline;

    &:hover {
        color: ${({ theme }) => theme.colors.primaryDark};
    }

    &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }
`;

const AgreementHighlight = styled.div`
    background: ${({ theme }) => theme.colors.bodyBg};
    border: 1px solid ${({ theme }) => theme.colors.borderLight};
    border-radius: ${({ theme }) => theme.borderRadius.md};
    box-shadow: ${({ theme }) => theme.shadows.sm};
    padding: 0.85rem 1rem;
    margin: 0.5rem 0 0.85rem;

    .form-check {
        margin: 0;
    }
`;

const AgreementCheckbox = styled.input`
    transform: scale(1.15);
    transform-origin: top left;
`;

const AgreementLabel = styled.label`
    font-weight: 700;
    color: ${({ theme }) => theme.colors.textPrimary};
    line-height: 1.45;
`;

class CartPage extends React.Component {
    static contextType = CartContext;

    constructor(props) {
        super(props);
        this.state = {
            paymentMethod: 'Cash',
            isCOD: false,
            agreedToTerms: false,
            loading: false,
            redirectTo: null,
            searchQuery: '',
            showOrderPlacedPopup: false,
            orderPlacedAdminPhone: process.env.REACT_APP_ADMIN_PHONE || '9441754505',
        };
        this.languageContext = null;
    }

    handlePlaceOrderWithAgreement = async (authCtx) => {
        if (!this.state.agreedToTerms) {
            toast.warning('Please agree to the Terms & Conditions before placing the order.');
            return;
        }

        return this.handlePlaceOrder(authCtx);
    };

    handleSearch = (searchQuery) => {
        this.setState({ searchQuery });
    };

    // Existing in-store billing flow (Cash / Card / UPI)
    handleGenerateBill = async () => {
        const cartCtx = this.context;
        const deliveredItems = cartCtx.items.filter((item) => item.delivered);

        if (deliveredItems.length === 0) {
            toast.warning(this.languageContext.getText('checkAtLeastOne'));
            return;
        }

        this.setState({ loading: true });
        try {
            const billData = {
                userId: 2,
                items: deliveredItems.map((item) => ({
                    productId: item.productId,
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity,
                    total: item.total,
                })),
                grandTotal: cartCtx.getDeliveredTotal(),
                paymentMethod: this.state.paymentMethod,
            };

            await billService.generateBill(billData);

            // Remove delivered items from cart
            deliveredItems.forEach((item) => {
                cartCtx.removeFromCart(item.productId);
            });

            toast.success(this.languageContext.getText('billGenerated') + ' 🎉');
            this.setState({ redirectTo: '/history' });
        } catch (err) {
            toast.error(this.languageContext.getText('billGenerationFailed'));
        } finally {
            this.setState({ loading: false });
        }
    };

    // New COD order flow
    handlePlaceOrder = async (authCtx) => {
        const cartCtx = this.context;

        if (cartCtx.items.length === 0) {
            toast.warning('Cart is empty');
            return;
        }

        this.setState({ loading: true });
        try {
            const user = authCtx ? authCtx.user : null;

            const cartItems = Array.isArray(cartCtx.items) ? cartCtx.items : [];
            const totalAmount = Number(cartCtx.getTotal() || 0);

            const orderData = {
                customerName: user ? (user.name || user.fullName || 'Customer') : 'Customer',
                phone: (user && user.phone) ? user.phone : '0000000000',
                place: (user && user.place) ? user.place : 'Default',
                address: (user && user.address) ? user.address : 'Default Address',
                paymentMethod: 'COD',
                totalAmount: Number(totalAmount),
                items: cartItems.map((item) => ({
                    productId: item.id ?? item.productId,
                    name: item.name,
                    price: Number(item.price),
                    quantity: Number(item.quantity),
                })),
            };

            console.log('FINAL ORDER PAYLOAD:', orderData);

            await orderService.placeOrder(orderData);

            // Clear entire cart after COD order
            cartCtx.clearCart();

            toast.success(this.languageContext.getText('orderPlaced') + ' 🛵');
            this.setState({ showOrderPlacedPopup: true });
        } catch (err) {
            const msg = err?.response?.data?.message || err?.response?.data?.error || err?.message;
            const normalized = msg ? String(msg).trim() : '';
            if (normalized === 'Quantity exceeds stock limit') toast.error('Quantity exceeds stock limit');
            else if (normalized) toast.error(normalized);
            else toast.error(this.languageContext.getText('orderPlacedFailed'));
        } finally {
            this.setState({ loading: false });
        }
    };

    render() {
        if (this.state.redirectTo) {
            return <Navigate to={this.state.redirectTo} replace />;
        }

        const isCOD = !!this.state.isCOD;
        const dropdownValue = ['Cash', 'Card', 'UPI'].includes(this.state.paymentMethod)
            ? this.state.paymentMethod
            : 'Cash';

        return (
            <LanguageContext.Consumer>
                {(langCtx) => {
                    this.languageContext = langCtx;
                    return (
                        <AuthContext.Consumer>
                            {(authCtx) => (
                                <CartContext.Consumer>
                                    {(cartCtx) => {
                                        const filteredItems = this.state.searchQuery.trim()
                                            ? cartCtx.items.filter((i) =>
                                                i.name.toLowerCase().includes(this.state.searchQuery.toLowerCase())
                                              )
                                            : cartCtx.items;
                                        return (
                                        <div>
                                            <PageHeader>
                                                <h1>🛒 {langCtx.getText('shoppingCart')}</h1>
                                                <p>{cartCtx.items.length} {langCtx.getText('itemsInCart')}</p>
                                            </PageHeader>

                                            {cartCtx.items.length === 0 ? (
                                                <EmptyState>
                                                    <div className="empty-icon">🛒</div>
                                                    <h3>{langCtx.getText('cartEmpty')}</h3>
                                                    <p>{langCtx.getText('cartEmptyMessage')}</p>
                                                </EmptyState>
                                            ) : (
                                                <>
                                                    <SearchBar onSearch={this.handleSearch} />

                                                    <div className="row g-4">
                                                        <div className="col-12 col-lg-8">
                                                            {!isCOD && (
                                                                <div style={{ marginBottom: '1rem', padding: '0.75rem', background: '#e7f3e7', borderRadius: '8px', border: '1px solid #4caf50', fontSize: '0.85rem', color: '#1b5e20' }}>
                                                                    ✓ {langCtx.getText('deliveryCheckboxLabel')}
                                                                </div>
                                                            )}
                                                            {isCOD && (
                                                                <div style={{ marginBottom: '1rem', padding: '0.75rem', background: '#fff3e0', borderRadius: '8px', border: '1px solid #ff9800', fontSize: '0.85rem', color: '#e65100' }}>
                                                                    🛵 All items will be included in your Cash on Delivery order. Pay when your order arrives.
                                                                </div>
                                                            )}

                                                            <DesktopCartWrapper>
                                                                <TableWrapper>
                                                                    <table className="table table-hover align-middle">
                                                                        <thead>
                                                                            <tr>
                                                                                {!isCOD && (
                                                                                    <th className="text-center" style={{ width: '70px', verticalAlign: 'middle' }}>Checkbox</th>
                                                                                )}
                                                                                <th className="text-start" style={{ verticalAlign: 'middle' }}>{langCtx.getText('productName')}</th>
                                                                                <th className="text-center" style={{ width: '120px', verticalAlign: 'middle' }}>{langCtx.getText('price')}</th>
                                                                                <th className="text-center" style={{ width: '170px', verticalAlign: 'middle' }}>{langCtx.getText('quantity')}</th>
                                                                                <th className="text-center" style={{ width: '130px', verticalAlign: 'middle' }}>{langCtx.getText('total')}</th>
                                                                                <th className="text-center" style={{ width: '90px', verticalAlign: 'middle' }}>Action</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody>
                                                                            {filteredItems.map((item) => (
                                                                                <ItemRow key={item.productId} $delivered={!!item.delivered}>
                                                                                    {!isCOD && (
                                                                                        <td className="text-center" style={{ width: '70px', verticalAlign: 'middle' }}>
                                                                                            <input
                                                                                                type="checkbox"
                                                                                                className="form-check-input m-0"
                                                                                                style={{ transform: 'scale(1.2)', cursor: 'pointer' }}
                                                                                                checked={!!item.delivered}
                                                                                                onChange={() => cartCtx.toggleItemDelivered(item.productId)}
                                                                                                aria-label={`Include ${item.name} in billing`}
                                                                                            />
                                                                                        </td>
                                                                                    )}
                                                                                    <CartItem
                                                                                        item={item}
                                                                                        onUpdateQuantity={cartCtx.updateQuantity}
                                                                                        onRemove={cartCtx.removeFromCart}
                                                                                        isTableRow={true}
                                                                                    />
                                                                                </ItemRow>
                                                                            ))}
                                                                        </tbody>
                                                                    </table>
                                                                </TableWrapper>
                                                            </DesktopCartWrapper>

                                                            <MobileCartWrapper>
                                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                                                                    {filteredItems.map((item) => {
                                                                        const rawPrice = Number(item?.price ?? 0);
                                                                        const price = Number.isFinite(rawPrice) ? rawPrice : 0;
                                                                        const rawQuantity = Number(item?.quantity ?? 0);
                                                                        const quantity = Number.isFinite(rawQuantity) ? rawQuantity : 0;
                                                                        const rawTotal = Number(item?.total);
                                                                        const total = Number.isFinite(rawTotal) ? rawTotal : price * quantity;
                                                                        const isWeightBased = item?.unit === 'kg';
                                                                        const increment = isWeightBased ? 0.1 : 1;
                                                                        const minQty = isWeightBased ? 0.1 : 1;

                                                                        const handleIncrease = () => {
                                                                            if (item.quantity >= item.stock) {
                                                                                toast.error('Stock limit reached');
                                                                                return;
                                                                            }
                                                                            const newQty = isWeightBased
                                                                                ? Math.round((item.quantity + increment) * 10) / 10
                                                                                : item.quantity + increment;
                                                                            cartCtx.updateQuantity(item.productId, newQty);
                                                                        };

                                                                        const handleDecrease = () => {
                                                                            if (item.quantity <= minQty) {
                                                                                return;
                                                                            }
                                                                            const newQty = isWeightBased
                                                                                ? Math.round((item.quantity - increment) * 10) / 10
                                                                                : item.quantity - increment;
                                                                            cartCtx.updateQuantity(item.productId, newQty);
                                                                        };

                                                                        return (
                                                                            <CartCard key={item.productId} $delivered={!!item.delivered}>
                                                                                {!isCOD && (
                                                                                    <CartCardHeader>
                                                                                        <CartCardCheckbox
                                                                                            type="checkbox"
                                                                                            checked={!!item.delivered}
                                                                                            onChange={() => cartCtx.toggleItemDelivered(item.productId)}
                                                                                            aria-label={`Include ${item.name} in billing`}
                                                                                        />
                                                                                        <CartCardProductName>
                                                                                            <div className="name">{item.name}</div>
                                                                                            <span className="unit">{item.unit || 'piece'}</span>
                                                                                        </CartCardProductName>
                                                                                    </CartCardHeader>
                                                                                )}
                                                                                {isCOD && (
                                                                                    <CartCardHeader>
                                                                                        <CartCardProductName style={{ marginLeft: 0 }}>
                                                                                            <div className="name">{item.name}</div>
                                                                                            <span className="unit">{item.unit || 'piece'}</span>
                                                                                        </CartCardProductName>
                                                                                    </CartCardHeader>
                                                                                )}

                                                                                <CartCardRow>
                                                                                    <CartCardLabel>{langCtx.getText('price')}:</CartCardLabel>
                                                                                    <CartCardValue className="price">₹{price.toFixed(2)}</CartCardValue>
                                                                                </CartCardRow>

                                                                                <div style={{ marginBottom: '0.75rem' }}>
                                                                                    <CartCardLabel style={{ display: 'block', marginBottom: '0.5rem' }}>
                                                                                        {langCtx.getText('quantity')}:
                                                                                    </CartCardLabel>
                                                                                    <QuantityControlsMobile>
                                                                                        <GhostButton
                                                                                            onClick={handleDecrease}
                                                                                            disabled={item.quantity <= minQty}
                                                                                            title={item.quantity <= minQty ? `Cannot go below ${minQty}` : 'Decrease quantity'}
                                                                                            style={{ padding: 0 }}
                                                                                        >
                                                                                            −
                                                                                        </GhostButton>
                                                                                        <span className="quantity-display">
                                                                                            {isWeightBased ? item.quantity.toFixed(1) : Math.floor(item.quantity)}
                                                                                        </span>
                                                                                        <GhostButton
                                                                                            onClick={handleIncrease}
                                                                                            disabled={item.quantity >= item.stock}
                                                                                            title={item.quantity >= item.stock ? 'Stock limit reached' : 'Increase quantity'}
                                                                                            style={{ padding: 0 }}
                                                                                        >
                                                                                            +
                                                                                        </GhostButton>
                                                                                    </QuantityControlsMobile>
                                                                                </div>

                                                                                <CartCardRow>
                                                                                    <CartCardLabel>{langCtx.getText('total')}:</CartCardLabel>
                                                                                    <CartCardValue className="total">₹{total.toFixed(2)}</CartCardValue>
                                                                                </CartCardRow>

                                                                                <RemoveButtonMobile
                                                                                    onClick={() => cartCtx.removeFromCart(item.productId)}
                                                                                    title={langCtx.getText('removeItem')}
                                                                                >
                                                                                    ✕ {langCtx.getText('removeItem')}
                                                                                </RemoveButtonMobile>
                                                                            </CartCard>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </MobileCartWrapper>
                                                        </div>

                                                        <div className="col-12 col-lg-4">
                                                            <div style={{
                                                                background: 'white',
                                                                borderRadius: '10px',
                                                                padding: '1.5rem',
                                                                boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
                                                                border: '1px solid #e9ecef',
                                                                position: 'sticky',
                                                                top: '80px',
                                                            }}>
                                                                <h5 className="fw-bold mb-3" style={{ fontFamily: "'Outfit', sans-serif" }}>
                                                                    {langCtx.getText('billingsSummary')}
                                                                </h5>

                                                                <div style={{ background: '#f8f9fa', padding: '0.75rem', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.85rem' }}>
                                                                    <div className="d-flex justify-content-between mb-2">
                                                                        <span>{langCtx.getText('totalItems')}:</span>
                                                                        <span className="fw-bold">{cartCtx.items.length}</span>
                                                                    </div>
                                                                    {!isCOD && (
                                                                        <div className="d-flex justify-content-between mb-2">
                                                                            <span>{langCtx.getText('deliveredItems')}:</span>
                                                                            <span className="fw-bold" style={{ color: '#2E7D32' }}>
                                                                                {cartCtx.items.filter((i) => i.delivered).length}
                                                                            </span>
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                <div className="d-flex justify-content-between mb-2">
                                                                    <span className="text-muted">{langCtx.getText('cartTotal')}</span>
                                                                    <span>₹{cartCtx.getTotal().toFixed(2)}</span>
                                                                </div>
                                                                {!isCOD && (
                                                                    <div className="d-flex justify-content-between mb-3">
                                                                        <span className="text-muted">{langCtx.getText('toBill')}</span>
                                                                        <span className="fw-bold" style={{ color: '#2E7D32' }}>
                                                                            ₹{cartCtx.getDeliveredTotal().toFixed(2)}
                                                                        </span>
                                                                    </div>
                                                                )}
                                                                <hr />

                                                                <div className="d-flex justify-content-between mb-3">
                                                                    <span className="fw-bold fs-5">{langCtx.getText('billAmount')}</span>
                                                                    <span className="fw-bold fs-5" style={{ color: '#2E7D32' }}>
                                                                        ₹{isCOD ? cartCtx.getTotal().toFixed(2) : cartCtx.getDeliveredTotal().toFixed(2)}
                                                                    </span>
                                                                </div>

                                                                <div className="mb-3">
                                                                    <label className="form-label fw-semibold" style={{ fontSize: '0.875rem' }}>
                                                                        {langCtx.getText('paymentMethod')}
                                                                    </label>
                                                                    <select
                                                                        className="form-select"
                                                                        value={dropdownValue}
                                                                        onChange={() => {
                                                                            // Customer portal: dropdown stays visible but is not selectable.
                                                                            // Cash on Delivery is the only allowed customer payment method.
                                                                        }}
                                                                    >
                                                                        <option value="Cash" disabled>💵 {langCtx.getText('cash')}</option>
                                                                        <option value="Card" disabled>💳 {langCtx.getText('card')}</option>
                                                                        <option value="UPI" disabled>📱 {langCtx.getText('upi')}</option>
                                                                    </select>

                                                                    <PrimaryButton
                                                                            onClick={() => this.setState({ isCOD: true, paymentMethod: 'COD', agreedToTerms: false })}
                                                                        disabled={this.state.loading || isCOD}
                                                                        style={{ width: '100%', marginTop: '0.75rem', padding: '0.65rem' }}
                                                                    >
                                                                        🛵 {langCtx.getText('cashOnDelivery')}
                                                                    </PrimaryButton>
                                                                </div>

                                                                {isCOD ? (
                                                                    <>
                                                                        <AgreementHighlight>
                                                                            <div className="form-check" style={{ fontSize: '0.95rem' }}>
                                                                                <AgreementCheckbox
                                                                                    className="form-check-input"
                                                                                    type="checkbox"
                                                                                    id="agreeTerms"
                                                                                    checked={!!this.state.agreedToTerms}
                                                                                    onChange={(e) => this.setState({ agreedToTerms: e.target.checked })}
                                                                                    disabled={this.state.loading}
                                                                                />
                                                                                <AgreementLabel className="form-check-label" htmlFor="agreeTerms">
                                                                                    <LegalModalContext.Consumer>
                                                                                        {(legalModal) => (
                                                                                            <>
                                                                                                {langCtx.getText('legal_agree_prefix')}
                                                                                                <InlineLinkButton
                                                                                                    type="button"
                                                                                                    onClick={() => legalModal.openLegalModal('terms')}
                                                                                                    disabled={this.state.loading}
                                                                                                >
                                                                                                    {langCtx.getText('legal_modal_terms')}
                                                                                                </InlineLinkButton>
                                                                                                {langCtx.getText('legal_agree_and')}
                                                                                                <InlineLinkButton
                                                                                                    type="button"
                                                                                                    onClick={() => legalModal.openLegalModal('privacy')}
                                                                                                    disabled={this.state.loading}
                                                                                                >
                                                                                                    {langCtx.getText('legal_modal_privacy_checkbox')}
                                                                                                </InlineLinkButton>
                                                                                                {langCtx.getText('legal_agree_suffix')}
                                                                                            </>
                                                                                        )}
                                                                                    </LegalModalContext.Consumer>
                                                                                </AgreementLabel>
                                                                            </div>
                                                                        </AgreementHighlight>

                                                                        <PrimaryButton
                                                                            onClick={() => this.handlePlaceOrderWithAgreement(authCtx)}
                                                                            disabled={this.state.loading || cartCtx.items.length === 0 || !this.state.agreedToTerms}
                                                                            style={{ width: '100%', padding: '0.75rem', background: 'linear-gradient(135deg, #ff9800, #f57c00)' }}
                                                                        >
                                                                            {this.state.loading ? (
                                                                                <>
                                                                                    <span className="spinner-border spinner-border-sm me-2" />
                                                                                    {langCtx.getText('placingOrder')}
                                                                                </>
                                                                            ) : (
                                                                                `🛵 ${langCtx.getText('placeOrder')} (${cartCtx.items.length})`
                                                                            )}
                                                                        </PrimaryButton>
                                                                    </>
                                                                ) : (
                                                                    <PrimaryButton
                                                                        onClick={this.handleGenerateBill}
                                                                        disabled={this.state.loading || cartCtx.items.filter((i) => i.delivered).length === 0}
                                                                        style={{ width: '100%', padding: '0.75rem' }}
                                                                    >
                                                                        {this.state.loading ? (
                                                                            <>
                                                                                <span className="spinner-border spinner-border-sm me-2" />
                                                                                {langCtx.getText('processing')}
                                                                            </>
                                                                        ) : (
                                                                            `🧾 ${langCtx.getText('generateBill')} (${cartCtx.items.filter((i) => i.delivered).length})`
                                                                        )}
                                                                    </PrimaryButton>
                                                                )}

                                                                <DangerButton
                                                                    onClick={cartCtx.clearCart}
                                                                    style={{ width: '100%', marginTop: '0.75rem', padding: '0.65rem' }}
                                                                >
                                                                    🗑️ {langCtx.getText('clearCart')}
                                                                </DangerButton>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </>
                                            )}

                                            {this.state.showOrderPlacedPopup && (
                                                <ModalOverlay>
                                                    <ModalContent style={{ maxWidth: '560px', width: '100%' }}>
                                                        <div className="modal-header">
                                                            <h3>✅ {langCtx.getText('orderPlaced')}</h3>
                                                        </div>
                                                        <div className="modal-body">
                                                            <p style={{ marginBottom: '0.6rem' }}>
                                                                {langCtx.getText('orderPlacedAcceptanceInfoLine1')}
                                                            </p>
                                                            <p style={{ marginBottom: '0.75rem' }}>
                                                                {langCtx.getText('orderPlacedAcceptanceInfoLine2')}
                                                            </p>
                                                            <p style={{ marginBottom: 0, fontWeight: 700 }}>
                                                                {langCtx.getText('adminPhoneNumberLabel')}: {this.state.orderPlacedAdminPhone}
                                                            </p>
                                                        </div>
                                                        <div className="modal-footer">
                                                            <PrimaryButton
                                                                onClick={() => this.setState({ showOrderPlacedPopup: false, redirectTo: '/history' })}
                                                                style={{ minWidth: '110px' }}
                                                            >
                                                                {langCtx.getText('ok')}
                                                            </PrimaryButton>
                                                        </div>
                                                    </ModalContent>
                                                </ModalOverlay>
                                            )}
                                        </div>
                                        );
                                    }}
                                </CartContext.Consumer>
                            )}
                        </AuthContext.Consumer>
                    );
                }}
            </LanguageContext.Consumer>
        );
    }
}

export default CartPage;
