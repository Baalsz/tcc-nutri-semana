import React from "react";

export default function ResponsiveGrid({ className = "", children }) {
  return (
    <div className={["grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3", className].join(" ")}>
      {children}
    </div>
  );
}

