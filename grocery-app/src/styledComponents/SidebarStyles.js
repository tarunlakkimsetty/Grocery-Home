import styled, { css } from 'styled-components';

export const SidebarOverlay = styled.div`
  display: none;

  /* Show overlay for mobile and tablet (up to 1024px) */
  @media (max-width: 1024px) {
    display: ${({ $isOpen }) => ($isOpen ? 'block' : 'none')};
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: ${({ theme }) => theme.colors.overlay};
    z-index: 50;
  }
`;

export const SidebarWrapper = styled.aside`
  position: fixed;
  top: ${({ theme }) => theme.navbar.height};
  left: 0;
  bottom: 0;
  width: ${({ theme }) => theme.sidebar.width};
  background: ${({ theme }) => theme.colors.sidebarBg};
  overflow-y: auto;
  overflow-x: hidden;
  z-index: 90;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  padding: 0.75rem 0;
  border-right: 1px solid rgba(255, 255, 255, 0.05);

  &::-webkit-scrollbar {
    width: 4px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.15);
    border-radius: 4px;
  }

  /* Hide/overlay sidebar for mobile and tablet (up to 1024px) */
  @media (max-width: 1024px) {
    transform: translateX(${({ $isOpen }) => ($isOpen ? '0' : '-100%')});
    top: 0;
    padding-top: calc(${({ theme }) => theme.navbar.height} + 0.75rem);
  }
`;

export const SidebarSection = styled.div`
  padding: 0.5rem 0;
  
  &:not(:last-child) {
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    margin-bottom: 0.25rem;
  }
`;

export const SidebarLabel = styled.div`
  padding: 0.5rem 1.5rem;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1.2px;
  color: ${({ theme }) => theme.colors.textLight};
  opacity: 0.6;
`;

export const SidebarItem = styled.button`
  display: flex;
  align-items: center;
  gap: 0.875rem;
  width: 100%;
  padding: 0.625rem 1.25rem;
  background: transparent;
  border: none;
  color: ${({ theme }) => theme.colors.textLight};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: 500;
  cursor: pointer;
  transition: ${({ theme }) => theme.transitions.fast};
  text-align: left;
  position: relative;
  border-radius: 0;

  .item-icon {
    font-size: 1.2rem;
    width: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .item-label {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &:hover {
    background: ${({ theme }) => theme.colors.sidebarHover};
    color: ${({ theme }) => theme.colors.white};
  }

  ${({ $active }) =>
        $active &&
        css`
      background: ${({ theme }) => theme.colors.sidebarActive};
      color: ${({ theme }) => theme.colors.white};
      font-weight: 600;

      &::before {
        content: '';
        position: absolute;
        left: 0;
        top: 50%;
        transform: translateY(-50%);
        width: 3px;
        height: 60%;
        background: ${({ theme }) => theme.colors.primaryLight};
        border-radius: 0 4px 4px 0;
      }
    `}
`;
