import React from 'react';
import LanguageContext from '../context/LanguageContext';
import orderService from '../services/orderService';
import productService from '../services/productService';
import Spinner from '../components/Spinner';
import { toast } from 'react-toastify';
import { t, statusKey, hasTranslation } from '../utils/i18n';
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
    &.btn-accept {
        background: rgba(255, 152, 0, 0.12);
        color: #e65100;
        border: 1px solid rgba(255, 152, 0, 0.35);
        &:hover:not(:disabled) { background: rgba(255, 152, 0, 0.24); }
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
            // Spec alignment
            onlineOrders: [],
            isLoading: true,
            orders: [],
            loading: true,
            errorKey: null,
            products: [],
            productsLoading: false,
            // Modal
            selectedOrder: null,
            modalOpen: false,
            actionLoading: false,
            // Item-level check state for currently open order modal
            selectedProducts: [],
            // Editable items inside open modal (deep copy of selectedOrder.items)
            modalItems: [],
            // Add Product section state (Pending only)
            addProductId: '',
            addProductQty: '1',
            addProductQtyError: '',

            // Search
            searchQuery: '',

            // Print Bill loading by order id
            printLoadingByOrder: {},

            // Advance Payment (per order row)
            advanceInputs: {},
            advanceSaving: {},
        };
    }

    componentDidMount() {
        this.fetchOrders();
        this.fetchProducts();
    }

    // ─── Data Fetching ─────────────────────────────────────────────────────────

    fetchOrders = async () => {
        const { searchQuery } = this.state;
        this.setState({ loading: true, isLoading: true });
        try {
            const response = await orderService.getAllOrders(searchQuery);
            console.log('Admin Online Orders:', response);
            const orders = Array.isArray(response) ? response : (response?.orders || response?.data || []);
            // Initialize/refresh advance input values from API (but don't overwrite in-progress edits)
            const nextAdvanceInputs = { ...this.state.advanceInputs };
            (Array.isArray(orders) ? orders : []).forEach((o) => {
                const id = o && o.id;
                if (!id) return;
                if (nextAdvanceInputs[id] === undefined) {
                    const fromApi = Number(o.advanceAmount || 0);
                    nextAdvanceInputs[id] = Number.isFinite(fromApi) ? String(fromApi) : '0';
                }
            });

            this.setState({
                orders,
                onlineOrders: orders,
                advanceInputs: nextAdvanceInputs,
                errorKey: null,
                loading: false,
                isLoading: false,
            });
        } catch (err) {
            this.setState({ errorKey: 'failedToLoadOrders', loading: false, isLoading: false });
            toast.error(t('failedToLoadOrders'));
        }
    };

    // ─── Advance Payment Helpers ───────────────────────────────────────────

    isAdvanceEditable = (order) => {
        const statusRaw = String(order?.status || '').trim();
        const statusLower = statusRaw.toLowerCase();
        const paymentStatusLower = String(order?.paymentStatus || '').trim().toLowerCase();

        // Hard lock after payment/completion
        const isLocked =
            Boolean(order?.isPaid) ||
            paymentStatusLower === 'paid' ||
            statusLower === 'paid' ||
            statusLower === 'completed' ||
            statusLower === 'mark paid';

        if (isLocked) return false;

        // Spec-allowed statuses
        const allowed = new Set(['accepted', 'confirmed', 'processing', 'verified', 'delivered']);
        return allowed.has(statusLower);
    };

    getAdvanceInputValue = (order) => {
        const id = order && order.id;
        if (!id) return '0';
        const v = this.state.advanceInputs[id];
        if (v !== undefined && v !== null) return String(v);
        const fromApi = Number(order?.advanceAmount || 0);
        return String(Number.isFinite(fromApi) ? fromApi : 0);
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

        const raw = this.getAdvanceInputValue(order);
        const num = Number(raw);
        if (!Number.isFinite(num)) {
            toast.error(t('enterValidAdvanceAmount'));
            return;
        }
        if (num < 0) {
            toast.error(t('advanceAmountCannotBeNegative'));
            return;
        }

        this.setState({
            advanceSaving: {
                ...this.state.advanceSaving,
                [orderId]: true,
            },
        });

        try {
            const resp = await orderService.updateAdvanceAmount(orderId, num);
            const updatedOrder = resp?.order || resp?.data?.order || resp;

            // Update orders list in-place for snappy UI
            const patchList = (list) => (Array.isArray(list) ? list.map((o) => (o.id === orderId ? { ...o, ...updatedOrder } : o)) : list);

            this.setState((prev) => ({
                orders: patchList(prev.orders),
                onlineOrders: patchList(prev.onlineOrders),
                selectedOrder: prev.selectedOrder && prev.selectedOrder.id === orderId ? { ...prev.selectedOrder, ...updatedOrder } : prev.selectedOrder,
                advanceInputs: {
                    ...prev.advanceInputs,
                    [orderId]: String(Number(updatedOrder?.advanceAmount || 0) || 0),
                },
            }));

            toast.success(t('advanceUpdated'));
        } catch (e) {
            const rawMsg = e?.response?.data?.errorKey || e?.response?.data?.message || e?.message;
            toast.error(rawMsg && hasTranslation(rawMsg) ? t(rawMsg) : t('failedToUpdateAdvance'));
        } finally {
            this.setState({
                advanceSaving: {
                    ...this.state.advanceSaving,
                    [orderId]: false,
                },
            });
        }
    };

    handleSearchChange = (e) => {
        this.setState({ searchQuery: e.target.value }, () => this.fetchOrders());
    };

    fetchProducts = async () => {
        this.setState({ productsLoading: true });
        try {
            const response = await productService.getProducts();
            console.log('AdminOnlineOrdersPage.fetchProducts response:', response);

            // Normalize response to an array (supports: direct array, {success,data:[...]}, {products:[...]})
            const extracted = Array.isArray(response)
                ? response
                : response?.data?.data ?? response?.data ?? response?.products ?? [];

            const safeProducts = Array.isArray(extracted) ? extracted : [];
            if (!Array.isArray(extracted)) {
                console.error('AdminOnlineOrdersPage: products is not array:', extracted);
            }

            this.setState({ products: safeProducts, productsLoading: false });
        } catch (err) {
            this.setState({ productsLoading: false });
            toast.error(t('failedToLoadProducts'));
        }
    };

    // ─── Modal Open / Close ────────────────────────────────────────────────────

    openModal = async (order) => {
        if (!order?.id) return;

        // Fetch fresh order so the modal always reflects latest advance + history.
        let orderForModal = order;
        try {
            const resp = await orderService.getOrderById(order.id);
            orderForModal = resp?.order || resp?.data?.order || resp?.data || resp || order;
        } catch {
            orderForModal = order;
        }

        const orderItems = Array.isArray(orderForModal?.items) ? orderForModal.items : [];

        // Normalize items so the UI always maintains one row per product.
        // Backend payloads sometimes carry productId as string; normalize to number and merge duplicates.
        const mergedItems = orderItems.reduce((acc, raw) => {
            const productIdNum = parseInt(raw?.productId, 10);
            if (!Number.isFinite(productIdNum) || productIdNum <= 0) return acc;

            const priceNum = Number(raw?.price || 0) || 0;
            const qtyNum = Number.isFinite(Number(raw?.quantity)) ? Number(raw.quantity) : 0;
            const existingIdx = acc.findIndex((x) => x.productId === productIdNum);

            if (existingIdx === -1) {
                acc.push({
                    ...raw,
                    productId: productIdNum,
                    name: raw?.name ?? raw?.productName,
                    price: priceNum,
                    quantity: qtyNum,
                    total:
                        Number(raw?.total || 0) ||
                        (priceNum * (Number(qtyNum || 0) || 0)),
                });
                return acc;
            }

            const prev = acc[existingIdx];
            const nextQty = (Number(prev?.quantity || 0) || 0) + (Number(qtyNum || 0) || 0);
            const nextPrice = Number(prev?.price || 0) || priceNum;
            const nextTotal = nextPrice * nextQty;

            acc[existingIdx] = {
                ...prev,
                // Prefer any explicit name/productName already present.
                name: prev?.name ?? (raw?.name ?? raw?.productName),
                price: nextPrice,
                quantity: nextQty,
                total: nextTotal,
                // Keep selection if any duplicate row is selected.
                isSelected: Boolean(prev?.isSelected) || Boolean(raw?.isSelected),
            };

            return acc;
        }, []);
        const shouldRestoreSelection =
            !!(
                orderForModal &&
                (orderForModal.isVerified || ['Verified', 'Paid', 'Delivered', 'Completed'].includes(orderForModal.status))
            );

        const selectedFromDb = shouldRestoreSelection
            ? mergedItems
                .filter((item) => {
                    const hasFlag = !(item?.isSelected === undefined || item?.isSelected === null);
                    return hasFlag ? Boolean(item.isSelected) : true;
                })
                .map((item) => Number(item.productId))
            : [];

        this.setState({
            selectedOrder: orderForModal,
            modalOpen: true,
            selectedProducts: selectedFromDb,
            // Deep copy items so quantity edits don't mutate source
            modalItems: mergedItems.map((item) => ({
                ...item,
                productId: Number(item.productId),
                // Normalize display field
                name: item?.name ?? item?.productName,
                price: Number(item?.price || 0) || 0,
                quantity: Number.isFinite(Number(item?.quantity)) ? Number(item.quantity) : 0,
                total:
                    Number(item?.total || 0) ||
                    (Number(item?.price || 0) || 0) * (Number(item?.quantity || 0) || 0),
            })),
            addProductId: '',
            addProductQty: '1',
            addProductQtyError: '',
        });
    };

    closeModal = () => {
        this.setState({ selectedOrder: null, modalOpen: false, modalItems: [], selectedProducts: [] });
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
            toast.error(rawMsg && hasTranslation(rawMsg) ? t(rawMsg) : 'Failed to open printable bill');
        } finally {
            this.setState((prev) => ({
                printLoadingByOrder: {
                    ...prev.printLoadingByOrder,
                    [orderId]: false,
                },
            }));
        }
    };

    // ─── Item Checkbox ─────────────────────────────────────────────────────────

    toggleItemCheck = (productId) => {
        const { selectedOrder, selectedProducts } = this.state;
        if (!selectedOrder) return;
        // Lock: online order changes are allowed only after acceptance.
        if (selectedOrder.status !== 'Accepted') return;
        const isSelected = selectedProducts.includes(productId);
        const nextSelectedProducts = isSelected
            ? selectedProducts.filter((id) => id !== productId)
            : [...selectedProducts, productId];

        this.setState({ selectedProducts: nextSelectedProducts });
    };

    // ─── Quantity Editing (PART 2) ─────────────────────────────────────────────

    updateItemQuantity = (productId, delta) => {
        const { selectedOrder } = this.state;
        // Lock: online order changes are allowed only after acceptance.
        if (selectedOrder && selectedOrder.status !== 'Accepted') return;
        const pid = parseInt(productId, 10);
        const updatedItems = this.state.modalItems.map((item) => {
            if (Number(item.productId) === pid) {
                const currentQty = Number(item.quantity || 0) || 0;
                const newQty = Math.max(0, currentQty + delta);
                const price = Number(item.price || 0) || 0;
                return { ...item, quantity: newQty, total: price * newQty };
            }
            return item;
        });
        this.setState({ modalItems: updatedItems });
    };

    removeItemFromOrder = async (productId) => {
        const { selectedOrder } = this.state;
        if (!selectedOrder || selectedOrder.status !== 'Accepted') return;

        const pid = parseInt(productId, 10);
        if (!Number.isFinite(pid) || pid <= 0) return;

        this.setState({ actionLoading: true });
        try {
            const nextModalItems = (Array.isArray(this.state.modalItems) ? this.state.modalItems : [])
                .filter((it) => Number(it.productId) !== pid);

            const nextSelectedProducts = (Array.isArray(this.state.selectedProducts) ? this.state.selectedProducts : [])
                .map((x) => parseInt(x, 10))
                .filter((x) => Number.isFinite(x) && x > 0 && x !== pid);

            // Keep unchecked items in DB, but item removal should fully delete the row.
            const updatedItemsForSave = nextModalItems.map((i) => {
                const qty = parseInt(i.quantity, 10);
                const quantity = Number.isFinite(qty) ? qty : 0;
                const price = Number(i.price || 0) || 0;
                const isSelected = nextSelectedProducts.includes(Number(i.productId)) && (Number(quantity || 0) || 0) > 0;

                return {
                    ...i,
                    productId: Number(i.productId),
                    productName: i?.productName ?? i?.name,
                    quantity,
                    price,
                    isSelected,
                    total: price * quantity,
                };
            });

            const finalTotal = updatedItemsForSave
                .filter((i) => Boolean(i.isSelected))
                .reduce((sum, i) => sum + (Number(i.total || 0) || 0), 0);

            const resp = await orderService.updateOrderBeforeVerify(selectedOrder.id, updatedItemsForSave, finalTotal);
            const nextOrder = resp?.order || resp?.data?.order || resp?.data || null;

            this.setState((prev) => {
                const baseOrder = prev.selectedOrder || {};
                const patchedOrder = {
                    ...baseOrder,
                    ...(nextOrder || {}),
                    // Ensure UI totals refresh even if backend doesn't echo them back.
                    totalAmount: Number(nextOrder?.totalAmount ?? nextOrder?.grandTotal ?? finalTotal),
                    grandTotal: Number(nextOrder?.grandTotal ?? nextOrder?.totalAmount ?? finalTotal),
                    remainingBalance:
                        Number.isFinite(Number(nextOrder?.remainingBalance))
                            ? Number(nextOrder.remainingBalance)
                            : (Number(finalTotal) - (Number(baseOrder?.advanceAmount ?? 0) || 0)),
                };

                const patch = (list) =>
                    (Array.isArray(list)
                        ? list.map((o) => (o.id === baseOrder.id ? { ...o, ...patchedOrder } : o))
                        : list);

                return {
                    modalItems: nextModalItems,
                    selectedProducts: nextSelectedProducts,
                    selectedOrder: patchedOrder,
                    orders: patch(prev.orders),
                    onlineOrders: patch(prev.onlineOrders),
                };
            });
        } catch (err) {
            const rawMsg = err?.response?.data?.errorKey || err?.response?.data?.message || err?.message;
            toast.error(rawMsg && hasTranslation(rawMsg) ? t(rawMsg) : t('failedToUpdateOrderStatus'));
        } finally {
            this.setState({ actionLoading: false });
        }
    };

    // ─── Add Product to Order (Pending Only) ─────────────────────────────────

    onChangeAddProductId = (e) => {
        this.setState({ addProductId: e.target.value });
    };

    onChangeAddProductQty = (e) => {
        const raw = String(e?.target?.value ?? '');
        if (raw === '') {
            this.setState({ addProductQty: '', addProductQtyError: '' });
            return;
        }

        // Allow only digits (prevents -, e, ., and other non-numeric chars)
        if (!/^\d+$/.test(raw)) return;

        this.setState({ addProductQty: raw, addProductQtyError: '' });
    };

    handleAddProductToOrder = async () => {
        const { selectedOrder, addProductId, addProductQty, products, modalItems } = this.state;
        if (!selectedOrder || selectedOrder.status !== 'Accepted') return;

        const productId = parseInt(addProductId, 10);
        if (!productId) {
            toast.warning(t('pleaseSelectProduct'));
            return;
        }

        const qtyNum = parseInt(String(addProductQty || ''), 10);
        if (!Number.isFinite(qtyNum) || qtyNum < 1) {
            const msg = 'Quantity must be greater than or equal to 1';
            this.setState({ addProductQtyError: msg });
            toast.error(msg);
            return;
        }

        const quantity = qtyNum;
        const product = products.find((p) => p.id === productId);
        if (!product) {
            toast.error(t('selectedProductNotFound'));
            return;
        }

        this.setState({ actionLoading: true });
        try {
            // Backend integration: add item before verification
            await orderService.addItemToOrder(selectedOrder.id, productId, quantity);

            const existingIdx = modalItems.findIndex((i) => Number(i.productId) === productId);
            let nextModalItems = [];
            if (existingIdx !== -1) {
                nextModalItems = modalItems.map((i) => {
                    if (Number(i.productId) !== productId) return i;
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

            this.setState({
                modalItems: nextModalItems,
                addProductId: '',
                addProductQty: '1',
                addProductQtyError: '',
            });
        } catch (err) {
            const rawMsg = err?.response?.data?.errorKey || err?.response?.data?.message || err?.message;
            toast.error(rawMsg && hasTranslation(rawMsg) ? t(rawMsg) : t('failedToAddProductToOrder'));
        } finally {
            this.setState({ actionLoading: false });
        }
    };

    // ─── Computed: Checked Total (PART 1) ─────────────────────────────────────

    getCheckedTotal = () => {
        const { selectedOrder, selectedProducts, modalItems } = this.state;
        if (!selectedOrder) return 0;
        if (!Array.isArray(selectedProducts) || selectedProducts.length === 0) return 0;
        return modalItems
            .filter((item) => selectedProducts.includes(item.productId))
            .reduce((sum, item) => sum + (Number(item?.total || 0) || 0), 0);
    };

    // ─── Order-Level Verified Checkbox (PART 3) ────────────────────────────────

    handleVerifyCheckbox = async (isChecked) => {
        if (!isChecked) return; // Verification is irreversible
        const { selectedOrder } = this.state;
        if (!selectedOrder || selectedOrder.status !== 'Accepted') return;
        await this.handleVerify(selectedOrder.id);
    };

    handleAcceptOrder = async (orderId) => {
        this.setState({ actionLoading: true });
        try {
            const resp = await orderService.acceptOrder(orderId);
            const nextOrder = resp?.order || resp?.data?.order || { id: orderId, status: 'Accepted' };

            const patch = (list) =>
                (Array.isArray(list) ? list.map((o) => (o.id === orderId ? { ...o, ...nextOrder } : o)) : list);

            this.setState((prev) => ({
                orders: patch(prev.orders),
                onlineOrders: patch(prev.onlineOrders),
                selectedOrder:
                    prev.selectedOrder && prev.selectedOrder.id === orderId
                        ? { ...prev.selectedOrder, ...nextOrder }
                        : prev.selectedOrder,
            }));

            await this.fetchOrders();

            toast.success(t('orderAccepted'));
        } catch (err) {
            const rawMsg = err?.response?.data?.errorKey || err?.response?.data?.message || err?.message;
            toast.error(rawMsg && hasTranslation(rawMsg) ? t(rawMsg) : t('failedToUpdateOrderStatus'));
        } finally {
            this.setState({ actionLoading: false });
        }
    };

    // ─── Status Actions ────────────────────────────────────────────────────────

    handleVerify = async (orderId) => {
        this.setState({ actionLoading: true });
        try {
            const { selectedOrder, modalItems, selectedProducts } = this.state;
            if (!selectedOrder || selectedOrder.id !== orderId) return;
            if (selectedOrder.status !== 'Accepted') {
                toast.warning(t('verifyAfterAcceptOnly'));
                return;
            }

            if (!Array.isArray(selectedProducts) || selectedProducts.length === 0) {
                toast.warning(t('selectAtLeastOneItemBeforeVerifying'));
                return;
            }

            // Build a full item list with `isSelected` flags.
            // Keep unchecked items in the UI and DB, but mark them unselected.
            const updatedItems = (Array.isArray(modalItems) ? modalItems : []).map((i) => {
                const qty = parseInt(i.quantity, 10);
                const quantity = Number.isFinite(qty) ? qty : 0;
                const price = Number(i.price || 0) || 0;

                // If checked but qty <= 0, treat it as not selected.
                const initiallySelected = selectedProducts.includes(i.productId);
                const isSelected = initiallySelected && (Number(quantity || 0) || 0) > 0;

                return {
                    ...i,
                    productName: i?.productName ?? i?.name,
                    quantity,
                    price,
                    isSelected,
                    total: price * quantity,
                };
            });

            const selectedForVerify = updatedItems.filter((i) => Boolean(i.isSelected));
            if (selectedForVerify.length === 0) {
                toast.warning(t('selectedItemsQtyGreaterThanZero'));
                return;
            }

            const finalTotal = selectedForVerify.reduce((sum, i) => sum + (Number(i.total || 0) || 0), 0);

            // Persist selection state + totals BEFORE verifying (backend will lock afterwards)
            await orderService.updateOrderBeforeVerify(orderId, updatedItems, finalTotal);
            const verifyResp = await orderService.verifyOrder(orderId);
            const verifiedOrder = verifyResp?.order || verifyResp?.data?.order || verifyResp?.data || null;

            const patch = (list) =>
                (Array.isArray(list) ? list.map((o) => (o.id === orderId ? { ...o, ...(verifiedOrder || {}), status: 'Verified', isVerified: true } : o)) : list);

            const nextSelectedOrder = this.state.selectedOrder && this.state.selectedOrder.id === orderId
                ? { ...this.state.selectedOrder, ...(verifiedOrder || {}), status: 'Verified', isVerified: true }
                : this.state.selectedOrder;

            const nextItems = Array.isArray(nextSelectedOrder?.items) ? nextSelectedOrder.items : updatedItems;
            const nextSelectedProducts = nextItems.filter((it) => Boolean(it?.isSelected)).map((it) => it.productId);

            this.setState((prev) => {
                const nextOrders = patch(prev.onlineOrders || prev.orders);
                return {
                    orders: nextOrders,
                    onlineOrders: nextOrders,
                    selectedOrder: nextSelectedOrder,
                    modalItems: nextItems,
                    selectedProducts: nextSelectedProducts,
                };
            });

            toast.success(t('orderVerifiedSynced'));
        } catch (err) {
            toast.error(t('failedToUpdateOrderStatus'));
        } finally {
            this.setState({ actionLoading: false });
        }
    };

    // Payment Approval (PART 4)
    handleApprovePayment = async (orderId) => {
        this.setState({ actionLoading: true });
        try {
            const resp = await orderService.approvePayment(orderId);
            const nextOrder = resp?.order || resp?.data?.order || null;

            if (nextOrder) {
                const orders = (this.state.onlineOrders || this.state.orders).map((o) =>
                    o.id === orderId ? { ...o, ...nextOrder } : o
                );
                const selectedOrder = this.state.selectedOrder
                    ? { ...this.state.selectedOrder, ...nextOrder }
                    : null;
                this.setState({ orders, onlineOrders: orders, selectedOrder });

                // If it becomes Completed, it moves to Bills view.
                if (nextOrder.status === 'Completed') {
                    await this.fetchOrders();
                }
            } else {
                // Fallback (mock mode)
                const orders = (this.state.onlineOrders || this.state.orders).map((o) =>
                    o.id === orderId
                        ? {
                              ...o,
                              isPaid: true,
                              paymentStatus: 'Paid',
                              status: o.isDelivered ? 'Completed' : 'Paid',
                          }
                        : o
                );
                const selectedOrder = this.state.selectedOrder
                    ? {
                          ...this.state.selectedOrder,
                          isPaid: true,
                          paymentStatus: 'Paid',
                          status: this.state.selectedOrder.isDelivered ? 'Completed' : 'Paid',
                      }
                    : null;
                this.setState({ orders, onlineOrders: orders, selectedOrder });
            }
            toast.success(`${t('paymentApprovedSuccess')} 💳`);
        } catch (err) {
            toast.error(t('failedToApprovePayment'));
        } finally {
            this.setState({ actionLoading: false });
        }
    };

    // Delivery (allowed after Verification)
    handleDeliver = async (orderId) => {
        this.setState({ actionLoading: true });
        try {
            const resp = await orderService.deliverOrder(orderId);
            const nextOrder = resp?.order || resp?.data?.order || null;

            if (nextOrder) {
                const orders = (this.state.onlineOrders || this.state.orders).map((o) =>
                    o.id === orderId ? { ...o, ...nextOrder } : o
                );
                const selectedOrder = this.state.selectedOrder
                    ? { ...this.state.selectedOrder, ...nextOrder }
                    : null;
                this.setState({ orders, onlineOrders: orders, selectedOrder });
            }

            // Re-fetch so Completed moves out of Active.
            await this.fetchOrders();
            toast.success(`${t('orderMarkedDelivered')} 📦`);
        } catch (err) {
            toast.error(t('failedToUpdateOrderStatus'));
        } finally {
            this.setState({ actionLoading: false });
        }
    };

    // Reject Order (Pending Acceptance or Accepted)
    handleReject = async (orderId) => {
        const { selectedOrder } = this.state;
        if (!selectedOrder) return;
        if (!['Pending Acceptance', 'Accepted'].includes(String(selectedOrder.status || ''))) return;

        // Keep confirm minimal; no extra UX beyond a standard prompt.
        const ok = window.confirm(t('rejectOrderConfirm'));
        if (!ok) return;

        this.setState({ actionLoading: true });
        try {
            await orderService.rejectOrder(orderId);
            // Rejected orders no longer match the active filter; refetch to remove from list
            await this.fetchOrders();
            toast.success(t('orderRejected'));
        } catch (err) {
            toast.error(t('failedToRejectOrder'));
        } finally {
            this.setState({ actionLoading: false });
        }
    };

    // ─── Badge Helpers ─────────────────────────────────────────────────────────

    getStatusBadgeClass = (status) => {
        const map = {
            'Pending Acceptance': 'badge-warning',
            Accepted: 'badge-info',
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
        if (status === 'Pending Acceptance') return '🕒';
        if (status === 'Accepted') return '👍';
        if (status === 'Pending') return '⏳';
        if (status === 'Verified') return '✅';
        if (status === 'Paid') return '💰';
        if (status === 'Delivered') return '📦';
        if (status === 'Completed') return '🏁';
        if (status === 'Rejected') return '❌';
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

    formatDate = (dateStr, locale = 'en-IN') => {
        if (!dateStr) return '—';
        const d = new Date(dateStr);
        if (Number.isNaN(d.getTime())) return '—';
        return d.toLocaleDateString(locale, {
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
                    const locale = langCtx.currentLanguage === 'te' ? 'te-IN' : 'en-IN';
                    const {
                        onlineOrders,
                        isLoading,
                        orders,
                        loading,
                        errorKey,
                        selectedOrder,
                        modalOpen,
                        selectedProducts,
                        modalItems,
                        actionLoading,
                        products,
                        productsLoading,
                        addProductId,
                        addProductQty,
                        printLoadingByOrder,
                    } = this.state;

                    console.log('Admin Orders State:', products);

                    // Checked total for modal
                    const checkedTotal = this.getCheckedTotal();

                    // Derived flags for selected order
                    const isVerified =
                        !!(
                            selectedOrder &&
                            (selectedOrder.isVerified ||
                                ['Verified', 'Paid', 'Delivered', 'Completed'].includes(
                                    selectedOrder.status
                                ))
                        );
                    const isPaymentPaid =
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

                    const getPaymentStatusText = (paymentStatus) => {
                        const lower = String(paymentStatus || '').trim().toLowerCase();
                        return lower === 'paid'
                            ? langCtx.getText('paymentApproved')
                            : langCtx.getText('pendingPayment');
                    };
                    const isRejected = selectedOrder && selectedOrder.status === 'Rejected';
                    const isPendingAcceptance =
                        selectedOrder && ['Pending Acceptance', 'Pending'].includes(String(selectedOrder.status || ''));
                    const isAcceptedEditable = selectedOrder && selectedOrder.status === 'Accepted';
                    const isLocked = selectedOrder && !isAcceptedEditable;

                    const totalForPayment = Number(selectedOrder?.totalAmount ?? selectedOrder?.grandTotal ?? checkedTotal ?? 0) || 0;
                    const advanceForPayment = Number(selectedOrder?.advanceAmount ?? 0) || 0;
                    const remainingForPayment = selectedOrder
                        ? (Number.isFinite(Number(selectedOrder?.remainingBalance))
                            ? Number(selectedOrder.remainingBalance)
                            : (totalForPayment - advanceForPayment))
                        : 0;
                    const isRemainingSettled = Math.abs(Number(remainingForPayment) || 0) <= 0.009;

                    const effectiveOrders = Array.isArray(onlineOrders) ? onlineOrders : orders;
                    const effectiveLoading = typeof isLoading === 'boolean' ? isLoading : loading;
                    const safeOrders = Array.isArray(effectiveOrders) ? effectiveOrders : [];

                    return (
                        <div>
                            {/* ── Page Header ── */}
                            <PageHeader>
                                <h1>🛵 {langCtx.getText('onlineOrders')}</h1>
                                <p>
                                    {safeOrders.length} {langCtx.getText('cashOnDeliveryOrderCountLabel')}
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

                            {effectiveLoading && <Spinner fullPage text={langCtx.getText('loadingOrders')} />}
                            {errorKey && <div className="alert alert-danger">{langCtx.getText(errorKey)}</div>}

                            {/* ── Empty State ── */}
                            {!effectiveLoading && !errorKey && (!safeOrders || safeOrders.length === 0) && (
                                <EmptyState>
                                    <div className="empty-icon">🛵</div>
                                    <h3>{langCtx.getText('noOrders')}</h3>
                                    <p>{langCtx.getText('noOrdersMessage')}</p>
                                </EmptyState>
                            )}

                            {/* ── Orders Table ── */}
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
                                                        <th>{langCtx.getText('orderDate')}</th>
                                                        <th className="text-end">{langCtx.getText('billAmount')}</th>
                                                        <th className="text-end">{langCtx.getText('advance')}</th>
                                                        <th className="text-end">{langCtx.getText('remaining')}</th>
                                                        <th className="text-center">{langCtx.getText('orderStatus')}</th>
                                                        <th className="text-center">{langCtx.getText('viewOrder')}</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {safeOrders.map((order) => (
                                                        <tr key={order.id}>
                                                            <td className="fw-bold">#{order.id}</td>
                                                            <td>{order.customerName}</td>
                                                            <td>{order.phone || order.customerPhone || '—'}</td>
                                                            <td style={{ whiteSpace: 'nowrap' }}>
                                                                {this.formatDate(order.orderDate || order.date, locale)}
                                                            </td>
                                                            <td className="text-end fw-bold" style={{ color: '#2E7D32' }}>
                                                                ₹{Number(order.totalAmount ?? order.grandTotal ?? 0).toFixed(2)}
                                                            </td>
                                                            <td className="text-end" style={{ minWidth: '160px' }}>
                                                                <div className="d-flex flex-column align-items-end gap-1">
                                                                    <input
                                                                        type="number"
                                                                        className="form-control form-control-sm"
                                                                        style={{ maxWidth: '150px' }}
                                                                        min="0"
                                                                        step="0.01"
                                                                        value={this.getAdvanceInputValue(order)}
                                                                        disabled={!this.isAdvanceEditable(order) || Boolean(this.state.advanceSaving[order.id])}
                                                                        onChange={(e) => this.handleAdvanceInputChange(order.id, e.target.value)}
                                                                    />
                                                                    <div className="d-flex gap-1" style={{ justifyContent: 'flex-end' }}>
                                                                        {Number(order.advanceAmount || 0) <= 0 && this.isAdvanceEditable(order) && (
                                                                            <ActionButton
                                                                                className="btn-payment"
                                                                                disabled={Boolean(this.state.advanceSaving[order.id])}
                                                                                onClick={() => this.submitAdvance(order)}
                                                                            >
                                                                                {langCtx.getText('enterAdvance')}
                                                                            </ActionButton>
                                                                        )}
                                                                        {Number(order.advanceAmount || 0) > 0 && this.isAdvanceEditable(order) && (
                                                                            <ActionButton
                                                                                className="btn-payment"
                                                                                disabled={Boolean(this.state.advanceSaving[order.id])}
                                                                                onClick={() => this.submitAdvance(order)}
                                                                            >
                                                                                {langCtx.getText('editAdvance')}
                                                                            </ActionButton>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="text-end fw-bold" style={{ color: (Number(order.remainingBalance ?? ((Number(order.totalAmount || 0) || 0) - (Number(order.advanceAmount || 0) || 0))) || 0) < 0 ? '#c62828' : '#2E7D32' }}>
                                                                ₹{Number(order.remainingBalance ?? ((Number(order.totalAmount || 0) || 0) - (Number(order.advanceAmount || 0) || 0))).toFixed(2)}
                                                            </td>
                                                            <td className="text-center">
                                                                <div className="d-flex flex-column align-items-center gap-1">
                                                                    <Badge className={this.getStatusBadgeClass(order.status)}>
                                                                        {this.getStatusIcon(order.status)} {langCtx.getText(statusKey(order.status))}
                                                                    </Badge>
                                                                    <Badge className={this.getPaymentBadgeClass(order.paymentStatus)}>
                                                                        {this.getPaymentIcon(order.paymentStatus)}{' '}
                                                                        {getPaymentStatusText(order.paymentStatus)}
                                                                    </Badge>
                                                                </div>
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
                                                                        className="btn-payment"
                                                                        onClick={() => this.handlePrintBill(order.id)}
                                                                        disabled={Boolean(printLoadingByOrder[order.id])}
                                                                    >
                                                                        🖨️ {Boolean(printLoadingByOrder[order.id]) ? 'Printing...' : 'Print Bill'}
                                                                    </ActionButton>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </TableWrapper>
                                    </DesktopOrdersWrapper>

                                    {/* Mobile Cards */}
                                    <MobileOrdersWrapper>
                                        <div>
                                            {safeOrders.map((order) => (
                                                <OrderCard key={order.id}>
                                                    <OrderCardHeader>
                                                        <OrderCardTitle>
                                                            <div className="order-id">Order #{order.id}</div>
                                                            <div className="customer-name">{order.customerName}</div>
                                                        </OrderCardTitle>
                                                    </OrderCardHeader>

                                                    <OrderCardRow>
                                                        <OrderCardLabel>📞 Phone:</OrderCardLabel>
                                                        <OrderCardValue>{order.phone || order.customerPhone || '—'}</OrderCardValue>
                                                    </OrderCardRow>

                                                    <OrderCardRow>
                                                        <OrderCardLabel>📅 Date:</OrderCardLabel>
                                                        <OrderCardValue>{this.formatDate(order.orderDate || order.date, locale)}</OrderCardValue>
                                                    </OrderCardRow>

                                                    <OrderCardRow>
                                                        <OrderCardLabel>💰 Amount:</OrderCardLabel>
                                                        <OrderCardValue className="amount">₹{Number(order.totalAmount ?? order.grandTotal ?? 0).toFixed(2)}</OrderCardValue>
                                                    </OrderCardRow>

                                                    <OrderCardRow>
                                                        <OrderCardLabel>📊 Status:</OrderCardLabel>
                                                        <OrderStatusBadge $status={order.status}>
                                                            {langCtx.getText(statusKey(order.status))}
                                                        </OrderStatusBadge>
                                                    </OrderCardRow>

                                                    <OrderCardFooter>
                                                        <OrderCardButton onClick={() => this.openModal(order)}>
                                                            👁️ View Details
                                                        </OrderCardButton>
                                                    </OrderCardFooter>
                                                </OrderCard>
                                            ))}
                                        </div>
                                    </MobileOrdersWrapper>
                                </>
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
                                                        🔒 {langCtx.getText('orderFinalized')}
                                                    </span>
                                                )}
                                            </h3>
                                            <div className="d-flex align-items-center gap-2">
                                                <ActionButton
                                                    className="btn-payment"
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
                                                            <span className="value">{selectedOrder.phone || selectedOrder.customerPhone || '—'}</span>
                                                        </DetailRow>
                                                        {/* PART 5: Place field */}
                                                        <DetailRow>
                                                            <span className="label">🏘️ {langCtx.getText('place')}</span>
                                                            <span className="value">{selectedOrder.place || '—'}</span>
                                                        </DetailRow>
                                                        <DetailRow>
                                                            <span className="label">📍 {langCtx.getText('addressLabel')}</span>
                                                            <span className="value">{selectedOrder.address || '—'}</span>
                                                        </DetailRow>
                                                    </div>
                                                    <div className="col-12 col-sm-6">
                                                        <DetailRow>
                                                            <span className="label">📅 {langCtx.getText('orderDate')}</span>
                                                            <span className="value">{this.formatDate(selectedOrder.orderDate || selectedOrder.date, locale)}</span>
                                                        </DetailRow>
                                                        <DetailRow>
                                                            <span className="label">📊 {langCtx.getText('orderStatus')}</span>
                                                            <span>
                                                                <Badge className={this.getStatusBadgeClass(selectedOrder.status)}>
                                                                    {this.getStatusIcon(selectedOrder.status)} {langCtx.getText(statusKey(selectedOrder.status))}
                                                                </Badge>
                                                            </span>
                                                        </DetailRow>
                                                        {/* PART 4 + 6: Payment Status */}
                                                        <DetailRow>
                                                            <span className="label">💳 {langCtx.getText('paymentStatus')}</span>
                                                            <span>
                                                                <Badge className={this.getPaymentBadgeClass(selectedOrder.paymentStatus)}>
                                                                    {this.getPaymentIcon(selectedOrder.paymentStatus)}{' '}
                                                                    {getPaymentStatusText(selectedOrder.paymentStatus)}
                                                                </Badge>
                                                            </span>
                                                        </DetailRow>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* ── NEW: Add Product to Order (Accepted Only) ── */}
                                            {isAcceptedEditable && (
                                                <div
                                                    style={{
                                                        background: '#f8f9fa',
                                                        borderRadius: '8px',
                                                        padding: '0.9rem 1rem',
                                                        marginBottom: '1rem',
                                                        border: '1px solid #e9ecef',
                                                    }}
                                                >
                                                    <SectionTitle>➕ {langCtx.getText('addProductToOrder')}</SectionTitle>
                                                    <div className="row g-2 align-items-end">
                                                        <div className="col-12 col-md-7">
                                                            <label className="form-label small fw-semibold mb-1">
                                                                {langCtx.getText('product')}
                                                            </label>
                                                            <select
                                                                className="form-select"
                                                                value={addProductId}
                                                                onChange={this.onChangeAddProductId}
                                                                disabled={actionLoading || productsLoading}
                                                            >
                                                                <option value="">{langCtx.getText('selectProduct')}</option>
                                                                {Array.isArray(products) && products.map((p) => (
                                                                    <option key={p.id} value={p.id}>
                                                                        {p.name} — ₹{p.price}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                        <div className="col-6 col-md-3">
                                                            <label className="form-label small fw-semibold mb-1">
                                                                {langCtx.getText('quantity')}
                                                            </label>
                                                            <input
                                                                type="text"
                                                                inputMode="numeric"
                                                                pattern="[0-9]*"
                                                                className={`form-control ${this.state.addProductQtyError ? 'is-invalid' : ''}`}
                                                                value={addProductQty}
                                                                onChange={this.onChangeAddProductQty}
                                                                disabled={actionLoading}
                                                            />
                                                            {this.state.addProductQtyError && (
                                                                <div className="invalid-feedback">{this.state.addProductQtyError}</div>
                                                            )}
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
                                                    <small
                                                        className="text-muted d-block mt-2"
                                                        style={{ fontSize: '0.78rem' }}
                                                    >
                                                        {langCtx.getText('addedItemsSelectedByDefault')}
                                                    </small>
                                                </div>
                                            )}

                                            {/* ── PART 1 & 2: Ordered Items with Checkboxes + Qty Edit ── */}
                                            <SectionTitle>📦 {langCtx.getText('orderedItems')}</SectionTitle>

                                            <small
                                                className="text-muted d-block mb-2"
                                                style={{ fontSize: '0.78rem' }}
                                            >
                                                ℹ️ {isAcceptedEditable ? langCtx.getText('editQtyNote') : langCtx.getText('editAfterAcceptOnly')}
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
                                                    🔒 <span>{langCtx.getText('orderFinalizedReadOnly')}</span>
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

                                                            {isAcceptedEditable && (
                                                                <th
                                                                    className="text-center"
                                                                    style={{ width: '72px', padding: '0.55rem 0.5rem' }}
                                                                >
                                                                    {langCtx.getText('remove')}
                                                                </th>
                                                            )}
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {modalItems.map((item) => {
                                                            const checked = selectedProducts.includes(item.productId);

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
                                                                        {item.name || item.productName || '—'}
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
                                                                                disabled={isLocked || (Number(item.quantity || 0) || 0) <= 0}
                                                                                title={isLocked ? langCtx.getText('orderLocked') : langCtx.getText('decreaseQuantity')}
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
                                                                                title={isLocked ? langCtx.getText('orderLocked') : langCtx.getText('increaseQuantity')}
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
                                                                        ₹{Number(item.price || 0).toFixed(2)}
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
                                                                        ₹{Number(item.total || 0).toFixed(2)}
                                                                    </td>

                                                                    {isAcceptedEditable && (
                                                                        <td
                                                                            className="text-center"
                                                                            style={{ padding: '0.55rem 0.5rem' }}
                                                                        >
                                                                            <button
                                                                                type="button"
                                                                                className="btn btn-outline-danger btn-sm"
                                                                                onClick={() => this.removeItemFromOrder(item.productId)}
                                                                                disabled={actionLoading}
                                                                                title={langCtx.getText('remove')}
                                                                                style={{ lineHeight: 1, fontWeight: 800 }}
                                                                            >
                                                                                ❌
                                                                            </button>
                                                                        </td>
                                                                    )}
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>

                                            {/* PART 1: Checked Total — dynamic, updates with checkboxes + qty */}
                                            <TotalBar>
                                                <span className="total-label">
                                                    {selectedProducts.length > 0
                                                        ? `✓ ${langCtx.getText('selectedTotal')} (${selectedProducts.length})`
                                                        : langCtx.getText('selectItemsToCalculateTotal')}
                                                </span>
                                                <span className="total-value">
                                                    ₹{Number(checkedTotal || 0).toFixed(2)}
                                                </span>
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
                                                                const label = delta >= 0 ? 'Amount Paid Added' : 'Amount Paid Reduced';
                                                                const amount = Math.abs(delta);
                                                                const when = this.formatDate(h?.createdAt, locale);
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
                                                                            <div className="fw-semibold" style={{ fontSize: '0.92rem' }}>
                                                                                {label}: ₹{amount.toFixed(2)}
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
                                                            {getPaymentStatusText(selectedOrder.paymentStatus)}
                                                        </Badge>
                                                    </div>
                                                    {!isPaymentPaid && (
                                                        <ActionButton
                                                            className="btn-payment"
                                                            onClick={() =>
                                                                this.handleApprovePayment(selectedOrder.id)
                                                            }
                                                            disabled={actionLoading || isRejected || !isVerified || !isRemainingSettled}
                                                            title={
                                                                !isVerified
                                                                    ? langCtx.getText('verifyOrderFirst')
                                                                    : (!isRemainingSettled
                                                                        ? langCtx.getText('remainingMustBeZeroToMarkPaid')
                                                                        : langCtx.getText('markAsPaid'))
                                                            }
                                                        >
                                                            {actionLoading ? (
                                                                <>
                                                                    <span className="spinner-border spinner-border-sm" />
                                                                    {langCtx.getText('processing')}
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
                                                        isVerified || isPaymentPaid || isDelivered || isRejected || actionLoading || !isAcceptedEditable
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
                                                {isPendingAcceptance && !isRejected && (
                                                    <ActionButton
                                                        className="btn-accept"
                                                        onClick={() => this.handleAcceptOrder(selectedOrder.id)}
                                                        disabled={actionLoading}
                                                    >
                                                        👍 {langCtx.getText('acceptOrder')}
                                                    </ActionButton>
                                                )}

                                                {/* Reject (Pending Acceptance or Accepted) */}
                                                {(['Pending Acceptance', 'Pending', 'Accepted'].includes(String(selectedOrder?.status || ''))) && !isRejected && (
                                                    <button
                                                        type="button"
                                                        className="btn btn-outline-danger btn-sm"
                                                        onClick={() => this.handleReject(selectedOrder.id)}
                                                        disabled={actionLoading}
                                                        style={{ fontSize: '0.82rem', fontWeight: '600' }}
                                                    >
                                                        ❌ {langCtx.getText('rejectOrder')}
                                                    </button>
                                                )}

                                                {/* PART 6: Delivered Button — only after verification */}
                                                <ActionButton
                                                    className="btn-deliver"
                                                    onClick={() => this.handleDeliver(selectedOrder.id)}
                                                    disabled={
                                                        actionLoading ||
                                                        isDelivered ||
                                                        !isVerified ||
                                                        isRejected
                                                    }
                                                    title={
                                                        !isVerified
                                                            ? langCtx.getText('verifyOrderFirst')
                                                            : isDelivered
                                                            ? langCtx.getText('alreadyDelivered')
                                                            : langCtx.getText('markAsDelivered')
                                                    }
                                                >
                                                    {actionLoading ? (
                                                        <>
                                                            <span className="spinner-border spinner-border-sm" />
                                                            {langCtx.getText('processing')}
                                                        </>
                                                    ) : (
                                                        <>📦 {langCtx.getText('markDeliveredAction')}</>
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
