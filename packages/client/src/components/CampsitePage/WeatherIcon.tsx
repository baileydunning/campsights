import React from "react";
import type { WeatherKind } from "./weather";

const SUN = (
  <g>
    <circle cx="24" cy="24" r="8" fill="#F5B841" />
    <g stroke="#F5B841" strokeWidth="2.5" strokeLinecap="round">
      <line x1="24" y1="6" x2="24" y2="10" /><line x1="24" y1="38" x2="24" y2="42" />
      <line x1="6" y1="24" x2="10" y2="24" /><line x1="38" y1="24" x2="42" y2="24" />
      <line x1="11.3" y1="11.3" x2="14.1" y2="14.1" /><line x1="33.9" y1="33.9" x2="36.7" y2="36.7" />
      <line x1="11.3" y1="36.7" x2="14.1" y2="33.9" /><line x1="33.9" y1="14.1" x2="36.7" y2="11.3" />
    </g>
  </g>
);
const MOON = <path d="M30 10a14 14 0 1 0 8 25A12 12 0 0 1 30 10z" fill="#8FA3C7" />;
const CLOUD = (y = 0, fill = "#B9C2C9") => (
  <path transform={`translate(0 ${y})`} d="M15 36h19a7 7 0 0 0 0-14 10 10 0 0 0-19-2 8 8 0 0 0 0 16z" fill={fill} />
);

const WeatherIcon: React.FC<{ kind: WeatherKind; night?: boolean; size?: number }> = ({ kind, night = false, size = 44 }) => {
  let body: React.ReactNode;
  switch (kind) {
    case "clear":
      body = night ? MOON : SUN;
      break;
    case "partly":
      body = (
        <>
          <g transform="translate(-6 -6) scale(0.8)">{night ? MOON : SUN}</g>
          {CLOUD(4, "#C9D1D7")}
        </>
      );
      break;
    case "cloudy":
      body = CLOUD(-2);
      break;
    case "rain":
      body = (
        <>
          {CLOUD(-6)}
          <g stroke="#4A90C2" strokeWidth="2.5" strokeLinecap="round">
            <line x1="17" y1="35" x2="15" y2="41" /><line x1="25" y1="35" x2="23" y2="41" /><line x1="33" y1="35" x2="31" y2="41" />
          </g>
        </>
      );
      break;
    case "storm":
      body = (
        <>
          {CLOUD(-6, "#9AA5AE")}
          <path d="M25 30l-5 8h5l-3 7 8-10h-5l3-5z" fill="#F5B841" />
        </>
      );
      break;
    case "snow":
      body = (
        <>
          {CLOUD(-6)}
          <g fill="#7FB3D9">
            <circle cx="17" cy="37" r="2" /><circle cx="25" cy="40" r="2" /><circle cx="33" cy="37" r="2" />
          </g>
        </>
      );
      break;
    case "fog":
      body = (
        <g stroke="#A7B0B7" strokeWidth="3" strokeLinecap="round">
          <line x1="10" y1="18" x2="38" y2="18" /><line x1="6" y1="25" x2="34" y2="25" /><line x1="12" y1="32" x2="40" y2="32" />
        </g>
      );
      break;
    case "wind":
      body = (
        <g stroke="#8FA3B0" strokeWidth="3" strokeLinecap="round" fill="none">
          <path d="M6 18h22a5 5 0 1 0-5-5" /><path d="M6 26h30a5 5 0 1 1-5 5" /><path d="M6 34h14" />
        </g>
      );
      break;
  }
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      {body}
    </svg>
  );
};

export default WeatherIcon;
