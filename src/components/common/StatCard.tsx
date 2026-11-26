type Props = {
  label: string;
  value: React.ReactNode;
  hint?: string;
  variant?: "default" | "large";
};

const variantClasses = {
  default: {
    card: "bg-white rounded-lg border border-gray-200 px-4 py-3 min-w-[130px]",
    label: "text-xs text-gray-500",
    value: "text-lg font-semibold text-gray-900",
    hint: "text-xs text-gray-500",
  },
  large: {
    card: "border border-gray-200 rounded-md p-4 bg-white",
    label: "text-sm text-gray-500",
    value: "text-2xl font-semibold text-gray-800 mt-1",
    hint: "text-xs text-gray-400 mt-1",
  },
};

const StatCard = ({ label, value, hint, variant = "default" }: Props) => {
  const classes = variantClasses[variant];
  return (
    <div className={classes.card}>
      <div className={classes.label}>{label}</div>
      <div className={classes.value}>{value}</div>
      {hint && <div className={classes.hint}>{hint}</div>}
    </div>
  );
};

export default StatCard;
