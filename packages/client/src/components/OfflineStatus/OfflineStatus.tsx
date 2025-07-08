import React, { useState } from "react";
import "./OfflineStatus.css";

const OfflineStatus: React.FC = () => {
  return (
    <div
      className="offline-status"
      aria-label="Offline status"
      tabIndex={0}
    >
      <span className="offline-status__icon" role="img" aria-label="Offline">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 12C10.6274 5.37258 21.3726 5.37258 28 12" stroke="#16563A" strokeWidth="2.5" strokeLinecap="round"/>
          <path d="M8 16C12.4183 11.5817 19.5817 11.5817 24 16" stroke="#16563A" strokeWidth="2.5" strokeLinecap="round"/>
          <path d="M12 20C13.6569 18.3431 16.3431 18.3431 18 20" stroke="#16563A" strokeWidth="2.5" strokeLinecap="round"/>
          <circle cx="16" cy="25" r="2" fill="#16563A" />
          <line x1="6" y1="26" x2="26" y2="6" stroke="#16563A" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </span>
    </div>
  );
};

export default OfflineStatus;
