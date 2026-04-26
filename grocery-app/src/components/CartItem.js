import React from 'react';
import { DangerButton, GhostButton } from '../styledComponents/ButtonStyles';
import LanguageContext from '../context/LanguageContext';
import QuantityControl from './QuantityControl';
import { getNextQuantity, getPreviousQuantity } from '../utils/quantityValidator';
import { toast } from 'react-toastify';

const CATEGORY_ICONS = {
    grains: '🌾',
    milk: '🥛',
    snacks: '🍿',
    spices: '🌶️',
    oils: '🍶',
    condiments: '🥫',
    cleaning: '🧼',
    personal: '🧴',
};

class CartItem extends React.Component {
    static contextType = LanguageContext;

    // CRITICAL: Validate quantity before updating
    handleQuantityUpdate = (productId, newQty) => {
        const { item } = this.props;
        const stock = Number(item?.stock || 0);
        
        // NOTE: For cart items, stock represents total available in inventory
        // Available for adjustment = stock (item can be increased or decreased as needed)
        // Debug logging
        console.log({ stock, newQty, currentQty: item.quantity, productId });
        
        // Block quantities that exceed stock
        if (newQty > stock) {
            toast.error(`Only ${stock} available`);
            return;
        }
        
        // Block zero or negative
        if (newQty <= 0) {
            toast.error('Quantity must be greater than 0');
            return;
        }
        
        // Proceed with update
        this.props.onUpdateQuantity(productId, newQty);
    }

    render() {
        const { item, onUpdateQuantity, onRemove } = this.props;
        const langCtx = this.context;

        // Safety: item.price / item.total might be strings (or missing)
        const rawPrice = Number(item?.price ?? 0);
        const price = Number.isFinite(rawPrice) ? rawPrice : 0;
        const rawQuantity = Number(item?.quantity ?? 0);
        const quantity = Number.isFinite(rawQuantity) ? rawQuantity : 0;
        const rawTotal = Number(item?.total);
        const total = Number.isFinite(rawTotal) ? rawTotal : price * quantity;

        // Get unit and stock
        const unit = item?.unit || 'piece';
        const stock = Number(item?.stock || 0);

        const handleIncrease = () => {
            const newQty = getNextQuantity(item.quantity, { unit, stock });
            if (newQty > item.quantity) {
                onUpdateQuantity(item.productId, newQty);
            }
        };

        const handleDecrease = () => {
            const newQty = getPreviousQuantity(item.quantity, { unit });
            if (newQty < item.quantity) {
                onUpdateQuantity(item.productId, newQty);
            }
        };

        return (
            <React.Fragment>
                <td className="text-start" style={{ verticalAlign: 'middle', paddingRight: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: '0' }}>
                        <span style={{ fontSize: '1.2rem', flexShrink: 0 }} title="Category">
                            {CATEGORY_ICONS[item.category] || '📦'}
                        </span>
                        <span className="fw-semibold" style={{ whiteSpace: 'normal', wordWrap: 'break-word', overflowWrap: 'break-word', minWidth: '0', flex: 1 }}>{item.name}</span>
                    </div>
                </td>
                <td className="text-center" style={{ width: '120px', verticalAlign: 'middle' }}>₹{price.toFixed(2)}</td>
                <td className="text-center" style={{ width: '170px', verticalAlign: 'middle' }}>
                    <QuantityControl
                        value={item.quantity}
                        onIncrease={handleIncrease}
                        onDecrease={handleDecrease}
                        onChange={(newQty) => this.handleQuantityUpdate(item.productId, newQty)}
                        unit={unit}
                        stock={stock}
                        disabled={false}
                        title={unit === 'kg' ? 'Adjust weight (kg)' : 'Adjust quantity'}
                        showStockWarning={true}
                    />
                </td>
                <td className="fw-bold text-center text-success" style={{ width: '130px', verticalAlign: 'middle' }}>₹{total.toFixed(2)}</td>
                <td className="text-center" style={{ width: '90px', verticalAlign: 'middle' }}>
                    <DangerButton
                        onClick={() => onRemove(item.productId)}
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', minWidth: 'auto' }}
                        title={langCtx.getText('removeItem')}
                    >
                        ✕
                    </DangerButton>
                </td>
            </React.Fragment>
        );
    }
}

export default CartItem;
