import { format } from "date-fns";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { EducationUpdateHistoryDto } from "../../types";
import { useGetUsers } from "../../utils/api/user";
import { getItem } from "../../utils/getItem";

type Props = {
  updateHistory: EducationUpdateHistoryDto[];
};

const UpdateHistory = ({ updateHistory }: Props) => {
  const { t } = useTranslation();
  const users = useGetUsers();
  const [tableKey, setTableKey] = useState(0);
  const allRows = updateHistory.map((history) => {
    return {
      ...history,
      userName: getItem(history.user, users)?.name,
      formattedDate: format(history.updatedAt, "dd-MM-yyyy"),
      before: (history?.updates?.[0] as any)?.before,
      after: (history?.updates?.[0] as any)?.after,
    };
  });
  const [rows, setRows] = useState(allRows);
  const columns = [
    { key: t("Date"), isSortable: true },
    { key: t("User"), isSortable: true },
    { key: t("Before"), isSortable: true },
    { key: t("After"), isSortable: true },
  ];
  const rowKeys = [
    { key: "formattedDate" },
    { key: "userName" },
    { key: "before" },
    { key: "after" },
  ];
  useEffect(() => {
    setRows(allRows);
    setTableKey((prev) => prev + 1);
  }, [updateHistory, users]);
  return <div>UpdateHistory</div>;
};

export default UpdateHistory;
