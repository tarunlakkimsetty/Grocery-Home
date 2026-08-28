import React from 'react';
import { NavLink } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import LanguageContext from '../context/LanguageContext';
import { toast } from 'react-toastify';
import chatService from '../services/chatService';
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

    state = { unreadChatCount: null, latestUnread: null };

    componentDidMount() {
        if (this.context.role === 'admin') this.loadUnreadChats();
        this.chatInterval = window.setInterval(this.loadUnreadChats, 15000);
    }

    componentDidUpdate(prevProps, prevState) {
    }

    componentWillUnmount() {
        window.clearInterval(this.chatInterval);
    }

    loadUnreadChats = async () => {
        if (this.context.role !== 'admin') return;
        try {
            const response = await chatService.getAdminChats();
            const conversations = response.conversations || [];
            const unreadChatCount = conversations.reduce((sum, item) => sum + Number(item.unread_for_admin || 0), 0);
            const latestUnread = conversations.find((item) => Number(item.unread_for_admin || 0) > 0);
            if (this.state.unreadChatCount !== null && this.state.unreadChatCount < unreadChatCount && latestUnread) {
                toast.info(`💬 ${latestUnread.customer_name}: ${latestUnread.last_message || 'New message'}`, {
                    autoClose: 5000,
                    onClick: () => { window.location.href = `/admin/chats?customerId=${latestUnread.customer_id}`; },
                });
            }
            this.setState({ unreadChatCount, latestUnread });
        } catch { /* chat status is non-critical to navigation */ }
    };

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
                                        <NavLink to="/suggested-products" style={{ textDecoration: 'none' }}>
                                            {({ isActive }) => (
                                                <SidebarItem $active={isActive}>
                                                    <span className="item-icon">🌟</span>
                                                    <span className="item-label">Suggested Products</span>
                                                </SidebarItem>
                                            )}
                                        </NavLink>
                                        <NavLink to="/starred" style={{ textDecoration: 'none' }}>
                                            {({ isActive }) => (
                                                <SidebarItem $active={isActive}>
                                                    <span className="item-icon">⭐</span>
                                                    <span className="item-label">Starred Products</span>
                                                </SidebarItem>
                                            )}
                                        </NavLink>
                                        <NavLink to="/offers" style={{ textDecoration: 'none' }}>
                                            {({ isActive }) => (
                                                <SidebarItem $active={isActive}>
                                                    <span className="item-icon">🔥</span>
                                                    <span className="item-label">Offers & Deals</span>
                                                </SidebarItem>
                                            )}
                                        </NavLink>
                                        <NavLink to="/recently-viewed" style={{ textDecoration: 'none' }}>
                                            {({ isActive }) => (
                                                <SidebarItem $active={isActive}>
                                                    <span className="item-icon">👀</span>
                                                    <span className="item-label">Recently Viewed</span>
                                                </SidebarItem>
                                            )}
                                        </NavLink>
                                        <NavLink to="/top-rated" style={{ textDecoration: 'none' }}>
                                            {({ isActive }) => (
                                                <SidebarItem $active={isActive}>
                                                    <span className="item-icon">⭐</span>
                                                    <span className="item-label">Top Rated</span>
                                                </SidebarItem>
                                            )}
                                        </NavLink>
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
                                        <NavLink to="/compare" style={{ textDecoration: 'none' }}>
                                            {({ isActive }) => (
                                                <SidebarItem $active={isActive}>
                                                    <span className="item-icon">🔄</span>
                                                    <span className="item-label">Compare Products</span>
                                                </SidebarItem>
                                            )}
                                        </NavLink>
                                        <NavLink to="/profile" style={{ textDecoration: 'none' }}>
                                            {({ isActive }) => (
                                                <SidebarItem $active={isActive}>
                                                    <span className="item-icon">👤</span>
                                                    <span className="item-label">My Profile</span>
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
                                        <NavLink to="/admin/suggested-products" style={{ textDecoration: 'none' }}>
                                            {({ isActive }) => (
                                                <SidebarItem $active={isActive}>
                                                    <span className="item-icon">🌟</span>
                                                    <span className="item-label">Suggested Products</span>
                                                </SidebarItem>
                                            )}
                                        </NavLink>
                                        <NavLink to="/admin/product-ratings" style={{ textDecoration: 'none' }}>
                                            {({ isActive }) => (
                                                <SidebarItem $active={isActive}>
                                                    <span className="item-icon">⭐</span>
                                                    <span className="item-label">Product Ratings</span>
                                                </SidebarItem>
                                            )}
                                        </NavLink>
                                        <NavLink to="/admin/low-stock" style={{ textDecoration: 'none' }}>
                                            {({ isActive }) => (
                                                <SidebarItem $active={isActive}>
                                                    <span className="item-icon">⚠️</span>
                                                    <span className="item-label">Low Stock</span>
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
                                        <NavLink to="/admin/list-orders-converted" style={{ textDecoration: 'none' }}>
                                            {({ isActive }) => (
                                                <SidebarItem $active={isActive}>
                                                    <span className="item-icon">📋✓</span>
                                                    <span className="item-label">List Orders Converted</span>
                                                </SidebarItem>
                                            )}
                                        </NavLink>
                                        <NavLink to="/admin/list-order-bills" style={{ textDecoration: 'none' }}>
                                            {({ isActive }) => (
                                                <SidebarItem $active={isActive}>
                                                    <span className="item-icon">🧾📋</span>
                                                    <span className="item-label">List Order Bills</span>
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
                                        <NavLink to="/admin/chats" style={{ textDecoration: 'none' }}>
                                            {({ isActive }) => (
                                                <SidebarItem $active={isActive}>
                                                    <span className="item-icon">💬</span>
                                                    <span className="item-label">Customer Chats{this.state.unreadChatCount > 0 ? ` ${this.state.unreadChatCount}` : ''}</span>
                                                </SidebarItem>
                                            )}
                                        </NavLink>
                                        <NavLink to="/admin/announcements" style={{ textDecoration: 'none' }}>
                                            {({ isActive }) => (
                                                <SidebarItem $active={isActive}>
                                                    <span className="item-icon">📢</span>
                                                    <span className="item-label">Announcements</span>
                                                </SidebarItem>
                                            )}
                                        </NavLink>
                                        <NavLink to="/admin/order-availability" style={{ textDecoration: 'none' }}>
                                            {({ isActive }) => (
                                                <SidebarItem $active={isActive}>
                                                    <span className="item-icon">⚙️</span>
                                                    <span className="item-label">Order Availability</span>
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
