import React from 'react';
import { Typography } from 'antd';
import type { ExpandableParagraphProps } from '../types';

const { Paragraph } = Typography;

const DEFAULT_EXPAND_SYMBOL = (expanded: boolean) =>
  expanded ? 'Свернуть' : 'Показать всё';

const ExpandableParagraph: React.FC<ExpandableParagraphProps> = ({
  children,
  rows = 3,
  defaultExpanded = false,
  expanded,
  onExpand,
  symbol,
  className,
}) => {
  const isControlled = expanded !== undefined;
  const [internalExpanded, setInternalExpanded] = React.useState(defaultExpanded);
  const [isOverflowing, setIsOverflowing] = React.useState(false);

  const isExpanded = isControlled ? expanded : internalExpanded;

  React.useEffect(() => {
    setIsOverflowing(false);
  }, [children, rows]);

  const resolveSymbol = React.useCallback(
    (nextExpanded: boolean) => {
      if (typeof symbol === 'function') {
        return symbol(nextExpanded);
      }

      return symbol ?? DEFAULT_EXPAND_SYMBOL(nextExpanded);
    },
    [symbol],
  );

  const handleExpand = (
    event: React.MouseEvent<HTMLElement>,
    info: { expanded: boolean },
  ) => {
    const nextExpanded = info.expanded;

    if (!isControlled) {
      setInternalExpanded(nextExpanded);
    }

    onExpand?.(nextExpanded, {
      x: event.clientX,
      y: event.clientY,
    });
  };

  return (
    <div style={{ position: 'relative' }}>
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          visibility: 'hidden',
          pointerEvents: 'none',
          zIndex: -1,
        }}
      >
        <Paragraph
          className={className}
          ellipsis={{
            rows,
            onEllipsis: setIsOverflowing,
          }}
        >
          {children}
        </Paragraph>
      </div>

      <Paragraph
        className={className}
        ellipsis={{
          rows,
          expandable: isOverflowing ? 'collapsible' : false,
          expanded: isExpanded,
          symbol: resolveSymbol,
          onExpand: handleExpand,
        }}
      >
        {children}
      </Paragraph>
    </div>
  );
};

export default ExpandableParagraph;
