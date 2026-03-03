import React from 'react';
import AuthContext from '../context/AuthContext';
import CartContext from '../context/CartContext';
import LanguageContext from '../context/LanguageContext';
import { Link } from 'react-router-dom';
import LanguageToggle from './LanguageToggle';
import {
    NavbarWrapper,
    NavBrand,
    NavActions,
    UserInfo,
    LogoutButton,
    HamburgerButton,
} from '../styledComponents/NavbarStyles';

class Navbar extends React.Component {
    static contextType = AuthContext;

    render() {
        const { user, isAuthenticated, logout, role } = this.context;
        const { onToggleSidebar } = this.props;

        return (
            <LanguageContext.Consumer>
                {(langCtx) => (
                    <React.Fragment>
                        <NavbarWrapper>
                            <div className="container-fluid d-flex justify-content-between align-items-center py-2" style={{ minWidth: 0 }}>
                                <div className="d-flex align-items-center gap-2" style={{ minWidth: 0, maxWidth: isAuthenticated ? '60%' : '100%' }}>
                                    {isAuthenticated && (
                                        <HamburgerButton onClick={onToggleSidebar} aria-label="Toggle sidebar">
                                            ☰
                                        </HamburgerButton>
                                    )}

                                    <Link to={isAuthenticated ? '/products' : '/login'} style={{ textDecoration: 'none', minWidth: 0 }}>
                                        <NavBrand>
                                            <div className="logo-icon">🛒</div>
                                            <div className="d-flex flex-column" style={{ minWidth: 0 }}>
                                                <div
                                                    className="brand-text fw-bold d-flex align-items-center gap-2"
                                                    title={`${langCtx.getText('shopName')} | ${langCtx.getText('phoneLink')}`}
                                                    style={{ minWidth: 0 }}
                                                >
                                                    <span className="text-truncate" style={{ minWidth: 0 }}>
                                                        {langCtx.getText('shopName')}
                                                    </span>

                                                    {isAuthenticated && role === 'customer' && (
                                                        <span
                                                            className="fw-semibold opacity-75"
                                                            style={{ whiteSpace: 'nowrap', fontSize: '0.85em' }}
                                                        >
                                                            | {langCtx.getText('phoneLink')}
                                                        </span>
                                                    )}
                                                </div>

                                                {isAuthenticated && (
                                                    <small
                                                        className="text-light opacity-75 text-truncate"
                                                        title={`${langCtx.getText('ownerName')} | ${langCtx.getText('address').split('\n').join(', ')}`}
                                                        style={{ maxWidth: '100%' }}
                                                    >
                                                        {langCtx.getText('ownerName')} | {langCtx.getText('address').split('\n').join(', ')}
                                                    </small>
                                                )}
                                            </div>
                                        </NavBrand>
                                    </Link>
                                </div>

                                {isAuthenticated && (
                                    <NavActions className="d-flex align-items-center gap-3 flex-shrink-0">
                                        <LanguageToggle />

                                        <CartContext.Consumer>
                                            {(cartCtx) => (
                                                <Link to="/cart" className="text-decoration-none position-relative">
                                                    <span style={{ fontSize: '1.5rem', color: 'white', cursor: 'pointer' }}>🛒</span>
                                                    {cartCtx.getItemCount() > 0 && (
                                                        <span
                                                            className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
                                                            style={{ fontSize: '0.7rem' }}
                                                        >
                                                            {cartCtx.getItemCount()}
                                                        </span>
                                                    )}
                                                </Link>
                                            )}
                                        </CartContext.Consumer>

                                        <UserInfo>
                                            <div className="user-avatar">
                                                {user && user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                                            </div>
                                            <div className="user-meta text-end">
                                                <span className="user-name">{user ? user.name : 'User'}</span>
                                                {user && user.phone && <small className="user-phone">{user.phone}</small>}
                                            </div>
                                        </UserInfo>

                                        <LogoutButton onClick={logout}>⏻ {langCtx.getText('logout')}</LogoutButton>
                                    </NavActions>
                                )}
                            </div>
                        </NavbarWrapper>
                    </React.Fragment>
                )}
            </LanguageContext.Consumer>
        );
    }
}

export default Navbar;
