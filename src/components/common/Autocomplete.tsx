import { Combobox, Transition } from "@headlessui/react";
import { Input } from "@material-tailwind/react";
import { Fragment, SetStateAction, useState } from "react";
import { TagType } from "../../types";
import { InputWithLabelProps } from "./InputWithLabel";

interface AutocompleteProps<T> extends InputWithLabelProps {
  suggestions?: T[];
  initialValue?: T;
  handleSelection: (item: T) => void;
  showSelected?: boolean;
  handleReset?: () => void;
}

export function Autocomplete<T>({
  suggestions,
  label,
  handleSelection,
  initialValue,
  handleReset,
  showSelected = false,
}: AutocompleteProps<TagType<T>>) {
  const [selected, setSelected] = useState<TagType<T>>();
  const [query, setQuery] = useState(initialValue ? initialValue.name : "");
  const filteredSuggestions =
    query === ""
      ? suggestions
      : suggestions?.filter((suggestion: TagType<T>) => {
          return suggestion?.name
            .replace("İ", "I")
            .toLowerCase()
            .replace(/\s+/g, "")
            .includes(query.toLowerCase().replace(/\s+/g, ""));
        });

  /* We are wrapping Autocomplete component with <form autocomplete="off" /> to prevent second autocomplete coming from browser */
  return (
    <div className="w-full flex">
      <form className="w-full flex" autoComplete="off">
        <Combobox
          value={selected || null}
          nullable
          onChange={(e) => {
            setSelected(e as TagType<T>);
            handleSelection(e as TagType<T>);
          }}
        >
          <div className="relative w-full">
            <div className="relative w-full text-left bg-white rounded-lg cursor-default sm:text-sm">
              <Combobox.Input
                as={Fragment}
                displayValue={(suggestion: TagType<T>) =>
                  suggestion?.name || ""
                }
                onChange={(event: {
                  target: { value: SetStateAction<string> };
                }) => {
                  setQuery(event.target.value);
                  if (event.target.value === "" && handleReset) {
                    handleReset();
                  }
                  setSelected(undefined);
                }}
              >
                <Input
                  variant="standard"
                  className="w-full pr-10 text-sm"
                  /* name={name} */
                  label={label}
                  value={showSelected ? selected?.name || query : query}
                  onFocus={() => setQuery("")}
                />
              </Combobox.Input>
            </div>
            <Transition
              as={Fragment}
              leave="transition ease-in duration-100"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
              afterLeave={() => setQuery("")}
            >
              <Combobox.Options className="absolute z-10 w-full py-1 overflow-auto text-base bg-white rounded-md shadow-lg max-h-60 ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                {filteredSuggestions?.length === 0 && query !== "" ? (
                  <div className="cursor-default select-none relative py-2 px-4 text-gray-700">
                    Nothing found.
                  </div>
                ) : (
                  filteredSuggestions?.map(
                    (suggestion: { _id: any; name: any }) => (
                      <Combobox.Option
                        key={suggestion._id}
                        className={({ active }) =>
                          `cursor-default select-none relative py-2 pl-10 pr-4 text-gray-900 ${
                            active && "bg-gray-100"
                          }`
                        }
                        value={suggestion}
                      >
                        {() => (
                          <>
                            <span className={"block truncate font-normal"}>
                              {suggestion?.name}
                            </span>
                          </>
                        )}
                      </Combobox.Option>
                    )
                  )
                )}
              </Combobox.Options>
            </Transition>
          </div>
        </Combobox>
      </form>
    </div>
  );
}
