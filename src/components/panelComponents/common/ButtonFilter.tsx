import { GenericButton } from "../../common/GenericButton";
import { H5 } from "../Typography";

type Props = {
  buttonName: string;
  onclick: () => void;
};

const ButtonFilter = ({ buttonName, onclick }: Props) => {
  return (
    <GenericButton
      className="ml-auto"
      variant="primary"
      size="sm"
      onClick={onclick}
    >
      <H5> {buttonName}</H5>
    </GenericButton>
  );
};

export default ButtonFilter;
