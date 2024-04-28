import { useTranslation } from "react-i18next";
import { H5 } from "../Typography";

type Props = {
  buttonName: string;
  onclick: () => void;
};

const ButtonFilter = ({ buttonName, onclick }: Props) => {
  const { t } = useTranslation();
  return (
    <button
      className="px-2 ml-auto bg-blue-500 hover:text-blue-500 hover:border-blue-500 sm:px-3 py-1 h-fit w-fit  text-white  hover:bg-white  transition-transform  border  rounded-md cursor-pointer"
      onClick={onclick}
    >
      <H5> {t(buttonName)}</H5>
    </button>
  );
};

export default ButtonFilter;
