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

  .card-title {
    font-family: ${({ theme }) => theme.fonts.heading};
    font-weight: 600;
    font-size: 1rem;
    color: ${({ theme }) => theme.colors.textPrimary};
    margin-bottom: 0.25rem;
    word-wrap: break-word;
    overflow-wrap: break-word;
    word-break: break-word;
    line-height: 1.4;
    display: flex;
    align-items: center;
    gap: 0.5rem;

    .card-category-icon {
      font-size: 1.2rem;
      flex-shrink: 0;
      line-height: 1;
    }
  }

  .card-category {
    font-size: ${({ theme }) => theme.fontSizes.xs};
    color: ${({ theme }) => theme.colors.textSecondary};
    margin-bottom: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    word-wrap: break-word;
    overflow-wrap: break-word;
    word-break: break-word;
  }

  .card-price {
    font-size: 1.25rem;
    font-weight: 700;
    color: ${({ theme }) => theme.colors.primary};
    margin-bottom: 0.25rem;
    
    .unit {
      font-size: 0.9rem;
      font-weight: 700;
      color: ${({ theme }) => theme.colors.primary};
      word-wrap: break-word;
      overflow-wrap: break-word;
    }
  }

  .card-stock {
    font-size: ${({ theme }) => theme.fontSizes.xs};
    color: ${({ theme }) => theme.colors.textSecondary};
    margin-bottom: 0.75rem;
    word-wrap: break-word;
    overflow-wrap: break-word;
    display: none;
  }

  @media (max-width: 768px) {
    padding: 0.75rem;

    .card-title {
      font-size: 0.95rem;
      margin-bottom: 0.15rem;

      .card-category-icon {
        font-size: 1rem;
      }
    }

    .card-category {
      font-size: 0.65rem;
      margin-bottom: 0.5rem;
    }

    .card-price {
      font-size: 1.1rem;
      margin-bottom: 0.15rem;

      .unit {
        font-size: 0.85rem;
        font-weight: 700;
      }
    }

    .card-stock {
      display: block !important;
      font-size: 0.7rem;
      margin-bottom: 0.5rem;
      font-weight: 500;
    }
  }
`;

export const CardActions = styled.div`
  padding: 0 1rem 1rem;
  display: flex;
  gap: 0.5rem;
  align-items: center;
  flex-wrap: wrap;
  width: 100%;
  min-height: 45px;

  button {
    flex: 1;
    min-width: 80px;
    white-space: normal;
    word-wrap: break-word;
    overflow-wrap: break-word;
    word-break: break-word;
    line-height: 1.3;
    padding: 0.55rem 0.75rem !important;
    font-size: 0.8rem !important;
  }

  .qty-input {
    width: 70px;
    padding: 0.4rem 0.5rem;
    border: 1.5px solid ${({ theme }) => theme.colors.border};
    border-radius: ${({ theme }) => theme.borderRadius.sm};
    font-size: ${({ theme }) => theme.fontSizes.sm};
    text-align: center;
    outline: none;
    transition: ${({ theme }) => theme.transitions.fast};

    &:focus {
      border-color: ${({ theme }) => theme.colors.primaryLight};
      box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.1);
    }
  }

  @media (max-width: 768px) {
    padding: 0.5rem;
    gap: 0.35rem;
    min-height: 40px;

    button {
      font-size: 0.7rem !important;
      padding: 0.4rem 0.35rem !important;
      min-width: 60px;
      line-height: 1.2;
    }

    .qty-input {
      width: 60px;
      padding: 0.35rem 0.4rem;
      font-size: 0.75rem;
    }
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
