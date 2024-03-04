import { H6 } from "../Typography";
type TextInputProps = {
  label: string;
  placeholder: string;
  type: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
};

const TextInput = ({
  label,
  placeholder,
  value,
  type,
  onChange,
  className = "px-4 py-2.5 border rounded-md __className_a182b8",
}: TextInputProps) => {
  return (
    <div className="flex flex-col gap-2">
      <H6>{label}</H6>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={className}
        {...(type === "number" ? { min: "0" } : {})}
      />
    </div>
  );
};

export default TextInput;
