export default function Badge({ children, variant = "default", pulse = false }) {
  const cls = [
    "gf-badge",
    `gf-badge-${variant}`,
    pulse ? "gf-badge-pulse" : ""
  ].join(" ");

  return <span className={cls}>{children}</span>;
}
