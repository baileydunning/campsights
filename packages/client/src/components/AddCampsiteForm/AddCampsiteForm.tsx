import React, { useState, FormEvent, ChangeEvent } from "react";
import { useDispatch, useSelector } from 'react-redux';
import { Campsite } from "../../types/Campsite";
import { postCampsite, selectLoading, selectError } from "../../store/campsiteSlice";
import type { AppDispatch } from "../../store/store";
import "./AddCampsiteForm.css";

interface AddCampsiteFormProps {
  onSuccess: () => void;
}

const AddCampsiteForm: React.FC<AddCampsiteFormProps> = ({ onSuccess }) => {
  const dispatch = useDispatch<AppDispatch>();
  const loading = useSelector(selectLoading);
  const error = useSelector(selectError);
  
  const [name, setName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [useCurrentLocation, setUseCurrentLocation] = useState<boolean>(true);
  const [requires4WD, setRequires4WD] = useState<boolean>(false);
  const [latitude, setLatitude] = useState<string>("");
  const [longitude, setLongitude] = useState<string>("");

  const getCurrentPosition = () =>
    new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject);
    });

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    let lat = latitude;
    let lng = longitude;

    if (useCurrentLocation) {
      if (!navigator.geolocation) return alert("Geolocation not supported.");
      try {
        const pos = await getCurrentPosition();
        lat = pos.coords.latitude.toString();
        lng = pos.coords.longitude.toString();
      } catch {
        return alert("Unable to get current location.");
      }
    } else {
      if (!lat || !lng)
        return alert("Please provide valid latitude and longitude.");
    }

    const newCampsite: Campsite = {
      id: crypto.randomUUID(),
      name: name.trim() || "Unnamed Site",
      description: description.trim(),
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      requires_4wd: !!requires4WD,
      last_updated: new Date().toISOString(),
    };

    try {
      await dispatch(postCampsite(newCampsite)).unwrap();
      onSuccess();
    } catch (error) {
      console.error("Error submitting campsite:", error);
      alert("Failed to submit campsite. Please try again.");
    }
  };

  return (
    <form className="campsite-form" onSubmit={handleSubmit}>
      <h2 className="form-title">Add a Campsite</h2>
      
      {error && (
        <div style={{ color: 'red', marginBottom: '1rem' }}>
          Error: {error}
        </div>
      )}

      <div className="form-group">
        <label htmlFor="name">Name</label>
        <input
          id="name"
          className="form-input"
          value={name}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
          placeholder="Campsite Name"
          disabled={loading}
        />
      </div>

      <div className="form-group">
        <label htmlFor="description">Description</label>
        <input
          id="description"
          className="form-input"
          value={description}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setDescription(e.target.value)}
          placeholder="Describe your campsite"
          disabled={loading}
        />
      </div>

      <div className="form-group">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={requires4WD}
            onChange={() => setRequires4WD((prev) => !prev)}
            disabled={loading}
          />
          Requires 4WD to Access
        </label>
      </div>

      <div className="form-group">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={useCurrentLocation}
            onChange={() => setUseCurrentLocation((prev) => !prev)}
            disabled={loading}
          />
          Use current location
        </label>
      </div>

      {!useCurrentLocation && (
        <div className="form-coords">
          <div className="form-group">
            <label htmlFor="latitude">Latitude</label>
            <input
              id="latitude"
              className="form-input"
              type="number"
              value={latitude}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setLatitude(e.target.value)}
              placeholder="Enter Latitude"
              disabled={loading}
            />
          </div>
          <div className="form-group">
            <label htmlFor="longitude">Longitude</label>
            <input
              id="longitude"
              className="form-input"
              type="number"
              value={longitude}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setLongitude(e.target.value)}
              placeholder="Enter Longitude"
              disabled={loading}
            />
          </div>
        </div>
      )}

      <button 
        className="submit-btn" 
        type="submit"
        disabled={loading}
      >
        {loading ? 'Submitting...' : 'Submit My Campsite'}
      </button>
    </form>
  );
};

export default React.memo(AddCampsiteForm);
