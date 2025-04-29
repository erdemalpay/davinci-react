import { format } from "date-fns";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { EducationUpdateHistoryDto } from "../../types";
import { useGetUsers } from "../../utils/api/user";
import { getItem } from "../../utils/getItem";
import PageNavigator from "../panelComponents/PageNavigator/PageNavigator";
import GenericTable from "../panelComponents/Tables/GenericTable";

type Props = {
  updateHistory: EducationUpdateHistoryDto[];
  setIsUpdateHistoryOpen: (value: boolean) => void;
};

const UpdateHistory = ({ updateHistory, setIsUpdateHistoryOpen }: Props) => {
  const { t } = useTranslation();
  const users = useGetUsers();
  const [tableKey, setTableKey] = useState(0);
  const allRows = updateHistory.map((history) => {
    return {
      ...history,
      userName: getItem(history.user, users)?.name,
      formattedDate: format(history.updatedAt, "dd-MM-yyyy"),
      updates: JSON.stringify(history.updates),
    };
  });
  const [rows, setRows] = useState(allRows);
  const columns = [
    { key: t("Date"), isSortable: true },
    { key: t("User"), isSortable: true },
    { key: t("Updates"), isSortable: true },
  ];
  const rowKeys = [
    { key: "formattedDate" },
    { key: "userName" },
    { key: "updates" },
  ];
  const pageNavigations = [
    {
      name: t("Education"),
      path: "",
      canBeClicked: true,
      additionalSubmitFunction: () => {
        setIsUpdateHistoryOpen(false);
      },
    },
    {
      name: t("Update History"),
      path: "",
      canBeClicked: false,
    },
  ];
  useEffect(() => {
    setRows(allRows);
    console.log("allRows", allRows);
    setTableKey((prev) => prev + 1);
  }, [updateHistory, users]);
  return (
    <>
      <PageNavigator navigations={pageNavigations} />
      <div className="w-[95%] mx-auto mt-4">
        <GenericTable
          key={tableKey}
          rowKeys={rowKeys}
          columns={columns}
          rows={rows}
          title={t("Update History")}
          isActionsActive={false}
          isToolTipEnabled={false}
        />
      </div>
    </>
  );
};

export default UpdateHistory;
