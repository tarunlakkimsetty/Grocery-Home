import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import 'bootstrap/dist/css/bootstrap.min.css';

import theme from './styledComponents/theme';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { LanguageProvider } from './context/LanguageContext';
import AuthContext from './context/AuthContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import FeedbackManager from './components/FeedbackManager';
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
    this.setState({ activeCategory: category, sidebarOpen: false });
    // Navigate to products page
    if (window.location.pathname !== '/products') {
      window.location.href = '/products';
    }
  };

  render() {
    const { isAuthenticated, role } = this.context;
    const { sidebarOpen, activeCategory } = this.state;

    return (
      <AppContainer>
        <Navbar onToggleSidebar={this.toggleSidebar} />
        {isAuthenticated && (
          <Sidebar
            isOpen={sidebarOpen}
            activeCategory={activeCategory}
            onSelectCategory={this.handleSelectCategory}
            onClose={this.closeSidebar}
          />
        )}
        {isAuthenticated ? (
          <MainContent>
            <AppRoutes activeCategory={activeCategory} />
          </MainContent>
        ) : (
          <AppRoutes activeCategory={activeCategory} />
        )}

        {isAuthenticated && String(role || '').toLowerCase() === 'customer' && <FeedbackManager />}
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
                <AppContent />
              </CartProvider>
            </AuthProvider>
          </LanguageProvider>
        </BrowserRouter>
      </ThemeProvider>
    );
  }
}

export default App;
