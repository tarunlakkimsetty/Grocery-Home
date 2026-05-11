import styled from 'styled-components';

const BillActionButton = styled.button`
    border: none;
    border-radius: 6px;
    padding: 0.35rem 0.85rem;
    font-size: 0.82rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;

    &.btn-primary-soft {
        background: rgba(13, 110, 253, 0.1);
        color: #0a58ca;
        border: 1px solid rgba(13, 110, 253, 0.35);

        &:hover:not(:disabled) {
            background: rgba(13, 110, 253, 0.22);
        }
    }

    &.btn-view {
        background: #f8f9fa;
        color: #495057;
        border: 1px solid #dee2e6;

        &:hover {
            background: #e9ecef;
        }
    }

    &:disabled {
        opacity: 0.4;
        cursor: not-allowed;
        pointer-events: none;
        transform: none;
        box-shadow: none;
    }

    &:disabled:hover,
    &:disabled:active {
        opacity: 0.4;
        cursor: not-allowed;
        pointer-events: none;
        transform: none;
        box-shadow: none;
    }
`;

export default BillActionButton;