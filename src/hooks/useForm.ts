import { useState } from "react";

export function useForm<T>(initialData: T) {
  const [data, setData] = useState<T>(initialData);
  function handleUpdate(event: React.FormEvent<HTMLInputElement>) {
    const target = event.target as HTMLInputElement;
    const value = target.type === "checkbox" ? target.checked : target.value;
    const name = target.name;
    setData({ ...data, [name]: value });
  }
  return {
    handleUpdate,
    data,
    setData,
  };
}
