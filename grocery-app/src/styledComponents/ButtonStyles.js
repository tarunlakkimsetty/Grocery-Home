import styled, { css } from 'styled-components';

const baseButton = css`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.55rem 1.25rem;
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: 600;
  cursor: pointer;
  transition: ${({ theme }) => theme.transitions.fast};
  border: none;
  white-space: normal;
  word-wrap: break-word;
  overflow-wrap: break-word;
  word-break: break-word;
  line-height: 1.3;
  text-align: center;
  min-height: 36px;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none !important;
  }

  &:hover:not(:disabled) {
    transform: translateY(-1px);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }
`;

export const PrimaryButton = styled.button`
  ${baseButton}
  background: ${({ theme }) => theme.colors.gradient};
  color: ${({ theme }) => theme.colors.white};
  box-shadow: 0 2px 8px rgba(46, 125, 50, 0.3);

  &:hover:not(:disabled) {
    box-shadow: 0 4px 16px rgba(46, 125, 50, 0.4);
  }
`;

export const SecondaryButton = styled.button`
  ${baseButton}
  background: transparent;
  color: ${({ theme }) => theme.colors.primary};
  border: 1.5px solid ${({ theme }) => theme.colors.primary};

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.white};
  }
`;

export const DangerButton = styled.button`
  ${baseButton}
  background: ${({ theme }) => theme.colors.danger};
  color: ${({ theme }) => theme.colors.white};
  box-shadow: 0 2px 8px rgba(229, 57, 53, 0.3);

  &:hover:not(:disabled) {
    background: #c62828;
    box-shadow: 0 4px 16px rgba(229, 57, 53, 0.4);
  }
`;

export const WarningButton = styled.button`
  ${baseButton}
  background: ${({ theme }) => theme.colors.secondary};
  color: ${({ theme }) => theme.colors.white};

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.colors.secondaryDark};
  }
`;

export const GhostButton = styled.button`
  ${baseButton}
  background: transparent;
  color: ${({ theme }) => theme.colors.textSecondary};
  padding: 0.4rem 0.75rem;

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.colors.borderLight};
    color: ${({ theme }) => theme.colors.textPrimary};
  }
`;

export const SubmitButton = styled.button`
  ${baseButton}
  width: 100%;
  padding: 0.8rem;
  font-size: 1rem;
  background: ${({ theme }) => theme.colors.gradient};
  color: ${({ theme }) => theme.colors.white};
  box-shadow: 0 2px 12px rgba(46, 125, 50, 0.3);

  &:hover:not(:disabled) {
    box-shadow: 0 4px 20px rgba(46, 125, 50, 0.45);
  }
`;
