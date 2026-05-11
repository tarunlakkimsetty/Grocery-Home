import React from 'react';
import orderService from '../services/orderService';
import LanguageContext from '../context/LanguageContext';
import Spinner from '../components/Spinner';
import { toast } from 'react-toastify';
import { PageHeader } from '../styledComponents/LayoutStyles';
import OrderImagesModal from '../components/OrderImagesModal';
import { printOrderBill } from '../utils/printBill';
import BillActionButton from '../components/BillActionButton';
import {
    TableWrapper,
    Badge,
    EmptyState,
    ModalOverlay,
    ModalContent,
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

class AdminOfflineBillsPage extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            bills: [],
            loading: true,
            error: null,
            printLoadingByOrder: {},

            searchQuery: '',
            selectedOrder: null,
            showModal: false,
            imagesModalOpen: false,
            imagesModalEntityType: 'order',
            imagesModalEntityId: null,
            imagesModalTitle: '',
            imagesModalOrderType: 'Offline',
        };
    }

    componentDidMount() {
        this.fetchBills();
    }

    fetchBills = async () => {
        this.setState({ loading: true });
        try {
            const orderTypeProp = String(this.props.orderType || '').trim().toLowerCase();
            let bills;
            if (orderTypeProp === 'list_converted') {
                bills = await orderService.getConvertedBills();
            } else {
                bills = await orderService.getBillsOrders('Offline');
            }
            this.setState({ bills: Array.isArray(bills) ? bills : [], loading: false });
        } catch (err) {
            this.setState({ error: 'Failed to load offline bills', loading: false });
            toast.error('Failed to load offline bills');
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

    handleViewImages = (order) => {
        if (!order?.id) return;
        this.setState({
            imagesModalOpen: true,
            imagesModalEntityType: 'order',
            imagesModalEntityId: order.id,
            imagesModalTitle: `Order Images - #${order.id}`,
            imagesModalOrderType: order.orderType || this.props.orderType || 'Offline',
        });
    };
    canPrintBill = (order) => {
        const status = String(order?.status || '').trim().toLowerCase();
        return status === 'completed' || status === 'delivered' || status === 'finalized';
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
            await printOrderBill(order);
        } catch (err) {
            const message = err?.response?.data?.errorKey || err?.response?.data?.message || err?.message || 'Failed to open printable bill';
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
            imagesModalEntityId: null,
            imagesModalTitle: '',
        });
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
                    <h3>No offline bills</h3>
                    <p>No Completed/Rejected offline orders yet.</p>
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
                                            <div className="d-flex justify-content-center flex-wrap" style={{ gap: '0.45rem' }}>
                                                <button
                                                    type="button"
                                                    className="btn btn-outline-primary btn-sm"
                                                    onClick={() => this.handleViewOrder(order.id)}
                                                >
                                                    View
                                                </button>
                                                {this.canPrintBill(order) && (
                                                    <BillActionButton
                                                        type="button"
                                                        className="btn-primary-soft"
                                                        onClick={() => this.handlePrintBill(order)}
                                                        disabled={Boolean(this.state.printLoadingByOrder[order.id])}
                                                    >
                                                        🖨️ {Boolean(this.state.printLoadingByOrder[order.id]) ? 'Printing...' : 'Print Bill'}
                                                    </BillActionButton>
                                                )}
                                                <button
                                                    type="button"
                                                    className="btn btn-outline-secondary btn-sm"
                                                    onClick={() => this.handleViewImages(order)}
                                                >
                                                    Order Images
                                                </button>
                                            </div>
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
                                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                        <BillCardButton onClick={() => this.handleViewOrder(order.id)}>
                                            👁️ View Details
                                        </BillCardButton>
                                        {this.canPrintBill(order) && (
                                            <BillActionButton
                                                type="button"
                                                className="btn-primary-soft"
                                                onClick={() => this.handlePrintBill(order)}
                                                disabled={Boolean(this.state.printLoadingByOrder[order.id])}
                                            >
                                                🖨️ {Boolean(this.state.printLoadingByOrder[order.id]) ? 'Printing...' : 'Print Bill'}
                                            </BillActionButton>
                                        )}
                                        <BillCardButton onClick={() => this.handleViewImages(order)} style={{ background: '#fff', color: '#2E7D32', border: '1px solid rgba(46,125,50,0.25)' }}>
                                            🖼️ Images
                                        </BillCardButton>
                                    </div>
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
                            <h1>🧾 Offline Bills</h1>
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

                        {loading && <Spinner fullPage text="Loading offline bills..." />}
                        {error && <div className="alert alert-danger">{error}</div>}

                        {!loading && !error && this.renderBillsTable(filtered)}

                        {this.state.showModal && this.state.selectedOrder && (
                            <ModalOverlay onClick={() => this.setState({ showModal: false })}>
                                <ModalContent style={{ maxWidth: '720px' }} onClick={(e) => e.stopPropagation()}>
                                    <div className="modal-header">
                                        <h3>Order Details</h3>
                                        <button className="close-btn" onClick={() => this.setState({ showModal: false })}>×</button>
                                    </div>
                                    <div className="modal-body">
                                        <div className="row g-3 mb-3">
                                            <div className="col-12 col-md-6"><div className="text-muted small">Order ID</div><div className="fw-semibold">{this.state.selectedOrder.id}</div></div>
                                            <div className="col-12 col-md-6"><div className="text-muted small">Customer</div><div className="fw-semibold">{this.state.selectedOrder.customerName || '-'}</div></div>
                                            <div className="col-12 col-md-6"><div className="text-muted small">Phone</div><div className="fw-semibold">{this.state.selectedOrder.phone || '-'}</div></div>
                                            <div className="col-12 col-md-6"><div className="text-muted small">Order Type</div><div className="fw-semibold">{this.state.selectedOrder.orderType || '-'}</div></div>
                                            <div className="col-12 col-md-6"><div className="text-muted small">Status</div><div className="fw-semibold">{this.state.selectedOrder.status || '-'}</div></div>
                                            <div className="col-12 col-md-6"><div className="text-muted small">Date</div><div className="fw-semibold">{this.formatDate(this.getBillDate(this.state.selectedOrder) || this.state.selectedOrder.orderDate || this.state.selectedOrder.date)}</div></div>
                                            <div className="col-12"><div className="text-muted small">Payment Mode</div><div className="fw-semibold">{this.state.selectedOrder.paymentMethod || this.state.selectedOrder.paymentMode || (this.state.selectedOrder.orderType === 'Offline' ? 'Cash' : '-')}</div></div>
                                        </div>
                                        <h4 style={{ marginBottom: '0.6rem' }}>Items</h4>
                                        <div style={{ border: '1px solid #e9ecef', borderRadius: '8px', overflow: 'auto', marginBottom: '0.85rem' }}>
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
                                                            <td style={{ padding: '0.55rem 0.75rem', fontSize: '0.88rem', fontWeight: 600 }}>{item.productName || item.name || '—'}</td>
                                                            <td className="text-center" style={{ padding: '0.55rem 0.5rem', fontSize: '0.88rem' }}>{item.quantity}</td>
                                                            <td className="text-end" style={{ padding: '0.55rem 0.75rem', fontSize: '0.88rem' }}>₹{Number(item.price || 0).toFixed(2)}</td>
                                                            <td className="text-end fw-bold" style={{ padding: '0.55rem 0.75rem', fontSize: '0.88rem' }}>₹{Number(item.subtotal !== null && item.subtotal !== undefined ? item.subtotal : item.total !== null && item.total !== undefined ? item.total : (Number(item.price || 0) * Number(item.quantity || 0))).toFixed(2)}</td>
                                                        </tr>
                                                    ))}
                                                    {(!this.state.selectedOrder.items || this.state.selectedOrder.items.length === 0) && (
                                                        <tr>
                                                            <td colSpan={4} className="text-center text-muted" style={{ padding: '0.75rem' }}>No items found for this order.</td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                        <div className="d-flex justify-content-between align-items-center" style={{ marginBottom: '0.25rem' }}>
                                            <span className="text-muted fw-semibold">Grand Total</span>
                                            <span className="fw-bold" style={{ fontSize: '1.05rem' }}>
                                                ₹{Number(this.state.selectedOrder.totalAmount ?? this.state.selectedOrder.grandTotal ?? 0).toFixed(2)}
                                                {(() => {
                                                    const status = String(this.state.selectedOrder?.status || '').trim();
                                                    if (status === 'Completed') return <span className="text-success fw-semibold" style={{ marginLeft: '0.4rem', fontSize: '0.95rem' }}>(Paid)</span>;
                                                    if (status === 'Rejected') return <span className="text-danger fw-semibold" style={{ marginLeft: '0.4rem', fontSize: '0.95rem' }}>(Unpaid)</span>;
                                                    return null;
                                                })()}
                                            </span>
                                        </div>

                                        {(() => {
                                            const history = Array.isArray(this.state.selectedOrder?.paymentHistory)
                                                ? this.state.selectedOrder.paymentHistory
                                                : (Array.isArray(this.state.selectedOrder?.paymentUpdates) ? this.state.selectedOrder.paymentUpdates : []);
                                            const totalPaid = Number(this.state.selectedOrder?.advanceAmount ?? this.state.selectedOrder?.amountPaid ?? 0) || 0;
                                            const remaining = Number(this.state.selectedOrder?.remainingBalance ?? this.state.selectedOrder?.remainingAmount ?? 0) || 0;
                                            if (history.length === 0 && totalPaid <= 0) return null;

                                            return (
                                                <div style={{
                                                    background: '#fff',
                                                    border: '1px solid #e9ecef',
                                                    borderRadius: '8px',
                                                    padding: '0.9rem 1rem',
                                                    marginTop: '1rem',
                                                }}>
                                                    <div className="fw-bold mb-2" style={{ fontFamily: "'Outfit', sans-serif" }}>
                                                        🧾 Payment Update History
                                                    </div>

                                                    {history.length > 0 && (
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: '220px', overflowY: 'auto', paddingRight: '0.25rem' }}>
                                                            {history.map((entry, index) => {
                                                                const delta = Number(entry?.deltaAmount || entry?.amount || 0) || 0;
                                                                const amount = Math.abs(delta);
                                                                const label = delta >= 0 ? 'Amount Paid Added' : 'Amount Paid Reduced';
                                                                const when = this.formatDate(entry?.createdAt || entry?.updatedAt || entry?.date);
                                                                return (
                                                                    <div key={String(entry?.id ?? index)} style={{
                                                                        border: '1px solid #f1f3f5',
                                                                        background: '#f8f9fa',
                                                                        borderRadius: '8px',
                                                                        padding: '0.65rem 0.8rem',
                                                                    }}>
                                                                        <div className="d-flex justify-content-between align-items-center" style={{ gap: '0.75rem' }}>
                                                                            <div className="fw-semibold" style={{ fontSize: '0.92rem' }}>{label}: ₹{amount.toFixed(2)}</div>
                                                                            <div className="text-muted" style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{when}</div>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    )}

                                                    <div className="d-flex justify-content-between align-items-center mt-3" style={{ fontSize: '0.9rem' }}>
                                                        <span className="text-muted fw-semibold">Total Amount Paid</span>
                                                        <span className="fw-bold">₹{totalPaid.toFixed(2)}</span>
                                                    </div>

                                                    <div className="d-flex justify-content-between align-items-center mt-2" style={{ fontSize: '0.9rem' }}>
                                                        <span className="text-muted fw-semibold">Remaining Amount</span>
                                                        <span className="fw-bold" style={{ color: remaining < 0 ? '#c62828' : '#2E7D32' }}>₹{remaining.toFixed(2)}</span>
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                    <div className="modal-footer">
                                        <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => this.setState({ showModal: false })}>Close</button>
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
                            allowUpload={true}
                            orderType={this.state.imagesModalOrderType}
                        />
                    </div>
                )}
            </LanguageContext.Consumer>
        );
    }
}

export default AdminOfflineBillsPage;
