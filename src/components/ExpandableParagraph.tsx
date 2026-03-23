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

  const isExpanded = isControlled ? expanded : internalExpanded;

  const resolveSymbol = React.useCallback(
    (nextExpanded: boolean) => {
      const label =
        typeof symbol === 'function'
          ? symbol(nextExpanded)
          : (symbol ?? DEFAULT_EXPAND_SYMBOL(nextExpanded));

      return (
        <>
       {label}
        </>
      );
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
    <Paragraph
      className={className}
      ellipsis={{
        rows,
        expandable: 'collapsible',
        expanded: isExpanded,
        symbol: resolveSymbol,
        onExpand: handleExpand,
      
      }}
    >
      {children}
    </Paragraph>
  );
};

export default ExpandableParagraph;
