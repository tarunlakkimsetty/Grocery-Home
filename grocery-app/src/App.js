import React from 'react';
import { BrowserRouter, useLocation, useNavigate } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import 'bootstrap/dist/css/bootstrap.min.css';

import theme from './styledComponents/theme';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { LanguageProvider } from './context/LanguageContext';
import { LegalModalProvider } from './context/LegalModalContext';
import AuthContext from './context/AuthContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import FeedbackManager from './components/FeedbackManager';
import CustomerFooter from './components/CustomerFooter';
import AppRoutes from './routes/AppRoutes';
import { AppContainer, MainContent } from './styledComponents/LayoutStyles';

// React Router future flags to silence warnings
const routerFutureFlags = {
    v7_startTransition: true,
    v7_relativeSplatPath: true,
};

class AppContent extends React.Component {
  static contextType = AuthContext;

  constructor(props) {
    super(props);
    this.state = {
      sidebarOpen: false,
      activeCategory: 'ALL',
    };
  }

  toggleSidebar = () => {
    this.setState((prev) => ({ sidebarOpen: !prev.sidebarOpen }));
  };

  closeSidebar = () => {
    this.setState({ sidebarOpen: false });
  };

  handleSelectCategory = (category) => {
    const { navigate, location } = this.props;

    this.setState({ activeCategory: category, sidebarOpen: false }, () => {
      // Navigate to products page (client-side) without losing selected category state.
      if (location?.pathname !== '/products') {
        navigate('/products');
      }
    });
  };

  componentDidUpdate(prevProps) {
    const prevPath = prevProps?.location?.pathname || '';
    const nextPath = this.props?.location?.pathname || '';

    if (prevPath === nextPath) return;

    const wasProducts = prevPath.startsWith('/products');
    const isProducts = nextPath.startsWith('/products');

    // Reset category highlight when leaving the All Products page.
    if (wasProducts && !isProducts && this.state.activeCategory !== 'ALL') {
      this.setState({ activeCategory: 'ALL' });
    }
  }

  render() {
    const { isAuthenticated, role } = this.context;
    const pathname = this.props.location?.pathname || '';
    const { sidebarOpen, activeCategory } = this.state;

    const normalizedRole = String(role || '').toLowerCase();
    const isCustomer = normalizedRole === 'customer';
    const isAdmin = normalizedRole === 'admin';

    const showFooterOnPublicCustomerPages =
      !isAuthenticated && ['/login', '/register', '/privacy', '/terms', '/contact'].includes(pathname);
    const shouldShowCustomerFooter = (!isAdmin && isAuthenticated && isCustomer) || showFooterOnPublicCustomerPages;

    return (
      <AppContainer>
        <Navbar onToggleSidebar={this.toggleSidebar} />
        {isAuthenticated && (
          <Sidebar
            isOpen={sidebarOpen}
            activeCategory={activeCategory}
            onSelectCategory={this.handleSelectCategory}
            onClose={this.closeSidebar}
            pathname={this.props.location?.pathname}
          />
        )}
        {isAuthenticated ? (
          <MainContent>
            <AppRoutes activeCategory={activeCategory} />
          </MainContent>
        ) : (
          <AppRoutes activeCategory={activeCategory} />
        )}

        {isAuthenticated && isCustomer && <FeedbackManager />}
        {shouldShowCustomerFooter && <CustomerFooter withSidebar={isAuthenticated} />}
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="colored"
        />
      </AppContainer>
    );
  }
}

class App extends React.Component {
  render() {
    return (
      <ThemeProvider theme={theme}>
        <BrowserRouter future={routerFutureFlags}>
          <LanguageProvider>
            <AuthProvider>
              <CartProvider>
                <LegalModalProvider>
                  <AppContentWithRouter />
                </LegalModalProvider>
              </CartProvider>
            </AuthProvider>
          </LanguageProvider>
        </BrowserRouter>
      </ThemeProvider>
    );
  }
}

function AppContentWithRouter() {
  const navigate = useNavigate();
  const location = useLocation();
  return <AppContent navigate={navigate} location={location} />;
}

export default App;
