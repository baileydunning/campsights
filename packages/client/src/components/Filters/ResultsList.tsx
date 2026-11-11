import React from "react";
import { Link } from "react-router";
import { bearing, metersToFeet, type FilteredCampsite, type Origin } from "../../filters";

const MAX_ITEMS = 30;

interface ResultsListProps {
  results: FilteredCampsite[];
  origin: Origin;
}

// Closest matching campsites to the chosen place, nearest first.
const ResultsList: React.FC<ResultsListProps> = ({ results, origin }) => {
  if (results.length === 0) return null;
  const shown = results.slice(0, MAX_ITEMS);
  return (
    <div className="results-list">
      <ol>
        {shown.map(({ site, distance }) => (
          <li key={site.id}>
            <Link to={`/campsites/${encodeURIComponent(site.id)}`} className="results-list__item">
              <span className="results-list__name">{site.name}</span>
              <span className="results-list__meta">
                {distance != null &&
                  `${distance < 10 ? distance.toFixed(1) : Math.round(distance)} mi ${bearing(origin.lat, origin.lng, site.lat, site.lng)}`}
                {site.state && ` · ${site.state}`}
                {site.elevation != null && ` · ${metersToFeet(site.elevation).toLocaleString()} ft`}
              </span>
            </Link>
          </li>
        ))}
      </ol>
      {results.length > MAX_ITEMS && (
        <p className="results-list__more">
          Showing the closest {MAX_ITEMS}. All {results.length.toLocaleString()} are on the map.
        </p>
      )}
    </div>
  );
};

export default ResultsList;
