import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import RoleBasedRoute from './RoleBasedRoute';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import ForgotPasswordPage from '../pages/ForgotPasswordPage';
import ProductsPage from '../pages/ProductsPage';
import StarredProductsPage from '../pages/StarredProductsPage';
import SuggestedProductsPage from '../pages/SuggestedProductsPage';
import OffersDealsPage from '../pages/OffersDealsPage';
import RecentlyViewedPage from '../pages/RecentlyViewedPage';
import TopRatedProductsPage from '../pages/TopRatedProductsPage';
import CompareProductsPage from '../pages/CompareProductsPage';
import CustomerProfilePage from '../pages/CustomerProfilePage';
import CartPage from '../pages/CartPage';
import BillHistoryPage from '../pages/BillHistoryPage';
import BillDetailsPage from '../pages/BillDetailsPage';
import AddProductPage from '../pages/AddProductPage';
import AdminLowStockPage from '../pages/AdminLowStockPage';
import AdminOnlineBillsPage from '../pages/AdminOnlineBillsPage';
import AdminOfflineBillsPage from '../pages/AdminOfflineBillsPage';
import AnalyticsPage from '../pages/AnalyticsPage';
import AdminOnlineOrdersPage from '../pages/AdminOnlineOrdersPage';
import AdminOfflineOrdersPage from '../pages/AdminOfflineOrdersPage';
import AdminCustomerDetailsPage from '../pages/AdminCustomerDetailsPage';
import AdminCustomerViewPage from '../pages/AdminCustomerViewPage';
import AdminSuggestedProductsPage from '../pages/AdminSuggestedProductsPage';
import AdminProductRatingsPage from '../pages/AdminProductRatingsPage';
import ListOrdersUploadPage from '../pages/ListOrdersUploadPage';
import AdminListOrdersPage from '../pages/AdminListOrdersPage';
import AdminListOrdersConvertedPage from '../pages/AdminListOrdersConvertedPage';
import AdminListOrderBillsPage from '../pages/AdminListOrderBillsPage';
import PrivacyPolicyPage from '../pages/PrivacyPolicyPage';
import TermsConditionsPage from '../pages/TermsConditionsPage';
import ContactPage from '../pages/ContactPage';
import AdminChatsPage from '../pages/AdminChatsPage';
import AdminAnnouncementsPage from '../pages/AdminAnnouncementsPage';
import AdminOrderAvailabilityPage from '../pages/AdminOrderAvailabilityPage';

// Wrapper to extract route params for class components
class BillDetailsWrapper extends React.Component {
    render() {
        // React Router v6 doesn't pass params to class components directly,
        // so we extract from window.location
        const path = window.location.pathname;
        const billId = path.split('/bill/')[1];
        return <BillDetailsPage billId={billId} onGoBack={() => window.history.back()} />;
    }
}

// Wrapper to extract route params for class components
class AdminCustomerViewWrapper extends React.Component {
    render() {
        const path = window.location.pathname;
        const customerId = path.split('/admin/customers/')[1];
        return (
            <AdminCustomerViewPage
                customerId={customerId}
                onGoBack={() => window.history.back()}
            />
        );
    }
}

class AppRoutes extends React.Component {
    render() {
        const { activeCategory } = this.props;

        return (
            <Routes>
                {/* Auth Routes */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />

                {/* Protected Routes */}
                <Route
                    path="/products"
                    element={
                        <ProtectedRoute>
                            <ProductsPage activeCategory={activeCategory} />
                        </ProtectedRoute>
                    }
                />

                {/* Customer Routes */}
                <Route
                    path="/suggested-products"
                    element={
                        <RoleBasedRoute allowedRoles={['customer']}>
                            <SuggestedProductsPage />
                        </RoleBasedRoute>
                    }
                />
                <Route
                    path="/starred"
                    element={
                        <RoleBasedRoute allowedRoles={['customer']}>
                            <StarredProductsPage />
                        </RoleBasedRoute>
                    }
                />
                <Route
                    path="/offers"
                    element={
                        <RoleBasedRoute allowedRoles={['customer']}>
                            <OffersDealsPage />
                        </RoleBasedRoute>
                    }
                />
                <Route
                    path="/recently-viewed"
                    element={
                        <RoleBasedRoute allowedRoles={['customer']}>
                            <RecentlyViewedPage />
                        </RoleBasedRoute>
                    }
                />
                <Route
                    path="/top-rated"
                    element={
                        <RoleBasedRoute allowedRoles={['customer']}>
                            <TopRatedProductsPage />
                        </RoleBasedRoute>
                    }
                />
                <Route
                    path="/compare"
                    element={
                        <RoleBasedRoute allowedRoles={['customer']}>
                            <CompareProductsPage />
                        </RoleBasedRoute>
                    }
                />
                <Route
                    path="/profile"
                    element={
                        <RoleBasedRoute allowedRoles={['customer']}>
                            <CustomerProfilePage />
                        </RoleBasedRoute>
                    }
                />
                <Route
                    path="/cart"
                    element={
                        <RoleBasedRoute allowedRoles={['customer']}>
                            <CartPage />
                        </RoleBasedRoute>
                    }
                />
                <Route
                    path="/history"
                    element={
                        <RoleBasedRoute allowedRoles={['customer']}>
                            <BillHistoryPage />
                        </RoleBasedRoute>
                    }
                />
                <Route
                    path="/bill/:id"
                    element={
                        <ProtectedRoute>
                            <BillDetailsWrapper />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/upload-grocery-list"
                    element={
                        <RoleBasedRoute allowedRoles={['customer']}>
                            <ListOrdersUploadPage />
                        </RoleBasedRoute>
                    }
                />

                {/* Admin Routes */}
                <Route
                    path="/admin/add"
                    element={
                        <RoleBasedRoute allowedRoles={['admin']}>
                            <AddProductPage />
                        </RoleBasedRoute>
                    }
                />
                <Route
                    path="/admin/suggested-products"
                    element={
                        <RoleBasedRoute allowedRoles={['admin']}>
                            <AdminSuggestedProductsPage />
                        </RoleBasedRoute>
                    }
                />
                <Route
                    path="/admin/low-stock"
                    element={
                        <RoleBasedRoute allowedRoles={['admin']}>
                            <AdminLowStockPage />
                        </RoleBasedRoute>
                    }
                />
                <Route
                    path="/admin/product-ratings"
                    element={
                        <RoleBasedRoute allowedRoles={['admin']}>
                            <AdminProductRatingsPage />
                        </RoleBasedRoute>
                    }
                />
                <Route
                    path="/admin/chats"
                    element={
                        <RoleBasedRoute allowedRoles={['admin']}>
                            <AdminChatsPage />
                        </RoleBasedRoute>
                    }
                />
                <Route
                    path="/admin/announcements"
                    element={
                        <RoleBasedRoute allowedRoles={['admin']}>
                            <AdminAnnouncementsPage />
                        </RoleBasedRoute>
                    }
                />
                <Route
                    path="/admin/order-availability"
                    element={
                        <RoleBasedRoute allowedRoles={['admin']}>
                            <AdminOrderAvailabilityPage />
                        </RoleBasedRoute>
                    }
                />
                <Route
                    path="/admin/bills"
                    element={
                        <RoleBasedRoute allowedRoles={['admin']}>
                            <Navigate to="/admin/online-bills" replace />
                        </RoleBasedRoute>
                    }
                />
                <Route
                    path="/admin/online-bills"
                    element={
                        <RoleBasedRoute allowedRoles={['admin']}>
                            <AdminOnlineBillsPage />
                        </RoleBasedRoute>
                    }
                />
                <Route
                    path="/admin/offline-bills"
                    element={
                        <RoleBasedRoute allowedRoles={['admin']}>
                            <AdminOfflineBillsPage />
                        </RoleBasedRoute>
                    }
                />
                <Route
                    path="/admin/analytics"
                    element={
                        <RoleBasedRoute allowedRoles={['admin']}>
                            <AnalyticsPage />
                        </RoleBasedRoute>
                    }
                />
                <Route
                    path="/admin/orders"
                    element={
                        <RoleBasedRoute allowedRoles={['admin']}>
                            <AdminOnlineOrdersPage />
                        </RoleBasedRoute>
                    }
                />
                <Route
                    path="/admin/offline-orders"
                    element={
                        <RoleBasedRoute allowedRoles={['admin']}>
                            <AdminOfflineOrdersPage />
                        </RoleBasedRoute>
                    }
                />
                <Route
                    path="/admin/list-orders"
                    element={
                        <RoleBasedRoute allowedRoles={['admin']}>
                            <AdminListOrdersPage />
                        </RoleBasedRoute>
                    }
                />

                <Route
                    path="/admin/list-orders-converted"
                    element={
                        <RoleBasedRoute allowedRoles={['admin']}>
                            <AdminListOrdersConvertedPage />
                        </RoleBasedRoute>
                    }
                />

                <Route
                    path="/admin/list-order-bills"
                    element={
                        <RoleBasedRoute allowedRoles={['admin']}>
                            <AdminListOrderBillsPage />
                        </RoleBasedRoute>
                    }
                />

                <Route
                    path="/admin/customers"
                    element={
                        <RoleBasedRoute allowedRoles={['admin']}>
                            <AdminCustomerDetailsPage />
                        </RoleBasedRoute>
                    }
                />

                <Route
                    path="/admin/customers/:id"
                    element={
                        <RoleBasedRoute allowedRoles={['admin']}>
                            <AdminCustomerViewWrapper />
                        </RoleBasedRoute>
                    }
                />

                {/* Legal / Info Pages (Customer + Admin) */}
                <Route
                    path="/privacy"
                    element={<PrivacyPolicyPage />}
                />
                <Route
                    path="/terms"
                    element={<TermsConditionsPage />}
                />
                <Route
                    path="/contact"
                    element={<ContactPage />}
                />

                {/* Default redirect */}
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
        );
    }
}

export default AppRoutes;
