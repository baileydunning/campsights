import React, { useEffect, useState } from "react";
import type { CampsiteImage } from "../../types/Campsite";

interface PhotoGalleryProps {
  images: CampsiteImage[];
  name: string;
}

const PhotoGallery: React.FC<PhotoGalleryProps> = ({ images, name }) => {
  const [index, setIndex] = useState(0);
  const [failed, setFailed] = useState<Set<string>>(new Set());
  const visible = images.filter((img) => !failed.has(img.src));
  const current = visible[Math.min(index, visible.length - 1)];

  useEffect(() => setIndex(0), [images]);

  const step = (delta: number) => setIndex((i) => (i + delta + visible.length) % visible.length);

  useEffect(() => {
    if (visible.length < 2) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") step(-1);
      if (e.key === "ArrowRight") step(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible.length]);

  if (!current) return null;

  return (
    <div className="gallery">
      <div className="gallery__frame">
        <img
          key={current.src}
          className="gallery__image"
          src={current.src}
          alt={current.alt || name}
          onError={() => setFailed((prev) => new Set(prev).add(current.src))}
        />
        {visible.length > 1 && (
          <>
            <button type="button" className="gallery__nav gallery__nav--prev" onClick={() => step(-1)} aria-label="Previous photo">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6" /></svg>
            </button>
            <button type="button" className="gallery__nav gallery__nav--next" onClick={() => step(1)} aria-label="Next photo">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6" /></svg>
            </button>
            <span className="gallery__count">{Math.min(index, visible.length - 1) + 1} / {visible.length}</span>
          </>
        )}
      </div>
      {(current.alt || current.credit) && (
        <p className="gallery__caption">
          {current.alt}
          {current.credit && <span className="gallery__credit">Photo: {current.credit}</span>}
        </p>
      )}
      {visible.length > 1 && (
        <div className="gallery__thumbs" role="tablist" aria-label="Photos">
          {visible.map((img, i) => (
            <button
              key={img.src}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={img.alt || `Photo ${i + 1}`}
              className={`gallery__thumb${i === index ? " is-active" : ""}`}
              onClick={() => setIndex(i)}
            >
              <img src={img.src} alt="" loading="lazy" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default PhotoGallery;
