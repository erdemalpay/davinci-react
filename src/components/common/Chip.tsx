import { XMarkIcon } from "@heroicons/react/24/solid";
import { TagType } from "../../types";

export interface ChipProps<T> {
  item: T;
  close: (item: T) => void;
}

export function Chip<T>({ item, close }: ChipProps<TagType<T>>) {
  return (
    <div className="flex flex-wrap justify-center px-4 py-2 rounded-full text-gray-500 bg-gray-200 font-semibold text-sm align-center items-center gap-4 cursor-pointer active:bg-gray-300 transition duration-300 ease">
      <span>{item.name}</span>
      <button
        className="bg-transparent hover focus:outline-none"
        onClick={() => close(item)}
      >
        <XMarkIcon className="h-4 w-4" />
      </button>
    </div>
  );
}
