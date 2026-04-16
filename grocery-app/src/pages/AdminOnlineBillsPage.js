import React from 'react';
import orderService from '../services/orderService';
import LanguageContext from '../context/LanguageContext';
import Spinner from '../components/Spinner';
import { toast } from 'react-toastify';
import { PageHeader } from '../styledComponents/LayoutStyles';
import {
    TableWrapper,
    Badge,
    EmptyState,
    MobileBillsWrapper,
    DesktopBillsWrapper,
    BillCard,
    BillCardHeader,
    BillCardTitle,
    BillCardRow,
    BillCardLabel,
    BillCardValue,
    BillCardFooter,
    BillCardButton,
    BillStatusBadge,
} from '../styledComponents/FormStyles';

class AdminOnlineBillsPage extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            bills: [],
            loading: true,
            error: null,

            searchQuery: '',
            selectedOrder: null,
            showModal: false,
        };
    }

    componentDidMount() {
        this.fetchBills();
    }

    fetchBills = async () => {
        this.setState({ loading: true });
        try {
            const bills = await orderService.getBillsOrders('Online');
            this.setState({ bills: Array.isArray(bills) ? bills : [], loading: false });
        } catch (err) {
            this.setState({ error: 'Failed to load online bills', loading: false });
            toast.error('Failed to load online bills');
        }
    };

    handleSearchChange = (e) => {
        this.setState({ searchQuery: e.target.value });
    };

    handleViewOrder = async (orderId) => {
        try {
            const resp = await orderService.getOrderById(orderId);
            const order = resp?.order || resp?.data?.order || resp?.data || resp;
            this.setState({ selectedOrder: order, showModal: true });
        } catch {
            toast.error('Failed to load order');
        }
    };

    formatDate = (dateStr) => {
        const d = new Date(dateStr);
        if (Number.isNaN(d.getTime())) return '-';
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

    getBillDate = (order) => {
        return (
            order?.updatedAt ||
            order?.deliveredAt ||
            order?.verifiedAt ||
            order?.orderDate ||
            order?.date ||
            null
        );
    };

    getStatusBadgeClass = (status) => {
        if (status === 'Rejected') return 'badge-danger';
        if (status === 'Completed') return 'badge-success';
        if (status === 'Delivered') return 'badge-info';
        return 'badge-warning';
    };

    normalizeForSearch = (val) => String(val ?? '').toLowerCase();

    filterBills = (orders) => {
        const qRaw = String(this.state.searchQuery || '').trim();
        if (!qRaw) return orders;

        const q = qRaw.toLowerCase();
        const qDigits = qRaw.replace(/\D/g, '');

        return (Array.isArray(orders) ? orders : []).filter((order) => {
            const idStr = String(order?.id ?? '');
            const nameStr = this.normalizeForSearch(order?.customerName);
            const phoneStr = String(order?.phone || order?.customerPhone || '').replace(/\D/g, '');

            const idMatch = idStr.includes(qRaw) || idStr.toLowerCase().includes(q);
            const nameMatch = nameStr.includes(q);
            const phoneMatch = qDigits ? phoneStr.includes(qDigits) : false;

            return idMatch || nameMatch || phoneMatch;
        });
    };

    renderBillsTable = (orders) => {
        const safeOrders = Array.isArray(orders) ? orders : [];
        if (safeOrders.length === 0) {
            return (
                <EmptyState>
                    <div className="empty-icon">🧾</div>
                    <h3>No online bills</h3>
                    <p>No Completed/Rejected online orders yet.</p>
                </EmptyState>
            );
        }

        return (
            <>
                {/* Desktop Table */}
                <DesktopBillsWrapper>
                    <TableWrapper>
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Order ID</th>
                                    <th>Customer Name</th>
                                    <th>Phone Number</th>
                                    <th>Date</th>
                                    <th>Status</th>
                                    <th className="text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {safeOrders.map((order) => (
                                    <tr key={order.id}>
                                        <td className="fw-bold">#{order.id}</td>
                                        <td>{order.customerName || '-'}</td>
                                        <td>{order.phone || '-'}</td>
                                        <td>{this.formatDate(this.getBillDate(order))}</td>
                                        <td>
                                            <Badge className={this.getStatusBadgeClass(order.status)}>
                                                {order.status}
                                            </Badge>
                                        </td>
                                        <td className="text-center">
                                            <button
                                                type="button"
                                                className="btn btn-outline-primary btn-sm"
                                                onClick={() => this.handleViewOrder(order.id)}
                                            >
                                                View
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </TableWrapper>
                </DesktopBillsWrapper>

                {/* Mobile Cards */}
                <MobileBillsWrapper>
                    <div>
                        {safeOrders.map((order) => (
                            <BillCard key={order.id}>
                                <BillCardHeader>
                                    <BillCardTitle>
                                        <div className="order-id">Order #{order.id}</div>
                                        <div className="customer-name">{order.customerName || '-'}</div>
                                    </BillCardTitle>
                                </BillCardHeader>

                                <BillCardRow>
                                    <BillCardLabel>📞 Phone:</BillCardLabel>
                                    <BillCardValue>{order.phone || '-'}</BillCardValue>
                                </BillCardRow>

                                <BillCardRow>
                                    <BillCardLabel>📅 Date:</BillCardLabel>
                                    <BillCardValue>{this.formatDate(this.getBillDate(order))}</BillCardValue>
                                </BillCardRow>

                                <BillCardRow>
                                    <BillCardLabel>📊 Status:</BillCardLabel>
                                    <BillStatusBadge $status={order.status}>
                                        {order.status}
                                    </BillStatusBadge>
                                </BillCardRow>

                                <BillCardFooter>
                                    <BillCardButton onClick={() => this.handleViewOrder(order.id)}>
                                        👁️ View Details
                                    </BillCardButton>
                                </BillCardFooter>
                            </BillCard>
                        ))}
                    </div>
                </MobileBillsWrapper>
            </>
        );
    };

    render() {
        const { bills, loading, error } = this.state;
        const safeBills = Array.isArray(bills) ? bills : [];
        const filtered = this.filterBills(safeBills);

        return (
            <LanguageContext.Consumer>
                {(langCtx) => (
                    <div>
                        <PageHeader>
                            <h1>🧾 Online Bills</h1>
                            <p>{filtered.length} orders • Completed / Rejected</p>
                        </PageHeader>

                        <div className="mb-3" style={{ maxWidth: '520px' }}>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Search by Order ID / Customer Name / Phone Number"
                                value={this.state.searchQuery}
                                onChange={this.handleSearchChange}
                            />
                        </div>

                        {loading && <Spinner fullPage text="Loading online bills..." />}
                        {error && <div className="alert alert-danger">{error}</div>}

                        {!loading && !error && this.renderBillsTable(filtered)}

                        {this.state.showModal && this.state.selectedOrder && (
                            <div
                                onClick={() => this.setState({ showModal: false })}
                                style={{
                                    position: 'fixed',
                                    inset: 0,
                                    background: 'rgba(0,0,0,0.35)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    zIndex: 1050,
                                    padding: '1rem',
                                }}
                            >
                                <div
                                    onClick={(e) => e.stopPropagation()}
                                    style={{
                                        width: '100%',
                                        maxWidth: '560px',
                                        background: 'white',
                                        borderRadius: '10px',
                                        padding: '1rem 1.1rem',
                                    }}
                                >
                                    <h3 style={{ marginBottom: '0.75rem' }}>Order Details</h3>

                                    <p><strong>Order ID:</strong> {this.state.selectedOrder.id}</p>
                                    <p><strong>Customer:</strong> {this.state.selectedOrder.customerName || '-'}</p>
                                    <p><strong>Phone:</strong> {this.state.selectedOrder.phone || '-'}</p>
                                    <p><strong>Order Type:</strong> {this.state.selectedOrder.orderType || '-'}</p>
                                    <p><strong>Status:</strong> {this.state.selectedOrder.status || '-'}</p>
                                    <p><strong>Date:</strong> {this.formatDate(this.getBillDate(this.state.selectedOrder) || this.state.selectedOrder.orderDate || this.state.selectedOrder.date)}</p>

                                    <p>
                                        <strong>Payment Mode:</strong>{' '}
                                        {this.state.selectedOrder.paymentMethod || this.state.selectedOrder.paymentMode || (this.state.selectedOrder.orderType === 'Offline' ? 'Cash' : '-')}
                                    </p>

                                    <hr />

                                    <h4 style={{ marginBottom: '0.6rem' }}>Items</h4>

                                    <div
                                        style={{
                                            border: '1px solid #e9ecef',
                                            borderRadius: '8px',
                                            overflow: 'hidden',
                                            marginBottom: '0.85rem',
                                        }}
                                    >
                                        <table className="table table-sm mb-0">
                                            <thead style={{ background: '#f8f9fa' }}>
                                                <tr>
                                                    <th style={{ padding: '0.55rem 0.75rem' }}>Product</th>
                                                    <th className="text-center" style={{ width: '70px', padding: '0.55rem 0.5rem' }}>Qty</th>
                                                    <th className="text-end" style={{ width: '110px', padding: '0.55rem 0.75rem' }}>Price</th>
                                                    <th className="text-end" style={{ width: '120px', padding: '0.55rem 0.75rem' }}>Subtotal</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {(Array.isArray(this.state.selectedOrder.items) ? this.state.selectedOrder.items : []).map((item) => (
                                                    <tr key={item.id || item.productId}>
                                                        <td style={{ padding: '0.55rem 0.75rem', fontSize: '0.88rem', fontWeight: 600 }}>
                                                            {item.productName || item.name || '—'}
                                                        </td>
                                                        <td className="text-center" style={{ padding: '0.55rem 0.5rem', fontSize: '0.88rem' }}>
                                                            {item.quantity}
                                                        </td>
                                                        <td className="text-end" style={{ padding: '0.55rem 0.75rem', fontSize: '0.88rem' }}>
                                                            ₹{Number(item.price || 0).toFixed(2)}
                                                        </td>
                                                        <td className="text-end fw-bold" style={{ padding: '0.55rem 0.75rem', fontSize: '0.88rem' }}>
                                                            ₹{Number(
                                                                item.subtotal !== null && item.subtotal !== undefined
                                                                    ? item.subtotal
                                                                    : item.total !== null && item.total !== undefined
                                                                        ? item.total
                                                                        : (Number(item.price || 0) * Number(item.quantity || 0))
                                                            ).toFixed(2)}
                                                        </td>
                                                    </tr>
                                                ))}
                                                {(!this.state.selectedOrder.items || this.state.selectedOrder.items.length === 0) && (
                                                    <tr>
                                                        <td colSpan={4} className="text-center text-muted" style={{ padding: '0.75rem' }}>
                                                            No items found for this order.
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>

                                    <div className="d-flex justify-content-between align-items-center" style={{ marginBottom: '0.85rem' }}>
                                        <span className="text-muted fw-semibold">Grand Total</span>
                                        <span className="fw-bold" style={{ fontSize: '1.05rem' }}>
                                            ₹{Number(this.state.selectedOrder.totalAmount ?? this.state.selectedOrder.grandTotal ?? 0).toFixed(2)}
                                            {(() => {
                                                const status = String(this.state.selectedOrder?.status || '').trim();
                                                if (status === 'Completed') {
                                                    return (
                                                        <span className="text-success fw-semibold" style={{ marginLeft: '0.4rem', fontSize: '0.95rem' }}>
                                                            (Paid)
                                                        </span>
                                                    );
                                                }
                                                if (status === 'Rejected') {
                                                    return (
                                                        <span className="text-danger fw-semibold" style={{ marginLeft: '0.4rem', fontSize: '0.95rem' }}>
                                                            (Unpaid)
                                                        </span>
                                                    );
                                                }
                                                return null;
                                            })()}
                                        </span>
                                    </div>

                                    <button
                                        type="button"
                                        className="btn btn-outline-secondary btn-sm"
                                        onClick={() => this.setState({ showModal: false })}
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </LanguageContext.Consumer>
        );
    }
}

export default AdminOnlineBillsPage;
