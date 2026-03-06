import React from 'react';
import analyticsService from '../services/analyticsService';
import LanguageContext from '../context/LanguageContext';
import Spinner from '../components/Spinner';
import DateSalesSummary from '../components/DateSalesSummary';
import { PageHeader } from '../styledComponents/LayoutStyles';
import { StatsCard } from '../styledComponents/CardStyles';

class AnalyticsPage extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            dashboard: null,
            loading: true,
        };
    }

    componentDidMount() {
        this.fetchData();
    }

    fetchData = async () => {
        try {
            const dashboard = await analyticsService.getDashboard();
            this.setState({ dashboard, loading: false });
        } catch {
            this.setState({ loading: false });
        }
    };

    render() {
        const { dashboard, loading } = this.state;
        if (loading) return <Spinner fullPage text="Loading analytics..." />;

        const totals = dashboard?.totals || {};
        const totalRevenue = Number(totals.totalSales || 0) || 0;
        const totalBillsGenerated = Number(totals.totalBillsGenerated || 0) || 0;
        const totalStockQty = Number(totals.totalStockQty || 0) || 0;
        const salesAnalyticsValue = Number(totals.salesAnalytics || totals.totalSales || 0) || 0;
        const topProducts = Array.isArray(dashboard?.topSellingProducts) ? dashboard.topSellingProducts : [];
        const categoryRows = Array.isArray(dashboard?.categoryAnalytics) ? dashboard.categoryAnalytics : [];
        const paymentMethods = Array.isArray(dashboard?.paymentMethods) ? dashboard.paymentMethods : [];
        const lowStockProducts = Array.isArray(dashboard?.lowStockProducts) ? dashboard.lowStockProducts : [];

        const CATEGORY_NAMES = {
            grains: 'Grains & Pulses',
            milk: 'Milk & Dairy',
            snacks: 'Snacks',
            spices: 'Spices',
            oils: 'Oils',
            condiments: 'Condiments',
            cleaning: 'Cleaning',
            personal: 'Personal Care',
        };

        return (
            <LanguageContext.Consumer>
                {(langCtx) => (
                    <div>
                        <PageHeader>
                            <h1>📊 {langCtx.getText('salesAnalytics')}</h1>
                            <p>{langCtx.getText('dashboardStats')}</p>
                        </PageHeader>

                        {/* Date-based Sales Summary (added feature; existing analytics remain unchanged below) */}
                        <DateSalesSummary />

                        {/* Stats Cards */}
                        <div className="row g-3 mb-4">
                            <div className="col-6 col-lg-3">
                                <StatsCard $gradient="linear-gradient(135deg, #2E7D32, #66BB6A)">
                                    <div className="stats-icon">💰</div>
                                    <div className="stats-value">₹{totalRevenue.toFixed(0)}</div>
                                    <div className="stats-label">{langCtx.getText('totalSales')}</div>
                                </StatsCard>
                            </div>
                            <div className="col-6 col-lg-3">
                                <StatsCard $gradient="linear-gradient(135deg, #1565C0, #42A5F5)">
                                    <div className="stats-icon">🧾</div>
                                    <div className="stats-value">{totalBillsGenerated}</div>
                                    <div className="stats-label">{langCtx.getText('totalBills')}</div>
                                </StatsCard>
                            </div>
                            <div className="col-6 col-lg-3">
                                <StatsCard $gradient="linear-gradient(135deg, #E65100, #FF9800)">
                                    <div className="stats-icon">📦</div>
                                    <div className="stats-value">{totalStockQty}</div>
                                    <div className="stats-label">{langCtx.getText('stock')}</div>
                                </StatsCard>
                            </div>
                            <div className="col-6 col-lg-3">
                                <StatsCard $gradient="linear-gradient(135deg, #7B1FA2, #BA68C8)">
                                    <div className="stats-icon">📈</div>
                                    <div className="stats-value">₹{salesAnalyticsValue.toFixed(0)}</div>
                                    <div className="stats-label">{langCtx.getText('salesAnalytics')}</div>
                                </StatsCard>
                            </div>
                        </div>

                        <div className="row g-4">
                            {/* Top Products */}
                            <div className="col-12 col-lg-6">
                                <div style={{ background: 'white', borderRadius: '10px', padding: '1.5rem', boxShadow: '0 2px 4px rgba(0,0,0,0.08)', border: '1px solid #e9ecef', height: '100%' }}>
                                    <h5 className="fw-bold mb-3" style={{ fontFamily: "'Outfit', sans-serif" }}>
                                        🏆 {langCtx.getText('topProducts')}
                                    </h5>
                                    {topProducts.length === 0 ? (
                                        <p className="text-muted">{langCtx.getText('noAnalyticsData')}</p>
                                    ) : (
                                        <table className="table table-sm">
                                            <thead>
                                                <tr>
                                                    <th style={{ fontSize: '0.8rem' }}>#</th>
                                                    <th style={{ fontSize: '0.8rem' }}>{langCtx.getText('productName')}</th>
                                                    <th style={{ fontSize: '0.8rem' }} className="text-center">{langCtx.getText('quantity')}</th>
                                                    <th style={{ fontSize: '0.8rem' }} className="text-end">{langCtx.getText('totalSales')}</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {topProducts.map((p, i) => (
                                                    <tr key={i}>
                                                        <td className="fw-bold">{i + 1}</td>
                                                        <td>{p.emoji ? `${p.emoji} ` : ''}{p.name}</td>
                                                        <td className="text-center">{Number(p.quantitySold || 0)}</td>
                                                        <td className="text-end fw-bold" style={{ color: '#2E7D32' }}>
                                                            ₹{Number(p.revenue || 0).toFixed(2)}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            </div>

                            {/* Category Overview */}
                            <div className="col-12 col-lg-6">
                                <div style={{ background: 'white', borderRadius: '10px', padding: '1.5rem', boxShadow: '0 2px 4px rgba(0,0,0,0.08)', border: '1px solid #e9ecef', height: '100%' }}>
                                    <h5 className="fw-bold mb-3" style={{ fontFamily: "'Outfit', sans-serif" }}>
                                        📊 {langCtx.getText('selectCategory')}
                                    </h5>
                                    <table className="table table-sm">
                                        <thead>
                                            <tr>
                                                <th style={{ fontSize: '0.8rem' }}>{langCtx.getText('selectCategory')}</th>
                                                <th style={{ fontSize: '0.8rem' }} className="text-center">{langCtx.getText('stock')}</th>
                                                <th style={{ fontSize: '0.8rem' }} className="text-center">{langCtx.getText('totalSales')}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {categoryRows.map((row) => (
                                                <tr key={String(row.category)}>
                                                    <td>{CATEGORY_NAMES[row.category] || row.category}</td>
                                                    <td className="text-center">{Number(row.stockQty || 0)}</td>
                                                    <td className="text-center">{Number(row.itemsSold || 0)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Payment Method Breakdown */}
                            <div className="col-12 col-lg-6">
                                <div style={{ background: 'white', borderRadius: '10px', padding: '1.5rem', boxShadow: '0 2px 4px rgba(0,0,0,0.08)', border: '1px solid #e9ecef' }}>
                                    <h5 className="fw-bold mb-3" style={{ fontFamily: "'Outfit', sans-serif" }}>
                                        💳 {langCtx.getText('paymentMethod')}
                                    </h5>
                                    {paymentMethods.length === 0 ? (
                                        <p className="text-muted">{langCtx.getText('noAnalyticsData')}</p>
                                    ) : (
                                            <table className="table table-sm">
                                                <thead>
                                                    <tr>
                                                        <th style={{ fontSize: '0.8rem' }}>{langCtx.getText('paymentMethod')}</th>
                                                        <th style={{ fontSize: '0.8rem' }} className="text-center">{langCtx.getText('items')}</th>
                                                        <th style={{ fontSize: '0.8rem' }} className="text-end">{langCtx.getText('totalSales')}</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {paymentMethods.map((pm) => (
                                                        <tr key={String(pm.method)}>
                                                            <td>
                                                                {pm.method === 'Cash' ? '💵' : pm.method === 'Card' ? '💳' : pm.method === 'UPI' ? '📱' : '🧾'} {pm.method}
                                                            </td>
                                                            <td className="text-center">{Number(pm.orders || 0)}</td>
                                                            <td className="text-end fw-bold" style={{ color: '#2E7D32' }}>
                                                                ₹{Number(pm.totalSales || 0).toFixed(2)}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                    )}
                                </div>
                            </div>

                            {/* Low Stock Alert */}
                            <div className="col-12 col-lg-6">
                                <div style={{ background: 'white', borderRadius: '10px', padding: '1.5rem', boxShadow: '0 2px 4px rgba(0,0,0,0.08)', border: '1px solid #e9ecef' }}>
                                    <h5 className="fw-bold mb-3" style={{ fontFamily: "'Outfit', sans-serif" }}>
                                        ⚠️ {langCtx.getText('stock')}
                                    </h5>
                                    {(() => {
                                        const lowStock = lowStockProducts;
                                        if (!Array.isArray(lowStock) || lowStock.length === 0) {
                                            return <p className="text-muted">{langCtx.getText('noAnalyticsData')}</p>;
                                        }
                                        return (
                                            <table className="table table-sm">
                                                <thead>
                                                    <tr>
                                                        <th style={{ fontSize: '0.8rem' }}>{langCtx.getText('productName')}</th>
                                                        <th style={{ fontSize: '0.8rem' }} className="text-center">{langCtx.getText('stock')}</th>
                                                        <th style={{ fontSize: '0.8rem' }} className="text-end">{langCtx.getText('price')}</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {lowStock.slice(0, 8).map((p) => (
                                                        <tr key={p.id}>
                                                            <td>{p.emoji} {p.name}</td>
                                                            <td className="text-center">
                                                                <span style={{
                                                                    color: p.stock < 10 ? '#c62828' : '#e65100',
                                                                    fontWeight: '700',
                                                                }}>
                                                                    {p.stock}
                                                                </span>
                                                            </td>
                                                            <td className="text-end">₹{Number(p.price || 0).toFixed(2)}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        );
                                    })()}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </LanguageContext.Consumer>
        );
    }
}

export default AnalyticsPage;
