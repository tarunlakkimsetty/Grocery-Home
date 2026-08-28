import React from 'react';
import favoriteService from '../services/favoriteService';

const FavoritesContext = React.createContext({
    favoriteIds: [], // Set of favorite product IDs for quick lookup
    isFavorite: () => false,
    addFavorite: () => {},
    removeFavorite: () => {},
    loadFavorites: () => {},
    loading: true,
    error: null,
});

class FavoritesProvider extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            favoriteIds: new Set(), // Use Set for O(1) lookup
            loading: true,
            error: null,
        };
    }

    componentDidMount() {
        // Load favorites when component mounts
        this.loadFavorites();
    }

    /**
     * Load all favorite product IDs for the current user
     */
    loadFavorites = async () => {
        try {
            this.setState({ loading: true, error: null });
            const response = await favoriteService.getFavorites(1, 1000); // Load up to 1000
            
            // Extract product IDs from favorites
            const favorites = response.favorites || response.data || [];
            const ids = new Set(favorites.map(fav => fav.product_id || fav.id));
            
            this.setState({
                favoriteIds: ids,
                loading: false,
                error: null
            });
        } catch (err) {
            // Silent fail for now - favorites are optional
            console.warn('Could not load favorites:', err);
            this.setState({
                favoriteIds: new Set(),
                loading: false,
                error: err.message
            });
        }
    };

    /**
     * Check if a product is favorited
     */
    isFavorite = (productId) => {
        return this.state.favoriteIds.has(productId);
    };

    /**
     * Add a product to favorites
     */
    addFavorite = async (productId) => {
        try {
            await favoriteService.addFavorite(productId);
            
            // Update local state
            const newIds = new Set(this.state.favoriteIds);
            newIds.add(productId);
            this.setState({ favoriteIds: newIds });
            
            return true;
        } catch (err) {
            console.error('Error adding favorite:', err);
            throw err;
        }
    };

    /**
     * Remove a product from favorites
     */
    removeFavorite = async (productId) => {
        try {
            await favoriteService.removeFavorite(productId);
            
            // Update local state
            const newIds = new Set(this.state.favoriteIds);
            newIds.delete(productId);
            this.setState({ favoriteIds: newIds });
            
            return true;
        } catch (err) {
            console.error('Error removing favorite:', err);
            throw err;
        }
    };

    render() {
        const value = {
            favoriteIds: this.state.favoriteIds,
            isFavorite: this.isFavorite,
            addFavorite: this.addFavorite,
            removeFavorite: this.removeFavorite,
            loadFavorites: this.loadFavorites,
            loading: this.state.loading,
            error: this.state.error,
        };

        return (
            <FavoritesContext.Provider value={value}>
                {this.props.children}
            </FavoritesContext.Provider>
        );
    }
}

export { FavoritesProvider, FavoritesContext };
export default FavoritesContext;
