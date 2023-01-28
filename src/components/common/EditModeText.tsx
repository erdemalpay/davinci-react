import { FormEvent, useState } from "react";

interface Props<T> {
  text: string;
  onUpdate: (_: FormEvent<HTMLInputElement>, item?: T) => void;
  name: string;
  editMode: boolean;
  item?: T;
  type?: string;
}

export function EditModeText<T>({
  text,
  onUpdate,
  item,
  name,
  editMode,
  type = "text",
}: Props<T>) {
  const [value, setValue] = useState(text);

  return !editMode ? (
    <span>{text}</span>
  ) : (
    <input
      name={name}
      className="bg-white text-gray-600 border-0 border-b-[1px] focus:outline-none font-normal text-base border-gray-300"
      placeholder={text}
      type={type}
      value={value}
      onChange={(event) => setValue(event.target.value)}
      onBlur={(event) => {
        onUpdate(event, item);
      }}
      onKeyPress={(event) => {
        if (event.key === "Enter") {
          onUpdate(event, item);
        }
      }}
    />
  );
}
