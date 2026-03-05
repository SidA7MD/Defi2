import React from 'react';

/**
 * UIcon — wrapper for Flaticon UIcons (CSS icon font).
 *
 * @param {string}  name      – icon name WITHOUT prefix, e.g. "heart", "home"
 * @param {number}  [size]    – font-size in px (default: inherits)
 * @param {string}  [color]   – CSS color value (default: inherits)
 * @param {string}  [className] – additional CSS classes
 * @param {string}  [variant] – "rr" (regular‑rounded, default) or "sr" (solid‑rounded)
 * @param {object}  [style]   – extra inline styles
 */
export default function UIcon({
  name,
  size,
  color,
  className = '',
  variant = 'rr',
  style = {},
  ...rest
}) {
  const iconStyle = { ...style };
  if (size) iconStyle.fontSize = `${size}px`;
  if (color) iconStyle.color = color;

  return (
    <i
      className={`fi fi-${variant}-${name} ${className}`.trim()}
      style={iconStyle}
      aria-hidden="true"
      {...rest}
    />
  );
}
