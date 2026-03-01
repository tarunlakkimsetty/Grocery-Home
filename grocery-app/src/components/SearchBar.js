import React from 'react';
import styled from 'styled-components';
import LanguageContext from '../context/LanguageContext';

const SearchWrapper = styled.div`
    width: 100%;
    max-width: 500px;
    margin: 1rem auto;
    padding: 0 1rem;

    @media (max-width: 768px) {
        max-width: 100%;
        padding: 0 0.5rem;
    }
`;

const SearchInput = styled.input`
    width: 100%;
    padding: 0.75rem 1rem;
    border: 2px solid #e9ecef;
    border-radius: 8px;
    font-size: 0.95rem;
    font-family: 'Inter', sans-serif;
    transition: all 0.3s ease;

    &:focus {
        outline: none;
        border-color: #2E7D32;
        box-shadow: 0 0 0 3px rgba(46, 125, 50, 0.1);
    }

    &::placeholder {
        color: #adb5bd;
    }

    @media (max-width: 768px) {
        padding: 0.6rem 0.8rem;
        font-size: 0.9rem;
    }
`;

class SearchBar extends React.Component {
    static contextType = LanguageContext;

    constructor(props) {
        super(props);
        this.state = {
            searchQuery: '',
        };
    }

    handleSearchChange = (e) => {
        const searchQuery = e.target.value;
        this.setState({ searchQuery });

        // Call parent callback with search query
        if (this.props.onSearch) {
            this.props.onSearch(searchQuery.toLowerCase());
        }
    };

    clearSearch = () => {
        this.setState({ searchQuery: '' });
        if (this.props.onSearch) {
            this.props.onSearch('');
        }
    };

    render() {
        const { getText } = this.context;
        const placeholder = this.props.placeholder || getText('search');

        return (
            <SearchWrapper>
                <SearchInput
                    type="text"
                    placeholder={placeholder}
                    value={this.state.searchQuery}
                    onChange={this.handleSearchChange}
                    aria-label="Search products"
                />
            </SearchWrapper>
        );
    }
}

export default SearchBar;
