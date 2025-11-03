import { GenericButton } from "../../common/GenericButton";
import { H5 } from "../Typography";

type Props = {
  buttonName: string;
  onclick: () => void;
  backgroundColor?: string;
  isActive?: boolean;
};

const ButtonFilter = ({ buttonName, onclick, backgroundColor, isActive }: Props) => {
  return (
    <GenericButton
      className={`ml-auto transition-all ${
        isActive
          ? 'shadow-[4px_6px_10px_rgba(0,0,0,0.5),-4px_6px_10px_rgba(0,0,0,0.5),0_6px_10px_rgba(0,0,0,0.5)]'
          : 'hover:scale-105'
      }`}
      variant="primary"
      size="sm"
      onClick={onclick}
      style={backgroundColor ? { backgroundColor } : undefined}
    >
      <H5> {buttonName}</H5>
    </GenericButton>
  );
};

export default ButtonFilter;
