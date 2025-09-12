import React, { useState, useRef } from 'react';
import { ColorEditIcon } from './ColorEditIcon';

interface EditableColorElementProps {
  children: React.ReactNode;
  colorValue: string;
  onColorChange: (color: string) => void;
  description: string;
  className?: string;
  style?: React.CSSProperties;
  iconPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

export function EditableColorElement({
  children,
  colorValue,
  onColorChange,
  description,
  className = '',
  style = {},
  iconPosition = 'top-right'
}: EditableColorElementProps) {
  const [isHovering, setIsHovering] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  const getIconPositionStyle = () => {
    const base = { position: 'absolute' as const };
    switch (iconPosition) {
      case 'top-left':
        return { ...base, top: 4, left: 4 };
      case 'top-right':
        return { ...base, top: 4, right: 4 };
      case 'bottom-left':
        return { ...base, bottom: 4, left: 4 };
      case 'bottom-right':
        return { ...base, bottom: 4, right: 4 };
      default:
        return { ...base, top: 4, right: 4 };
    }
  };

  return (
    <div
      ref={elementRef}
      className={`relative ${className}`}
      style={style}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {children}
      
      {isHovering && (
        <div style={getIconPositionStyle()}>
          <ColorEditIcon
            currentColor={colorValue}
            onChange={onColorChange}
            description={description}
            position="bottom"
          />
        </div>
      )}
    </div>
  );
}