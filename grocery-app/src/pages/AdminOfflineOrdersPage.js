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

// ─── Styled Components (match AdminOnlineOrdersPage look) ────────────────────

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

    &.btn-primary-soft {
        background: rgba(13, 110, 253, 0.1);
        color: #0a58ca;
        border: 1px solid rgba(13, 110, 253, 0.35);
        &:hover:not(:disabled) {
            background: rgba(13, 110, 253, 0.22);
        }
    }

    &.btn-view {
        background: #f8f9fa;
        color: #495057;
        border: 1px solid #dee2e6;
        &:hover {
            background: #e9ecef;
        }
    }

    &:disabled {
        opacity: 0.4;
        cursor: not-allowed;
    }
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

    .total-label {
        font-size: 0.82rem;
        color: #388e3c;
        font-weight: 600;
    }

    .total-value {
        font-size: 1.05rem;
        font-weight: 800;
        color: #1b5e20;
    }
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

class AdminOfflineOrdersPage extends React.Component {
    constructor(props) {
        super(props);
        const today = new Date();
        const todayStr = today.toISOString().slice(0, 10);

        this.state = {
            // Spec: these keys must exist and match shapes
            products: [],
            offlineOrders: [],
            isLoading: true,
            selectedItems: [],

            // Back-compat for existing render logic
            loading: true,
            error: null,
            actionLoading: false,
            productsLoading: false,

            // Create Offline Order Modal
            createModalOpen: false,
            customerName: '',
            phone: '',
            place: '',
            address: '',
            orderDate: todayStr,
            createItems: [],
            createChecked: new Set(),
            createAddProductId: '',
            createAddQty: 1,

            // View Order Details Modal
            modalOpen: false,
            selectedOrder: null,
            modalItems: [],
            checkedItems: {},
            addProductId: '',
            addProductQty: 1,
        };
    }

    componentDidMount() {
        this.fetchOfflineOrders();
        this.fetchProducts();
    }

    // ─── Data Fetching ───────────────────────────────────────────────────────

    fetchOfflineOrders = async () => {
        this.setState({ loading: true, isLoading: true });
        try {
            const response = await orderService.getOfflineOrders();
            const offlineOrders = Array.isArray(response)
                ? response
                : (response?.orders || response?.data?.orders || response?.data || []);

            this.setState({
                offlineOrders: Array.isArray(offlineOrders) ? offlineOrders : [],
                loading: false,
                isLoading: false,
            });
        } catch (err) {
            this.setState({ error: 'Failed to load offline orders', loading: false, isLoading: false });
            toast.error('Failed to load offline orders');
        }
    };

    fetchProducts = async () => {
        this.setState({ productsLoading: true });
        try {
            const response = await productService.getProducts();

            // Backend response (spec): { success: true, products: [...], pagination: {...} }
            // productService.getProducts() returns response.data (already unwrapped once).
            const extracted = Array.isArray(response)
                ? response
                : (response?.products || response?.data?.products || response?.data || []);
            const safeProducts = Array.isArray(extracted) ? extracted : [];

            this.setState({ products: safeProducts, productsLoading: false }, () => {
                // PART 4 — Debug Logging
                console.log('Offline Products State:', this.state.products);
            });
        } catch (err) {
            this.setState({ productsLoading: false });
            toast.error('Failed to load products');
        }
    };

    // ─── Helpers ─────────────────────────────────────────────────────────────

    formatDate = (dateStr) => {
        const d = new Date(dateStr);
        return (
            d.toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
            }) +
            ' | ' +
            d.toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit',
            })
        );
    };

    getStatusBadgeClass = (status) => {
        const map = {
            Pending: 'badge-warning',
            Verified: 'badge-info',
            Paid: 'badge-primary',
            Delivered: 'badge-success',
            Rejected: 'badge-danger',
        };
        return map[status] || 'badge-warning';
    };

    getStatusIcon = (status) => {
        if (status === 'Pending') return '⏳';
        if (status === 'Verified') return '✅';
        if (status === 'Paid') return '💳';
        if (status === 'Delivered') return '📦';
        if (status === 'Rejected') return '❌';
        return '';
    };

    // ─── Create Offline Order Modal ──────────────────────────────────────────

    openCreateModal = () => {
        const todayStr = new Date().toISOString().slice(0, 10);
        this.setState({
            createModalOpen: true,
            customerName: '',
            phone: '',
            place: '',
            address: '',
            orderDate: todayStr,
            createItems: [],
            createChecked: new Set(),
            createAddProductId: '',
            createAddQty: 1,
        });
    };

    closeCreateModal = () => {
        this.setState({ createModalOpen: false });
    };

    onCreateFieldChange = (field) => (e) => {
        this.setState({ [field]: e.target.value });
    };

    onCreateAddQtyChange = (e) => {
        const qty = Math.max(1, parseInt(e.target.value, 10) || 1);
        this.setState({ createAddQty: qty });
    };

    addItemToCreate = () => {
        const { createAddProductId, createAddQty, products, createItems } = this.state;
        const productId = parseInt(createAddProductId, 10);
        if (!productId) {
            toast.warning('Please select a product');
            return;
        }

        const product = products.find((p) => p.id === productId);
        if (!product) {
            toast.error('Selected product not found');
            return;
        }

        const quantity = Math.max(1, parseInt(createAddQty, 10) || 1);
        const existingIdx = createItems.findIndex((i) => i.productId === productId);

        let nextItems = [];
        if (existingIdx !== -1) {
            nextItems = createItems.map((i) => {
                if (i.productId !== productId) return i;
                const nextQty = (i.quantity || 0) + quantity;
                return {
                    ...i,
                    quantity: nextQty,
                    total: (i.price || product.price) * nextQty,
                };
            });
        } else {
            nextItems = [
                ...createItems,
                {
                    productId: productId,
                    name: product.name,
                    price: product.price,
                    quantity: quantity,
                    total: product.price * quantity,
                },
            ];
        }

        const nextChecked = new Set(this.state.createChecked);
        nextChecked.add(productId);

        this.setState({
            createItems: nextItems,
            createChecked: nextChecked,
            createAddProductId: '',
            createAddQty: 1,
        });
    };

    toggleCreateCheck = (productId) => {
        const next = new Set(this.state.createChecked);
        if (next.has(productId)) next.delete(productId);
        else next.add(productId);
        this.setState({ createChecked: next });
    };

    updateCreateQuantity = (productId, delta) => {
        const nextItems = this.state.createItems.map((i) => {
            if (i.productId !== productId) return i;
            const nextQty = Math.max(0, (Number(i.quantity || 0) || 0) + delta);
            return { ...i, quantity: nextQty, total: (Number(i.price || 0) || 0) * (Number(nextQty || 0) || 0) };
        });
        this.setState({ createItems: nextItems });
    };

    removeCreateItem = (productId) => {
        const nextItems = this.state.createItems.filter((i) => i.productId !== productId);
        const nextChecked = new Set(this.state.createChecked);
        nextChecked.delete(productId);
        this.setState({ createItems: nextItems, createChecked: nextChecked });
    };

    getCreateSelectedTotal = () => {
        const { createItems, createChecked } = this.state;
        if (!createChecked || createChecked.size === 0) return 0;
        return createItems
            .filter((i) => createChecked.has(i.productId))
            .reduce((sum, i) => sum + (i.total || 0), 0);
    };

    getCreateGrandTotal = () => {
        return this.state.createItems.reduce((sum, i) => sum + (i.total || 0), 0);
    };

    saveOfflineOrder = async () => {
        const {
            customerName,
            phone,
            place,
            address,
            orderDate,
            createItems,
            createChecked,
        } = this.state;

        if (!customerName.trim()) {
            toast.warning('Customer Name is required');
            return;
        }
        if (!phone.trim()) {
            toast.warning('Phone Number is required');
            return;
        }
        if (!place.trim()) {
            toast.warning('Place / City is required');
            return;
        }
        if (!createItems.length) {
            toast.warning('Add at least one item');
            return;
        }
        if (!createChecked || createChecked.size === 0) {
            toast.warning('Select at least one item to bill');
            return;
        }

        const finalItems = createItems
            .filter((i) => createChecked.has(i.productId))
            .map((i) => {
                const qtyRaw = parseInt(i.quantity, 10);
                const qty = Number.isFinite(qtyRaw) ? Math.max(0, qtyRaw) : 0;
                const price = parseFloat(i.price) || 0;
                return {
                    ...i,
                    productName: i.productName || i.name || '',
                    name: i.name || i.productName || '',
                    quantity: qty,
                    price: price,
                    total: (Number(price || 0) || 0) * (Number(qty || 0) || 0),
                };
            })
            .filter((i) => (Number(i.quantity || 0) || 0) > 0);

        if (finalItems.length === 0) {
            toast.warning('Selected items must have quantity greater than 0');
            return;
        }

        const totalAmount = finalItems.reduce((sum, i) => sum + (i.total || 0), 0);
        const orderDateIso = orderDate ? new Date(orderDate).toISOString() : new Date().toISOString();

        this.setState({ actionLoading: true });
        try {
            await orderService.createOfflineOrder({
                customerName: customerName.trim(),
                phone: phone.trim(),
                place: place.trim(),
                address: address.trim(),
                items: finalItems,
                totalAmount,
                status: 'Pending',
                orderType: 'Offline',
                orderDate: orderDateIso,
            });
            toast.success('Offline order created successfully');
            this.closeCreateModal();
            await this.fetchOfflineOrders();
        } catch (err) {
            toast.error(err.message || 'Failed to create offline order');
        } finally {
            this.setState({ actionLoading: false });
        }
    };

    // ─── View Order Details Modal ────────────────────────────────────────────

    openModal = (order) => {
        const orderId = order.id;
        const hasTracked = Object.prototype.hasOwnProperty.call(this.state.checkedItems, orderId);
        const existingChecked = hasTracked
            ? this.state.checkedItems[orderId]
            : new Set((order.items || []).map((item) => item.productId));

        const normalizedItems = (order.items || []).map((i) => {
            const qty = Math.max(0, parseInt(i.quantity, 10) || 0);
            const price = parseFloat(i.price) || 0;
            return {
                ...i,
                name: i.name || i.productName || '',
                productName: i.productName || i.name || '',
                quantity: qty,
                price: price,
                total: typeof i.total === 'number' ? i.total : (Number(price || 0) || 0) * (Number(qty || 0) || 0),
            };
        });

        this.setState({
            selectedOrder: order,
            modalOpen: true,
            modalItems: normalizedItems,
            checkedItems: {
                ...this.state.checkedItems,
                [orderId]: existingChecked,
            },
            addProductId: '',
            addProductQty: 1,
        });
    };

    closeModal = () => {
        this.setState({ selectedOrder: null, modalOpen: false, modalItems: [] });
    };

    toggleItemCheck = (productId) => {
        const { selectedOrder, checkedItems } = this.state;
        if (!selectedOrder) return;
        if (selectedOrder.status !== 'Pending') return;

        const currentSet = new Set(checkedItems[selectedOrder.id] || []);
        if (currentSet.has(productId)) currentSet.delete(productId);
        else currentSet.add(productId);

        this.setState({
            checkedItems: {
                ...checkedItems,
                [selectedOrder.id]: currentSet,
            },
        });
    };

    updateItemQuantity = (productId, delta) => {
        const { selectedOrder } = this.state;
        if (selectedOrder && selectedOrder.status !== 'Pending') return;

        const updated = this.state.modalItems.map((i) => {
            if (i.productId !== productId) return i;
            const nextQty = Math.max(0, (Number(i.quantity || 0) || 0) + delta);
            return {
                ...i,
                quantity: nextQty,
                total: (Number(i.price || 0) || 0) * (Number(nextQty || 0) || 0),
            };
        });

        this.setState({ modalItems: updated });
    };

    removeModalItem = (productId) => {
        const { selectedOrder } = this.state;
        if (!selectedOrder || selectedOrder.status !== 'Pending') return;

        const updated = this.state.modalItems.filter((i) => i.productId !== productId);
        const currentSet = new Set(this.state.checkedItems[selectedOrder.id] || []);
        currentSet.delete(productId);

        this.setState({
            modalItems: updated,
            checkedItems: {
                ...this.state.checkedItems,
                [selectedOrder.id]: currentSet,
            },
        });
    };

    getCheckedTotal = () => {
        const { selectedOrder, checkedItems, modalItems } = this.state;
        if (!selectedOrder) return 0;
        const checked = checkedItems[selectedOrder.id] || new Set();
        if (checked.size === 0) return 0;
        return modalItems
            .filter((i) => checked.has(i.productId))
            .reduce((sum, i) => sum + ((Number(i.total || 0) || 0)), 0);
    };

    onChangeAddProductId = (e) => {
        this.setState({ addProductId: e.target.value });
    };

    onChangeAddProductQty = (e) => {
        const qty = Math.max(1, parseInt(e.target.value, 10) || 1);
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

        const product = products.find((p) => p.id === productId);
        if (!product) {
            toast.error('Selected product not found');
            return;
        }

        const quantity = Math.max(1, parseInt(addProductQty, 10) || 1);

        this.setState({ actionLoading: true });
        try {
            await orderService.addItemToOrder(selectedOrder.id, productId, quantity);

            const existingIdx = modalItems.findIndex((i) => i.productId === productId);
            let nextModalItems = [];
            if (existingIdx !== -1) {
                nextModalItems = modalItems.map((i) => {
                    if (i.productId !== productId) return i;
                    const nextQty = (i.quantity || 0) + quantity;
                    return { ...i, quantity: nextQty, total: (i.price || product.price) * nextQty };
                });
            } else {
                nextModalItems = [
                    ...modalItems,
                    {
                        productId,
                        name: product.name,
                        price: product.price,
                        quantity,
                        total: product.price * quantity,
                    },
                ];
            }

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

    handleVerifyCheckbox = async (isChecked) => {
        if (!isChecked) return;
        const { selectedOrder } = this.state;
        if (!selectedOrder || selectedOrder.status !== 'Pending') return;
        await this.handleVerify(selectedOrder.id);
    };

    handleVerify = async (orderId) => {
        this.setState({ actionLoading: true });
        try {
            const { selectedOrder, modalItems, checkedItems } = this.state;
            if (!selectedOrder || selectedOrder.id !== orderId) return;

            const checkedSet = checkedItems[orderId] || new Set(modalItems.map((i) => i.productId));
            if (!checkedSet || checkedSet.size === 0) {
                toast.warning('Select at least one item before verifying');
                return;
            }

            const finalItems = modalItems
                .filter((i) => checkedSet.has(i.productId))
                .map((i) => {
                    const qtyRaw = parseInt(i.quantity, 10);
                    const qty = Number.isFinite(qtyRaw) ? Math.max(0, qtyRaw) : 0;
                    const price = parseFloat(i.price) || 0;
                    return {
                        ...i,
                        productName: i.productName || i.name || '',
                        name: i.name || i.productName || '',
                        quantity: qty,
                        price: price,
                        total: (Number(price || 0) || 0) * (Number(qty || 0) || 0),
                    };
                })
                .filter((i) => (Number(i.quantity || 0) || 0) > 0);

            if (finalItems.length === 0) {
                toast.warning('Selected items must have quantity greater than 0');
                return;
            }

            const finalTotal = finalItems.reduce((sum, i) => sum + (i.total || 0), 0);

            await orderService.updateOrderBeforeVerify(orderId, finalItems, finalTotal);
            await orderService.verifyOrder(orderId);

            const offlineOrders = this.state.offlineOrders.map((o) =>
                o.id === orderId
                    ? { ...o, status: 'Verified', items: finalItems, grandTotal: finalTotal }
                    : o
            );

            this.setState({
                offlineOrders,
                selectedOrder: { ...this.state.selectedOrder, status: 'Verified', items: finalItems, grandTotal: finalTotal },
                modalItems: finalItems,
                checkedItems: {
                    ...checkedItems,
                    [orderId]: new Set(finalItems.map((i) => i.productId)),
                },
            });

            toast.success('Order verified and locked.');
        } catch (err) {
            toast.error('Failed to verify order');
        } finally {
            this.setState({ actionLoading: false });
        }
    };

    handleMarkPaid = async (orderId) => {
        this.setState({ actionLoading: true });
        try {
            await orderService.approvePayment(orderId);

            const offlineOrders = this.state.offlineOrders.map((o) =>
                o.id === orderId ? { ...o, status: 'Paid', paymentType: 'Cash', paymentStatus: 'Paid' } : o
            );

            const selectedOrder = this.state.selectedOrder
                ? { ...this.state.selectedOrder, status: 'Paid', paymentType: 'Cash', paymentStatus: 'Paid' }
                : null;

            this.setState({ offlineOrders, selectedOrder });
            toast.success('Payment marked as Paid 💳');
        } catch (err) {
            toast.error('Failed to update payment status');
        } finally {
            this.setState({ actionLoading: false });
        }
    };

    handleDeliver = async (orderId) => {
        this.setState({ actionLoading: true });
        try {
            await orderService.deliverOrder(orderId);

            const offlineOrders = this.state.offlineOrders.map((o) =>
                o.id === orderId ? { ...o, status: 'Delivered' } : o
            );

            const selectedOrder = this.state.selectedOrder
                ? { ...this.state.selectedOrder, status: 'Delivered' }
                : null;

            this.setState({ offlineOrders, selectedOrder });
            toast.success('Order marked as Delivered 📦');
        } catch (err) {
            toast.error('Failed to update order status');
        } finally {
            this.setState({ actionLoading: false });
        }
    };

    handleReject = async (orderId) => {
        const { selectedOrder } = this.state;
        if (!selectedOrder || selectedOrder.status !== 'Pending') return;

        const ok = window.confirm('Reject this offline order?');
        if (!ok) return;

        this.setState({ actionLoading: true });
        try {
            await orderService.rejectOrder(orderId);
            toast.success('Order rejected');
            await this.fetchOfflineOrders();
            // If modal is open for the same order, reflect status immediately
            const updatedSelected = this.state.selectedOrder && this.state.selectedOrder.id === orderId
                ? { ...this.state.selectedOrder, status: 'Rejected' }
                : this.state.selectedOrder;
            this.setState({ selectedOrder: updatedSelected });
        } catch (err) {
            toast.error('Reject failed');
        } finally {
            this.setState({ actionLoading: false });
        }
    };

    // ─── Render ──────────────────────────────────────────────────────────────

    render() {
        return (
            <LanguageContext.Consumer>
                {(langCtx) => {
                    const {
                        offlineOrders,
                        isLoading,
                        loading,
                        error,
                        createModalOpen,
                        actionLoading,
                        products,
                        productsLoading,
                        customerName,
                        phone,
                        place,
                        address,
                        orderDate,
                        createItems,
                        createAddProductId,
                        createAddQty,
                        modalOpen,
                        selectedOrder,
                        modalItems,
                        checkedItems,
                        addProductId,
                        addProductQty,
                    } = this.state;

                    const createSelectedTotal = this.getCreateSelectedTotal();
                    const createGrandTotal = this.getCreateGrandTotal();

                    const checkedTotal = this.getCheckedTotal();
                    const isLocked = selectedOrder && selectedOrder.status !== 'Pending';
                    const isPending = selectedOrder && selectedOrder.status === 'Pending';
                    const isVerified = selectedOrder && selectedOrder.status === 'Verified';
                    const isPaid = selectedOrder && selectedOrder.status === 'Paid';
                    const isDelivered = selectedOrder && selectedOrder.status === 'Delivered';
                    const isRejected = selectedOrder && selectedOrder.status === 'Rejected';

                    const effectiveLoading = typeof isLoading === 'boolean' ? isLoading : loading;

                    return (
                        <div>
                            <PageHeader>
                                <h1>🧾 Offline Orders</h1>
                                <p>{offlineOrders.length} offline order(s)</p>
                            </PageHeader>

                            <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
                                <div className="text-muted" style={{ fontSize: '0.9rem' }}>
                                    Create and manage offline orders (Cash by default)
                                </div>
                                <ActionButton
                                    className="btn-primary-soft"
                                    onClick={this.openCreateModal}
                                    disabled={productsLoading}
                                >
                                    ➕ Create Offline Order
                                </ActionButton>
                            </div>

                            {effectiveLoading && <Spinner fullPage text="Loading offline orders..." />}
                            {error && <div className="alert alert-danger">{error}</div>}

                            {!effectiveLoading && !error && offlineOrders.length === 0 && (
                                <EmptyState>
                                    <div className="empty-icon">🧾</div>
                                    <h3>No Offline Orders</h3>
                                    <p>Create your first offline order using the button above.</p>
                                </EmptyState>
                            )}

                            {!effectiveLoading && !error && offlineOrders.length > 0 && (
                                <TableWrapper>
                                    <table className="table table-hover align-middle">
                                        <thead>
                                            <tr>
                                                <th>{langCtx.getText('orderId')}</th>
                                                <th>{langCtx.getText('customerName')}</th>
                                                <th>{langCtx.getText('phone')}</th>
                                                <th>{langCtx.getText('place')}</th>
                                                <th style={{ whiteSpace: 'normal' }}>Order Date</th>
                                                <th className="text-end">{langCtx.getText('total')}</th>
                                                <th className="text-center">Type</th>
                                                <th className="text-center">{langCtx.getText('orderStatus')}</th>
                                                <th className="text-center">{langCtx.getText('viewOrder')}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {Array.isArray(offlineOrders) && offlineOrders.map((order) => {
                                                const total = typeof order.grandTotal === 'number'
                                                    ? order.grandTotal
                                                    : (typeof order.totalAmount === 'number' ? order.totalAmount : 0);
                                                const phoneVal = order.customerPhone || order.phone || '—';
                                                return (
                                                    <tr key={order.id}>
                                                        <td className="fw-bold">#{order.id}</td>
                                                        <td>{order.customerName}</td>
                                                        <td>{phoneVal}</td>
                                                        <td>{order.place || '—'}</td>
                                                        <td style={{ whiteSpace: 'normal' }}>
                                                            {this.formatDate(order.orderDate || order.date)}
                                                        </td>
                                                        <td className="text-end fw-bold" style={{ color: '#2E7D32' }}>
                                                            ₹{total.toFixed(2)}
                                                        </td>
                                                        <td className="text-center">
                                                            <Badge className="badge-admin">Offline</Badge>
                                                        </td>
                                                        <td className="text-center">
                                                            <Badge className={this.getStatusBadgeClass(order.status)}>
                                                                {this.getStatusIcon(order.status)} {order.status}
                                                            </Badge>
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
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </TableWrapper>
                            )}

                            {/* ── Create Offline Order Modal ── */}
                            {createModalOpen && (
                                <ModalOverlay onClick={this.closeCreateModal}>
                                    <ModalContent
                                        style={{ maxWidth: '860px', width: '100%' }}
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <div className="modal-header">
                                            <h3>➕ Create Offline Order</h3>
                                            <button className="close-btn" onClick={this.closeCreateModal}>
                                                ×
                                            </button>
                                        </div>

                                        <div className="modal-body">
                                            {/* STEP 1: Customer Details */}
                                            <div
                                                style={{
                                                    background: '#f8f9fa',
                                                    borderRadius: '8px',
                                                    padding: '0.9rem 1rem',
                                                    marginBottom: '1rem',
                                                    border: '1px solid #e9ecef',
                                                }}
                                            >
                                                <SectionTitle>Step 1 — Customer Details</SectionTitle>
                                                <div className="row g-2">
                                                    <div className="col-12 col-md-6">
                                                        <label className="form-label small fw-semibold mb-1">
                                                            Customer Name <span className="text-danger">*</span>
                                                        </label>
                                                        <input
                                                            type="text"
                                                            className="form-control"
                                                            value={customerName}
                                                            onChange={this.onCreateFieldChange('customerName')}
                                                            placeholder="Enter customer name"
                                                        />
                                                    </div>
                                                    <div className="col-12 col-md-6">
                                                        <label className="form-label small fw-semibold mb-1">
                                                            Phone Number <span className="text-danger">*</span>
                                                        </label>
                                                        <input
                                                            type="text"
                                                            className="form-control"
                                                            value={phone}
                                                            onChange={this.onCreateFieldChange('phone')}
                                                            placeholder="Enter phone number"
                                                        />
                                                    </div>
                                                    <div className="col-12 col-md-6">
                                                        <label className="form-label small fw-semibold mb-1">
                                                            Place / City <span className="text-danger">*</span>
                                                        </label>
                                                        <input
                                                            type="text"
                                                            className="form-control"
                                                            value={place}
                                                            onChange={this.onCreateFieldChange('place')}
                                                            placeholder="Enter place / city"
                                                        />
                                                    </div>
                                                    <div className="col-12 col-md-6">
                                                        <label className="form-label small fw-semibold mb-1">Order Date</label>
                                                        <input
                                                            type="date"
                                                            className="form-control"
                                                            value={orderDate}
                                                            onChange={this.onCreateFieldChange('orderDate')}
                                                        />
                                                    </div>
                                                    <div className="col-12">
                                                        <label className="form-label small fw-semibold mb-1">Address (Optional)</label>
                                                        <input
                                                            type="text"
                                                            className="form-control"
                                                            value={address}
                                                            onChange={this.onCreateFieldChange('address')}
                                                            placeholder="Enter address"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* STEP 2: Add Items */}
                                            <div
                                                style={{
                                                    background: '#fff',
                                                    borderRadius: '8px',
                                                    padding: '0.9rem 1rem',
                                                    marginBottom: '1rem',
                                                    border: '1px solid #e9ecef',
                                                }}
                                            >
                                                <SectionTitle>Step 2 — Add Items</SectionTitle>
                                                <div className="row g-2 align-items-end mb-3">
                                                    <div className="col-12 col-md-7">
                                                        <label className="form-label small fw-semibold mb-1">Product</label>
                                                        <select
                                                            className="form-select"
                                                            value={createAddProductId}
                                                            onChange={(e) => this.setState({ createAddProductId: e.target.value })}
                                                            disabled={productsLoading}
                                                        >
                                                            <option value="">Select product...</option>
                                                            {Array.isArray(products) &&
                                                                products.map((p) => (
                                                                <option key={p.id ?? p._id} value={p.id ?? p._id}>
                                                                    {p.name} — ₹{p.price}
                                                                </option>
                                                                ))}
                                                        </select>
                                                    </div>
                                                    <div className="col-6 col-md-3">
                                                        <label className="form-label small fw-semibold mb-1">Quantity</label>
                                                        <input
                                                            type="number"
                                                            className="form-control"
                                                            min="1"
                                                            value={createAddQty}
                                                            onChange={this.onCreateAddQtyChange}
                                                        />
                                                    </div>
                                                    <div className="col-6 col-md-2 d-grid">
                                                        <button
                                                            type="button"
                                                            className="btn btn-primary btn-sm"
                                                            onClick={this.addItemToCreate}
                                                            disabled={productsLoading}
                                                            style={{ fontWeight: '700' }}
                                                        >
                                                            Add
                                                        </button>
                                                    </div>
                                                </div>

                                                <div style={{ border: '1px solid #e9ecef', borderRadius: '8px', overflow: 'hidden' }}>
                                                    <table className="table table-hover table-sm mb-0">
                                                        <thead style={{ background: '#f8f9fa' }}>
                                                            <tr>
                                                                <th className="text-center" style={{ width: '44px' }}>✓</th>
                                                                <th>Product Name</th>
                                                                <th className="text-center" style={{ width: '90px' }}>Price</th>
                                                                <th className="text-center" style={{ width: '120px' }}>Quantity</th>
                                                                <th className="text-end" style={{ width: '110px' }}>Total</th>
                                                                <th className="text-center" style={{ width: '90px' }}>Remove</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {createItems.length === 0 && (
                                                                <tr>
                                                                    <td colSpan="6" className="text-center text-muted" style={{ padding: '1rem' }}>
                                                                        No items added yet
                                                                    </td>
                                                                </tr>
                                                            )}
                                                            {createItems.map((item) => {
                                                                const checked = this.state.createChecked.has(item.productId);
                                                                return (
                                                                    <tr
                                                                        key={item.productId}
                                                                        style={{ background: checked ? 'rgba(67,160,71,0.06)' : 'white' }}
                                                                    >
                                                                        <td className="text-center">
                                                                            <input
                                                                                type="checkbox"
                                                                                className="form-check-input m-0"
                                                                                checked={checked}
                                                                                onChange={() => this.toggleCreateCheck(item.productId)}
                                                                                style={{ accentColor: '#2E7D32' }}
                                                                            />
                                                                        </td>
                                                                        <td style={{ fontWeight: checked ? 600 : 400 }}>{item.name || 'Product Name Missing'}</td>
                                                                        <td className="text-center">₹{item.price}</td>
                                                                        <td className="text-center">
                                                                            <QtyControl>
                                                                                <button
                                                                                    className="qty-btn"
                                                                                    onClick={() => this.updateCreateQuantity(item.productId, -1)}
                                                                                    disabled={(Number(item.quantity || 0) || 0) <= 0}
                                                                                >
                                                                                    −
                                                                                </button>
                                                                                <span className="qty-value">{item.quantity}</span>
                                                                                <button
                                                                                    className="qty-btn"
                                                                                    onClick={() => this.updateCreateQuantity(item.productId, +1)}
                                                                                >
                                                                                    +
                                                                                </button>
                                                                            </QtyControl>
                                                                        </td>
                                                                        <td className="text-end fw-bold" style={{ color: '#2E7D32' }}>
                                                                            ₹{(item.total || 0).toFixed(2)}
                                                                        </td>
                                                                        <td className="text-center">
                                                                            <button
                                                                                type="button"
                                                                                className="btn btn-outline-danger btn-sm"
                                                                                onClick={() => this.removeCreateItem(item.productId)}
                                                                            >
                                                                                ✕
                                                                            </button>
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            })}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>

                                            {/* STEP 3: Totals */}
                                            <div
                                                style={{
                                                    background: '#f8f9fa',
                                                    borderRadius: '8px',
                                                    padding: '0.9rem 1rem',
                                                    border: '1px solid #e9ecef',
                                                }}
                                            >
                                                <SectionTitle>Step 3 — Total Calculation</SectionTitle>
                                                <div className="d-flex flex-column gap-2">
                                                    <TotalBar style={{ marginBottom: 0 }}>
                                                        <span className="total-label">✓ Selected Total:</span>
                                                        <span className="total-value">₹{createSelectedTotal.toFixed(2)}</span>
                                                    </TotalBar>
                                                    <div className="d-flex justify-content-between align-items-center px-2">
                                                        <span className="text-muted fw-semibold" style={{ fontSize: '0.9rem' }}>
                                                            Grand Total (all items):
                                                        </span>
                                                        <span className="fw-bold" style={{ color: '#2E7D32', fontSize: '1.05rem' }}>
                                                            ₹{createGrandTotal.toFixed(2)}
                                                        </span>
                                                    </div>
                                                    <small className="text-muted" style={{ fontSize: '0.78rem' }}>
                                                        Only checked items will be saved and billed.
                                                    </small>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="modal-footer" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
                                            <button
                                                className="btn btn-outline-secondary btn-sm"
                                                onClick={this.closeCreateModal}
                                                disabled={actionLoading}
                                                style={{ fontSize: '0.82rem', fontWeight: '600' }}
                                            >
                                                {langCtx.getText('close')}
                                            </button>
                                            <button
                                                className="btn btn-success btn-sm"
                                                onClick={this.saveOfflineOrder}
                                                disabled={actionLoading}
                                                style={{ fontSize: '0.82rem', fontWeight: '700' }}
                                            >
                                                {actionLoading ? 'Saving...' : 'Save Order'}
                                            </button>
                                        </div>
                                    </ModalContent>
                                </ModalOverlay>
                            )}

                            {/* ── Offline Order Details Modal ── */}
                            {modalOpen && selectedOrder && (
                                <ModalOverlay onClick={this.closeModal}>
                                    <ModalContent
                                        style={{ maxWidth: '760px', width: '100%' }}
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <div className="modal-header">
                                            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                🧾 Offline Order — #{selectedOrder.id}
                                                <Badge className={this.getStatusBadgeClass(selectedOrder.status)}>
                                                    {this.getStatusIcon(selectedOrder.status)} {selectedOrder.status}
                                                </Badge>
                                                {isLocked && (
                                                    <span
                                                        style={{
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
                                                        }}
                                                    >
                                                        🔒 Locked
                                                    </span>
                                                )}
                                            </h3>
                                            <button className="close-btn" onClick={this.closeModal}>
                                                ×
                                            </button>
                                        </div>

                                        <div className="modal-body">
                                            {/* Customer Details */}
                                            <div
                                                style={{
                                                    background: '#f8f9fa',
                                                    borderRadius: '8px',
                                                    padding: '0.9rem 1rem',
                                                    marginBottom: '1rem',
                                                    border: '1px solid #e9ecef',
                                                }}
                                            >
                                                <SectionTitle>Customer Details</SectionTitle>
                                                <div className="row g-0">
                                                    <div className="col-12 col-sm-6">
                                                        <div className="d-flex justify-content-between py-1" style={{ fontSize: '0.9rem' }}>
                                                            <span className="text-muted">👤 Name</span>
                                                            <span className="fw-semibold">{selectedOrder.customerName}</span>
                                                        </div>
                                                        <div className="d-flex justify-content-between py-1" style={{ fontSize: '0.9rem' }}>
                                                            <span className="text-muted">📞 Phone</span>
                                                            <span className="fw-semibold">{selectedOrder.customerPhone || selectedOrder.phone || '—'}</span>
                                                        </div>
                                                        <div className="d-flex justify-content-between py-1" style={{ fontSize: '0.9rem' }}>
                                                            <span className="text-muted">🏘️ Place</span>
                                                            <span className="fw-semibold">{selectedOrder.place || '—'}</span>
                                                        </div>
                                                    </div>
                                                    <div className="col-12 col-sm-6">
                                                        <div className="d-flex justify-content-between py-1" style={{ fontSize: '0.9rem' }}>
                                                            <span className="text-muted">📅 Date</span>
                                                            <span className="fw-semibold">
                                                                {this.formatDate(selectedOrder.orderDate || selectedOrder.date)}
                                                            </span>
                                                        </div>
                                                        <div className="d-flex justify-content-between py-1" style={{ fontSize: '0.9rem' }}>
                                                            <span className="text-muted">💰 Payment</span>
                                                            <span className="fw-semibold">Cash</span>
                                                        </div>
                                                        <div className="d-flex justify-content-between py-1" style={{ fontSize: '0.9rem' }}>
                                                            <span className="text-muted">📍 Address</span>
                                                            <span className="fw-semibold">{selectedOrder.address || '—'}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Add Product (Pending only) */}
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
                                                    <SectionTitle>Add Product to Order</SectionTitle>
                                                    <div className="row g-2 align-items-end">
                                                        <div className="col-12 col-md-7">
                                                            <label className="form-label small fw-semibold mb-1">Product</label>
                                                            <select
                                                                className="form-select"
                                                                value={addProductId}
                                                                onChange={this.onChangeAddProductId}
                                                                disabled={actionLoading || productsLoading}
                                                            >
                                                                <option value="">Select product...</option>
                                                                {Array.isArray(products) &&
                                                                    products.map((p) => (
                                                                    <option key={p.id ?? p._id} value={p.id ?? p._id}>
                                                                        {p.name} — ₹{p.price}
                                                                    </option>
                                                                    ))}
                                                            </select>
                                                        </div>
                                                        <div className="col-6 col-md-3">
                                                            <label className="form-label small fw-semibold mb-1">Quantity</label>
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
                                                </div>
                                            )}

                                            {/* Items Table */}
                                            <SectionTitle>Ordered Items</SectionTitle>
                                            {isLocked && (
                                                <div
                                                    style={{
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
                                                    }}
                                                >
                                                    🔒 <span>This order is locked and cannot be modified.</span>
                                                </div>
                                            )}

                                            <div
                                                style={{
                                                    border: '1px solid #e9ecef',
                                                    borderRadius: '8px',
                                                    overflow: 'hidden',
                                                    opacity: isLocked ? 0.82 : 1,
                                                }}
                                            >
                                                <table className="table table-hover table-sm mb-0">
                                                    <thead style={{ background: '#f8f9fa' }}>
                                                        <tr>
                                                            <th className="text-center" style={{ width: '44px' }}>✓</th>
                                                            <th>Product Name</th>
                                                            <th className="text-center" style={{ width: '110px' }}>Quantity</th>
                                                            <th className="text-center" style={{ width: '80px' }}>Price</th>
                                                            <th className="text-end" style={{ width: '100px' }}>Total</th>
                                                            <th className="text-center" style={{ width: '80px' }}>Remove</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {modalItems.map((item) => {
                                                            const checked = (checkedItems[selectedOrder.id] || new Set()).has(item.productId);
                                                            return (
                                                                <tr
                                                                    key={item.productId}
                                                                    style={{ background: checked ? 'rgba(67,160,71,0.06)' : 'white' }}
                                                                >
                                                                    <td className="text-center">
                                                                        <input
                                                                            type="checkbox"
                                                                            className="form-check-input m-0"
                                                                            checked={checked}
                                                                            onChange={() => this.toggleItemCheck(item.productId)}
                                                                            disabled={isLocked}
                                                                            style={{
                                                                                cursor: isLocked ? 'not-allowed' : 'pointer',
                                                                                accentColor: '#2E7D32',
                                                                            }}
                                                                        />
                                                                    </td>
                                                                    <td style={{ fontWeight: checked ? 600 : 400 }}>{item.name || 'Product Name Missing'}</td>
                                                                    <td className="text-center">
                                                                        <QtyControl>
                                                                            <button
                                                                                className="qty-btn"
                                                                                onClick={() => this.updateItemQuantity(item.productId, -1)}
                                                                                disabled={isLocked || (Number(item.quantity || 0) || 0) <= 0}
                                                                            >
                                                                                −
                                                                            </button>
                                                                            <span className="qty-value">{item.quantity}</span>
                                                                            <button
                                                                                className="qty-btn"
                                                                                onClick={() => this.updateItemQuantity(item.productId, +1)}
                                                                                disabled={isLocked}
                                                                            >
                                                                                +
                                                                            </button>
                                                                        </QtyControl>
                                                                    </td>
                                                                    <td className="text-center">₹{item.price}</td>
                                                                    <td className="text-end fw-bold" style={{ color: '#2E7D32' }}>
                                                                        ₹{(item.total || 0).toFixed(2)}
                                                                    </td>
                                                                    <td className="text-center">
                                                                        <button
                                                                            type="button"
                                                                            className="btn btn-outline-danger btn-sm"
                                                                            onClick={() => this.removeModalItem(item.productId)}
                                                                            disabled={isLocked}
                                                                        >
                                                                            ✕
                                                                        </button>
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>

                                            <TotalBar style={{ marginTop: '0.6rem' }}>
                                                <span className="total-label">✓ Selected Total:</span>
                                                <span className="total-value">₹{checkedTotal.toFixed(2)}</span>
                                            </TotalBar>
                                        </div>

                                        <div className="modal-footer" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
                                            {/* Verified Checkbox (Pending only) */}
                                            <VerifyCheckWrapper>
                                                <input
                                                    type="checkbox"
                                                    id="verifyOfflineOrder"
                                                    checked={!!(isVerified || isPaid || isDelivered)}
                                                    disabled={!isPending || isRejected || actionLoading}
                                                    onChange={(e) => this.handleVerifyCheckbox(e.target.checked)}
                                                />
                                                <label htmlFor="verifyOfflineOrder">Mark Order Verified</label>
                                            </VerifyCheckWrapper>

                                            <div className="ms-auto d-flex gap-2 flex-wrap">
                                                <button
                                                    type="button"
                                                    className="btn btn-primary btn-sm"
                                                    onClick={() => this.handleMarkPaid(selectedOrder.id)}
                                                    disabled={actionLoading || isRejected || !isVerified || isPaid || isDelivered}
                                                    title={!isVerified ? 'Verify the order first' : 'Mark as Paid'}
                                                    style={{ fontWeight: '700' }}
                                                >
                                                    💳 Mark Paid
                                                </button>

                                                <button
                                                    type="button"
                                                    className="btn btn-success btn-sm"
                                                    onClick={() => this.handleDeliver(selectedOrder.id)}
                                                    disabled={actionLoading || isRejected || !isPaid || isDelivered}
                                                    title={!isPaid ? 'Mark as Paid first' : 'Mark as Delivered'}
                                                    style={{ fontWeight: '700' }}
                                                >
                                                    📦 Mark Delivered
                                                </button>

                                                {isPending && !isRejected && (
                                                    <button
                                                        type="button"
                                                        className="btn btn-danger btn-sm"
                                                        onClick={() => this.handleReject(selectedOrder.id)}
                                                        disabled={actionLoading}
                                                        style={{ fontWeight: '700' }}
                                                    >
                                                        ❌ Reject Order
                                                    </button>
                                                )}

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

export default AdminOfflineOrdersPage;
