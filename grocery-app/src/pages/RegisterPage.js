import React from 'react';
import { Navigate, Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import LanguageContext from '../context/LanguageContext';
import { toast } from 'react-toastify';
import {
    AuthContainer,
} from '../styledComponents/LayoutStyles';
import styled from 'styled-components';
import { validators } from '../utils/validators';

const BelowNavbarWrapper = styled.div`
    width: 100%;
    padding-top: calc(${({ theme }) => theme.navbar.height} + 1rem);
`;

const ContentRow = styled.div`
    min-height: calc(100vh - ${({ theme }) => theme.navbar.height} - 1rem);
`;

class RegisterPage extends React.Component {
    static contextType = AuthContext;

    constructor(props) {
        super(props);
        this.state = {
            name: '',
            phone: '',
            password: '',
            confirmPassword: '',
            showPassword: false,
            showConfirmPassword: false,
            place: '',
            errors: {},
            loading: false,
        };
        this.languageContext = null;
    }

    validate = () => {
        const errors = {};
        const { name, phone, password, confirmPassword, place } = this.state;

        errors.name = validators.validateName(name, this.languageContext.getText);
        errors.phone = validators.validatePhone(phone, this.languageContext.getText);
        errors.password = validators.validatePassword(password, this.languageContext.getText);
        errors.place = validators.validatePlace(place, this.languageContext.getText);

        if (!confirmPassword) {
            errors.confirmPassword = this.languageContext.getText('confirmPasswordRequired');
        } else if (confirmPassword !== password) {
            errors.confirmPassword = this.languageContext.getText('passwordsDoNotMatch');
        }

        // Remove empty error properties
        Object.keys(errors).forEach(key => !errors[key] && delete errors[key]);

        this.setState({ errors });
        return Object.keys(errors).length === 0;
    };

    handleSubmit = async (e) => {
        e.preventDefault();
        if (!this.validate()) return;

        this.setState({ loading: true });
        try {
            const { name, phone, password, place } = this.state;
            await this.context.register({ fullName: name, phone, place, password });
            toast.success(this.languageContext.getText('registrationSuccess') + ' 🎉');
        } catch (err) {
            toast.error(err.message || this.languageContext.getText('registrationFailed'));
            this.setState({ errors: { general: err.message || 'Registration failed' } });
        } finally {
            this.setState({ loading: false });
        }
    };

    handleChange = (field) => (e) => {
        let value = e.target.value;
        // Enforce phone input to digits only
        if (field === 'phone') {
            value = value.replace(/\D/g, '').slice(0, 10);
        }
        // Enforce name and place to alphabets and spaces only
        if (field === 'name' || field === 'place') {
            value = value.replace(/[^a-zA-Z\s]/g, '');
        }
        this.setState({ [field]: value });
    };

    togglePassword = () => {
        this.setState((prev) => ({ showPassword: !prev.showPassword }));
    };

    toggleConfirmPassword = () => {
        this.setState((prev) => ({ showConfirmPassword: !prev.showConfirmPassword }));
    };

    render() {
        if (this.context.isAuthenticated) {
            return <Navigate to="/products" replace />;
        }

        const {
            name,
            phone,
            password,
            confirmPassword,
            showPassword,
            showConfirmPassword,
            place,
            errors,
            loading,
        } = this.state;

        const passwordsMismatch = !!password && !!confirmPassword && password !== confirmPassword;

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
                                                    <div className="fw-semibold">{langCtx.getText('ownerLabel')}</div>
                                                    <div className="opacity-75">{langCtx.getText('ownerName')}</div>
                                                </div>

                                                <div className="mb-3">
                                                    <div className="fw-semibold">{langCtx.getText('addressLabel')}</div>
                                                    <div className="opacity-75">{langCtx.getText('address').split('\n').join(', ')}</div>
                                                </div>

                                                <div className="mb-3">
                                                    <div className="fw-semibold">{langCtx.getText('phoneLabel')}</div>
                                                    <div>
                                                        <a href="tel:+919441754505" className="text-warning text-decoration-none">
                                                            {langCtx.getText('phoneLink')}
                                                        </a>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="col-12 col-lg-5 offset-lg-1 p-4 p-lg-5 d-flex justify-content-center mt-4 mt-lg-0">
                                            <div className="card shadow-lg border-0 rounded-4 w-100 mx-3 mx-lg-0" style={{ maxWidth: '420px' }}>
                                                <div className="card-body p-4 p-lg-5">
                                                    <div className="text-center mb-4">
                                                        <div className="d-inline-flex align-items-center justify-content-center bg-success text-white rounded-3 mb-2" style={{ width: '56px', height: '56px', fontSize: '1.75rem' }}>
                                                            🛒
                                                        </div>
                                                        <h2 className="h4 fw-bold mb-1">{langCtx.getText('signUp')}</h2>
                                                        <p className="text-muted mb-0">{langCtx.getText('shopName')}</p>
                                                    </div>

                                                    {errors.general && (
                                                        <div className="alert alert-danger py-2" style={{ fontSize: '0.85rem' }}>
                                                            {errors.general}
                                                        </div>
                                                    )}

                                                    <form onSubmit={this.handleSubmit}>
                                                        <div className="mb-3">
                                                            <label className="form-label fw-semibold">{langCtx.getText('fullName')}</label>
                                                            <input
                                                                type="text"
                                                                className="form-control rounded-3"
                                                                placeholder={langCtx.getText('fullName')}
                                                                value={name}
                                                                onChange={this.handleChange('name')}
                                                            />
                                                            {errors.name && (
                                                                <div className="text-danger mt-1" style={{ fontSize: '0.85rem' }}>
                                                                    ⚠ {errors.name}
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className="mb-3">
                                                            <label className="form-label fw-semibold">{langCtx.getText('phone')}</label>
                                                            <input
                                                                type="tel"
                                                                className="form-control rounded-3"
                                                                placeholder="10 digit phone number"
                                                                value={phone}
                                                                onChange={this.handleChange('phone')}
                                                                maxLength={10}
                                                            />
                                                            {errors.phone && (
                                                                <div className="text-danger mt-1" style={{ fontSize: '0.85rem' }}>
                                                                    ⚠ {errors.phone}
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className="mb-3">
                                                            <label className="form-label fw-semibold">{langCtx.getText('place')}</label>
                                                            <input
                                                                type="text"
                                                                className="form-control rounded-3"
                                                                placeholder={langCtx.getText('place')}
                                                                value={place}
                                                                onChange={this.handleChange('place')}
                                                            />
                                                            {errors.place && (
                                                                <div className="text-danger mt-1" style={{ fontSize: '0.85rem' }}>
                                                                    ⚠ {errors.place}
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className="mb-3">
                                                            <label className="form-label fw-semibold">{langCtx.getText('password')}</label>
                                                            <div className="input-group">
                                                                <input
                                                                    type={showPassword ? 'text' : 'password'}
                                                                    className="form-control rounded-start-3"
                                                                    placeholder="Min 6 characters"
                                                                    value={password}
                                                                    onChange={this.handleChange('password')}
                                                                />
                                                                <button
                                                                    type="button"
                                                                    className="btn btn-outline-secondary"
                                                                    onClick={this.togglePassword}
                                                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                                                >
                                                                    👁
                                                                </button>
                                                            </div>
                                                            {errors.password && (
                                                                <div className="text-danger mt-1" style={{ fontSize: '0.85rem' }}>
                                                                    ⚠ {errors.password}
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className="mb-3">
                                                            <label className="form-label fw-semibold">{langCtx.getText('confirmPassword')}</label>
                                                            <div className="input-group">
                                                                <input
                                                                    type={showConfirmPassword ? 'text' : 'password'}
                                                                    className="form-control rounded-start-3"
                                                                    placeholder={langCtx.getText('confirmPassword')}
                                                                    value={confirmPassword}
                                                                    onChange={this.handleChange('confirmPassword')}
                                                                />
                                                                <button
                                                                    type="button"
                                                                    className="btn btn-outline-secondary"
                                                                    onClick={this.toggleConfirmPassword}
                                                                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                                                                >
                                                                    👁
                                                                </button>
                                                            </div>
                                                            {errors.confirmPassword && (
                                                                <div className="text-danger mt-1" style={{ fontSize: '0.85rem' }}>
                                                                    ⚠ {errors.confirmPassword}
                                                                </div>
                                                            )}
                                                            {passwordsMismatch && !errors.confirmPassword && (
                                                                <div className="text-danger mt-1" style={{ fontSize: '0.85rem' }}>
                                                                    ⚠ {langCtx.getText('passwordsDoNotMatch')}
                                                                </div>
                                                            )}
                                                        </div>

                                                        <button type="submit" className="btn btn-success w-100 py-2" disabled={loading || passwordsMismatch}>
                                                            {loading ? (
                                                                <>
                                                                    <span className="spinner-border spinner-border-sm me-2" role="status" />
                                                                    {langCtx.getText('creatingAccount')}
                                                                </>
                                                            ) : (
                                                                langCtx.getText('signUp')
                                                            )}
                                                        </button>
                                                    </form>

                                                    <div className="mt-3 text-center">
                                                        <span className="text-muted">{langCtx.getText('alreadyHaveAccount')} </span>
                                                        <Link to="/login">{langCtx.getText('loginHere')}</Link>
                                                    </div>
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

export default RegisterPage;
