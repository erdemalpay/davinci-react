import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { IoCheckmark, IoCloseOutline } from "react-icons/io5";
import { useParams } from "react-router-dom";
import { GenericButton } from "../components/common/GenericButton";
import { Header } from "../components/header/Header";
import PageNavigator from "../components/panelComponents/PageNavigator/PageNavigator";
import GenericTable from "../components/panelComponents/Tables/GenericTable";
import { H5 } from "../components/panelComponents/Typography";
import { useGeneralContext } from "../context/General.context";
import { Routes } from "../navigation/constants";
import { useCheckMutations, useGetChecks } from "../utils/api/checklist/check";
import { useGetChecklists } from "../utils/api/checklist/checklist";
import { useGetUsersMinimal } from "../utils/api/user";
import { getItem } from "../utils/getItem";

const SingleCheckArchive = () => {
  const { t } = useTranslation();
  const { archiveId } = useParams();
  const checks = useGetChecks();
  const checklists = useGetChecklists();
  const users = useGetUsersMinimal();
  const { updateCheck } = useCheckMutations();
  const pad = (num: number) => (num < 10 ? `0${num}` : num);
  const { resetGeneralContext } = useGeneralContext();

  const foundCheck = useMemo(() => {
    return checks?.find((check) => check._id === archiveId);
  }, [checks, archiveId]);

  const currentCheck = useMemo(() => {
    return checks?.find((check) => check._id === archiveId);
  }, [checks, archiveId]);

  const pageNavigations = useMemo(
    () => [
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
    ],
    [t, foundCheck, checklists, archiveId, resetGeneralContext]
  );

  const rows = useMemo(() => {
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
  }, [currentCheck, pad]);

  const columns = useMemo(
    () => [
      { key: t("Date"), isSortable: true },
      { key: t("Duty"), isSortable: true },
      { key: t("Completed"), isSortable: true },
    ],
    [t]
  );

  const rowKeys = useMemo(
    () => [
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
    ],
    []
  );

  const filters = useMemo(
    () => [
      {
        isUpperSide: false,
        node: (
          <GenericButton
            className="ml-auto"
            variant="primary"
            size="sm"
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
          </GenericButton>
        ),
      },
    ],
    [t, archiveId, updateCheck]
  );

  return (
    <>
      <Header />
      <PageNavigator navigations={pageNavigations} />
      <div className="w-[95%] mx-auto my-10 ">
        {foundCheck && (
          <GenericTable
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
