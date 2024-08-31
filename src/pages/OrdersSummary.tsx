import { Header } from "../components/header/Header";
import SummaryCard from "../components/orders/ordersSummary/SummaryCard";

const OrdersSummary = () => {
  return (
    <>
      <Header showLocationSelector={true} />
      <div className="w-1/4 mx-auto my-20">
        <SummaryCard
          header={"Aktif Sube Sayisi"}
          firstSubHeader={"Aktif Sube Sayisi"}
          firstSubHeaderValue={5}
          secondSubHeader={"Toplam Sube Sayisi"}
          secondSubHeaderValue={10}
          percentage={-50}
          sideColor={"#1D4ED8"}
        />
      </div>
    </>
  );
};

export default OrdersSummary;
