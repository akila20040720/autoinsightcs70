import React from 'react';

/**
 * AnalyticalBaseBackground
 * Base layer with analytical grid pattern and geometric gradients.
 * Modern futuristic design inspired by data visualization dashboards.
 */
export default function AnalyticalBaseBackground(): React.ReactElement {
  return (
    <div className="analytical-base-bg" aria-hidden="true">
      <div className="analytical-grid" />
      <div className="analytical-geometric-shapes">
        <div className="shape shape-1" />
        <div className="shape shape-2" />
        <div className="shape shape-3" />
      </div>
    </div>
  );
}
