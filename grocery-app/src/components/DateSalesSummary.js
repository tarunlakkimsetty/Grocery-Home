import React from 'react';
import analyticsService from '../services/analyticsService';
import Spinner from './Spinner';
import { StatsCard } from '../styledComponents/CardStyles';

const pad2 = (n) => String(n).padStart(2, '0');

const formatDateLocal = (d) => {
    if (!(d instanceof Date) || Number.isNaN(d.getTime())) return '';
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
};

const startOfWeekMonday = (d) => {
    const date = new Date(d);
    const day = date.getDay(); // 0..6 (Sun..Sat)
    const diff = (day === 0 ? -6 : 1 - day); // shift to Monday
    date.setDate(date.getDate() + diff);
    date.setHours(0, 0, 0, 0);
    return date;
};

const endOfMonth = (year, monthIndex0) => {
    // monthIndex0: 0..11
    return new Date(year, monthIndex0 + 1, 0);
};

class DateSalesSummary extends React.Component {
    constructor(props) {
        super(props);

        const today = new Date();
        const todayStr = formatDateLocal(today);

        this.state = {
            mode: 'day', // day | month | year | range
            day: todayStr,
            month: `${today.getFullYear()}-${pad2(today.getMonth() + 1)}`,
            year: String(today.getFullYear()),
            rangeStart: todayStr,
            rangeEnd: todayStr,
            activeQuick: 'today',
            startDate: todayStr,
            endDate: todayStr,
            loading: false,
            error: null,
            summary: null,
        };
    }

    componentDidMount() {
        // Default: show Today summary immediately.
        this.fetchSummary();
    }

    setRangeAndFetch = async ({ startDate, endDate, activeQuick, mode }) => {
        this.setState(
            {
                startDate,
                endDate,
                activeQuick: activeQuick || null,
                mode: mode || this.state.mode,
                error: null,
            },
            () => {
                this.fetchSummary();
            }
        );
    };

    fetchSummary = async () => {
        const { startDate, endDate } = this.state;

        if (!startDate || !endDate) {
            this.setState({ error: 'Please select a valid date range.' });
            return;
        }

        // Basic ordering safeguard
        if (String(endDate) < String(startDate)) {
            this.setState({ error: 'End date cannot be before start date.' });
            return;
        }

        this.setState({ loading: true, error: null });
        try {
            const summary = await analyticsService.getSalesSummaryByDateRange({ startDate, endDate });
            this.setState({ summary, loading: false });
        } catch (e) {
            const msg = e?.response?.data?.message || e?.message || 'Failed to load sales summary.';
            this.setState({ loading: false, error: msg });
        }
    };

    onQuick = (key) => {
        const now = new Date();
        const todayStr = formatDateLocal(now);

        if (key === 'today') {
            return this.setRangeAndFetch({ startDate: todayStr, endDate: todayStr, activeQuick: 'today', mode: 'day' });
        }

        if (key === 'thisWeek') {
            const start = startOfWeekMonday(now);
            return this.setRangeAndFetch({
                startDate: formatDateLocal(start),
                endDate: todayStr,
                activeQuick: 'thisWeek',
                mode: 'range',
            });
        }

        if (key === 'thisMonth') {
            const start = new Date(now.getFullYear(), now.getMonth(), 1);
            return this.setRangeAndFetch({
                startDate: formatDateLocal(start),
                endDate: todayStr,
                activeQuick: 'thisMonth',
                mode: 'range',
            });
        }

        if (key === 'thisYear') {
            const start = new Date(now.getFullYear(), 0, 1);
            return this.setRangeAndFetch({
                startDate: formatDateLocal(start),
                endDate: todayStr,
                activeQuick: 'thisYear',
                mode: 'range',
            });
        }

        if (key === 'custom') {
            this.setState({ mode: 'range', activeQuick: 'custom' });
        }
    };

    applyFromMode = () => {
        const { mode, day, month, year, rangeStart, rangeEnd } = this.state;

        if (mode === 'day') {
            return this.setRangeAndFetch({ startDate: day, endDate: day, activeQuick: null, mode: 'day' });
        }

        if (mode === 'month') {
            const [y, m] = String(month || '').split('-').map((x) => Number(x));
            if (!y || !m) {
                this.setState({ error: 'Please select a valid month.' });
                return;
            }
            const start = new Date(y, m - 1, 1);
            const end = endOfMonth(y, m - 1);
            return this.setRangeAndFetch({
                startDate: formatDateLocal(start),
                endDate: formatDateLocal(end),
                activeQuick: null,
                mode: 'month',
            });
        }

        if (mode === 'year') {
            const y = Number(year);
            if (!y || y < 2000 || y > 2100) {
                this.setState({ error: 'Please enter a valid year.' });
                return;
            }
            const start = new Date(y, 0, 1);
            const end = new Date(y, 11, 31);
            return this.setRangeAndFetch({
                startDate: formatDateLocal(start),
                endDate: formatDateLocal(end),
                activeQuick: null,
                mode: 'year',
            });
        }

        // range
        return this.setRangeAndFetch({ startDate: rangeStart, endDate: rangeEnd, activeQuick: 'custom', mode: 'range' });
    };

    renderModeInputs() {
        const { mode, day, month, year, rangeStart, rangeEnd } = this.state;

        if (mode === 'day') {
            return (
                <div className="d-flex flex-wrap gap-2 align-items-end">
                    <div>
                        <label className="form-label mb-1" style={{ fontSize: '0.85rem' }}>Select Day</label>
                        <input
                            className="form-control"
                            type="date"
                            value={day}
                            onChange={(e) => this.setState({ day: e.target.value, activeQuick: null })}
                        />
                    </div>
                </div>
            );
        }

        if (mode === 'month') {
            return (
                <div className="d-flex flex-wrap gap-2 align-items-end">
                    <div>
                        <label className="form-label mb-1" style={{ fontSize: '0.85rem' }}>Select Month</label>
                        <input
                            className="form-control"
                            type="month"
                            value={month}
                            onChange={(e) => this.setState({ month: e.target.value, activeQuick: null })}
                        />
                    </div>
                </div>
            );
        }

        if (mode === 'year') {
            return (
                <div className="d-flex flex-wrap gap-2 align-items-end">
                    <div>
                        <label className="form-label mb-1" style={{ fontSize: '0.85rem' }}>Select Year</label>
                        <input
                            className="form-control"
                            type="number"
                            min="2000"
                            max="2100"
                            value={year}
                            onChange={(e) => this.setState({ year: e.target.value, activeQuick: null })}
                        />
                    </div>
                </div>
            );
        }

        return (
            <div className="d-flex flex-wrap gap-2 align-items-end">
                <div>
                    <label className="form-label mb-1" style={{ fontSize: '0.85rem' }}>Start Date</label>
                    <input
                        className="form-control"
                        type="date"
                        value={rangeStart}
                        onChange={(e) => this.setState({ rangeStart: e.target.value, activeQuick: 'custom' })}
                    />
                </div>
                <div>
                    <label className="form-label mb-1" style={{ fontSize: '0.85rem' }}>End Date</label>
                    <input
                        className="form-control"
                        type="date"
                        value={rangeEnd}
                        onChange={(e) => this.setState({ rangeEnd: e.target.value, activeQuick: 'custom' })}
                    />
                </div>
            </div>
        );
    }

    render() {
        const { mode, startDate, endDate, loading, error, summary, activeQuick } = this.state;

        const totalSalesAmount = Number(summary?.totalSalesAmount || 0) || 0;
        const totalBillsGenerated = Number(summary?.totalBillsGenerated || 0) || 0;
        const totalProductsSold = Number(summary?.totalProductsSold || 0) || 0;

        const quickBtnClass = (key) =>
            `btn btn-sm ${activeQuick === key ? 'btn-primary' : 'btn-outline-primary'}`;

        return (
            <div className="mb-4">
                <div
                    style={{
                        background: 'white',
                        borderRadius: '10px',
                        padding: '1rem',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
                        border: '1px solid #e9ecef',
                    }}
                >
                    <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2">
                        <h5 className="fw-bold mb-0" style={{ fontFamily: "'Outfit', sans-serif" }}>
                            📅 Date-based Sales Summary
                        </h5>
                        <div className="text-muted" style={{ fontSize: '0.85rem' }}>
                            Range: <span className="fw-semibold">{startDate}</span> →{' '}
                            <span className="fw-semibold">{endDate}</span>
                        </div>
                    </div>

                    <div className="d-flex flex-wrap gap-2 mb-3">
                        <button type="button" className={quickBtnClass('today')} onClick={() => this.onQuick('today')}>
                            Today
                        </button>
                        <button type="button" className={quickBtnClass('thisWeek')} onClick={() => this.onQuick('thisWeek')}>
                            This Week
                        </button>
                        <button type="button" className={quickBtnClass('thisMonth')} onClick={() => this.onQuick('thisMonth')}>
                            This Month
                        </button>
                        <button type="button" className={quickBtnClass('thisYear')} onClick={() => this.onQuick('thisYear')}>
                            This Year
                        </button>
                        <button type="button" className={quickBtnClass('custom')} onClick={() => this.onQuick('custom')}>
                            Custom Range
                        </button>
                    </div>

                    <div className="d-flex flex-wrap gap-3 align-items-end">
                        <div style={{ minWidth: 180 }}>
                            <label className="form-label mb-1" style={{ fontSize: '0.85rem' }}>
                                Filter Type
                            </label>
                            <select
                                className="form-select"
                                value={mode}
                                onChange={(e) => this.setState({ mode: e.target.value, activeQuick: null, error: null })}
                            >
                                <option value="day">Specific Day</option>
                                <option value="month">Specific Month</option>
                                <option value="year">Specific Year</option>
                                <option value="range">Custom Date Range</option>
                            </select>
                        </div>

                        <div style={{ flex: '1 1 420px' }}>{this.renderModeInputs()}</div>

                        <div className="d-flex gap-2">
                            <button type="button" className="btn btn-success" onClick={this.applyFromMode}>
                                Apply
                            </button>
                        </div>
                    </div>

                    {error ? (
                        <div className="alert alert-warning py-2 mt-3 mb-0" role="alert">
                            {error}
                        </div>
                    ) : null}
                </div>

                <div className="row g-3 mt-0">
                    <div className="col-12 col-lg-4">
                        <StatsCard $gradient="linear-gradient(135deg, #2E7D32, #66BB6A)">
                            <div className="stats-icon">💰</div>
                            <div className="stats-value">₹{totalSalesAmount.toFixed(2)}</div>
                            <div className="stats-label">Total Sales Amount</div>
                        </StatsCard>
                    </div>
                    <div className="col-12 col-lg-4">
                        <StatsCard $gradient="linear-gradient(135deg, #1565C0, #42A5F5)">
                            <div className="stats-icon">🧾</div>
                            <div className="stats-value">{totalBillsGenerated}</div>
                            <div className="stats-label">Total Bills Generated</div>
                        </StatsCard>
                    </div>
                    <div className="col-12 col-lg-4">
                        <StatsCard $gradient="linear-gradient(135deg, #E65100, #FF9800)">
                            <div className="stats-icon">📦</div>
                            <div className="stats-value">{totalProductsSold}</div>
                            <div className="stats-label">Total Products Sold</div>
                        </StatsCard>
                    </div>
                </div>

                {loading ? (
                    <div className="mt-3">
                        <Spinner fullPage={false} text="Loading sales summary..." />
                    </div>
                ) : null}
            </div>
        );
    }
}

export default DateSalesSummary;
