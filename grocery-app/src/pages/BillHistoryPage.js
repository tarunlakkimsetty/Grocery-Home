import React from 'react';
import { Navigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import LanguageContext from '../context/LanguageContext';
import billService from '../services/billService';
import orderService from '../services/orderService';
import Spinner from '../components/Spinner';
import { toast } from 'react-toastify';
import { PageHeader } from '../styledComponents/LayoutStyles';
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
            loading: true,
            error: null,
            currentPage: 1,
            redirectTo: null,
            activeTab: 'bills',
            offlineOrdersLoaded: false,
            // Customer Order Details Modal
            orderModalOpen: false,
            selectedOrder: null,
            orderModalLoading: false,
        };
    }

    componentDidMount() {
        this.fetchData();
    }

    fetchData = async () => {
        this.setState({ loading: true, error: null });
        try {
            const { user } = this.context;
            const userId = user ? user.id : 2;

            const [billsResult, ordersResult, offlineResult] = await Promise.allSettled([
                billService.getBillHistory(userId),
                orderService.getCustomerOrders(userId),
                // Offline bills/orders: prefetch for accurate count on first render
                orderService.getUserOfflineOrders(),
            ]);

            if (billsResult.status === 'rejected' || ordersResult.status === 'rejected') {
                throw (billsResult.status === 'rejected' ? billsResult.reason : ordersResult.reason);
            }

            const billsResponse = billsResult.value;
            const ordersResponse = ordersResult.value;

            // Handle both { success, data: [...] } and direct array responses
            const bills = Array.isArray(billsResponse)
                ? billsResponse
                : (billsResponse?.data || billsResponse?.bills || []);
            const orders = Array.isArray(ordersResponse)
                ? ordersResponse
                : (ordersResponse?.data || ordersResponse?.orders || []);

            let offlineOrders = [];
            if (offlineResult.status === 'fulfilled') {
                const resp = offlineResult.value;
                offlineOrders = Array.isArray(resp)
                    ? resp
                    : (resp?.data || resp?.orders || []);
            }

            this.setState({ bills, orders, offlineOrders, offlineOrdersLoaded: true, loading: false });
        } catch (err) {
            this.setState({ error: t('failedToLoadHistory'), loading: false });
            toast.error(t('failedToLoadHistory'));
        }
    };

    fetchOfflineOrders = async () => {
        try {
            const resp = await orderService.getUserOfflineOrders();
            const offlineOrders = Array.isArray(resp)
                ? resp
                : (resp?.data || resp?.orders || []);
            this.setState({ offlineOrders, offlineOrdersLoaded: true });
        } catch (err) {
            this.setState({ offlineOrders: [], offlineOrdersLoaded: true });
        }
    };

    setActiveTab = (tab) => {
        this.setState({ activeTab: tab, currentPage: 1 }, () => {
            if (tab === 'offlineOrders' && !this.state.offlineOrdersLoaded) {
                this.fetchOfflineOrders();
            }
        });
    };

    openOrderModal = async (order) => {
        this.setState({ orderModalOpen: true, selectedOrder: order, orderModalLoading: true });
        try {
            const { activeTab } = this.state;

            // Offline orders are phone-linked and can 403 on /orders/:id (customerId mismatch).
            if (activeTab === 'offlineOrders') {
                const resp = await orderService.getUserOfflineOrders();
                const offlineOrders = Array.isArray(resp)
                    ? resp
                    : (resp?.data?.orders || resp?.orders || resp?.data || []);
                const fresh = (Array.isArray(offlineOrders) ? offlineOrders : []).find((o) => o.id === order.id);
                this.setState({ selectedOrder: fresh || order, orderModalLoading: false, offlineOrders });
                return;
            }

            // Online orders: safe to fetch by id (authorization checks customerId)
            const resp = await orderService.getOrderById(order.id);
            const fresh = resp?.order || resp?.data?.order || resp?.data || resp;
            this.setState({ selectedOrder: fresh || order, orderModalLoading: false });
        } catch (err) {
            this.setState({ orderModalLoading: false });
        }
    };

    closeOrderModal = () => {
        this.setState({ orderModalOpen: false, selectedOrder: null, orderModalLoading: false });
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

    getStatusBadge = (status) => {
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

    getOrderTotal = (order) => {
        const direct = Number(order?.totalAmount ?? order?.grandTotal ?? 0);
        if (Number.isFinite(direct)) return direct;
        const items = Array.isArray(order?.items) ? order.items : [];
        return items.reduce((sum, item) => {
            const itemTotal = Number(item?.total ?? (Number(item?.price ?? 0) * Number(item?.quantity ?? 0)) ?? 0);
            return sum + (Number.isFinite(itemTotal) ? itemTotal : 0);
        }, 0);
    };

    getAdvanceAmount = (order) => {
        const val = Number(order?.advanceAmount ?? 0);
        return Number.isFinite(val) ? val : 0;
    };

    getRemainingBalance = (order) => {
        const remaining = Number(order?.remainingBalance);
        if (Number.isFinite(remaining)) return remaining;
        return this.getOrderTotal(order) - this.getAdvanceAmount(order);
    };

    render() {
        if (this.state.redirectTo) {
            return <Navigate to={this.state.redirectTo} />;
        }

        const {
            bills,
            orders,
            offlineOrders,
            loading,
            error,
            currentPage,
            activeTab,
            offlineOrdersLoaded,
            orderModalOpen,
            selectedOrder,
            orderModalLoading,
        } = this.state;

        // Safety fallback: ensure bills and orders are arrays
        const safeBills = Array.isArray(bills) ? bills : [];
        const safeOrders = Array.isArray(orders) ? orders : [];
        const safeOfflineOrders = Array.isArray(offlineOrders) ? offlineOrders : [];
        const activeList = activeTab === 'bills'
            ? safeBills
            : (activeTab === 'offlineOrders' ? safeOfflineOrders : safeOrders);
        const totalPages = Math.ceil(activeList.length / ITEMS_PER_PAGE);
        const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
        const visibleItems = activeList.slice(startIdx, startIdx + ITEMS_PER_PAGE);

        return (
            <LanguageContext.Consumer>
                {(langCtx) => (
                    <div>
                        <PageHeader>
                            <h1>📋 {langCtx.getText('purchaseHistory')}</h1>
                            <p>{safeBills.length + safeOrders.length + safeOfflineOrders.length} {langCtx.getText('items')} total transactions</p>
                        </PageHeader>

                        {loading && <Spinner fullPage text={langCtx.getText('loadingHistory')} />}
                        {error && <div className="alert alert-danger">{error}</div>}

                        {!loading && !error && (
                            <>
                                {/* Tabs */}
                                <ul className="nav nav-tabs mb-3">
                                    <li className="nav-item">
                                        <button
                                            className={'nav-link' + (activeTab === 'bills' ? ' active fw-bold' : '')}
                                            onClick={() => this.setActiveTab('bills')}
                                        >
                                            🧾 {langCtx.getText('bills')} ({safeBills.length})
                                        </button>
                                    </li>
                                    <li className="nav-item">
                                        <button
                                            className={'nav-link' + (activeTab === 'orders' ? ' active fw-bold' : '')}
                                            onClick={() => this.setActiveTab('orders')}
                                        >
                                            🛵 {langCtx.getText('onlineOrders')} ({safeOrders.length})
                                        </button>
                                    </li>
                                    <li className="nav-item">
                                        <button
                                            className={'nav-link' + (activeTab === 'offlineOrders' ? ' active fw-bold' : '')}
                                            onClick={() => this.setActiveTab('offlineOrders')}
                                        >
                                            🧾 {langCtx.getText('offlineOrders')} ({safeOfflineOrders.length})
                                        </button>
                                    </li>
                                </ul>

                                {/* Bills Tab */}
                                {activeTab === 'bills' && safeBills.length === 0 && (
                                    <EmptyState>
                                        <div className="empty-icon">🧾</div>
                                        <h3>{langCtx.getText('noBills')}</h3>
                                        <p>{langCtx.getText('noBillsMessage')}</p>
                                    </EmptyState>
                                )}

                                {/* Desktop Bills Table */}
                                {activeTab === 'bills' && safeBills.length > 0 && (
                                    <DesktopHistoryWrapper>
                                        <TableWrapper $clickable>
                                            <table className="table table-hover">
                                                <thead>
                                                    <tr>
                                                        <th>{langCtx.getText('billNumber')}</th>
                                                        <th>{langCtx.getText('billDate')}</th>
                                                        <th>{langCtx.getText('items')}</th>
                                                        <th>{langCtx.getText('paymentMethod')}</th>
                                                        <th className="text-end">{langCtx.getText('total')}</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {visibleItems.map((bill) => (
                                                        <tr
                                                            key={bill.id}
                                                            onClick={() => this.setState({ redirectTo: `/bill/${bill.id}` })}
                                                            style={{ cursor: 'pointer' }}
                                                        >
                                                            <td className="fw-bold">#{bill.id}</td>
                                                            <td>{this.formatDate(bill.date)}</td>
                                                            <td>{bill.items.length} {langCtx.getText('items')}</td>
                                                            <td>
                                                                <Badge className={this.getPaymentBadge(bill.paymentMethod)}>
                                                                    {bill.paymentMethod}
                                                                </Badge>
                                                            </td>
                                                            <td className="text-end fw-bold" style={{ color: '#2E7D32' }}>
                                                                ₹{Number(bill.grandTotal || 0).toFixed(2)}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                            {totalPages > 1 && this.renderPagination(langCtx, currentPage, totalPages)}
                                        </TableWrapper>
                                    </DesktopHistoryWrapper>
                                )}

                                {/* Mobile Bills Cards */}
                                {activeTab === 'bills' && safeBills.length > 0 && (
                                    <MobileHistoryWrapper>
                                        <div>
                                            {visibleItems.map((bill) => (
                                                <HistoryCard key={bill.id} onClick={() => this.setState({ redirectTo: `/bill/${bill.id}` })}>
                                                    <HistoryCardHeader>
                                                        <HistoryCardTitle>
                                                            <div className="order-id">Bill #{bill.id}</div>
                                                            <div className="order-date">{this.formatDate(bill.date)}</div>
                                                        </HistoryCardTitle>
                                                    </HistoryCardHeader>

                                                    <HistoryCardRow>
                                                        <HistoryCardLabel>📦 {langCtx.getText('items')}:</HistoryCardLabel>
                                                        <HistoryCardValue>{bill.items.length}</HistoryCardValue>
                                                    </HistoryCardRow>

                                                    <HistoryCardRow>
                                                        <HistoryCardLabel>💰 {langCtx.getText('total')}:</HistoryCardLabel>
                                                        <HistoryCardValue className="amount">₹{Number(bill.grandTotal || 0).toFixed(2)}</HistoryCardValue>
                                                    </HistoryCardRow>

                                                    <HistoryCardRow>
                                                        <HistoryCardLabel>💳 {langCtx.getText('paymentMethod')}:</HistoryCardLabel>
                                                        <Badge className={this.getPaymentBadge(bill.paymentMethod)}>
                                                            {bill.paymentMethod}
                                                        </Badge>
                                                    </HistoryCardRow>

                                                    <HistoryCardFooter>
                                                        <HistoryCardButton onClick={() => this.setState({ redirectTo: `/bill/${bill.id}` })}>
                                                            👁️ {langCtx.getText('viewDetails')}
                                                        </HistoryCardButton>
                                                    </HistoryCardFooter>
                                                </HistoryCard>
                                            ))}
                                            {totalPages > 1 && this.renderPagination(langCtx, currentPage, totalPages)}
                                        </div>
                                    </MobileHistoryWrapper>
                                )}

                                {/* Online Orders Tab */}
                                {activeTab === 'orders' && safeOrders.length === 0 && (
                                    <EmptyState>
                                        <div className="empty-icon">🛵</div>
                                        <h3>{langCtx.getText('noOrders')}</h3>
                                        <p>{langCtx.getText('noOrdersMessage')}</p>
                                    </EmptyState>
                                )}

                                {/* Desktop Online Orders Table */}
                                {activeTab === 'orders' && safeOrders.length > 0 && (
                                    <DesktopHistoryWrapper>
                                        <TableWrapper>
                                            <table className="table table-hover">
                                                <thead>
                                                    <tr>
                                                        <th>{langCtx.getText('orderId')}</th>
                                                        <th>{langCtx.getText('orderDate')}</th>
                                                        <th>{langCtx.getText('items')}</th>
                                                        <th>{langCtx.getText('paymentMethod')}</th>
                                                        <th>{langCtx.getText('orderStatus')}</th>
                                                        <th className="text-end">{langCtx.getText('total')}</th>
                                                        <th className="text-end">{langCtx.getText('advance')}</th>
                                                        <th className="text-end">{langCtx.getText('remaining')}</th>
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
                                                                <Badge className="badge-warning">
                                                                    🛵 COD
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
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                            {totalPages > 1 && this.renderPagination(langCtx, currentPage, totalPages)}
                                        </TableWrapper>
                                    </DesktopHistoryWrapper>
                                )}

                                {/* Mobile Online Orders Cards */}
                                {activeTab === 'orders' && safeOrders.length > 0 && (
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
                                                        <HistoryCardLabel>💳 {langCtx.getText('paymentMethod')}:</HistoryCardLabel>
                                                        <Badge className="badge-warning">🛵 COD</Badge>
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
                                                        <HistoryCardButton onClick={() => this.openOrderModal(order)}>
                                                            👁️ {langCtx.getText('viewDetails')}
                                                        </HistoryCardButton>
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

                                {activeTab === 'offlineOrders' && offlineOrdersLoaded && safeOfflineOrders.length === 0 && (
                                    <EmptyState>
                                        <div className="empty-icon">🧾</div>
                                        <h3>{langCtx.getText('noOfflineOrdersTitle')}</h3>
                                        <p>{langCtx.getText('offlineOrdersLinkedMessage')}</p>
                                    </EmptyState>
                                )}

                                {/* Desktop Offline Orders Table */}
                                {activeTab === 'offlineOrders' && safeOfflineOrders.length > 0 && (
                                    <DesktopHistoryWrapper>
                                        <TableWrapper>
                                            <table className="table table-hover">
                                                <thead>
                                                    <tr>
                                                        <th>{langCtx.getText('orderId')}</th>
                                                        <th>{langCtx.getText('orderDate')}</th>
                                                        <th>{langCtx.getText('items')}</th>
                                                        <th>{langCtx.getText('paymentMethod')}</th>
                                                        <th>{langCtx.getText('orderStatus')}</th>
                                                        <th className="text-end">{langCtx.getText('total')}</th>
                                                        <th className="text-end">{langCtx.getText('advance')}</th>
                                                        <th className="text-end">{langCtx.getText('remaining')}</th>
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
                                                                <Badge className="badge-warning">
                                                                    🧾 OFFLINE
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
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                            {totalPages > 1 && this.renderPagination(langCtx, currentPage, totalPages)}
                                        </TableWrapper>
                                    </DesktopHistoryWrapper>
                                )}

                                {/* Mobile Offline Orders Cards */}
                                {activeTab === 'offlineOrders' && safeOfflineOrders.length > 0 && (
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
                                                        <HistoryCardLabel>💳 {langCtx.getText('paymentMethod')}:</HistoryCardLabel>
                                                        <Badge className="badge-warning">🧾 OFFLINE</Badge>
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
                                                        <HistoryCardButton onClick={() => this.openOrderModal(order)}>
                                                            👁️ {langCtx.getText('viewDetails')}
                                                        </HistoryCardButton>
                                                    </HistoryCardFooter>
                                                </HistoryCard>
                                            ))}
                                            {totalPages > 1 && this.renderPagination(langCtx, currentPage, totalPages)}
                                        </div>
                                    </MobileHistoryWrapper>
                                )}

                                {/* ── Customer Order Details Modal (Read-only) ── */}
                                {orderModalOpen && selectedOrder && (
                                    <ModalOverlay onClick={this.closeOrderModal}>
                                        <ModalContent
                                            style={{ maxWidth: '720px', width: '100%' }}
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <div className="modal-header">
                                                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                    {(selectedOrder.orderType === 'Offline' ? '🧾' : '🛵')} {langCtx.getText('orderDetails')} — #{selectedOrder.id}
                                                    <Badge className={this.getStatusBadge(selectedOrder.status)}>
                                                        {selectedOrder.status === 'Pending Acceptance' && '🕒 '}
                                                        {selectedOrder.status === 'Accepted' && '👍 '}
                                                        {selectedOrder.status === 'Pending' && '⏳ '}
                                                        {selectedOrder.status === 'Verified' && '✅ '}
                                                        {selectedOrder.status === 'Paid' && '💰 '}
                                                        {selectedOrder.status === 'Delivered' && '📦 '}
                                                        {selectedOrder.status === 'Rejected' && '❌ '}
                                                        {langCtx.getText(statusKey(selectedOrder.status))}
                                                    </Badge>
                                                    {selectedOrder.status !== 'Pending' && (
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
                                                            📅 {this.formatDate(selectedOrder.date)}
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
                                                                    {selectedOrder.items.map((item) => (
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
