"use client";

import { forwardRef, useImperativeHandle, useRef } from "react";
import { Search, X } from "lucide-react";

import { StudioIconButton } from "./studio-button";

export const SearchField = forwardRef<
  HTMLInputElement,
  {
    label: string;
    placeholder?: string;
    value: string;
    onChange: (value: string) => void;
  }
>(function SearchField({ label, placeholder, value, onChange }, ref) {
  const inputRef = useRef<HTMLInputElement>(null);

  useImperativeHandle(ref, () => inputRef.current!);

  return (
    <div className="studio-search-field">
      <Search aria-hidden="true" size={19} strokeWidth={1.5} />
      <input
        ref={inputRef}
        aria-label={label}
        autoComplete="off"
        placeholder={placeholder}
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Escape" && value) {
            event.preventDefault();
            event.stopPropagation();
            onChange("");
          }
        }}
      />
      {value && (
        <StudioIconButton
          label="Clear search"
          onClick={() => {
            onChange("");
            inputRef.current?.focus();
          }}
        >
          <X size={16} />
        </StudioIconButton>
      )}
    </div>
  );
});
