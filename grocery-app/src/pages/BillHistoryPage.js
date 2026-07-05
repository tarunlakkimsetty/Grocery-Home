import React from 'react';
import { Navigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import LanguageContext from '../context/LanguageContext';
import orderService from '../services/orderService';
import listOrderService from '../services/listOrderService';
import Spinner from '../components/Spinner';
import { toast } from 'react-toastify';
import { PageHeader } from '../styledComponents/LayoutStyles';
import OrderImagesModal from '../components/OrderImagesModal';
import { printCustomerOrderBill } from '../utils/printBill';
import BillActionButton from '../components/BillActionButton';
import {
    TableWrapper,
    PaginationWrapper,
    EmptyState,
    Badge,
    ModalOverlay,
    ModalContent,
    MobileHistoryWrapper,
    DesktopHistoryWrapper,
    HistoryCard,
    HistoryCardHeader,
    HistoryCardTitle,
    HistoryCardRow,
    HistoryCardLabel,
    HistoryCardValue,
    HistoryCardFooter,
    HistoryCardButton,
    HistoryStatusBadge,
} from '../styledComponents/FormStyles';
import { t, statusKey } from '../utils/i18n';

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

const ITEMS_PER_PAGE = 10;

class BillHistoryPage extends React.Component {
    static contextType = AuthContext;

    constructor(props) {
        super(props);
        this.state = {
            bills: [],
            orders: [],
            offlineOrders: [],
            listOrders: [],
            activeOnlineOrders: [],
            activeOfflineOrders: [],
            activeListOrders: [],
            finalizedOnlineOrders: [],
            finalizedOfflineOrders: [],
            finalizedListOrders: [],
            activeUploadedListOrders: [],
            activeInProgressListOrders: [],
            billsOrders: [],
            loading: true,
            error: null,
            currentPage: 1,
            redirectTo: null,
            activeTab: 'bills',
            listOrdersSubTab: 'uploadedLists',
            offlineOrdersLoaded: false,
            listOrdersLoaded: false,
            // Customer Order Details Modal
            orderModalOpen: false,
            selectedOrder: null,
            orderModalLoading: false,
            imagesModalOpen: false,
            imagesModalEntityType: 'order',
            imagesModalEntityId: null,
            imagesModalTitle: '',
            printLoadingByOrder: {},
        };
        // ✅ Polling interval for converted list order status sync (not in state)
        this.pollingIntervalId = null;
    }

    componentDidMount() {
        this.fetchData();
        // ✅ Start polling for converted order status updates (every 5 seconds)
        this.startPollingForConvertedOrders();
    }

    componentWillUnmount() {
        // ✅ Clean up polling interval when component unmounts
        if (this.pollingIntervalId) {
            clearInterval(this.pollingIntervalId);
            this.pollingIntervalId = null;
        }
    }

    // ✅ NEW: Start polling to refresh converted list order statuses every N seconds
    startPollingForConvertedOrders = () => {
        // Poll every 5 seconds (adjust as needed)
        const POLL_INTERVAL = 5000;
        
        this.pollingIntervalId = setInterval(() => {
            this.refreshConvertedOrderStatuses();
        }, POLL_INTERVAL);
    };

    // ✅ NEW: Refresh only the converted list order statuses from backend
    refreshConvertedOrderStatuses = async () => {
        try {
            // Only refresh if on List Orders tab and listOrders are loaded
            if (this.state.activeTab !== 'listOrders' || !this.state.listOrdersLoaded) {
                return;
            }

            // Fetch the latest list orders (which will include current converted order status)
            const resp = await listOrderService.getCustomerUploads();
            let listOrders = [];
            if (resp && resp.data) {
                listOrders = Array.isArray(resp.data) ? resp.data : [resp.data];
            } else if (Array.isArray(resp)) {
                listOrders = resp;
            }

            this.processPurchaseHistoryData({
                orders: this.state.orders,
                offlineOrders: this.state.offlineOrders,
                listOrders,
                selectedOrder: this.state.selectedOrder,
            });
        } catch (err) {
            // Silent fail - don't show errors for background polling
            console.debug('Silent polling refresh skipped');
        }
    };

    processPurchaseHistoryData = ({ orders = [], offlineOrders = [], listOrders = [], selectedOrder = null } = {}) => {
        const safeOnlineOrders = Array.isArray(orders) ? orders : [];
        const safeOfflineOrders = Array.isArray(offlineOrders) ? offlineOrders : [];
        const safeListOrders = Array.isArray(listOrders) ? listOrders : [];

        const activeOnlineOrders = safeOnlineOrders.filter((order) => this.getPurchaseHistoryCategory(order) === 'online' && this.isActiveHistoryOrder(order));
        const activeOfflineOrders = safeOfflineOrders.filter((order) => this.getPurchaseHistoryCategory(order) === 'offline' && this.isActiveHistoryOrder(order));
        const activeListOrders = safeListOrders.filter((order) => this.getPurchaseHistoryCategory(order) === 'list' && this.isActiveHistoryOrder(order));

        const finalizedOnlineOrders = safeOnlineOrders.filter((order) => this.getPurchaseHistoryCategory(order) === 'online' && this.isFinalizedHistoryOrder(order));
        const finalizedOfflineOrders = safeOfflineOrders.filter((order) => this.getPurchaseHistoryCategory(order) === 'offline' && this.isFinalizedHistoryOrder(order));
        const finalizedListOrders = safeListOrders.filter((order) => this.getPurchaseHistoryCategory(order) === 'list' && this.isFinalizedHistoryOrder(order));

        const activeUploadedListOrders = activeListOrders.filter((order) => !order.isConverted);
        const activeInProgressListOrders = activeListOrders.filter((order) => order.isConverted);
        const billsOrders = [...finalizedOnlineOrders, ...finalizedOfflineOrders, ...finalizedListOrders];

        this.setState((prevState) => {
            let nextSelectedOrder = selectedOrder || prevState.selectedOrder;
            if (nextSelectedOrder && Array.isArray(safeListOrders)) {
                const latestOrder = safeListOrders.find((item) => item.id === nextSelectedOrder.id || (item.listOrderId && item.listOrderId === nextSelectedOrder.listOrderId));
                if (latestOrder) {
                    nextSelectedOrder = latestOrder;
                }
            }

            return {
                bills: billsOrders,
                billsOrders,
                orders: safeOnlineOrders,
                offlineOrders: safeOfflineOrders,
                listOrders: safeListOrders,
                activeOnlineOrders,
                activeOfflineOrders,
                activeListOrders,
                finalizedOnlineOrders,
                finalizedOfflineOrders,
                finalizedListOrders,
                activeUploadedListOrders,
                activeInProgressListOrders,
                selectedOrder: nextSelectedOrder,
                offlineOrdersLoaded: true,
                listOrdersLoaded: true,
                loading: false,
                error: null,
            };
        });
    };

    fetchData = async () => {
        this.setState({ loading: true, error: null });
        try {
            const { user } = this.context;
            const userId = user ? user.id : 2;

            const [ordersResult, offlineResult, listOrdersResult] = await Promise.allSettled([
                orderService.getCustomerOrders(userId, 'all'),
                orderService.getUserOfflineOrders('all'),
                listOrderService.getCustomerUploads('all'),
            ]);

            if (ordersResult.status === 'rejected' || offlineResult.status === 'rejected') {
                throw (ordersResult.status === 'rejected' ? ordersResult.reason : offlineResult.reason);
            }

            const activeOrders = Array.isArray(ordersResult.value)
                ? ordersResult.value
                : (ordersResult.value?.data || ordersResult.value?.orders || []);
            const activeOfflineOrders = Array.isArray(offlineResult.value)
                ? offlineResult.value
                : (offlineResult.value?.data || offlineResult.value?.orders || []);
            const allListOrders = Array.isArray(listOrdersResult.value)
                ? listOrdersResult.value
                : (listOrdersResult.value?.data || listOrdersResult.value?.orders || []);

            this.processPurchaseHistoryData({
                orders: activeOrders,
                offlineOrders: activeOfflineOrders,
                listOrders: allListOrders,
            });

            console.debug('[BillHistoryPage.fetchData] customer history loaded', {
                userId,
                onlineCount: activeOrders.length,
                offlineCount: activeOfflineOrders.length,
                listCount: allListOrders.length,
            });
        } catch (err) {
            this.setState({ error: t('failedToLoadHistory'), loading: false });
            toast.error(t('failedToLoadHistory'));
        }
    };

    fetchOfflineOrders = async () => {
        try {
            const resp = await orderService.getUserOfflineOrders('all');
            const offlineOrders = Array.isArray(resp)
                ? resp
                : (resp?.data || resp?.orders || []);
            this.setState({
                offlineOrders: offlineOrders.filter((order) => this.getPurchaseHistoryCategory(order) === 'offline'),
                offlineOrdersLoaded: true,
            });
        } catch (err) {
            this.setState({ offlineOrders: [], offlineOrdersLoaded: true });
        }
    };

    setActiveTab = (tab) => {
        this.setState({ activeTab: tab, currentPage: 1, listOrdersSubTab: tab === 'listOrders' ? this.state.listOrdersSubTab : 'uploadedLists' }, () => {
            if (tab === 'offlineOrders' && !this.state.offlineOrdersLoaded) {
                this.fetchOfflineOrders();
            }
            if (tab === 'listOrders' && !this.state.listOrdersLoaded) {
                this.fetchListOrders();
            }
        });
    };

    setListOrdersSubTab = (subTab) => {
        if (this.state.listOrdersSubTab === subTab) return;
        this.setState({ listOrdersSubTab: subTab, currentPage: 1 });
    };

    fetchListOrders = async () => {
        try {
            const resp = await listOrderService.getCustomerUploads('all');
            // Handle both nested and direct array responses
            let listOrders = [];
            if (resp?.data) {
                listOrders = Array.isArray(resp.data) ? resp.data : [resp.data];
            } else if (Array.isArray(resp)) {
                listOrders = resp;
            } else if (resp?.success && resp?.data) {
                listOrders = Array.isArray(resp.data) ? resp.data : [];
            }
            
            this.processPurchaseHistoryData({
                orders: this.state.orders,
                offlineOrders: this.state.offlineOrders,
                listOrders,
                selectedOrder: this.state.selectedOrder,
            });
        } catch (err) {
            console.error('Failed to fetch list orders:', err);
            this.setState({ listOrders: [], listOrdersLoaded: true });
        }
    };

    openOrderModal = async (order) => {
        if (this.isRestrictedBillsOrder(order)) {
            return;
        }

        const category = this.getPurchaseHistoryCategory(order);
        if (category === 'online' || category === 'offline') {
            this.setState({ orderModalOpen: true, selectedOrder: order, orderModalLoading: true });
            try {
                const detailed = await orderService.getOrderById(order.id);
                this.setState({
                    selectedOrder: detailed?.order || detailed?.data || detailed,
                    orderModalLoading: false,
                });
            } catch (err) {
                this.setState({ orderModalLoading: false });
            }
            return;
        }

        this.setState({ orderModalOpen: true, selectedOrder: order, orderModalLoading: false });
        // ✅ NOTE: For converted list orders, data is already fetched and merged from getCustomerUploads()
        // It includes items, totals, and current status. Don't need to fetch fresh.
        // Polling will refresh it every 5 seconds anyway.
    };

    closeOrderModal = () => {
        this.setState({ orderModalOpen: false, selectedOrder: null, orderModalLoading: false });
    };

    openImagesModal = ({ entityType, entityId, title }) => {
        if (!entityType || !entityId) return;
        this.setState({
            imagesModalOpen: true,
            imagesModalEntityType: entityType,
            imagesModalEntityId: entityId,
            imagesModalTitle: title || `Images - #${entityId}`,
        });
    };

    getDisplayOrderId = (order) => {
        return order?.orderId ?? order?.serialNumber ?? order?.id ?? order?.listOrderId ?? '';
    };

    canPrintBill = (order) => {
        const status = this.normalizePurchaseHistoryStatus(order?.status);
        return status === 'completed' || status === 'rejected' || status === 'delivered' || status === 'finalized';
    };

    handlePrintBill = async (order) => {
        const orderId = order?.id ?? order;
        if (!orderId) return;

        this.setState((prev) => ({
            printLoadingByOrder: {
                ...prev.printLoadingByOrder,
                [orderId]: true,
            },
        }));

        try {
            await printCustomerOrderBill(order);
        } catch (err) {
            let message = err?.response?.data?.errorKey || err?.response?.data?.message || err?.message || 'Failed to open printable bill';
            if (err?.response?.status === 403) {
                message = 'Unauthorized to print this order';
            } else if (err?.response?.status === 404) {
                message = 'Order not found';
            }
            toast.error(String(message));
        } finally {
            this.setState((prev) => ({
                printLoadingByOrder: {
                    ...prev.printLoadingByOrder,
                    [orderId]: false,
                },
            }));
        }
    };

    closeImagesModal = () => {
        this.setState({
            imagesModalOpen: false,
            imagesModalEntityType: 'order',
            imagesModalEntityId: null,
            imagesModalTitle: '',
        });
    };

    formatDate = (dateStr) => {
        if (!dateStr) return '-';

        // MySQL often returns DATETIME like "2026-03-02 10:30:00" which can be
        // inconsistently parsed across browsers unless we convert to ISO-ish.
        const raw = String(dateStr);
        const normalized = raw.includes('T') ? raw : raw.replace(' ', 'T');

        const d = new Date(normalized);
        if (Number.isNaN(d.getTime())) return '-';

        return d.toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    getPaymentBadge = (method) => {
        const map = { Cash: 'badge-success', Card: 'badge-info', UPI: 'badge-warning' };
        return map[method] || 'badge-info';
    };

    getDisplayOrderType = (order) => {
        const raw = String(order?.type || order?.orderType || order?.origin || '').trim();
        const normalized = raw.toLowerCase();

        if (order?.isConverted || order?.listOrderId || normalized === 'list_converted' || normalized === 'list orders' || normalized === 'list_orders') {
            return 'List Order';
        }

        if (!raw) return '-';
        return raw;
    };

    getOrderDetailsIcon = (order) => {
        const category = this.getPurchaseHistoryCategory(order);
        if (category === 'list') return '📋';
        if (category === 'offline') return '🧾';
        return '🛵';
    };

    getPurchaseHistoryCategory = (order) => {
        const orderType = String(order?.orderType || '').trim().toLowerCase();
        const type = String(order?.type || '').trim().toLowerCase();
        const origin = String(order?.origin || '').trim().toLowerCase();

        if (order?.isConverted || order?.listOrderId || type === 'list_converted' || origin === 'list_orders') {
            return 'list';
        }

        if (orderType === 'online') {
            return 'online';
        }

        if (orderType === 'offline') {
            return 'offline';
        }

        return 'unknown';
    };

    normalizePurchaseHistoryStatus = (status) => {
        return String(status || '').trim().toLowerCase().replace(/[\s-]+/g, '_');
    };

    getUnifiedOrderStatus = (order) => {
        const status = order?.status
            || order?.order_status
            || order?.verification_status
            || order?.list_status
            || order?.current_status
            || 'PENDING';

        return String(status).trim();
    };

    isFinalizedHistoryOrder = (order) => {
        const status = this.normalizePurchaseHistoryStatus(order?.status);
        return status === 'completed' || status === 'rejected';
    };

    isActiveHistoryOrder = (order) => {
        const status = this.normalizePurchaseHistoryStatus(order?.status);
        const activeStatuses = ['pending', 'pending_acceptance', 'in_progress', 'accepted', 'processing', 'verified', 'converted'];
        return activeStatuses.includes(status);
    };

    isRejectedHistoryOrder = (order) => {
        const status = this.normalizePurchaseHistoryStatus(order?.status);
        return status === 'rejected';
    };

    isRestrictedBillsOrder = (order) => {
        return false;
    };

    getBillsTabDisplayAmount = (order, amount) => {
        const numericAmount = Number(amount);
        return Number.isFinite(numericAmount) ? numericAmount : 0;
    };

    getListOrderViewBuckets = (listOrders = []) => {
        const safeListOrders = Array.isArray(listOrders) ? listOrders : [];
        const activeListOrders = safeListOrders.filter((order) => this.getPurchaseHistoryCategory(order) === 'list' && this.isActiveHistoryOrder(order));
        const finalizedListOrders = safeListOrders.filter((order) => this.getPurchaseHistoryCategory(order) === 'list' && this.isFinalizedHistoryOrder(order));

        return {
            allListOrders: safeListOrders,
            activeListOrders,
            finalizedListOrders,
            activeUploadedListOrders: activeListOrders.filter((order) => !order.isConverted),
            activeInProgressListOrders: activeListOrders.filter((order) => order.isConverted),
        };
    };

    getStrictPurchaseHistoryLists = (orders = [], offlineOrders = [], listOrders = []) => {
        const safeOrders = Array.isArray(orders) ? orders : [];
        const safeOfflineOrders = Array.isArray(offlineOrders) ? offlineOrders : [];
        const safeListOrders = Array.isArray(listOrders) ? listOrders : [];

        return {
            onlineOrders: safeOrders.filter((order) => this.getPurchaseHistoryCategory(order) === 'online' && this.isActiveHistoryOrder(order)),
            strictOfflineOrders: safeOfflineOrders.filter((order) => this.getPurchaseHistoryCategory(order) === 'offline' && this.isActiveHistoryOrder(order)),
            strictListOrders: safeListOrders.filter((order) => {
                const status = this.normalizePurchaseHistoryStatus(order?.status);
                return this.getPurchaseHistoryCategory(order) === 'list' && !this.isFinalizedHistoryOrder(order) && status !== 'delivered';
            }),
        };
    };

    getStatusBadge = (status) => {
        const normalized = String(status || '').trim().toLowerCase().replace(/[\s-]+/g, '_');
        const map = {
            'pending_acceptance': 'badge-warning',
            'accepted': 'badge-info',
            'pending': 'badge-warning',
            'in_progress': 'badge-info',
            'processing': 'badge-primary',
            'verified': 'badge-info',
            'paid': 'badge-primary',
            'delivered': 'badge-success',
            'completed': 'badge-success',
            'rejected': 'badge-danger',
        };
        return map[normalized] || 'badge-warning';
    };

    getOrderTotal = (order) => {
        const direct = Number(order?.totalAmount ?? order?.grandTotal ?? 0);
        if (Number.isFinite(direct)) return direct;
        const items = Array.isArray(order?.items) ? order.items : [];
        return items.reduce((sum, item) => {
            const itemTotal = Number(item?.total ?? (Number(item?.price ?? 0) * Number(item?.quantity ?? 0)) ?? 0);
            return sum + (Number.isFinite(itemTotal) ? itemTotal : 0);
        }, 0);
    };

    getAmountPaid = (order) => {
        const val = Number(order?.amountPaid ?? order?.paidAmount ?? order?.advanceAmount ?? 0);
        return Number.isFinite(val) ? val : 0;
    };

    getAdvanceAmount = (order) => {
        return this.getAmountPaid(order);
    };

    getRemainingBalance = (order) => {
        const remaining = Number(order?.remainingBalance);
        if (Number.isFinite(remaining)) return remaining;
        return this.getOrderTotal(order) - this.getAmountPaid(order);
    };

    render() {
        if (this.state.redirectTo) {
            return <Navigate to={this.state.redirectTo} />;
        }

        const {
            billsOrders,
            activeOnlineOrders,
            activeOfflineOrders,
            activeListOrders,
            activeUploadedListOrders,
            activeInProgressListOrders,
            loading,
            error,
            currentPage,
            activeTab,
            offlineOrdersLoaded,
            listOrdersLoaded,
            orderModalOpen,
            selectedOrder,
            orderModalLoading,
        } = this.state;

        const safeBills = Array.isArray(billsOrders) ? billsOrders : [];
        const strictOnlineOrders = Array.isArray(activeOnlineOrders) ? activeOnlineOrders : [];
        const strictOfflineOrders = Array.isArray(activeOfflineOrders) ? activeOfflineOrders : [];
        const safeUploadedLists = Array.isArray(activeUploadedListOrders) ? activeUploadedListOrders : [];
        const safeInProgressOrders = Array.isArray(activeInProgressListOrders) ? activeInProgressListOrders : [];
        const mergedFinalizedBills = safeBills;
        const uploadedCounts = {
            uploadedLists: safeUploadedLists.length,
            inProgressOrders: safeInProgressOrders.length,
        };
        const activeList = activeTab === 'bills'
            ? mergedFinalizedBills
            : (activeTab === 'offlineOrders' ? strictOfflineOrders : (activeTab === 'listOrders' ? (this.state.listOrdersSubTab === 'inProgressOrders' ? safeInProgressOrders : safeUploadedLists) : strictOnlineOrders));
        const totalPages = Math.ceil((activeList && activeList.length) ? activeList.length / ITEMS_PER_PAGE : 0);
        const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
        const visibleItems = (activeList && Array.isArray(activeList)) ? activeList.slice(startIdx, startIdx + ITEMS_PER_PAGE) : [];
        const showListOrderTypeColumn = activeTab === 'listOrders' && this.state.listOrdersSubTab === 'inProgressOrders';
        const isSelectedOrderRestricted = selectedOrder ? this.isRestrictedBillsOrder(selectedOrder) : false;

        return (
            <LanguageContext.Consumer>
                {(langCtx) => (
                    <div>
                        <PageHeader>
                            <h1>📋 {langCtx.getText('purchaseHistory')}</h1>
                            <p>{mergedFinalizedBills.length + strictOnlineOrders.length + strictOfflineOrders.length + (Array.isArray(activeListOrders) ? activeListOrders.length : 0)} {langCtx.getText('items')} total transactions</p>
                        </PageHeader>

                        {loading && <Spinner fullPage text={langCtx.getText('loadingHistory')} />}
                        {error && <div className="alert alert-danger">{error}</div>}

                        {!loading && !error && (
                            <>
                                <style>{`
                                    .customer-history-table thead th:nth-child(9),
                                    .customer-history-table tbody td:nth-child(9) {
                                        display: table-cell !important;
                                    }
                                `}</style>

                                {/* Tabs */}
                                <ul className="nav nav-tabs mb-3">
                                    <li className="nav-item">
                                        <button
                                            className={'nav-link' + (activeTab === 'bills' ? ' active fw-bold' : '')}
                                            onClick={() => this.setActiveTab('bills')}
                                        >
                                            🧾 {langCtx.getText('bills')} ({mergedFinalizedBills.length})
                                        </button>
                                    </li>
                                    <li className="nav-item">
                                        <button
                                            className={'nav-link' + (activeTab === 'orders' ? ' active fw-bold' : '')}
                                            onClick={() => this.setActiveTab('orders')}
                                        >
                                            🛵 {langCtx.getText('onlineOrders')} ({strictOnlineOrders.length})
                                        </button>
                                    </li>
                                    <li className="nav-item">
                                        <button
                                            className={'nav-link' + (activeTab === 'offlineOrders' ? ' active fw-bold' : '')}
                                            onClick={() => this.setActiveTab('offlineOrders')}
                                        >
                                            🧾 {langCtx.getText('offlineOrders')} ({strictOfflineOrders.length})
                                        </button>
                                    </li>
                                    <li className="nav-item">
                                        <button
                                            className={'nav-link' + (activeTab === 'listOrders' ? ' active fw-bold' : '')}
                                            onClick={() => this.setActiveTab('listOrders')}
                                        >
                                            📋 List Orders ({Array.isArray(activeListOrders) ? activeListOrders.length : 0})
                                        </button>
                                    </li>
                                </ul>

                                {activeTab === 'listOrders' && (
                                    <ul className="nav nav-pills mb-3">
                                        <li className="nav-item">
                                            <button
                                                className={'nav-link' + (this.state.listOrdersSubTab === 'uploadedLists' ? ' active fw-bold' : '')}
                                                onClick={() => this.setListOrdersSubTab('uploadedLists')}
                                            >
                                                📋 Uploaded Lists ({uploadedCounts.uploadedLists})
                                            </button>
                                        </li>
                                        <li className="nav-item">
                                            <button
                                                className={'nav-link' + (this.state.listOrdersSubTab === 'inProgressOrders' ? ' active fw-bold' : '')}
                                                onClick={() => this.setListOrdersSubTab('inProgressOrders')}
                                            >
                                                ✅ In Progress Orders ({uploadedCounts.inProgressOrders})
                                            </button>
                                        </li>
                                    </ul>
                                )}

                                {/* Bills Tab */}
                                {activeTab === 'bills' && mergedFinalizedBills.length === 0 && (
                                    <EmptyState>
                                        <div className="empty-icon">🧾</div>
                                        <h3>{langCtx.getText('noBills')}</h3>
                                        <p>{langCtx.getText('noBillsMessage')}</p>
                                    </EmptyState>
                                )}

                                {/* Desktop Bills Table */}
                                {activeTab === 'bills' && mergedFinalizedBills.length > 0 && (
                                    <DesktopHistoryWrapper>
                                        <TableWrapper className="customer-history-table">
                                            <table className="table table-hover">
                                                <thead>
                                                    <tr>
                                                        <th>{langCtx.getText('orderId')}</th>
                                                        <th>{langCtx.getText('orderDate')}</th>
                                                        <th>{langCtx.getText('items')}</th>
                                                        <th>ORDER TYPE</th>
                                                        <th>{langCtx.getText('orderStatus')}</th>
                                                        <th className="text-end">{langCtx.getText('total')}</th>
                                                        <th className="text-end">{langCtx.getText('advance')}</th>
                                                        <th className="text-end">{langCtx.getText('remaining')}</th>
                                                        <th className="text-center">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {visibleItems.map((order) => {
                                                        const isRejectedBill = this.isRestrictedBillsOrder(order);
                                                        const displayTotal = this.getBillsTabDisplayAmount(order, this.getOrderTotal(order));
                                                        const displayPaid = this.getBillsTabDisplayAmount(order, this.getAmountPaid(order));
                                                        const displayRemaining = this.getBillsTabDisplayAmount(order, this.getRemainingBalance(order));

                                                        return (
                                                            <tr
                                                                key={order.id}
                                                                onClick={isRejectedBill ? undefined : () => this.openOrderModal(order)}
                                                                style={{ cursor: isRejectedBill ? 'not-allowed' : 'pointer', opacity: isRejectedBill ? 0.72 : 1 }}
                                                            >
                                                                <td className="fw-bold">#{order.id}</td>
                                                                <td>
                                                                    {this.formatDate(
                                                                        order.createdAt ||
                                                                            order.orderDate ||
                                                                            order.updatedAt ||
                                                                            order.date
                                                                    )}
                                                                </td>
                                                                <td>{(order.items ? order.items.length : 0)} {langCtx.getText('items')}</td>
                                                                <td>
                                                                    <Badge className="badge-info">
                                                                        {this.getDisplayOrderType(order)}
                                                                    </Badge>
                                                                </td>
                                                                <td>
                                                                    <Badge className={this.getStatusBadge(order.status)}>
                                                                        {order.status === 'Pending Acceptance' && '🕒 '}
                                                                        {order.status === 'Accepted' && '👍 '}
                                                                        {order.status === 'Pending' && '⏳ '}
                                                                        {order.status === 'Verified' && '✅ '}
                                                                        {order.status === 'Paid' && '💰 '}
                                                                        {order.status === 'Delivered' && '📦 '}
                                                                        {order.status === 'Rejected' && '❌ '}
                                                                        {langCtx.getText(statusKey(order.status))}
                                                                    </Badge>
                                                                </td>
                                                                <td className="text-end fw-bold" style={{ color: '#2E7D32' }}>
                                                                    ₹{displayTotal.toFixed(2)}
                                                                </td>
                                                                <td className="text-end">
                                                                    ₹{displayPaid.toFixed(2)}
                                                                </td>
                                                                <td
                                                                    className="text-end fw-bold"
                                                                    style={{ color: displayRemaining < 0 ? '#c62828' : '#2E7D32' }}
                                                                >
                                                                    ₹{displayRemaining.toFixed(2)}
                                                                </td>
                                                                <td className="text-center">
                                                                    <div style={{ display: 'flex', justifyContent: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
                                                                        <button
                                                                            type="button"
                                                                            className="btn btn-outline-primary btn-sm"
                                                                            disabled={isRejectedBill}
                                                                            onClick={isRejectedBill ? undefined : (event) => {
                                                                                event.stopPropagation();
                                                                                this.openOrderModal(order);
                                                                            }}
                                                                            style={isRejectedBill ? { opacity: 0.45, cursor: 'not-allowed' } : undefined}
                                                                        >
                                                                            View
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            className="btn btn-outline-secondary btn-sm"
                                                                            onClick={(event) => {
                                                                                event.stopPropagation();
                                                                                this.openImagesModal({
                                                                                    entityType: 'order',
                                                                                    entityId: order.id,
                                                                                    title: `Order Images - #${order.id}`,
                                                                                });
                                                                            }}
                                                                        >
                                                                            View Images
                                                                        </button>
                                                                        {this.canPrintBill(order) && (
                                                                            <BillActionButton
                                                                                type="button"
                                                                                className="btn-primary-soft"
                                                                                onClick={isRejectedBill ? undefined : (event) => {
                                                                                    event.stopPropagation();
                                                                                    this.handlePrintBill(order);
                                                                                }}
                                                                                disabled={isRejectedBill || Boolean(this.state.printLoadingByOrder[order.id])}
                                                                            >
                                                                                🖨️ {Boolean(this.state.printLoadingByOrder[order.id]) ? 'Printing...' : 'Print Bill'}
                                                                            </BillActionButton>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                            {totalPages > 1 && this.renderPagination(langCtx, currentPage, totalPages)}
                                        </TableWrapper>
                                    </DesktopHistoryWrapper>
                                )}

                                {/* Mobile Bills Cards */}
                                {activeTab === 'bills' && mergedFinalizedBills.length > 0 && (
                                    <MobileHistoryWrapper>
                                        <div>
                                            {visibleItems.map((order) => {
                                                const isRejectedBill = this.isRestrictedBillsOrder(order);
                                                const displayTotal = this.getBillsTabDisplayAmount(order, this.getOrderTotal(order));
                                                const displayPaid = this.getBillsTabDisplayAmount(order, this.getAmountPaid(order));
                                                const displayRemaining = this.getBillsTabDisplayAmount(order, this.getRemainingBalance(order));

                                                return (
                                                    <HistoryCard
                                                        key={order.id}
                                                        onClick={isRejectedBill ? undefined : () => this.openOrderModal(order)}
                                                        style={{ cursor: isRejectedBill ? 'not-allowed' : 'pointer', opacity: isRejectedBill ? 0.82 : 1 }}
                                                    >
                                                        <HistoryCardHeader>
                                                            <HistoryCardTitle>
                                                                <div className="order-id">Order #{order.id}</div>
                                                                <div className="order-date">
                                                                    {this.formatDate(
                                                                        order.createdAt || order.orderDate || order.updatedAt || order.date
                                                                    )}
                                                                </div>
                                                            </HistoryCardTitle>
                                                        </HistoryCardHeader>

                                                        <HistoryCardRow>
                                                            <HistoryCardLabel>📦 {langCtx.getText('items')}:</HistoryCardLabel>
                                                            <HistoryCardValue>{order.items ? order.items.length : 0}</HistoryCardValue>
                                                        </HistoryCardRow>

                                                        <HistoryCardRow>
                                                            <HistoryCardLabel>🏷️ Order Type:</HistoryCardLabel>
                                                            <HistoryCardValue>{this.getDisplayOrderType(order)}</HistoryCardValue>
                                                        </HistoryCardRow>

                                                        <HistoryCardRow>
                                                            <HistoryCardLabel>📊 {langCtx.getText('orderStatus')}:</HistoryCardLabel>
                                                            <HistoryStatusBadge $status={order.status}>
                                                                {order.status === 'Pending Acceptance' && '🕒 '}
                                                                {order.status === 'Accepted' && '👍 '}
                                                                {order.status === 'Pending' && '⏳ '}
                                                                {order.status === 'Verified' && '✅ '}
                                                                {order.status === 'Paid' && '💰 '}
                                                                {order.status === 'Delivered' && '📦 '}
                                                                {order.status === 'Rejected' && '❌ '}
                                                                {langCtx.getText(statusKey(order.status))}
                                                            </HistoryStatusBadge>
                                                        </HistoryCardRow>

                                                        <HistoryCardRow>
                                                            <HistoryCardLabel>💰 {langCtx.getText('total')}:</HistoryCardLabel>
                                                            <HistoryCardValue className="amount">₹{displayTotal.toFixed(2)}</HistoryCardValue>
                                                        </HistoryCardRow>

                                                        <HistoryCardRow>
                                                            <HistoryCardLabel>💵 {langCtx.getText('advance')}:</HistoryCardLabel>
                                                            <HistoryCardValue>₹{displayPaid.toFixed(2)}</HistoryCardValue>
                                                        </HistoryCardRow>

                                                        <HistoryCardRow>
                                                            <HistoryCardLabel>🔁 {langCtx.getText('remaining')}:</HistoryCardLabel>
                                                            <HistoryCardValue className="amount">₹{displayRemaining.toFixed(2)}</HistoryCardValue>
                                                        </HistoryCardRow>

                                                        <HistoryCardFooter>
                                                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                                <HistoryCardButton
                                                                    disabled={isRejectedBill}
                                                                    onClick={isRejectedBill ? undefined : () => this.openOrderModal(order)}
                                                                >
                                                                    👁️ {langCtx.getText('viewDetails')}
                                                                </HistoryCardButton>
                                                                {this.canPrintBill(order) && (
                                                                    <BillActionButton
                                                                        type="button"
                                                                        className="btn-primary-soft"
                                                                        onClick={isRejectedBill ? undefined : (event) => {
                                                                            event.stopPropagation();
                                                                            this.handlePrintBill(order);
                                                                        }}
                                                                        disabled={isRejectedBill || Boolean(this.state.printLoadingByOrder[order.id])}
                                                                    >
                                                                        🖨️ {Boolean(this.state.printLoadingByOrder[order.id]) ? 'Printing...' : 'Print Bill'}
                                                                    </BillActionButton>
                                                                )}
                                                                <HistoryCardButton
                                                                    onClick={(event) => {
                                                                        event.stopPropagation();
                                                                        this.openImagesModal({
                                                                            entityType: 'order',
                                                                            entityId: order.id,
                                                                            title: `Order Images - #${order.id}`,
                                                                        });
                                                                    }}
                                                                    style={{ background: '#fff', color: '#2E7D32', border: '1px solid rgba(46,125,50,0.25)' }}
                                                                >
                                                                    🖼️ Images
                                                                </HistoryCardButton>
                                                            </div>
                                                        </HistoryCardFooter>
                                                    </HistoryCard>
                                                );
                                            })}
                                            {totalPages > 1 && this.renderPagination(langCtx, currentPage, totalPages)}
                                        </div>
                                    </MobileHistoryWrapper>
                                )}

                                {/* Online Orders Tab */}
                                {activeTab === 'orders' && strictOnlineOrders.length === 0 && (
                                    <EmptyState>
                                        <div className="empty-icon">🛵</div>
                                        <h3>{langCtx.getText('noOrders')}</h3>
                                        <p>{langCtx.getText('noOrdersMessage')}</p>
                                    </EmptyState>
                                )}

                                {/* Desktop Online Orders Table */}
                                {activeTab === 'orders' && strictOnlineOrders.length > 0 && (
                                    <DesktopHistoryWrapper>
                                        <TableWrapper className="customer-history-table">
                                            <table className="table table-hover">
                                                <thead>
                                                    <tr>
                                                        <th>{langCtx.getText('orderId')}</th>
                                                        <th>{langCtx.getText('orderDate')}</th>
                                                        <th>{langCtx.getText('items')}</th>
                                                        <th>ORDER TYPE</th>
                                                        <th>{langCtx.getText('orderStatus')}</th>
                                                        <th className="text-end">{langCtx.getText('total')}</th>
                                                        <th className="text-end">{langCtx.getText('advance')}</th>
                                                        <th className="text-end">{langCtx.getText('remaining')}</th>
                                                        <th className="text-center">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {visibleItems.map((order) => (
                                                        <tr
                                                            key={order.id}
                                                            onClick={() => this.openOrderModal(order)}
                                                            style={{ cursor: 'pointer' }}
                                                        >
                                                            <td className="fw-bold">#{order.id}</td>
                                                            <td>
                                                                {this.formatDate(
                                                                    order.createdAt ||
                                                                        order.orderDate ||
                                                                        order.updatedAt ||
                                                                        order.date
                                                                )}
                                                            </td>
                                                            <td>{(order.items ? order.items.length : 0)} {langCtx.getText('items')}</td>
                                                                <td>
                                                                <Badge className="badge-info">
                                                                    {this.getDisplayOrderType(order)}
                                                                </Badge>
                                                            </td>
                                                            <td>
                                                                <Badge className={this.getStatusBadge(order.status)}>
                                                                    {order.status === 'Pending Acceptance' && '🕒 '}
                                                                    {order.status === 'Accepted' && '👍 '}
                                                                    {order.status === 'Pending' && '⏳ '}
                                                                    {order.status === 'Verified' && '✅ '}
                                                                    {order.status === 'Paid' && '💰 '}
                                                                    {order.status === 'Delivered' && '📦 '}
                                                                    {order.status === 'Rejected' && '❌ '}
                                                                    {langCtx.getText(statusKey(order.status))}
                                                                </Badge>
                                                            </td>
                                                            <td className="text-end fw-bold" style={{ color: '#2E7D32' }}>
                                                                ₹{this.getOrderTotal(order).toFixed(2)}
                                                            </td>
                                                            <td className="text-end">
                                                                ₹{this.getAdvanceAmount(order).toFixed(2)}
                                                            </td>
                                                            <td
                                                                className="text-end fw-bold"
                                                                style={{ color: this.getRemainingBalance(order) < 0 ? '#c62828' : '#2E7D32' }}
                                                            >
                                                                ₹{this.getRemainingBalance(order).toFixed(2)}
                                                            </td>
                                                            <td className="text-center">
                                                                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
                                                                    <button
                                                                        type="button"
                                                                        className="btn btn-outline-primary btn-sm"
                                                                        onClick={(event) => {
                                                                            event.stopPropagation();
                                                                            this.openOrderModal(order);
                                                                        }}
                                                                    >
                                                                        View
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        className="btn btn-outline-secondary btn-sm"
                                                                        onClick={(event) => {
                                                                            event.stopPropagation();
                                                                            this.openImagesModal({
                                                                                entityType: 'order',
                                                                                entityId: order.id,
                                                                                title: `Order Images - #${order.id}`,
                                                                            });
                                                                        }}
                                                                    >
                                                                        View Images
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                            {totalPages > 1 && this.renderPagination(langCtx, currentPage, totalPages)}
                                        </TableWrapper>
                                    </DesktopHistoryWrapper>
                                )}

                                {/* Mobile Online Orders Cards */}
                                {activeTab === 'orders' && strictOnlineOrders.length > 0 && (
                                    <MobileHistoryWrapper>
                                        <div>
                                            {visibleItems.map((order) => (
                                                <HistoryCard key={order.id} onClick={() => this.openOrderModal(order)}>
                                                    <HistoryCardHeader>
                                                        <HistoryCardTitle>
                                                            <div className="order-id">Order #{order.id}</div>
                                                            <div className="order-date">
                                                                {this.formatDate(
                                                                    order.createdAt || order.orderDate || order.updatedAt || order.date
                                                                )}
                                                            </div>
                                                        </HistoryCardTitle>
                                                    </HistoryCardHeader>

                                                    <HistoryCardRow>
                                                        <HistoryCardLabel>📦 {langCtx.getText('items')}:</HistoryCardLabel>
                                                        <HistoryCardValue>{order.items ? order.items.length : 0}</HistoryCardValue>
                                                    </HistoryCardRow>

                                                    <HistoryCardRow>
                                                        <HistoryCardLabel>💰 {langCtx.getText('total')}:</HistoryCardLabel>
                                                        <HistoryCardValue className="amount">₹{this.getOrderTotal(order).toFixed(2)}</HistoryCardValue>
                                                    </HistoryCardRow>

                                                    <HistoryCardRow>
                                                        <HistoryCardLabel>🏷️ Order Type:</HistoryCardLabel>
                                                        <Badge className="badge-info">{this.getDisplayOrderType(order)}</Badge>
                                                    </HistoryCardRow>

                                                    <HistoryCardRow>
                                                        <HistoryCardLabel>📊 {langCtx.getText('orderStatus')}:</HistoryCardLabel>
                                                        <HistoryStatusBadge $status={order.status}>
                                                            {order.status === 'Pending Acceptance' && '🕒 '}
                                                            {order.status === 'Accepted' && '👍 '}
                                                            {order.status === 'Pending' && '⏳ '}
                                                            {order.status === 'Verified' && '✅ '}
                                                            {order.status === 'Paid' && '💰 '}
                                                            {order.status === 'Delivered' && '📦 '}
                                                            {order.status === 'Rejected' && '❌ '}
                                                            {langCtx.getText(statusKey(order.status))}
                                                        </HistoryStatusBadge>
                                                    </HistoryCardRow>

                                                    <HistoryCardFooter>
                                                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                            <HistoryCardButton onClick={() => this.openOrderModal(order)}>
                                                                👁️ {langCtx.getText('viewDetails')}
                                                            </HistoryCardButton>
                                                            <HistoryCardButton
                                                                onClick={(event) => {
                                                                    event.stopPropagation();
                                                                    this.openImagesModal({
                                                                        entityType: 'order',
                                                                        entityId: order.id,
                                                                        title: `Order Images - #${order.id}`,
                                                                    });
                                                                }}
                                                                style={{ background: '#fff', color: '#2E7D32', border: '1px solid rgba(46,125,50,0.25)' }}
                                                            >
                                                                🖼️ Images
                                                            </HistoryCardButton>
                                                        </div>
                                                    </HistoryCardFooter>
                                                </HistoryCard>
                                            ))}
                                            {totalPages > 1 && this.renderPagination(langCtx, currentPage, totalPages)}
                                        </div>
                                    </MobileHistoryWrapper>
                                )}

                                {/* Offline Orders Tab */}
                                {activeTab === 'offlineOrders' && !offlineOrdersLoaded && (
                                    <Spinner text={langCtx.getText('loadingOfflineOrders')} />
                                )}

                                {activeTab === 'offlineOrders' && offlineOrdersLoaded && strictOfflineOrders.length === 0 && (
                                    <EmptyState>
                                        <div className="empty-icon">🧾</div>
                                        <h3>{langCtx.getText('noOfflineOrdersTitle')}</h3>
                                        <p>{langCtx.getText('offlineOrdersLinkedMessage')}</p>
                                    </EmptyState>
                                )}

                                {/* Desktop Offline Orders Table */}
                                {activeTab === 'offlineOrders' && strictOfflineOrders.length > 0 && (
                                    <DesktopHistoryWrapper>
                                        <TableWrapper className="customer-history-table">
                                            <table className="table table-hover">
                                                <thead>
                                                    <tr>
                                                        <th>{langCtx.getText('orderId')}</th>
                                                        <th>{langCtx.getText('orderDate')}</th>
                                                        <th>{langCtx.getText('items')}</th>
                                                        <th>Order Type</th>
                                                        <th>{langCtx.getText('orderStatus')}</th>
                                                        <th className="text-end">{langCtx.getText('total')}</th>
                                                        <th className="text-end">{langCtx.getText('advance')}</th>
                                                        <th className="text-end">{langCtx.getText('remaining')}</th>
                                                        <th className="text-center">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {visibleItems.map((order) => (
                                                        <tr
                                                            key={order.id}
                                                            onClick={() => this.openOrderModal(order)}
                                                            style={{ cursor: 'pointer' }}
                                                        >
                                                            <td className="fw-bold">#{order.id}</td>
                                                            <td>
                                                                {this.formatDate(
                                                                    order.createdAt ||
                                                                        order.orderDate ||
                                                                        order.updatedAt ||
                                                                        order.date
                                                                )}
                                                            </td>
                                                            <td>{(order.items ? order.items.length : 0)} {langCtx.getText('items')}</td>
                                                            <td>
                                                                <Badge className="badge-info">
                                                                    {this.getDisplayOrderType(order)}
                                                                </Badge>
                                                            </td>
                                                            <td>
                                                                <Badge className={this.getStatusBadge(order.status)}>
                                                                    {order.status === 'Pending Acceptance' && '🕒 '}
                                                                    {order.status === 'Accepted' && '👍 '}
                                                                    {order.status === 'Pending' && '⏳ '}
                                                                    {order.status === 'Verified' && '✅ '}
                                                                    {order.status === 'Paid' && '💰 '}
                                                                    {order.status === 'Delivered' && '📦 '}
                                                                    {order.status === 'Rejected' && '❌ '}
                                                                    {langCtx.getText(statusKey(order.status))}
                                                                </Badge>
                                                            </td>
                                                            <td className="text-end fw-bold" style={{ color: '#2E7D32' }}>
                                                                ₹{this.getOrderTotal(order).toFixed(2)}
                                                            </td>
                                                            <td className="text-end">
                                                                ₹{this.getAdvanceAmount(order).toFixed(2)}
                                                            </td>
                                                            <td
                                                                className="text-end fw-bold"
                                                                style={{ color: this.getRemainingBalance(order) < 0 ? '#c62828' : '#2E7D32' }}
                                                            >
                                                                ₹{this.getRemainingBalance(order).toFixed(2)}
                                                            </td>
                                                            <td className="text-center">
                                                                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
                                                                    <button
                                                                        type="button"
                                                                        className="btn btn-outline-primary btn-sm"
                                                                        onClick={(event) => {
                                                                            event.stopPropagation();
                                                                            this.openOrderModal(order);
                                                                        }}
                                                                    >
                                                                        View
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        className="btn btn-outline-secondary btn-sm"
                                                                        onClick={(event) => {
                                                                            event.stopPropagation();
                                                                            this.openImagesModal({
                                                                                entityType: 'order',
                                                                                entityId: order.id,
                                                                                title: `Order Images - #${order.id}`,
                                                                            });
                                                                        }}
                                                                    >
                                                                        View Images
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                            {totalPages > 1 && this.renderPagination(langCtx, currentPage, totalPages)}
                                        </TableWrapper>
                                    </DesktopHistoryWrapper>
                                )}

                                {/* Mobile Offline Orders Cards */}
                                {activeTab === 'offlineOrders' && strictOfflineOrders.length > 0 && (
                                    <MobileHistoryWrapper>
                                        <div>
                                            {visibleItems.map((order) => (
                                                <HistoryCard key={order.id} onClick={() => this.openOrderModal(order)}>
                                                    <HistoryCardHeader>
                                                        <HistoryCardTitle>
                                                            <div className="order-id">Order #{order.id}</div>
                                                            <div className="order-date">
                                                                {this.formatDate(
                                                                    order.createdAt || order.orderDate || order.updatedAt || order.date
                                                                )}
                                                            </div>
                                                        </HistoryCardTitle>
                                                    </HistoryCardHeader>

                                                    <HistoryCardRow>
                                                        <HistoryCardLabel>📦 {langCtx.getText('items')}:</HistoryCardLabel>
                                                        <HistoryCardValue>{order.items ? order.items.length : 0}</HistoryCardValue>
                                                    </HistoryCardRow>

                                                    <HistoryCardRow>
                                                        <HistoryCardLabel>💰 {langCtx.getText('total')}:</HistoryCardLabel>
                                                        <HistoryCardValue className="amount">₹{this.getOrderTotal(order).toFixed(2)}</HistoryCardValue>
                                                    </HistoryCardRow>

                                                    <HistoryCardRow>
                                                        <HistoryCardLabel>🏷️ Order Type:</HistoryCardLabel>
                                                        <Badge className="badge-info">{this.getDisplayOrderType(order)}</Badge>
                                                    </HistoryCardRow>

                                                    <HistoryCardRow>
                                                        <HistoryCardLabel>📊 {langCtx.getText('orderStatus')}:</HistoryCardLabel>
                                                        <HistoryStatusBadge $status={order.status}>
                                                            {order.status === 'Pending Acceptance' && '🕒 '}
                                                            {order.status === 'Accepted' && '👍 '}
                                                            {order.status === 'Pending' && '⏳ '}
                                                            {order.status === 'Verified' && '✅ '}
                                                            {order.status === 'Paid' && '💰 '}
                                                            {order.status === 'Delivered' && '📦 '}
                                                            {order.status === 'Rejected' && '❌ '}
                                                            {langCtx.getText(statusKey(order.status))}
                                                        </HistoryStatusBadge>
                                                    </HistoryCardRow>

                                                    <HistoryCardFooter>
                                                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                            <HistoryCardButton onClick={() => this.openOrderModal(order)}>
                                                                👁️ {langCtx.getText('viewDetails')}
                                                            </HistoryCardButton>
                                                            <HistoryCardButton
                                                                onClick={(event) => {
                                                                    event.stopPropagation();
                                                                    this.openImagesModal({
                                                                        entityType: 'order',
                                                                        entityId: order.id,
                                                                        title: `Order Images - #${order.id}`,
                                                                    });
                                                                }}
                                                                style={{ background: '#fff', color: '#2E7D32', border: '1px solid rgba(46,125,50,0.25)' }}
                                                            >
                                                                🖼️ Images
                                                            </HistoryCardButton>
                                                        </div>
                                                    </HistoryCardFooter>
                                                </HistoryCard>
                                            ))}
                                            {totalPages > 1 && this.renderPagination(langCtx, currentPage, totalPages)}
                                        </div>
                                    </MobileHistoryWrapper>
                                )}

                                {/* List Orders Tab - Empty State */}
                                {activeTab === 'listOrders' && !listOrdersLoaded && (
                                    <EmptyState>
                                        <div className="empty-icon">📋</div>
                                        <p>Loading grocery lists...</p>
                                    </EmptyState>
                                )}

                                {activeTab === 'listOrders' && listOrdersLoaded && (!activeListOrders || activeListOrders.length === 0) && (
                                    <EmptyState>
                                        <div className="empty-icon">📋</div>
                                        <h3>No Grocery Lists</h3>
                                        <p>You haven't uploaded any grocery lists yet.</p>
                                    </EmptyState>
                                )}

                                {/* List Orders - Desktop View */}
                                {activeTab === 'listOrders' && Array.isArray(activeListOrders) && activeListOrders.length > 0 && visibleItems && visibleItems.length > 0 && (
                                    <DesktopHistoryWrapper>
                                        <TableWrapper $clickable>
                                            <table className="table table-hover">
                                                <thead>
                                                    <tr>
                                                        <th>Order ID</th>
                                                        <th>Upload Date</th>
                                                        <th>Place</th>
                                                        <th>Images</th>
                                                        <th>Status</th>
                                                        {showListOrderTypeColumn && <th>Order Type</th>}
                                                        <th>Action</th>
                                                        <th className="text-center">Images</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {visibleItems.map((list) => {
                                                        if (!list || !list.id) return null;
                                                        const imageCount = (Array.isArray(list.imagePaths) ? list.imagePaths.length : (list.imagePath ? 1 : 0)) || 1;
                                                        const displayId = this.getDisplayOrderId(list);
                                                        const displayStatus = this.getUnifiedOrderStatus(list);
                                                        const normalizedDisplayStatus = displayStatus.toLowerCase();
                                                        const statusLabel = langCtx.getText(statusKey(displayStatus)) || displayStatus;
                                                        
                                                        return (
                                                            <tr
                                                                key={`${list.listOrderId || list.id}-${list.isConverted ? 'converted' : 'pending'}`}
                                                                onClick={() => this.openOrderModal(list)}
                                                                style={{ cursor: 'pointer' }}
                                                            >
                                                                <td className="fw-bold">
                                                                    #{displayId}
                                                                    {list.isConverted && (
                                                                        <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem' }} className="badge badge-success">
                                                                            Converted
                                                                        </span>
                                                                    )}
                                                                </td>
                                                            <td>{this.formatDate(list.createdAt || list.uploadDate)}</td>
                                                            <td>{list.place || '-'}</td>
                                                            <td>
                                                                <Badge className="badge-info">
                                                                    {imageCount} {imageCount === 1 ? 'image' : 'images'}
                                                                </Badge>
                                                            </td>
                                                            <td>
                                                                <HistoryStatusBadge $status={normalizedDisplayStatus}>
                                                                    {normalizedDisplayStatus === 'pending' && '⏳ '}
                                                                    {normalizedDisplayStatus === 'verified' && '✅ '}
                                                                    {normalizedDisplayStatus === 'processing' && '⚙️ '}
                                                                    {normalizedDisplayStatus === 'completed' && '📦 '}
                                                                    {normalizedDisplayStatus === 'rejected' && '❌ '}
                                                                    {normalizedDisplayStatus === 'paid' && '💰 '}
                                                                    {normalizedDisplayStatus === 'delivered' && '🚚 '}
                                                                    {statusLabel}
                                                                </HistoryStatusBadge>
                                                            </td>
                                                            {showListOrderTypeColumn && (
                                                                <td>
                                                                    <Badge className="badge-primary">
                                                                        {list.isConverted ? 'List Order' : this.getDisplayOrderType(list)}
                                                                    </Badge>
                                                                </td>
                                                            )}
                                                            <td>
                                                                <button
                                                                    className="btn btn-sm btn-outline-primary"
                                                                    onClick={() => this.openOrderModal(list)}
                                                                >
                                                                    View
                                                                </button>
                                                            </td>
                                                            <td className="text-center">
                                                                <button
                                                                    type="button"
                                                                    className="btn btn-outline-secondary btn-sm"
                                                                    onClick={(event) => {
                                                                        event.stopPropagation();
                                                                        this.openImagesModal({
                                                                            entityType: 'order',
                                                                            entityId: list.id,
                                                                            title: `Order Images - #${this.getDisplayOrderId(list)}`,
                                                                        });
                                                                    }}
                                                                >
                                                                    View Images
                                                                </button>
                                                            </td>
                                                        </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                            {totalPages > 1 && this.renderPagination(langCtx, currentPage, totalPages)}
                                        </TableWrapper>
                                    </DesktopHistoryWrapper>
                                )}

                                {/* List Orders - Mobile View */}
                                {activeTab === 'listOrders' && Array.isArray(activeListOrders) && activeListOrders.length > 0 && visibleItems && visibleItems.length > 0 && (
                                    <MobileHistoryWrapper>
                                        <div>
                                            {visibleItems.map((list) => {
                                                if (!list || !list.id) return null;
                                                const imageCount = (Array.isArray(list.imagePaths) ? list.imagePaths.length : (list.imagePath ? 1 : 0)) || 1;
                                                const displayId = this.getDisplayOrderId(list);
                                                // ✅ Show actual order status if converted
                                                const displayStatus = list.isConverted 
                                                    ? (list.status || 'Pending').toLowerCase() 
                                                    : (list.status || 'pending');
                                                
                                                return (
                                                <HistoryCard key={`${list.listOrderId || list.id}-${list.isConverted ? 'converted' : 'pending'}`} onClick={() => this.openOrderModal(list)}>
                                                    <HistoryCardHeader>
                                                        <HistoryCardTitle>
                                                            <div className="order-id">
                                                                {list.isConverted ? '📦 Order' : '📋 Grocery List'} #{displayId}
                                                                {list.isConverted && (
                                                                    <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem' }} className="badge badge-success">
                                                                        Converted
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="order-date">
                                                                {this.formatDate(list.createdAt || list.uploadDate)}
                                                            </div>
                                                        </HistoryCardTitle>
                                                    </HistoryCardHeader>

                                                    <HistoryCardRow>
                                                        <HistoryCardLabel>📍 Place:</HistoryCardLabel>
                                                        <HistoryCardValue>{list.place || '-'}</HistoryCardValue>
                                                    </HistoryCardRow>

                                                    <HistoryCardRow>
                                                        <HistoryCardLabel>🖼️ Images:</HistoryCardLabel>
                                                        <Badge className="badge-info">
                                                            {imageCount} image(s)
                                                        </Badge>
                                                    </HistoryCardRow>

                                                    <HistoryCardRow>
                                                        <HistoryCardLabel>📊 Status:</HistoryCardLabel>
                                                        <HistoryStatusBadge $status={displayStatus}>
                                                            {displayStatus === 'pending' && '⏳ Pending'}
                                                            {displayStatus === 'converted' && '✅ Converted'}
                                                            {displayStatus === 'processing' && '⚙️ Processing'}
                                                            {displayStatus === 'completed' && '📦 Completed'}
                                                            {displayStatus === 'rejected' && '❌ Rejected'}
                                                            {displayStatus === 'paid' && '💰 Paid'}
                                                            {displayStatus === 'delivered' && '🚚 Delivered'}
                                                            {!displayStatus && '⏳ Pending'}
                                                        </HistoryStatusBadge>
                                                    </HistoryCardRow>

                                                    {showListOrderTypeColumn && (
                                                        <HistoryCardRow>
                                                            <HistoryCardLabel>🏷️ Order Type:</HistoryCardLabel>
                                                            <Badge className="badge-primary">
                                                                {list.isConverted ? 'List Order' : this.getDisplayOrderType(list)}
                                                            </Badge>
                                                        </HistoryCardRow>
                                                    )}

                                                    {list.isConverted && (
                                                        <HistoryCardRow>
                                                            <Badge className="badge-success">✅ Order #{list.id} (Converted from List)</Badge>
                                                        </HistoryCardRow>
                                                    )}

                                                    <HistoryCardFooter>
                                                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                            <HistoryCardButton onClick={() => this.openOrderModal(list)}>
                                                                👁️ View Details
                                                            </HistoryCardButton>
                                                            <HistoryCardButton
                                                                onClick={(event) => {
                                                                    event.stopPropagation();
                                                                    this.openImagesModal({
                                                                        entityType: 'order',
                                                                        entityId: list.id,
                                                                        title: `Order Images - #${list.id}`,
                                                                    });
                                                                }}
                                                                style={{ background: '#fff', color: '#2E7D32', border: '1px solid rgba(46,125,50,0.25)' }}
                                                            >
                                                                🖼️ Images
                                                            </HistoryCardButton>
                                                        </div>
                                                    </HistoryCardFooter>
                                                </HistoryCard>
                                                );
                                            })}
                                            {totalPages > 1 && this.renderPagination(langCtx, currentPage, totalPages)}
                                        </div>
                                    </MobileHistoryWrapper>
                                )}

                                {/* ── Customer Order Details Modal (Read-only) ── */}
                                {orderModalOpen && selectedOrder && !isSelectedOrderRestricted && (
                                    <ModalOverlay onClick={this.closeOrderModal}>
                                        <ModalContent
                                            style={{ maxWidth: '720px', width: '100%' }}
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <div className="modal-header" style={{ alignItems: 'flex-start' }}>
                                                <div style={{ flex: '1 1 auto' }}>
                                                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                        {this.getOrderDetailsIcon(selectedOrder)} {langCtx.getText('orderDetails')} — #{this.getDisplayOrderId(selectedOrder)}
                                                        <Badge className={this.getStatusBadge(selectedOrder.status)}>
                                                            {this.getUnifiedOrderStatus(selectedOrder).toLowerCase() === 'pending acceptance' && '🕒 '}
                                                            {this.getUnifiedOrderStatus(selectedOrder).toLowerCase() === 'accepted' && '👍 '}
                                                            {this.getUnifiedOrderStatus(selectedOrder).toLowerCase() === 'pending' && '⏳ '}
                                                            {this.getUnifiedOrderStatus(selectedOrder).toLowerCase() === 'verified' && '✅ '}
                                                            {this.getUnifiedOrderStatus(selectedOrder).toLowerCase() === 'paid' && '💰 '}
                                                            {this.getUnifiedOrderStatus(selectedOrder).toLowerCase() === 'delivered' && '📦 '}
                                                            {this.getUnifiedOrderStatus(selectedOrder).toLowerCase() === 'rejected' && '❌ '}
                                                            {langCtx.getText(statusKey(this.getUnifiedOrderStatus(selectedOrder))) || this.getUnifiedOrderStatus(selectedOrder)}
                                                        </Badge>
                                                        {this.getUnifiedOrderStatus(selectedOrder).toLowerCase() !== 'pending' && (
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
                                                                🔒 Order Finalized
                                                            </span>
                                                        )}
                                                    </h3>
                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                                                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: '#e9ecef', borderRadius: '999px', padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}>
                                                            🏷️ {this.getDisplayOrderType(selectedOrder)}
                                                        </div>
                                                        {Array.isArray(selectedOrder?.imagePaths) && selectedOrder.imagePaths.length > 0 && (
                                                            <button
                                                                type="button"
                                                                className="btn btn-outline-secondary btn-sm"
                                                                onClick={() => this.openImagesModal({
                                                                    entityType: 'order',
                                                                    entityId: selectedOrder.id,
                                                                    title: `Order Images - #${selectedOrder.id}`,
                                                                })}
                                                            >
                                                                🖼️ View Images
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                                <button className="close-btn" onClick={this.closeOrderModal}>
                                                    ×
                                                </button>
                                            </div>

                                            <div className="modal-body">
                                                {orderModalLoading ? (
                                                    <Spinner text="Loading order..." />
                                                ) : (
                                                    <>
                                                        <div className="mb-2 text-muted" style={{ fontSize: '0.82rem' }}>
                                                            📅 {this.formatDate(selectedOrder.date || selectedOrder.orderDate || selectedOrder.createdAt || selectedOrder.updatedAt)}
                                                        </div>

                                                        <div
                                                            style={{
                                                                border: '1px solid #e9ecef',
                                                                borderRadius: '8px',
                                                                overflow: 'hidden',
                                                            }}
                                                        >
                                                            <table className="table table-sm mb-0">
                                                                <thead style={{ background: '#f8f9fa' }}>
                                                                    <tr>
                                                                        <th>{langCtx.getText('productName')}</th>
                                                                        <th className="text-center" style={{ width: '110px' }}>
                                                                            {langCtx.getText('quantity')}
                                                                        </th>
                                                                        <th className="text-center" style={{ width: '90px' }}>
                                                                            {langCtx.getText('price')}
                                                                        </th>
                                                                        <th className="text-end" style={{ width: '110px' }}>
                                                                            {langCtx.getText('total')}
                                                                        </th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {(Array.isArray(selectedOrder?.items) ? selectedOrder.items : []).map((item) => (
                                                                        <tr key={item.productId}>
                                                                            <td style={{ fontSize: '0.9rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                                                <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>
                                                                                    {CATEGORY_ICONS[item.category] || '📦'}
                                                                                </span>
                                                                                {item.name || item.productName}
                                                                            </td>
                                                                            <td className="text-center">{item.quantity}</td>
                                                                            <td className="text-center">₹{Number(item.price || 0).toFixed(2)}</td>
                                                                            <td className="text-end fw-bold" style={{ color: '#2E7D32' }}>
                                                                                ₹{Number(item.total || (Number(item.price || 0) * Number(item.quantity || 0)) || 0).toFixed(2)}
                                                                            </td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>

                                                        <div
                                                            className="d-flex justify-content-between align-items-center mt-3"
                                                            style={{
                                                                background: '#f8f9fa',
                                                                border: '1px solid #e9ecef',
                                                                borderRadius: '8px',
                                                                padding: '0.65rem 0.85rem',
                                                            }}
                                                        >
                                                            <span className="fw-semibold text-muted">
                                                                {langCtx.getText('total')}:
                                                            </span>
                                                            <span className="fw-bold" style={{ color: '#2E7D32', fontSize: '1.05rem' }}>
                                                                ₹{this.getOrderTotal(selectedOrder).toFixed(2)}
                                                            </span>
                                                        </div>

                                                        <div
                                                            className="d-flex justify-content-between align-items-center mt-2"
                                                            style={{
                                                                background: '#f8f9fa',
                                                                border: '1px solid #e9ecef',
                                                                borderRadius: '8px',
                                                                padding: '0.65rem 0.85rem',
                                                            }}
                                                        >
                                                            {(() => {
                                                                const total = this.getOrderTotal(selectedOrder);
                                                                const remaining = this.getRemainingBalance(selectedOrder);
                                                                const isFullyPaid = Number(remaining || 0) === 0;
                                                                return isFullyPaid ? (
                                                                    <>
                                                                        <span className="fw-semibold text-muted">Total Amount Paid:</span>
                                                                        <span className="fw-bold" style={{ color: '#2E7D32', fontSize: '1.02rem' }}>
                                                                            ₹{Number(total || 0).toFixed(2)}
                                                                        </span>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <span className="fw-semibold text-muted">{langCtx.getText('advance')}:</span>
                                                                        <span className="fw-bold" style={{ color: '#495057', fontSize: '1.02rem' }}>
                                                                            ₹{this.getAdvanceAmount(selectedOrder).toFixed(2)}
                                                                        </span>
                                                                    </>
                                                                );
                                                            })()}
                                                        </div>

                                                        {(() => {
                                                            const remaining = this.getRemainingBalance(selectedOrder);
                                                            const isFullyPaid = Number(remaining || 0) === 0;
                                                            if (isFullyPaid) return null;
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
                                                                    <span className="fw-semibold text-muted">{langCtx.getText('remaining')}:</span>
                                                                    <span
                                                                        className="fw-bold"
                                                                        style={{
                                                                            color: remaining < 0 ? '#c62828' : '#2E7D32',
                                                                            fontSize: '1.02rem',
                                                                        }}
                                                                    >
                                                                        ₹{Number(remaining || 0).toFixed(2)}
                                                                    </span>
                                                                </div>
                                                            );
                                                        })()}

                                                        {(() => {
                                                            const history = Array.isArray(selectedOrder?.paymentHistory)
                                                                ? selectedOrder.paymentHistory
                                                                : [];
                                                            if (history.length === 0) return null;
                                                            const totalAdvance = this.getAdvanceAmount(selectedOrder);
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
                                                                    <div className="fw-bold mb-2" style={{ fontFamily: "'Outfit', sans-serif" }}>
                                                                        🧾 Payment Update History
                                                                    </div>
                                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                                                                        {history.map((h, idx) => {
                                                                            const delta = Number(h?.deltaAmount || 0) || 0;
                                                                            const label = delta >= 0 ? 'Amount Paid Added' : 'Amount Paid Reduced';
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
                                                                        <span className="fw-bold">₹{Number(totalAdvance || 0).toFixed(2)}</span>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })()}
                                                    </>
                                                )}
                                            </div>

                                            <div className="modal-footer" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
                                                <button
                                                    className="btn btn-outline-secondary btn-sm"
                                                    onClick={this.closeOrderModal}
                                                    style={{ fontSize: '0.82rem', fontWeight: '600' }}
                                                >
                                                    {langCtx.getText('close')}
                                                </button>
                                            </div>
                                        </ModalContent>
                                    </ModalOverlay>
                                )}

                                <OrderImagesModal
                                    open={this.state.imagesModalOpen}
                                    onClose={this.closeImagesModal}
                                    entityType={this.state.imagesModalEntityType}
                                    entityId={this.state.imagesModalEntityId}
                                    title={this.state.imagesModalTitle}
                                    allowUpload={false}
                                />
                            </>
                        )}
                    </div>
                )}
            </LanguageContext.Consumer>
        );
    }

    renderPagination(langCtx, currentPage, totalPages) {
        return (
            <PaginationWrapper>
                <button
                    disabled={currentPage === 1}
                    onClick={() => this.setState({ currentPage: currentPage - 1 })}
                >
                    ‹ {langCtx.getText('back')}
                </button>
                {Array.from({ length: totalPages }, (_, i) => (
                    <button
                        key={i + 1}
                        className={currentPage === i + 1 ? 'active' : ''}
                        onClick={() => this.setState({ currentPage: i + 1 })}
                    >
                        {i + 1}
                    </button>
                ))}
                <button
                    disabled={currentPage === totalPages}
                    onClick={() => this.setState({ currentPage: currentPage + 1 })}
                >
                    {langCtx.getText('close')} ›
                </button>
            </PaginationWrapper>
        );
    }
}

export default BillHistoryPage;
