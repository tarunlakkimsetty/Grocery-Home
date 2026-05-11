import React from 'react';
import AdminOfflineBillsPage from './AdminOfflineBillsPage';
import orderService from '../services/orderService';
import { ModalOverlay, ModalContent } from '../styledComponents/FormStyles';
import OrderImagesModal from '../components/OrderImagesModal';

/**
 * AdminListOrderBillsPage
 * Shows finalized (completed or rejected) converted list orders
 * Reuses AdminOfflineBillsPage finalized-bills UI with custom data fetcher for list order bills
 * 
 * Key characteristics:
 * - Data source: converted list orders only (origin='list_orders', type='list_converted')
 * - Status filter: ONLY completed or rejected (finalized)
 * - No editable controls (all actions are read-only/view-only)
 * - Complete data isolation from Offline Bills
 */
class AdminListOrderBillsPage extends React.Component {
    render() {
        // Extend AdminOfflineBillsPage (finalized bills layout) with custom fetcher for list order bills
        const PageComponent = class extends AdminOfflineBillsPage {
            // Override fetchBills to fetch converted list order bills instead of offline bills
            fetchBills = async () => {
                this.setState({ loading: true });
                try {
                    // Fetch converted list order bills (completed/rejected only)
                    const orders = await orderService.getListOrderBills();
                    const safeOrders = Array.isArray(orders) ? orders : [];
                    this.setState({
                        bills: safeOrders,
                        loading: false,
                        error: null
                    });
                } catch (err) {
                    this.setState({ 
                        error: 'Failed to load list order bills', 
                        loading: false 
                    });
                }
            };

            // Customize page header and include modal for list order bills
            render() {
                const { bills, loading, error } = this.state;
                const safeBills = Array.isArray(bills) ? bills : [];
                const filtered = this.filterBills(safeBills);

                return (
                    <div>
                        {/* Custom header for list order bills */}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'baseline',
                            marginBottom: '1.5rem'
                        }}>
                            <div>
                                <h1 style={{ margin: '0 0 0.3rem 0' }}>📋 List Order Bills</h1>
                                <p style={{ margin: '0', color: '#666', fontSize: '0.95rem' }}>
                                    {filtered.length} finalized orders • Completed / Rejected
                                </p>
                            </div>
                        </div>

                        {/* Reuse search input from parent */}
                        <div className="mb-3" style={{ maxWidth: '520px' }}>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Search by Order ID / Customer Name / Phone Number"
                                value={this.state.searchQuery}
                                onChange={this.handleSearchChange}
                            />
                        </div>

                        {/* Reuse loading/error/table rendering from parent */}
                        {loading && <div style={{ textAlign: 'center', padding: '2rem' }}>Loading...</div>}
                        {error && <div className="alert alert-danger">{error}</div>}
                        {!loading && !error && this.renderBillsTable(filtered)}

                        {/* Modal for viewing order details - inherited from parent with custom styling */}
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
                                            <div className="col-12"><div className="text-muted small">Payment Mode</div><div className="fw-semibold">{this.state.selectedOrder.paymentMethod || this.state.selectedOrder.paymentMode || 'N/A'}</div></div>
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
                            onClose={this.closeImagesModal || (() => this.setState({ imagesModalOpen: false, imagesModalEntityId: null, imagesModalTitle: '' }))}
                            entityType={this.state.imagesModalEntityType}
                            entityId={this.state.imagesModalEntityId}
                            title={this.state.imagesModalTitle}
                            allowUpload={true}
                            orderType={this.state.imagesModalOrderType}
                        />
                    </div>
                );
            }
        };

        return <PageComponent />;
    }
}

export default AdminListOrderBillsPage;
