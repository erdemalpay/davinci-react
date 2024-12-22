import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { IoCheckmark, IoCloseOutline } from "react-icons/io5";
import { useParams } from "react-router-dom";
import { Header } from "../components/header/Header";
import PageNavigator from "../components/panelComponents/PageNavigator/PageNavigator";
import GenericTable from "../components/panelComponents/Tables/GenericTable";
import { H5 } from "../components/panelComponents/Typography";
import { useGeneralContext } from "../context/General.context";
import { Routes } from "../navigation/constants";
import { useCheckMutations, useGetChecks } from "../utils/api/checklist/check";
import { useGetChecklists } from "../utils/api/checklist/checklist";
import { useGetUsers } from "../utils/api/user";
import { getItem } from "../utils/getItem";

const SingleCheckArchive = () => {
  const { t } = useTranslation();
  const { archiveId } = useParams();
  const [tableKey, setTableKey] = useState(0);
  const checks = useGetChecks();
  const checklists = useGetChecklists();
  const users = useGetUsers();
  const { updateCheck } = useCheckMutations();
  const pad = (num: number) => (num < 10 ? `0${num}` : num);
  const { resetGeneralContext } = useGeneralContext();
  const foundCheck = checks?.find((check) => check._id === archiveId);
  const pageNavigations = [
    {
      name: t("Check Archive"),
      path: Routes.Checklists,
      canBeClicked: true,
      additionalSubmitFunction: () => {
        resetGeneralContext();
      },
    },
    {
      name:
        getItem(foundCheck?.checklist, checklists)?.name + " " + t("Checku"),
      path: `/check-archive/${archiveId}`,
      canBeClicked: false,
    },
  ];
  const currentCheck = checks?.find((check) => check._id === archiveId);
  const allRows = () => {
    if (!currentCheck) return [];
    const date = new Date(currentCheck.createdAt);
    const formattedDate = `${pad(date.getDate())}-${pad(
      date.getMonth() + 1
    )}-${date.getFullYear()}`;
    return currentCheck.duties?.map((option) => {
      return {
        currentCheckId: currentCheck._id,
        currentCheckLocationId: currentCheck.location,
        duty: option.duty,
        isCompleted: option.isCompleted,
        date: formattedDate,
      };
    });
  };

  const [rows, setRows] = useState(allRows());
  const columns = [
    { key: t("Date"), isSortable: true },
    { key: t("Duty"), isSortable: true },
    { key: t("Completed"), isSortable: true },
  ];
  const rowKeys = [
    { key: "date", className: "min-w-32" },
    { key: "duty" },
    {
      key: "isCompleted",
      node: (row: any) => {
        return row.isCompleted ? (
          <IoCheckmark className="text-blue-500 text-2xl" />
        ) : (
          <IoCloseOutline className="text-red-800 text-2xl" />
        );
      },
    },
  ];
  const filters = [
    {
      isUpperSide: false,
      node: (
        <button
          className="px-2 ml-auto bg-blue-500 hover:text-blue-500 hover:border-blue-500 sm:px-3 py-1 h-fit w-fit  text-white  hover:bg-white  transition-transform  border  rounded-md cursor-pointer"
          onClick={() => {
            if (archiveId) {
              updateCheck({
                id: archiveId,
                updates: {
                  isCompleted: true,
                },
              });
            }
          }}
        >
          <H5> {t("Complete")}</H5>
        </button>
      ),
    },
  ];
  useEffect(() => {
    setRows(allRows());
    setTableKey((prev) => prev + 1);
  }, [checks, archiveId, checklists, users]);
  return (
    <>
      <Header />
      <PageNavigator navigations={pageNavigations} />
      <div className="w-[95%] mx-auto my-10 ">
        {foundCheck && (
          <GenericTable
            key={tableKey}
            rowKeys={rowKeys}
            columns={columns}
            isToolTipEnabled={false}
            rows={rows}
            isActionsActive={false}
            filters={foundCheck && !foundCheck.isCompleted ? filters : []}
            title={`${getItem(foundCheck?.user, users)?.name}  ${t("Checku")}`}
          />
        )}
      </div>
    </>
  );
};

export default SingleCheckArchive;
