import React from 'react';
import { DangerButton, GhostButton } from '../styledComponents/ButtonStyles';
import LanguageContext from '../context/LanguageContext';
import { toast } from 'react-toastify';

class CartItem extends React.Component {
    static contextType = LanguageContext;

    render() {
        const { item, onUpdateQuantity, onRemove } = this.props;
        const langCtx = this.context;

        const handleIncrease = () => {
            if (item.quantity >= item.stock) {
                toast.warning(langCtx.getText('stockLimitReached'));
                return;
            }
            onUpdateQuantity(item.productId, item.quantity + 1);
        };

        const handleDecrease = () => {
            if (item.quantity <= 1) {
                return;
            }
            onUpdateQuantity(item.productId, item.quantity - 1);
        };

        const isIncreaseDisabled = item.quantity >= item.stock;
        const isDecreaseDisabled = item.quantity <= 1;

        return (
            <React.Fragment>
                <td className="text-start" style={{ verticalAlign: 'middle', paddingRight: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: '0' }}>
                        <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>{item.emoji}</span>
                        <span className="fw-semibold" style={{ whiteSpace: 'normal', wordWrap: 'break-word', overflowWrap: 'break-word', minWidth: '0', flex: 1 }}>{item.name}</span>
                    </div>
                </td>
                <td className="text-center" style={{ width: '120px', verticalAlign: 'middle' }}>₹{item.price.toFixed(2)}</td>
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
                            title={isDecreaseDisabled ? 'Quantity cannot be less than 1' : 'Decrease quantity'}
                        >
                            −
                        </GhostButton>
                        <span className="fw-bold" style={{ minWidth: '25px', textAlign: 'center', fontSize: '0.9rem' }}>
                            {item.quantity}
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
                <td className="fw-bold text-center text-success" style={{ width: '130px', verticalAlign: 'middle' }}>₹{item.total.toFixed(2)}</td>
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
