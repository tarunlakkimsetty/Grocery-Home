import styled from 'styled-components';
import { Link } from 'react-router-dom';

export const NavbarWrapper = styled.nav`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: ${({ theme }) => theme.navbar.height};
  background: ${({ theme }) => theme.colors.navbarBg};
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0;
  z-index: 1030;
  box-shadow: ${({ theme }) => theme.shadows.md};
  transition: ${({ theme }) => theme.transitions.normal};
`;

export const NavBrand = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  flex-shrink: 1;
  min-width: 0;

  .logo-icon {
    width: 36px;
    height: 36px;
    background: ${({ theme }) => theme.colors.gradient};
    border-radius: ${({ theme }) => theme.borderRadius.md};
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.25rem;
    color: ${({ theme }) => theme.colors.white};
    box-shadow: ${({ theme }) => theme.shadows.glow};
    flex-shrink: 0;
  }

  .brand-text {
    font-family: ${({ theme }) => theme.fonts.heading};
    font-size: ${({ theme }) => theme.fontSizes.xl};
    font-weight: 700;
    color: ${({ theme }) => theme.colors.white};
    letter-spacing: -0.5px;
    word-wrap: break-word;
    overflow-wrap: break-word;
    word-break: break-word;
    line-height: 1.3;
    max-width: 400px;
    
    span {
      color: ${({ theme }) => theme.colors.secondaryLight};
    }

    @media (max-width: 768px) {
      font-size: ${({ theme }) => theme.fontSizes.lg};
      max-width: 250px;
    }

    @media (max-width: 576px) {
      font-size: ${({ theme }) => theme.fontSizes.md};
      max-width: 150px;
    }
  }
`;

export const NavActions = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

export const CartLink = styled(Link)`
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
`;

export const CartBadge = styled.span`
  position: absolute;
  top: 0;
  right: 0;
  transform: translate(50%, -50%);
  z-index: 1;

  min-width: 18px;
  height: 18px;
  padding: 0 6px;
  border-radius: ${({ theme }) => theme.borderRadius.pill};
  background: ${({ theme }) => theme.colors.danger};
  color: ${({ theme }) => theme.colors.white};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: 700;
  line-height: 1;

  display: inline-flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
`;

export const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.4rem 1rem;
  background: rgba(255, 255, 255, 0.08);
  border-radius: ${({ theme }) => theme.borderRadius.pill};
  border: 1px solid rgba(255, 255, 255, 0.1);

  .user-avatar {
    width: 32px;
    height: 32px;
    border-radius: ${({ theme }) => theme.borderRadius.circle};
    background: ${({ theme }) => theme.colors.gradient};
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: 600;
    font-size: 0.875rem;
  }

  .user-meta {
    display: flex;
    flex-direction: column;
    line-height: 1.2;
    align-items: flex-end;
    
    .user-name {
      color: ${({ theme }) => theme.colors.white};
      font-size: ${({ theme }) => theme.fontSizes.sm};
      font-weight: 600;
    }

    .user-phone {
      font-size: ${({ theme }) => theme.fontSizes.xs};
      color: rgba(255, 255, 255, 0.7);
      font-weight: 500;
    }
  }
`;

export const LogoutButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1.25rem;
  background: rgba(229, 57, 53, 0.15);
  color: #ff6b6b;
  border: 1px solid rgba(229, 57, 53, 0.3);
  border-radius: ${({ theme }) => theme.borderRadius.pill};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: 600;
  cursor: pointer;
  transition: ${({ theme }) => theme.transitions.fast};
  white-space: normal;
  word-wrap: break-word;
  overflow-wrap: break-word;

  &:hover {
    background: ${({ theme }) => theme.colors.danger};
    color: ${({ theme }) => theme.colors.white};
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(229, 57, 53, 0.4);
  }
`;

export const HamburgerButton = styled.button`
  display: none;
  background: transparent;
  border: none;
  color: ${({ theme }) => theme.colors.white};
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.25rem;
  line-height: 1;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    display: flex;
    align-items: center;
  }
`;
