import React from 'react';
import LanguageContext from '../context/LanguageContext';
import orderService from '../services/orderService';
import productService from '../services/productService';
import Spinner from '../components/Spinner';
import { toast } from 'react-toastify';
import { t, statusKey, hasTranslation, getLocale } from '../utils/i18n';
import { openBillPrintWindow } from '../utils/printBill';
import styled from 'styled-components';
import { PageHeader } from '../styledComponents/LayoutStyles';
import {
    TableWrapper,
    EmptyState,
    Badge,
    ModalOverlay,
    ModalContent,
    MobileOrdersWrapper,
    DesktopOrdersWrapper,
    OrderCard,
    OrderCardHeader,
    OrderCardTitle,
    OrderCardRow,
    OrderCardLabel,
    OrderCardValue,
    OrderCardFooter,
    OrderCardButton,
    OrderStatusBadge,
} from '../styledComponents/FormStyles';
import { searchOrders, searchProducts } from '../utils/searchUtils';

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

const AmountActionsContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.5rem;
    width: 100%;

    .amount-input-section {
        width: 100%;
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 0.3rem;

        input {
            max-width: 150px;
            width: 100%;
        }

        .preview-text {
            font-size: 0.8rem;
            font-weight: 600;
            margin-top: -0.3rem;
        }
    }

    .amount-buttons {
        display: flex;
        justify-content: flex-end;
        gap: 0.4rem;
        width: 100%;
        flex-wrap: wrap;

        button {
            white-space: nowrap;
        }
    }

    .return-section {
        width: 100%;
        margin-top: 0.5rem;
        padding-top: 0.5rem;
        border-top: 1px solid #e9ecef;
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 0.3rem;

        input {
            max-width: 150px;
            width: 100%;
        }

        .preview-text {
            font-size: 0.8rem;
            font-weight: 600;
            color: #c62828;
            margin-top: -0.3rem;
        }

        button {
            white-space: nowrap;
        }
    }

    @media (max-width: 1024px) {
        position: relative;
        z-index: 10;

        .amount-input-section {
            align-items: stretch;

            input {
                max-width: 100%;
                width: 100%;
                font-size: 13px;
            }

            .preview-text {
                font-size: 0.7rem;
                text-align: right;
            }
        }

        .amount-buttons {
            justify-content: space-between;
            gap: 0.3rem;
            width: 100%;
            display: grid;
            grid-template-columns: 1fr 1fr;

            button {
                font-size: 11px;
                padding: 0.45rem 0.4rem;
                min-width: 0;
                word-break: break-word;
                white-space: normal;
                line-height: 1.2;
            }
        }

        .return-section {
            align-items: stretch;
            width: 100%;
            margin-top: 0.4rem;
            padding-top: 0.4rem;

            input {
                max-width: 100%;
                width: 100%;
                font-size: 13px;
            }

            .preview-text {
                text-align: right;
                font-size: 0.7rem;
            }

            button {
                font-size: 11px;
                padding: 0.45rem 0.4rem;
                min-width: 0;
                word-break: break-word;
                white-space: normal;
                line-height: 1.2;
                width: 100%;
            }
        }
    }

    @media (max-width: 768px) {
        position: relative;
        z-index: 10;

        .amount-input-section {
            align-items: stretch;

            input {
                max-width: 100%;
                width: 100%;
                font-size: 12px;
            }

            .preview-text {
                font-size: 0.7rem;
                text-align: right;
            }
        }

        .amount-buttons {
            justify-content: space-between;
            gap: 0.3rem;
            width: 100%;
            display: grid;
            grid-template-columns: 1fr 1fr;

            button {
                font-size: 10px;
                padding: 0.4rem 0.3rem;
                min-width: 0;
                word-break: break-word;
                white-space: normal;
                line-height: 1.2;
            }
        }

        .return-section {
            align-items: stretch;
            width: 100%;
            margin-top: 0.4rem;
            padding-top: 0.4rem;

            input {
                max-width: 100%;
                width: 100%;
                font-size: 12px;
            }

            .preview-text {
                text-align: right;
                font-size: 0.7rem;
            }

            button {
                font-size: 10px;
                padding: 0.4rem 0.3rem;
                min-width: 0;
                word-break: break-word;
                white-space: normal;
                line-height: 1.2;
                width: 100%;
            }
        }
    }

    @media (max-width: 576px) {
        .amount-input-section input {
            font-size: 11px;
        }

        .amount-buttons {
            grid-template-columns: 1fr;

            button {
                font-size: 9px;
                padding: 0.35rem 0.25rem;
            }
        }

        .return-section {
            input {
                font-size: 11px;
            }

            button {
                font-size: 9px;
                padding: 0.35rem 0.25rem;
            }
        }
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
            errorKey: null,
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
            selectedProducts: [],
            createAddProductId: '',
            createAddQty: '1',
            createAddQtyError: '',

            // View Order Details Modal
            modalOpen: false,
            selectedOrder: null,
            modalItems: [],
            checkedItems: {},
            addProductId: '',
            addProductQty: 1,

            // Search
            searchQuery: '',

            // Print Bill loading by order id
            printLoadingByOrder: {},

            // Advance Payment (per order row)
            advanceInputs: {},
            advanceSaving: {},

            // Return Amount (per order row)
            returnInputs: {},
            returnSaving: {},
        };
    }

    componentDidMount() {
        this.fetchOfflineOrders();
        this.fetchProducts();
    }

    // Keep parity with AdminOnlineOrdersPage naming used in spec
    fetchOrders = async () => {
        return this.fetchOfflineOrders();
    };

    // ─── Data Fetching ───────────────────────────────────────────────────────

    fetchOfflineOrders = async () => {
        const { searchQuery } = this.state;
        this.setState({ loading: true, isLoading: true });
        try {
            const response = await orderService.getOfflineOrders(searchQuery);
            const offlineOrders = Array.isArray(response)
                ? response
                : (response?.orders || response?.data?.orders || response?.data || []);

            const safeOrders = Array.isArray(offlineOrders) ? offlineOrders : [];
            const nextAdvanceInputs = {};
            const nextReturnInputs = {};
            safeOrders.forEach((o) => {
                const id = o && o.id;
                if (!id) return;
                // Always initialize to empty string - temporary input should never be pre-filled
                nextAdvanceInputs[id] = '';
                nextReturnInputs[id] = '';
            });

            this.setState({
                offlineOrders: safeOrders,
                advanceInputs: nextAdvanceInputs,
                returnInputs: nextReturnInputs,
                errorKey: null,
                loading: false,
                isLoading: false,
                // Reset all checkbox selections after reloading data
                checkedItems: {},
            });
        } catch (err) {
            this.setState({ errorKey: 'failedToLoadOfflineOrders', loading: false, isLoading: false });
            toast.error(t('failedToLoadOfflineOrders'));
        }
    };

    // ─── Advance Payment Helpers ───────────────────────────────────────────

    isAdvanceEditable = (order) => {
        const statusRaw = String(order?.status || '').trim();
        const statusLower = statusRaw.toLowerCase();
        const paymentStatusLower = String(order?.paymentStatus || '').trim().toLowerCase();

        const isLocked =
            Boolean(order?.isPaid) ||
            paymentStatusLower === 'paid' ||
            statusLower === 'paid' ||
            statusLower === 'completed' ||
            statusLower === 'mark paid';

        if (isLocked) return false;

        const allowed = new Set(['pending', 'confirmed', 'processing', 'verified', 'delivered']);
        return allowed.has(statusLower);
    };

    getAdvanceInputValue = (order) => {
        const id = order && order.id;
        if (!id) return '';
        const v = this.state.advanceInputs[id];
        // For delta input, return the change amount if being edited, otherwise empty
        if (v !== undefined && v !== null) return String(v);
        return '';
    };

    handleAdvanceInputChange = (orderId, value) => {
        this.setState({
            advanceInputs: {
                ...this.state.advanceInputs,
                [orderId]: value,
            },
        });
    };

    submitAdvance = async (order) => {
        const orderId = order && order.id;
        if (!orderId) return;

        const editable = this.isAdvanceEditable(order);
        if (!editable) {
            toast.error(t('advanceEditLocked'));
            return;
        }

        // Get the delta amount entered by user
        const raw = this.getAdvanceInputValue(order);
        const deltaAmount = Number(raw);
        if (!Number.isFinite(deltaAmount)) {
            toast.error(t('enterValidAdvanceAmount'));
            return;
        }

        // Calculate new total: previousAmount + delta
        const previousAmount = Number(order?.advanceAmount || 0) || 0;
        const newAmount = previousAmount + deltaAmount;

        // Prevent negative totals
        if (newAmount < 0) {
            toast.error(t('totalPaymentCannotBeNegative'));
            return;
        }

        // Prevent overpayment - total paid cannot exceed bill amount
        const billTotal = Number(order?.totalAmount ?? order?.grandTotal ?? 0) || 0;
        if (newAmount > billTotal) {
            toast.error(`Total paid amount cannot exceed bill amount (₹${billTotal.toFixed(2)})`);
            return;
        }

        this.setState({
            advanceSaving: {
                ...this.state.advanceSaving,
                [orderId]: true,
            },
        });

        try {
            const resp = await orderService.updateAdvanceAmount(orderId, newAmount);
            // Extract order from response - backend returns { success, message, order }
            const updatedOrder = resp?.data?.order || resp?.order;
            
            if (!updatedOrder || !Number.isFinite(updatedOrder.advanceAmount)) {
                throw new Error('Invalid response: missing updated order data');
            }

            const patchList = (list) => (Array.isArray(list) ? list.map((o) => {
                if (o.id === orderId) {
                    const total = Number(updatedOrder?.totalAmount ?? o?.totalAmount ?? 0) || 0;
                    const remainingBalance = total - Number(updatedOrder.advanceAmount || 0);
                    return {
                        ...o,
                        advanceAmount: updatedOrder.advanceAmount,
                        paymentHistory: updatedOrder.paymentHistory,
                        remainingBalance: remainingBalance
                    };
                }
                return o;
            }) : list);
            
            this.setState((prev) => {
                const selectedOrderToUpdate = prev.selectedOrder && prev.selectedOrder.id === orderId ? prev.selectedOrder : null;
                const selectedTotal = selectedOrderToUpdate?.totalAmount ?? 0;
                const finalTotal = Number(updatedOrder?.totalAmount ?? selectedTotal ?? 0);
                const finalRemaining = finalTotal - Number(updatedOrder.advanceAmount || 0);
                
                return {
                    offlineOrders: patchList(prev.offlineOrders),
                    selectedOrder: selectedOrderToUpdate 
                        ? {
                            ...selectedOrderToUpdate,
                            advanceAmount: updatedOrder.advanceAmount,
                            paymentHistory: updatedOrder.paymentHistory,
                            remainingBalance: finalRemaining
                          }
                        : prev.selectedOrder,
                    advanceInputs: {
                        ...prev.advanceInputs,
                        [orderId]: '', // Clear delta input after successful update
                    },
                };
            });

            toast.success(t('advanceUpdated'));
        } catch (e) {
            const rawMsg = e?.response?.data?.message || e?.response?.data?.errorKey || e?.message;
            const normalized = rawMsg ? String(rawMsg).trim() : '';
            if (normalized === 'Quantity exceeds stock limit') toast.error('Quantity exceeds stock limit');
            else if (normalized === 'Total payment amount cannot be negative') toast.error('Total amount cannot be negative');
            else if (normalized && hasTranslation(normalized)) toast.error(t(normalized));
            else if (normalized) toast.error(normalized);
            else toast.error(t('failedToUpdateAdvance'));
        } finally {
            this.setState({
                advanceSaving: {
                    ...this.state.advanceSaving,
                    [orderId]: false,
                },
            });
        }
    };

    calculateAddedAmountDisplay = (order) => {
        const deltaStr = this.getAdvanceInputValue(order);
        const deltaAmount = Number(deltaStr);
        
        if (!Number.isFinite(deltaAmount) || deltaAmount <= 0) {
            return null;
        }
        
        const previousAmount = Number(order?.advanceAmount || 0) || 0;
        const newTotal = previousAmount + deltaAmount;
        
        return `+₹${deltaAmount.toFixed(2)} added (Total: ₹${newTotal.toFixed(2)})`;
    };

    // ─── Return Amount Helpers ───────────────────────────────────────────────

    isReturnEditable = (order) => {
        const statusRaw = String(order?.status || '').trim();
        const statusLower = statusRaw.toLowerCase();
        const paymentStatusLower = String(order?.paymentStatus || '').trim().toLowerCase();

        const isLocked =
            Boolean(order?.isPaid) ||
            paymentStatusLower === 'paid' ||
            statusLower === 'paid' ||
            statusLower === 'completed' ||
            statusLower === 'mark paid';

        if (isLocked) return false;

        const allowed = new Set(['pending', 'confirmed', 'processing', 'verified', 'delivered']);
        return allowed.has(statusLower);
    };

    getReturnInputValue = (order) => {
        const id = order && order.id;
        if (!id) return '';
        const v = this.state.returnInputs[id];
        if (v !== undefined && v !== null) return String(v);
        return '';
    };

    handleReturnInputChange = (orderId, value) => {
        this.setState({
            returnInputs: {
                ...this.state.returnInputs,
                [orderId]: value,
            },
        });
    };

    submitReturn = async (order) => {
        const orderId = order && order.id;
        if (!orderId) return;

        const editable = this.isReturnEditable(order);
        if (!editable) {
            toast.error('Return cannot be processed for this order status');
            return;
        }

        // Get the return amount entered by user
        const raw = this.getReturnInputValue(order);
        const returnAmount = Number(raw);
        if (!Number.isFinite(returnAmount)) {
            toast.error('Enter valid return amount');
            return;
        }

        if (returnAmount <= 0) {
            toast.error('Return amount must be greater than zero');
            return;
        }

        // Prevent overpayment - return cannot exceed advance amount
        const currentAdvance = Number(order?.advanceAmount || 0) || 0;
        if (returnAmount > currentAdvance) {
            toast.error(`Return amount cannot exceed paid amount (₹${currentAdvance.toFixed(2)})`);
            return;
        }

        this.setState({
            returnSaving: {
                ...this.state.returnSaving,
                [orderId]: true,
            },
        });

        try {
            const resp = await orderService.updateReturnAmount(orderId, returnAmount);
            const updatedOrder = resp?.data?.order || resp?.order;
            
            if (!updatedOrder || !Number.isFinite(updatedOrder.advanceAmount)) {
                throw new Error('Invalid response: missing updated order data');
            }

            const patchList = (list) => (Array.isArray(list) ? list.map((o) => {
                if (o.id === orderId) {
                    const total = Number(updatedOrder?.totalAmount ?? o?.totalAmount ?? 0) || 0;
                    const remainingBalance = total - Number(updatedOrder.advanceAmount || 0);
                    return {
                        ...o,
                        advanceAmount: updatedOrder.advanceAmount,
                        paymentHistory: updatedOrder.paymentHistory,
                        remainingBalance: remainingBalance
                    };
                }
                return o;
            }) : list);
            
            this.setState((prev) => {
                const selectedOrderToUpdate = prev.selectedOrder && prev.selectedOrder.id === orderId ? prev.selectedOrder : null;
                const selectedTotal = selectedOrderToUpdate?.totalAmount ?? 0;
                const finalTotal = Number(updatedOrder?.totalAmount ?? selectedTotal ?? 0);
                const finalRemaining = finalTotal - Number(updatedOrder.advanceAmount || 0);
                
                return {
                    offlineOrders: patchList(prev.offlineOrders),
                    selectedOrder: selectedOrderToUpdate 
                        ? {
                            ...selectedOrderToUpdate,
                            advanceAmount: updatedOrder.advanceAmount,
                            paymentHistory: updatedOrder.paymentHistory,
                            remainingBalance: finalRemaining
                          }
                        : prev.selectedOrder,
                    returnInputs: {
                        ...prev.returnInputs,
                        [orderId]: '', // Clear return input after successful update
                    },
                };
            });

            toast.success('Return processed successfully');
        } catch (e) {
            const rawMsg = e?.response?.data?.message || e?.response?.data?.errorKey || e?.message;
            const normalized = rawMsg ? String(rawMsg).trim() : '';
            if (normalized && hasTranslation(normalized)) toast.error(t(normalized));
            else if (normalized) toast.error(normalized);
            else toast.error('Failed to process return');
        } finally {
            this.setState({
                returnSaving: {
                    ...this.state.returnSaving,
                    [orderId]: false,
                },
            });
        }
    };

    calculateReturnedAmountDisplay = (order) => {
        const deltaStr = this.getReturnInputValue(order);
        const deltaAmount = Number(deltaStr);
        
        if (!Number.isFinite(deltaAmount) || deltaAmount <= 0) {
            return null;
        }
        
        const currentAdvance = Number(order?.advanceAmount || 0) || 0;
        const newTotal = currentAdvance - deltaAmount;
        
        return `-₹${deltaAmount.toFixed(2)} returned (Total: ₹${newTotal.toFixed(2)})`;
    };

    handleSearchChange = (e) => {
        this.setState({ searchQuery: e.target.value }, () => this.fetchOfflineOrders());
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
            toast.error(t('failedToLoadProducts'));
        }
    };

    // ─── Helpers ─────────────────────────────────────────────────────────────

    formatDate = (dateStr) => {
        const locale = getLocale();
        const d = new Date(dateStr);
        return (
            d.toLocaleDateString(locale, {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
            }) +
            ' | ' +
            d.toLocaleTimeString(locale, {
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
            Completed: 'badge-success',
            Rejected: 'badge-danger',
        };
        return map[status] || 'badge-warning';
    };

    getStatusIcon = (status) => {
        if (status === 'Pending') return '⏳';
        if (status === 'Verified') return '✅';
        if (status === 'Paid') return '💳';
        if (status === 'Delivered') return '📦';
        if (status === 'Completed') return '🏁';
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
            selectedProducts: [],
            createAddProductId: '',
            createAddQty: '1',
            createAddQtyError: '',
        });
    };

    closeCreateModal = () => {
        this.setState({ createModalOpen: false });
    };

    onCreateFieldChange = (field) => (e) => {
        this.setState({ [field]: e.target.value });
    };

    onCreateAddQtyChange = (e) => {
        const raw = String(e?.target?.value ?? '');
        if (raw === '') {
            this.setState({ createAddQty: '', createAddQtyError: '' });
            return;
        }

        // Allow only digits (prevents -, e, ., and other non-numeric chars)
        if (!/^\d+$/.test(raw)) return;

        this.setState({ createAddQty: raw, createAddQtyError: '' });
    };

    addItemToCreate = () => {
        const { createAddProductId, createAddQty, products, createItems } = this.state;
        const productId = parseInt(createAddProductId, 10);
        if (!productId) {
            toast.warning(t('pleaseSelectProduct'));
            return;
        }

        const product = products.find((p) => p.id === productId);
        if (!product) {
            toast.error(t('selectedProductNotFound'));
            return;
        }

        const qtyNum = parseInt(String(createAddQty || ''), 10);
        if (!Number.isFinite(qtyNum) || qtyNum < 1) {
            const msg = 'Quantity must be greater than or equal to 1';
            this.setState({ createAddQtyError: msg });
            toast.error(msg);
            return;
        }

        const quantity = qtyNum;
        const stock = Number(product?.stock);
        if (Number.isFinite(stock) && stock >= 0 && quantity > stock) {
            toast.error('Quantity exceeds stock limit');
            return;
        }
        const existingIdx = createItems.findIndex((i) => i.productId === productId);

        let nextItems = [];
        if (existingIdx !== -1) {
            nextItems = createItems.map((i) => {
                if (i.productId !== productId) return i;
                const nextQty = (i.quantity || 0) + quantity;
                if (Number.isFinite(stock) && stock >= 0 && nextQty > stock) {
                    toast.error('Quantity exceeds stock limit');
                    return i;
                }
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

        this.setState({
            createItems: nextItems,
            // Reset all selections after product list updates
            selectedProducts: [],
            createAddProductId: '',
            createAddQty: '1',
            createAddQtyError: '',
        });
    };

    toggleCreateCheck = (productId) => {
        const { selectedProducts } = this.state;
        const isSelected = selectedProducts.includes(productId);
        const nextSelectedProducts = isSelected
            ? selectedProducts.filter((id) => id !== productId)
            : [...selectedProducts, productId];

        this.setState({ selectedProducts: nextSelectedProducts });
    };

    updateCreateQuantity = (productId, delta) => {
        const { products } = this.state;
        const product = (products || []).find((p) => p.id === productId);
        const stock = Number(product?.stock);

        const nextItems = this.state.createItems.map((i) => {
            if (i.productId !== productId) return i;
            const currentQty = Number(i.quantity || 0) || 0;
            const nextQty = Math.max(0, currentQty + delta);

            if (delta > 0 && Number.isFinite(stock) && stock >= 0 && nextQty > stock) {
                toast.error('Quantity exceeds stock limit');
                return i;
            }

            return { ...i, quantity: nextQty, total: (Number(i.price || 0) || 0) * (Number(nextQty || 0) || 0) };
        });
        this.setState({ createItems: nextItems, selectedProducts: [] });
    };

    removeCreateItem = (productId) => {
        const nextItems = this.state.createItems.filter((i) => i.productId !== productId);
        // Reset all selections after product list updates
        this.setState({ createItems: nextItems, selectedProducts: [] });
    };

    getCreateSelectedTotal = () => {
        const { createItems, selectedProducts } = this.state;
        if (!Array.isArray(selectedProducts) || selectedProducts.length === 0) return 0;
        return createItems
            .filter((i) => selectedProducts.includes(i.productId))
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
            selectedProducts,
            products,
        } = this.state;

        if (!customerName.trim()) {
            toast.warning(t('customerNameRequired'));
            return;
        }
        if (!phone.trim()) {
            toast.warning(t('phoneNumberRequired'));
            return;
        }
        if (!place.trim()) {
            toast.warning(t('placeRequired'));
            return;
        }
        if (!createItems.length) {
            toast.warning(t('addAtLeastOneItem'));
            return;
        }
        if (!Array.isArray(selectedProducts) || selectedProducts.length === 0) {
            toast.warning(t('selectAtLeastOneItemToBill'));
            return;
        }

        const finalItems = createItems
            .filter((i) => selectedProducts.includes(i.productId))
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
            toast.warning(t('selectedItemsQtyGreaterThanZero'));
            return;
        }

        // Frontend enforcement: block saving if any quantity exceeds stock.
        for (const it of finalItems) {
            const p = (products || []).find((x) => x.id === it.productId);
            const stock = Number(p?.stock);
            const qty = Number(it?.quantity || 0) || 0;
            if (Number.isFinite(stock) && stock >= 0 && qty > stock) {
                toast.error('Quantity exceeds stock limit');
                return;
            }
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
            // Reset all checkboxes after successful save
            this.setState({ selectedProducts: [] });
            toast.success(t('offlineOrderCreatedSuccessfully'));
            this.closeCreateModal();
            await this.fetchOfflineOrders();
        } catch (err) {
            const rawMsg = err?.response?.data?.errorKey || err?.response?.data?.message || err?.message;
            const normalized = rawMsg ? String(rawMsg).trim() : '';
            if (normalized === 'Quantity exceeds stock limit') toast.error('Quantity exceeds stock limit');
            else if (normalized && hasTranslation(normalized)) toast.error(t(normalized));
            else if (normalized) toast.error(normalized);
            else toast.error(t('failedToCreateOfflineOrder'));
        } finally {
            this.setState({ actionLoading: false });
        }
    };

    // ─── View Order Details Modal ────────────────────────────────────────────

    openModal = async (order) => {
        if (!order?.id) return;

        let orderForModal = order;
        try {
            const resp = await orderService.getOrderById(order.id);
            orderForModal = resp?.order || resp?.data?.order || resp?.data || resp || order;
        } catch {
            orderForModal = order;
        }

        const orderId = orderForModal.id;
        const isLocked = String(orderForModal?.status || '').trim() !== 'Pending';

        const normalizedItems = (orderForModal.items || []).map((i) => {
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

        // Persisted selection: after verification (locked orders), restore checkbox state from DB.
        // `isSelected` is stored on `order_items` and returned by the backend.
        const existingChecked = new Set();
        if (isLocked) {
            for (const item of normalizedItems) {
                const hasFlag = !(item?.isSelected === undefined || item?.isSelected === null);
                const selected = hasFlag ? Boolean(item.isSelected) : true;
                if (selected) existingChecked.add(item.productId);
            }
        }

        this.setState({
            selectedOrder: orderForModal,
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
        // Reset all checkbox selections when closing
        this.setState({ selectedOrder: null, modalOpen: false, modalItems: [], checkedItems: {} });
    };

    handlePrintBill = async (orderId) => {
        if (!orderId) return;

        this.setState((prev) => ({
            printLoadingByOrder: {
                ...prev.printLoadingByOrder,
                [orderId]: true,
            },
        }));

        try {
            const billPayload = await orderService.getPrintableBill(orderId);
            openBillPrintWindow(billPayload);
        } catch (err) {
            const rawMsg = err?.response?.data?.errorKey || err?.response?.data?.message || err?.message;
            const normalized = rawMsg ? String(rawMsg).trim() : '';
            if (normalized && hasTranslation(normalized)) toast.error(t(normalized));
            else if (normalized) toast.error(normalized);
            else toast.error('Failed to open printable bill');
        } finally {
            this.setState((prev) => ({
                printLoadingByOrder: {
                    ...prev.printLoadingByOrder,
                    [orderId]: false,
                },
            }));
        }
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

        const product = (this.state.products || []).find((p) => p.id === productId);
        const stock = Number(product?.stock);

        const updated = this.state.modalItems.map((i) => {
            if (i.productId !== productId) return i;
            const currentQty = Number(i.quantity || 0) || 0;
            const nextQty = Math.max(0, currentQty + delta);

            if (delta > 0 && Number.isFinite(stock) && stock >= 0 && nextQty > stock) {
                toast.error('Quantity exceeds stock limit');
                return i;
            }

            return {
                ...i,
                quantity: nextQty,
                total: (Number(i.price || 0) || 0) * (Number(nextQty || 0) || 0),
            };
        });

        // Reset all selections after product list updates
        this.setState((prev) => {
            const orderId = prev?.selectedOrder?.id;
            if (!orderId) return { modalItems: updated };
            return {
                modalItems: updated,
                checkedItems: {
                    ...prev.checkedItems,
                    [orderId]: new Set(),
                },
            };
        });
    };

    removeModalItem = (productId) => {
        const { selectedOrder } = this.state;
        if (!selectedOrder || selectedOrder.status !== 'Pending') return;

        const updated = this.state.modalItems.filter((i) => i.productId !== productId);

        this.setState({
            modalItems: updated,
            checkedItems: {
                ...this.state.checkedItems,
                // Reset all selections after product list updates
                [selectedOrder.id]: new Set(),
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
            toast.warning(t('pleaseSelectProduct'));
            return;
        }

        const product = products.find((p) => p.id === productId);
        if (!product) {
            toast.error(t('selectedProductNotFound'));
            return;
        }

        const quantity = Math.max(1, parseInt(addProductQty, 10) || 1);
        const stock = Number(product?.stock);
        const existingIdx = modalItems.findIndex((i) => i.productId === productId);
        const existingQty = existingIdx !== -1 ? (Number(modalItems[existingIdx]?.quantity || 0) || 0) : 0;
        const nextQty = existingQty + quantity;
        if (Number.isFinite(stock) && stock >= 0 && nextQty > stock) {
            toast.error('Quantity exceeds stock limit');
            return;
        }

        this.setState({ actionLoading: true });
        try {
            await orderService.addItemToOrder(selectedOrder.id, productId, quantity);

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

            this.setState({
                modalItems: nextModalItems,
                checkedItems: {
                    ...checkedItems,
                    // Reset all selections after product list updates
                    [selectedOrder.id]: new Set(),
                },
                addProductId: '',
                addProductQty: 1,
            });
        } catch (err) {
            const rawMsg = err?.response?.data?.errorKey || err?.response?.data?.message || err?.message;
            const normalized = rawMsg ? String(rawMsg).trim() : '';
            if (normalized === 'Quantity exceeds stock limit') toast.error('Quantity exceeds stock limit');
            else if (normalized && hasTranslation(normalized)) toast.error(t(normalized));
            else if (normalized) toast.error(normalized);
            else toast.error(t('failedToAddProductToOrder'));
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

            const checkedSet = new Set(checkedItems[orderId] || []);
            if (!checkedSet || checkedSet.size === 0) {
                toast.warning(t('selectAtLeastOneItemBeforeVerifying'));
                return;
            }

            const updatedItems = (Array.isArray(modalItems) ? modalItems : []).map((i) => {
                const qtyRaw = parseInt(i.quantity, 10);
                const quantity = Number.isFinite(qtyRaw) ? Math.max(0, qtyRaw) : 0;
                const price = parseFloat(i.price) || 0;

                // If checked but qty <= 0, treat it as not selected.
                const initiallySelected = checkedSet.has(i.productId);
                const isSelected = initiallySelected && (Number(quantity || 0) || 0) > 0;

                return {
                    ...i,
                    productName: i.productName || i.name || '',
                    name: i.name || i.productName || '',
                    quantity,
                    price,
                    isSelected,
                    total: (Number(price || 0) || 0) * (Number(quantity || 0) || 0),
                };
            });

            const selectedForVerify = updatedItems.filter((i) => Boolean(i.isSelected));
            if (selectedForVerify.length === 0) {
                toast.warning(t('selectedItemsQtyGreaterThanZero'));
                return;
            }

            const finalTotal = selectedForVerify.reduce((sum, i) => sum + (i.total || 0), 0);

            await orderService.updateOrderBeforeVerify(orderId, updatedItems, finalTotal);
            const verifyResp = await orderService.verifyOrder(orderId);
            const verifiedOrder = verifyResp?.order || verifyResp?.data?.order || verifyResp?.data || null;

            const patch = (list) =>
                (Array.isArray(list) ? list.map((o) => (o.id === orderId ? { ...o, ...(verifiedOrder || {}), status: 'Verified', isVerified: true } : o)) : list);

            const nextSelectedOrder = this.state.selectedOrder && this.state.selectedOrder.id === orderId
                ? { ...this.state.selectedOrder, ...(verifiedOrder || {}), status: 'Verified', isVerified: true }
                : this.state.selectedOrder;

            const nextItems = Array.isArray(nextSelectedOrder?.items) ? nextSelectedOrder.items : updatedItems;
            const nextChecked = new Set(nextItems.filter((it) => Boolean(it?.isSelected)).map((it) => it.productId));

            this.setState((prev) => ({
                offlineOrders: patch(prev.offlineOrders),
                selectedOrder: nextSelectedOrder,
                modalItems: nextItems,
                checkedItems: {
                    ...prev.checkedItems,
                    [orderId]: nextChecked,
                },
            }));

            toast.success(t('orderVerifiedAndLocked'));
        } catch (err) {
            const rawMsg = err?.response?.data?.errorKey || err?.response?.data?.message || err?.message;
            const normalized = rawMsg ? String(rawMsg).trim() : '';
            if (normalized === 'Quantity exceeds stock limit') toast.error('Quantity exceeds stock limit');
            else if (normalized && hasTranslation(normalized)) toast.error(t(normalized));
            else if (normalized) toast.error(normalized);
            else toast.error(t('failedToVerifyOrder'));
        } finally {
            this.setState({ actionLoading: false });
        }
    };

    handleMarkPaid = async (orderId) => {
        this.setState({ actionLoading: true });
        try {
            const resp = await orderService.approvePayment(orderId);
            const nextOrder = resp?.order || resp?.data?.order || null;

            if (nextOrder) {
                const offlineOrders = this.state.offlineOrders.map((o) =>
                    o.id === orderId ? { ...o, ...nextOrder } : o
                );
                const selectedOrder = this.state.selectedOrder
                    ? { ...this.state.selectedOrder, ...nextOrder }
                    : null;
                this.setState({ offlineOrders, selectedOrder });

                if (nextOrder.status === 'Completed') {
                    await this.fetchOfflineOrders();
                }
            } else {
                const offlineOrders = this.state.offlineOrders.map((o) =>
                    o.id === orderId
                        ? {
                              ...o,
                              isPaid: true,
                              paymentType: 'Cash',
                              paymentStatus: 'Paid',
                              status: o.isDelivered ? 'Completed' : 'Paid',
                          }
                        : o
                );

                const selectedOrder = this.state.selectedOrder
                    ? {
                          ...this.state.selectedOrder,
                          isPaid: true,
                          paymentType: 'Cash',
                          paymentStatus: 'Paid',
                          status: this.state.selectedOrder.isDelivered ? 'Completed' : 'Paid',
                      }
                    : null;

                this.setState({ offlineOrders, selectedOrder });
            }
            toast.success(`${t('paymentMarkedPaid')} 💳`);
        } catch (err) {
            toast.error(t('failedToUpdatePaymentStatus'));
        } finally {
            this.setState({ actionLoading: false });
        }
    };

    handleDeliver = async (orderId) => {
        this.setState({ actionLoading: true });
        try {
            const resp = await orderService.deliverOrder(orderId);
            const nextOrder = resp?.order || resp?.data?.order || null;

            if (nextOrder) {
                const offlineOrders = this.state.offlineOrders.map((o) =>
                    o.id === orderId ? { ...o, ...nextOrder } : o
                );
                const selectedOrder = this.state.selectedOrder
                    ? { ...this.state.selectedOrder, ...nextOrder }
                    : null;
                this.setState({ offlineOrders, selectedOrder });
            }

            // Re-fetch so Completed moves out of Active.
            await this.fetchOfflineOrders();
            toast.success(`${t('orderMarkedDelivered')} 📦`);
        } catch (err) {
            toast.error(t('failedToUpdateOrderStatus'));
        } finally {
            this.setState({ actionLoading: false });
        }
    };

    handleReject = async (orderId) => {
        const { selectedOrder } = this.state;
        if (!selectedOrder || selectedOrder.status !== 'Pending') return;

        const ok = window.confirm(t('rejectOfflineOrderConfirm'));
        if (!ok) return;

        this.setState({ actionLoading: true });
        try {
            await orderService.rejectOrder(orderId);
            toast.success(t('orderRejected'));
            await this.fetchOfflineOrders();
            // If modal is open for the same order, reflect status immediately
            const updatedSelected = this.state.selectedOrder && this.state.selectedOrder.id === orderId
                ? { ...this.state.selectedOrder, status: 'Rejected' }
                : this.state.selectedOrder;
            this.setState({ selectedOrder: updatedSelected });
        } catch (err) {
            toast.error(t('rejectFailed'));
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
                        errorKey,
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
                        printLoadingByOrder,
                    } = this.state;

                    const createSelectedTotal = this.getCreateSelectedTotal();
                    const createGrandTotal = this.getCreateGrandTotal();

                    const checkedTotal = this.getCheckedTotal();
                    const isLocked = selectedOrder && selectedOrder.status !== 'Pending';
                    const isPending = selectedOrder && selectedOrder.status === 'Pending';
                    const isVerified =
                        !!(
                            selectedOrder &&
                            (selectedOrder.isVerified ||
                                ['Verified', 'Paid', 'Delivered', 'Completed'].includes(
                                    selectedOrder.status
                                ))
                        );
                    const isPaid =
                        !!(
                            selectedOrder &&
                            (selectedOrder.isPaid ||
                                selectedOrder.paymentStatus === 'Paid' ||
                                ['Paid', 'Completed'].includes(selectedOrder.status))
                        );
                    const isDelivered =
                        !!(
                            selectedOrder &&
                            (selectedOrder.isDelivered ||
                                ['Delivered', 'Completed'].includes(selectedOrder.status))
                        );
                    const isRejected = selectedOrder && selectedOrder.status === 'Rejected';

                    const totalForPayment = Number(selectedOrder?.totalAmount ?? selectedOrder?.grandTotal ?? checkedTotal ?? 0) || 0;
                    const advanceForPayment = Number(selectedOrder?.advanceAmount ?? 0) || 0;
                    const remainingForPayment = selectedOrder
                        ? (Number.isFinite(Number(selectedOrder?.remainingBalance))
                            ? Number(selectedOrder.remainingBalance)
                            : (totalForPayment - advanceForPayment))
                        : 0;
                    const isRemainingSettled = Math.abs(Number(remainingForPayment) || 0) <= 0.009;

                    const effectiveLoading = typeof isLoading === 'boolean' ? isLoading : loading;
                    
                    // Apply enhanced search with Telugu support
                    const unsafeOrders = Array.isArray(offlineOrders) ? offlineOrders : [];
                    const safeOrders = this.state.searchQuery.trim()
                        ? searchOrders(unsafeOrders, this.state.searchQuery)
                        : unsafeOrders;

                    return (
                        <div>
                            <PageHeader>
                                <h1>🧾 {langCtx.getText('offlineOrders')}</h1>
                                <p>
                                    {safeOrders.length} {langCtx.getText('offlineOrderCountLabel')}
                                </p>
                            </PageHeader>

                            <div className="mb-3" style={{ maxWidth: '420px' }}>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder={langCtx.getText('searchByCustomerName')}
                                    value={this.state.searchQuery}
                                    onChange={this.handleSearchChange}
                                />
                            </div>

                            <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
                                <div className="text-muted" style={{ fontSize: '0.9rem' }}>
                                    {langCtx.getText('offlineOrdersSubtitle')}
                                </div>
                                <ActionButton
                                    className="btn-primary-soft"
                                    onClick={this.openCreateModal}
                                    disabled={productsLoading}
                                >
                                    ➕ {langCtx.getText('createOfflineOrder')}
                                </ActionButton>
                            </div>

                            {effectiveLoading && <Spinner fullPage text={langCtx.getText('loadingOfflineOrders')} />}
                            {errorKey && <div className="alert alert-danger">{langCtx.getText(errorKey)}</div>}

                            {!effectiveLoading && !errorKey && safeOrders.length === 0 && (
                                <EmptyState>
                                    <div className="empty-icon">🧾</div>
                                    <h3>{langCtx.getText('noOfflineOrders')}</h3>
                                    <p>{langCtx.getText('createFirstOfflineOrder')}</p>
                                </EmptyState>
                            )}

                            {!effectiveLoading && !errorKey && safeOrders.length > 0 && (
                                <>
                                    {/* Desktop Table */}
                                    <DesktopOrdersWrapper>
                                        <TableWrapper>
                                            <table className="table table-hover align-middle">
                                                <thead>
                                                    <tr>
                                                        <th>{langCtx.getText('orderId')}</th>
                                                        <th>{langCtx.getText('customerName')}</th>
                                                        <th>{langCtx.getText('phone')}</th>
                                                        <th>{langCtx.getText('place')}</th>
                                                        <th style={{ whiteSpace: 'normal' }}>{langCtx.getText('orderDate')}</th>
                                                        <th className="text-end">{langCtx.getText('total')}</th>
                                                        <th className="text-end">{langCtx.getText('advance')}</th>
                                                        <th className="text-end">{langCtx.getText('remaining')}</th>
                                                        <th className="text-center">{langCtx.getText('orderType')}</th>
                                                        <th className="text-center">{langCtx.getText('orderStatus')}</th>
                                                        <th className="text-center">{langCtx.getText('viewOrder')}</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {Array.isArray(safeOrders) && safeOrders.map((order) => {
                                                        const total = Number(order.totalAmount ?? order.grandTotal ?? 0) || 0;
                                                        const remaining = Number(order.remainingBalance ?? (total - (Number(order.advanceAmount || 0) || 0))) || 0;
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
                                                                    ₹{(Number(total) || 0).toFixed(2)}
                                                                </td>
                                                                <td className="text-end amount-actions-cell" style={{ minWidth: '160px' }}>
                                                                    <AmountActionsContainer>
                                                                        <div className="amount-input-section">
                                                                            <input
                                                                                type="number"
                                                                                className="form-control form-control-sm"
                                                                                step="0.01"
                                                                                placeholder="Enter amount"
                                                                                value={this.getAdvanceInputValue(order)}
                                                                                disabled={!this.isAdvanceEditable(order) || Boolean(this.state.advanceSaving[order.id])}
                                                                                onChange={(e) => this.handleAdvanceInputChange(order.id, e.target.value)}
                                                                            />
                                                                            {this.calculateAddedAmountDisplay(order) && (
                                                                                <div className="preview-text" style={{ color: '#2E7D32' }}>
                                                                                    {this.calculateAddedAmountDisplay(order)}
                                                                                </div>
                                                                            )}
                                                                        </div>

                                                                        <div className="amount-buttons">
                                                                            {Number(order.advanceAmount || 0) <= 0 && this.isAdvanceEditable(order) && (
                                                                                <ActionButton
                                                                                    className="btn-primary-soft"
                                                                                    disabled={Boolean(this.state.advanceSaving[order.id])}
                                                                                    onClick={() => this.submitAdvance(order)}
                                                                                >
                                                                                    {langCtx.getText('enterAdvance')}
                                                                                </ActionButton>
                                                                            )}
                                                                            {Number(order.advanceAmount || 0) > 0 && this.isAdvanceEditable(order) && (
                                                                                <ActionButton
                                                                                    className="btn-primary-soft"
                                                                                    disabled={Boolean(this.state.advanceSaving[order.id])}
                                                                                    onClick={() => this.submitAdvance(order)}
                                                                                >
                                                                                    {langCtx.getText('editAdvance')}
                                                                                </ActionButton>
                                                                            )}
                                                                        </div>

                                                                        {/* Return Amount Section */}
                                                                        {Number(order.advanceAmount || 0) > 0 && this.isReturnEditable(order) && (
                                                                            <div className="return-section">
                                                                                <input
                                                                                    type="number"
                                                                                    className="form-control form-control-sm"
                                                                                    step="0.01"
                                                                                    placeholder="Return amount"
                                                                                    value={this.getReturnInputValue(order)}
                                                                                    disabled={Boolean(this.state.returnSaving[order.id])}
                                                                                    onChange={(e) => this.handleReturnInputChange(order.id, e.target.value)}
                                                                                />
                                                                                {this.calculateReturnedAmountDisplay(order) && (
                                                                                    <div className="preview-text">
                                                                                        {this.calculateReturnedAmountDisplay(order)}
                                                                                    </div>
                                                                                )}
                                                                                <ActionButton
                                                                                    className="btn-primary-soft"
                                                                                    style={{ background: 'rgba(198, 40, 40, 0.1)', color: '#c62828', borderColor: 'rgba(198, 40, 40, 0.35)' }}
                                                                                    disabled={Boolean(this.state.returnSaving[order.id])}
                                                                                    onClick={() => this.submitReturn(order)}
                                                                                >
                                                                                    ↩️ Apply Return
                                                                                </ActionButton>
                                                                            </div>
                                                                        )}
                                                                    </AmountActionsContainer>
                                                                </td>
                                                                <td className="text-end fw-bold" style={{ color: remaining < 0 ? '#c62828' : '#2E7D32' }}>
                                                                    ₹{(Number(remaining) || 0).toFixed(2)}
                                                                </td>
                                                                <td className="text-center">
                                                                    <Badge className="badge-admin">{langCtx.getText('offline')}</Badge>
                                                                </td>
                                                                <td className="text-center">
                                                                    <Badge className={this.getStatusBadgeClass(order.status)}>
                                                                        {this.getStatusIcon(order.status)} {langCtx.getText(statusKey(order.status))}
                                                                    </Badge>
                                                                </td>
                                                                <td className="text-center">
                                                                    <div className="d-flex flex-column align-items-center gap-1">
                                                                        <ActionButton
                                                                            className="btn-view"
                                                                            onClick={() => this.openModal(order)}
                                                                        >
                                                                            🔍 {langCtx.getText('viewOrder')}
                                                                        </ActionButton>
                                                                        <ActionButton
                                                                            className="btn-primary-soft"
                                                                            onClick={() => this.handlePrintBill(order.id)}
                                                                            disabled={Boolean(printLoadingByOrder[order.id])}
                                                                        >
                                                                            🖨️ {Boolean(printLoadingByOrder[order.id]) ? 'Printing...' : 'Print Bill'}
                                                                        </ActionButton>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </TableWrapper>
                                    </DesktopOrdersWrapper>

                                    {/* Mobile Cards */}
                                    <MobileOrdersWrapper>
                                        <div>
                                            {Array.isArray(offlineOrders) && offlineOrders.map((order) => {
                                                const phoneVal = order.customerPhone || order.phone || '—';
                                                return (
                                                    <OrderCard key={order.id}>
                                                        <OrderCardHeader>
                                                            <OrderCardTitle>
                                                                <div className="order-id">Order #{order.id}</div>
                                                                <div className="customer-name">{order.customerName}</div>
                                                            </OrderCardTitle>
                                                        </OrderCardHeader>

                                                        <OrderCardRow>
                                                            <OrderCardLabel>📞 Phone:</OrderCardLabel>
                                                            <OrderCardValue>{phoneVal}</OrderCardValue>
                                                        </OrderCardRow>

                                                        <OrderCardRow>
                                                            <OrderCardLabel>📍 Place:</OrderCardLabel>
                                                            <OrderCardValue>{order.place || '—'}</OrderCardValue>
                                                        </OrderCardRow>

                                                        <OrderCardRow>
                                                            <OrderCardLabel>📅 Date:</OrderCardLabel>
                                                            <OrderCardValue>{this.formatDate(order.orderDate || order.date)}</OrderCardValue>
                                                        </OrderCardRow>

                                                        <OrderCardRow>
                                                            <OrderCardLabel>💰 Amount:</OrderCardLabel>
                                                            <OrderCardValue className="amount">₹{(Number(order.totalAmount ?? order.grandTotal ?? 0) || 0).toFixed(2)}</OrderCardValue>
                                                        </OrderCardRow>

                                                        <OrderCardRow>
                                                            <OrderCardLabel>� Paid:</OrderCardLabel>
                                                            <OrderCardValue>₹{(Number(order.advanceAmount || 0) || 0).toFixed(2)}</OrderCardValue>
                                                        </OrderCardRow>

                                                        <OrderCardRow>
                                                            <OrderCardLabel>📊 Status:</OrderCardLabel>
                                                            <OrderStatusBadge $status={order.status}>
                                                                {langCtx.getText(statusKey(order.status))}
                                                            </OrderStatusBadge>
                                                        </OrderCardRow>

                                                        {/* Edit Amount Section - Mobile */}
                                                        <OrderCardRow style={{ marginTop: '0.8rem', paddingTop: '0.8rem', borderTop: '1px solid #e9ecef', flexDirection: 'column', alignItems: 'stretch', gap: '0.5rem' }}>
                                                            <OrderCardLabel style={{ marginBottom: '0.3rem' }}>✏️ Edit Amount Paid:</OrderCardLabel>
                                                            <input
                                                                type="number"
                                                                className="form-control form-control-sm"
                                                                step="0.01"
                                                                placeholder="Enter amount"
                                                                value={this.getAdvanceInputValue(order)}
                                                                disabled={!this.isAdvanceEditable(order) || Boolean(this.state.advanceSaving[order.id])}
                                                                onChange={(e) => this.handleAdvanceInputChange(order.id, e.target.value)}
                                                                style={{ fontSize: '12px' }}
                                                            />
                                                            {this.calculateAddedAmountDisplay(order) && (
                                                                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#2E7D32', marginTop: '0.2rem' }}>
                                                                    {this.calculateAddedAmountDisplay(order)}
                                                                </div>
                                                            )}
                                                            <div style={{ display: 'flex', gap: '0.3rem' }}>
                                                                {Number(order.advanceAmount || 0) <= 0 && this.isAdvanceEditable(order) && (
                                                                    <ActionButton
                                                                        className="btn-primary-soft"
                                                                        disabled={Boolean(this.state.advanceSaving[order.id])}
                                                                        onClick={() => this.submitAdvance(order)}
                                                                        style={{ flex: 1, fontSize: '11px', padding: '0.4rem 0.3rem' }}
                                                                    >
                                                                        {langCtx.getText('enterAdvance')}
                                                                    </ActionButton>
                                                                )}
                                                                {Number(order.advanceAmount || 0) > 0 && this.isAdvanceEditable(order) && (
                                                                    <ActionButton
                                                                        className="btn-primary-soft"
                                                                        disabled={Boolean(this.state.advanceSaving[order.id])}
                                                                        onClick={() => this.submitAdvance(order)}
                                                                        style={{ flex: 1, fontSize: '11px', padding: '0.4rem 0.3rem' }}
                                                                    >
                                                                        {langCtx.getText('editAdvance')}
                                                                    </ActionButton>
                                                                )}
                                                            </div>
                                                        </OrderCardRow>

                                                        {/* Return Amount Section - Mobile */}
                                                        {Number(order.advanceAmount || 0) > 0 && this.isReturnEditable(order) && (
                                                            <OrderCardRow style={{ paddingTop: '0.8rem', borderTop: '1px solid #e9ecef', flexDirection: 'column', alignItems: 'stretch', gap: '0.5rem' }}>
                                                                <OrderCardLabel style={{ marginBottom: '0.3rem' }}>↩️ Return Amount:</OrderCardLabel>
                                                                <input
                                                                    type="number"
                                                                    className="form-control form-control-sm"
                                                                    step="0.01"
                                                                    placeholder="Enter return amount"
                                                                    value={this.getReturnInputValue(order)}
                                                                    disabled={!this.isReturnEditable(order) || Boolean(this.state.returnSaving[order.id])}
                                                                    onChange={(e) => this.handleReturnInputChange(order.id, e.target.value)}
                                                                    style={{ fontSize: '12px' }}
                                                                />
                                                                {this.calculateReturnedAmountDisplay(order) && (
                                                                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#c62828', marginTop: '0.2rem' }}>
                                                                        {this.calculateReturnedAmountDisplay(order)}
                                                                    </div>
                                                                )}
                                                                <ActionButton
                                                                    className="btn-danger-soft"
                                                                    disabled={Boolean(this.state.returnSaving[order.id])}
                                                                    onClick={() => this.submitReturn(order)}
                                                                    style={{ fontSize: '11px', padding: '0.4rem 0.3rem' }}
                                                                >
                                                                    ↩️ {langCtx.getText('applyReturn') || 'Apply Return'}
                                                                </ActionButton>
                                                            </OrderCardRow>
                                                        )}

                                                        <OrderCardFooter>
                                                            <OrderCardButton onClick={() => this.openModal(order)}>
                                                                👁️ View Details
                                                            </OrderCardButton>
                                                        </OrderCardFooter>
                                                    </OrderCard>
                                                );
                                            })}
                                        </div>
                                    </MobileOrdersWrapper>
                                </>
                            )}

                            {/* ── Create Offline Order Modal ── */}
                            {createModalOpen && (
                                <ModalOverlay onClick={this.closeCreateModal}>
                                    <ModalContent
                                        style={{ maxWidth: '860px', width: '100%' }}
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <div className="modal-header">
                                            <h3>➕ {langCtx.getText('createOfflineOrder')}</h3>
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
                                                <SectionTitle>{langCtx.getText('step1CustomerDetails')}</SectionTitle>
                                                <div className="row g-2">
                                                    <div className="col-12 col-md-6">
                                                        <label className="form-label small fw-semibold mb-1">
                                                            {langCtx.getText('customerName')} <span className="text-danger">*</span>
                                                        </label>
                                                        <input
                                                            type="text"
                                                            className="form-control"
                                                            value={customerName}
                                                            onChange={this.onCreateFieldChange('customerName')}
                                                            placeholder={langCtx.getText('enterCustomerName')}
                                                        />
                                                    </div>
                                                    <div className="col-12 col-md-6">
                                                        <label className="form-label small fw-semibold mb-1">
                                                            {langCtx.getText('phone')} <span className="text-danger">*</span>
                                                        </label>
                                                        <input
                                                            type="text"
                                                            className="form-control"
                                                            value={phone}
                                                            onChange={this.onCreateFieldChange('phone')}
                                                            placeholder={langCtx.getText('enterPhoneNumber')}
                                                        />
                                                    </div>
                                                    <div className="col-12 col-md-6">
                                                        <label className="form-label small fw-semibold mb-1">
                                                            {langCtx.getText('place')} <span className="text-danger">*</span>
                                                        </label>
                                                        <input
                                                            type="text"
                                                            className="form-control"
                                                            value={place}
                                                            onChange={this.onCreateFieldChange('place')}
                                                            placeholder={langCtx.getText('enterPlaceCity')}
                                                        />
                                                    </div>
                                                    <div className="col-12 col-md-6">
                                                        <label className="form-label small fw-semibold mb-1">{langCtx.getText('orderDate')}</label>
                                                        <input
                                                            type="date"
                                                            className="form-control"
                                                            value={orderDate}
                                                            onChange={this.onCreateFieldChange('orderDate')}
                                                        />
                                                    </div>
                                                    <div className="col-12">
                                                        <label className="form-label small fw-semibold mb-1">
                                                            {langCtx.getText('addressLabel')} ({langCtx.getText('optional')})
                                                        </label>
                                                        <input
                                                            type="text"
                                                            className="form-control"
                                                            value={address}
                                                            onChange={this.onCreateFieldChange('address')}
                                                            placeholder={langCtx.getText('enterAddress')}
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
                                                <SectionTitle>{langCtx.getText('step2AddItems')}</SectionTitle>
                                                <div className="row g-2 align-items-end mb-3">
                                                    <div className="col-12 col-md-7">
                                                        <label className="form-label small fw-semibold mb-1">{langCtx.getText('product')}</label>
                                                        <input
                                                            type="text"
                                                            className="form-control"
                                                            placeholder={langCtx.getText('searchProduct')}
                                                            value={this.state.createProductSearch || ''}
                                                            onChange={(e) => this.setState({ createProductSearch: e.target.value })}
                                                            disabled={productsLoading}
                                                            style={{ marginBottom: '0.5rem' }}
                                                        />
                                                        <div
                                                            style={{
                                                                border: '1px solid #dee2e6',
                                                                borderRadius: '6px',
                                                                maxHeight: '200px',
                                                                overflowY: 'auto',
                                                                background: '#fff',
                                                            }}
                                                        >
                                                            {Array.isArray(products) && products.length > 0 ? (
                                                                searchProducts(products, this.state.createProductSearch)
                                                                    .map((p) => (
                                                                        <div
                                                                            key={p.id ?? p._id}
                                                                            onClick={() => {
                                                                                this.setState({ 
                                                                                    createAddProductId: p.id ?? p._id,
                                                                                    createProductSearch: ''
                                                                                });
                                                                            }}
                                                                            style={{
                                                                                padding: '0.75rem 1rem',
                                                                                cursor: 'pointer',
                                                                                borderBottom: '1px solid #e9ecef',
                                                                                transition: 'background 0.15s ease',
                                                                                background: createAddProductId === (p.id ?? p._id) ? '#e7f5ff' : 'white',
                                                                            }}
                                                                            onMouseEnter={(e) => (e.currentTarget.style.background = '#f8f9fa')}
                                                                            onMouseLeave={(e) => (e.currentTarget.style.background = createAddProductId === (p.id ?? p._id) ? '#e7f5ff' : 'white')}
                                                                        >
                                                                            <strong>{p.name}</strong>
                                                                            {p.teluguName && (
                                                                                <div style={{ fontSize: '0.7rem', color: '#8B5A3C', marginTop: '0.2rem', fontWeight: '500' }}>
                                                                                    {p.teluguName}
                                                                                </div>
                                                                            )}
                                                                            <div style={{ fontSize: '0.75rem', color: '#6c757d', marginTop: '0.25rem' }}>
                                                                                {p.category && <span>{p.category} • </span>}
                                                                                ₹{p.price}
                                                                            </div>
                                                                        </div>
                                                                    ))
                                                            ) : (
                                                                <div style={{ padding: '1rem', textAlign: 'center', color: '#6c757d' }}>
                                                                    {productsLoading ? langCtx.getText('loading') : langCtx.getText('noProductsFound')}
                                                                </div>
                                                            )}
                                                        </div>
                                                        {createAddProductId && (
                                                            <small style={{ display: 'block', marginTop: '0.5rem', color: '#2E7D32', fontWeight: 600 }}>
                                                                ✓ {products.find(p => (p.id ?? p._id) === createAddProductId)?.name} selected
                                                            </small>
                                                        )}
                                                    </div>
                                                    <div className="col-6 col-md-3">
                                                        <label className="form-label small fw-semibold mb-1">{langCtx.getText('quantity')}</label>
                                                        <input
                                                            type="text"
                                                            inputMode="numeric"
                                                            pattern="[0-9]*"
                                                            className={`form-control ${this.state.createAddQtyError ? 'is-invalid' : ''}`}
                                                            value={createAddQty}
                                                            onChange={this.onCreateAddQtyChange}
                                                        />
                                                        {this.state.createAddQtyError && (
                                                            <div className="invalid-feedback">{this.state.createAddQtyError}</div>
                                                        )}
                                                    </div>
                                                    <div className="col-6 col-md-2 d-grid">
                                                        <button
                                                            type="button"
                                                            className="btn btn-primary btn-sm"
                                                            onClick={this.addItemToCreate}
                                                            disabled={productsLoading}
                                                            style={{ fontWeight: '700' }}
                                                        >
                                                            {langCtx.getText('add')}
                                                        </button>
                                                    </div>
                                                </div>

                                                <div style={{ border: '1px solid #e9ecef', borderRadius: '8px', overflow: 'hidden' }}>
                                                    <table className="table table-hover table-sm mb-0">
                                                        <thead style={{ background: '#f8f9fa' }}>
                                                            <tr>
                                                                <th className="text-center" style={{ width: '44px' }}>✓</th>
                                                                <th>{langCtx.getText('productName')}</th>
                                                                <th className="text-center" style={{ width: '90px' }}>{langCtx.getText('price')}</th>
                                                                <th className="text-center" style={{ width: '120px' }}>{langCtx.getText('quantity')}</th>
                                                                <th className="text-end" style={{ width: '110px' }}>{langCtx.getText('total')}</th>
                                                                <th className="text-center" style={{ width: '90px' }}>{langCtx.getText('remove')}</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {createItems.length === 0 && (
                                                                <tr>
                                                                    <td colSpan="6" className="text-center text-muted" style={{ padding: '1rem' }}>
                                                                        {langCtx.getText('noItemsAddedYet')}
                                                                    </td>
                                                                </tr>
                                                            )}
                                                            {createItems.map((item) => {
                                                                const checked = this.state.selectedProducts.includes(item.productId);
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
                                                                        <td style={{ fontWeight: checked ? 600 : 400 }}>{item.name || langCtx.getText('productNameMissing')}</td>
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
                                                                            ₹{(Number(item.total) || 0).toFixed(2)}
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
                                                <SectionTitle>{langCtx.getText('step3TotalCalculation')}</SectionTitle>
                                                <div className="d-flex flex-column gap-2">
                                                    <TotalBar style={{ marginBottom: 0 }}>
                                                        <span className="total-label">✓ {langCtx.getText('selectedTotal')}</span>
                                                        <span className="total-value">₹{(Number(createSelectedTotal) || 0).toFixed(2)}</span>
                                                    </TotalBar>
                                                    <div className="d-flex justify-content-between align-items-center px-2">
                                                        <span className="text-muted fw-semibold" style={{ fontSize: '0.9rem' }}>
                                                            {langCtx.getText('grandTotalAllItems')}
                                                        </span>
                                                        <span className="fw-bold" style={{ color: '#2E7D32', fontSize: '1.05rem' }}>
                                                            ₹{(Number(createGrandTotal) || 0).toFixed(2)}
                                                        </span>
                                                    </div>
                                                    <small className="text-muted" style={{ fontSize: '0.78rem' }}>
                                                        {langCtx.getText('onlyCheckedItemsBilled')}
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
                                                {actionLoading ? langCtx.getText('saving') : langCtx.getText('saveOrder')}
                                            </button>
                                        </div>
                                    </ModalContent>
                                </ModalOverlay>
                            )}

                            {/* ── Offline Order Details Modal ── */}
                            {modalOpen && selectedOrder && (
                                <ModalOverlay onClick={this.closeModal}>
                                    <ModalContent
                                        style={{ maxWidth: 'calc(100vw - 2rem)', width: '100%' }}
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <div className="modal-header">
                                            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', fontSize: 'clamp(0.9rem, 4vw, 1.15rem)' }}>
                                                🧾 {langCtx.getText('offlineOrder')} — #{selectedOrder.id}
                                                <Badge className={this.getStatusBadgeClass(selectedOrder.status)}>
                                                    {this.getStatusIcon(selectedOrder.status)} {langCtx.getText(statusKey(selectedOrder.status))}
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
                                                        🔒 {langCtx.getText('locked')}
                                                    </span>
                                                )}
                                            </h3>
                                            <div className="d-flex align-items-center gap-2">
                                                <ActionButton
                                                    className="btn-primary-soft"
                                                    onClick={() => this.handlePrintBill(selectedOrder.id)}
                                                    disabled={Boolean(printLoadingByOrder[selectedOrder.id])}
                                                >
                                                    🖨️ {Boolean(printLoadingByOrder[selectedOrder.id]) ? 'Printing...' : 'Print Bill'}
                                                </ActionButton>
                                                <button className="close-btn" onClick={this.closeModal}>
                                                    ×
                                                </button>
                                            </div>
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
                                                <SectionTitle>{langCtx.getText('customerDetails')}</SectionTitle>
                                                <div className="row g-0">
                                                    <div className="col-12 col-sm-6">
                                                        <div className="d-flex justify-content-between py-1" style={{ fontSize: '0.9rem' }}>
                                                            <span className="text-muted">👤 {langCtx.getText('name')}</span>
                                                            <span className="fw-semibold">{selectedOrder.customerName}</span>
                                                        </div>
                                                        <div className="d-flex justify-content-between py-1" style={{ fontSize: '0.9rem' }}>
                                                            <span className="text-muted">📞 {langCtx.getText('phone')}</span>
                                                            <span className="fw-semibold">{selectedOrder.customerPhone || selectedOrder.phone || '—'}</span>
                                                        </div>
                                                        <div className="d-flex justify-content-between py-1" style={{ fontSize: '0.9rem' }}>
                                                            <span className="text-muted">🏘️ {langCtx.getText('place')}</span>
                                                            <span className="fw-semibold">{selectedOrder.place || '—'}</span>
                                                        </div>
                                                    </div>
                                                    <div className="col-12 col-sm-6">
                                                        <div className="d-flex justify-content-between py-1" style={{ fontSize: '0.9rem' }}>
                                                            <span className="text-muted">📅 {langCtx.getText('orderDate')}</span>
                                                            <span className="fw-semibold">
                                                                {this.formatDate(selectedOrder.orderDate || selectedOrder.date)}
                                                            </span>
                                                        </div>
                                                        <div className="d-flex justify-content-between py-1" style={{ fontSize: '0.9rem' }}>
                                                            <span className="text-muted">💰 {langCtx.getText('paymentMethod')}</span>
                                                            <span className="fw-semibold">{langCtx.getText('cash')}</span>
                                                        </div>
                                                        <div className="d-flex justify-content-between py-1" style={{ fontSize: '0.9rem' }}>
                                                            <span className="text-muted">📍 {langCtx.getText('addressLabel')}</span>
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
                                                    <SectionTitle>{langCtx.getText('addProductToOrder')}</SectionTitle>
                                                    <div className="row g-2 align-items-end">
                                                        <div className="col-12 col-md-7">
                                                            <label className="form-label small fw-semibold mb-1">{langCtx.getText('product')}</label>
                                                            <select
                                                                className="form-select"
                                                                value={addProductId}
                                                                onChange={this.onChangeAddProductId}
                                                                disabled={actionLoading || productsLoading}
                                                            >
                                                                <option value="">{langCtx.getText('selectProduct')}</option>
                                                                {Array.isArray(products) &&
                                                                    products.map((p) => (
                                                                    <option key={p.id ?? p._id} value={p.id ?? p._id}>
                                                                        {p.name} — ₹{p.price}
                                                                    </option>
                                                                    ))}
                                                            </select>
                                                        </div>
                                                        <div className="col-6 col-md-3">
                                                            <label className="form-label small fw-semibold mb-1">{langCtx.getText('quantity')}</label>
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
                                                                {langCtx.getText('add')}
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Items Table */}
                                            <SectionTitle>{langCtx.getText('orderedItems')}</SectionTitle>
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
                                                    🔒 <span>{langCtx.getText('orderLockedCannotModify')}</span>
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
                                                            <th className="text-center" style={{ width: 'clamp(30px, 6vw, 44px)' }}>✓</th>
                                                            <th style={{ minWidth: 'clamp(80px, 25vw, 150px)' }}>{langCtx.getText('productName')}</th>
                                                            <th className="text-center" style={{ width: 'clamp(60px, 15vw, 110px)' }}>{langCtx.getText('quantity')}</th>
                                                            <th className="text-center" style={{ width: 'clamp(50px, 12vw, 80px)' }}>{langCtx.getText('price')}</th>
                                                            <th className="text-end" style={{ width: 'clamp(60px, 15vw, 100px)' }}>{langCtx.getText('total')}</th>
                                                            <th className="text-center" style={{ width: 'clamp(50px, 12vw, 80px)' }}>{langCtx.getText('remove')}</th>
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
                                                                    <td style={{ fontWeight: checked ? 600 : 400 }}>{item.name || langCtx.getText('productNameMissing')}</td>
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
                                                                        ₹{(Number(item.total) || 0).toFixed(2)}
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
                                                <span className="total-label">✓ {langCtx.getText('selectedTotal')}</span>
                                                <span className="total-value">₹{(Number(checkedTotal) || 0).toFixed(2)}</span>
                                            </TotalBar>

                                            {(() => {
                                                const total = Number(selectedOrder?.totalAmount ?? selectedOrder?.grandTotal ?? 0) || 0;
                                                const advance = Number(selectedOrder?.advanceAmount ?? 0) || 0;
                                                const remaining = Number.isFinite(Number(selectedOrder?.remainingBalance))
                                                    ? Number(selectedOrder.remainingBalance)
                                                    : (total - advance);
                                                const remainingColor = remaining < 0 ? '#c62828' : '#2E7D32';
                                                const isFullyPaid = Number(remaining || 0) === 0;

                                                return (
                                                    <div
                                                        className="d-flex justify-content-between align-items-center mt-2"
                                                        style={{
                                                            background: '#f8f9fa',
                                                            border: '1px solid #e9ecef',
                                                            borderRadius: '8px',
                                                            padding: '0.65rem 0.85rem',
                                                        }}
                                                    >
                                                        <div className="d-flex flex-column" style={{ gap: '0.1rem' }}>
                                                            {isFullyPaid ? (
                                                                <span className="fw-semibold text-muted" style={{ fontSize: '0.82rem' }}>
                                                                    Total Amount Paid:{' '}
                                                                    <span className="fw-bold" style={{ color: '#2E7D32' }}>
                                                                        ₹{(Number(total) || 0).toFixed(2)}
                                                                    </span>
                                                                </span>
                                                            ) : (
                                                                <>
                                                                    <span className="fw-semibold text-muted" style={{ fontSize: '0.82rem' }}>
                                                                        {langCtx.getText('advance')}: <span className="fw-bold" style={{ color: '#495057' }}>₹{(Number(advance) || 0).toFixed(2)}</span>
                                                                    </span>
                                                                    <span className="fw-semibold text-muted" style={{ fontSize: '0.82rem' }}>
                                                                        {langCtx.getText('remaining')}: <span className="fw-bold" style={{ color: remainingColor }}>₹{(Number(remaining) || 0).toFixed(2)}</span>
                                                                    </span>
                                                                </>
                                                            )}
                                                        </div>
                                                        <span className="text-muted" style={{ fontSize: '0.78rem' }}>
                                                            ({langCtx.getText('billAmount')}: ₹{(Number(total) || 0).toFixed(2)})
                                                        </span>
                                                    </div>
                                                );
                                            })()}

                                            {/* Payment Update History */}
                                            {(() => {
                                                const history = Array.isArray(selectedOrder?.paymentHistory)
                                                    ? selectedOrder.paymentHistory
                                                    : [];

                                                if (history.length === 0) return null;

                                                const totalAdvance = Number(selectedOrder?.advanceAmount || 0) || 0;

                                                return (
                                                    <div
                                                        style={{
                                                            background: '#fff',
                                                            border: '1px solid #e9ecef',
                                                            borderRadius: '8px',
                                                            padding: '0.9rem 1rem',
                                                            marginTop: '1rem',
                                                        }}
                                                    >
                                                        <SectionTitle>🧾 Payment Update History</SectionTitle>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                                                            {history.map((h, idx) => {
                                                                const delta = Number(h?.deltaAmount || 0) || 0;
                                                                const isReturn = delta < 0;
                                                                const label = isReturn ? 'Amount Returned' : 'Amount Paid Added';
                                                                const icon = isReturn ? '-' : '';
                                                                const color = isReturn ? '#c62828' : '#2E7D32';
                                                                const amount = Math.abs(delta);
                                                                const when = this.formatDate(h?.createdAt);
                                                                return (
                                                                    <div
                                                                        key={String(h?.id ?? idx)}
                                                                        style={{
                                                                            border: '1px solid #f1f3f5',
                                                                            background: '#f8f9fa',
                                                                            borderRadius: '8px',
                                                                            padding: '0.65rem 0.8rem',
                                                                        }}
                                                                    >
                                                                        <div className="d-flex justify-content-between align-items-center" style={{ gap: '0.75rem' }}>
                                                                            <div className="fw-semibold" style={{ fontSize: '0.92rem', color }}>
                                                                                {icon}₹{amount.toFixed(2)} {label}
                                                                            </div>
                                                                            <div className="text-muted" style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                                                                                {when}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>

                                                        <div className="d-flex justify-content-between align-items-center mt-3" style={{ fontSize: '0.9rem' }}>
                                                            <span className="text-muted fw-semibold">Total Amount Paid</span>
                                                            <span className="fw-bold">₹{totalAdvance.toFixed(2)}</span>
                                                        </div>
                                                    </div>
                                                );
                                            })()}
                                        </div>

                                        <div className="modal-footer" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
                                            {/* Verified Checkbox (Pending only) */}
                                            <VerifyCheckWrapper>
                                                <input
                                                    type="checkbox"
                                                    id="verifyOfflineOrder"
                                                    checked={!!isVerified}
                                                    disabled={!isPending || isRejected || actionLoading}
                                                    onChange={(e) => this.handleVerifyCheckbox(e.target.checked)}
                                                />
                                                <label htmlFor="verifyOfflineOrder">{langCtx.getText('markOrderVerified')}</label>
                                            </VerifyCheckWrapper>

                                            <div className="ms-auto d-flex gap-2 flex-wrap">
                                                <button
                                                    type="button"
                                                    className="btn btn-primary btn-sm"
                                                    onClick={() => this.handleMarkPaid(selectedOrder.id)}
                                                    disabled={actionLoading || isRejected || !isVerified || isPaid || !isRemainingSettled}
                                                    title={
                                                        !isVerified
                                                            ? langCtx.getText('verifyOrderFirst')
                                                            : (!isRemainingSettled
                                                                ? langCtx.getText('remainingMustBeZeroToMarkPaid')
                                                                : langCtx.getText('markAsPaid'))
                                                    }
                                                    style={{ fontWeight: '700' }}
                                                >
                                                    💳 {langCtx.getText('markPaid')}
                                                </button>

                                                <button
                                                    type="button"
                                                    className="btn btn-success btn-sm"
                                                    onClick={() => this.handleDeliver(selectedOrder.id)}
                                                    disabled={actionLoading || isRejected || !isVerified || isDelivered}
                                                    title={!isVerified ? langCtx.getText('verifyOrderFirst') : langCtx.getText('markAsDelivered')}
                                                    style={{ fontWeight: '700' }}
                                                >
                                                    📦 {langCtx.getText('markDeliveredAction')}
                                                </button>

                                                {isPending && !isRejected && (
                                                    <button
                                                        type="button"
                                                        className="btn btn-danger btn-sm"
                                                        onClick={() => this.handleReject(selectedOrder.id)}
                                                        disabled={actionLoading}
                                                        style={{ fontWeight: '700' }}
                                                    >
                                                        ❌ {langCtx.getText('rejectOrder')}
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
