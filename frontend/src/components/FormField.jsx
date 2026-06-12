import React from "react";

export function Label({ children, htmlFor }) {
  return (
    <label htmlFor={htmlFor} className="text-sm font-bold text-emerald-900/90">
      {children}
    </label>
  );
}

export function Input({ className = "", ...props }) {
  return (
    <input
      className={[
        "h-11 w-full rounded-2xl bg-white/95 px-3 text-base",
        "ring-2 ring-amber-100/90 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-1 focus:ring-offset-emerald-50/50",
        "placeholder:text-slate-400",
        className,
      ].join(" ")}
      {...props}
    />
  );
}

export function Select({ className = "", children, ...props }) {
  return (
    <select
      className={[
        "h-11 w-full rounded-2xl bg-white/95 px-3 text-base",
        "ring-2 ring-amber-100/90 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-1 focus:ring-offset-emerald-50/50",
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </select>
  );
}

export function Textarea({ className = "", ...props }) {
  return (
    <textarea
      className={[
        "min-h-24 w-full rounded-2xl bg-white/95 px-3 py-2 text-base",
        "ring-2 ring-amber-100/90 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-1 focus:ring-offset-emerald-50/50",
        "placeholder:text-slate-400",
        className,
      ].join(" ")}
      {...props}
    />
  );
}

export function Helper({ children }) {
  if (!children) return null;
  return <p className="text-sm text-slate-500">{children}</p>;
}

export function ErrorText({ children }) {
  if (!children) return null;
  return <p className="text-sm font-medium text-rose-600">{children}</p>;
}

