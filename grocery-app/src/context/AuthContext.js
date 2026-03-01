import React from 'react';
import authService from '../services/authService';

const AuthContext = React.createContext({
    user: null,
    token: null,
    isAuthenticated: false,
    role: null,
    loading: true,
    login: () => { },
    register: () => { },
    logout: () => { },
});

class AuthProvider extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            user: null,
            token: null,
            isAuthenticated: false,
            role: null,
            loading: true,
        };
        this.login = this.login.bind(this);
        this.register = this.register.bind(this);
        this.logout = this.logout.bind(this);
    }

    componentDidMount() {
        const token = localStorage.getItem('token');
        const user = authService.getCurrentUser();
        if (token && user) {
            this.setState({
                user,
                token,
                isAuthenticated: true,
                role: user.role,
                loading: false,
            });
        } else {
            this.setState({ loading: false });
        }
    }

    async login(phone, password) {
        const data = await authService.login(phone, password);
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        this.setState({
            user: data.user,
            token: data.token,
            isAuthenticated: true,
            role: data.user.role,
        });
        return data;
    }

    async register(formData) {
        const data = await authService.register(formData);
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        this.setState({
            user: data.user,
            token: data.token,
            isAuthenticated: true,
            role: data.user.role,
        });
        return data;
    }

    logout() {
        authService.logout();
        this.setState({
            user: null,
            token: null,
            isAuthenticated: false,
            role: null,
        });
    }

    render() {
        const value = {
            user: this.state.user,
            token: this.state.token,
            isAuthenticated: this.state.isAuthenticated,
            role: this.state.role,
            loading: this.state.loading,
            login: this.login,
            register: this.register,
            logout: this.logout,
        };

        return (
            <AuthContext.Provider value={value}>
                {this.props.children}
            </AuthContext.Provider>
        );
    }
}

export { AuthContext, AuthProvider };
export default AuthContext;
