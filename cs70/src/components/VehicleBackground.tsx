import React from "react";

/**
 * AnalyticalBaseBackground
 * Uses the same aurora-style gradient as the landing hero, with soft glows.
 */
export default function AnalyticalBaseBackground(): React.ReactElement {
  return (
    <div className="analytical-base-bg" aria-hidden="true">
      <div className="landing-aurora landing-aurora-1" />
      <div className="landing-aurora landing-aurora-2" />
      <div className="landing-aurora landing-aurora-3" />
    </div>
  );
}
