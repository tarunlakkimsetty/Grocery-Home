import React from 'react';
import { Navigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import Spinner from '../components/Spinner';

class RoleBasedRoute extends React.Component {
    static contextType = AuthContext;

    render() {
        const { isAuthenticated, role, loading } = this.context;
        const { children, allowedRoles } = this.props;

        if (loading) {
            return <Spinner fullPage text="Checking permissions..." />;
        }

        if (!isAuthenticated) {
            return <Navigate to="/login" replace />;
        }

        if (allowedRoles && !allowedRoles.includes(role)) {
            return <Navigate to="/products" replace />;
        }

        return children;
    }
}

export default RoleBasedRoute;
