import Gifts from "../components/giftTracking/Gifts";
import { Header } from "../components/header/Header";

const GiftTracking = () => {
  return (
    <>
      <Header showLocationSelector={false} />
      <div className="w-[98%] mx-auto my-10">
        <Gifts />
      </div>
    </>
  );
};

export default GiftTracking;
