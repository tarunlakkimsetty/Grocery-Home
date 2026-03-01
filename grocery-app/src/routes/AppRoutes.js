import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import RoleBasedRoute from './RoleBasedRoute';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import ProductsPage from '../pages/ProductsPage';
import CartPage from '../pages/CartPage';
import BillHistoryPage from '../pages/BillHistoryPage';
import BillDetailsPage from '../pages/BillDetailsPage';
import AddProductPage from '../pages/AddProductPage';
import AdminBillsPage from '../pages/AdminBillsPage';
import AnalyticsPage from '../pages/AnalyticsPage';
import AdminOnlineOrdersPage from '../pages/AdminOnlineOrdersPage';
import AdminOfflineOrdersPage from '../pages/AdminOfflineOrdersPage';

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

class AppRoutes extends React.Component {
    render() {
        const { activeCategory } = this.props;

        return (
            <Routes>
                {/* Auth Routes */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />

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
                    path="/admin/bills"
                    element={
                        <RoleBasedRoute allowedRoles={['admin']}>
                            <AdminBillsPage />
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

                {/* Default redirect */}
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
        );
    }
}

export default AppRoutes;
