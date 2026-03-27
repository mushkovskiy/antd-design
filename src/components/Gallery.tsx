import React, { useState } from 'react';
import { Image } from 'antd';
import styled from '@emotion/styled';

interface GalleryProps {
  images: string[];
}

const MAX_VISIBLE = 10;
const THUMB_WIDTH = 80;
const THUMB_HEIGHT = 60;
const OVERLAP = THUMB_WIDTH / 2; // 40px

const Container = styled.div<{ isOverlayMode: boolean }>`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: ${({ isOverlayMode }) => (isOverlayMode ? 0 : '10px')};
  padding: ${({ isOverlayMode }) => (isOverlayMode ? '16px 24px' : '8px 0')};
`;

const ThumbWrapper = styled.div<{
  isOverlayMode: boolean;
  isRightEdge: boolean;
  isHovered: boolean;
  zIndex: number;
}>`
  position: relative;
  width: ${THUMB_WIDTH}px;
  height: ${THUMB_HEIGHT}px;
  flex-shrink: 0;
  ${({ isOverlayMode, isRightEdge }) =>
    isOverlayMode && !isRightEdge ? `margin-right: -${OVERLAP}px;` : ''}
  ${({ isOverlayMode, zIndex, isHovered }) =>
    isOverlayMode
      ? `
    z-index: ${zIndex};
    transition: transform 0.2s ease;
    transform: ${isHovered ? 'scale(1.2)' : 'scale(1)'};
  `
      : ''}
`;

const ScrollOverlay = styled.div<{
  cursor: 'w-resize' | 'e-resize';
  side: 'left' | 'right';
}>`
  position: absolute;
  top: 0;
  bottom: 0;
  ${({ side }) => (side === 'left' ? 'left: 0;' : 'right: 0;')}
  width: 18px;
  z-index: ${MAX_VISIBLE + 2};
  cursor: ${({ cursor }) => cursor};
`;

const RemainingBadge = styled.div`
  position: relative;
  width: ${THUMB_WIDTH}px;
  height: ${THUMB_HEIGHT}px;
  flex-shrink: 0;
  margin-left: -${THUMB_WIDTH}px;
  z-index: ${MAX_VISIBLE + 3};
  pointer-events: none;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 8px;
  background: linear-gradient(to left, rgba(0, 0, 0, 0.75) 0%, rgba(0, 0, 0, 0) 100%);
  color: #fff;
  font-size: 13px;
  font-weight: 600;
`;

const Gallery: React.FC<GalleryProps> = ({ images }) => {
  const [startIndex, setStartIndex] = useState(0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);

  const isOverlayMode = images.length > MAX_VISIBLE;
  const visibleImages = images.slice(startIndex, startIndex + MAX_VISIBLE);

  const canScrollLeft = startIndex > 0;
  const canScrollRight = startIndex + MAX_VISIBLE < images.length;

  const scrollLeft = () => setStartIndex((prev) => Math.max(0, prev - 1));
  const scrollRight = () =>
    setStartIndex((prev) => Math.min(images.length - MAX_VISIBLE, prev + 1));
  const openPreview = (index: number) => {
    setPreviewIndex(index);
    setPreviewVisible(true);
  };

  if (images.length === 0) return null;

  return (
    <>
      <Container isOverlayMode={isOverlayMode}>
        {visibleImages.map((src, visibleIndex) => {
          const absoluteIndex = startIndex + visibleIndex;
          const isLeftEdge = visibleIndex === 0;
          const isRightEdge = visibleIndex === visibleImages.length - 1;
          const isHovered = hoveredIndex === visibleIndex;

          return (
            <ThumbWrapper
              key={absoluteIndex}
              isOverlayMode={isOverlayMode}
              isRightEdge={isRightEdge}
              isHovered={isHovered}
              zIndex={isHovered ? MAX_VISIBLE + 1 : MAX_VISIBLE - visibleIndex}
              onMouseEnter={() => isOverlayMode && setHoveredIndex(visibleIndex)}
              onMouseLeave={() => isOverlayMode && setHoveredIndex(null)}
              onClick={() => openPreview(absoluteIndex)}
            >
              <Image
                width={THUMB_WIDTH}
                height={THUMB_HEIGHT}
                src={src}
                preview={false}
              />

              {/* Overlay for left edge scroll */}
              {isOverlayMode && isLeftEdge && canScrollLeft && (
                <ScrollOverlay
                  side="left"
                  cursor="w-resize"
                  onClick={(event) => {
                    event.stopPropagation();
                    scrollLeft();
                  }}
                />
              )}

              {/* Overlay for right edge scroll */}
              {isOverlayMode && isRightEdge && canScrollRight && (
                <ScrollOverlay
                  side="right"
                  cursor="e-resize"
                  onClick={(event) => {
                    event.stopPropagation();
                    scrollRight();
                  }}
                />
              )}
            </ThumbWrapper>
          );
        })}

        {/* Remaining count badge */}
        {isOverlayMode && canScrollRight && (
          <RemainingBadge>
            +{images.length - (startIndex + MAX_VISIBLE)}
          </RemainingBadge>
        )}
      </Container>

      <Image.PreviewGroup
        items={images}
        preview={{
          visible: previewVisible,
          current: previewIndex,
          onVisibleChange: (visible) => setPreviewVisible(visible),
          onChange: (current) => setPreviewIndex(current),
          
        }}
      />
    </>
  );
};

export default Gallery;
