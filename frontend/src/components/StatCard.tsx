export default function StatCard({
  label,
  value,
  hint,
  accent = "lavender",
}: {
  label: string;
  value: string | number;
  hint?: string;
  accent?: "lavender" | "emerald" | "amber" | "rose";
}) {
  const accentClasses: Record<string, string> = {
    lavender: "bg-lavender-100 text-lavender-700",
    emerald: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    rose: "bg-rose-50 text-rose-700",
  };
  return (
    <div className="card card-hover animate-fadeUp">
      <div className={`inline-flex w-9 h-9 rounded-lg items-center justify-center mb-3 ${accentClasses[accent]}`}>
        <div className="w-2.5 h-2.5 rounded-full bg-current" />
      </div>
      <div className="text-2xl font-bold text-ink-900">{value}</div>
      <div className="text-sm text-ink-500 mt-0.5">{label}</div>
      {hint && <div className="text-xs text-lavender-600 mt-2">{hint}</div>}
    </div>
  );
}
