import styled from 'styled-components';

export const FormWrapper = styled.div`
  background: ${({ theme }) => theme.colors.white};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  padding: 1.75rem;
  box-shadow: ${({ theme }) => theme.shadows.sm};
  border: 1px solid ${({ theme }) => theme.colors.borderLight};

  .form-title {
    font-family: ${({ theme }) => theme.fonts.heading};
    font-size: 1.25rem;
    font-weight: 700;
    color: ${({ theme }) => theme.colors.textPrimary};
    margin-bottom: 1.5rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    word-wrap: break-word;
    overflow-wrap: break-word;
    word-break: break-word;
    line-height: 1.5;
  }

  .form-label {
    word-wrap: break-word;
    overflow-wrap: break-word;
    word-break: break-word;
    line-height: 1.5;
  }

  .form-control, .form-select {
    word-wrap: break-word;
    overflow-wrap: break-word;
  }

  @media (max-width: 768px) {
    padding: 1.25rem;

    .form-title {
      font-size: 1.1rem;
    }
  }
`;

export const TableWrapper = styled.div`
  background: ${({ theme }) => theme.colors.white};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  box-shadow: ${({ theme }) => theme.shadows.sm};
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
  overflow-x: auto;
  width: 100%;

  .table {
    margin: 0;
    width: 100%;
    table-layout: auto;

    thead th {
      background: ${({ theme }) => theme.colors.bodyBg};
      border-bottom: 2px solid ${({ theme }) => theme.colors.border};
      font-size: ${({ theme }) => theme.fontSizes.sm};
      font-weight: 700;
      color: ${({ theme }) => theme.colors.textSecondary};
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 1rem 0.85rem;
      line-height: 1.4;
      word-wrap: break-word;
      overflow-wrap: break-word;
      white-space: normal;

      @media (max-width: 768px) {
        padding: 0.75rem 0.6rem;
        font-size: ${({ theme }) => theme.fontSizes.xs};
      }
    }

    tbody tr {
      transition: ${({ theme }) => theme.transitions.fast};
      cursor: ${({ $clickable }) => ($clickable ? 'pointer' : 'default')};

      &:hover {
        background: rgba(46, 125, 50, 0.04);
      }

      td {
        padding: 1rem 0.85rem;
        vertical-align: middle;
        border-color: ${({ theme }) => theme.colors.borderLight};
        font-size: ${({ theme }) => theme.fontSizes.sm};
        word-wrap: break-word;
        overflow-wrap: break-word;
        white-space: normal;

        @media (max-width: 768px) {
          padding: 0.75rem 0.6rem;
          font-size: ${({ theme }) => theme.fontSizes.xs};
        }
      }
    }
  }
`;

export const PaginationWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem;
  border-top: 1px solid ${({ theme }) => theme.colors.borderLight};

  button {
    padding: 0.4rem 0.85rem;
    border: 1.5px solid ${({ theme }) => theme.colors.border};
    background: ${({ theme }) => theme.colors.white};
    border-radius: ${({ theme }) => theme.borderRadius.sm};
    font-size: ${({ theme }) => theme.fontSizes.sm};
    color: ${({ theme }) => theme.colors.textSecondary};
    cursor: pointer;
    transition: ${({ theme }) => theme.transitions.fast};
    font-weight: 500;

    &:hover:not(:disabled) {
      border-color: ${({ theme }) => theme.colors.primaryLight};
      color: ${({ theme }) => theme.colors.primary};
      background: rgba(46, 125, 50, 0.05);
    }

    &:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    &.active {
      background: ${({ theme }) => theme.colors.primary};
      color: white;
      border-color: ${({ theme }) => theme.colors.primary};
    }
  }
`;

export const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: ${({ theme }) => theme.colors.overlay};
  z-index: 1050;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  animation: fadeIn 0.2s ease;

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;

export const ModalContent = styled.div`
  background: ${({ theme }) => theme.colors.white};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  width: 100%;
  max-width: 520px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: ${({ theme }) => theme.shadows.xl};
  animation: slideUp 0.3s ease;

  @keyframes slideUp {
    from { transform: translateY(20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.25rem 1.5rem;
    border-bottom: 1px solid ${({ theme }) => theme.colors.borderLight};

    h3 {
      font-family: ${({ theme }) => theme.fonts.heading};
      font-size: 1.15rem;
      font-weight: 700;
      margin: 0;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 1.5rem;
      color: ${({ theme }) => theme.colors.textSecondary};
      cursor: pointer;
      padding: 0.25rem;
      line-height: 1;
      transition: ${({ theme }) => theme.transitions.fast};

      &:hover {
        color: ${({ theme }) => theme.colors.danger};
      }
    }
  }

  .modal-body {
    padding: 1.5rem;
  }

  .modal-footer {
    display: flex;
    gap: 0.75rem;
    justify-content: flex-end;
    padding: 1rem 1.5rem;
    border-top: 1px solid ${({ theme }) => theme.colors.borderLight};
  }
`;

export const Badge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.65rem;
  border-radius: ${({ theme }) => theme.borderRadius.pill};
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;

  &.badge-success {
    background: rgba(67, 160, 71, 0.12);
    color: #2e7d32;
  }
  &.badge-danger {
    background: rgba(229, 57, 53, 0.12);
    color: #c62828;
  }
  &.badge-warning {
    background: rgba(255, 143, 0, 0.12);
    color: #e65100;
  }
  &.badge-info {
    background: rgba(30, 136, 229, 0.12);
    color: #1565c0;
  }
  &.badge-admin {
    background: rgba(156, 39, 176, 0.12);
    color: #7b1fa2;
  }
  &.badge-primary {
    background: rgba(13, 110, 253, 0.12);
    color: #0a58ca;
  }
`;

export const EmptyState = styled.div`
  text-align: center;
  padding: 3rem 1.5rem;
  color: ${({ theme }) => theme.colors.textSecondary};

  .empty-icon {
    font-size: 3.5rem;
    margin-bottom: 1rem;
    opacity: 0.5;
  }

  h3 {
    font-family: ${({ theme }) => theme.fonts.heading};
    font-size: 1.25rem;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.textPrimary};
    margin-bottom: 0.5rem;
  }

  p {
    font-size: ${({ theme }) => theme.fontSizes.sm};
    max-width: 340px;
    margin: 0 auto;
  }
`;

export const SpinnerWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${({ $fullPage }) => ($fullPage ? '8rem 2rem' : '3rem 2rem')};

  .spinner-border {
    color: ${({ theme }) => theme.colors.primary};
  }
`;

// ============ MOBILE CART CARD LAYOUT ============

export const MobileCartWrapper = styled.div`
  display: none;

  @media (max-width: 768px) {
    display: block;
  }
`;

export const CartCard = styled.div`
  background: ${({ theme }) => theme.colors.white};
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  padding: 1rem;
  margin-bottom: 1rem;
  box-shadow: ${({ theme }) => theme.shadows.sm};
  transition: all 0.2s ease;

  ${({ $delivered, theme }) =>
    $delivered &&
    `
    background-color: rgba(25, 135, 84, 0.03);
    border-color: ${theme.colors.primary};
  `}

  &:active {
    box-shadow: ${({ theme }) => theme.shadows.md};
  }
`;

export const CartCardHeader = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  margin-bottom: 0.875rem;
`;

export const CartCardCheckbox = styled.input`
  transform: scale(1.3);
  transform-origin: top left;
  margin-top: 0.25rem;
  cursor: pointer;
  flex-shrink: 0;
`;

export const CartCardProductName = styled.div`
  flex: 1;
  
  .name {
    font-weight: 600;
    font-size: 0.95rem;
    color: ${({ theme }) => theme.colors.textPrimary};
    word-wrap: break-word;
    overflow-wrap: break-word;
    word-break: break-word;
    line-height: 1.4;
    margin-bottom: 0.25rem;
  }

  .unit {
    font-size: 0.8rem;
    color: ${({ theme }) => theme.colors.textSecondary};
  }
`;

export const CartCardRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
  font-size: 0.9rem;

  &:last-of-type {
    margin-bottom: 0;
  }
`;

export const CartCardLabel = styled.span`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-weight: 500;
  white-space: nowrap;
`;

export const CartCardValue = styled.span`
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textPrimary};
  text-align: right;

  &.price {
    color: ${({ theme }) => theme.colors.primary};
  }

  &.total {
    color: #2e7d32;
    font-size: 1rem;
  }
`;

export const QuantityControlsMobile = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.75rem;

  button {
    background: ${({ theme }) => theme.colors.bodyBg};
    border: 1.5px solid ${({ theme }) => theme.colors.border};
    border-radius: ${({ theme }) => theme.borderRadius.sm};
    width: 40px;
    height: 40px;
    min-height: 40px;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 1.1rem;
    color: ${({ theme }) => theme.colors.textPrimary};
    cursor: pointer;
    transition: ${({ theme }) => theme.transitions.fast};
    flex-shrink: 0;

    &:hover:not(:disabled) {
      background: ${({ theme }) => theme.colors.primaryLight};
      border-color: ${({ theme }) => theme.colors.primary};
      color: ${({ theme }) => theme.colors.primary};
    }

    &:disabled {
      opacity: 0.4;
      cursor: not-allowed;
      background: #e0e0e0;
    }
  }

  .quantity-display {
    flex: 1;
    text-align: center;
    font-weight: 600;
    font-size: 1rem;
    padding: 0.5rem;
    background: ${({ theme }) => theme.colors.bodyBg};
    border-radius: ${({ theme }) => theme.borderRadius.sm};
    color: ${({ theme }) => theme.colors.textPrimary};
  }
`;

export const RemoveButtonMobile = styled.button`
  width: 100%;
  padding: 0.625rem;
  background: #ffebee;
  border: 1px solid #ffcdd2;
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  color: #c62828;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: ${({ theme }) => theme.transitions.fast};
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-height: 40px;

  &:hover:not(:disabled) {
    background: #ef5350;
    color: white;
    border-color: #ef5350;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

export const DesktopCartWrapper = styled.div`
  display: block;

  @media (max-width: 768px) {
    display: none;
  }
`;

// ============ PURCHASE HISTORY CARD LAYOUT ============

export const MobileHistoryWrapper = styled.div`
  display: none;

  @media (max-width: 768px) {
    display: block;
  }
`;

export const DesktopHistoryWrapper = styled.div`
  display: block;

  @media (max-width: 768px) {
    display: none;
  }
`;

export const HistoryCard = styled.div`
  background: ${({ theme }) => theme.colors.white};
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  padding: 1rem;
  margin-bottom: 1rem;
  box-shadow: ${({ theme }) => theme.shadows.sm};
  transition: all 0.2s ease;

  &:active {
    box-shadow: ${({ theme }) => theme.shadows.md};
  }
`;

export const HistoryCardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.75rem;
  margin-bottom: 0.875rem;
  padding-bottom: 0.875rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderLight};
`;

export const HistoryCardTitle = styled.div`
  .order-id {
    font-weight: 700;
    font-size: 1rem;
    color: ${({ theme }) => theme.colors.textPrimary};
  }

  .order-date {
    font-size: 0.8rem;
    color: ${({ theme }) => theme.colors.textSecondary};
    margin-top: 0.25rem;
  }
`;

export const HistoryCardRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.65rem;
  font-size: 0.9rem;

  &:last-of-type {
    margin-bottom: 0;
  }
`;

export const HistoryCardLabel = styled.span`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-weight: 500;
  white-space: nowrap;
`;

export const HistoryCardValue = styled.span`
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textPrimary};
  text-align: right;

  &.price {
    color: #2e7d32;
  }

  &.amount {
    color: #2e7d32;
    font-size: 1rem;
  }
`;

export const HistoryCardFooter = styled.div`
  display: flex;
  gap: 0.75rem;
  margin-top: 0.875rem;
  padding-top: 0.875rem;
  border-top: 1px solid ${({ theme }) => theme.colors.borderLight};
`;

export const HistoryCardButton = styled.button`
  flex: 1;
  padding: 0.625rem;
  background: ${({ theme }) => theme.colors.primary};
  color: white;
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: ${({ theme }) => theme.transitions.fast};
  min-height: 40px;

  &:hover {
    background: ${({ theme }) => theme.colors.primaryDark};
    transform: translateY(-1px);
    box-shadow: ${({ theme }) => theme.shadows.md};
  }

  &:active {
    transform: translateY(0);
  }
`;

export const HistoryStatusBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.25rem 0.65rem;
  border-radius: ${({ theme }) => theme.borderRadius.pill};
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  white-space: nowrap;

  ${({ $status }) => {
    switch ($status) {
      case 'Completed':
      case 'Delivered':
      case 'Paid':
        return `
          background: rgba(67, 160, 71, 0.12);
          color: #2e7d32;
        `;
      case 'Pending':
      case 'Pending Acceptance':
        return `
          background: rgba(255, 143, 0, 0.12);
          color: #e65100;
        `;
      case 'Accepted':
      case 'Verified':
        return `
          background: rgba(30, 136, 229, 0.12);
          color: #1565c0;
        `;
      case 'Rejected':
        return `
          background: rgba(229, 57, 53, 0.12);
          color: #c62828;
        `;
      default:
        return `
          background: rgba(158, 158, 158, 0.12);
          color: #616161;
        `;
    }
  }}
`;

// ============ ADMIN BILLS CARD LAYOUT ============

export const MobileBillsWrapper = styled.div`
  display: none;

  @media (max-width: 768px) {
    display: block;
  }
`;

export const DesktopBillsWrapper = styled.div`
  display: block;

  @media (max-width: 768px) {
    display: none;
  }
`;

export const BillCard = styled.div`
  background: ${({ theme }) => theme.colors.white};
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  padding: 1rem;
  margin-bottom: 1rem;
  box-shadow: ${({ theme }) => theme.shadows.sm};
  transition: all 0.2s ease;

  &:active {
    box-shadow: ${({ theme }) => theme.shadows.md};
  }
`;

export const BillCardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.75rem;
  margin-bottom: 0.875rem;
  padding-bottom: 0.875rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderLight};
`;

export const BillCardTitle = styled.div`
  .order-id {
    font-weight: 700;
    font-size: 1rem;
    color: ${({ theme }) => theme.colors.textPrimary};
  }

  .customer-name {
    font-size: 0.9rem;
    color: ${({ theme }) => theme.colors.textSecondary};
    margin-top: 0.25rem;
  }
`;

export const BillCardRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.65rem;
  font-size: 0.9rem;

  &:last-of-type {
    margin-bottom: 0;
  }
`;

export const BillCardLabel = styled.span`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-weight: 500;
  white-space: nowrap;
  flex-shrink: 0;
`;

export const BillCardValue = styled.span`
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textPrimary};
  text-align: right;
  flex: 1;

  &.amount {
    color: #2e7d32;
    font-size: 1rem;
  }
`;

export const BillCardFooter = styled.div`
  display: flex;
  gap: 0.75rem;
  margin-top: 0.875rem;
  padding-top: 0.875rem;
  border-top: 1px solid ${({ theme }) => theme.colors.borderLight};
`;

export const BillCardButton = styled.button`
  flex: 1;
  padding: 0.625rem;
  background: ${({ theme }) => theme.colors.primary};
  color: white;
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: ${({ theme }) => theme.transitions.fast};
  min-height: 40px;

  &:hover {
    background: ${({ theme }) => theme.colors.primaryDark};
    transform: translateY(-1px);
    box-shadow: ${({ theme }) => theme.shadows.md};
  }

  &:active {
    transform: translateY(0);
  }
`;

export const BillStatusBadge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 0.3rem 0.75rem;
  border-radius: ${({ theme }) => theme.borderRadius.pill};
  font-size: 0.8rem;
  font-weight: 700;
  white-space: nowrap;

  ${({ $status }) => {
    switch ($status) {
      case 'Completed':
      case 'Delivered':
      case 'Paid':
        return `
          background: rgba(67, 160, 71, 0.12);
          color: #2e7d32;
        `;
      case 'Rejected':
        return `
          background: rgba(229, 57, 53, 0.12);
          color: #c62828;
        `;
      default:
        return `
          background: rgba(158, 158, 158, 0.12);
          color: #616161;
        `;
    }
  }}
`;

// ============ ORDERS CARD LAYOUT (Mobile) ============

export const MobileOrdersWrapper = styled.div`
  display: none;

  @media (max-width: 768px) {
    display: block;
  }
`;

export const DesktopOrdersWrapper = styled.div`
  display: block;

  @media (max-width: 768px) {
    display: none;
  }
`;

export const OrderCard = styled.div`
  background: ${({ theme }) => theme.colors.white};
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  padding: 1rem;
  margin-bottom: 1rem;
  box-shadow: ${({ theme }) => theme.shadows.sm};
  transition: all 0.2s ease;

  &:active {
    box-shadow: ${({ theme }) => theme.shadows.md};
  }
`;

export const OrderCardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.75rem;
  margin-bottom: 0.875rem;
  padding-bottom: 0.875rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderLight};
`;

export const OrderCardTitle = styled.div`
  .order-id {
    font-weight: 700;
    font-size: 1rem;
    color: ${({ theme }) => theme.colors.textPrimary};
  }

  .customer-name {
    font-size: 0.9rem;
    color: ${({ theme }) => theme.colors.textSecondary};
    margin-top: 0.25rem;
  }
`;

export const OrderCardRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.65rem;
  font-size: 0.9rem;

  &:last-of-type {
    margin-bottom: 0;
  }
`;

export const OrderCardLabel = styled.span`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-weight: 500;
  white-space: nowrap;
  flex-shrink: 0;
`;

export const OrderCardValue = styled.span`
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textPrimary};
  text-align: right;
  flex: 1;

  &.amount {
    color: #2e7d32;
    font-size: 1rem;
  }
`;

export const OrderCardFooter = styled.div`
  display: flex;
  gap: 0.75rem;
  margin-top: 0.875rem;
  padding-top: 0.875rem;
  border-top: 1px solid ${({ theme }) => theme.colors.borderLight};
`;

export const OrderCardButton = styled.button`
  flex: 1;
  padding: 0.625rem;
  background: ${({ theme }) => theme.colors.primary};
  color: white;
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: ${({ theme }) => theme.transitions.fast};
  min-height: 40px;

  &:hover {
    background: ${({ theme }) => theme.colors.primaryDark};
    transform: translateY(-1px);
    box-shadow: ${({ theme }) => theme.shadows.md};
  }

  &:active {
    transform: translateY(0);
  }
`;

export const OrderStatusBadge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 0.3rem 0.75rem;
  border-radius: ${({ theme }) => theme.borderRadius.pill};
  font-size: 0.8rem;
  font-weight: 700;
  white-space: nowrap;

  ${({ $status }) => {
    const lower = String($status || '').toLowerCase();
    if (lower.includes('completed') || lower.includes('delivered') || lower.includes('paid')) {
      return `
        background: rgba(67, 160, 71, 0.12);
        color: #2e7d32;
      `;
    }
    if (lower.includes('rejected') || lower.includes('cancel')) {
      return `
        background: rgba(229, 57, 53, 0.12);
        color: #c62828;
      `;
    }
    if (lower.includes('verified') || lower.includes('accepted')) {
      return `
        background: rgba(30, 136, 229, 0.12);
        color: #1565c0;
      `;
    }
    return `
      background: rgba(255, 152, 0, 0.12);
      color: #e65100;
    `;
  }}
`;

// ============ CUSTOMERS CARD LAYOUT (Mobile) ============

export const MobileCustomersWrapper = styled.div`
  display: none;

  @media (max-width: 768px) {
    display: block;
  }
`;

export const DesktopCustomersWrapper = styled.div`
  display: block;

  @media (max-width: 768px) {
    display: none;
  }
`;

export const CustomerCard = styled.div`
  background: ${({ theme }) => theme.colors.white};
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  padding: 1rem;
  margin-bottom: 1rem;
  box-shadow: ${({ theme }) => theme.shadows.sm};
  transition: all 0.2s ease;

  &:active {
    box-shadow: ${({ theme }) => theme.shadows.md};
  }
`;

export const CustomerCardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.75rem;
  margin-bottom: 0.875rem;
  padding-bottom: 0.875rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderLight};
`;

export const CustomerCardTitle = styled.div`
  .customer-name {
    font-weight: 700;
    font-size: 1rem;
    color: ${({ theme }) => theme.colors.textPrimary};
  }

  .customer-rating {
    font-size: 0.9rem;
    color: ${({ theme }) => theme.colors.textSecondary};
    margin-top: 0.25rem;
  }
`;

export const CustomerCardRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.65rem;
  font-size: 0.9rem;

  &:last-of-type {
    margin-bottom: 0;
  }
`;

export const CustomerCardLabel = styled.span`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-weight: 500;
  white-space: nowrap;
  flex-shrink: 0;
`;

export const CustomerCardValue = styled.span`
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textPrimary};
  text-align: right;
  flex: 1;

  &.amount {
    color: #2e7d32;
    font-size: 1rem;
  }

  &.count {
    background: rgba(13, 110, 253, 0.1);
    color: #0a58ca;
    padding: 0.2rem 0.5rem;
    border-radius: 4px;
    font-size: 0.85rem;
  }
`;

export const CustomerCardFooter = styled.div`
  display: flex;
  gap: 0.75rem;
  margin-top: 0.875rem;
  padding-top: 0.875rem;
  border-top: 1px solid ${({ theme }) => theme.colors.borderLight};
`;

export const CustomerCardButton = styled.button`
  flex: 1;
  padding: 0.625rem;
  background: ${({ theme }) => theme.colors.primary};
  color: white;
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: ${({ theme }) => theme.transitions.fast};
  min-height: 40px;
  text-decoration: none;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: ${({ theme }) => theme.colors.primaryDark};
    transform: translateY(-1px);
    box-shadow: ${({ theme }) => theme.shadows.md};
  }

  &:active {
    transform: translateY(0);
  }
`;

