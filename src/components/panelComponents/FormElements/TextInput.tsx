import { H6 } from "../Typography";
type TextInputProps = {
  label: string;
  placeholder: string;
  type: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
};

const TextInput = ({
  label,
  placeholder,
  value,
  type,
  onChange,
  disabled,
  className = "px-4 py-2.5 border rounded-md __className_a182b8",
}: TextInputProps) => {
  const inputClassName = `${className} text-sm ${
    type === "number" ? "inputHideNumberArrows" : ""
  }`;

  // disable scroll while type is text
  const handleWheel = () => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  };
  return (
    <div className="flex flex-col gap-2">
      <H6>{label}</H6>
      <input
        type={type}
        placeholder={placeholder}
        disabled={disabled}
        value={value}
        {...(type === "number" ? { min: "0", onMouseWheel: handleWheel } : {})}
        onChange={(e) => onChange(e.target.value)}
        className={inputClassName}
        {...(type === "number" ? { onWheel: handleWheel } : {})}
      />
    </div>
  );
};

export default TextInput;
