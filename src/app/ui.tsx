import {
  useEffect,
  useId,
  useState,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Inbox,
  Search,
  X,
  type LucideIcon,
} from "lucide-react";
import { initials, label } from "./model";

export function Button({
  children,
  variant = "secondary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      className={`btn btn-${variant} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
export function IconButton({
  icon: Icon,
  title,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  icon: LucideIcon;
  title: string;
}) {
  return (
    <button
      type="button"
      className="icon-btn"
      title={title}
      aria-label={title}
      {...props}
    >
      <Icon size={18} />
    </button>
  );
}
export function Avatar({
  name,
  index = 0,
  large = false,
}: {
  name: string;
  index?: number;
  large?: boolean;
}) {
  return (
    <span className={`avatar avatar-${index % 5} ${large ? "avatar-lg" : ""}`}>
      {initials(name)}
    </span>
  );
}
export function Badge({ value }: { value: string }) {
  return (
    <span className={`badge badge-${value}`}>
      <i />
      {label(value)}
    </span>
  );
}
export function Field({
  label: text,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="field">
      <span>{text}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  );
}
export function Modal({
  title,
  description,
  onClose,
  children,
  wide = false,
}: {
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="modal-overlay" />
        <Dialog.Content className={`modal ${wide ? "modal-wide" : ""}`}>
          <div className="modal-heading">
            <div>
              <Dialog.Title>{title}</Dialog.Title>
              <Dialog.Description>
                {description ||
                  "Changes are saved to this browser's workspace."}
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <IconButton title="Close dialog" icon={X} />
            </Dialog.Close>
          </div>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
export function Confirm({
  title,
  description,
  confirm = "Confirm",
  danger = false,
  onConfirm,
  onClose,
}: {
  title: string;
  description: string;
  confirm?: string;
  danger?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Modal title={title} description={description} onClose={onClose}>
      <div className="modal-actions">
        <Button onClick={onClose}>Keep current data</Button>
        <Button variant={danger ? "danger" : "primary"} onClick={onConfirm}>
          {confirm}
        </Button>
      </div>
    </Modal>
  );
}
export function PageHeading({
  eyebrow,
  title,
  description,
  children,
  back,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children?: ReactNode;
  back?: string;
}) {
  return (
    <div className="page-heading">
      <div>
        {back && (
          <a className="back-link" href={back}>
            <ArrowLeft size={14} /> Back to {back.split("/")[1]}
          </a>
        )}
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      <div className="heading-actions">{children}</div>
    </div>
  );
}
export function Card({
  title,
  subtitle,
  action,
  children,
  className = "",
}: {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`card ${className}`}>
      {title && (
        <div className="card-heading">
          <div>
            <h2>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
export function Empty({
  title = "Nothing here yet",
  description = "Try a different search or add your first record.",
  children,
}: {
  title?: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <div className="empty">
      <span>
        <Inbox size={26} strokeWidth={1.4} />
      </span>
      <h3>{title}</h3>
      <p>{description}</p>
      {children}
    </div>
  );
}
export function SearchInput({
  value,
  onChange,
  placeholder = "Search…",
  label: text,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
}) {
  const id = useId();
  return (
    <div className="search-input">
      <Search size={16} />
      <label className="sr-only" htmlFor={id}>
        {text || placeholder}
      </label>
      <input
        id={id}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}
export function Tabs({
  options,
  value,
  onChange,
}: {
  options: { id: string; label: string; count?: number }[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="tabs" aria-label="View filters">
      {options.map((option) => (
        <button
          className={value === option.id ? "active" : ""}
          key={option.id}
          onClick={() => onChange(option.id)}
          aria-pressed={value === option.id}
        >
          {option.label}
          {option.count !== undefined && <span>{option.count}</span>}
        </button>
      ))}
    </div>
  );
}
export function Table({
  headings,
  children,
}: {
  headings: string[];
  children: ReactNode;
}) {
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            {headings.map((h, i) => (
              <th key={`${h}-${i}`} scope="col">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}
export function Pagination({
  total,
  page,
  size,
  onChange,
}: {
  total: number;
  page: number;
  size: number;
  onChange: (page: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(total / size));
  return (
    <div className="pagination">
      <p>
        {total
          ? `${(page - 1) * size + 1}–${Math.min(page * size, total)} of ${total} results`
          : "0 results"}
      </p>
      <div>
        <Button disabled={page <= 1} onClick={() => onChange(page - 1)}>
          <ChevronLeft size={14} /> Previous
        </Button>
        <span>
          {page} / {pages}
        </span>
        <Button disabled={page >= pages} onClick={() => onChange(page + 1)}>
          Next <ChevronRight size={14} />
        </Button>
      </div>
    </div>
  );
}
export function usePagination<T>(items: T[], filterKey: string, size = 8) {
  const [page, setPage] = useState(1);
  useEffect(() => setPage(1), [filterKey]);
  const current = Math.min(page, Math.max(1, Math.ceil(items.length / size)));
  return {
    visible: items.slice((current - 1) * size, current * size),
    control: (
      <Pagination
        total={items.length}
        page={current}
        size={size}
        onChange={setPage}
      />
    ),
  };
}
export function Stat({
  title,
  value,
  caption,
  icon: Icon,
  accent = "green",
}: {
  title: string;
  value: string;
  caption: string;
  icon: LucideIcon;
  accent?: string;
}) {
  return (
    <div className={`stat stat-${accent}`}>
      <div className="stat-top">
        <span>{title}</span>
        <span className="stat-icon">
          <Icon size={17} strokeWidth={1.6} />
        </span>
      </div>
      <strong>{value}</strong>
      <p>{caption}</p>
    </div>
  );
}
export function TextLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <a className="text-link" href={href}>
      {children}
      <ArrowRight size={14} />
    </a>
  );
}
export function useRoute() {
  const [path, setPath] = useState(() => location.hash.slice(1) || "/overview");
  useEffect(() => {
    const change = () => {
      setPath(location.hash.slice(1) || "/overview");
      window.scrollTo({ top: 0 });
    };
    window.addEventListener("hashchange", change);
    return () => window.removeEventListener("hashchange", change);
  }, []);
  const [pathname, search = ""] = path.split("?");
  const [, page, id] = pathname.split("/");
  return {
    page: page || "overview",
    id,
    query: new URLSearchParams(search),
    path,
  };
}
