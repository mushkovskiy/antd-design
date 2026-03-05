import React, { useState } from 'react';
import { Image } from 'antd';

interface GalleryProps {
  images: string[];
}

const MAX_VISIBLE = 10;
const THUMB_WIDTH = 80;
const THUMB_HEIGHT = 60;
const OVERLAP = THUMB_WIDTH / 2; // 40px

const Gallery: React.FC<GalleryProps> = ({ images }) => {
  const [startIndex, setStartIndex] = useState(0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const isOverlayMode = images.length > MAX_VISIBLE;
  const visibleImages = images.slice(startIndex, startIndex + MAX_VISIBLE);

  const canScrollLeft = startIndex > 0;
  const canScrollRight = startIndex + MAX_VISIBLE < images.length;

  const scrollLeft = () => setStartIndex((prev) => Math.max(0, prev - 1));
  const scrollRight = () =>
    setStartIndex((prev) => Math.min(images.length - MAX_VISIBLE, prev + 1));

  if (images.length === 0) return null;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: isOverlayMode ? 0 : '10px',
        padding: isOverlayMode ? '16px 24px' : '8px 0',
      }}
    >
      {visibleImages.map((src, visibleIndex) => {
        const isLeftEdge = visibleIndex === 0;
        const isRightEdge = visibleIndex === visibleImages.length - 1;
        const isHovered = hoveredIndex === visibleIndex;

        return (
          <div
            key={startIndex + visibleIndex}
            style={{
              position: 'relative',
              width: THUMB_WIDTH,
              height: THUMB_HEIGHT,
              flexShrink: 0,
              ...(isOverlayMode && !isRightEdge
                ? { marginRight: `-${OVERLAP}px` }
                : {}),
              ...(isOverlayMode
                ? {
                    zIndex: isHovered
                      ? MAX_VISIBLE + 1
                      : MAX_VISIBLE - visibleIndex,
                    transition: 'transform 0.2s ease',
                    transform: isHovered ? 'scale(1.2)' : 'scale(1)',
                  }
                : {}),
            }}
            onMouseEnter={() => isOverlayMode && setHoveredIndex(visibleIndex)}
            onMouseLeave={() => isOverlayMode && setHoveredIndex(null)}
          >
            <Image
              width={THUMB_WIDTH}
              height={THUMB_HEIGHT}
              src={src}
              preview={{ mask: false }}
            />

            {/* Overlay for left edge scroll */}
            {isOverlayMode && isLeftEdge && canScrollLeft && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  zIndex: MAX_VISIBLE + 2,
                  cursor: 'w-resize',
                }}
                onClick={scrollLeft}
              />
            )}

            {/* Overlay for right edge scroll */}
            {isOverlayMode && isRightEdge && canScrollRight && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  zIndex: MAX_VISIBLE + 2,
                  cursor: 'e-resize',
                }}
                onClick={scrollRight}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default Gallery;
