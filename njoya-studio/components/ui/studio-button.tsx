"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

import { forwardRef } from "react";
import { Slot } from "@radix-ui/react-slot";
import { X } from "lucide-react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  asChild?: boolean;
  variant?: "quiet" | "outline" | "solid";
};

export const StudioButton = forwardRef<HTMLButtonElement, ButtonProps>(
  function StudioButton(
    { asChild, variant = "quiet", className = "", type = "button", ...props },
    ref,
  ) {
    const Component = asChild ? Slot : "button";

    return (
      <Component
        {...props}
        ref={ref}
        className={`studio-button studio-button--${variant} ${className}`}
        type={asChild ? undefined : type}
      />
    );
  },
);

export const StudioIconButton = forwardRef<
  HTMLButtonElement,
  Omit<ButtonProps, "aria-label"> & { label: string; children: ReactNode }
>(function StudioIconButton(
  { label, className = "", children, ...props },
  ref,
) {
  return (
    <StudioButton
      {...props}
      ref={ref}
      aria-label={label}
      className={`studio-icon-button ${className}`}
    >
      <span aria-hidden="true" className="studio-button-icon">
        {children}
      </span>
    </StudioButton>
  );
});

export const StudioCloseButton = forwardRef<
  HTMLButtonElement,
  Omit<ButtonProps, "children"> & { label?: string }
>(function StudioCloseButton({ label = "Close", ...props }, ref) {
  return (
    <StudioIconButton {...props} ref={ref} label={label} variant="outline">
      <X size={18} strokeWidth={1.5} />
    </StudioIconButton>
  );
});
