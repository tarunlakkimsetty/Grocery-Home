import styled from 'styled-components';

export const ProductCardWrapper = styled.div`
  background: ${({ theme }) => theme.colors.white};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
  overflow: hidden;
  transition: ${({ theme }) => theme.transitions.normal};
  height: 100%;
  display: flex;
  flex-direction: column;

  &:hover {
    transform: translateY(-4px);
    box-shadow: ${({ theme }) => theme.shadows.lg};
    border-color: ${({ theme }) => theme.colors.primaryLight};
  }

  @media (max-width: 768px) {
    min-height: auto;
  }
`;

export const CardImage = styled.div`
  display: none;
`;

export const CardBody = styled.div`
  padding: 1rem;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  .card-title {
    font-family: ${({ theme }) => theme.fonts.heading};
    font-weight: 700;
    font-size: 1.05rem;
    color: ${({ theme }) => theme.colors.textPrimary};
    word-wrap: break-word;
    overflow-wrap: break-word;
    word-break: break-word;
    line-height: 1.4;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    min-height: 1.5rem;

    .card-category-icon {
      font-size: 1.3rem;
      flex-shrink: 0;
      line-height: 1;
    }
  }

  .card-category {
    font-size: ${({ theme }) => theme.fontSizes.xs};
    color: ${({ theme }) => theme.colors.textSecondary};
    text-transform: uppercase;
    letter-spacing: 0.5px;
    word-wrap: break-word;
    overflow-wrap: break-word;
    word-break: break-word;
  }

  .card-price {
    font-size: 1.3rem;
    font-weight: 700;
    color: ${({ theme }) => theme.colors.primary};
    margin-top: 0.25rem;
    
    .unit {
      font-size: 0.85rem;
      font-weight: 600;
      color: ${({ theme }) => theme.colors.primary};
      word-wrap: break-word;
      overflow-wrap: break-word;
    }
  }

  .card-stock {
    font-size: ${({ theme }) => theme.fontSizes.xs};
    color: ${({ theme }) => theme.colors.textSecondary};
    word-wrap: break-word;
    overflow-wrap: break-word;
    display: none;
  }

  @media (max-width: 768px) {
    padding: 0.75rem;
    gap: 0.35rem;

    .card-title {
      font-size: 0.95rem;

      .card-category-icon {
        font-size: 1.1rem;
      }
    }

    .card-category {
      font-size: 0.65rem;
    }

    .card-price {
      font-size: 1.1rem;
      margin-top: 0.15rem;

      .unit {
        font-size: 0.8rem;
      }
    }

    .card-stock {
      display: block !important;
      font-size: 0.7rem;
      font-weight: 500;
    }
  }
`;

export const CardActions = styled.div`
  padding: 0.75rem 1rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  width: 100%;

  @media (max-width: 768px) {
    padding: 0.5rem 0.75rem 0.75rem;
    gap: 0.65rem;
  }
`;

export const QuantitySection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  width: 100%;

  label {
    font-size: ${({ theme }) => theme.fontSizes.xs};
    font-weight: 600;
    color: ${({ theme }) => theme.colors.textSecondary};
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  /* QuantityControl container */
  > div {
    display: flex;
    justify-content: center;
    width: 100%;
  }

  @media (max-width: 768px) {
    gap: 0.4rem;

    label {
      font-size: 0.65rem;
    }
  }
`;

export const ButtonSection = styled.div`
  display: flex;
  gap: 0.5rem;
  width: 100%;
  flex-direction: ${({ $adminMode }) => $adminMode ? 'row' : 'column'};

  button {
    white-space: normal;
    word-wrap: break-word;
    overflow-wrap: break-word;
    word-break: break-word;
    line-height: 1.3;
    padding: 0.6rem 1rem !important;
    font-size: 0.85rem !important;
    font-weight: 600;
    border-radius: ${({ theme }) => theme.borderRadius.sm};
    transition: ${({ theme }) => theme.transitions.normal};
    flex: ${({ $adminMode }) => $adminMode ? '1' : '1'};
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;

    &:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    &:active:not(:disabled) {
      transform: translateY(0);
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }

  @media (max-width: 768px) {
    gap: 0.4rem;

    button {
      padding: 0.55rem 0.8rem !important;
      font-size: 0.8rem !important;
    }
  }
`;

export const StockBadge = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ $status }) => {
    if ($status === 'outOfStock') return '#dc3545';
    if ($status === 'lowStock') return '#ff9800';
    return '#666';
  }};
  font-weight: ${({ $status }) => $status !== 'available' ? '600' : '500'};
  text-align: center;
  padding: 0.4rem 0.75rem;
  background: ${({ $status }) => {
    if ($status === 'outOfStock') return 'rgba(220, 53, 69, 0.08)';
    if ($status === 'lowStock') return 'rgba(255, 152, 0, 0.08)';
    return 'rgba(102, 102, 102, 0.05)';
  }};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  margin-top: 0.5rem;

  @media (max-width: 768px) {
    font-size: 0.7rem;
    padding: 0.35rem 0.6rem;
    margin-top: 0.35rem;
  }
`;

export const StatsCard = styled.div`
  background: ${({ $gradient }) => $gradient || 'linear-gradient(135deg, #2E7D32, #4CAF50)'};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  padding: 1.5rem;
  color: white;
  position: relative;
  overflow: hidden;
  transition: ${({ theme }) => theme.transitions.normal};

  &:hover {
    transform: translateY(-2px);
    box-shadow: ${({ theme }) => theme.shadows.lg};
  }

  &::after {
    content: '';
    position: absolute;
    top: -20px;
    right: -20px;
    width: 100px;
    height: 100px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: ${({ theme }) => theme.borderRadius.circle};
  }

  .stats-icon {
    font-size: 2rem;
    margin-bottom: 0.5rem;
    opacity: 0.9;
  }

  .stats-value {
    font-family: ${({ theme }) => theme.fonts.heading};
    font-size: 1.75rem;
    font-weight: 700;
    margin-bottom: 0.25rem;
  }

  .stats-label {
    font-size: ${({ theme }) => theme.fontSizes.sm};
    opacity: 0.85;
    font-weight: 500;
  }
`;
