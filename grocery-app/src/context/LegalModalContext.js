import React from 'react';
import { ModalOverlay, ModalContent } from '../styledComponents/FormStyles';
import TermsConditionsPage from '../pages/TermsConditionsPage';
import PrivacyPolicyPage from '../pages/PrivacyPolicyPage';
import ContactPage from '../pages/ContactPage';
import LanguageContext from './LanguageContext';

const LegalModalContext = React.createContext({
  openLegalModal: () => {},
  closeLegalModal: () => {},
});

export class LegalModalProvider extends React.Component {
  static contextType = LanguageContext;

  constructor(props) {
    super(props);
    this.state = {
      type: null,
    };
  }

  componentDidMount() {
    // No-op: modal sizing is handled by the shared responsive shell.
  };

  openLegalModal = (type) => {
    if (!type) return;

    this.setState({ type });
  };

  closeLegalModal = () => {
    this.setState({ type: null });
  };

  renderModal() {
    const { type } = this.state;
    if (!type) return null;

    const langCtx = this.context;

    const title =
      type === 'terms'
        ? `📜 ${langCtx ? langCtx.getText('legal_modal_terms') : 'Terms & Conditions'}`
        : type === 'privacy'
          ? `🔒 ${langCtx ? langCtx.getText('legal_modal_privacy') : 'Privacy Policy'}`
          : `📞 ${langCtx ? langCtx.getText('legal_modal_contact') : 'Contact Us'}`;

    return (
      <ModalOverlay onClick={this.closeLegalModal}>
        <ModalContent
          style={{
            maxWidth: '1100px',
            width: 'min(80vw, 1100px)',
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-header">
            <h3>{title}</h3>
            <button className="close-btn" onClick={this.closeLegalModal} aria-label="Close">
              ✕
            </button>
          </div>
          <div className="modal-body" style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
            {type === 'terms' ? (
              <TermsConditionsPage embedded />
            ) : type === 'privacy' ? (
              <PrivacyPolicyPage embedded />
            ) : (
              <ContactPage embedded />
            )}
          </div>
        </ModalContent>
      </ModalOverlay>
    );
  }

  renderHiddenMeasurer() {
    return null;
  }

  render() {
    return (
      <LegalModalContext.Provider
        value={{
          openLegalModal: this.openLegalModal,
          closeLegalModal: this.closeLegalModal,
        }}
      >
        {this.props.children}
        {this.renderHiddenMeasurer()}
        {this.renderModal()}
      </LegalModalContext.Provider>
    );
  }
}

export default LegalModalContext;
