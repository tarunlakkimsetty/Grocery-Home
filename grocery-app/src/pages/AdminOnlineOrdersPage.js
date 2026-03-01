import React from 'react';
import LanguageContext from '../context/LanguageContext';
import orderService from '../services/orderService';
import productService from '../services/productService';
import Spinner from '../components/Spinner';
import { toast } from 'react-toastify';
import styled from 'styled-components';
import { PageHeader } from '../styledComponents/LayoutStyles';
import {
    TableWrapper,
    EmptyState,
    Badge,
    ModalOverlay,
    ModalContent,
} from '../styledComponents/FormStyles';

// ─── Styled Components ────────────────────────────────────────────────────────

const ActionButton = styled.button`
    border: none;
    border-radius: 6px;
    padding: 0.35rem 0.85rem;
    font-size: 0.82rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;

    &.btn-verify {
        background: rgba(30, 136, 229, 0.1);
        color: #1565c0;
        border: 1px solid rgba(30, 136, 229, 0.35);
        &:hover:not(:disabled) { background: rgba(30, 136, 229, 0.22); }
    }
    &.btn-payment {
        background: rgba(13, 110, 253, 0.1);
        color: #0a58ca;
        border: 1px solid rgba(13, 110, 253, 0.35);
        &:hover:not(:disabled) { background: rgba(13, 110, 253, 0.22); }
    }
    &.btn-deliver {
        background: rgba(67, 160, 71, 0.1);
        color: #2e7d32;
        border: 1px solid rgba(67, 160, 71, 0.35);
        &:hover:not(:disabled) { background: rgba(67, 160, 71, 0.22); }
    }
    &.btn-view {
        background: #f8f9fa;
        color: #495057;
        border: 1px solid #dee2e6;
        &:hover { background: #e9ecef; }
    }
    &:disabled {
        opacity: 0.4;
        cursor: not-allowed;
    }
`;

const DetailRow = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 0.45rem 0;
    border-bottom: 1px solid #f0f0f0;
    font-size: 0.875rem;
    gap: 1rem;

    &:last-child { border-bottom: none; }

    .label { color: #6c757d; white-space: nowrap; flex-shrink: 0; }
    .value { font-weight: 600; color: #212529; text-align: right; }
`;

const SectionTitle = styled.h6`
    font-size: 0.72rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.6px;
    color: #6c757d;
    margin-bottom: 0.6rem;
    margin-top: 0;
`;

const QtyControl = styled.div`
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;

    .qty-btn {
        width: 24px;
        height: 24px;
        border: 1px solid #ced4da;
        background: white;
        border-radius: 4px;
        font-size: 0.9rem;
        font-weight: 700;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0;
        line-height: 1;
        transition: all 0.15s;
        color: #495057;

        &:hover:not(:disabled) {
            background: #e9ecef;
            border-color: #adb5bd;
        }
        &:disabled {
            opacity: 0.4;
            cursor: not-allowed;
        }
    }

    .qty-value {
        min-width: 28px;
        text-align: center;
        font-weight: 700;
        font-size: 0.875rem;
        color: #212529;
    }
`;

const TotalBar = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.65rem 0.85rem;
    background: linear-gradient(135deg, #e8f5e9, #f1f8e9);
    border: 1px solid rgba(76, 175, 80, 0.3);
    border-radius: 8px;
    margin-top: 0.4rem;
    margin-bottom: 1rem;

    .total-label { font-size: 0.82rem; color: #388e3c; font-weight: 600; }
    .total-value { font-size: 1.05rem; font-weight: 800; color: #1b5e20; }
`;

const VerifyCheckWrapper = styled.div`
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.45rem 0.75rem;
    background: rgba(30, 136, 229, 0.07);
    border: 1px solid rgba(30, 136, 229, 0.25);
    border-radius: 6px;

    input[type='checkbox'] {
        width: 16px;
        height: 16px;
        cursor: pointer;
        accent-color: #1565c0;
        flex-shrink: 0;
    }

    label {
        font-size: 0.82rem;
        font-weight: 600;
        color: #1565c0;
        cursor: pointer;
        margin: 0;
        line-height: 1.3;
    }
`;

// ─── Main Component ────────────────────────────────────────────────────────────

class AdminOnlineOrdersPage extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            orders: [],
            loading: true,
            error: null,
            products: [],
            productsLoading: false,
            // Modal
            selectedOrder: null,
            modalOpen: false,
            actionLoading: false,
            // Item-level check state: { orderId: Set<productId> }
            checkedItems: {},
            // Editable items inside open modal (deep copy of selectedOrder.items)
            modalItems: [],
            // Add Product section state (Pending only)
            addProductId: '',
            addProductQty: 1,
        };
    }

    componentDidMount() {
        this.fetchOrders();
        this.fetchProducts();
    }

    // ─── Data Fetching ─────────────────────────────────────────────────────────

    fetchOrders = async () => {
        this.setState({ loading: true });
        try {
            const orders = await orderService.getAllOrders();
            this.setState({ orders, loading: false });
        } catch (err) {
            this.setState({ error: 'Failed to load orders', loading: false });
            toast.error('Failed to load orders');
        }
    };

    fetchProducts = async () => {
        this.setState({ productsLoading: true });
        try {
            const products = await productService.getProducts();
            this.setState({ products, productsLoading: false });
        } catch (err) {
            this.setState({ productsLoading: false });
            toast.error('Failed to load products');
        }
    };

    // ─── Modal Open / Close ────────────────────────────────────────────────────

    openModal = (order) => {
        // Initialize checked items for this order if not already tracked
        const hasTracked = Object.prototype.hasOwnProperty.call(this.state.checkedItems, order.id);
        const existingChecked = hasTracked
            ? this.state.checkedItems[order.id]
            : new Set(order.items.map((item) => item.productId));
        this.setState({
            selectedOrder: order,
            modalOpen: true,
            // Deep copy items so quantity edits don't mutate source
            modalItems: order.items.map((item) => ({ ...item })),
            checkedItems: {
                ...this.state.checkedItems,
                [order.id]: existingChecked,
            },
            addProductId: '',
            addProductQty: 1,
        });
    };

    closeModal = () => {
        this.setState({ selectedOrder: null, modalOpen: false, modalItems: [] });
    };

    // ─── Item Checkbox ─────────────────────────────────────────────────────────

    toggleItemCheck = (productId) => {
        const { selectedOrder, checkedItems } = this.state;
        if (!selectedOrder) return;
        // Lock: no changes allowed once order is no longer Pending
        if (selectedOrder.status !== 'Pending') return;
        const currentSet = new Set(checkedItems[selectedOrder.id] || []);
        if (currentSet.has(productId)) {
            currentSet.delete(productId);
        } else {
            currentSet.add(productId);
        }
        this.setState({
            checkedItems: {
                ...checkedItems,
                [selectedOrder.id]: currentSet,
            },
        });
    };

    // ─── Quantity Editing (PART 2) ─────────────────────────────────────────────

    updateItemQuantity = (productId, delta) => {
        const { selectedOrder } = this.state;
        // Lock: no quantity edits once order is no longer Pending
        if (selectedOrder && selectedOrder.status !== 'Pending') return;
        const updatedItems = this.state.modalItems.map((item) => {
            if (item.productId === productId) {
                const newQty = Math.max(1, item.quantity + delta);
                return { ...item, quantity: newQty, total: item.price * newQty };
            }
            return item;
        });
        this.setState({ modalItems: updatedItems });
    };

    // ─── Add Product to Order (Pending Only) ─────────────────────────────────

    onChangeAddProductId = (e) => {
        this.setState({ addProductId: e.target.value });
    };

    onChangeAddProductQty = (e) => {
        const raw = e.target.value;
        const qty = Math.max(1, parseInt(raw, 10) || 1);
        this.setState({ addProductQty: qty });
    };

    handleAddProductToOrder = async () => {
        const { selectedOrder, addProductId, addProductQty, products, modalItems, checkedItems } = this.state;
        if (!selectedOrder || selectedOrder.status !== 'Pending') return;

        const productId = parseInt(addProductId, 10);
        if (!productId) {
            toast.warning('Please select a product');
            return;
        }

        const quantity = Math.max(1, parseInt(addProductQty, 10) || 1);
        const product = products.find((p) => p.id === productId);
        if (!product) {
            toast.error('Selected product not found');
            return;
        }

        this.setState({ actionLoading: true });
        try {
            // Backend integration: add item before verification
            await orderService.addItemToOrder(selectedOrder.id, productId, quantity);

            const existingIdx = modalItems.findIndex((i) => i.productId === productId);
            let nextModalItems = [];
            if (existingIdx !== -1) {
                nextModalItems = modalItems.map((i) => {
                    if (i.productId !== productId) return i;
                    const nextQty = (i.quantity || 0) + quantity;
                    return {
                        ...i,
                        quantity: nextQty,
                        total: (i.price || product.price) * nextQty,
                    };
                });
            } else {
                nextModalItems = [
                    ...modalItems,
                    {
                        productId: productId,
                        name: product.name,
                        price: product.price,
                        quantity: quantity,
                        total: product.price * quantity,
                    },
                ];
            }

            // Default = checked
            const currentSet = new Set(checkedItems[selectedOrder.id] || []);
            currentSet.add(productId);

            this.setState({
                modalItems: nextModalItems,
                checkedItems: {
                    ...checkedItems,
                    [selectedOrder.id]: currentSet,
                },
                addProductId: '',
                addProductQty: 1,
            });
        } catch (err) {
            toast.error(err.message || 'Failed to add product to order');
        } finally {
            this.setState({ actionLoading: false });
        }
    };

    // ─── Computed: Checked Total (PART 1) ─────────────────────────────────────

    getCheckedTotal = () => {
        const { selectedOrder, checkedItems, modalItems } = this.state;
        if (!selectedOrder) return 0;
        const checked = checkedItems[selectedOrder.id] || new Set();
        if (checked.size === 0) return 0;
        return modalItems
            .filter((item) => checked.has(item.productId))
            .reduce((sum, item) => sum + item.total, 0);
    };

    // ─── Order-Level Verified Checkbox (PART 3) ────────────────────────────────

    handleVerifyCheckbox = async (isChecked) => {
        if (!isChecked) return; // Verification is irreversible
        const { selectedOrder } = this.state;
        if (!selectedOrder || selectedOrder.status !== 'Pending') return;
        await this.handleVerify(selectedOrder.id);
    };

    // ─── Status Actions ────────────────────────────────────────────────────────

    handleVerify = async (orderId) => {
        this.setState({ actionLoading: true });
        try {
            const { selectedOrder, modalItems, checkedItems } = this.state;
            if (!selectedOrder || selectedOrder.id !== orderId) return;
            if (selectedOrder.status !== 'Pending') return;

            const checkedSet = checkedItems[orderId] || new Set(modalItems.map((i) => i.productId));
            if (!checkedSet || checkedSet.size === 0) {
                toast.warning('Select at least one item before verifying');
                return;
            }

            const finalItems = modalItems
                .filter((i) => checkedSet.has(i.productId))
                .map((i) => ({
                    ...i,
                    quantity: Math.max(1, parseInt(i.quantity, 10) || 1),
                    total: (i.price || 0) * (Math.max(1, parseInt(i.quantity, 10) || 1)),
                }));

            const finalTotal = finalItems.reduce((sum, i) => sum + (i.total || 0), 0);

            // Persist final items + total BEFORE verifying (backend will lock afterwards)
            await orderService.updateOrderBeforeVerify(orderId, finalItems, finalTotal);
            await orderService.verifyOrder(orderId);

            const orders = this.state.orders.map((o) =>
                o.id === orderId
                    ? { ...o, status: 'Verified', items: finalItems, grandTotal: finalTotal }
                    : o
            );

            const nextSelectedOrder = this.state.selectedOrder
                ? {
                      ...this.state.selectedOrder,
                      status: 'Verified',
                      items: finalItems,
                      grandTotal: finalTotal,
                  }
                : null;

            this.setState({
                orders,
                selectedOrder: nextSelectedOrder,
                modalItems: finalItems,
                checkedItems: {
                    ...checkedItems,
                    [orderId]: new Set(finalItems.map((i) => i.productId)),
                },
            });

            toast.success('Order verified and synced with customer.');
        } catch (err) {
            toast.error('Failed to update order status');
        } finally {
            this.setState({ actionLoading: false });
        }
    };

    // Payment Approval (PART 4)
    handleApprovePayment = async (orderId) => {
        this.setState({ actionLoading: true });
        try {
            await orderService.approvePayment(orderId);
            const orders = this.state.orders.map((o) =>
                o.id === orderId ? { ...o, paymentStatus: 'Paid' } : o
            );
            const selectedOrder = this.state.selectedOrder
                ? { ...this.state.selectedOrder, paymentStatus: 'Paid' }
                : null;
            this.setState({ orders, selectedOrder });
            toast.success('Payment approved for Order #' + orderId + ' 💳');
        } catch (err) {
            toast.error('Failed to approve payment');
        } finally {
            this.setState({ actionLoading: false });
        }
    };

    // Delivery (PART 6: only after Payment Approved)
    handleDeliver = async (orderId) => {
        const { selectedOrder } = this.state;
        if (!selectedOrder || selectedOrder.paymentStatus !== 'Paid') {
            toast.warning('Please approve payment before marking as delivered');
            return;
        }
        this.setState({ actionLoading: true });
        try {
            await orderService.deliverOrder(orderId);
            const orders = this.state.orders.map((o) =>
                o.id === orderId ? { ...o, status: 'Delivered' } : o
            );
            const updated = this.state.selectedOrder
                ? { ...this.state.selectedOrder, status: 'Delivered' }
                : null;
            this.setState({ orders, selectedOrder: updated });
            toast.success('Order #' + orderId + ' marked as Delivered 📦');
        } catch (err) {
            toast.error('Failed to update order status');
        } finally {
            this.setState({ actionLoading: false });
        }
    };

    // ─── Badge Helpers ─────────────────────────────────────────────────────────

    getStatusBadgeClass = (status) => {
        const map = {
            Pending: 'badge-warning',
            Verified: 'badge-info',
            Delivered: 'badge-success',
        };
        return map[status] || 'badge-warning';
    };

    getStatusIcon = (status) => {
        if (status === 'Pending') return '⏳';
        if (status === 'Verified') return '✅';
        if (status === 'Delivered') return '📦';
        return '';
    };

    getPaymentBadgeClass = (paymentStatus) => {
        if (paymentStatus === 'Paid') return 'badge-primary';
        return 'badge-warning';
    };

    getPaymentIcon = (paymentStatus) => {
        if (paymentStatus === 'Paid') return '💳';
        return '🔴';
    };

    // ─── Helpers ───────────────────────────────────────────────────────────────

    formatDate = (dateStr) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    // ─── Render ────────────────────────────────────────────────────────────────

    render() {
        return (
            <LanguageContext.Consumer>
                {(langCtx) => {
                    const {
                        orders,
                        loading,
                        error,
                        selectedOrder,
                        modalOpen,
                        checkedItems,
                        modalItems,
                        actionLoading,
                        products,
                        productsLoading,
                        addProductId,
                        addProductQty,
                    } = this.state;

                    // Checked total for modal
                    const checkedTotal = this.getCheckedTotal();

                    // Derived flags for selected order
                    const isVerified =
                        selectedOrder &&
                        ['Verified', 'Delivered'].includes(selectedOrder.status);
                    const isPaymentPaid =
                        selectedOrder && selectedOrder.paymentStatus === 'Paid';
                    const isDelivered =
                        selectedOrder && selectedOrder.status === 'Delivered';
                    // Lock editing once order moves past Pending
                    const isLocked =
                        selectedOrder && selectedOrder.status !== 'Pending';
                    const isPending = selectedOrder && selectedOrder.status === 'Pending';

                    return (
                        <div>
                            {/* ── Page Header ── */}
                            <PageHeader>
                                <h1>🛵 {langCtx.getText('onlineOrders')}</h1>
                                <p>{orders.length} Cash on Delivery order(s)</p>
                            </PageHeader>

                            {loading && <Spinner fullPage text="Loading orders..." />}
                            {error && <div className="alert alert-danger">{error}</div>}

                            {/* ── Empty State ── */}
                            {!loading && !error && orders.length === 0 && (
                                <EmptyState>
                                    <div className="empty-icon">🛵</div>
                                    <h3>{langCtx.getText('noOrders')}</h3>
                                    <p>{langCtx.getText('noOrdersMessage')}</p>
                                </EmptyState>
                            )}

                            {/* ── Orders Table ── */}
                            {!loading && !error && orders.length > 0 && (
                                <TableWrapper>
                                    <table className="table table-hover align-middle">
                                        <thead>
                                            <tr>
                                                <th>{langCtx.getText('orderId')}</th>
                                                <th>{langCtx.getText('customerName')}</th>
                                                <th>{langCtx.getText('phone')}</th>
                                                <th>{langCtx.getText('orderDate')}</th>
                                                <th className="text-end">{langCtx.getText('billAmount')}</th>
                                                <th className="text-center">{langCtx.getText('orderStatus')}</th>
                                                <th className="text-center">{langCtx.getText('viewOrder')}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {orders.map((order) => (
                                                <tr key={order.id}>
                                                    <td className="fw-bold">#{order.id}</td>
                                                    <td>{order.customerName}</td>
                                                    <td>{order.customerPhone || '—'}</td>
                                                    <td style={{ whiteSpace: 'nowrap' }}>
                                                        {this.formatDate(order.date)}
                                                    </td>
                                                    <td className="text-end fw-bold" style={{ color: '#2E7D32' }}>
                                                        ₹{order.grandTotal.toFixed(2)}
                                                    </td>
                                                    <td className="text-center">
                                                        <div className="d-flex flex-column align-items-center gap-1">
                                                            <Badge className={this.getStatusBadgeClass(order.status)}>
                                                                {this.getStatusIcon(order.status)} {order.status}
                                                            </Badge>
                                                            <Badge className={this.getPaymentBadgeClass(order.paymentStatus)}>
                                                                {this.getPaymentIcon(order.paymentStatus)}{' '}
                                                                {order.paymentStatus || 'Pending Payment'}
                                                            </Badge>
                                                        </div>
                                                    </td>
                                                    <td className="text-center">
                                                        <ActionButton
                                                            className="btn-view"
                                                            onClick={() => this.openModal(order)}
                                                        >
                                                            🔍 {langCtx.getText('viewOrder')}
                                                        </ActionButton>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </TableWrapper>
                            )}

                            {/* ══════════════════════════════════════════════════ */}
                            {/* ── Order Details Modal ── */}
                            {/* ══════════════════════════════════════════════════ */}
                            {modalOpen && selectedOrder && (
                                <ModalOverlay onClick={this.closeModal}>
                                    <ModalContent
                                        style={{ maxWidth: '680px', width: '100%' }}
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        {/* ── Modal Header ── */}
                                        <div className="modal-header">
                                            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                🛵 {langCtx.getText('orderDetails')} — #{selectedOrder.id}
                                                {isLocked && (
                                                    <span style={{
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '0.2rem',
                                                        background: '#495057',
                                                        color: 'white',
                                                        borderRadius: '4px',
                                                        padding: '0.15rem 0.5rem',
                                                        fontSize: '0.68rem',
                                                        fontWeight: '700',
                                                        letterSpacing: '0.5px',
                                                        textTransform: 'uppercase',
                                                    }}>
                                                        🔒 Order Finalized
                                                    </span>
                                                )}
                                            </h3>
                                            <button className="close-btn" onClick={this.closeModal}>
                                                ×
                                            </button>
                                        </div>

                                        <div className="modal-body">
                                            {/* ── PART 5: Customer Details ── */}
                                            <div
                                                style={{
                                                    background: '#f8f9fa',
                                                    borderRadius: '8px',
                                                    padding: '0.9rem 1rem',
                                                    marginBottom: '1rem',
                                                    border: '1px solid #e9ecef',
                                                }}
                                            >
                                                <SectionTitle>
                                                    👤 {langCtx.getText('customerDetails')}
                                                </SectionTitle>

                                                <div className="row g-0">
                                                    <div className="col-12 col-sm-6">
                                                        <DetailRow>
                                                            <span className="label">👤 {langCtx.getText('customerName')}</span>
                                                            <span className="value">{selectedOrder.customerName}</span>
                                                        </DetailRow>
                                                        <DetailRow>
                                                            <span className="label">📞 {langCtx.getText('phone')}</span>
                                                            <span className="value">{selectedOrder.customerPhone || '—'}</span>
                                                        </DetailRow>
                                                        {/* PART 5: Place field */}
                                                        <DetailRow>
                                                            <span className="label">🏘️ {langCtx.getText('place')}</span>
                                                            <span className="value">{selectedOrder.place || '—'}</span>
                                                        </DetailRow>
                                                        <DetailRow>
                                                            <span className="label">📍 Address</span>
                                                            <span className="value">{selectedOrder.address || '—'}</span>
                                                        </DetailRow>
                                                    </div>
                                                    <div className="col-12 col-sm-6">
                                                        <DetailRow>
                                                            <span className="label">📅 {langCtx.getText('orderDate')}</span>
                                                            <span className="value">{this.formatDate(selectedOrder.date)}</span>
                                                        </DetailRow>
                                                        <DetailRow>
                                                            <span className="label">📊 {langCtx.getText('orderStatus')}</span>
                                                            <span>
                                                                <Badge className={this.getStatusBadgeClass(selectedOrder.status)}>
                                                                    {this.getStatusIcon(selectedOrder.status)} {selectedOrder.status}
                                                                </Badge>
                                                            </span>
                                                        </DetailRow>
                                                        {/* PART 4 + 6: Payment Status */}
                                                        <DetailRow>
                                                            <span className="label">💳 {langCtx.getText('paymentStatus')}</span>
                                                            <span>
                                                                <Badge className={this.getPaymentBadgeClass(selectedOrder.paymentStatus)}>
                                                                    {this.getPaymentIcon(selectedOrder.paymentStatus)}{' '}
                                                                    {selectedOrder.paymentStatus || 'Pending Payment'}
                                                                </Badge>
                                                            </span>
                                                        </DetailRow>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* ── NEW: Add Product to Order (Pending Only) ── */}
                                            {isPending && (
                                                <div
                                                    style={{
                                                        background: '#f8f9fa',
                                                        borderRadius: '8px',
                                                        padding: '0.9rem 1rem',
                                                        marginBottom: '1rem',
                                                        border: '1px solid #e9ecef',
                                                    }}
                                                >
                                                    <SectionTitle>➕ Add Product to Order</SectionTitle>
                                                    <div className="row g-2 align-items-end">
                                                        <div className="col-12 col-md-7">
                                                            <label className="form-label small fw-semibold mb-1">
                                                                Product
                                                            </label>
                                                            <select
                                                                className="form-select"
                                                                value={addProductId}
                                                                onChange={this.onChangeAddProductId}
                                                                disabled={actionLoading || productsLoading}
                                                            >
                                                                <option value="">Select product...</option>
                                                                {products.map((p) => (
                                                                    <option key={p.id} value={p.id}>
                                                                        {p.name} — ₹{p.price}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                        <div className="col-6 col-md-3">
                                                            <label className="form-label small fw-semibold mb-1">
                                                                Quantity
                                                            </label>
                                                            <input
                                                                type="number"
                                                                className="form-control"
                                                                min="1"
                                                                value={addProductQty}
                                                                onChange={this.onChangeAddProductQty}
                                                                disabled={actionLoading}
                                                            />
                                                        </div>
                                                        <div className="col-6 col-md-2 d-grid">
                                                            <button
                                                                type="button"
                                                                className="btn btn-primary btn-sm"
                                                                onClick={this.handleAddProductToOrder}
                                                                disabled={actionLoading || productsLoading}
                                                                style={{ fontWeight: '700' }}
                                                            >
                                                                Add
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <small
                                                        className="text-muted d-block mt-2"
                                                        style={{ fontSize: '0.78rem' }}
                                                    >
                                                        Added items are selected by default and included in the total.
                                                    </small>
                                                </div>
                                            )}

                                            {/* ── PART 1 & 2: Ordered Items with Checkboxes + Qty Edit ── */}
                                            <SectionTitle>📦 {langCtx.getText('orderedItems')}</SectionTitle>

                                            <small
                                                className="text-muted d-block mb-2"
                                                style={{ fontSize: '0.78rem' }}
                                            >
                                                ℹ️ {langCtx.getText('editQtyNote')}
                                            </small>

                                            {/* Lock Banner */}
                                            {isLocked && (
                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.5rem',
                                                    padding: '0.55rem 0.85rem',
                                                    background: 'rgba(73, 80, 87, 0.07)',
                                                    border: '1px solid rgba(73, 80, 87, 0.2)',
                                                    borderRadius: '6px',
                                                    marginBottom: '0.65rem',
                                                    fontSize: '0.82rem',
                                                    color: '#495057',
                                                }}>
                                                    🔒 <span>This order is <strong>finalized</strong> and cannot be modified. Items and quantities are read-only.</span>
                                                </div>
                                            )}

                                            <div
                                                style={{
                                                    border: '1px solid #e9ecef',
                                                    borderRadius: '8px',
                                                    overflow: 'hidden',
                                                    opacity: isLocked ? 0.82 : 1,
                                                    transition: 'opacity 0.25s ease',
                                                }}
                                            >
                                                <table className="table table-hover table-sm mb-0">
                                                    <thead style={{ background: '#f8f9fa' }}>
                                                        <tr>
                                                            <th
                                                                className="text-center"
                                                                style={{ width: '44px', padding: '0.55rem 0.5rem' }}
                                                            >
                                                                ✓
                                                            </th>
                                                            <th style={{ padding: '0.55rem 0.75rem' }}>
                                                                {langCtx.getText('productName')}
                                                            </th>
                                                            <th
                                                                className="text-center"
                                                                style={{ width: '110px', padding: '0.55rem 0.5rem' }}
                                                            >
                                                                {langCtx.getText('quantity')}
                                                            </th>
                                                            <th
                                                                className="text-center"
                                                                style={{ width: '80px', padding: '0.55rem 0.5rem' }}
                                                            >
                                                                {langCtx.getText('price')}
                                                            </th>
                                                            <th
                                                                className="text-end"
                                                                style={{ width: '90px', padding: '0.55rem 0.75rem' }}
                                                            >
                                                                {langCtx.getText('total')}
                                                            </th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {modalItems.map((item) => {
                                                            const checked = (
                                                                checkedItems[selectedOrder.id] || new Set()
                                                            ).has(item.productId);

                                                            return (
                                                                <tr
                                                                    key={item.productId}
                                                                    style={{
                                                                        background: checked
                                                                            ? 'rgba(67,160,71,0.06)'
                                                                            : 'white',
                                                                    }}
                                                                >
                                                                    {/* PART 5: Item Checkbox */}
                                                                    <td
                                                                        className="text-center"
                                                                        style={{ padding: '0.55rem 0.5rem' }}
                                                                    >
                                                                        <input
                                                                            type="checkbox"
                                                                            className="form-check-input m-0"
                                                                            checked={checked}
                                                                            onChange={() =>
                                                                                this.toggleItemCheck(item.productId)
                                                                            }
                                                                            disabled={isLocked}
                                                                            style={{
                                                                                cursor: isLocked ? 'not-allowed' : 'pointer',
                                                                                accentColor: '#2E7D32',
                                                                            }}
                                                                        />
                                                                    </td>

                                                                    {/* Product Name */}
                                                                    <td
                                                                        style={{
                                                                            padding: '0.55rem 0.75rem',
                                                                            fontWeight: checked ? '600' : '400',
                                                                            fontSize: '0.85rem',
                                                                        }}
                                                                    >
                                                                        {item.name}
                                                                    </td>

                                                                    {/* PART 2: Editable Quantity */}
                                                                    <td
                                                                        className="text-center"
                                                                        style={{ padding: '0.4rem 0.5rem' }}
                                                                    >
                                                                        <QtyControl>
                                                                            <button
                                                                                className="qty-btn"
                                                                                onClick={() =>
                                                                                    this.updateItemQuantity(item.productId, -1)
                                                                                }
                                                                                disabled={isLocked || item.quantity <= 1}
                                                                                title={isLocked ? 'Order is locked' : 'Decrease quantity'}
                                                                            >
                                                                                −
                                                                            </button>
                                                                            <span className="qty-value">
                                                                                {item.quantity}
                                                                            </span>
                                                                            <button
                                                                                className="qty-btn"
                                                                                onClick={() =>
                                                                                    this.updateItemQuantity(item.productId, +1)
                                                                                }
                                                                                disabled={isLocked}
                                                                                title={isLocked ? 'Order is locked' : 'Increase quantity'}
                                                                            >
                                                                                +
                                                                            </button>
                                                                        </QtyControl>
                                                                    </td>

                                                                    {/* Unit Price */}
                                                                    <td
                                                                        className="text-center"
                                                                        style={{
                                                                            padding: '0.55rem 0.5rem',
                                                                            fontSize: '0.85rem',
                                                                        }}
                                                                    >
                                                                        ₹{item.price}
                                                                    </td>

                                                                    {/* PART 1: Dynamic Item Total */}
                                                                    <td
                                                                        className="text-end fw-bold"
                                                                        style={{
                                                                            padding: '0.55rem 0.75rem',
                                                                            color: '#2E7D32',
                                                                            fontSize: '0.875rem',
                                                                        }}
                                                                    >
                                                                        ₹{item.total.toFixed(2)}
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>

                                            {/* PART 1: Checked Total — dynamic, updates with checkboxes + qty */}
                                            <TotalBar>
                                                <span className="total-label">
                                                    {checkedItems[selectedOrder.id] &&
                                                    checkedItems[selectedOrder.id].size > 0
                                                        ? `✓ Selected Total (${checkedItems[selectedOrder.id].size} item${
                                                              checkedItems[selectedOrder.id].size > 1 ? 's' : ''
                                                          }):`
                                                        : 'Select items above to calculate total:'}
                                                </span>
                                                <span className="total-value">
                                                    ₹{checkedTotal.toFixed(2)}
                                                </span>
                                            </TotalBar>

                                            {/* PART 4: Payment Section */}
                                            <div
                                                style={{
                                                    background: isPaymentPaid
                                                        ? 'rgba(13,110,253,0.06)'
                                                        : '#fff9f0',
                                                    border: isPaymentPaid
                                                        ? '1px solid rgba(13,110,253,0.25)'
                                                        : '1px solid #ffe0b2',
                                                    borderRadius: '8px',
                                                    padding: '0.75rem 1rem',
                                                    marginBottom: '0.25rem',
                                                }}
                                            >
                                                <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                                                    <div>
                                                        <span
                                                            style={{
                                                                fontSize: '0.8rem',
                                                                fontWeight: '600',
                                                                color: '#6c757d',
                                                                textTransform: 'uppercase',
                                                                letterSpacing: '0.5px',
                                                            }}
                                                        >
                                                            💳 {langCtx.getText('paymentStatus')}:
                                                        </span>{' '}
                                                        <Badge
                                                            className={this.getPaymentBadgeClass(
                                                                selectedOrder.paymentStatus
                                                            )}
                                                            style={{ marginLeft: '0.3rem' }}
                                                        >
                                                            {selectedOrder.paymentStatus || 'Pending Payment'}
                                                        </Badge>
                                                    </div>
                                                    {!isPaymentPaid && (
                                                        <ActionButton
                                                            className="btn-payment"
                                                            onClick={() =>
                                                                this.handleApprovePayment(selectedOrder.id)
                                                            }
                                                            disabled={actionLoading}
                                                        >
                                                            {actionLoading ? (
                                                                <>
                                                                    <span className="spinner-border spinner-border-sm" />
                                                                    Processing...
                                                                </>
                                                            ) : (
                                                                <>💳 {langCtx.getText('approvePayment')}</>
                                                            )}
                                                        </ActionButton>
                                                    )}
                                                    {isPaymentPaid && (
                                                        <span
                                                            style={{
                                                                fontSize: '0.82rem',
                                                                color: '#0a58ca',
                                                                fontWeight: '600',
                                                            }}
                                                        >
                                                            ✔ {langCtx.getText('paymentApproved')}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* ── Modal Footer (PART 3 + 6 + 7) ── */}
                                        <div
                                            className="modal-footer"
                                            style={{ flexWrap: 'wrap', gap: '0.5rem' }}
                                        >
                                            {/* PART 3: Order-level Verified Checkbox */}
                                            <VerifyCheckWrapper>
                                                <input
                                                    type="checkbox"
                                                    id="verifyOrderCheck"
                                                    checked={isVerified || false}
                                                    disabled={
                                                        isVerified || isDelivered || actionLoading
                                                    }
                                                    onChange={(e) =>
                                                        this.handleVerifyCheckbox(e.target.checked)
                                                    }
                                                />
                                                <label htmlFor="verifyOrderCheck">
                                                    {langCtx.getText('markOrderVerified')}
                                                </label>
                                            </VerifyCheckWrapper>

                                            <div className="ms-auto d-flex gap-2 flex-wrap">
                                                {/* PART 6: Delivered Button — only after payment */}
                                                <ActionButton
                                                    className="btn-deliver"
                                                    onClick={() => this.handleDeliver(selectedOrder.id)}
                                                    disabled={
                                                        actionLoading ||
                                                        isDelivered ||
                                                        !isPaymentPaid
                                                    }
                                                    title={
                                                        !isPaymentPaid
                                                            ? 'Approve payment first before marking as delivered'
                                                            : isDelivered
                                                            ? 'Already Delivered'
                                                            : 'Mark as Delivered'
                                                    }
                                                >
                                                    {actionLoading ? (
                                                        <>
                                                            <span className="spinner-border spinner-border-sm" />
                                                            Processing...
                                                        </>
                                                    ) : (
                                                        <>📦 {langCtx.getText('markDelivered')}</>
                                                    )}
                                                </ActionButton>

                                                <button
                                                    className="btn btn-outline-secondary btn-sm"
                                                    onClick={this.closeModal}
                                                    style={{ fontSize: '0.82rem', fontWeight: '600' }}
                                                >
                                                    {langCtx.getText('close')}
                                                </button>
                                            </div>
                                        </div>
                                    </ModalContent>
                                </ModalOverlay>
                            )}
                        </div>
                    );
                }}
            </LanguageContext.Consumer>
        );
    }
}

export default AdminOnlineOrdersPage;
