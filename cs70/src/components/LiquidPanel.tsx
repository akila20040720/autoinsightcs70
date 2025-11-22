import React from "react";

export default function LiquidPanel({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div className="liquid-panel" style={style}>
      {children}
    </div>
  );
}
