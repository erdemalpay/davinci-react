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
}: SelectInputProps) => {
  const customStyles = {
    control: (base: any) => ({
      ...base,
      border: "1px solid #E2E8F0",
      borderRadius: "4px",
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
  );
};

export default SelectInput;
