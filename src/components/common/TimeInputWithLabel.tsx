import { format } from "date-fns";

export type InputType = "date" | "autocomplete" | "text" | "number" | "time";

export interface InputWithLabelProps {
  name: string;
  label: string;
  id?: string;
  readOnly?: boolean;
  className?: string;
  min?: number;
  value?: string;
  defaultValue?: string | number;
  bgColor?: string;
  onChange?: (event: React.FormEvent<HTMLInputElement>) => void;
}

export function TimeInputWithLabel({
  label,
  id = label.toLowerCase(),
  onChange,
  min = 1,
  bgColor = "bg-white",
  ...props
}: InputWithLabelProps) {
  return (
    <div className="relative mt-4 w-full">
      <input
        id={id}
        min={min}
        {...props}
        type="time"
        className={`${bgColor} w-full text-gray-600 border-0 border-b-[1px] dark:text-gray-400 focus:outline-none dark:border-gray-700 dark:bg-gray-800 font-normal h-10 text-base border-gray-300`}
        placeholder=""
        onChange={onChange}
      />
      <label
        htmlFor={id}
        className="text-gray-800 dark:text-gray-100 text-xs absolute left-0 -top-2.5"
      >
        {label}
      </label>
    </div>
  );
}
