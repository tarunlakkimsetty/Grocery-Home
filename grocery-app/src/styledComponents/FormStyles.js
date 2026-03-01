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
