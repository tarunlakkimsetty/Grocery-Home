import React from 'react';
import { Link } from 'react-router-dom';
import customerService from '../services/customerService';
import LanguageContext from '../context/LanguageContext';
import Spinner from '../components/Spinner';
import { toast } from 'react-toastify';
import { PageHeader } from '../styledComponents/LayoutStyles';
import { TableWrapper, EmptyState } from '../styledComponents/FormStyles';

class AdminCustomerDetailsPage extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            customers: [],
            loading: true,
            error: null,
        };
    }

    componentDidMount() {
        this.fetchCustomers();
    }

    fetchCustomers = async () => {
        this.setState({ loading: true, error: null });
        try {
            const customers = await customerService.getAdminCustomers();
            this.setState({
                customers: Array.isArray(customers) ? customers : [],
                loading: false,
            });
        } catch (err) {
            this.setState({ loading: false, error: err?.message || 'Failed to load customers' });
            toast.error('Failed to load customers');
        }
    };

    formatDate = (dateStr) => {
        if (!dateStr) return '-';
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

    renderTable = (langCtx) => {
        const safe = Array.isArray(this.state.customers) ? this.state.customers : [];
        if (safe.length === 0) {
            return (
                <EmptyState>
                    <div className="empty-icon">👤</div>
                    <h3>{langCtx.getText('customerDetails')}</h3>
                    <p>No customers found.</p>
                </EmptyState>
            );
        }

        return (
            <TableWrapper>
                <table className="table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Phone</th>
                            <th>Place</th>
                            <th className="text-center">Completed</th>
                            <th className="text-center">Rejected</th>
                            <th className="text-end">Total Spent</th>
                            <th>Last Completed</th>
                            <th>Last Rejected</th>
                            <th className="text-center">View</th>
                        </tr>
                    </thead>
                    <tbody>
                        {safe.map((c) => (
                            <tr key={c.id}>
                                <td className="fw-semibold">{c.name || '-'}</td>
                                <td>{c.phone || '-'}</td>
                                <td>{c.place || '-'}</td>
                                <td className="text-center">{Number(c.completed_orders || 0)}</td>
                                <td className="text-center">{Number(c.rejected_orders || 0)}</td>
                                <td className="text-end fw-bold">₹{Number(c.total_spent || 0).toFixed(2)}</td>
                                <td>{this.formatDate(c.last_completed_date)}</td>
                                <td>{this.formatDate(c.last_rejected_date)}</td>
                                <td className="text-center">
                                    <Link to={`/admin/customers/${c.id}`} className="btn btn-sm btn-outline-primary">
                                        View
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </TableWrapper>
        );
    };

    render() {
        const { loading, error } = this.state;
        if (loading) return <Spinner fullPage text="Loading customers..." />;

        return (
            <LanguageContext.Consumer>
                {(langCtx) => (
                    <div>
                        <PageHeader>
                            <h1>🧾 {langCtx.getText('customerDetails')}</h1>
                            <p>Customer analytics from completed/rejected orders</p>
                        </PageHeader>

                        {error && <div className="alert alert-danger">{error}</div>}
                        {this.renderTable(langCtx)}
                    </div>
                )}
            </LanguageContext.Consumer>
        );
    }
}

export default AdminCustomerDetailsPage;
