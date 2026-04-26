import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import {
  supportsDecimal,
  getMinQuantity,
  getInputStep,
  validateQuantity,
  formatQuantity,
  getNextQuantity,
  getPreviousQuantity
} from '../utils/quantityValidator';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const ControlsRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.3rem;
`;

const Button = styled.button`
  width: 28px;
  height: 28px;
  border: 1px solid #ced4da;
  background: white;
  border-radius: 4px;
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  line-height: 1;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: #e9ecef;
    border-color: #4CAF50;
  }

  &:active:not(:disabled) {
    transform: scale(0.95);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background: #f5f5f5;
  }
`;

const Input = styled.input`
  width: 50px;
  height: 28px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  text-align: center;
  font-weight: 700;
  font-size: 0.9rem;
  padding: 0 0.25rem;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: #4CAF50;
    box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.1);
  }

  &:disabled {
    background: #f5f5f5;
    cursor: not-allowed;
  }

  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  &[type=number] {
    -moz-appearance: textfield;
  }
`;

const ErrorMessage = styled.div`
  font-size: 0.7rem;
  font-weight: 600;
  color: #dc3545;
  margin-top: 0.15rem;
  min-height: 1rem;
`;

const StockIndicator = styled.div`
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: ${({ $isMaxed, $isLowStock, $isMin }) => {
    if ($isMaxed) return '#dc3545';
    if ($isLowStock) return '#ff9800';
    if ($isMin) return '#999';
    return '#666';
  }};
  margin-top: 0.15rem;
  min-height: 1rem;
`;

/**
 * QuantityControl Component with Strict Quantity Validation
 * 
 * Enforces:
 * - Minimum quantity (1 for units, >0 for kg)
 * - No zero quantity ever
 * - Decimals ONLY for weight-based products (kg, g, ml, etc.)
 * - Stock limit enforcement
 * 
 * @component
 * @example
 * // For unit-based product (only integers)
 * <QuantityControl
 *   value={quantity}
 *   onIncrease={() => setQuantity(q => q + 1)}
 *   onDecrease={() => setQuantity(q => Math.max(1, q - 1))}
 *   onChange={(newValue) => setQuantity(newValue)}
 *   unit="piece"
 *   stock={10}
 * />
 * 
 * // For weight-based product (decimals allowed)
 * <QuantityControl
 *   value={quantity}
 *   onIncrease={() => setQuantity(q => q + 0.1)}
 *   onDecrease={() => setQuantity(q => Math.max(0.1, q - 0.1))}
 *   onChange={(newValue) => setQuantity(newValue)}
 *   unit="kg"
 *   stock={5}
 * />
 * 
 * @param {number} value - Current quantity (integer or decimal)
 * @param {function} onIncrease - Callback when + button clicked
 * @param {function} onDecrease - Callback when − button clicked
 * @param {function} onChange - Callback for manual input
 * @param {string} [unit="piece"] - Product unit (kg, g, ml, piece, packet, etc.)
 * @param {number} [stock=9999] - Available stock
 * @param {boolean} [disabled=false] - Disable all controls
 * @param {string} [title="Adjust quantity"] - Hover tooltip
 * @param {boolean} [showStockWarning=true] - Show stock indicator
 * @returns {JSX.Element}
 */
const QuantityControl = React.forwardRef(({
  value,
  onIncrease,
  onDecrease,
  onChange,
  unit = 'piece',
  stock = 9999,
  disabled = false,
  title = 'Adjust quantity',
  showStockWarning = true
}, ref) => {
  const [error, setError] = useState('');
  const [inputValue, setInputValue] = useState(String(value || ''));

  // Update input display when value changes externally
  useEffect(() => {
    const formatted = supportsDecimal(unit) 
      ? value?.toFixed(1) ?? ''
      : Math.round(value || 0);
    setInputValue(String(formatted));
    setError('');
  }, [value, unit]);

  const handleInputChange = (e) => {
    const inputStr = e.target.value;
    setInputValue(inputStr);

    // Allow empty while typing
    if (inputStr === '') {
      setError('Quantity required');
      return;
    }

    // Validate
    const validation = validateQuantity(inputStr, { unit, stock });

    if (validation.isValid) {
      setError('');
      onChange(validation.correctedValue);
    } else {
      setError(validation.message);
      // Auto-correct after brief delay if user stops typing
      setTimeout(() => {
        const corrected = formatQuantity(inputStr, unit);
        onChange(corrected);
      }, 1500);
    }
  };

  const handleIncreaseClick = () => {
    if (!disabled && onIncrease) {
      onIncrease();
    }
  };

  const handleDecreaseClick = () => {
    if (!disabled && onDecrease) {
      onDecrease();
    }
  };

  const min = getMinQuantity(unit);
  const allowsDecimal = supportsDecimal(unit);
  const step = getInputStep(unit);
  const isAtMax = value >= stock;
  const isLowStock = stock > 0 && stock <= 3;
  const isAtMin = value <= min;
  const remainingStock = Math.max(0, stock - value);

  const displayValue = allowsDecimal
    ? (value ? value.toFixed(1) : '')
    : Math.round(value || 0);

  return (
    <Container ref={ref} title={title}>
      <ControlsRow>
        <Button
          className="qty-decrease"
          onClick={handleDecreaseClick}
          disabled={disabled || isAtMin}
          aria-label="Decrease quantity"
          type="button"
          title={isAtMin ? `Minimum quantity is ${min}` : 'Decrease quantity'}
        >
          −
        </Button>

        <Input
          type="number"
          className="qty-input"
          value={inputValue}
          onChange={handleInputChange}
          min={min}
          max={stock}
          step={step}
          disabled={disabled}
          aria-label={`Quantity in ${unit}`}
          placeholder={String(min)}
        />

        <Button
          className="qty-increase"
          onClick={handleIncreaseClick}
          disabled={disabled || isAtMax}
          aria-label="Increase quantity"
          type="button"
          title={isAtMax ? `Only ${stock} available` : `Increase quantity`}
        >
          +
        </Button>
      </ControlsRow>

      {/* Error message */}
      {error && (
        <ErrorMessage>
          {error}
        </ErrorMessage>
      )}

      {/* Stock indicator */}
      {showStockWarning && (
        <StockIndicator $isLowStock={isLowStock} $isMaxed={isAtMax} $isMin={isAtMin}>
          {isAtMax ? (
            <span>⚠️ Max: {stock} {unit}</span>
          ) : remainingStock < 5 && remainingStock > 0 ? (
            <span>📦 Only {remainingStock} {unit} left</span>
          ) : remainingStock > 0 ? (
            <span>✓ Stock: {remainingStock} {unit}</span>
          ) : (
            <span>❌ Out of stock</span>
          )}
        </StockIndicator>
      )}
    </Container>
  );
});

QuantityControl.displayName = 'QuantityControl';

export default QuantityControl;
