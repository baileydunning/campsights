import React, { useState } from "react";
import { Campsite } from "../../types/Campsite";
import { useAppDispatch, useAppSelector } from "../../store/store";
import { putCampsite, deleteCampsite } from "../../store/campsiteSlice";
import "./EditCampsiteForm.css";

interface EditCampsiteFormProps {
  site: Campsite;
  onCancel: () => void;
}

const EditCampsiteForm: React.FC<EditCampsiteFormProps> = ({ site, onCancel }) => {
  const dispatch = useAppDispatch();
  const globalError = useAppSelector(state => state.campsites.error);

  const [formData, setFormData] = useState<Omit<Campsite, "id">>({
    name: site.name,
    description: site.description,
    lat: site.lat,
    lng: site.lng,
    requires_4wd: site.requires_4wd,
    weather: site.weather, 
    last_updated: site.last_updated,
  });
  const [loading, setLoading] = useState({ save: false, del: false });
  const [error, setError] = useState({ save: null as string | null, del: null as string | null });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? (e.target as HTMLInputElement).checked
          : name === "lat" || name === "lng"
          ? Number(value)
          : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(l => ({ ...l, save: true }));
    setError(e => ({ ...e, save: null }));
    try {
      const result = await dispatch(
        putCampsite({
          id: site.id,
          data: { ...formData, last_updated: new Date().toISOString() },
        })
      );
      if (putCampsite.fulfilled.match(result)) {
        onCancel();
      } else {
        setError(e => ({
          ...e,
          save: (result.payload as string) || "Failed to update campsite",
        }));
      }
    } catch (err: any) {
      setError(e => ({ ...e, save: err.message || "Failed to update campsite" }));
    } finally {
      setLoading(l => ({ ...l, save: false }));
    }
  };

  const handleDelete = async () => {
    setLoading(l => ({ ...l, del: true }));
    setError(e => ({ ...e, del: null }));
    try {
      const result = await dispatch(deleteCampsite(site.id));
      if (!deleteCampsite.fulfilled.match(result)) {
        setError(e => ({
          ...e,
          del: (result.payload as string) || "Failed to delete campsite",
        }));
      }
    } catch (err: any) {
      setError(e => ({ ...e, del: err.message || "Failed to delete campsite" }));
    } finally {
      setLoading(l => ({ ...l, del: false }));
    }
  };

  return (
    <form className="edit-campsite-form" onSubmit={handleSubmit}>
      <input
        name="name"
        value={formData.name}
        onChange={handleChange}
        placeholder="Name"
        className="edit-input"
        required
      />
      <textarea
        name="description"
        value={formData.description}
        onChange={handleChange}
        placeholder="Description"
        className="edit-input"
        rows={2}
        required
      />
      <div className="edit-coords-row">
        <input
          name="lat"
          type="number"
          value={formData.lat}
          onChange={handleChange}
          placeholder="Lat"
          className="edit-input"
          required
        />
        <input
          name="lng"
          type="number"
          value={formData.lng}
          onChange={handleChange}
          placeholder="Lng"
          className="edit-input"
          required
        />
      </div>
      <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13 }}>
        <input
          name="requires_4wd"
          type="checkbox"
          checked={formData.requires_4wd}
          onChange={handleChange}
        />
        4WD
      </label>

      {(error.save || globalError) && (
        <div className="weather-error" style={{ marginTop: 4 }}>
          {error.save || globalError}
        </div>
      )}

      <div style={{ display: "flex", gap: 8, marginTop: 8, justifyContent: "center" }}>
        <button
          type="submit"
          className="popup-button"
          disabled={loading.save}
        >
          {loading.save ? "Saving..." : "Save"}
        </button>
        <button
          type="button"
          className="popup-button"
          onClick={onCancel}
          disabled={loading.save || loading.del}
        >
          Cancel
        </button>
        <button
          type="button"
          className="popup-button"
          style={{ background: "#16563A", color: "#fff" }}
          onClick={handleDelete}
          disabled={loading.del}
        >
          {loading.del ? "Deleting..." : "Delete"}
        </button>
      </div>

      {error.del && (
        <div className="weather-error" style={{ marginTop: 4 }}>
          {error.del}
        </div>
      )}
    </form>
  );
};

export default EditCampsiteForm;
