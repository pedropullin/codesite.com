import { forwardRef, type ComponentProps, type ReactNode } from "react";
import type { OrderStatus } from "@/db/schema";
import { ORDER_STATUS_LABEL } from "@/lib/types";
import { cn } from "@/lib/utils";

/* Buttons ------------------------------------------------------------------ */

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type ButtonSize = "sm" | "md" | "icon";

const buttonBase =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-[background-color,color,border-color,opacity,box-shadow] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0";
const buttonVariants: Record<ButtonVariant, string> = {
  primary: "bg-primary text-primary-foreground hover:bg-primary/85 shadow-sm",
  secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/70",
  outline: "border border-input bg-card hover:bg-muted",
  ghost: "hover:bg-muted text-foreground",
  danger: "bg-destructive text-white hover:bg-destructive/90",
};
const buttonSizes: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4",
  icon: "h-9 w-9",
};

export function buttonClass({ variant = "primary", size = "md", className }: { variant?: ButtonVariant; size?: ButtonSize; className?: string } = {}) {
  return cn(buttonBase, buttonVariants[variant], buttonSizes[size], className);
}

export const Button = forwardRef<HTMLButtonElement, ComponentProps<"button"> & { variant?: ButtonVariant; size?: ButtonSize; loading?: boolean }>(
  function Button({ variant = "primary", size = "md", loading, className, children, disabled, ...props }, ref) {
    return (
      <button ref={ref} className={buttonClass({ variant, size, className })} disabled={disabled || loading} {...props}>
        {loading && <Spinner />}
        {children}
      </button>
    );
  },
);

export function Spinner({ className }: { className?: string }) {
  return <span aria-hidden className={cn("inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-r-transparent", className)} />;
}

/* Form controls ---------------------------------------------------------- */

const control =
  "w-full rounded-md border border-input bg-card px-3 text-sm shadow-[0_1px_0_rgba(0,0,0,0.02)] outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-foreground/40 focus:ring-2 focus:ring-ring/25 disabled:opacity-60 aria-[invalid=true]:border-red-400";

export const Input = forwardRef<HTMLInputElement, ComponentProps<"input">>(function Input({ className, ...props }, ref) {
  return <input ref={ref} className={cn(control, "h-10", className)} {...props} />;
});

export const Textarea = forwardRef<HTMLTextAreaElement, ComponentProps<"textarea">>(function Textarea({ className, ...props }, ref) {
  return <textarea ref={ref} className={cn(control, "min-h-24 py-2 leading-relaxed", className)} {...props} />;
});

export const Select = forwardRef<HTMLSelectElement, ComponentProps<"select">>(function Select({ className, children, ...props }, ref) {
  return (
    <div className="relative">
      <select ref={ref} className={cn(control, "h-10 appearance-none pr-8", className)} {...props}>
        {children}
      </select>
      <span aria-hidden className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">▾</span>
    </div>
  );
});

export function Field({ label, htmlFor, hint, error, aside, children, className }: { label: string; htmlFor?: string; hint?: string; error?: string; aside?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={htmlFor} className="text-[13px] font-medium text-foreground/85">{label}</label>
        {aside}
      </div>
      {children}
      {error ? <p className="text-xs text-red-600">{error}</p> : hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function Switch({ checked, onChange, label, disabled, size = "md" }: { checked: boolean; onChange?: (v: boolean) => void; label: string; disabled?: boolean; size?: "sm" | "md" }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
      className={cn(
        "relative inline-flex shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50",
        size === "sm" ? "h-5 w-9" : "h-6 w-11",
        checked ? "bg-foreground" : "bg-input",
      )}
    >
      <span
        className={cn(
          "inline-block rounded-full bg-white shadow transition-transform",
          size === "sm" ? "h-4 w-4" : "h-5 w-5",
          checked ? (size === "sm" ? "translate-x-[18px]" : "translate-x-[22px]") : "translate-x-0.5",
        )}
      />
    </button>
  );
}

/* Surfaces ---------------------------------------------------------------- */

export function Card({ className, children, ...props }: ComponentProps<"div">) {
  return (
    <div className={cn("rounded-xl border border-border bg-card shadow-[0_1px_2px_rgba(0,0,0,0.03)]", className)} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ title, description, action, className }: { title: string; description?: string; action?: ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-start justify-between gap-4 border-b border-border px-5 py-4", className)}>
      <div>
        <h2 className="text-sm font-semibold">{title}</h2>
        {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function PageHeader({ title, description, actions, eyebrow }: { title: string; description?: string; actions?: ReactNode; eyebrow?: string }) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        {eyebrow && <p className="label-sm text-muted-foreground">{eyebrow}</p>}
        <h1 className="mt-1 text-2xl font-semibold tracking-tight md:text-[28px]">{title}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function EmptyState({ title, description, action, icon }: { title: string; description?: string; action?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full border border-dashed border-border text-muted-foreground">
        {icon ?? <span className="h-3 w-5 border border-current" />}
      </div>
      <p className="text-sm font-medium">{title}</p>
      {description && <p className="max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton rounded-md", className)} />;
}

/* Badges -------------------------------------------------------------------- */

const STATUS_STYLE: Record<OrderStatus, string> = {
  NOVO: "bg-sky-50 text-sky-800 ring-sky-200",
  AGUARDANDO_PAGAMENTO: "bg-amber-50 text-amber-800 ring-amber-200",
  PAGO: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  EM_PREPARACAO: "bg-violet-50 text-violet-800 ring-violet-200",
  ENVIADO: "bg-indigo-50 text-indigo-800 ring-indigo-200",
  ENTREGUE: "bg-neutral-900 text-white ring-neutral-900",
  CANCELADO: "bg-red-50 text-red-700 ring-red-200",
};

export function StatusBadge({ status, className }: { status: OrderStatus; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset", STATUS_STYLE[status], className)}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {ORDER_STATUS_LABEL[status]}
    </span>
  );
}

export function Badge({ children, tone = "neutral", className }: { children: ReactNode; tone?: "neutral" | "dark" | "success" | "warning" | "danger" | "outline"; className?: string }) {
  const tones = {
    neutral: "bg-muted text-foreground/80 ring-border",
    dark: "bg-foreground text-background ring-foreground",
    success: "bg-emerald-50 text-emerald-800 ring-emerald-200",
    warning: "bg-amber-50 text-amber-800 ring-amber-200",
    danger: "bg-red-50 text-red-700 ring-red-200",
    outline: "bg-transparent text-foreground/70 ring-border",
  };
  return <span className={cn("inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset", tones[tone], className)}>{children}</span>;
}

/* Delta ---------------------------------------------------------------------- */

export function Delta({ value, goodWhenUp = true }: { value: number; goodWhenUp?: boolean }) {
  if (!Number.isFinite(value)) return null;
  const up = value > 0.0005;
  const down = value < -0.0005;
  const good = (up && goodWhenUp) || (down && !goodWhenUp);
  const bad = (down && goodWhenUp) || (up && !goodWhenUp);
  return (
    <span className={cn("inline-flex items-center gap-0.5 text-xs font-medium", good && "text-emerald-700", bad && "text-red-600", !good && !bad && "text-muted-foreground")}>
      <span aria-hidden>{up ? "↑" : down ? "↓" : "→"}</span>
      {`${Math.abs(value * 100).toFixed(1).replace(".", ",")}%`}
      <span className="sr-only">{up ? "aumento" : down ? "queda" : "estável"} vs período anterior</span>
    </span>
  );
}
