import React from 'react';
import billService from '../services/billService';
import LanguageContext from '../context/LanguageContext';
import Spinner from '../components/Spinner';
import { toast } from 'react-toastify';
import { PageHeader } from '../styledComponents/LayoutStyles';
import { TableWrapper, Badge } from '../styledComponents/FormStyles';
import { SecondaryButton } from '../styledComponents/ButtonStyles';

class BillDetailsPage extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            bill: null,
            loading: true,
            error: null,
        };
    }

    componentDidMount() {
        this.fetchBillDetails();
    }

    fetchBillDetails = async () => {
        const { billId } = this.props;
        this.setState({ loading: true });
        try {
            const bill = await billService.getBillDetails(billId);
            this.setState({ bill, loading: false });
        } catch (err) {
            this.setState({ error: 'Bill not found', loading: false });
            toast.error('Failed to load bill details');
        }
    };

    formatDate = (dateStr) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    render() {
        const { bill, loading, error } = this.state;
        const { onGoBack } = this.props;

        if (loading) return <Spinner fullPage text="Loading bill details..." />;

        return (
            <LanguageContext.Consumer>
                {(langCtx) => {
                    if (error) return <div className="alert alert-danger">{langCtx.getText('notFound')}</div>;
                    if (!bill) return <div className="alert alert-warning">{langCtx.getText('notFound')}</div>;

                    return (
                        <div>
                            <PageHeader>
                                <div className="d-flex align-items-center gap-3 mb-2">
                                    {onGoBack && (
                                        <SecondaryButton onClick={onGoBack} style={{ padding: '0.35rem 0.75rem' }}>
                                            ← {langCtx.getText('back')}
                                        </SecondaryButton>
                                    )}
                                    <h1 style={{ margin: 0 }}>🧾 {langCtx.getText('billId')} #{bill.id}</h1>
                                </div>
                                <p>{langCtx.getText('generatedOn')} {this.formatDate(bill.date)}</p>
                            </PageHeader>

                            <div className="row g-4">
                                <div className="col-12 col-lg-8">
                                    <TableWrapper>
                                        <table className="table">
                                            <thead>
                                                <tr>
                                                    <th>{langCtx.getText('productName')}</th>
                                                    <th className="text-center">{langCtx.getText('price')}</th>
                                                    <th className="text-center">{langCtx.getText('quantity')}</th>
                                                    <th className="text-end">{langCtx.getText('total')}</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {bill.items.map((item, idx) => (
                                                    <tr key={idx}>
                                                        <td className="fw-semibold">{item.name}</td>
                                                        <td className="text-center">₹{item.price.toFixed(2)}</td>
                                                        <td className="text-center">{item.quantity}</td>
                                                        <td className="text-end fw-bold" style={{ color: '#2E7D32' }}>
                                                            ₹{item.total.toFixed(2)}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            <tfoot>
                                                <tr>
                                                    <td colSpan="3" className="text-end fw-bold fs-5">
                                                        {langCtx.getText('billAmount')}
                                                    </td>
                                                    <td className="text-end fw-bold fs-5" style={{ color: '#2E7D32' }}>
                                                        ₹{bill.grandTotal.toFixed(2)}
                                                    </td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </TableWrapper>
                                </div>

                                <div className="col-12 col-lg-4">
                                    <div style={{
                                        background: 'white',
                                        borderRadius: '10px',
                                        padding: '1.5rem',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
                                        border: '1px solid #e9ecef',
                                    }}>
                                        <h5 className="fw-bold mb-3" style={{ fontFamily: "'Outfit', sans-serif" }}>
                                            {langCtx.getText('billDetails')}
                                        </h5>
                                        <div className="mb-2">
                                            <small className="text-muted">{langCtx.getText('billNumber')}</small>
                                            <div className="fw-bold">#{bill.id}</div>
                                        </div>
                                        <div className="mb-2">
                                            <small className="text-muted">{langCtx.getText('billDate')}</small>
                                            <div className="fw-semibold">{this.formatDate(bill.date)}</div>
                                        </div>
                                        <div className="mb-2">
                                            <small className="text-muted">{langCtx.getText('items')}</small>
                                            <div className="fw-semibold">{bill.items.length} {langCtx.getText('items')}</div>
                                        </div>
                                        <div className="mb-2">
                                            <small className="text-muted">{langCtx.getText('paymentMethod')}</small>
                                            <div>
                                                <Badge className={
                                                    bill.paymentMethod === 'Cash'
                                                        ? 'badge-success'
                                                        : bill.paymentMethod === 'Card'
                                                            ? 'badge-info'
                                                            : 'badge-warning'
                                                }>
                                                    {bill.paymentMethod}
                                                </Badge>
                                            </div>
                                        </div>
                                        <hr />
                                        <div className="d-flex justify-content-between">
                                            <span className="fs-5 fw-bold">{langCtx.getText('total')}</span>
                                            <span className="fs-5 fw-bold" style={{ color: '#2E7D32' }}>
                                                ₹{bill.grandTotal.toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                }}
            </LanguageContext.Consumer>
        );
    }
}

export default BillDetailsPage;
