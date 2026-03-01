import React from 'react';
import { translations } from '../translations/translations';

const LanguageContext = React.createContext({
    currentLanguage: 'en',
    toggleLanguage: () => { },
    getText: (key) => key,
});

class LanguageProvider extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            currentLanguage: localStorage.getItem('appLanguage') || 'en',
        };
        this.toggleLanguage = this.toggleLanguage.bind(this);
        this.getText = this.getText.bind(this);
    }

    toggleLanguage = () => {
        const newLanguage = this.state.currentLanguage === 'en' ? 'te' : 'en';
        this.setState({ currentLanguage: newLanguage });
        localStorage.setItem('appLanguage', newLanguage);
    };

    getText = (key) => {
        const { currentLanguage } = this.state;
        const translationObj = translations[currentLanguage];
        return translationObj && translationObj[key] ? translationObj[key] : key;
    };

    render() {
        const value = {
            currentLanguage: this.state.currentLanguage,
            toggleLanguage: this.toggleLanguage,
            getText: this.getText,
            translations: translations[this.state.currentLanguage],
        };

        return (
            <LanguageContext.Provider value={value}>
                {this.props.children}
            </LanguageContext.Provider>
        );
    }
}

export { LanguageContext, LanguageProvider };
export default LanguageContext;
