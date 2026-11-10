import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import { Link, useLocation, useNavigate } from "react-router";
import { selectCampsites, selectLoading } from "../../store/campsiteSlice";
import { useFavorites } from "../../favorites";
import FavoriteButton, { StarIcon } from "../FavoriteButton/FavoriteButton";
import TopBar from "../CampsitePage/TopBar";
import type { Campsite } from "../../types/Campsite";
import "../CampsitePage/CampsitePage.css";
import "./FavoritesPage.css";

const titleCase = (s: string) => s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

const FavoritesPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const goBack = () => (location.key !== "default" ? navigate(-1) : navigate("/"));
  const campsites = useSelector(selectCampsites);
  const loading = useSelector(selectLoading);
  const { ids } = useFavorites();

  useEffect(() => {
    document.title = "Favorites · Campsights";
    return () => {
      document.title = "Campsights";
    };
  }, []);

  const byId = new Map(campsites.map((c) => [c.id, c]));
  // Keep the saved order (newest first). Skip IDs no longer in the BLM data.
  const favorites = ids.map((id) => byId.get(id)).filter((c): c is Campsite => Boolean(c));
  const waitingForData = loading && campsites.length === 0 && ids.length > 0;

  return (
    <div className="site-page">
      <TopBar onBack={goBack} />
      <div className="site-page__content favorites">
        <header className="favorites__header">
          <h1>Favorites</h1>
          {favorites.length > 0 && (
            <p>
              {favorites.length} saved {favorites.length === 1 ? "campsite" : "campsites"}. Favorites are stored in this
              browser only.
            </p>
          )}
        </header>

        {waitingForData ? (
          <div className="site-page__empty">
            <div className="site-spinner" role="status" aria-label="Loading favorites" />
          </div>
        ) : favorites.length === 0 ? (
          <div className="favorites__empty">
            <span className="favorites__empty-icon"><StarIcon size={28} /></span>
            <h2>No favorites yet</h2>
            <p>Tap the star on a campsite to save it here.</p>
            <Link to="/" className="btn btn--primary">Browse the map</Link>
          </div>
        ) : (
          <ul className="favorites__list">
            {favorites.map((site) => {
              const photo = site.images?.[0];
              const activities = (site.activities ?? []).slice(0, 3).map(titleCase);
              return (
                <li key={site.id} className="fav-card">
                  <Link to={`/campsites/${encodeURIComponent(site.id)}`} className="fav-card__link">
                    <div className="fav-card__thumb">
                      {photo ? (
                        <img src={photo.src} alt="" loading="lazy" />
                      ) : (
                        <svg width="28" height="28" viewBox="0 0 32 32" aria-hidden="true">
                          <polygon points="6,26 16,6 16,26" fill="#2E8B57" />
                          <polygon points="16,6 26,26 16,26" fill="#226E52" />
                          <polygon points="14,26 14,14 18,14 18,26" fill="#16563A" />
                        </svg>
                      )}
                    </div>
                    <div className="fav-card__body">
                      {site.state && <p className="fav-card__state">{site.state}</p>}
                      <h2 className="fav-card__name">{site.name || "Unnamed site"}</h2>
                      {activities.length > 0 && <p className="fav-card__meta">{activities.join(" · ")}</p>}
                    </div>
                  </Link>
                  <FavoriteButton id={site.id} name={site.name} className="fav-card__star" />
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

export default FavoritesPage;
