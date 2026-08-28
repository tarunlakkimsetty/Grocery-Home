import React from 'react';
import styled from 'styled-components';

// ============ STYLED COMPONENTS ============

const FilterContainer = styled.div`
  background: linear-gradient(180deg, #ffffff 0%, #f7faf7 100%);
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  padding: 0.72rem 0.9rem 0.65rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
`;

const FilterPanel = styled.div`
  max-height: ${({ $isOpen }) => ($isOpen ? '900px' : '0')};
  opacity: ${({ $isOpen }) => ($isOpen ? 1 : 0)};
  overflow: hidden;
  transform: translateY(${({ $isOpen }) => ($isOpen ? '0' : '-0.35rem')});
  transition: max-height 0.28s ease, opacity 0.2s ease, transform 0.28s ease;
  pointer-events: ${({ $isOpen }) => ($isOpen ? 'auto' : 'none')};
  margin-bottom: ${({ $isOpen }) => ($isOpen ? '0.85rem' : '0')};
`;

const ToggleButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  min-height: 2.45rem;
  padding: 0.5rem 0.75rem;
  border: 1px solid ${({ $isActive, theme }) => ($isActive ? theme.colors.primary : theme.colors.borderLight)};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  background: ${({ $isOpen, theme }) => ($isOpen ? theme.colors.primary : '#ffffff')};
  color: ${({ $isOpen, theme }) => ($isOpen ? '#ffffff' : theme.colors.textPrimary)};
  font-size: 0.82rem;
  font-weight: 700;
  white-space: nowrap;
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease, border-color 0.2s ease;

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
    background: ${({ $isOpen, theme }) => ($isOpen ? theme.colors.primary : '#f0f7f0')};
  }

  @media (max-width: 768px) {
    width: 100%;
  }
`;

const FilterHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.4rem;
  gap: 0.65rem;

  @media (max-width: 576px) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

const FilterTitle = styled.h3`
  margin: 0;
  font-size: 0.96rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.textPrimary};
  display: flex;
  align-items: center;
  gap: 0.35rem;
  line-height: 1.2;

  @media (max-width: 768px) {
    font-size: 0.96rem;
  }
`;

const ResetButton = styled.button`
  padding: 0.32rem 0.7rem;
  background: ${({ theme }) => theme.colors.borderLight};
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;

  &:hover {
    background: ${({ theme }) => theme.colors.primary};
    border-color: ${({ theme }) => theme.colors.primary};
    color: white;
  }

  &:active {
    transform: scale(0.98);
  }

  @media (max-width: 576px) {
    width: 100%;
  }
`;

const RangeDisplay = styled.div`
  background: #f8f9fa;
  padding: 0.42rem 0.65rem;
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  margin-bottom: 0.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.6rem;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

const RangeValue = styled.div`
  font-weight: 700;
  font-size: 0.9rem;
  color: ${({ theme }) => theme.colors.primary};
  text-align: center;

  .label {
    font-size: 0.64rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: ${({ theme }) => theme.colors.textSecondary};
    display: block;
    margin-bottom: 0.08rem;
  }

  @media (max-width: 768px) {
    text-align: left;
  }
`;

const SliderContainer = styled.div`
  position: relative;
  margin: 0.2rem 0 0.55rem;
  padding: 0.05rem 0;

  input[type='range'] {
    width: 100%;
    height: 6px;
    border-radius: 3px;
    background: #e9ecef;
    outline: none;
    -webkit-appearance: none;
    pointer-events: none;
    position: relative;
    z-index: 5;

    &::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: ${({ theme }) => theme.colors.primary};
      cursor: pointer;
      pointer-events: auto;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      transition: all 0.2s ease;
      border: 2px solid white;

      &:hover {
        transform: scale(1.2);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      }

      &:active {
        transform: scale(1.3);
      }
    }

    &::-moz-range-thumb {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: ${({ theme }) => theme.colors.primary};
      cursor: pointer;
      pointer-events: auto;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      transition: all 0.2s ease;
      border: 2px solid white;

      &:hover {
        transform: scale(1.2);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      }

      &:active {
        transform: scale(1.3);
      }
    }
  }

  input[type='range']::-moz-range-track {
    background: transparent;
    border: none;
  }
`;

const InputsContainer = styled.div`
  display: flex;
  gap: 0.55rem;
  align-items: flex-end;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 0.4rem;
  }
`;

const InputGroup = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const InputLabel = styled.label`
  font-size: 0.68rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-bottom: 0.18rem;
  display: block;
`;

const PriceInput = styled.input`
  padding: 0.35rem 0.55rem;
  height: 2.05rem;
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  font-size: 0.88rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textPrimary};
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 3px rgba(46, 125, 50, 0.1);
  }

  &:disabled {
    background: ${({ theme }) => theme.colors.borderLight};
    cursor: not-allowed;
  }

  @media (max-width: 768px) {
    width: 100%;
  }
`;

const CountInfo = styled.div`
  font-size: 0.76rem;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-top: 0.45rem;
  padding-top: 0.4rem;
  border-top: 1px solid ${({ theme }) => theme.colors.borderLight};
  text-align: center;
`;

const EmptyRangeMessage = styled.div`
  padding: 0.75rem;
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  background: #f8f9fa;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 0.82rem;
  text-align: center;
`;

/**
 * PriceRangeFilter Component
 * Reusable price range slider for filtering products
 * 
 * Props:
 * - minPrice: Current minimum price
 * - maxPrice: Current maximum price
 * - availableMin: Minimum available price
 * - availableMax: Maximum available price
 * - onMinChange: Callback when min price changes
 * - onMaxChange: Callback when max price changes
 * - onReset: Callback for reset button
 * - productsCount: Number of products shown
 * - disabled: Disable the filter
 * - isOpen: Whether the inline filter panel is expanded
 * - filterLabel: Heading label for the filter
 * - filterIcon: Heading icon
 * - valuePrefix/valueSuffix: Value formatting tokens
 */
class PriceRangeFilter extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      minInput: props.minPrice,
      maxInput: props.maxPrice,
    };
  }

  componentDidUpdate(prevProps) {
    // Update if external props change significantly
    if (
      prevProps.minPrice !== this.props.minPrice ||
      prevProps.maxPrice !== this.props.maxPrice
    ) {
      this.setState({
        minInput: this.props.minPrice,
        maxInput: this.props.maxPrice,
      });
    }
  }

  handleMinChange = (e) => {
    const value = Number(e.target.value);
    const { maxPrice } = this.props;

    if (value <= maxPrice && value >= (this.props.availableMin || 0)) {
      this.setState({ minInput: value });
      this.props.onMinChange(value);
    }
  };

  handleMaxChange = (e) => {
    const value = Number(e.target.value);
    const { minPrice } = this.props;

    if (value >= minPrice && value <= (this.props.availableMax || 999999)) {
      this.setState({ maxInput: value });
      this.props.onMaxChange(value);
    }
  };

  handleReset = () => {
    const { availableMin, availableMax, onReset } = this.props;
    this.setState({
      minInput: availableMin,
      maxInput: availableMax,
    });
    if (onReset) {
      onReset();
    }
  };

  render() {
    const {
      minPrice,
      maxPrice,
      availableMin = 0,
      availableMax = 1000,
      productsCount = 0,
      disabled = false,
      isOpen = false,
      filterLabel = 'Price Filter',
      filterIcon = '🏷️',
      valuePrefix = '₹',
      valueSuffix = '',
      minLabel = 'Minimum Price',
      maxLabel = 'Maximum Price',
      step = '10',
      countLabel = 'found in this price range',
      emptyMessage = null,
      panelId = 'price-filter-panel',
    } = this.props;

    const { minInput, maxInput } = this.state;
    const formatValue = (value) => `${valuePrefix}${Math.round(Number(value) || 0)}${valueSuffix}`;
    const hasRange = availableMax > availableMin;

    return (
      <FilterPanel id={panelId} $isOpen={isOpen} aria-hidden={!isOpen}>
        <FilterContainer>
          <FilterHeader>
            <FilterTitle>
              {filterIcon} {filterLabel}
            </FilterTitle>
            <ResetButton 
              onClick={this.handleReset}
              disabled={disabled}
              title="Reset to full price range"
            >
              ↻ Reset
            </ResetButton>
          </FilterHeader>

          {!hasRange && emptyMessage && <EmptyRangeMessage>{emptyMessage}</EmptyRangeMessage>}

          <>
            <RangeDisplay>
                <RangeValue>
                  <span className="label">From</span>
                  {formatValue(minInput)}
                </RangeValue>
                <RangeValue style={{ flex: 1, textAlign: 'center' }}>
                  <span className="label">Selected Range</span>
                  {formatValue(minInput)} — {formatValue(maxInput)}
                </RangeValue>
                <RangeValue>
                  <span className="label">To</span>
                  {formatValue(maxInput)}
                </RangeValue>
              </RangeDisplay>

            <SliderContainer>
                <input
                  type="range"
                  min={availableMin}
                  max={availableMax}
                  value={minPrice}
                  onChange={this.handleMinChange}
                  disabled={disabled || !hasRange}
                  style={{
                    zIndex: minPrice > (availableMin + availableMax) / 2 ? 5 : 3,
                  }}
                />
                <input
                  type="range"
                  min={availableMin}
                  max={availableMax}
                  value={maxPrice}
                  onChange={this.handleMaxChange}
                  disabled={disabled || !hasRange}
                  style={{
                    zIndex: maxPrice < (availableMin + availableMax) / 2 ? 3 : 5,
                  }}
                />
              </SliderContainer>

              <InputsContainer>
                <InputGroup>
                  <InputLabel>{minLabel}</InputLabel>
                  <PriceInput
                    type="number"
                    min={availableMin}
                    max={maxPrice}
                    value={minInput}
                    onChange={(e) => this.handleMinChange(e)}
                    disabled={disabled || !hasRange}
                    step={step}
                  />
                </InputGroup>
                <InputGroup>
                  <InputLabel>{maxLabel}</InputLabel>
                  <PriceInput
                    type="number"
                    min={minPrice}
                    max={availableMax}
                    value={maxInput}
                    onChange={(e) => this.handleMaxChange(e)}
                    disabled={disabled || !hasRange}
                    step={step}
                  />
                </InputGroup>
              </InputsContainer>
          </>

          {productsCount !== undefined && (
            <CountInfo>
              {productsCount} {productsCount === 1 ? 'product' : 'products'} {countLabel}
            </CountInfo>
          )}
        </FilterContainer>
      </FilterPanel>
    );
  }
}

export const PriceFilterToggle = ({ isOpen, minPrice, maxPrice, availableMin, availableMax, onToggle, disabled, label = 'Price Filter', icon = '🏷️', valuePrefix = '₹', valueSuffix = '', panelId = 'price-filter-panel' }) => {
  const hasActiveRange = minPrice !== availableMin || maxPrice !== availableMax;
  const formatValue = (value) => `${valuePrefix}${Math.round(Number(value) || 0)}${valueSuffix}`;
  const rangeText = hasActiveRange ? `${formatValue(minPrice)} – ${formatValue(maxPrice)}` : null;

  return (
    <ToggleButton
      type="button"
      $isOpen={isOpen}
      $isActive={hasActiveRange}
      onClick={onToggle}
      disabled={disabled}
      aria-expanded={isOpen}
      aria-controls={panelId}
    >
      <span>{icon} {label}</span>
      {rangeText && <span>{rangeText}</span>}
      <span aria-hidden="true">{isOpen ? '▲' : '▼'}</span>
    </ToggleButton>
  );
};

export default PriceRangeFilter;
