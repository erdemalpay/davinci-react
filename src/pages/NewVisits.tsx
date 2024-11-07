import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Header } from "../components/header/Header";
import GenericTable from "../components/panelComponents/Tables/GenericTable";
import { useGetUsers } from "../utils/api/user";
import { useGetGivenDateVisits } from "../utils/api/visit";
import { getItem } from "../utils/getItem";

export default function NewVisits() {
  const { t } = useTranslation();
  const users = useGetUsers();
  const [tableKey, setTableKey] = useState(0);
  const [selectedDate, setSelectedDate] = useState<string>("2022-07-02");
  const givenDateVisits = useGetGivenDateVisits(selectedDate);

  const allRows = givenDateVisits?.map((visit) => {
    const foundUser = getItem(visit.user, users);
    return {
      ...visit,
      userName: foundUser?.name,
    };
  });
  const [rows, setRows] = useState<any>(allRows);
  const columns = [{ key: t("Name"), isSortable: true }];
  const rowKeys = [{ key: "userName" }];

  useEffect(() => {
    setRows(allRows);
    setTableKey((prev) => prev + 1);
  }, [givenDateVisits, users]);

  return (
    <>
      <Header showLocationSelector={true} />
      <div className="w-[95%] my-10 mx-auto ">
        <GenericTable
          key={tableKey}
          rowKeys={rowKeys}
          columns={columns}
          rows={rows}
          isActionsActive={false}
        />
      </div>
    </>
  );
}
