import {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes
} from "react";

const inputBase =
  "w-full rounded-sm border border-border bg-panel-soft px-3 py-2.5 text-sm text-text-primary shadow-panel transition duration-150 placeholder:text-text-faint focus:border-accent/80 focus:outline-none focus:ring-2 focus:ring-accent/25 invalid:border-danger/70";

type LabelProps = {
  htmlFor?: string;
  children: ReactNode;
};

export function Label({ htmlFor, children }: LabelProps) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-xs font-medium text-text-muted">
      {children}
    </label>
  );
}

type HintProps = {
  hint?: string;
};

function FieldHint({ hint }: HintProps) {
  if (!hint) return null;
  return <p className="mt-1 text-xs text-text-faint">{hint}</p>;
}

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
};

export function Input({ label, id, className = "", hint, ...props }: InputProps) {
  return (
    <div>
      {label ? <Label htmlFor={id}>{label}</Label> : null}
      <input id={id} className={`${inputBase} ${className}`} {...props} />
      <FieldHint hint={hint} />
    </div>
  );
}

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  hint?: string;
};

export function Textarea({ label, id, className = "", hint, ...props }: TextareaProps) {
  return (
    <div>
      {label ? <Label htmlFor={id}>{label}</Label> : null}
      <textarea id={id} className={`${inputBase} min-h-[96px] resize-y ${className}`} {...props} />
      <FieldHint hint={hint} />
    </div>
  );
}

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  hint?: string;
};

export function Select({ label, id, className = "", children, hint, ...props }: SelectProps) {
  return (
    <div>
      {label ? <Label htmlFor={id}>{label}</Label> : null}
      <select
        id={id}
        className={`${inputBase} cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20width=%2212%22%20height=%2212%22%20viewBox=%220%200%2012%2012%22%3E%3Cpath%20fill=%22%238b97ab%22%20d=%22M6%208L1%203h10z%22/%3E%3C/svg%3E')] bg-[length:12px] bg-[right_10px_center] bg-no-repeat pr-8 ${className}`}
        {...props}
      >
        {children}
      </select>
      <FieldHint hint={hint} />
    </div>
  );
}
