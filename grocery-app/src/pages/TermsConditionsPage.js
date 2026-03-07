import React from 'react';
import styled from 'styled-components';
import LanguageContext from '../context/LanguageContext';
import { PageHeader } from '../styledComponents/LayoutStyles';

const TermsCard = styled.div`
  background: ${({ theme }) => theme.colors.white};
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  box-shadow: ${({ theme }) => theme.shadows.sm};
  padding: 1.25rem;

  h2 {
    font-family: ${({ theme }) => theme.fonts.heading};
    font-size: ${({ theme }) => theme.fontSizes.lg};
    margin: 0 0 0.75rem;
    color: ${({ theme }) => theme.colors.textPrimary};
  }

  p {
    margin: 0 0 0.75rem;
    color: ${({ theme }) => theme.colors.textSecondary};
    line-height: 1.6;
  }

  ul {
    margin: 0.25rem 0 0.75rem 1.1rem;
    color: ${({ theme }) => theme.colors.textSecondary};
    line-height: 1.6;
  }

  li { margin-bottom: 0.35rem; }
`;

class TermsConditionsPage extends React.Component {
  render() {
    const embedded = !!this.props.embedded;

    return (
      <LanguageContext.Consumer>
        {(langCtx) => {
          const content = (
            <TermsCard>
              {embedded && <p>{langCtx.getText('legal_terms_subtitle')}</p>}

              <h2>{langCtx.getText('legal_terms_order_processing_title')}</h2>
              <ul>
                <li>{langCtx.getText('legal_terms_order_processing_item1')}</li>
                <li>{langCtx.getText('legal_terms_order_processing_item2')}</li>
              </ul>

              <h2>{langCtx.getText('legal_terms_payments_title')}</h2>
              <ul>
                <li>{langCtx.getText('legal_terms_payments_item1')}</li>
              </ul>

              <h2>{langCtx.getText('legal_terms_order_updates_title')}</h2>
              <ul>
                <li>{langCtx.getText('legal_terms_order_updates_item1')}</li>
              </ul>

              <h2>{langCtx.getText('legal_terms_pricing_title')}</h2>
              <ul>
                <li>{langCtx.getText('legal_terms_pricing_item1')}</li>
              </ul>
            </TermsCard>
          );

          if (embedded) return content;

          return (
            <div>
              <PageHeader>
                <h1>📜 {langCtx.getText('legal_terms_title')}</h1>
                <p>{langCtx.getText('legal_terms_subtitle')}</p>
              </PageHeader>

              {content}
            </div>
          );
        }}
      </LanguageContext.Consumer>
    );
  }
}

export default TermsConditionsPage;
