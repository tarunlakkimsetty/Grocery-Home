import React from 'react';
import { Link } from 'react-router-dom';
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
        const { isOpen, activeCategory, onSelectCategory, onClose } = this.props;
        const { role } = this.context;

        return (
            <LanguageContext.Consumer>
                {(langCtx) => (
                    <>
                        <SidebarOverlay $isOpen={isOpen} onClick={onClose} />
                        <SidebarWrapper $isOpen={isOpen}>
                            <SidebarSection>
                                <SidebarLabel>{langCtx.getText('selectCategory')}</SidebarLabel>
                                <CategoryGrains
                                    active={activeCategory === 'grains'}
                                    onClick={onSelectCategory}
                                />
                                <CategoryMilk
                                    active={activeCategory === 'milk'}
                                    onClick={onSelectCategory}
                                />
                                <CategorySnacks
                                    active={activeCategory === 'snacks'}
                                    onClick={onSelectCategory}
                                />
                                <CategorySpices
                                    active={activeCategory === 'spices'}
                                    onClick={onSelectCategory}
                                />
                                <CategoryOils
                                    active={activeCategory === 'oils'}
                                    onClick={onSelectCategory}
                                />
                                <CategoryCondiments
                                    active={activeCategory === 'condiments'}
                                    onClick={onSelectCategory}
                                />
                                <CategoryCleaning
                                    active={activeCategory === 'cleaning'}
                                    onClick={onSelectCategory}
                                />
                                <CategoryPersonalCare
                                    active={activeCategory === 'personal'}
                                    onClick={onSelectCategory}
                                />
                            </SidebarSection>

                            <SidebarSection>
                                <SidebarLabel>{langCtx.getText('home')}</SidebarLabel>
                                <Link to="/products" style={{ textDecoration: 'none' }}>
                                    <SidebarItem
                                        $active={activeCategory === 'ALL'}
                                        onClick={() => onSelectCategory('ALL')}
                                    >
                                        <span className="item-icon">🏠</span>
                                        <span className="item-label">{langCtx.getText('allProducts')}</span>
                                    </SidebarItem>
                                </Link>
                                {role === 'customer' && (
                                    <>
                                        <Link to="/cart" style={{ textDecoration: 'none' }}>
                                            <SidebarItem>
                                                <span className="item-icon">🛒</span>
                                                <span className="item-label">{langCtx.getText('cart')}</span>
                                            </SidebarItem>
                                        </Link>
                                        <Link to="/history" style={{ textDecoration: 'none' }}>
                                            <SidebarItem>
                                                <span className="item-icon">📋</span>
                                                <span className="item-label">{langCtx.getText('history')}</span>
                                            </SidebarItem>
                                        </Link>
                                    </>
                                )}
                                {role === 'admin' && (
                                    <>
                                        <Link to="/admin/add" style={{ textDecoration: 'none' }}>
                                            <SidebarItem>
                                                <span className="item-icon">➕</span>
                                                <span className="item-label">{langCtx.getText('addProduct')}</span>
                                            </SidebarItem>
                                        </Link>
                                        <Link to="/admin/bills" style={{ textDecoration: 'none' }}>
                                            <SidebarItem>
                                                <span className="item-icon">🧾</span>
                                                <span className="item-label">{langCtx.getText('bills')}</span>
                                            </SidebarItem>
                                        </Link>
                                        <Link to="/admin/analytics" style={{ textDecoration: 'none' }}>
                                            <SidebarItem>
                                                <span className="item-icon">📊</span>
                                                <span className="item-label">{langCtx.getText('analytics')}</span>
                                            </SidebarItem>
                                        </Link>
                                        <Link to="/admin/orders" style={{ textDecoration: 'none' }}>
                                            <SidebarItem>
                                                <span className="item-icon">🛵</span>
                                                <span className="item-label">{langCtx.getText('onlineOrders')}</span>
                                            </SidebarItem>
                                        </Link>
                                        <Link to="/admin/offline-orders" style={{ textDecoration: 'none' }}>
                                            <SidebarItem>
                                                <span className="item-icon">🧾</span>
                                                <span className="item-label">Offline Orders</span>
                                            </SidebarItem>
                                        </Link>
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
