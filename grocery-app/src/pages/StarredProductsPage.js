import React from 'react';
import favoriteService from '../services/favoriteService';
import ProductCard from '../components/ProductCard';
import SearchBar from '../components/SearchBar';
import Spinner from '../components/Spinner';
import LanguageContext from '../context/LanguageContext';
import FavoritesContext from '../context/FavoritesContext';
import { toast } from 'react-toastify';
import { PageHeader } from '../styledComponents/LayoutStyles';
import { EmptyState } from '../styledComponents/FormStyles';
import { searchProducts } from '../utils/searchUtils';

class StarredProductsPage extends React.Component {
    static contextType = LanguageContext;

    constructor(props) {
        super(props);
        this.state = {
            favorites: [],
            filteredFavorites: [],
            loading: true,
            error: null,
            searchQuery: '',
            count: 0,
        };
    }

    componentDidMount() {
        this.fetchFavorites();
    }

    componentDidUpdate(prevProps, prevState) {
        // Re-fetch if the search query changed
        // Also check if favorites context has changed by comparing counts
        if (this.context && this.context.favoriteIds) {
            // This is a simple way to detect if favorites have changed
            // In a real app, you might want to listen to context changes more explicitly
        }
    }

    fetchFavorites = async () => {
        this.setState({ loading: true, error: null });
        try {
            const response = await favoriteService.getFavorites(1, 1000);
            
            // Handle the response structure - favorites is the array of products
            const favorites = response.favorites || response.data || [];
            const total = response.total || favorites.length || 0;
            
            console.log('Fetched favorites response:', response);
            console.log('Favorites array:', favorites);

            const searchQuery = (this.state.searchQuery || '').trim();
            const safeFavorites = Array.isArray(favorites) ? favorites : [];
            
            // Use enhanced search with Telugu and English support
            const filteredFavorites = searchQuery
                ? searchProducts(safeFavorites, searchQuery, this.context.getText)
                : safeFavorites;

            this.setState({ 
                favorites: safeFavorites, 
                filteredFavorites, 
                loading: false,
                count: total,
                error: null
            });
        } catch (err) {
            console.error('Error fetching favorites:', err);
            // If it's an auth error, it will be handled globally
            // Otherwise show a user-friendly error
            if (err.response?.status === 401) {
                this.setState({ error: 'Please log in to view favorites', loading: false });
            } else if (err.response?.status === 404 || !err.response) {
                // 404 means no endpoint, show empty state instead
                this.setState({ 
                    favorites: [], 
                    filteredFavorites: [],
                    loading: false,
                    count: 0,
                    error: null
                });
            } else {
                this.setState({ error: 'Failed to load starred products', loading: false });
                toast.error('Failed to load starred products');
            }
        }
    };

    handleSearch = (searchQuery) => {
        const { favorites } = this.state;
        const safeFavorites = Array.isArray(favorites) ? favorites : [];
        
        if (!searchQuery.trim()) {
            this.setState({ filteredFavorites: safeFavorites, searchQuery: '' });
            return;
        }

        // Use enhanced search with Telugu and English support
        const filtered = searchProducts(safeFavorites, searchQuery, this.context.getText);

        this.setState({ filteredFavorites: filtered, searchQuery });
    };

    handleFavoriteRemoved = () => {
        // Refresh the favorites list when a product is removed
        this.fetchFavorites();
    };

    render() {
        const { getText } = this.context;
        const { filteredFavorites, loading, count } = this.state;

        if (loading) {
            return <Spinner />;
        }

        return (
            <FavoritesContext.Consumer>
                {(favCtx) => {
                    // Check if any favorite was removed - if so, filter them out
                    const validFavorites = filteredFavorites.filter(product => 
                        favCtx?.isFavorite(product.id) || favCtx?.isFavorite(product.product_id)
                    );

                    return (
                        <>
                            <PageHeader>
                                <h1>⭐ {getText('Starred Products') || 'Starred Products'} ({favCtx?.favoriteIds?.size || count})</h1>
                                <p>{getText('favoriteProductsDescription') || 'Your favorite products in one place'}</p>
                            </PageHeader>

                            <SearchBar onSearch={this.handleSearch} />

                            <div className="container mt-4 mb-5">
                                {validFavorites.length === 0 && filteredFavorites.length === 0 ? (
                                    <EmptyState>
                                        <h3>⭐ {getText('noStarredProducts') || 'No Starred Products'}</h3>
                                        <p>
                                            {getText('noStarredProductsDescription') || 
                                            'You haven\'t starred any products yet. Click the star icon on any product to add it to your favorites!'}
                                        </p>
                                    </EmptyState>
                                ) : validFavorites.length === 0 ? (
                                    <EmptyState>
                                        <h3>🔍 {getText('noSearchResults') || 'No results found'}</h3>
                                        <p>{getText('tryAnotherSearch') || 'Try a different search term'}</p>
                                    </EmptyState>
                                ) : (
                                    <div 
                                        style={{
                                            display: 'grid',
                                            gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                                            gap: '16px',
                                            marginTop: '20px'
                                        }}
                                    >
                                        {validFavorites.map((product) => (
                                            <ProductCard
                                                key={product.id || product.product_id}
                                                product={product}
                                                onFavoriteRemoved={this.handleFavoriteRemoved}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    );
                }}
            </FavoritesContext.Consumer>
        );
    }
}

export default StarredProductsPage;
