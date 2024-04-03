import { IoIosClose } from "react-icons/io";
import { MdOutlineDone } from "react-icons/md";
import Select, {
  ActionMeta,
  GroupBase,
  MultiValue,
  OptionProps,
  PropsValue,
  SingleValue,
  components,
} from "react-select";
import { H6 } from "../Typography";

const CustomOption = (
  props: OptionProps<
    { value: string; label: string },
    boolean,
    GroupBase<{ value: string; label: string }>
  >
) => (
  <components.Option {...props}>
    {props.label}
    {props.isSelected && (
      <MdOutlineDone className="text-blue-700 font-bold text-xl" />
    )}
  </components.Option>
);

type OptionType = { value: string; label: string };
interface SelectInputProps {
  label: string;
  options: OptionType[];
  value: PropsValue<OptionType>;
  onChange: (
    value: SingleValue<OptionType> | MultiValue<OptionType>,
    actionMeta: ActionMeta<OptionType>
  ) => void;
  onClear?: () => void;
  placeholder: string;
  isMultiple?: boolean;
}

const SelectInput = ({
  label,
  options,
  value,
  onChange,
  isMultiple,
  placeholder,
  onClear,
}: SelectInputProps) => {
  const customStyles = {
    control: (base: any) => ({
      ...base,
      border: "1px solid #E2E8F0",
      borderRadius: "4px",
      fontSize: "14px",
    }),
    option: (base: any, state: any) => ({
      ...base,
      borderRadius: "6px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      color: "#4B5563",
      backgroundColor: state.isSelected ? "#EDF7FF" : base.backgroundColor,
      ":hover": {
        color: "#0057FF",
      },
    }),
    placeholder: (base: any) => ({
      ...base,
      color: "#b0b5ba",
      fontSize: "14px",
      fontWeight: 400,
    }),
  };

  return (
    <div className="flex flex-col gap-2 __className_a182b8">
      <H6>{label}</H6>
      <div className="flex flex-row gap-2 w-full ">
        <div className="w-full">
          {isMultiple ? (
            <Select
              isMulti
              options={options}
              onChange={onChange}
              value={value}
              components={{ Option: CustomOption }}
              placeholder={placeholder}
              styles={customStyles}
            />
          ) : (
            <Select
              options={options}
              onChange={(value, actionMeta) => onChange(value, actionMeta)}
              value={value}
              components={{ Option: CustomOption }}
              placeholder={placeholder}
              styles={customStyles}
            />
          )}
        </div>

        {!isMultiple && value && onClear && (
          <button
            onClick={onClear}
            className=" w-8 h-8 my-auto text-2xl text-gray-500 hover:text-red-700"
          >
            <IoIosClose />
          </button>
        )}
      </div>
    </div>
  );
};

export default SelectInput;
