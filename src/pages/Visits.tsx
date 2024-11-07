import { Tooltip } from "@material-tailwind/react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { MdOutlineBackupTable } from "react-icons/md";
import { Header } from "../components/header/Header";
import DailyVisit from "../components/visits/DailyVisit";
import VisitChart from "../components/visits/VisitChart";

export default function Visits() {
  const [selectedView, setSelectedView] = useState(true);
  const { t } = useTranslation();
  return (
    <>
      <Header showLocationSelector={true} />
      <div className="w-[95%] mt-4 flex justify-end">
        <Tooltip content={t("Switch View")} placement="top">
          <span>
            <MdOutlineBackupTable
              className="w-10 h-10 cursor-pointer"
              onClick={() => setSelectedView(!selectedView)}
            />
          </span>
        </Tooltip>
      </div>

      {selectedView ? <DailyVisit /> : <VisitChart />}
    </>
  );
}
