import React from 'react';
import styled from 'styled-components';
import LanguageContext from '../context/LanguageContext';
import LegalModalContext from '../context/LegalModalContext';

const FooterWrapper = styled.footer`
  margin-left: ${({ theme, $withSidebar }) => ($withSidebar ? theme.sidebar.width : 0)};
  padding: 1rem 2rem;
  border-top: 1px solid ${({ theme }) => theme.colors.borderLight};
  background: ${({ theme }) => theme.colors.white};
  color: ${({ theme }) => theme.colors.textSecondary};

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    margin-left: 0;
    padding: 1rem;
  }
`;

const FooterTop = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
`;

const FooterLinks = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;

  a {
    color: ${({ theme }) => theme.colors.primary};
    text-decoration: none;
    font-weight: 600;

    &:hover {
      color: ${({ theme }) => theme.colors.primaryDark};
      text-decoration: underline;
    }
  }

  .sep {
    opacity: 0.6;
  }
`;

const FooterLinkButton = styled.button`
  background: none;
  border: none;
  padding: 0;
  margin: 0;
  color: ${({ theme }) => theme.colors.primary};
  text-decoration: none;
  font-weight: 600;
  cursor: pointer;

  &:hover {
    color: ${({ theme }) => theme.colors.primaryDark};
    text-decoration: underline;
  }
`;

const FooterBottom = styled.div`
  margin-top: 0.75rem;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  opacity: 0.85;
`;

class CustomerFooter extends React.Component {
  render() {
    const withSidebar = !!this.props.withSidebar;

    return (
      <LanguageContext.Consumer>
        {(langCtx) => (
          <LegalModalContext.Consumer>
            {(legalModal) => (
              <FooterWrapper $withSidebar={withSidebar}>
                <FooterTop>
                  <FooterLinks aria-label="Legal and contact links">
                    <FooterLinkButton type="button" onClick={() => legalModal.openLegalModal('privacy')}>
                      {langCtx.getText('legal_modal_privacy')}
                    </FooterLinkButton>
                    <span className="sep">|</span>
                    <FooterLinkButton type="button" onClick={() => legalModal.openLegalModal('terms')}>
                      {langCtx.getText('legal_modal_terms')}
                    </FooterLinkButton>
                    <span className="sep">|</span>
                    <FooterLinkButton type="button" onClick={() => legalModal.openLegalModal('contact')}>
                      {langCtx.getText('legal_modal_contact')}
                    </FooterLinkButton>
                  </FooterLinks>
                </FooterTop>

                <FooterBottom>
                  © 2026 Om Sri Satya Sai Rama Kirana &amp; General Merchants
                </FooterBottom>
              </FooterWrapper>
            )}
          </LegalModalContext.Consumer>
        )}
      </LanguageContext.Consumer>
    );
  }
}

export default CustomerFooter;
