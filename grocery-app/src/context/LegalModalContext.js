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
    this.legalModalMeasureRef = React.createRef();
    this.lastLanguage = null;

    this.state = {
      type: null,
      pendingType: null,
      heightPx: null,
      measureWidthPx: null,
    };
  }

  componentDidMount() {
    this.lastLanguage = this.context?.currentLanguage;
    this.computeSizingIfNeeded();
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', this.handleResize);
    }
  }

  componentDidUpdate() {
    const currentLanguage = this.context?.currentLanguage;
    if (!currentLanguage || currentLanguage === this.lastLanguage) return;

    this.lastLanguage = currentLanguage;

    // Re-measure the Terms modal height when language changes so the fixed size
    // remains consistent with the Terms popup for the selected language.
    this.setState(
      (prev) => ({
        heightPx: null,
        type: null,
        pendingType: prev.type || prev.pendingType,
      }),
      () => {
        this.computeSizingIfNeeded();
      }
    );
  }

  componentWillUnmount() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', this.handleResize);
    }
  }

  handleResize = () => {
    // Re-measure the Terms modal height on resize so the fixed modal size
    // remains consistent with the Terms popup for the new viewport.
    this.setState({ heightPx: null }, () => {
      this.computeSizingIfNeeded();
    });
  };

  getMeasuredWidthPx = () => {
    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 820;
    // ModalOverlay padding is 1rem on each side.
    return Math.max(320, Math.min(820, viewportWidth - 32));
  };

  computeSizingIfNeeded = () => {
    if (this.state.heightPx) return;

    const measureWidthPx = this.getMeasuredWidthPx();

    this.setState({ measureWidthPx }, () => {
      if (typeof window === 'undefined') return;

      window.requestAnimationFrame(() => {
        const el = this.legalModalMeasureRef?.current;
        if (!el) return;

        const height = Math.ceil(el.getBoundingClientRect().height);
        if (!height || height <= 0) return;

        this.setState((prev) => {
          const next = { heightPx: height };
          if (prev.pendingType) {
            next.type = prev.pendingType;
            next.pendingType = null;
          }
          return next;
        });
      });
    });
  };

  openLegalModal = (type) => {
    if (!type) return;

    // Ensure the modal opens at the exact Terms popup height.
    if (!this.state.heightPx) {
      this.setState({ pendingType: type }, () => {
        this.computeSizingIfNeeded();
      });
      return;
    }

    this.setState({ type });
  };

  closeLegalModal = () => {
    this.setState({ type: null, pendingType: null });
  };

  renderModal() {
    const { type, heightPx } = this.state;
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
            maxWidth: '820px',
            width: '100%',
            height: heightPx ? `${heightPx}px` : undefined,
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
          <div className="modal-body" style={{ flex: 1, overflowY: 'auto' }}>
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
    if (this.state.heightPx) return null;

    const langCtx = this.context;

    return (
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          left: '-10000px',
          top: '-10000px',
          visibility: 'hidden',
          pointerEvents: 'none',
        }}
      >
        <ModalContent
          ref={this.legalModalMeasureRef}
          style={{
            maxWidth: '820px',
            width: `${this.state.measureWidthPx || 820}px`,
          }}
        >
          <div className="modal-header">
            <h3>
              📜 {langCtx ? langCtx.getText('legal_modal_terms') : 'Terms & Conditions'}
            </h3>
            <button className="close-btn" aria-label="Close">
              ✕
            </button>
          </div>
          <div className="modal-body">
            <TermsConditionsPage embedded />
          </div>
        </ModalContent>
      </div>
    );
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
