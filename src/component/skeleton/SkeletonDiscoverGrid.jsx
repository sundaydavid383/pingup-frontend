import React from "react";
import SkeletonUserCard from "./SkeletonUserCard";

export default function SkeletonDiscoverGrid({ count = 8 }) {
  return (
    <div
      style={{
        display: "grid",
        gap: "1.5rem",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        alignItems: "start",
      }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonUserCard key={i} />
      ))}
    </div>
  );
}
