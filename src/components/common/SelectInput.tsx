import { MdOutlineDone } from "react-icons/md";
import Select, {
  ActionMeta,
  CSSObjectWithLabel,
  GroupBase,
  OptionProps,
  SingleValue,
  components,
} from "react-select";

const CustomOption = (
  props: OptionProps<
    { value: string; label: string },
    false,
    GroupBase<{ value: string; label: string }>
  >
) => {
  return (
    <components.Option {...props}>
      {props.label}
      {props.isSelected && (
        <MdOutlineDone className="text-blue-700 font-bold text-xl" />
      )}
    </components.Option>
  );
};

type Props = {
  label?: string;
  options: { value: string; label: string }[];
  value: SingleValue<{ value: string; label: string }>;
  onChange: (
    value: SingleValue<{ value: string; label: string }>,
    actionMeta: ActionMeta<{ value: string; label: string }>
  ) => void;
  placeholder: string;
};

const SelectInput = ({
  label,
  options,
  value,
  onChange,
  placeholder,
}: Props) => {
  const customStyles = {
    control: (base: CSSObjectWithLabel) => ({
      ...base,
      border: "1px solid #E2E8F0",
      borderRadius: "4px",
    }),
    option: (
      base: CSSObjectWithLabel,
      state: OptionProps<
        { value: string; label: string },
        false,
        GroupBase<{ value: string; label: string }>
      >
    ) => ({
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
    placeholder: (base: CSSObjectWithLabel) => ({
      ...base,
      color: "#b0b5ba",
      fontSize: "14px",
      fontWeight: 400,
    }),
  };

  return (
    <div className="flex flex-col gap-2 mt-4 __className_a182b8">
      {label && <label className="font-medium text-gray-900">{label}</label>}
      <Select
        options={options}
        onChange={onChange}
        value={value}
        components={{ Option: CustomOption }}
        placeholder={placeholder}
        styles={customStyles}
      />
    </div>
  );
};

export default SelectInput;
