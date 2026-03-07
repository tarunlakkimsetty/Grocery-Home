import React from 'react';
import styled from 'styled-components';
import LanguageContext from '../context/LanguageContext';
import { PageHeader } from '../styledComponents/LayoutStyles';

const PolicyCard = styled.div`
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

class PrivacyPolicyPage extends React.Component {
  render() {
    const embedded = !!this.props.embedded;

    return (
      <LanguageContext.Consumer>
        {(langCtx) => {
          const content = (
            <PolicyCard>
              {embedded && <p>{langCtx.getText('legal_privacy_subtitle')}</p>}

              <h2>{langCtx.getText('legal_privacy_info_collect_title')}</h2>
              <p>{langCtx.getText('legal_privacy_info_collect_p1')}</p>
              <ul>
                <li>{langCtx.getText('legal_privacy_info_collect_item1')}</li>
                <li>{langCtx.getText('legal_privacy_info_collect_item2')}</li>
                <li>{langCtx.getText('legal_privacy_info_collect_item3')}</li>
                <li>{langCtx.getText('legal_privacy_info_collect_item4')}</li>
              </ul>

              <h2>{langCtx.getText('legal_privacy_use_title')}</h2>
              <ul>
                <li>{langCtx.getText('legal_privacy_use_item1')}</li>
                <li>{langCtx.getText('legal_privacy_use_item2')}</li>
                <li>{langCtx.getText('legal_privacy_use_item3')}</li>
              </ul>

              <h2>{langCtx.getText('legal_privacy_sharing_title')}</h2>
              <p>{langCtx.getText('legal_privacy_sharing_p1')}</p>

              <h2>{langCtx.getText('legal_privacy_security_title')}</h2>
              <ul>
                <li>{langCtx.getText('legal_privacy_security_item1')}</li>
                <li>{langCtx.getText('legal_privacy_security_item2')}</li>
                <li>{langCtx.getText('legal_privacy_security_item3')}</li>
                <li>{langCtx.getText('legal_privacy_security_item4')}</li>
              </ul>
            </PolicyCard>
          );

          if (embedded) return content;

          return (
            <div>
              <PageHeader>
                <h1>🔒 {langCtx.getText('legal_privacy_title')}</h1>
                <p>{langCtx.getText('legal_privacy_subtitle')}</p>
              </PageHeader>

              {content}
            </div>
          );
        }}
      </LanguageContext.Consumer>
    );
  }
}

export default PrivacyPolicyPage;
