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
} from '../styledComponents/FormStyles';

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
        this.setState({ loading: true });
        try {
            const { user } = this.context;
            const userId = user ? user.id : 2;
            const [billsResponse, ordersResponse] = await Promise.all([
                billService.getBillHistory(userId),
                orderService.getCustomerOrders(userId),
            ]);
            // Handle both { success, data: [...] } and direct array responses
            const bills = Array.isArray(billsResponse) 
                ? billsResponse 
                : (billsResponse?.data || billsResponse?.bills || []);
            const orders = Array.isArray(ordersResponse) 
                ? ordersResponse 
                : (ordersResponse?.data || ordersResponse?.orders || []);
            this.setState({ bills, orders, loading: false });
        } catch (err) {
            this.setState({ error: 'Failed to load history', loading: false });
            toast.error('Failed to load history');
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
        const { user } = this.context;
        const userId = user ? user.id : 2;
        this.setState({ orderModalOpen: true, selectedOrder: order, orderModalLoading: true });
        try {
            const { activeTab } = this.state;

            if (activeTab === 'offlineOrders') {
                const resp = await orderService.getUserOfflineOrders();
                const offlineOrders = Array.isArray(resp)
                    ? resp
                    : (resp?.data || resp?.orders || []);
                const fresh = offlineOrders.find((o) => o.id === order.id);
                this.setState({ selectedOrder: fresh || order, orderModalLoading: false, offlineOrders });
                return;
            }

            // Online Orders tab: re-fetch from customer endpoint to reflect latest status
            const ordersResponse = await orderService.getCustomerOrders(userId);
            const orders = Array.isArray(ordersResponse) 
                ? ordersResponse 
                : (ordersResponse?.data || ordersResponse?.orders || []);
            const fresh = orders.find((o) => o.id === order.id);
            this.setState({ selectedOrder: fresh || order, orderModalLoading: false, orders });
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

                        {loading && <Spinner fullPage text="Loading history..." />}
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

                                {activeTab === 'bills' && safeBills.length > 0 && (
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
                                )}

                                {/* Online Orders Tab */}
                                {activeTab === 'orders' && safeOrders.length === 0 && (
                                    <EmptyState>
                                        <div className="empty-icon">🛵</div>
                                        <h3>{langCtx.getText('noOrders')}</h3>
                                        <p>{langCtx.getText('noOrdersMessage')}</p>
                                    </EmptyState>
                                )}

                                {activeTab === 'orders' && safeOrders.length > 0 && (
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
                                                                {order.status === 'Pending' && '⏳ '}
                                                                {order.status === 'Verified' && '✅ '}
                                                                {order.status === 'Paid' && '💰 '}
                                                                {order.status === 'Delivered' && '📦 '}
                                                                {order.status === 'Rejected' && '❌ '}
                                                                {order.status}
                                                            </Badge>
                                                        </td>
                                                        <td className="text-end fw-bold" style={{ color: '#2E7D32' }}>
                                                            ₹{this.getOrderTotal(order).toFixed(2)}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        {totalPages > 1 && this.renderPagination(langCtx, currentPage, totalPages)}
                                    </TableWrapper>
                                )}

                                {/* Offline Orders Tab */}
                                {activeTab === 'offlineOrders' && !offlineOrdersLoaded && (
                                    <Spinner text="Loading offline orders..." />
                                )}

                                {activeTab === 'offlineOrders' && offlineOrdersLoaded && safeOfflineOrders.length === 0 && (
                                    <EmptyState>
                                        <div className="empty-icon">🧾</div>
                                        <h3>No offline orders</h3>
                                        <p>Offline orders linked to your phone will appear here.</p>
                                    </EmptyState>
                                )}

                                {activeTab === 'offlineOrders' && safeOfflineOrders.length > 0 && (
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
                                                                {order.status === 'Pending' && '⏳ '}
                                                                {order.status === 'Verified' && '✅ '}
                                                                {order.status === 'Paid' && '💰 '}
                                                                {order.status === 'Delivered' && '📦 '}
                                                                {order.status === 'Rejected' && '❌ '}
                                                                {order.status}
                                                            </Badge>
                                                        </td>
                                                        <td className="text-end fw-bold" style={{ color: '#2E7D32' }}>
                                                            ₹{this.getOrderTotal(order).toFixed(2)}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        {totalPages > 1 && this.renderPagination(langCtx, currentPage, totalPages)}
                                    </TableWrapper>
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
                                                        {selectedOrder.status === 'Pending' && '⏳ '}
                                                        {selectedOrder.status === 'Verified' && '✅ '}
                                                        {selectedOrder.status === 'Paid' && '💰 '}
                                                        {selectedOrder.status === 'Delivered' && '📦 '}
                                                        {selectedOrder.status === 'Rejected' && '❌ '}
                                                        {selectedOrder.status}
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
                                                                            <td style={{ fontSize: '0.9rem', fontWeight: 600 }}>
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
