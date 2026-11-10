// Re-mounts on every screen change (not on filter changes): a 200ms fade with a 4px rise,
// so the click is felt to land. Turned off by "reduce motion".
export default function DashboardTemplate({ children }: { children: React.ReactNode }) {
  return <div className="screen-in">{children}</div>;
}
