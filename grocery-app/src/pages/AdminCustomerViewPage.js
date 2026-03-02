import React from 'react';
import customerService from '../services/customerService';
import LanguageContext from '../context/LanguageContext';
import Spinner from '../components/Spinner';
import { toast } from 'react-toastify';
import { PageHeader } from '../styledComponents/LayoutStyles';
import { TableWrapper } from '../styledComponents/FormStyles';
import { SecondaryButton } from '../styledComponents/ButtonStyles';

class AdminCustomerViewPage extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            customer: null,
            loading: true,
            error: null,
        };
    }

    componentDidMount() {
        this.fetchCustomer();
    }

    fetchCustomer = async () => {
        const id = this.props.customerId;
        this.setState({ loading: true, error: null });
        try {
            const customer = await customerService.getAdminCustomerById(id);
            this.setState({ customer, loading: false });
        } catch (err) {
            this.setState({ loading: false, error: err?.message || 'Failed to load customer' });
            toast.error('Failed to load customer');
        }
    };

    formatDate = (dateStr) => {
        if (!dateStr) return '-';
        const d = new Date(dateStr);
        if (Number.isNaN(d.getTime())) return '-';
        return (
            d.toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
            }) +
            ' | ' +
            d.toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit',
            })
        );
    };

    render() {
        const { customer, loading, error } = this.state;
        const { onGoBack } = this.props;

        if (loading) return <Spinner fullPage text="Loading customer details..." />;

        return (
            <LanguageContext.Consumer>
                {(langCtx) => (
                    <div>
                        <PageHeader>
                            <div className="d-flex align-items-center gap-3 mb-2">
                                {onGoBack && (
                                    <SecondaryButton onClick={onGoBack} style={{ padding: '0.35rem 0.75rem' }}>
                                        ← {langCtx.getText('back')}
                                    </SecondaryButton>
                                )}
                                <h1 style={{ margin: 0 }}>👤 {langCtx.getText('customerDetails')}</h1>
                            </div>
                            <p>Full customer analytics</p>
                        </PageHeader>

                        {error && <div className="alert alert-danger">{error}</div>}
                        {!customer && !error && <div className="alert alert-warning">{langCtx.getText('notFound')}</div>}

                        {customer && (
                            <TableWrapper>
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Field</th>
                                            <th>Value</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td className="fw-semibold">Customer Name</td>
                                            <td>{customer.name || '-'}</td>
                                        </tr>
                                        <tr>
                                            <td className="fw-semibold">Phone Number</td>
                                            <td>{customer.phone || '-'}</td>
                                        </tr>
                                        <tr>
                                            <td className="fw-semibold">Place</td>
                                            <td>{customer.place || '-'}</td>
                                        </tr>
                                        <tr>
                                            <td className="fw-semibold">Total Orders</td>
                                            <td>{Number(customer.total_orders || 0)}</td>
                                        </tr>
                                        <tr>
                                            <td className="fw-semibold">Completed Orders Count</td>
                                            <td>{Number(customer.completed_orders || 0)}</td>
                                        </tr>
                                        <tr>
                                            <td className="fw-semibold">Rejected Orders Count</td>
                                            <td>{Number(customer.rejected_orders || 0)}</td>
                                        </tr>
                                        <tr>
                                            <td className="fw-semibold">Total Amount Spent (Completed)</td>
                                            <td className="fw-bold">₹{Number(customer.total_spent || 0).toFixed(2)}</td>
                                        </tr>
                                        <tr>
                                            <td className="fw-semibold">Last Order Date (Completed)</td>
                                            <td>{this.formatDate(customer.last_completed_date)}</td>
                                        </tr>
                                        <tr>
                                            <td className="fw-semibold">Last Order Date (Rejected)</td>
                                            <td>{this.formatDate(customer.last_rejected_date)}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </TableWrapper>
                        )}
                    </div>
                )}
            </LanguageContext.Consumer>
        );
    }
}

export default AdminCustomerViewPage;
