export type InputType = "date" | "autocomplete" | "text" | "number" | "time";

export interface InputWithLabelProps {
  name?: string;
  label?: string;
  type?: InputType;
  id?: string;
  readOnly?: boolean;
  className?: string;
  min?: number;
  value?: string | number;
  defaultValue?: string | number;
  bgColor?: string;
  hidden?: boolean;
  onChange?: (event: React.FormEvent<HTMLInputElement>) => void;
}

export function InputWithLabel({
  label,
  type = "text",
  id,
  onChange,
  min = 0,
  bgColor = "bg-white",
  hidden = false,
  ...props
}: InputWithLabelProps) {
  return (
    <div className={`relative mt-4 w-full ${hidden ? "hidden" : ""}`}>
      <input
        id={id}
        min={min}
        {...props}
        type={type}
        className={`${bgColor} w-full text-gray-600 border-0 border-b-[1px] focus:outline-none font-normal h-10 text-base border-gray-300`}
        placeholder=""
        onChange={onChange}
      />
      <label
        htmlFor={id}
        className="text-gray-800 text-xs absolute left-0 -top-2.5"
      >
        {label}
      </label>
    </div>
  );
}
