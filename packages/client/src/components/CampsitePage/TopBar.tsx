import React from "react";
import { Link } from "react-router";

interface TopBarProps {
  onBack: () => void;
  onShare?: () => void;
  shareLabel?: string;
}

const BackIcon = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
);
const ShareIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" /></svg>
);

// Sticky bar used by the campsite and favorites pages (styles in CampsitePage.css).
const TopBar: React.FC<TopBarProps> = ({ onBack, onShare, shareLabel = "Share" }) => (
  <nav className="site-topbar">
    <button type="button" className="site-topbar__back" onClick={onBack} aria-label="Back to map">
      {BackIcon}
      <span>Map</span>
    </button>
    <Link to="/" className="site-topbar__brand">Campsights</Link>
    {onShare ? (
      <button type="button" className="site-topbar__share" onClick={onShare} aria-label={shareLabel}>
        {ShareIcon}
        <span>{shareLabel}</span>
      </button>
    ) : (
      <span aria-hidden="true" />
    )}
  </nav>
);

export default TopBar;
