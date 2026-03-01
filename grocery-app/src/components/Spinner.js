import React from 'react';
import { SpinnerWrapper } from '../styledComponents/FormStyles';

class Spinner extends React.Component {
    render() {
        const { fullPage, text } = this.props;
        return (
            <SpinnerWrapper $fullPage={fullPage}>
                <div className="text-center">
                    <div className="spinner-border" role="status" style={{ width: '2.5rem', height: '2.5rem' }}>
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    {text && <p className="mt-2 text-muted" style={{ fontSize: '0.9rem' }}>{text}</p>}
                </div>
            </SpinnerWrapper>
        );
    }
}

export default Spinner;
