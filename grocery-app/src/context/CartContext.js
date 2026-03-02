import React from 'react';

const CART_STORAGE_KEY = 'grocery_cart_items_v1';

const safeParseJson = (raw) => {
    try {
        return JSON.parse(raw);
    } catch {
        return null;
    }
};

const normalizeStoredItems = (value) => {
    if (!Array.isArray(value)) return [];

    return value
        .map((it) => {
            const productId = Number(it?.productId);
            if (!Number.isFinite(productId) || productId <= 0) return null;

            const quantity = Number(it?.quantity);
            const price = Number(it?.price);
            const safeQty = Number.isFinite(quantity) && quantity > 0 ? quantity : 1;
            const safePrice = Number.isFinite(price) && price >= 0 ? price : 0;
            const total = Number(it?.total);
            const safeTotal = Number.isFinite(total) ? total : safePrice * safeQty;

            return {
                productId,
                name: String(it?.name || ''),
                price: safePrice,
                quantity: safeQty,
                total: safeTotal,
                emoji: it?.emoji || '📦',
                delivered: Boolean(it?.delivered),
                selected: Boolean(it?.selected),
                stock: Number.isFinite(Number(it?.stock)) ? Number(it.stock) : 0,
            };
        })
        .filter(Boolean);
};

const CartContext = React.createContext({
    items: [],
    addToCart: () => { },
    removeFromCart: () => { },
    updateQuantity: () => { },
    clearCart: () => { },
    getTotal: () => 0,
    getItemCount: () => 0,
    toggleItemDelivered: () => { },
    getDeliveredTotal: () => 0,
});

class CartProvider extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            items: [],
        };
        this.addToCart = this.addToCart.bind(this);
        this.removeFromCart = this.removeFromCart.bind(this);
        this.updateQuantity = this.updateQuantity.bind(this);
        this.clearCart = this.clearCart.bind(this);
        this.getTotal = this.getTotal.bind(this);
        this.getItemCount = this.getItemCount.bind(this);
        this.toggleItemDelivered = this.toggleItemDelivered.bind(this);
        this.getDeliveredTotal = this.getDeliveredTotal.bind(this);
        this.toggleItemSelected = this.toggleItemSelected.bind(this);
        this.getSelectedTotal = this.getSelectedTotal.bind(this);
    }

    componentDidMount() {
        // Restore cart from persistent storage (navigation and refresh safe)
        try {
            const raw = window?.localStorage?.getItem(CART_STORAGE_KEY);
            const parsed = safeParseJson(raw);
            const restored = normalizeStoredItems(parsed);
            if (restored.length > 0) {
                this.setState({ items: restored });
            }
        } catch {
            // Ignore storage errors (privacy mode, disabled storage, etc.)
        }
    }

    componentDidUpdate(prevProps, prevState) {
        // Persist cart whenever items change.
        if (prevState.items !== this.state.items) {
            try {
                window?.localStorage?.setItem(CART_STORAGE_KEY, JSON.stringify(this.state.items || []));
            } catch {
                // Ignore storage errors
            }
        }
    }

    addToCart(product, quantity) {
        const qty = parseInt(quantity) || 1;
        this.setState((prevState) => {
            const existingIndex = prevState.items.findIndex(
                (item) => item.productId === product.id
            );
            if (existingIndex >= 0) {
                const updatedItems = [...prevState.items];
                updatedItems[existingIndex] = {
                    ...updatedItems[existingIndex],
                    quantity: updatedItems[existingIndex].quantity + qty,
                    total: (updatedItems[existingIndex].quantity + qty) * updatedItems[existingIndex].price,
                };
                return { items: updatedItems };
            }
            return {
                items: [
                    ...prevState.items,
                    {
                        productId: product.id,
                        name: product.name,
                        price: product.price,
                        quantity: qty,
                        total: product.price * qty,
                        emoji: product.emoji || '📦',
                        delivered: false, // Default: not yet delivered
                        selected: false, // Default: not selected
                        stock: product.stock || 0, // Product stock quantity
                    },
                ],
            };
        });
    }

    removeFromCart(productId) {
        this.setState((prevState) => ({
            items: prevState.items.filter((item) => item.productId !== productId),
        }));
    }

    updateQuantity(productId, quantity) {
        const qty = parseInt(quantity);
        if (qty <= 0) {
            this.removeFromCart(productId);
            return;
        }
        this.setState((prevState) => ({
            items: prevState.items.map((item) =>
                item.productId === productId
                    ? { ...item, quantity: qty, total: item.price * qty }
                    : item
            ),
        }));
    }

    toggleItemDelivered(productId) {
        this.setState((prevState) => ({
            items: prevState.items.map((item) =>
                item.productId === productId
                    ? { ...item, delivered: !item.delivered }
                    : item
            ),
        }));
    }

    clearCart() {
        this.setState({ items: [] });
    }

    getTotal() {
        return this.state.items.reduce((sum, item) => sum + item.total, 0);
    }

    getItemCount() {
        return this.state.items.reduce((sum, item) => sum + item.quantity, 0);
    }

    // Get total for only delivered items
    getDeliveredTotal() {
        return this.state.items
            .filter((item) => item.delivered)
            .reduce((sum, item) => sum + item.total, 0);
    }

    toggleItemSelected(productId) {
        this.setState((prevState) => ({
            items: prevState.items.map((item) =>
                item.productId === productId
                    ? { ...item, selected: !item.selected }
                    : item
            ),
        }));
    }

    getSelectedTotal() {
        return this.state.items
            .filter((item) => item.selected)
            .reduce((sum, item) => sum + item.total, 0);
    }

    render() {
        const value = {
            items: this.state.items,
            addToCart: this.addToCart,
            removeFromCart: this.removeFromCart,
            updateQuantity: this.updateQuantity,
            clearCart: this.clearCart,
            getTotal: this.getTotal,
            getItemCount: this.getItemCount,
            toggleItemDelivered: this.toggleItemDelivered,
            getDeliveredTotal: this.getDeliveredTotal,
            toggleItemSelected: this.toggleItemSelected,
            getSelectedTotal: this.getSelectedTotal,
        };

        return (
            <CartContext.Provider value={value}>
                {this.props.children}
            </CartContext.Provider>
        );
    }
}

export { CartContext, CartProvider };
export default CartContext;
