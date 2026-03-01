import React from 'react';
import { SidebarItem } from '../../styledComponents/SidebarStyles';
import LanguageContext from '../../context/LanguageContext';

class CategoryGrains extends React.Component {
    static contextType = LanguageContext;

    render() {
        const { active, onClick } = this.props;
        const { getText } = this.context;
        return (
            <SidebarItem $active={active} onClick={() => onClick('grains')}>
                <span className="item-icon">🌾</span>
                <span className="item-label">{getText('grains')}</span>
            </SidebarItem>
        );
    }
}

class CategoryMilk extends React.Component {
    static contextType = LanguageContext;

    render() {
        const { active, onClick } = this.props;
        const { getText } = this.context;
        return (
            <SidebarItem $active={active} onClick={() => onClick('milk')}>
                <span className="item-icon">🥛</span>
                <span className="item-label">{getText('milk')}</span>
            </SidebarItem>
        );
    }
}

class CategorySnacks extends React.Component {
    static contextType = LanguageContext;

    render() {
        const { active, onClick } = this.props;
        const { getText } = this.context;
        return (
            <SidebarItem $active={active} onClick={() => onClick('snacks')}>
                <span className="item-icon">🍿</span>
                <span className="item-label">{getText('snacks')}</span>
            </SidebarItem>
        );
    }
}

class CategorySpices extends React.Component {
    static contextType = LanguageContext;

    render() {
        const { active, onClick } = this.props;
        const { getText } = this.context;
        return (
            <SidebarItem $active={active} onClick={() => onClick('spices')}>
                <span className="item-icon">🌶️</span>
                <span className="item-label">{getText('spices')}</span>
            </SidebarItem>
        );
    }
}

class CategoryOils extends React.Component {
    static contextType = LanguageContext;

    render() {
        const { active, onClick } = this.props;
        const { getText } = this.context;
        return (
            <SidebarItem $active={active} onClick={() => onClick('oils')}>
                <span className="item-icon">🫗</span>
                <span className="item-label">{getText('oils')}</span>
            </SidebarItem>
        );
    }
}

class CategoryCondiments extends React.Component {
    static contextType = LanguageContext;

    render() {
        const { active, onClick } = this.props;
        const { getText } = this.context;
        return (
            <SidebarItem $active={active} onClick={() => onClick('condiments')}>
                <span className="item-icon">🍅</span>
                <span className="item-label">{getText('condiments')}</span>
            </SidebarItem>
        );
    }
}

class CategoryCleaning extends React.Component {
    static contextType = LanguageContext;

    render() {
        const { active, onClick } = this.props;
        const { getText } = this.context;
        return (
            <SidebarItem $active={active} onClick={() => onClick('cleaning')}>
                <span className="item-icon">🧹</span>
                <span className="item-label">{getText('cleaning')}</span>
            </SidebarItem>
        );
    }
}

class CategoryPersonalCare extends React.Component {
    static contextType = LanguageContext;

    render() {
        const { active, onClick } = this.props;
        const { getText } = this.context;
        return (
            <SidebarItem $active={active} onClick={() => onClick('personal')}>
                <span className="item-icon">🧴</span>
                <span className="item-label">{getText('personal')}</span>
            </SidebarItem>
        );
    }
}

export {
    CategoryGrains,
    CategoryMilk,
    CategorySnacks,
    CategorySpices,
    CategoryOils,
    CategoryCondiments,
    CategoryCleaning,
    CategoryPersonalCare,
};
