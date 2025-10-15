import { useTranslation } from "react-i18next";

type Props = {
  onChange: (value: string) => void;
  value: string;
  placeholder?: string;
};

const SearchInput = ({ onChange, value, placeholder }: Props) => {
  const { t } = useTranslation();
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => {
        onChange(e.target.value);
      }}
      placeholder={placeholder ?? t("Search")}
      className="border border-gray-200 rounded-md py-2 px-3 w-full focus:outline-none focus:border-blue-500 transition-colors"
    />
  );
};

export default SearchInput;
