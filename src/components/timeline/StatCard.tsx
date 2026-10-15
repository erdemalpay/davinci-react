type Props = { label: string; value: React.ReactNode; hint?: string };

export function StatCard({ label, value, hint }: Props) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 px-4 py-3 min-w-[130px]">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-lg font-semibold text-gray-900">{value}</div>
      {hint && <div className="text-xs text-gray-500">{hint}</div>}
    </div>
  );
}
