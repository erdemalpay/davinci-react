import { IoIosClose } from "react-icons/io";
import { MdOutlineDone } from "react-icons/md";
import { useGeneralContext } from "../../../context/General.context";

export type TapOption = {
  value: any;
  label: string;
  imageUrl?: string;
};

interface Props {
  options: TapOption[];
  selectedValue: { value: any; label: string } | null;
  onChange: (
    option: TapOption,
    actionMeta: { action: "select-option"; option: TapOption }
  ) => void;
}
const TapInputScreen = ({ options, selectedValue, onChange }: Props) => {
  const { isTapInputScreenOpen, setIsTapInputScreenOpen } = useGeneralContext();

  if (!isTapInputScreenOpen) {
    return null;
  }

  const handleClose = () => {
    setIsTapInputScreenOpen(false);
  };

  const handleSelect = (option: TapOption) => {
    const actionMeta = { action: "select-option" as const, option };
    onChange(option, actionMeta);
    setIsTapInputScreenOpen(false);
  };

  return (
    <div
      className="
        fixed inset-0 z-50 
        bg-black bg-opacity-40 
        flex flex-col items-center justify-center
      "
    >
      <div className="relative bg-white w-11/12 max-w-md h-5/6 rounded-lg shadow-lg overflow-hidden">
        {/* Header bar with title + close button */}
        <div className="flex items-center justify-between px-4 py-2 border-b">
          <h2 className="text-lg font-semibold">Choose an option</h2>
          <button
            onClick={handleClose}
            className="text-2xl text-gray-600 hover:text-gray-900"
          >
            <IoIosClose />
          </button>
        </div>
        <div className="p-4 overflow-y-auto h-full">
          <div className="grid grid-cols-2 gap-4">
            {options.map((opt) => {
              const isSelected = selectedValue?.value === opt.value;
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
                  {isSelected && (
                    <MdOutlineDone className="absolute top-2 right-2 text-blue-700 text-xl" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TapInputScreen;
