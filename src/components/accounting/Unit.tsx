import { useGetAccountUnits } from "../../utils/api/account-unit";

type Props = {};

const Unit = (props: Props) => {
  const units = useGetAccountUnits();
  console.log(units);
  return <div>Unit</div>;
};

export default Unit;
