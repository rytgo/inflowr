import { ReactNode, TdHTMLAttributes, ThHTMLAttributes } from "react";

type TableProps = {
  children: ReactNode;
  className?: string;
};

export function Table({ children, className = "" }: TableProps) {
  return (
    <div className="overflow-x-auto rounded-sm border border-border-subtle bg-panel-soft/40">
      <table className={`w-full border-collapse text-left text-sm ${className}`}>{children}</table>
    </div>
  );
}

export function TableHead({ children }: { children: ReactNode }) {
  return (
    <thead>
      <tr className="border-b border-border text-[11px] uppercase tracking-[0.08em] text-text-faint">{children}</tr>
    </thead>
  );
}

type TableThProps = ThHTMLAttributes<HTMLTableCellElement> & {
  children: ReactNode;
};

export function TableTh({ children, className = "", ...props }: TableThProps) {
  return (
    <th className={`px-3 py-3 font-medium first:pl-4 last:pr-4 ${className}`} {...props}>
      {children}
    </th>
  );
}

export function TableBody({ children }: { children: ReactNode }) {
  return <tbody className="divide-y divide-border-subtle">{children}</tbody>;
}

export function TableRow({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <tr className={`transition-colors hover:bg-panel-strong/60 ${className}`}>{children}</tr>;
}

type TableCellProps = TdHTMLAttributes<HTMLTableCellElement> & {
  children: ReactNode;
  muted?: boolean;
};

export function TableCell({ children, muted = false, className = "", ...props }: TableCellProps) {
  return (
    <td
      className={`px-3 py-3 first:pl-4 last:pr-4 ${muted ? "text-text-faint" : "text-text-secondary"} ${className}`}
      {...props}
    >
      {children}
    </td>
  );
}
