import React from 'react';
import { Navigate } from 'react-router-dom';
import billService from '../services/billService';
import LanguageContext from '../context/LanguageContext';
import Spinner from '../components/Spinner';
import { toast } from 'react-toastify';
import { PageHeader } from '../styledComponents/LayoutStyles';
import { TableWrapper, PaginationWrapper, Badge, EmptyState } from '../styledComponents/FormStyles';

const ITEMS_PER_PAGE = 10;

class AdminBillsPage extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            bills: [],
            loading: true,
            error: null,
            currentPage: 1,
            redirectTo: null,
        };
    }

    componentDidMount() {
        this.fetchAllBills();
    }

    fetchAllBills = async () => {
        this.setState({ loading: true });
        try {
            const response = await billService.getAllBills();
            // Handle both { success, data: [...] } and direct array responses
            const bills = Array.isArray(response) 
                ? response 
                : (response?.data || response?.bills || []);
            this.setState({ bills, loading: false });
        } catch (err) {
            this.setState({ error: 'Failed to load bills', loading: false });
            toast.error('Failed to load bills');
        }
    };

    formatDate = (dateStr) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    render() {
        if (this.state.redirectTo) {
            return <Navigate to={this.state.redirectTo} />;
        }

        const { bills, loading, error, currentPage } = this.state;
        // Safety fallback: ensure bills is always an array
        const safeBills = Array.isArray(bills) ? bills : [];
        const totalPages = Math.ceil(safeBills.length / ITEMS_PER_PAGE);
        const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
        const visibleBills = safeBills.slice(startIdx, startIdx + ITEMS_PER_PAGE);

        const totalRevenue = safeBills.reduce((sum, b) => sum + (b.grandTotal || 0), 0);

        return (
            <LanguageContext.Consumer>
                {(langCtx) => (
                    <div>
                        <PageHeader>
                            <h1>🧾 {langCtx.getText('allBills')}</h1>
                            <p>{safeBills.length} {langCtx.getText('items')} • {langCtx.getText('paymentMethod')}: ₹{totalRevenue.toFixed(2)}</p>
                        </PageHeader>

                        {loading && <Spinner fullPage text="Loading bills..." />}
                        {error && <div className="alert alert-danger">{error}</div>}

                        {!loading && !error && safeBills.length === 0 && (
                            <EmptyState>
                                <div className="empty-icon">🧾</div>
                                <h3>{langCtx.getText('noDataAvailable')}</h3>
                                <p>{langCtx.getText('noAnalyticsData')}</p>
                            </EmptyState>
                        )}

                        {!loading && !error && safeBills.length > 0 && (
                            <TableWrapper $clickable>
                                <table className="table">
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
                                        {visibleBills.map((bill) => (
                                            <tr
                                                key={bill.id}
                                                onClick={() => this.setState({ redirectTo: `/bill/${bill.id}` })}
                                                style={{ cursor: 'pointer' }}
                                            >
                                                <td className="fw-bold">#{bill.id}</td>
                                                <td>{this.formatDate(bill.date)}</td>
                                                <td>{bill.items.length} {langCtx.getText('items')}</td>
                                                <td>
                                                    <Badge
                                                        className={
                                                            bill.paymentMethod === 'Cash'
                                                                ? 'badge-success'
                                                                : bill.paymentMethod === 'Card'
                                                                    ? 'badge-info'
                                                                    : 'badge-warning'
                                                        }
                                                    >
                                                        {bill.paymentMethod}
                                                    </Badge>
                                                </td>
                                                <td className="text-end fw-bold" style={{ color: '#2E7D32' }}>
                                                    ₹{bill.grandTotal.toFixed(2)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                {totalPages > 1 && (
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
                                )}
                            </TableWrapper>
                        )}
                    </div>
                )}
            </LanguageContext.Consumer>
        );
    }
}

export default AdminBillsPage;
