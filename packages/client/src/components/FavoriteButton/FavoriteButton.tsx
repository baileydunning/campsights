import React from "react";
import { useFavorites } from "../../favorites";
import "./FavoriteButton.css";

interface FavoriteButtonProps {
  id: string;
  name?: string;
  // "icon": round star button (popups, lists). "button": labeled button (campsite page).
  variant?: "icon" | "button";
  className?: string;
}

export const StarIcon: React.FC<{ filled?: boolean; size?: number }> = ({ filled = false, size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="M12 3.2l2.6 5.5 6 .8-4.4 4.1 1.1 5.9L12 16.6l-5.3 2.9 1.1-5.9-4.4-4.1 6-.8z"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinejoin="round"
    />
  </svg>
);

const FavoriteButton: React.FC<FavoriteButtonProps> = ({ id, name, variant = "icon", className = "" }) => {
  const { isFavorite, toggle } = useFavorites();
  const saved = isFavorite(id);
  const label = saved ? `Remove ${name || "campsite"} from favorites` : `Save ${name || "campsite"} to favorites`;

  return (
    <button
      type="button"
      className={`fav-button fav-button--${variant}${saved ? " is-saved" : ""} ${className}`.trim()}
      aria-pressed={saved}
      aria-label={label}
      title={saved ? "Remove from favorites" : "Save to favorites"}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(id);
      }}
    >
      <StarIcon filled={saved} size={variant === "button" ? 18 : 20} />
      {variant === "button" && <span>{saved ? "Saved" : "Save"}</span>}
    </button>
  );
};

export default FavoriteButton;
