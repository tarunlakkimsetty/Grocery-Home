import React from 'react';
import orderService from '../services/orderService';
import LanguageContext from '../context/LanguageContext';
import Spinner from '../components/Spinner';
import { toast } from 'react-toastify';
import { PageHeader } from '../styledComponents/LayoutStyles';
import { TableWrapper, Badge, EmptyState } from '../styledComponents/FormStyles';

class AdminBillsPage extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            onlineBills: [],
            offlineBills: [],
            loading: true,
            error: null,

            // Search + View modal
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
            const { searchQuery } = this.state;
            const [onlineBills, offlineBills] = await Promise.all([
                orderService.getBillsOrders('Online', searchQuery),
                orderService.getBillsOrders('Offline', searchQuery),
            ]);

            this.setState({
                onlineBills: Array.isArray(onlineBills) ? onlineBills : [],
                offlineBills: Array.isArray(offlineBills) ? offlineBills : [],
                loading: false,
            });
        } catch (err) {
            this.setState({ error: 'Failed to load bills', loading: false });
            toast.error('Failed to load bills');
        }
    };

    handleSearchChange = (e) => {
        this.setState({ searchQuery: e.target.value }, () => this.fetchBills());
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

    renderBillsTable = (orders, emptyLabel) => {
        const safeOrders = Array.isArray(orders) ? orders : [];
        if (safeOrders.length === 0) {
            return (
                <EmptyState>
                    <div className="empty-icon">🧾</div>
                    <h3>{emptyLabel}</h3>
                    <p>No Completed/Rejected orders yet.</p>
                </EmptyState>
            );
        }

        return (
            <TableWrapper>
                <table className="table">
                    <thead>
                        <tr>
                            <th>Order ID</th>
                            <th>Customer Name</th>
                            <th className="text-end">Total Amount</th>
                            <th>Status</th>
                            <th>Date</th>
                            <th className="text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {safeOrders.map((order) => (
                            <tr key={order.id}>
                                <td className="fw-bold">#{order.id}</td>
                                <td>{order.customerName || '-'}</td>
                                <td className="text-end fw-bold">₹{Number(order.totalAmount || 0).toFixed(2)}</td>
                                <td>
                                    <Badge className={this.getStatusBadgeClass(order.status)}>
                                        {order.status}
                                    </Badge>
                                </td>
                                <td>{this.formatDate(this.getBillDate(order))}</td>
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
        );
    };

    render() {
        const { onlineBills, offlineBills, loading, error } = this.state;
        const onlineCount = Array.isArray(onlineBills) ? onlineBills.length : 0;
        const offlineCount = Array.isArray(offlineBills) ? offlineBills.length : 0;

        return (
            <LanguageContext.Consumer>
                {(langCtx) => (
                    <div>
                        <PageHeader>
                            <h1>🧾 Bills</h1>
                            <p>{onlineCount + offlineCount} orders • Completed / Rejected</p>
                        </PageHeader>

                        <div className="mb-3" style={{ maxWidth: '420px' }}>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Search by Customer Name"
                                value={this.state.searchQuery}
                                onChange={this.handleSearchChange}
                            />
                        </div>

                        {loading && <Spinner fullPage text="Loading bills..." />}
                        {error && <div className="alert alert-danger">{error}</div>}

                        {!loading && !error && (
                            <>
                                <h3 style={{ marginTop: '1rem' }}>Online Bills</h3>
                                {this.renderBillsTable(onlineBills, 'No online bills')}

                                <h3 style={{ marginTop: '1.5rem' }}>Offline Bills</h3>
                                {this.renderBillsTable(offlineBills, 'No offline bills')}
                            </>
                        )}

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
                                    <p><strong>Total:</strong> ₹{Number(this.state.selectedOrder.totalAmount ?? this.state.selectedOrder.grandTotal ?? 0).toFixed(2)}</p>
                                    <p><strong>Date:</strong> {this.formatDate(this.getBillDate(this.state.selectedOrder) || this.state.selectedOrder.orderDate || this.state.selectedOrder.date)}</p>
                                    <p><strong>Payment Status:</strong> {this.state.selectedOrder.paymentStatus || '-'}</p>

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

export default AdminBillsPage;
