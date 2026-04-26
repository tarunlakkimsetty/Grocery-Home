import React from 'react';
import { Navigate, Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import LanguageContext from '../context/LanguageContext';
import { toast } from 'react-toastify';
import authService from '../services/authService';
import {
    AuthContainer,
} from '../styledComponents/LayoutStyles';
import styled from 'styled-components';

const BelowNavbarWrapper = styled.div`
    width: 100%;
    padding-top: calc(${({ theme }) => theme.navbar.height} + 1rem);
`;

const ContentRow = styled.div`
    min-height: calc(100vh - ${({ theme }) => theme.navbar.height} - 1rem);
`;

class ForgotPasswordPage extends React.Component {
    static contextType = AuthContext;

    constructor(props) {
        super(props);
        this.state = {
            step: 1, // 1: Verify phone, 2: Security questions, 3: Reset password
            phone: '',
            favoriteFood: '',
            favoritePlace: '',
            newPassword: '',
            confirmPassword: '',
            showNewPassword: false,
            showConfirmPassword: false,
            errors: {},
            loading: false,
        };
        this.languageContext = null;
    }

    handleStep1 = async (e) => {
        e.preventDefault();
        const { phone } = this.state;

        if (!phone) {
            this.setState({ errors: { phone: 'Phone number is required' } });
            return;
        }

        const cleanedPhone = String(phone).replace(/\D/g, '');
        if (!/^\d{10}$/.test(cleanedPhone)) {
            this.setState({ errors: { phone: 'Phone number must be exactly 10 digits' } });
            return;
        }

        this.setState({ loading: true });
        try {
            const response = await authService.verifyPhoneForReset(cleanedPhone);
            if (response.success) {
                this.setState({ step: 2, errors: {}, phone: cleanedPhone });
                toast.success('Phone verified! Please answer security questions.');
            }
        } catch (err) {
            this.setState({ errors: { general: err.message || 'Phone verification failed' } });
            toast.error(err.message || 'Phone verification failed');
        } finally {
            this.setState({ loading: false });
        }
    };

    handleStep2 = async (e) => {
        e.preventDefault();
        const { phone, favoriteFood, favoritePlace } = this.state;

        if (!favoriteFood || favoriteFood.trim().length < 2) {
            this.setState({ errors: { favoriteFood: 'Please enter your favorite food' } });
            return;
        }

        if (!favoritePlace || favoritePlace.trim().length < 2) {
            this.setState({ errors: { favoritePlace: 'Please enter your favorite place' } });
            return;
        }

        this.setState({ loading: true });
        try {
            const response = await authService.verifySecurityAnswers(phone, favoriteFood, favoritePlace);
            if (response.success) {
                this.setState({ step: 3, errors: {} });
                toast.success('Security answers verified! Please set a new password.');
            }
        } catch (err) {
            this.setState({ errors: { general: err.message || 'Security verification failed' } });
            toast.error(err.message || 'Security verification failed');
        } finally {
            this.setState({ loading: false });
        }
    };

    handleStep3 = async (e) => {
        e.preventDefault();
        const { phone, newPassword, confirmPassword } = this.state;

        if (!newPassword || newPassword.length < 6) {
            this.setState({ errors: { newPassword: 'Password must be at least 6 characters' } });
            return;
        }

        if (!confirmPassword) {
            this.setState({ errors: { confirmPassword: 'Please confirm your password' } });
            return;
        }

        if (newPassword !== confirmPassword) {
            this.setState({ errors: { confirmPassword: 'Passwords do not match' } });
            return;
        }

        this.setState({ loading: true });
        try {
            const response = await authService.resetPassword(phone, newPassword, confirmPassword);
            if (response.success) {
                toast.success('Password reset successful! Redirecting to login...');
                setTimeout(() => {
                    window.location.href = '/login';
                }, 2000);
            }
        } catch (err) {
            this.setState({ errors: { general: err.message || 'Password reset failed' } });
            toast.error(err.message || 'Password reset failed');
        } finally {
            this.setState({ loading: false });
        }
    };

    handleChange = (field) => (e) => {
        let value = e.target.value;
        if (field === 'phone') {
            value = value.replace(/\D/g, '').slice(0, 10);
        }
        if (['favoriteFood', 'favoritePlace'].includes(field)) {
            value = value.replace(/[^a-zA-Z\s]/g, '');
        }
        this.setState({ [field]: value, errors: { ...this.state.errors, [field]: null } });
    };

    togglePassword = (field) => {
        if (field === 'newPassword') {
            this.setState((prev) => ({ showNewPassword: !prev.showNewPassword }));
        } else {
            this.setState((prev) => ({ showConfirmPassword: !prev.showConfirmPassword }));
        }
    };

    goBack = () => {
        if (this.state.step > 1) {
            this.setState({
                step: this.state.step - 1,
                errors: {},
                favoriteFood: '',
                favoritePlace: '',
                newPassword: '',
                confirmPassword: '',
            });
        }
    };

    render() {
        if (this.context.isAuthenticated) {
            return <Navigate to="/products" replace />;
        }

        const {
            step,
            phone,
            favoriteFood,
            favoritePlace,
            newPassword,
            confirmPassword,
            showNewPassword,
            showConfirmPassword,
            errors,
            loading,
        } = this.state;

        return (
            <LanguageContext.Consumer>
                {(langCtx) => {
                    this.languageContext = langCtx;
                    return (
                        <AuthContainer>
                            <BelowNavbarWrapper>
                                <div className="container-fluid">
                                    <ContentRow className="row align-items-center">
                                        <div className="col-12 col-lg-6 p-4 p-lg-5 d-flex align-items-center justify-content-center justify-content-lg-start">
                                            <div className="text-white" style={{ maxWidth: '500px', lineHeight: 1.8 }}>
                                                <div className="mb-3 opacity-75">{langCtx.getText('welcomeBack')}</div>
                                                <h2 className="fw-bold mb-4">{langCtx.getText('shopName')}</h2>

                                                <div className="mb-3">
                                                    <div className="fw-semibold">🔐 Password Recovery</div>
                                                    <div className="opacity-75 mt-2">
                                                        We'll help you recover your password in {step} step{step > 1 ? 's' : ''}:
                                                        {step === 1 && ' Verify your phone number'}
                                                        {step === 2 && ' Answer security questions'}
                                                        {step === 3 && ' Set a new password'}
                                                    </div>
                                                </div>

                                                <div className="mt-4">
                                                    <div className="fw-semibold">Step Progress</div>
                                                    <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                                                        {[1, 2, 3].map((s) => (
                                                            <div
                                                                key={s}
                                                                style={{
                                                                    flex: 1,
                                                                    height: '8px',
                                                                    backgroundColor: s <= step ? '#28a745' : '#dee2e6',
                                                                    borderRadius: '4px',
                                                                    transition: 'all 0.3s ease'
                                                                }}
                                                            />
                                                        ))}
                                                    </div>
                                                    <div style={{ marginTop: '8px', fontSize: '0.85rem', opacity: 0.8 }}>
                                                        Step {step} of 3
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="col-12 col-lg-5 offset-lg-1 p-4 p-lg-5 d-flex justify-content-center mt-4 mt-lg-0">
                                            <div className="card shadow-lg border-0 rounded-4 w-100 mx-3 mx-lg-0" style={{ maxWidth: '420px' }}>
                                                <div className="card-body p-4 p-lg-5">
                                                    <div className="text-center mb-4">
                                                        <div className="d-inline-flex align-items-center justify-content-center bg-warning text-white rounded-3 mb-2" style={{ width: '56px', height: '56px', fontSize: '1.75rem' }}>
                                                            🔓
                                                        </div>
                                                        <h2 className="h4 fw-bold mb-1">Reset Password</h2>
                                                        <p className="text-muted mb-0">Step {step} of 3</p>
                                                    </div>

                                                    {errors.general && (
                                                        <div className="alert alert-danger py-2" style={{ fontSize: '0.85rem' }}>
                                                            {errors.general}
                                                        </div>
                                                    )}

                                                    {/* Step 1: Verify Phone */}
                                                    {step === 1 && (
                                                        <form onSubmit={this.handleStep1}>
                                                            <div className="mb-3">
                                                                <label className="form-label fw-semibold">📱 Phone Number</label>
                                                                <input
                                                                    type="tel"
                                                                    className="form-control rounded-3"
                                                                    placeholder="10 digit phone number"
                                                                    value={phone}
                                                                    onChange={this.handleChange('phone')}
                                                                    maxLength={10}
                                                                    disabled={loading}
                                                                />
                                                                {errors.phone && (
                                                                    <div className="text-danger mt-1" style={{ fontSize: '0.85rem' }}>
                                                                        ⚠ {errors.phone}
                                                                    </div>
                                                                )}
                                                            </div>

                                                            <button
                                                                type="submit"
                                                                className="btn btn-success w-100 rounded-3 fw-semibold mb-3"
                                                                disabled={loading}
                                                            >
                                                                {loading ? '⏳ Verifying...' : '✓ Verify Phone'}
                                                            </button>

                                                            <div className="text-center">
                                                                <Link to="/login" className="text-decoration-none small">
                                                                    ← Back to Login
                                                                </Link>
                                                            </div>
                                                        </form>
                                                    )}

                                                    {/* Step 2: Security Questions */}
                                                    {step === 2 && (
                                                        <form onSubmit={this.handleStep2}>
                                                            <div className="mb-3">
                                                                <label className="form-label fw-semibold">🍜 What is your favorite food?</label>
                                                                <input
                                                                    type="text"
                                                                    className="form-control rounded-3"
                                                                    placeholder="e.g., Biryani"
                                                                    value={favoriteFood}
                                                                    onChange={this.handleChange('favoriteFood')}
                                                                    disabled={loading}
                                                                />
                                                                {errors.favoriteFood && (
                                                                    <div className="text-danger mt-1" style={{ fontSize: '0.85rem' }}>
                                                                        ⚠ {errors.favoriteFood}
                                                                    </div>
                                                                )}
                                                            </div>

                                                            <div className="mb-3">
                                                                <label className="form-label fw-semibold">📍 What is your favorite place?</label>
                                                                <input
                                                                    type="text"
                                                                    className="form-control rounded-3"
                                                                    placeholder="e.g., Beach"
                                                                    value={favoritePlace}
                                                                    onChange={this.handleChange('favoritePlace')}
                                                                    disabled={loading}
                                                                />
                                                                {errors.favoritePlace && (
                                                                    <div className="text-danger mt-1" style={{ fontSize: '0.85rem' }}>
                                                                        ⚠ {errors.favoritePlace}
                                                                    </div>
                                                                )}
                                                            </div>

                                                            <button
                                                                type="submit"
                                                                className="btn btn-success w-100 rounded-3 fw-semibold mb-3"
                                                                disabled={loading}
                                                            >
                                                                {loading ? '⏳ Verifying...' : '✓ Verify Answers'}
                                                            </button>

                                                            <button
                                                                type="button"
                                                                className="btn btn-outline-secondary w-100 rounded-3"
                                                                onClick={this.goBack}
                                                                disabled={loading}
                                                            >
                                                                ← Go Back
                                                            </button>
                                                        </form>
                                                    )}

                                                    {/* Step 3: Reset Password */}
                                                    {step === 3 && (
                                                        <form onSubmit={this.handleStep3}>
                                                            <div className="mb-3">
                                                                <label className="form-label fw-semibold">🔐 New Password</label>
                                                                <div className="input-group">
                                                                    <input
                                                                        type={showNewPassword ? 'text' : 'password'}
                                                                        className="form-control rounded-start-3"
                                                                        placeholder="Min 6 characters"
                                                                        value={newPassword}
                                                                        onChange={this.handleChange('newPassword')}
                                                                        disabled={loading}
                                                                    />
                                                                    <button
                                                                        type="button"
                                                                        className="btn btn-outline-secondary"
                                                                        onClick={() => this.togglePassword('newPassword')}
                                                                        disabled={loading}
                                                                    >
                                                                        👁
                                                                    </button>
                                                                </div>
                                                                {errors.newPassword && (
                                                                    <div className="text-danger mt-1" style={{ fontSize: '0.85rem' }}>
                                                                        ⚠ {errors.newPassword}
                                                                    </div>
                                                                )}
                                                            </div>

                                                            <div className="mb-3">
                                                                <label className="form-label fw-semibold">🔐 Confirm Password</label>
                                                                <div className="input-group">
                                                                    <input
                                                                        type={showConfirmPassword ? 'text' : 'password'}
                                                                        className="form-control rounded-start-3"
                                                                        placeholder="Confirm password"
                                                                        value={confirmPassword}
                                                                        onChange={this.handleChange('confirmPassword')}
                                                                        disabled={loading}
                                                                    />
                                                                    <button
                                                                        type="button"
                                                                        className="btn btn-outline-secondary"
                                                                        onClick={() => this.togglePassword('confirmPassword')}
                                                                        disabled={loading}
                                                                    >
                                                                        👁
                                                                    </button>
                                                                </div>
                                                                {errors.confirmPassword && (
                                                                    <div className="text-danger mt-1" style={{ fontSize: '0.85rem' }}>
                                                                        ⚠ {errors.confirmPassword}
                                                                    </div>
                                                                )}
                                                            </div>

                                                            <button
                                                                type="submit"
                                                                className="btn btn-success w-100 rounded-3 fw-semibold mb-3"
                                                                disabled={loading}
                                                            >
                                                                {loading ? '⏳ Resetting...' : '✓ Reset Password'}
                                                            </button>

                                                            <button
                                                                type="button"
                                                                className="btn btn-outline-secondary w-100 rounded-3"
                                                                onClick={this.goBack}
                                                                disabled={loading}
                                                            >
                                                                ← Go Back
                                                            </button>
                                                        </form>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </ContentRow>
                                </div>
                            </BelowNavbarWrapper>
                        </AuthContainer>
                    );
                }}
            </LanguageContext.Consumer>
        );
    }
}

export default ForgotPasswordPage;
