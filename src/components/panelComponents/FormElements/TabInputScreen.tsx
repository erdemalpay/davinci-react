import { IoIosClose } from "react-icons/io";
import { useGeneralContext } from "../../../context/General.context";
import { FormElementsState } from "../../../types";

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
}
const TabInputScreen = ({
  options,
  topClassName,
  formElements,
  setFormElements,
}: Props) => {
  const {
    isTabInputScreenOpen,
    setIsTabInputScreenOpen,
    setTabInputScreenOptions,
    tabInputFormKey,
  } = useGeneralContext();
  if (!isTabInputScreenOpen) {
    return null;
  }
  const handleClose = () => {
    setIsTabInputScreenOpen(false);
    setTabInputScreenOptions([]);
  };
  const handleSelect = (option: TabOption) => {
    setIsTabInputScreenOpen(false);
    setTabInputScreenOptions([]);
    setFormElements({
      ...formElements,
      [tabInputFormKey]: option.value,
    });
  };
  return (
    <div className={`${topClassName}`}>
      {/*  close button */}
      <div className="w-full  px-2 flex justify-end">
        <button onClick={handleClose}>
          <IoIosClose className="w-8 h-8  p-1 cursor-pointer  hover:bg-gray-50 hover:rounded-full mt-2 ml-auto " />
        </button>
      </div>

      <div className="p-4 overflow-scroll no-scrollbar max-h-[45vh]   ">
        <div className="grid grid-cols-2 gap-4">
          {options?.map((opt) => {
            const isSelected = formElements?.[tabInputFormKey] === opt.value;
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
                    className="w-16 h-16 object-cover rounded-md mb-2"
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
