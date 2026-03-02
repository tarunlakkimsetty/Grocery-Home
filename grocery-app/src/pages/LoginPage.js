import React from 'react';
import { Navigate, Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import LanguageContext from '../context/LanguageContext';
import { toast } from 'react-toastify';
import {
    AuthContainer,
    
} from '../styledComponents/LayoutStyles';

class LoginPage extends React.Component {
    static contextType = AuthContext;

    constructor(props) {
        super(props);
        this.state = {
            phone: '',
            password: '',
            showPassword: false,
            errors: {},
            loading: false,
        };
    }

    validate = () => {
        const errors = {};
        const { phone, password } = this.state;

        const cleanedPhone = String(phone || '').replace(/\D/g, '');
        if (!cleanedPhone) {
            errors.phone = this.languageContext.getText('phoneRequired');
        } else if (!/^\d{10}$/.test(cleanedPhone)) {
            errors.phone = this.languageContext.getText('phoneInvalid');
        }

        if (!password) {
            errors.password = this.languageContext.getText('passwordRequired');
        } else if (password.length < 6) {
            errors.password = this.languageContext.getText('passwordMinLength');
        }

        this.setState({ errors });
        return Object.keys(errors).length === 0;
    };

    handleSubmit = async (e) => {
        e.preventDefault();
        if (!this.validate()) return;

        this.setState({ loading: true });
        try {
            const cleanedPhone = String(this.state.phone || '').replace(/\D/g, '');
            await this.context.login(cleanedPhone, this.state.password);
            toast.success(this.languageContext.getText('loginSuccess') + ' 🎉');
        } catch (err) {
            toast.error(err.message || this.languageContext.getText('loginFailed'));
            this.setState({ errors: { general: err.message || 'Invalid credentials' } });
        } finally {
            this.setState({ loading: false });
        }
    };

    handleChange = (field) => (e) => {
        let value = e.target.value;
        if (field === 'phone') {
            value = value.replace(/\D/g, '').slice(0, 10);
        }
        this.setState({ [field]: value });
    };

    togglePassword = () => {
        this.setState((prev) => ({ showPassword: !prev.showPassword }));
    };

    render() {
        if (this.context.isAuthenticated) {
            return <Navigate to="/products" replace />;
        }

        const { phone, password, showPassword, errors, loading } = this.state;

        return (
            <LanguageContext.Consumer>
                {(langCtx) => {
                    this.languageContext = langCtx;
                    return (
                        <AuthContainer>
                            <div className="container-fluid">
                                <div className="row min-vh-100 align-items-center">
                                    <div className="col-12 col-lg-6 p-4 p-lg-5 d-flex justify-content-center justify-content-lg-start">
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

                                    <div className="col-12 col-lg-5 offset-lg-1 p-4 p-lg-5 d-flex justify-content-center">
                                        <div className="w-100" style={{ maxWidth: '420px' }}>
                                            <div className="card shadow-lg border-0 rounded-4">
                                                <div className="card-body p-4 p-lg-5">
                                                    <div className="text-center mb-4">
                                                        <div className="d-inline-flex align-items-center justify-content-center bg-success text-white rounded-3 mb-2" style={{ width: '56px', height: '56px', fontSize: '1.75rem' }}>
                                                            🛒
                                                        </div>
                                                        <h2 className="h4 fw-bold mb-1">{langCtx.getText('signIn')}</h2>
                                                        <p className="text-muted mb-0">{langCtx.getText('signInTo')}</p>
                                                    </div>

                                                    {errors.general && (
                                                        <div className="alert alert-danger py-2" style={{ fontSize: '0.85rem' }}>
                                                            {errors.general}
                                                        </div>
                                                    )}

                                                    <form onSubmit={this.handleSubmit}>
                                                        <div className="mb-3">
                                                            <label className="form-label fw-semibold">{langCtx.getText('phone')}</label>
                                                            <input
                                                                type="tel"
                                                                className="form-control rounded-3"
                                                                placeholder="Enter phone number"
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
                                                            <label className="form-label fw-semibold">{langCtx.getText('password')}</label>
                                                            <div className="input-group">
                                                                <input
                                                                    type={showPassword ? 'text' : 'password'}
                                                                    className="form-control rounded-start-3"
                                                                    placeholder={langCtx.getText('password')}
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

                                                        <button type="submit" className="btn btn-success w-100 py-2" disabled={loading}>
                                                            {loading ? (
                                                                <>
                                                                    <span className="spinner-border spinner-border-sm me-2" role="status" />
                                                                    {langCtx.getText('signingIn')}
                                                                </>
                                                            ) : (
                                                                langCtx.getText('signIn')
                                                            )}
                                                        </button>
                                                    </form>

                                                    <div className="mt-3 text-center">
                                                        <span className="text-muted">{langCtx.getText('dontHaveAccount')} </span>
                                                        <Link to="/register">{langCtx.getText('createOne')}</Link>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </AuthContainer>
                    );
                }}
            </LanguageContext.Consumer>
        );
    }
}

export default LoginPage;
