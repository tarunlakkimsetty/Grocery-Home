import React from 'react';
import { NavLink } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import LanguageContext from '../context/LanguageContext';
import {
    SidebarWrapper,
    SidebarOverlay,
    SidebarSection,
    SidebarLabel,
    SidebarItem,
} from '../styledComponents/SidebarStyles';
import {
    CategoryGrains,
    CategoryMilk,
    CategorySnacks,
    CategorySpices,
    CategoryOils,
    CategoryCondiments,
    CategoryCleaning,
    CategoryPersonalCare,
} from './categories/CategoryItems';

class Sidebar extends React.Component {
    static contextType = AuthContext;

    render() {
        const { isOpen, activeCategory, onSelectCategory, onClose, pathname } = this.props;
        const { role } = this.context;
        const currentPath = pathname || '';
        const isProductsPage = currentPath.startsWith('/products');

        return (
            <LanguageContext.Consumer>
                {(langCtx) => (
                    <>
                        <SidebarOverlay $isOpen={isOpen} onClick={onClose} />
                        <SidebarWrapper $isOpen={isOpen}>
                            <SidebarSection>
                                <SidebarLabel>{langCtx.getText('selectCategory')}</SidebarLabel>
                                <CategoryGrains
                                    active={isProductsPage && activeCategory === 'grains'}
                                    onClick={onSelectCategory}
                                />
                                <CategoryMilk
                                    active={isProductsPage && activeCategory === 'milk'}
                                    onClick={onSelectCategory}
                                />
                                <CategorySnacks
                                    active={isProductsPage && activeCategory === 'snacks'}
                                    onClick={onSelectCategory}
                                />
                                <CategorySpices
                                    active={isProductsPage && activeCategory === 'spices'}
                                    onClick={onSelectCategory}
                                />
                                <CategoryOils
                                    active={isProductsPage && activeCategory === 'oils'}
                                    onClick={onSelectCategory}
                                />
                                <CategoryCondiments
                                    active={isProductsPage && activeCategory === 'condiments'}
                                    onClick={onSelectCategory}
                                />
                                <CategoryCleaning
                                    active={isProductsPage && activeCategory === 'cleaning'}
                                    onClick={onSelectCategory}
                                />
                                <CategoryPersonalCare
                                    active={isProductsPage && activeCategory === 'personal'}
                                    onClick={onSelectCategory}
                                />
                            </SidebarSection>

                            <SidebarSection>
                                <SidebarLabel>{langCtx.getText('home')}</SidebarLabel>
                                <NavLink to="/products" style={{ textDecoration: 'none' }}>
                                    {() => (
                                        <SidebarItem
                                            $active={isProductsPage && activeCategory === 'ALL'}
                                            onClick={() => onSelectCategory('ALL')}
                                        >
                                            <span className="item-icon">🏠</span>
                                            <span className="item-label">{langCtx.getText('allProducts')}</span>
                                        </SidebarItem>
                                    )}
                                </NavLink>
                                {role === 'customer' && (
                                    <>
                                        <NavLink to="/cart" style={{ textDecoration: 'none' }}>
                                            {({ isActive }) => (
                                                <SidebarItem $active={isActive}>
                                                    <span className="item-icon">🛒</span>
                                                    <span className="item-label">{langCtx.getText('cart')}</span>
                                                </SidebarItem>
                                            )}
                                        </NavLink>
                                        <NavLink to="/history" style={{ textDecoration: 'none' }}>
                                            {({ isActive }) => (
                                                <SidebarItem $active={isActive}>
                                                    <span className="item-icon">📋</span>
                                                    <span className="item-label">{langCtx.getText('history')}</span>
                                                </SidebarItem>
                                            )}
                                        </NavLink>
                                        <NavLink to="/upload-grocery-list" style={{ textDecoration: 'none' }}>
                                            {({ isActive }) => (
                                                <SidebarItem $active={isActive}>
                                                    <span className="item-icon">📸</span>
                                                    <span className="item-label">Upload List</span>
                                                </SidebarItem>
                                            )}
                                        </NavLink>
                                    </>
                                )}
                                {role === 'admin' && (
                                    <>
                                        <NavLink to="/admin/add" style={{ textDecoration: 'none' }}>
                                            {({ isActive }) => (
                                                <SidebarItem $active={isActive}>
                                                    <span className="item-icon">➕</span>
                                                    <span className="item-label">{langCtx.getText('addProduct')}</span>
                                                </SidebarItem>
                                            )}
                                        </NavLink>
                                        <NavLink to="/admin/online-bills" style={{ textDecoration: 'none' }}>
                                            {({ isActive }) => (
                                                <SidebarItem $active={isActive}>
                                                    <span className="item-icon">🧾</span>
                                                    <span className="item-label">Online Bills</span>
                                                </SidebarItem>
                                            )}
                                        </NavLink>
                                        <NavLink to="/admin/offline-bills" style={{ textDecoration: 'none' }}>
                                            {({ isActive }) => (
                                                <SidebarItem $active={isActive}>
                                                    <span className="item-icon">🧾</span>
                                                    <span className="item-label">Offline Bills</span>
                                                </SidebarItem>
                                            )}
                                        </NavLink>
                                        <NavLink to="/admin/analytics" style={{ textDecoration: 'none' }}>
                                            {({ isActive }) => (
                                                <SidebarItem $active={isActive}>
                                                    <span className="item-icon">📊</span>
                                                    <span className="item-label">{langCtx.getText('analytics')}</span>
                                                </SidebarItem>
                                            )}
                                        </NavLink>
                                        <NavLink to="/admin/orders" style={{ textDecoration: 'none' }}>
                                            {({ isActive }) => (
                                                <SidebarItem $active={isActive}>
                                                    <span className="item-icon">🛵</span>
                                                    <span className="item-label">{langCtx.getText('onlineOrders')}</span>
                                                </SidebarItem>
                                            )}
                                        </NavLink>
                                        <NavLink to="/admin/offline-orders" style={{ textDecoration: 'none' }}>
                                            {({ isActive }) => (
                                                <SidebarItem $active={isActive}>
                                                    <span className="item-icon">🧾</span>
                                                    <span className="item-label">{langCtx.getText('offlineOrders')}</span>
                                                </SidebarItem>
                                            )}
                                        </NavLink>
                                        <NavLink to="/admin/list-orders" style={{ textDecoration: 'none' }}>
                                            {({ isActive }) => (
                                                <SidebarItem $active={isActive}>
                                                    <span className="item-icon">📋</span>
                                                    <span className="item-label">List Orders</span>
                                                </SidebarItem>
                                            )}
                                        </NavLink>
                                        <NavLink to="/admin/customers" style={{ textDecoration: 'none' }}>
                                            {({ isActive }) => (
                                                <SidebarItem $active={isActive}>
                                                    <span className="item-icon">👤</span>
                                                    <span className="item-label">{langCtx.getText('customerDetails')}</span>
                                                </SidebarItem>
                                            )}
                                        </NavLink>
                                    </>
                                )}
                            </SidebarSection>
                        </SidebarWrapper>
                    </>
                )}
            </LanguageContext.Consumer>
        );
    }
}

export default Sidebar;
