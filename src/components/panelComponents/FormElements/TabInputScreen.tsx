import { useRef, useState } from "react";
import { IoIosClose } from "react-icons/io";
import { useGeneralContext } from "../../../context/General.context";
import { FormElementsState } from "../../../types";
import { GenericInputType, InputTypes } from "../shared/types";

export type TabOption = {
  value: any;
  label: string;
  imageUrl?: string;
};

interface Props {
  options: TabOption[];
  topClassName?: string;
  formElements: FormElementsState;
  setFormElements: (value: FormElementsState) => void;
  inputs: GenericInputType[];
  setForm?: (value: FormElementsState) => void;
}

const normalizeText = (text: string) =>
  text
    .toLowerCase()
    .replace(/ı/g, "i")
    .replace(/i̇/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c");

const TabInputScreen = ({
  options,
  topClassName,
  formElements,
  setFormElements,
  inputs,
  setForm,
}: Props) => {
  const {
    isTabInputScreenOpen,
    setIsTabInputScreenOpen,
    setTabInputScreenOptions,
    tabInputFormKey,
    tabInputInvalidateKeys,
    setTabInputFormKey,
    setTabInputInvalidateKeys,
  } = useGeneralContext();
  const [searchTerm, setSearchTerm] = useState("");
  if (!isTabInputScreenOpen) return null;
  const handleClose = () => {
    setIsTabInputScreenOpen(false);
    setTabInputScreenOptions([]);
  };
  const listRef = useRef<HTMLDivElement>(null);
  const handleSelect = (option: TabOption) => {
    setFormElements((prev: FormElementsState) => ({
      ...prev,
      [tabInputFormKey]: option.value,
    }));

    setForm?.((prev: FormElementsState) => ({
      ...prev,
      [tabInputFormKey]: option.value,
    }));
    if (tabInputInvalidateKeys) {
      tabInputInvalidateKeys.forEach((key) => {
        setFormElements((prev: FormElementsState) => ({
          ...prev,
          [key.key]: key.defaultValue,
        }));
      });
    }
    const changedInput = inputs.find(
      (input) => input.formKey === tabInputFormKey
    );
    if (
      changedInput?.triggerTabOpenOnChangeFor &&
      changedInput?.handleTriggerTabOptions
    ) {
      const targetKey = changedInput.triggerTabOpenOnChangeFor;
      const targetInput = inputs.find((i) => i.formKey === targetKey);
      if (targetInput?.type === InputTypes.TAB) {
        setTabInputScreenOptions(
          changedInput?.handleTriggerTabOptions(option.value) ??
            targetInput.options
        );
        listRef?.current?.scrollTo({ top: 0, behavior: "smooth" });
        setTabInputFormKey(targetInput.formKey);
        setTabInputInvalidateKeys(targetInput.invalidateKeys ?? []);
      }
    } else {
      setIsTabInputScreenOpen(false);
      setTabInputScreenOptions([]);
    }
  };

  const filtered = options.filter((opt) =>
    normalizeText(opt.label).includes(normalizeText(searchTerm))
  );
  const lower = normalizeText(searchTerm);
  const sortedFiltered = [...filtered].sort((a, b) => {
    const aStarts = normalizeText(a.label).startsWith(lower);
    const bStarts = normalizeText(b.label).startsWith(lower);
    if (aStarts && !bStarts) return -1;
    if (bStarts && !aStarts) return 1;
    return a.label.localeCompare(b.label);
  });
  return (
    <div className={`${topClassName} bg-white rounded-lg shadow-lg p-2`}>
      {/* header: search + close */}
      <div className="w-full px-2 flex justify-between items-center">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search..."
          className="flex-1 border border-gray-300 rounded px-3 py-2 mr-2 mt-2"
        />
        <button onClick={handleClose}>
          <IoIosClose className="w-8 h-8 p-1 cursor-pointer hover:bg-gray-50 hover:rounded-full" />
        </button>
      </div>

      <div
        ref={listRef}
        className="p-2 overflow-y-auto no-scrollbar max-h-[45vh] sm:max-h-full"
      >
        <div className="grid grid-cols-2 gap-4">
          {sortedFiltered.map((opt) => {
            const isSelected = formElements[tabInputFormKey] === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => handleSelect(opt)}
                className={`
                  relative flex flex-col items-center justify-center
                  border rounded-lg p-3
                  hover:shadow-lg focus:outline-none
                  ${
                    isSelected
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 bg-white"
                  }
                `}
              >
                {opt.imageUrl && (
                  <img
                    src={opt.imageUrl}
                    alt={opt.label}
                    className="w-16 h-16 object-cover rounded-md mb-2 hidden sm:block"
                  />
                )}
                <span className="text-gray-800 text-center">{opt.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TabInputScreen;
