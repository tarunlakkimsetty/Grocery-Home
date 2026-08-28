import React from 'react';
import { toast } from 'react-toastify';
import AuthContext from './AuthContext';
import { supportsDecimal } from '../utils/quantityValidator';
import { calculateLinePricing } from '../utils/pricing';
import productService from '../services/productService';

const STOCK_LIMIT_MESSAGE = 'Quantity exceeds stock limit';

const CART_STORAGE_KEY_BASE = 'grocery_cart_items_v1';

const getCartStorageKey = (user) => {
    const rawSuffix = user?.id ?? user?.phone;
    const suffix = rawSuffix !== undefined && rawSuffix !== null ? String(rawSuffix).trim() : '';
    if (!suffix) return CART_STORAGE_KEY_BASE;
    return `${CART_STORAGE_KEY_BASE}_${suffix}`;
};

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
            const safeQty = Number.isFinite(quantity) && quantity >= 0.1 ? quantity : 0.1;
            const safePrice = Number.isFinite(price) && price >= 0 ? price : 0;
            const pricing = calculateLinePricing({ originalPrice: it?.originalPrice ?? safePrice, discountedPrice: it?.discountedPrice ?? safePrice }, safeQty);

            return {
                productId,
                name: String(it?.name || ''),
                price: pricing.price,
                originalPrice: pricing.originalPrice,
                discountedPrice: pricing.discountedPrice,
                discountAmount: pricing.discountAmount,
                discountPercentage: pricing.discountPercentage,
                savings: pricing.savings,
                originalTotal: pricing.originalTotal,
                total: pricing.total,
                freeItemName: it?.freeItemName || null,
                freeItemQuantity: it?.freeItemQuantity || null,
                freeItemUnit: it?.freeItemUnit || null,
                category: it?.category || '',
                quantity: safeQty,
                emoji: it?.emoji || '📦',
                delivered: Boolean(it?.delivered),
                selected: Boolean(it?.selected),
                stock: Number.isFinite(Number(it?.stock)) ? Number(it.stock) : 0,
                unit: String(it?.unit || ''),
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
    getTotalSavings: () => 0,
    getDeliveredSavings: () => 0,
});

class CartProvider extends React.Component {
    static contextType = AuthContext;

    constructor(props) {
        super(props);
        this.state = {
            items: [],
        };

        this.activeStorageKey = getCartStorageKey(null);

        this.addToCart = this.addToCart.bind(this);
        this.removeFromCart = this.removeFromCart.bind(this);
        this.updateQuantity = this.updateQuantity.bind(this);
        this.clearCart = this.clearCart.bind(this);
        this.getTotal = this.getTotal.bind(this);
        this.getItemCount = this.getItemCount.bind(this);
        this.toggleItemDelivered = this.toggleItemDelivered.bind(this);
        this.getDeliveredTotal = this.getDeliveredTotal.bind(this);
        this.getTotalSavings = this.getTotalSavings.bind(this);
        this.getDeliveredSavings = this.getDeliveredSavings.bind(this);
        this.toggleItemSelected = this.toggleItemSelected.bind(this);
        this.getSelectedTotal = this.getSelectedTotal.bind(this);
    }

    componentDidMount() {
        // Restore cart from persistent storage (navigation and refresh safe)
        this.activeStorageKey = getCartStorageKey(this.context?.user);
        this.restoreFromStorage(this.activeStorageKey);
    }

    componentDidUpdate(prevProps, prevState) {
        const nextStorageKey = getCartStorageKey(this.context?.user);
        if (nextStorageKey !== this.activeStorageKey) {
            this.activeStorageKey = nextStorageKey;
            this.restoreFromStorage(this.activeStorageKey);
        }

        // Persist cart whenever items change.
        if (prevState.items !== this.state.items) {
            try {
                window?.localStorage?.setItem(this.activeStorageKey, JSON.stringify(this.state.items || []));
            } catch {
                // Ignore storage errors
            }
        }
    }

    restoreFromStorage(storageKey) {
        try {
            const raw = window?.localStorage?.getItem(storageKey);
            const parsed = safeParseJson(raw);
            const restored = normalizeStoredItems(parsed);

            // Safe migration: if user-scoped key is empty but legacy key has items,
            // migrate legacy items into the user-scoped key once.
            if (storageKey !== CART_STORAGE_KEY_BASE && restored.length === 0) {
                const legacyRaw = window?.localStorage?.getItem(CART_STORAGE_KEY_BASE);
                const legacyParsed = safeParseJson(legacyRaw);
                const legacyRestored = normalizeStoredItems(legacyParsed);
                if (legacyRestored.length > 0) {
                    window?.localStorage?.setItem(storageKey, JSON.stringify(legacyRestored));
                    window?.localStorage?.removeItem(CART_STORAGE_KEY_BASE);
                    this.setState({ items: legacyRestored }, () => this.refreshStoredPricing(legacyRestored));
                    return;
                }
            }

            this.setState({ items: restored }, () => this.refreshStoredPricing(restored));
        } catch {
            // Ignore storage errors (privacy mode, disabled storage, etc.)
            this.setState({ items: [] });
        }
    }

    refreshStoredPricing = async (items) => {
        if (!Array.isArray(items) || items.length === 0) return;
        try {
            // Reconcile persisted IDs against the current catalog before refreshing
            // prices. This safely removes products deleted or replaced since the cart
            // was saved without generating one 404 request per stale item.
            const response = await productService.getProducts();
            const products = Array.isArray(response)
                ? response
                : (response?.products || response?.data || []);
            const productById = new Map(
                (Array.isArray(products) ? products : [])
                    .filter((product) => product?.id !== undefined && product?.id !== null)
                    .map((product) => [String(Number(product.id)), product])
            );

            const refreshed = items
                .map((item) => {
                    const product = productById.get(String(Number(item.productId)));
                    if (!product) return null;
                    return {
                        ...item,
                        productId: Number(product.id),
                        name: product.name || item.name,
                        category: product.category || item.category || '',
                        stock: Number.isFinite(Number(product.stock)) ? Number(product.stock) : item.stock,
                        unit: product.unit || item.unit,
                        emoji: product.emoji || item.emoji,
                        ...calculateLinePricing(product, item.quantity),
                        freeItemName: product.freeItemActive ? product.freeItemName : null,
                        freeItemQuantity: product.freeItemActive ? product.freeItemQuantity : null,
                        freeItemUnit: product.freeItemActive ? product.freeItemUnit : null,
                    };
                })
                .filter(Boolean);
            this.setState({ items: refreshed });
        } catch {
            // Keep the persisted cart usable when product refresh is unavailable.
        }
    };

    addToCart(product, quantity) {
        const qty = Math.max(0.1, parseFloat(quantity) || 0.1);
        this.setState((prevState) => {
            const existingIndex = prevState.items.findIndex(
                (item) => item.productId === product.id
            );
            if (existingIndex >= 0) {
                const updatedItems = [...prevState.items];
                const existing = updatedItems[existingIndex];
                const stockFromProduct = Number(product?.stock);
                const stockFromItem = Number(existing?.stock);
                const availableStock = Number.isFinite(stockFromProduct)
                    ? stockFromProduct
                    : (Number.isFinite(stockFromItem) ? stockFromItem : null);

                const nextQty = (Number(existing.quantity) || 0) + qty;
                if (availableStock !== null && availableStock >= 0 && nextQty > availableStock) {
                    toast.error(STOCK_LIMIT_MESSAGE);
                    return prevState;
                }

                updatedItems[existingIndex] = {
                    ...existing,
                    quantity: nextQty,
                    ...calculateLinePricing(existing, nextQty),
                    stock: availableStock !== null ? availableStock : (existing.stock || 0),
                };
                return { items: updatedItems };
            }

            const stockFromProduct = Number(product?.stock);
            const availableStock = Number.isFinite(stockFromProduct) ? stockFromProduct : null;
            if (availableStock !== null && availableStock >= 0 && qty > availableStock) {
                toast.error(STOCK_LIMIT_MESSAGE);
                return prevState;
            }
            return {
                items: [
                    ...prevState.items,
                    {
                        productId: product.id,
                        name: product.name,
                        ...calculateLinePricing(product, qty),
                        freeItemName: product.freeItemActive ? product.freeItemName : null,
                        freeItemQuantity: product.freeItemActive ? product.freeItemQuantity : null,
                        freeItemUnit: product.freeItemActive ? product.freeItemUnit : null,
                        category: product.category,
                        stock: availableStock !== null ? availableStock : (product.stock || 0),
                        unit: product.unit || '',
                        quantity: qty,
                        total: product.price * qty,
                        emoji: product.emoji || '📦',
                        delivered: false, // Default: not yet delivered
                        selected: false, // Default: not selected
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
        this.setState((prevState) => {
            const existing = (prevState.items || []).find((i) => i.productId === productId);
            if (!existing) return prevState;

            // Parse quantity based on unit
            const isWeightBased = supportsDecimal(existing.unit);
            const qty = isWeightBased ? parseFloat(quantity) : parseInt(quantity, 10);
            
            // Validate based on unit
            const minQty = isWeightBased ? 0.1 : 1;
            if (qty < minQty) {
                this.removeFromCart(productId);
                return prevState;
            }

            const rawStock = Number(existing?.stock);
            const availableStock = Number.isFinite(rawStock) ? rawStock : null;
            if (availableStock !== null && availableStock >= 0 && qty > availableStock) {
                toast.error(STOCK_LIMIT_MESSAGE);
                return prevState;
            }

            return {
                items: prevState.items.map((item) =>
                    item.productId === productId
                        ? { ...item, ...calculateLinePricing(item, qty) }
                        : item
                ),
            };
        });
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
        // Navbar badge: show number of distinct products in cart (not total quantity).
        const uniqueProductIds = new Set((this.state.items || []).map((item) => item.productId));
        return uniqueProductIds.size;
    }

    // Get total for only delivered items
    getDeliveredTotal() {
        return this.state.items
            .filter((item) => item.delivered)
            .reduce((sum, item) => sum + item.total, 0);
    }

    getTotalSavings() {
        return this.state.items.reduce((sum, item) => sum + (Number(item.savings || 0) || 0), 0);
    }

    getDeliveredSavings() {
        return this.state.items.filter((item) => item.delivered).reduce((sum, item) => sum + (Number(item.savings || 0) || 0), 0);
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
            getTotalSavings: this.getTotalSavings,
            getDeliveredSavings: this.getDeliveredSavings,
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
