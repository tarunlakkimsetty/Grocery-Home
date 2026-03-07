import React from 'react';
import styled from 'styled-components';
import LanguageContext from '../context/LanguageContext';
import { PageHeader } from '../styledComponents/LayoutStyles';

const ContactCard = styled.div`
  background: ${({ theme }) => theme.colors.white};
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  box-shadow: ${({ theme }) => theme.shadows.sm};
  padding: 1.25rem;

  .name {
    font-family: ${({ theme }) => theme.fonts.heading};
    font-size: ${({ theme }) => theme.fontSizes.lg};
    font-weight: 800;
    color: ${({ theme }) => theme.colors.textPrimary};
    margin-bottom: 0.5rem;
  }

  .line {
    margin: 0 0 0.5rem;
    color: ${({ theme }) => theme.colors.textSecondary};
    white-space: pre-line;
    line-height: 1.6;
  }
`;

class ContactPage extends React.Component {
  render() {
    const embedded = !!this.props.embedded;

    return (
      <LanguageContext.Consumer>
        {(langCtx) => {
          const content = (
            <ContactCard>
              {embedded && <p className="line">{langCtx.getText('legal_contact_subtitle')}</p>}
              <div className="name">{langCtx.getText('shopName')}</div>
              <p className="line">{langCtx.getText('address')}</p>
              <p className="line">
                {langCtx.getText('legal_contact_phone_label')} {langCtx.getText('phoneLink')}
              </p>
            </ContactCard>
          );

          if (embedded) return content;

          return (
            <div>
              <PageHeader>
                <h1>📞 {langCtx.getText('legal_contact_title')}</h1>
                <p>{langCtx.getText('legal_contact_subtitle')}</p>
              </PageHeader>

              {content}
            </div>
          );
        }}
      </LanguageContext.Consumer>
    );
  }
}

export default ContactPage;
