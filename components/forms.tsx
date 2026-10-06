"use client";

import { useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";

export const inputClass =
  "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm " +
  "focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 " +
  "aria-[invalid=true]:border-red-500";

type FieldProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  name: string;
  error?: string;
  hint?: string;
  className?: string;
};

// `id` defaults to `name`; pass one explicitly when two forms on a page share field names.
export function Field({ label, name, error, hint, className, id, ...inputProps }: FieldProps) {
  const inputId = id ?? name;
  const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;
  return (
    <div className={className}>
      <label htmlFor={inputId} className="mb-1 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <input
        id={inputId}
        name={name}
        className={inputClass}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        {...inputProps}
      />
      <FieldHint id={inputId} error={error} hint={hint} />
    </div>
  );
}

export function FieldHint({ id, error, hint }: { id: string; error?: string; hint?: string }) {
  if (error) {
    return (
      <p id={`${id}-error`} className="mt-1 text-sm text-red-600">
        {error}
      </p>
    );
  }
  if (hint) {
    return (
      <p id={`${id}-hint`} className="mt-1 text-xs text-slate-500">
        {hint}
      </p>
    );
  }
  return null;
}

// Free-text input with a suggestion dropdown: typing filters the list, the
// chevron shows every suggestion, and any value is accepted.
export function ServiceTypeInput({
  id,
  defaultValue,
  suggestions,
  error,
}: {
  id: string;
  defaultValue?: string;
  suggestions: string[];
  error?: string;
}) {
  const listId = `${id}-suggestions`;
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [value, setValue] = useState(defaultValue ?? "");
  const [open, setOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [active, setActive] = useState(-1);

  // Keep the controlled value in step with form.reset() (the add-record form
  // clears itself after a successful save).
  useEffect(() => {
    const form = inputRef.current?.form;
    if (!form) return;
    const onReset = () => {
      setValue(defaultValue ?? "");
      setOpen(false);
    };
    form.addEventListener("reset", onReset);
    return () => form.removeEventListener("reset", onReset);
  }, [defaultValue]);

  const query = value.trim().toLowerCase();
  const options =
    showAll || !query ? suggestions : suggestions.filter((s) => s.toLowerCase().includes(query));
  const expanded = open && options.length > 0;

  useEffect(() => {
    if (!expanded || active < 0) return;
    listRef.current?.children[active]?.scrollIntoView({ block: "nearest" });
  }, [active, expanded]);

  function openList(all: boolean) {
    setShowAll(all);
    setOpen(true);
    const list = all || !query ? suggestions : suggestions.filter((s) => s.toLowerCase().includes(query));
    setActive(list.findIndex((s) => s.toLowerCase() === query));
  }

  function choose(option: string) {
    setValue(option);
    setOpen(false);
    setActive(-1);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!expanded) return openList(e.altKey || !query);
      const step = e.key === "ArrowDown" ? 1 : -1;
      setActive((i) => (i + step + options.length) % options.length);
    } else if (e.key === "Enter" && expanded && active >= 0) {
      e.preventDefault();
      choose(options[active]);
    } else if (e.key === "Escape" && open) {
      e.preventDefault();
      setOpen(false);
    } else if (e.key === "Tab") {
      setOpen(false);
    }
  }

  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-slate-700">
        Service type
      </label>
      <div className="relative">
        <input
          ref={inputRef}
          id={id}
          name="serviceType"
          type="text"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={expanded}
          aria-controls={listId}
          aria-activedescendant={expanded && active >= 0 ? `${listId}-${active}` : undefined}
          autoComplete="off"
          placeholder="e.g. Oil change"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setShowAll(false);
            setOpen(true);
            setActive(-1);
          }}
          onClick={() => !open && openList(true)}
          onKeyDown={onKeyDown}
          onBlur={() => setOpen(false)}
          maxLength={100}
          required
          className={`${inputClass} pr-9`}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : `${id}-hint`}
        />
        <button
          type="button"
          tabIndex={-1}
          aria-label="Show suggestions"
          // Keep focus in the input so its blur doesn't close the list first.
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            if (expanded) setOpen(false);
            else openList(true);
            inputRef.current?.focus();
          }}
          className="absolute inset-y-0 right-0 flex w-9 items-center justify-center text-slate-400 hover:text-slate-600"
        >
          <Chevron open={expanded} />
        </button>
        {expanded && (
          <ul
            ref={listRef}
            id={listId}
            role="listbox"
            aria-label="Service type suggestions"
            className="absolute left-0 right-0 top-full z-30 mt-1 max-h-60 overflow-y-auto rounded-md border border-slate-200 bg-white py-1 text-sm shadow-lg"
          >
            {options.map((option, i) => {
              const selected = option.toLowerCase() === query;
              return (
                <li
                  key={option}
                  id={`${listId}-${i}`}
                  role="option"
                  aria-selected={selected}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => choose(option)}
                  onMouseMove={() => active !== i && setActive(i)}
                  className={`flex cursor-pointer items-center justify-between px-3 py-2 ${
                    i === active ? "bg-blue-50 text-blue-900" : "text-slate-700"
                  }`}
                >
                  <span className="truncate">{option}</span>
                  {selected && <CheckIcon />}
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <FieldHint id={id} error={error} hint="Pick a suggestion or type your own." />
    </div>
  );
}

function Chevron({ open = false }: { open?: boolean }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
      className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
    >
      <path
        fillRule="evenodd"
        d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className="h-4 w-4 shrink-0 text-blue-600">
      <path
        fillRule="evenodd"
        d="M16.7 5.3a1 1 0 010 1.4l-8 8a1 1 0 01-1.4 0l-4-4a1 1 0 111.4-1.4L8 12.58l7.3-7.3a1 1 0 011.4 0z"
        clipRule="evenodd"
      />
    </svg>
  );
}

// Native <select> with the browser arrow replaced by one that matches the
// combobox, so it has the same padding and look across browsers.
export function Select({ className = "", children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select {...props} className={`${inputClass} cursor-pointer appearance-none truncate pr-9 ${className}`}>
        {children}
      </select>
      <span className="pointer-events-none absolute inset-y-0 right-0 flex w-9 items-center justify-center text-slate-400">
        <Chevron />
      </span>
    </div>
  );
}

export function FormMessage({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
      {message}
    </p>
  );
}

export function SubmitButton({
  children,
  pendingText,
  variant = "primary",
}: {
  children: React.ReactNode;
  pendingText?: string;
  variant?: "primary" | "danger";
}) {
  const { pending } = useFormStatus();
  const colors =
    variant === "danger"
      ? "bg-red-600 hover:bg-red-700 focus-visible:outline-red-600"
      : "bg-blue-600 hover:bg-blue-700 focus-visible:outline-blue-600";
  return (
    <button
      type="submit"
      disabled={pending}
      className={`rounded-md px-4 py-2 text-sm font-medium text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-60 ${colors}`}
    >
      {pending ? (pendingText ?? "Saving…") : children}
    </button>
  );
}

export const secondaryButtonClass =
  "rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50";
