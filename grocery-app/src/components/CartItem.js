import React from 'react';
import { DangerButton, GhostButton } from '../styledComponents/ButtonStyles';
import LanguageContext from '../context/LanguageContext';
import { toast } from 'react-toastify';

const STOCK_LIMIT_MESSAGE = 'Quantity exceeds stock limit';

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

        // Check if weight-based
        const isWeightBased = item?.unit === 'kg';
        const increment = isWeightBased ? 0.1 : 1;
        const minQty = isWeightBased ? 0.1 : 1;

        const handleIncrease = () => {
            if (item.quantity >= item.stock) {
                toast.error(STOCK_LIMIT_MESSAGE);
                return;
            }
            const newQty = isWeightBased 
                ? Math.round((item.quantity + increment) * 10) / 10 
                : item.quantity + increment;
            onUpdateQuantity(item.productId, newQty);
        };

        const handleDecrease = () => {
            if (item.quantity <= minQty) {
                return;
            }
            const newQty = isWeightBased 
                ? Math.round((item.quantity - increment) * 10) / 10 
                : item.quantity - increment;
            onUpdateQuantity(item.productId, newQty);
        };

        const isIncreaseDisabled = item.quantity >= item.stock;
        const isDecreaseDisabled = item.quantity <= minQty;

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
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}>
                        <GhostButton
                            onClick={handleDecrease}
                            disabled={isDecreaseDisabled}
                            style={{
                                padding: '0.2rem 0.4rem',
                                minWidth: '28px',
                                fontSize: '0.75rem',
                                opacity: isDecreaseDisabled ? 0.5 : 1,
                                cursor: isDecreaseDisabled ? 'not-allowed' : 'pointer'
                            }}
                            title={isDecreaseDisabled ? `Quantity cannot be less than ${minQty}` : 'Decrease quantity'}
                        >
                            −
                        </GhostButton>
                        <span className="fw-bold" style={{ minWidth: '25px', textAlign: 'center', fontSize: '0.9rem' }}>
                            {isWeightBased ? item.quantity.toFixed(1) : Math.floor(item.quantity)}
                        </span>
                        <GhostButton
                            onClick={handleIncrease}
                            disabled={isIncreaseDisabled}
                            style={{
                                padding: '0.2rem 0.4rem',
                                minWidth: '28px',
                                fontSize: '0.75rem',
                                opacity: isIncreaseDisabled ? 0.5 : 1,
                                cursor: isIncreaseDisabled ? 'not-allowed' : 'pointer'
                            }}
                            title={isIncreaseDisabled ? `Stock limit reached (${item.stock} available)` : 'Increase quantity'}
                        >
                            +
                        </GhostButton>
                    </div>
                    {isIncreaseDisabled && (
                        <div style={{ fontSize: '0.7rem', color: '#dc3545', marginTop: '0.2rem' }}>
                            Max: {item.stock}
                        </div>
                    )}
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
