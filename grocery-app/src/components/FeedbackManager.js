import React from 'react';
import { toast } from 'react-toastify';
import styled from 'styled-components';

import AuthContext from '../context/AuthContext';
import feedbackService from '../services/feedbackService';

const Overlay = styled.div`
    position: fixed;
    inset: 0;
    z-index: 9999;
    background: rgba(0, 0, 0, 0.55);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
`;

const ModalCard = styled.div`
    width: 100%;
    max-width: 460px;
    background: #ffffff;
    border-radius: 14px;
    overflow: hidden;
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.25);
`;

const Header = styled.div`
    background: #1e3a8a;
    color: #ffffff;
    padding: 0.95rem 1.1rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
`;

const Title = styled.div`
    font-weight: 800;
    font-size: 1.05rem;
    letter-spacing: 0.2px;
`;

const CloseButton = styled.button`
    border: none;
    background: rgba(255, 255, 255, 0.16);
    color: #ffffff;
    width: 34px;
    height: 34px;
    border-radius: 10px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: transform 120ms ease, background 120ms ease, opacity 120ms ease;

    &:hover {
        background: rgba(255, 255, 255, 0.22);
        transform: translateY(-1px);
    }

    &:disabled {
        opacity: 0.45;
        cursor: not-allowed;
        transform: none;
    }
`;

const Body = styled.div`
    padding: 1.15rem 1.1rem;
`;

const Muted = styled.div`
    color: #6b7280;
    font-size: 0.9rem;
    margin-bottom: 0.9rem;
`;

const SectionLabel = styled.div`
    font-weight: 700;
    margin-bottom: 0.5rem;
    color: #111827;
`;

const StarsRow = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
    margin-bottom: 1rem;
`;

const StarButton = styled.button`
    border: none;
    background: transparent;
    padding: 0;
    line-height: 1;
    cursor: ${(p) => (p.disabled ? 'not-allowed' : 'pointer')};
    color: ${(p) => (p.$active ? '#fbbf24' : '#d1d5db')};
    transition: color 120ms ease, transform 120ms ease;

    &:hover {
        transform: translateY(-1px) scale(1.02);
    }

    &:disabled {
        transform: none;
    }
`;

const Star = styled.span`
    font-size: 2.05rem;
    user-select: none;
`;

const TextArea = styled.textarea`
    width: 100%;
    min-height: 92px;
    resize: vertical;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 0.75rem 0.85rem;
    font-size: 0.95rem;
    outline: none;
    transition: border-color 120ms ease, box-shadow 120ms ease;

    &:focus {
        border-color: #2563eb;
        box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.18);
    }

    &:disabled {
        background: #f9fafb;
        color: #6b7280;
    }
`;

const SpacerSm = styled.div`
    height: 0.25rem;
`;

const Footer = styled.div`
    padding: 0 1.1rem 1.1rem;
    display: flex;
    justify-content: center;
`;

const SubmitButton = styled.button`
    border: none;
    background: #2563eb;
    color: #ffffff;
    padding: 0.7rem 1.2rem;
    border-radius: 12px;
    font-weight: 800;
    cursor: pointer;
    transition: transform 120ms ease, background 120ms ease, opacity 120ms ease;
    min-width: 180px;

    &:hover {
        background: #1d4ed8;
        transform: translateY(-1px);
    }

    &:disabled {
        opacity: 0.7;
        cursor: not-allowed;
        transform: none;
    }
`;

const SuccessWrap = styled.div`
    border: 1px solid #bbf7d0;
    background: #f0fdf4;
    border-radius: 12px;
    padding: 1.15rem 1rem;
    text-align: center;
`;

const SuccessText = styled.div`
    color: #16a34a;
    font-weight: 900;
    font-size: 1.02rem;
`;

class FeedbackManager extends React.Component {
    static contextType = AuthContext;

    constructor(props) {
        super(props);
        this.state = {
            pending: [],
            loading: false,
            submitting: false,
            rating: 0,
            comment: '',
            showThankYou: false,
            hoverRating: 0,
        };

        this._lastAuthKey = null;
        this._dismissedAuthKey = null;
        this._isMounted = false;
    }

    componentDidMount() {
        this._isMounted = true;
        this.maybeFetchPending();
    }

    componentDidUpdate() {
        this.maybeFetchPending();
    }

    componentWillUnmount() {
        this._isMounted = false;
    }

    getAuthKey = () => {
        const { isAuthenticated, user, role } = this.context || {};
        const uid = user && user.id ? user.id : null;
        return `${Boolean(isAuthenticated)}:${role || ''}:${uid || ''}`;
    };

    maybeFetchPending = async () => {
        const { isAuthenticated, role } = this.context || {};
        const authKey = this.getAuthKey();

        if (authKey === this._lastAuthKey) return;
        this._lastAuthKey = authKey;

        // If user dismissed the popup after submitting feedback, don't re-open it
        // again for the same login session.
        if (authKey === this._dismissedAuthKey) return;

        // New auth session (login/logout) should clear any prior dismissal.
        this._dismissedAuthKey = null;

        if (!isAuthenticated || String(role || '').toLowerCase() !== 'customer') {
            if (this._isMounted) {
                this.setState({ pending: [], rating: 0, comment: '', loading: false, submitting: false });
            }
            return;
        }

        await this.fetchPending();
    };

    fetchPending = async () => {
        this.setState({ loading: true });
        try {
            const pending = await feedbackService.getPending();
            if (!this._isMounted) return;
            this.setState({
                pending: Array.isArray(pending) ? pending : [],
                loading: false,
                rating: 0,
                comment: '',
                showThankYou: false,
                hoverRating: 0,
            });
        } catch (err) {
            if (!this._isMounted) return;
            this.setState({ loading: false });
            // Keep silent-ish; this runs on login.
            const msg = err?.message || 'Failed to load feedback';
            if (!String(msg).toLowerCase().includes('session expired')) {
                toast.error(msg);
            }
        }
    };

    setRating = (rating) => {
        const r = Number(rating);
        if (!Number.isFinite(r)) return;
        this.setState({ rating: Math.max(1, Math.min(5, Math.floor(r))) });
    };

    handleSubmit = async () => {
        const current = (Array.isArray(this.state.pending) ? this.state.pending : [])[0];
        if (!current) return;

        const orderId = current.id;
        const rating = Number(this.state.rating);
        if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
            toast.error('Please select a rating');
            return;
        }

        this.setState({ submitting: true });
        try {
            await feedbackService.submit({
                orderId,
                rating,
                comment: this.state.comment,
            });
            // Refresh pending list to ensure correctness, but keep popup open
            // to show a thank-you confirmation (no page reload).
            await this.fetchPending();
            if (this._isMounted) this.setState({ showThankYou: true });
        } catch (err) {
            const msg = err?.message || 'Failed to submit feedback';
            toast.error(msg);
        } finally {
            if (this._isMounted) this.setState({ submitting: false });
        }
    };

    handleCloseThankYou = () => {
        // Close the popup immediately.
        this._dismissedAuthKey = this.getAuthKey();
        this.setState({ showThankYou: false, pending: [], rating: 0, hoverRating: 0, comment: '' });
    };

    formatDate = (dateStr) => {
        if (!dateStr) return '-';
        const d = new Date(dateStr);
        if (Number.isNaN(d.getTime())) return '-';
        return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    renderStars = () => {
        const selected = Number(this.state.rating) || 0;
        const hover = Number(this.state.hoverRating) || 0;
        const active = hover > 0 ? hover : selected;
        return (
            <StarsRow>
                {[1, 2, 3, 4, 5].map((n) => {
                    const isOn = active >= n;
                    return (
                        <StarButton
                            key={n}
                            type="button"
                            onClick={() => this.setRating(n)}
                            disabled={this.state.submitting}
                            aria-label={`${n} star`}
                            $active={isOn}
                            onMouseEnter={() => this.setState({ hoverRating: n })}
                            onMouseLeave={() => this.setState({ hoverRating: 0 })}
                        >
                            <Star>★</Star>
                        </StarButton>
                    );
                })}
            </StarsRow>
        );
    };

    render() {
        const pending = Array.isArray(this.state.pending) ? this.state.pending : [];
        const current = pending[0];

        // Keep popup visible after submission to show thank-you message.
        if (!current && !this.state.showThankYou) return null;

        const canClose = Boolean(this.state.showThankYou);

        return (
            <React.Fragment>
                <Overlay role="dialog" aria-modal="true">
                    <ModalCard>
                        <Header>
                            <Title>Rate your order</Title>
                            <CloseButton
                                type="button"
                                aria-label="Close"
                                onClick={canClose ? this.handleCloseThankYou : undefined}
                                disabled={!canClose}
                                title={canClose ? 'Close' : 'Submit feedback to close'}
                            >
                                ✕
                            </CloseButton>
                        </Header>

                        <Body>
                            {!this.state.showThankYou && current && (
                                <Muted>
                                    Order #{current.id} • {current.orderType || '-'} • {this.formatDate(current.createdAt)}
                                </Muted>
                            )}

                            {this.state.showThankYou ? (
                                <SuccessWrap>
                                    <SuccessText>Thank you for your valuable feedback</SuccessText>
                                </SuccessWrap>
                            ) : (
                                <div>
                                    <SectionLabel>Rating (required)</SectionLabel>
                                    {this.renderStars()}

                                    <SpacerSm />
                                    <SectionLabel>Comment (optional)</SectionLabel>
                                    <TextArea
                                        placeholder="Give your valuable feedback"
                                        value={this.state.comment}
                                        onChange={(e) => this.setState({ comment: e.target.value })}
                                        disabled={this.state.submitting}
                                    />
                                </div>
                            )}
                        </Body>

                        {!this.state.showThankYou && (
                            <Footer>
                                <SubmitButton
                                    type="button"
                                    onClick={this.handleSubmit}
                                    disabled={this.state.submitting || this.state.loading}
                                >
                                    {this.state.submitting ? 'Submitting...' : 'Submit Feedback'}
                                </SubmitButton>
                            </Footer>
                        )}
                    </ModalCard>
                </Overlay>
            </React.Fragment>
        );
    }
}

export default FeedbackManager;
