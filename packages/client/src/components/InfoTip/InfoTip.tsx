import React, { useEffect, useId, useRef, useState } from "react";
import "./InfoTip.css";

interface InfoTipProps {
  label: string;
  children: React.ReactNode;
}

// A small (i) button that shows a note. Opens on hover or focus on desktop and
// on tap on phones; closes on a second tap, a tap elsewhere, or Escape.
const InfoTip: React.FC<InfoTipProps> = ({ label, children }) => {
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  const id = useId();
  const visible = open || hovered;

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <span
      className="info-tip"
      ref={ref}
      // Hover only for real mice; on touch screens a tap toggles it instead.
      onPointerEnter={(e) => e.pointerType === "mouse" && setHovered(true)}
      onPointerLeave={(e) => e.pointerType === "mouse" && setHovered(false)}
    >
      <button
        type="button"
        className="info-tip__button"
        aria-label={label}
        aria-expanded={visible}
        aria-describedby={visible ? id : undefined}
        onClick={() => setOpen((o) => !o)}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <circle cx="12" cy="12" r="9.5" />
          <line x1="12" y1="11" x2="12" y2="16.5" />
          <circle cx="12" cy="7.75" r="0.6" fill="currentColor" />
        </svg>
      </button>
      {visible && (
        <span role="tooltip" id={id} className="info-tip__bubble">
          {children}
        </span>
      )}
    </span>
  );
};

export default InfoTip;
