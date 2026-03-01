import React from 'react';
import { Navigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import Spinner from '../components/Spinner';

class ProtectedRoute extends React.Component {
    static contextType = AuthContext;

    render() {
        const { isAuthenticated, loading } = this.context;
        const { children } = this.props;

        if (loading) {
            return <Spinner fullPage text="Checking authentication..." />;
        }

        if (!isAuthenticated) {
            return <Navigate to="/login" replace />;
        }

        return children;
    }
}

export default ProtectedRoute;
