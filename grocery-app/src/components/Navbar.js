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
    CartLink,
    CartBadge,
    UserInfo,
    LogoutButton,
    HamburgerButton,
    NavTopRow,
    NavBottomRow,
    NavBrandMobile,
    NavIconButton,
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
                            {/* Desktop Layout - Hide on mobile */}
                            <div className="d-flex d-none d-md-flex justify-content-between align-items-center" style={{ width: '100%' }}>
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
                                                (() => {
                                                    const count = cartCtx.getItemCount();
                                                    return (
                                                        <CartLink to="/cart" aria-label="Cart">
                                                            <span style={{ fontSize: '1.5rem', color: 'white', cursor: 'pointer' }}>🛒</span>
                                                            {count > 0 && <CartBadge>{count}</CartBadge>}
                                                        </CartLink>
                                                    );
                                                })()
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

                            {/* Mobile Layout - Show only on mobile (≤768px) */}
                            {isAuthenticated && (
                                <>
                                    {/* Top Row: Hamburger + Shop Name */}
                                    <NavTopRow>
                                        <HamburgerButton onClick={onToggleSidebar} aria-label="Toggle sidebar">
                                            ☰
                                        </HamburgerButton>

                                        <Link to="/products" style={{ textDecoration: 'none', flex: 1, minWidth: 0 }}>
                                            <NavBrandMobile>
                                                <div className="logo-icon">🛒</div>
                                                <div className="brand-text">{langCtx.getText('shopName')}</div>
                                            </NavBrandMobile>
                                        </Link>
                                    </NavTopRow>

                                    {/* Bottom Row: Language + Cart + Profile */}
                                    <NavBottomRow>
                                        <LanguageToggle />

                                        <CartContext.Consumer>
                                            {(cartCtx) => (
                                                (() => {
                                                    const count = cartCtx.getItemCount();
                                                    return (
                                                        <CartLink to="/cart" aria-label="Cart" style={{ position: 'relative' }}>
                                                            <NavIconButton as="span">🛒</NavIconButton>
                                                            {count > 0 && <CartBadge>{count}</CartBadge>}
                                                        </CartLink>
                                                    );
                                                })()
                                            )}
                                        </CartContext.Consumer>

                                        <UserInfo style={{ padding: '0.4rem 0.75rem', background: 'transparent', border: 'none' }}>
                                            <div className="user-avatar">
                                                {user && user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                                            </div>
                                        </UserInfo>

                                        <LogoutButton onClick={logout}>⏻</LogoutButton>
                                    </NavBottomRow>
                                </>
                            )}
                        </NavbarWrapper>
                    </React.Fragment>
                )}
            </LanguageContext.Consumer>
        );
    }
}

export default Navbar;
