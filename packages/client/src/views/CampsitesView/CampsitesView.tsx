import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../store/store';
import { fetchCampsites } from '../../store/campsiteSlice';
import { Campsite } from '../../types/Campsite';
import './CampsitesView.css';

const CampsitesView: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { campsites, loading, error } = useSelector((state: RootState) => state.campsites);

  useEffect(() => {
    dispatch(fetchCampsites());
  }, [dispatch]);

  const formatElevation = (elevation: number | null | undefined) => {
    if (elevation === null || elevation === undefined) return 'Unknown';
    const feet = Math.round(elevation * 3.28084);
    return `${elevation}m (${feet}ft)`;
  };

  const formatLastUpdated = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const openDirections = (campsite: Campsite) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${campsite.lat},${campsite.lng}`;
    window.open(url, '_blank');
  };

  if (loading) {
    return (
      <div className="campsites-view">
        <div className="loading-state">Loading campsites...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="campsites-view">
        <div className="error-state">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="campsites-view">
      <div className="campsites-grid">
        {campsites.map((campsite) => (
          <div key={campsite.id} className="campsite-card">
            <div className="card-header">
              <h3 className="campsite-name">{campsite.name}</h3>
              {campsite.requires_4wd && (
                <span className="fourwd-badge">4WD Required</span>
              )}
            </div>
            
            <div className="campsite-description">
              <p>{campsite.description}</p>
            </div>
            <div className="campsite-details">
              <div className="detail-row">
                <span className="detail-label">Location:</span>
                <span className="detail-value">
                  {campsite.lat.toFixed(4)}, {campsite.lng.toFixed(4)}
                </span>
              </div>
              
              <div className="detail-row">
                <span className="detail-label">Elevation:</span>
                <span className="detail-value">{formatElevation(campsite.elevation)}</span>
              </div>
            </div>

            <div className="card-actions">
              <button 
                className="action-btn directions-btn"
                onClick={() => openDirections(campsite)}
              >
                Get Directions
              </button>
            </div>
          </div>
        ))}
      </div>
      
      {campsites.length === 0 && (
        <div className="empty-state">
          <p>No campsites found</p>
        </div>
      )}
    </div>
  );
};

export default CampsitesView;