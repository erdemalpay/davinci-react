import { useNavigate } from "react-router-dom";
import { Header } from "../components/header/Header";
const CountList = () => {
  const navigate = useNavigate();
  return (
    <>
      <Header showLocationSelector={false} />
      <div className="flex flex-col gap-4">CountList</div>
    </>
  );
};

export default CountList;
