import styled from 'styled-components';
import { Link } from 'react-router-dom';

export const NavbarWrapper = styled.nav`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: ${({ theme }) => theme.colors.navbarBg};
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0;
  z-index: 100;
  box-shadow: ${({ theme }) => theme.shadows.md};
  transition: ${({ theme }) => theme.transitions.normal};
  height: ${({ theme }) => theme.navbar.height};
  width: 100vw;
  flex-wrap: nowrap;
  overflow: hidden;

  @media (max-width: 767px) {
    height: auto;
    flex-direction: column;
    padding: 0.5rem;
    gap: 0.5rem;
    width: 100vw;
    overflow: visible;
  }

  @media (max-width: 576px) {
    padding: 0.4rem;
    gap: 0.4rem;
  }
`;

export const DesktopLayout = styled.div`
  display: none;
  width: 100%;
  flex-wrap: nowrap;

  @media (min-width: 768px) {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
  }
`;

export const NavBrand = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  flex-shrink: 1;
  min-width: 0;
  flex-wrap: nowrap;

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
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;
    
    span {
      color: ${({ theme }) => theme.colors.secondaryLight};
      white-space: nowrap;
    }

    @media (max-width: 1024px) {
      font-size: ${({ theme }) => theme.fontSizes.lg};
      max-width: 300px;
    }

    @media (max-width: 768px) {
      font-size: ${({ theme }) => theme.fontSizes.lg};
      max-width: 250px;
    }

    @media (max-width: 576px) {
      font-size: ${({ theme }) => theme.fontSizes.md};
      max-width: 120px;
    }
  }
`;

export const NavActions = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-shrink: 0;
  flex-wrap: nowrap;

  @media (max-width: 1024px) {
    gap: 0.75rem;
  }

  @media (max-width: 768px) {
    width: 100%;
    justify-content: space-around;
    gap: 0.5rem;
    padding: 0 0.5rem;
    flex-wrap: nowrap;
  }

  @media (max-width: 576px) {
    gap: 0.4rem;
    padding: 0 0.3rem;
  }
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
  min-height: 40px;

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
    flex-shrink: 0;
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

  @media (max-width: 768px) {
    padding: 0.4rem 0.75rem;
    gap: 0.5rem;
    min-height: 40px;

    .user-meta {
      display: none;
    }
  }
`;

export const LogoutButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
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
  min-height: 40px;
  min-width: 40px;

  &:hover {
    background: ${({ theme }) => theme.colors.danger};
    color: ${({ theme }) => theme.colors.white};
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(229, 57, 53, 0.4);
  }

  @media (max-width: 768px) {
    padding: 0.5rem 0.75rem;
    font-size: ${({ theme }) => theme.fontSizes.xs};
    gap: 0.25rem;
  }
`;

export const HamburgerButton = styled.button`
  display: none;
  background: transparent;
  border: none;
  color: ${({ theme }) => theme.colors.white};
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.5rem;
  line-height: 1;
  min-width: 40px;
  min-height: 40px;
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  transition: ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  /* Show hamburger for mobile and tablet (up to 1024px) */
  @media (max-width: 1024px) {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* Hide on desktop (1025px+) */
  @media (min-width: 1025px) {
    display: none !important;
  }
`;

export const NavTopRow = styled.div`
  display: none;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;

  @media (max-width: 767px) {
    display: flex;
  }
`;

export const NavBottomRow = styled.div`
  display: none;
  width: 100%;
  align-items: center;
  justify-content: space-around;
  gap: 0.5rem;

  @media (max-width: 767px) {
    display: flex;
    padding: 0 0.5rem;
  }
`;

export const NavBrandMobile = styled.div`
  display: none;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  flex: 1;
  min-width: 0;

  @media (max-width: 767px) {
    display: flex;
  }

  .logo-icon {
    width: 28px;
    height: 28px;
    background: ${({ theme }) => theme.colors.gradient};
    border-radius: ${({ theme }) => theme.borderRadius.sm};
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1rem;
    color: ${({ theme }) => theme.colors.white};
    box-shadow: ${({ theme }) => theme.shadows.glow};
    flex-shrink: 0;
  }

  .brand-text {
    font-family: ${({ theme }) => theme.fonts.heading};
    font-size: ${({ theme }) => theme.fontSizes.md};
    font-weight: 700;
    color: ${({ theme }) => theme.colors.white};
    letter-spacing: -0.5px;
    min-width: 0;
    word-wrap: break-word;
    overflow-wrap: break-word;
    word-break: break-word;
    line-height: 1.2;
  }

  @media (max-width: 576px) {
    gap: 0.4rem;

    .logo-icon {
      width: 24px;
      height: 24px;
      font-size: 0.9rem;
    }

    .brand-text {
      font-size: ${({ theme }) => theme.fontSizes.sm};
    }
  }
`;

export const NavIconButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: ${({ theme }) => theme.colors.white};
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0.5rem;
  min-width: 40px;
  min-height: 40px;
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  transition: ${({ theme }) => theme.transitions.fast};
  position: relative;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  @media (max-width: 768px) {
    font-size: 1.1rem;
    padding: 0.4rem;
    min-width: 38px;
    min-height: 38px;
  }
`;
