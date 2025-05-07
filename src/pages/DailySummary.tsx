import { useTranslation } from "react-i18next";
import { Header } from "../components/header/Header";
import { useLocationContext } from "../context/Location.context";

const DailySummary = () => {
  const { t } = useTranslation();
  const { selectedLocationId } = useLocationContext();

  //   const summaries=useGetDailySummary()

  return (
    <>
      <Header showLocationSelector={true} />
      DailySummary
    </>
  );
};

export default DailySummary;
