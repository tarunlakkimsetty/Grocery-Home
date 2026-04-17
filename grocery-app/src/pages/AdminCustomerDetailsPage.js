import React from 'react';
import { Link } from 'react-router-dom';
import customerService from '../services/customerService';
import LanguageContext from '../context/LanguageContext';
import Spinner from '../components/Spinner';
import { toast } from 'react-toastify';
import { PageHeader } from '../styledComponents/LayoutStyles';
import { TableWrapper, EmptyState, 
    MobileCustomersWrapper,
    DesktopCustomersWrapper,
    CustomerCard,
    CustomerCardHeader,
    CustomerCardTitle,
    CustomerCardRow,
    CustomerCardLabel,
    CustomerCardValue,
    CustomerCardFooter,
    CustomerCardButton,
} from '../styledComponents/FormStyles';
import { t } from '../utils/i18n';
import feedbackService from '../services/feedbackService';
import { searchCustomers } from '../utils/searchUtils';

class AdminCustomerDetailsPage extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            customers: [],
            loading: true,
            fetching: false,
            error: null,
            search: '',
            overallRating: null,
            overallCount: 0,
        };

        this._debounceTimer = null;
        this._fetchSeq = 0;
    }

    componentDidMount() {
        this.fetchCustomers('', { isInitial: true });
        this.fetchOverallRating();
    }

    fetchOverallRating = async () => {
        try {
            const summary = await feedbackService.getAdminSummary();
            this.setState({
                overallRating: summary?.overall_rating === null || summary?.overall_rating === undefined ? null : Number(summary.overall_rating),
                overallCount: Number(summary?.rating_count || 0),
            });
        } catch (err) {
            // Non-blocking for the page.
        }
    };

    componentWillUnmount() {
        if (this._debounceTimer) {
            clearTimeout(this._debounceTimer);
        }
        this._debounceTimer = null;
    }

    fetchCustomers = async (search, { isInitial = false } = {}) => {
        const seq = ++this._fetchSeq;

        if (isInitial) {
            this.setState({ loading: true, error: null });
        } else {
            this.setState({ fetching: true, error: null });
        }
        try {
            const customers = await customerService.getAdminCustomers(search);

            // Prevent stale responses from overwriting latest search.
            if (seq !== this._fetchSeq) return;

            this.setState({
                customers: Array.isArray(customers) ? customers : [],
                loading: false,
                fetching: false,
            });
        } catch (err) {
            if (seq !== this._fetchSeq) return;
            this.setState({
                loading: false,
                fetching: false,
                error: err?.message || t('failedToLoadCustomers'),
            });
            toast.error(t('failedToLoadCustomers'));
        }
    };

    handleSearchChange = (e) => {
        const value = e?.target?.value ?? '';
        this.setState({ search: value });

        if (this._debounceTimer) {
            clearTimeout(this._debounceTimer);
        }

        this._debounceTimer = setTimeout(() => {
            this.fetchCustomers(value);
        }, 250);
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
        const unsafeCustomers = Array.isArray(this.state.customers) ? this.state.customers : [];
        // Apply enhanced search with Telugu support
        const safe = this.state.search.trim()
            ? searchCustomers(unsafeCustomers, this.state.search)
            : unsafeCustomers;
        
        if (safe.length === 0) {
            return (
                <EmptyState>
                    <div className="empty-icon">👤</div>
                    <h3>{langCtx.getText('customerDetails')}</h3>
                    <p>{langCtx.getText('noCustomersFound')}</p>
                </EmptyState>
            );
        }

        return (
            <>
                {/* Desktop Table */}
                <DesktopCustomersWrapper>
                    <TableWrapper>
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>{langCtx.getText('name')}</th>
                                    <th>{langCtx.getText('phone')}</th>
                                    <th>{langCtx.getText('place')}</th>
                                    <th className="text-center">Avg Rating</th>
                                    <th className="text-center">{langCtx.getText('completed')}</th>
                                    <th className="text-center">{langCtx.getText('rejected')}</th>
                                    <th className="text-end">{langCtx.getText('totalSpent')}</th>
                                    <th>{langCtx.getText('lastCompleted')}</th>
                                    <th>{langCtx.getText('lastRejected')}</th>
                                    <th className="text-center">{langCtx.getText('view')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {safe.map((c) => (
                                    <tr key={c.id}>
                                        <td className="fw-semibold">{c.name || '-'}</td>
                                        <td>{c.phone || '-'}</td>
                                        <td>{c.place || '-'}</td>
                                        <td className="text-center">
                                            {c.avg_rating === null || c.avg_rating === undefined
                                                ? '-'
                                                : `${Number(c.avg_rating).toFixed(1)} ★`}
                                        </td>
                                        <td className="text-center">{Number(c.completed_orders || 0)}</td>
                                        <td className="text-center">{Number(c.rejected_orders || 0)}</td>
                                        <td className="text-end fw-bold">₹{Number(c.total_spent || 0).toFixed(2)}</td>
                                        <td>{this.formatDate(c.last_completed_date)}</td>
                                        <td>{this.formatDate(c.last_rejected_date)}</td>
                                        <td className="text-center">
                                            <Link to={`/admin/customers/${c.id}`} className="btn btn-sm btn-outline-primary">
                                                {langCtx.getText('view')}
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </TableWrapper>
                </DesktopCustomersWrapper>

                {/* Mobile Cards */}
                <MobileCustomersWrapper>
                    <div>
                        {safe.map((c) => (
                            <CustomerCard key={c.id}>
                                <CustomerCardHeader>
                                    <CustomerCardTitle>
                                        <div className="customer-name">{c.name || '-'}</div>
                                        <div className="customer-rating">
                                            {c.avg_rating === null || c.avg_rating === undefined
                                                ? '—'
                                                : `${Number(c.avg_rating).toFixed(1)} ⭐`}
                                        </div>
                                    </CustomerCardTitle>
                                </CustomerCardHeader>

                                <CustomerCardRow>
                                    <CustomerCardLabel>📞 Phone:</CustomerCardLabel>
                                    <CustomerCardValue>{c.phone || '-'}</CustomerCardValue>
                                </CustomerCardRow>

                                <CustomerCardRow>
                                    <CustomerCardLabel>📍 Place:</CustomerCardLabel>
                                    <CustomerCardValue>{c.place || '-'}</CustomerCardValue>
                                </CustomerCardRow>

                                <CustomerCardRow>
                                    <CustomerCardLabel>✅ Completed:</CustomerCardLabel>
                                    <CustomerCardValue className="count">{Number(c.completed_orders || 0)}</CustomerCardValue>
                                </CustomerCardRow>

                                <CustomerCardRow>
                                    <CustomerCardLabel>❌ Rejected:</CustomerCardLabel>
                                    <CustomerCardValue className="count">{Number(c.rejected_orders || 0)}</CustomerCardValue>
                                </CustomerCardRow>

                                <CustomerCardRow>
                                    <CustomerCardLabel>💰 Total Spent:</CustomerCardLabel>
                                    <CustomerCardValue className="amount">₹{Number(c.total_spent || 0).toFixed(2)}</CustomerCardValue>
                                </CustomerCardRow>

                                <CustomerCardFooter>
                                    <CustomerCardButton as={Link} to={`/admin/customers/${c.id}`}>
                                        👁️ View Profile
                                    </CustomerCardButton>
                                </CustomerCardFooter>
                            </CustomerCard>
                        ))}
                    </div>
                </MobileCustomersWrapper>
            </>
        );
    };

    render() {
        const { loading, error, search, overallRating, overallCount } = this.state;
        if (loading) return <Spinner fullPage text={t('loadingCustomers')} />;

        return (
            <LanguageContext.Consumer>
                {(langCtx) => (
                    <div>
                        <PageHeader>
                            <h1>🧾 {langCtx.getText('customerDetails')}</h1>
                            <p>{langCtx.getText('customerAnalyticsSubtitle')}</p>
                        </PageHeader>

                        <div className="alert alert-light" style={{ border: '1px solid #e9ecef' }}>
                            <div className="d-flex justify-content-between align-items-center" style={{ gap: '1rem', flexWrap: 'wrap' }}>
                                <div className="fw-semibold">Overall Store Rating</div>
                                <div className="fw-bold">
                                    {overallRating === null || overallRating === undefined
                                        ? '—'
                                        : `${Number(overallRating).toFixed(1)} ★`}
                                    <span className="text-muted" style={{ marginLeft: '0.5rem', fontWeight: 500 }}>
                                        ({Number(overallCount || 0)} ratings)
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="mb-3">
                            <input
                                type="text"
                                className="form-control"
                                placeholder={langCtx.getText('searchByNameOrPhone')}
                                value={search}
                                onChange={this.handleSearchChange}
                            />
                        </div>

                        {error && <div className="alert alert-danger">{error}</div>}
                        {this.renderTable(langCtx)}
                    </div>
                )}
            </LanguageContext.Consumer>
        );
    }
}

export default AdminCustomerDetailsPage;
