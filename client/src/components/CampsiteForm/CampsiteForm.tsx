import React, { useState, FormEvent, ChangeEvent, KeyboardEvent } from "react";
import { CampsitePayload } from "../../types/Campsite"
import "./CampsiteForm.css";

interface CampsiteFormProps {
  onSuccess: () => void;
}

const CampsiteForm: React.FC<CampsiteFormProps> = ({ onSuccess }) => {
  const [rating, setRating] = useState<number>(0);
  const [name, setName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [useCurrentLocation, setUseCurrentLocation] = useState<boolean>(true);
  const [requires4WD, setRequires4WD] = useState<boolean>(false);
  const [latitude, setLatitude] = useState<string>("");
  const [longitude, setLongitude] = useState<string>("");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    let lat = latitude;
    let lng = longitude;

    if (useCurrentLocation) {
      if (!navigator.geolocation) return alert("Geolocation not supported.");

      navigator.geolocation.getCurrentPosition(async (pos) => {
        lat = pos.coords.latitude.toString();
        lng = pos.coords.longitude.toString();

        const payload: CampsitePayload = {
          id: crypto.randomUUID(),
          name: name.trim() || "Unnamed Site",
          description: description.trim(),
          lat: parseFloat(lat),
          lng: parseFloat(lng),
          rating,
          requires_4wd: requires4WD,
          last_updated: new Date().toISOString(),
        };

        await fetch(`http://localhost:3000/api/v1/campsites`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        console.log("Campsite submitted:", payload);
        onSuccess();
      });
    } else {
      if (!lat || !lng)
        return alert("Please provide valid latitude and longitude.");

      const payload: CampsitePayload = {
        id: crypto.randomUUID(),
        name: name.trim() || "Unnamed Site",
        description: description.trim(),
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        rating,
        requires_4wd: requires4WD,
        last_updated: new Date().toISOString(),
      };

      await fetch(`http://localhost:3000/api/v1/campsites`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }
  };

  const handleStarClick = (starIndex: number) => {
    setRating(starIndex + 1);
  };

  return (
    <form className="campsite-form" onSubmit={handleSubmit}>
      <h2 className="form-title">Add a Campsite</h2>
      <div className="form-group">
        <label htmlFor="name">Name</label>
        <input
          id="name"
          className="form-input"
          value={name}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setName(e.target.value)
          }
          placeholder="Campsite Name"
        />
      </div>
      <div className="form-group">
        <label htmlFor="description">Description</label>
        <input
          id="description"
          className="form-input"
          value={description}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setDescription(e.target.value)
          }
          placeholder="Describe your campsite"
        />
      </div>
      <div className="form-group">
        <label htmlFor="rating">Campsite Rating</label>
        <div id="rating" className="star-rating" aria-labelledby="rating-label">
          {[...Array(5)].map((_, index) => (
            <span
              key={index}
              className={`star${index < rating ? " filled" : ""}`}
              onClick={() => handleStarClick(index)}
              tabIndex={0}
              role="button"
              aria-label={`Rate ${index + 1} star${index === 0 ? "" : "s"}`}
              onKeyDown={(e: KeyboardEvent<HTMLSpanElement>) => {
                if (e.key === "Enter" || e.key === " ") handleStarClick(index);
              }}
            >
              ★
            </span>
          ))}
        </div>
      </div>
      <div className="form-group">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={requires4WD}
            onChange={() => setRequires4WD((prev) => !prev)}
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
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setLatitude(e.target.value)
              }
              placeholder="Enter Latitude"
            />
          </div>
          <div className="form-group">
            <label htmlFor="longitude">Longitude</label>
            <input
              id="longitude"
              className="form-input"
              type="number"
              value={longitude}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setLongitude(e.target.value)
              }
              placeholder="Enter Longitude"
            />
          </div>
        </div>
      )}
      <button className="submit-btn" type="submit">
        Submit My Campsite
      </button>
    </form>
  );
};

export default CampsiteForm;
