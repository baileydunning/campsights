import L from "leaflet";

// Shared by every marker so 2,000+ markers don't each build their own icon.
export const tentIcon = new L.DivIcon({
  html: `<div style="display: flex; align-items: flex-end; justify-content: center; height: 50px; width: 50px;">
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32" aria-label="Campsite Tent Marker">
      <polygon points="6,26 16,6 16,26" fill="#2E8B57"/>
      <polygon points="16,6 26,26 16,26" fill="#226E52"/>
      <polygon points="14,26 14,14 18,14 18,26" fill="#16563A"/>
    </svg>
  </div>`,
  className: "campsite-tent-marker",
  iconSize: [32, 32],
  iconAnchor: [16, 28],
});
