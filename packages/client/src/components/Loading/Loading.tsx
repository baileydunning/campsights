import React from 'react';
import './Loading.css';

const Loading: React.FC = () => {
  return (
    <div className="loading-screen" role="status" aria-live="polite">
      <div className="loading-spinner" aria-hidden="true" />
      <span className="loading-sr">Loading</span>
    </div>
  );
};

export default React.memo(Loading);
