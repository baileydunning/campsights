import React, { useEffect, useState, useRef } from "react";
import { Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { Campsite } from "../../types/Campsite";
import { getWeatherForecast } from "../../api/Weather";
import { useAppDispatch, useAppSelector } from "../../store/store";
import { putCampsite, deleteCampsite } from "../../store/campsiteSlice";
import "./CampsiteMarker.css";

export interface CampsiteMarkerProps {
  site: Campsite;
}

function isValidCoordinate(lat: number, lng: number) {
  return (
    typeof lat === "number" && typeof lng === "number" &&
    !isNaN(lat) && !isNaN(lng) &&
    lat >= -90 && lat <= 90 &&
    lng >= -180 && lng <= 180 &&
    !(lat === 0 && lng === 0)
  );
}

const CampsiteMarker: React.FC<CampsiteMarkerProps> = ({ site }) => {
  const [weatherData, setWeatherData] = useState<any>(null);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<Omit<Campsite, 'id'>>({
    name: site.name,
    description: site.description,
    lat: site.lat,
    lng: site.lng,
    requires_4wd: site.requires_4wd,
    last_updated: site.last_updated,
  });
  const [editError, setEditError] = useState<string | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editSuccess, setEditSuccess] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const popupRef = useRef<any>(null);
  const dispatch = useAppDispatch();
  const campsiteError = useAppSelector(state => state.campsites.error);

  const tentIcon = new L.DivIcon({
    html: `<div style="display: flex; align-items: flex-end; justify-content: center; height: 50px; width: 50px;">
      <svg xmlns="http://www.w3.org/2000/svg"
     width="32" height="32" viewBox="0 0 32 32"
     aria-label="Campsite Tent Marker">
      <polygon points="6,26 16,6 16,26"
          fill="#2E8B57"/>
      <polygon points="16,6 26,26 16,26"
          fill="#226E52"/>
      <polygon points="14,26 14,14 18,14 18,26"
          fill="#16563A"/>
      </svg>
    </div>`,
    className: 'campsite-tent-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 28],
  });

  // Fetch weather data for the campsite based on its coordinates
  useEffect(() => {
    if (!isValidCoordinate(site.lat, site.lng)) {
      setWeatherError("Invalid coordinates");
      setWeatherData(null);
      return;
    }
    const fetchWeather = async () => {
      setWeatherLoading(true);
      setWeatherError(null);
      try {
        const periods = await getWeatherForecast(site);
        setWeatherData(periods);
      } catch (error) {
        setWeatherError("Error fetching weather data");
        setWeatherData(null);
        console.error("Error fetching weather data:", error);
      } finally {
        setWeatherLoading(false);
      }
    };

    fetchWeather();
  }, [site.lat, site.lng]);

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setEditForm((prev) => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked,
      }));
    } else {
      setEditForm((prev) => ({
        ...prev,
        [name]: name === 'lat' || name === 'lng' ? Number(value) : value,
      }));
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditLoading(true);
    setEditError(null);
    setEditSuccess(false);
    try {
      // Dispatch Redux thunk instead of direct API call
      const resultAction = await dispatch(putCampsite({
        id: site.id, data: {
          ...editForm,
          last_updated: new Date().toISOString(),
        }
      }));
      if (putCampsite.fulfilled.match(resultAction)) {
        setEditSuccess(true);
        setEditing(false);
      } else {
        setEditError(resultAction.payload as string || 'Failed to update campsite');
      }
    } catch (err: any) {
      setEditError(err.message || 'Failed to update campsite');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      const resultAction = await dispatch(deleteCampsite(site.id));
      if (deleteCampsite.fulfilled.match(resultAction)) {
        // Optionally close popup or show success
      } else {
        setDeleteError(resultAction.payload as string || 'Failed to delete campsite');
      }
    } catch (err: any) {
      setDeleteError(err.message || 'Failed to delete campsite');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handlePopupClose = () => {
    setEditing(false);
  };

  return (
    <Marker
      key={site.id}
      position={[site.lat, site.lng] as [number, number]}
      icon={tentIcon}
    >
      <Popup
        data-testid="popup"
        ref={popupRef}
        autoClose={false}
        closeOnClick={false}
        eventHandlers={{
          popupclose: handlePopupClose,
        }}
      >
        <div>
          {!editing ? (
            <>
              <strong>{site.name ? site.name : "Unnamed Site"}</strong>
              <div>{site.description}</div>
              <div><strong>Elevation:</strong> {site.elevation != null && !isNaN(Number(site.elevation))
    ? `${site.elevation} meters (${(site.elevation * 3.28084).toFixed(0)} ft)`
    : "Unknown"}</div>
              <div>
                <span><strong>Requires 4WD:</strong></span> {site.requires_4wd ? "Yes" : "No"}
              </div>
              <div className="weather-section">
                <strong>Weather Forecast:</strong>
                {weatherLoading && <div className="weather-loading">Loading weather...</div>}
                {weatherError && <div className="weather-error">{weatherError}</div>}
                {weatherData && weatherData.length > 0 && (
                  <div className="weather-forecast-list">
                    {weatherData.map((period: any) => (
                      <div key={period.number} className="weather-period-card">
                        <div className="weather-period-header">
                          {period.name} ({period.isDaytime ? 'Day' : 'Night'})
                        </div>
                        <div className="weather-period-details">
                          <span className="weather-temp"><strong>Temperature:</strong> {period.temperature}°{period.temperatureUnit}</span>
                          <span className="weather-wind"><strong>Wind:</strong> {period.windSpeed} {period.windDirection}</span>
                          <span className="weather-short"><strong>Forecast:</strong> {period.detailedForecast}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="directions-btn-container" style={{ gap: 8 }}>
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${site.lat},${site.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="popup-button"
                  role="button"
                >
                  Get Directions
                </a>
                <button
                  className="popup-button"
                  onClick={e => {
                    e.preventDefault();
                    e.stopPropagation();
                    setEditing(true);
                  }}
                  type="button"
                >
                  Edit Campsite
                </button>
              </div>
              {editSuccess && <div style={{ color: '#92C689', marginTop: 6, textAlign: 'center' }}>Campsite updated!</div>}
              {campsiteError && <div className="weather-error" style={{ marginTop: 2 }}>{campsiteError}</div>}
            </>
          ) : (
            <form className="edit-campsite-form" onSubmit={handleEditSubmit}>
              <input
                name="name"
                value={editForm.name}
                onChange={handleEditChange}
                placeholder="Name"
                className="edit-input"
                required
              />
              <textarea
                name="description"
                value={editForm.description}
                onChange={handleEditChange}
                placeholder="Description"
                className="edit-input"
                rows={2}
                required
              />
              <div className="edit-coords-row">
                <input
                  name="lat"
                  type="number"
                  value={editForm.lat}
                  onChange={handleEditChange}
                  placeholder="Lat"
                  className="edit-input"
                  required
                />
                <input
                  name="lng"
                  type="number"
                  value={editForm.lng}
                  onChange={handleEditChange}
                  placeholder="Lng"
                  className="edit-input"
                  required
                />
              </div>
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, margin: 0 }}>
                  <input
                    name="requires_4wd"
                    type="checkbox"
                    checked={editForm.requires_4wd}
                    onChange={handleEditChange}
                  />
                  4WD
                </label>
              </div>
              {/* Show local or Redux error */}
              {(editError || campsiteError) && <div className="weather-error" style={{ marginTop: 2 }}>{editError || campsiteError}</div>}
              <div style={{ display: 'flex', gap: 8, marginTop: 4, justifyContent: 'center' }}>
                <button
                  type="submit"
                  className="popup-button"
                  disabled={editLoading}
                >
                  {editLoading ? 'Saving...' : 'Save'}
                </button>
                <button
                  type="button"
                  className="popup-button"
                  onClick={e => {
                    e.preventDefault();
                    e.stopPropagation();
                    setEditing(false);
                    setEditForm({
                      name: site.name,
                      description: site.description,
                      lat: site.lat,
                      lng: site.lng,
                      requires_4wd: site.requires_4wd,
                      last_updated: site.last_updated,
                    });
                  }}
                  disabled={editLoading}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="popup-button"
                  style={{ background: '#16563A', color: '#fff' }}
                  onClick={handleDelete}
                  disabled={deleteLoading}
                >
                  {deleteLoading ? 'Deleting...' : 'Delete Campsite'}
                </button>
              </div>
              {deleteError && <div className="weather-error" style={{ marginTop: 2 }}>{deleteError}</div>}
            </form>
          )}
        </div>
      </Popup>
    </Marker>
  );
};

export default CampsiteMarker;
