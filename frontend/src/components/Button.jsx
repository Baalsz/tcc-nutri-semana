import React from "react";

const variants = {
  primary:
    "bg-gradient-to-r from-teal-600 to-emerald-600 text-white hover:brightness-110 active:brightness-95 focus-visible:outline-emerald-400 shadow-glow",
  brand:
    "bg-gradient-to-r from-emerald-500 via-lime-500 to-teal-500 text-white hover:brightness-110 active:brightness-95 focus-visible:outline-lime-300 shadow-glow",
  accent:
    "bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 text-white hover:brightness-110 active:brightness-95 focus-visible:outline-amber-300 shadow-citrus",
  secondary:
    "bg-white/95 text-slate-800 hover:bg-amber-50/90 active:bg-amber-100/80 focus-visible:outline-emerald-400 ring-2 ring-amber-200/70",
  ghost:
    "bg-white/50 text-slate-800 hover:bg-emerald-50/90 active:bg-emerald-100/60 focus-visible:outline-emerald-400 ring-2 ring-transparent hover:ring-emerald-200/80",
  danger:
    "bg-gradient-to-r from-rose-500 to-rose-600 text-white hover:brightness-110 active:brightness-95 focus-visible:outline-rose-500",
};

const sizes = {
  md: "h-11 px-4 text-base",
  sm: "h-10 px-3 text-sm",
};

export default function Button({
  className = "",
  variant = "primary",
  size = "md",
  type = "button",
  ...props
}) {
  return (
    <button
      type={type}
      className={[
        "inline-flex items-center justify-center gap-2 rounded-2xl font-bold",
        "transition-all duration-200 ease-out active:scale-[0.98]",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-60",
        variants[variant] || variants.primary,
        sizes[size] || sizes.md,
        "shadow-md",
        className,
      ].join(" ")}
      {...props}
    />
  );
}

