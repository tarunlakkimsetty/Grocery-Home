import styled from 'styled-components';

export const AppContainer = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: ${({ theme }) => theme.colors.bodyBg};
  font-family: ${({ theme }) => theme.fonts.primary};
`;

export const MainContent = styled.main`
  margin-left: ${({ theme }) => theme.sidebar.width};
  margin-top: ${({ theme }) => theme.navbar.height};
  padding: 1.5rem 2rem;
  min-height: calc(100vh - ${({ theme }) => theme.navbar.height});
  flex: 1;
  transition: margin-left 0.3s ease;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    margin-left: 0;
    margin-top: 120px;
    padding: 1rem;
    min-height: calc(100vh - 120px);
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    margin-top: 110px;
    min-height: calc(100vh - 110px);
  }
`;

export const PageHeader = styled.div`
  margin-bottom: 1.5rem;
  
  h1 {
    font-family: ${({ theme }) => theme.fonts.heading};
    font-size: 1.75rem;
    font-weight: 700;
    color: ${({ theme }) => theme.colors.textPrimary};
    margin-bottom: 0.25rem;
  }

  p {
    color: ${({ theme }) => theme.colors.textSecondary};
    font-size: ${({ theme }) => theme.fontSizes.md};
    margin: 0;
  }
`;

export const AuthContainer = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ theme }) => theme.colors.dark};
  padding: 2rem;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(
      circle at 30% 50%,
      rgba(46, 125, 50, 0.15) 0%,
      transparent 50%
    ),
    radial-gradient(
      circle at 70% 50%,
      rgba(0, 172, 193, 0.1) 0%,
      transparent 50%
    );
    animation: authBgPulse 8s ease-in-out infinite alternate;
  }

  @keyframes authBgPulse {
    0% { transform: translate(0, 0); }
    100% { transform: translate(-2%, -2%); }
  }
`;

export const AuthCard = styled.div`
  width: 100%;
  max-width: 440px;
  background: ${({ theme }) => theme.colors.darkAlt};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  padding: 2.5rem;
  box-shadow: ${({ theme }) => theme.shadows.xl};
  border: 1px solid rgba(255, 255, 255, 0.06);
  position: relative;
  z-index: 1;

  .auth-header {
    text-align: center;
    margin-bottom: 2rem;
    
    .auth-logo {
      width: 56px;
      height: 56px;
      background: ${({ theme }) => theme.colors.gradient};
      border-radius: ${({ theme }) => theme.borderRadius.md};
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.75rem;
      color: white;
      margin: 0 auto 1rem;
      box-shadow: ${({ theme }) => theme.shadows.glow};
    }

    h2 {
      font-family: ${({ theme }) => theme.fonts.heading};
      color: ${({ theme }) => theme.colors.white};
      font-size: 1.5rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
    }

    p {
      color: ${({ theme }) => theme.colors.textLight};
      font-size: ${({ theme }) => theme.fontSizes.sm};
      margin: 0;
    }
  }

  .auth-footer {
    text-align: center;
    margin-top: 1.5rem;
    
    a {
      color: ${({ theme }) => theme.colors.primaryLight};
      text-decoration: none;
      font-weight: 600;
      transition: ${({ theme }) => theme.transitions.fast};

      &:hover {
        color: ${({ theme }) => theme.colors.secondaryLight};
      }
    }

    span {
      color: ${({ theme }) => theme.colors.textLight};
      font-size: ${({ theme }) => theme.fontSizes.sm};
    }
  }
`;

export const StyledInput = styled.div`
  margin-bottom: 1.25rem;

  label {
    display: block;
    color: ${({ theme }) => theme.colors.textLight};
    font-size: ${({ theme }) => theme.fontSizes.sm};
    font-weight: 600;
    margin-bottom: 0.5rem;
  }

  input, select {
    width: 100%;
    padding: 0.75rem 1rem;
    background: rgba(255, 255, 255, 0.05);
    border: 1.5px solid rgba(255, 255, 255, 0.1);
    border-radius: ${({ theme }) => theme.borderRadius.sm};
    color: ${({ theme }) => theme.colors.white};
    font-size: ${({ theme }) => theme.fontSizes.md};
    transition: ${({ theme }) => theme.transitions.fast};
    outline: none;

    &::placeholder {
      color: rgba(255, 255, 255, 0.3);
    }

    &:focus {
      border-color: ${({ theme }) => theme.colors.primaryLight};
      box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.15);
      background: rgba(255, 255, 255, 0.08);
    }
  }

  .error-text {
    color: ${({ theme }) => theme.colors.danger};
    font-size: ${({ theme }) => theme.fontSizes.xs};
    margin-top: 0.35rem;
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }
`;
