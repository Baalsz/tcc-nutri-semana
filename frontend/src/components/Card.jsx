import React from "react";

export default function Card({ className = "", children }) {
  return (
    <div
      className={[
        "rounded-3xl border border-white/60 bg-white/90 shadow-glow ring-2 ring-emerald-100/60 backdrop-blur-md",
        "transition-[box-shadow,transform,ring-color] duration-300 ease-out",
        "hover:shadow-lg hover:ring-emerald-200/90 hover:-translate-y-px",
        "p-4 sm:p-5 lg:p-6",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}

