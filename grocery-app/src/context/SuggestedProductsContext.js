import React from 'react';
import AuthContext from './AuthContext';
import suggestedProductsService from '../services/suggestedProductsService';

const SuggestedProductsContext = React.createContext({
    suggestedProductIds: new Set(),
    loadSuggestedProducts: async () => {},
    isSuggested: () => false,
    refreshSuggestedProducts: async () => {},
    updateSuggestedProduct: () => {}
});

class SuggestedProductsProvider extends React.Component {
    static contextType = AuthContext;

    state = {
        suggestedProductIds: new Set(),
        authKey: ''
    };

    componentDidMount() {
        this.syncSuggestedProducts();
    }

    componentDidUpdate(prevProps, prevState) {
        const nextAuthKey = `${this.context?.isAuthenticated ? '1' : '0'}:${this.context?.token || ''}`;
        if (nextAuthKey !== prevState.authKey) {
            this.setState({ authKey: nextAuthKey }, () => this.syncSuggestedProducts());
        }
    }

    syncSuggestedProducts = async () => {
        if (!this.context?.isAuthenticated) {
            this.setState({ suggestedProductIds: new Set() });
            return;
        }

        try {
            const response = await suggestedProductsService.getSuggestedProducts();
            const list = response?.suggestedProducts || response?.data || [];
            const ids = new Set(list.map((item) => Number(item.product_id || item.id)).filter(Boolean));
            this.setState({ suggestedProductIds: ids });
        } catch (error) {
            console.warn('Could not load suggested products:', error);
            this.setState({ suggestedProductIds: new Set() });
        }
    };

    loadSuggestedProducts = async () => {
        await this.syncSuggestedProducts();
    };

    refreshSuggestedProducts = async () => {
        await this.syncSuggestedProducts();
    };

    updateSuggestedProduct = (productId, isSuggested) => {
        const normalizedId = Number(productId);
        if (!Number.isFinite(normalizedId)) {
            return;
        }

        this.setState((prevState) => {
            const nextIds = new Set(prevState.suggestedProductIds);
            if (isSuggested) {
                nextIds.add(normalizedId);
            } else {
                nextIds.delete(normalizedId);
            }
            return { suggestedProductIds: nextIds };
        });
    };

    isSuggested = (productId) => {
        return this.state.suggestedProductIds.has(Number(productId));
    };

    render() {
        const value = {
            suggestedProductIds: this.state.suggestedProductIds,
            loadSuggestedProducts: this.loadSuggestedProducts,
            isSuggested: this.isSuggested,
            refreshSuggestedProducts: this.refreshSuggestedProducts,
            updateSuggestedProduct: this.updateSuggestedProduct
        };

        return (
            <SuggestedProductsContext.Provider value={value}>
                {this.props.children}
            </SuggestedProductsContext.Provider>
        );
    }
}

export { SuggestedProductsProvider, SuggestedProductsContext };
export default SuggestedProductsContext;
