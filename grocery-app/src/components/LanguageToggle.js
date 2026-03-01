import React from 'react';
import LanguageContext from '../context/LanguageContext';
import styled from 'styled-components';

const ToggleWrapper = styled.div`
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: rgba(255, 255, 255, 0.1);
    padding: 0.5rem 0.75rem;
    border-radius: 50px;
    border: 1px solid rgba(255, 255, 255, 0.2);

    @media (max-width: 576px) {
        padding: 0.4rem 0.6rem;
        gap: 0.3rem;
    }
`;

const ToggleButton = styled.button`
    background: ${props => props.$active ? 'rgba(255, 255, 255, 0.14)' : 'transparent'};
    border: none;
    color: ${props => props.$active ? '#FFD700' : '#fff'};
    font-weight: ${props => props.$active ? '700' : '500'};
    font-size: 0.85rem;
    cursor: pointer;
    padding: 0.3rem 0.65rem;
    border-radius: 50px;
    transition: all 0.3s ease;

    &:hover {
        background: rgba(255, 255, 255, 0.1);
        color: #FFD700;
    }

    @media (max-width: 576px) {
        font-size: 0.75rem;
        padding: 0.2rem 0.4rem;
    }
`;

const Separator = styled.span`
    color: rgba(255, 255, 255, 0.3);
    font-size: 0.8rem;
`;

class LanguageToggle extends React.Component {
    static contextType = LanguageContext;

    render() {
        const { currentLanguage, toggleLanguage } = this.context;

        // Button labels based on current language
        const enLabel = currentLanguage === 'en' ? 'English' : 'English';
        const teLabel = currentLanguage === 'te' ? 'తెలుగు' : 'తెలుగు';

        return (
            <ToggleWrapper>
                <ToggleButton
                    $active={currentLanguage === 'en'}
                    onClick={toggleLanguage}
                    title="Switch to English"
                >
                    {enLabel}
                </ToggleButton>
                <Separator>/</Separator>
                <ToggleButton
                    $active={currentLanguage === 'te'}
                    onClick={toggleLanguage}
                    title="తెలుగుకు మార్చండి"
                >
                    {teLabel}
                </ToggleButton>
            </ToggleWrapper>
        );
    }
}

export default LanguageToggle;
