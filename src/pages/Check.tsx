import { Tooltip } from "@material-tailwind/react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  MdOutlineCheckBox,
  MdOutlineCheckBoxOutlineBlank,
} from "react-icons/md";
import { useNavigate, useParams } from "react-router-dom";
import { ConfirmationDialog } from "../components/common/ConfirmationDialog";
import { Header } from "../components/header/Header";
import PageNavigator from "../components/panelComponents/PageNavigator/PageNavigator";
import GenericTable from "../components/panelComponents/Tables/GenericTable";
import { H5 } from "../components/panelComponents/Typography";
import { useGeneralContext } from "../context/General.context";
import { useUserContext } from "../context/User.context";
import { Routes } from "../navigation/constants";
import { ChecklistPageTabEnum } from "../types";
import { useCheckMutations, useGetChecks } from "../utils/api/checklist/check";
import { useGetChecklists } from "../utils/api/checklist/checklist";
import { getItem } from "../utils/getItem";

const Check = () => {
  const { t, i18n } = useTranslation();
  const { user } = useUserContext();
  const navigate = useNavigate();
  const checks = useGetChecks();
  const { updateCheck } = useCheckMutations();
  const checklists = useGetChecklists();
  const [isConfirmationDialogOpen, setIsConfirmationDialogOpen] =
    useState(false);
  const [tableKey, setTableKey] = useState(0);
  const { resetGeneralContext, setChecklistActiveTab } = useGeneralContext();
  const { location, checklistId } = useParams();
  const currentCheck = checks?.find((item) => {
    return (
      item.isCompleted === false &&
      item.location === Number(location) &&
      item.user === user?._id &&
      item.checklist === checklistId
    );
  });
  const checklistDuties = getItem(checklistId, checklists)?.duties?.filter(
    (item) => item.locations.includes(Number(location))
  );
  const allRows = checklistDuties
    ?.map((dutyItem) => {
      return {
        duty: dutyItem.duty,
        order: dutyItem.order,
        description: dutyItem?.description ?? "",
        isCompleted:
          currentCheck?.duties?.find((item) => item.duty === dutyItem.duty)
            ?.isCompleted ?? false,
      };
    })
    .sort((a, b) => a.order - b.order);
  const [rows, setRows] = useState(allRows);
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
      name: t("Check Page"),
      path: "",
      canBeClicked: false,
    },
  ];
  const columns = [
    { key: t("Duty"), isSortable: true },
    { key: t("Completed"), isSortable: false },
  ];
  const rowKeys = [
    {
      key: "duty",
      node: (row: any) => (
        <div className="flex flex-row items-center gap-2">
          <p className="text-sm text-red-500">{row.order + 1}-</p>
          <p>{row.duty}</p>
          {row.description && (
            <Tooltip
              content={row.description}
              placement="bottom" // shows it below the icon
              className="bg-gray-50 text-black border border-gray-400 p-2 rounded-md text-sm max-w-xs !z-[999999999999999999999] md:ml-2"
            >
              <p className="text-xs text-gray-400 cursor-pointer">(!)</p>
            </Tooltip>
          )}
        </div>
      ),
    },
    {
      key: "isCompleted",
      node: (row: any) =>
        row?.isCompleted ? (
          <MdOutlineCheckBox
            onClick={() => handleComplete(row?.duty, row?.isCompleted)}
            className="my-auto mx-auto text-2xl cursor-pointer hover:scale-105"
          />
        ) : (
          <MdOutlineCheckBoxOutlineBlank
            onClick={() => handleComplete(row?.duty, row?.isCompleted)}
            className="my-auto mx-auto text-2xl cursor-pointer hover:scale-105"
          />
        ),
    },
  ];
  const handleComplete = (duty: string, isCompleted: boolean) => {
    if (!currentCheck) return;
    const filteredDuties = currentCheck.duties.filter((item) => {
      return item.duty !== duty;
    });
    const updatedDuties = [
      ...filteredDuties,
      {
        duty: duty,
        isCompleted: !isCompleted,
      },
    ];
    updateCheck({
      id: currentCheck._id,
      updates: {
        duties: updatedDuties,
      },
    });
  };
  const completeCheck = () => {
    if (!currentCheck) return;
    const updatedDuties = currentCheck.duties;
    if (checklistDuties) {
      for (const item of checklistDuties) {
        if (
          !currentCheck?.duties?.some(
            (currentCheckDutyItem) => currentCheckDutyItem.duty === item.duty
          )
        ) {
          updatedDuties.push({
            duty: item.duty,
            isCompleted: false,
          });
        }
      }
    }
    updateCheck({
      id: currentCheck?._id,
      updates: {
        duties: updatedDuties,
        isCompleted: true,
        completedAt: new Date(),
      },
    });
    setChecklistActiveTab(ChecklistPageTabEnum.CHECKARCHIVE);
    resetGeneralContext();
    navigate(Routes.Checklists);
  };
  useEffect(() => {
    setRows(allRows);
    setTableKey((prev) => prev + 1);
  }, [checklistId, checklists, location, checks, i18n.language]);
  return (
    <>
      <Header />
      <PageNavigator navigations={pageNavigations} />
      <div className="w-[95%] my-10 mx-auto ">
        <GenericTable
          key={tableKey}
          rowKeys={rowKeys}
          columns={columns}
          rows={rows ?? []}
          isToolTipEnabled={false}
          title={t("Checkit")}
          isActionsActive={false}
        />
        <div className="flex justify-end mt-4">
          <button
            className="px-2  bg-blue-500 hover:text-blue-500 hover:border-blue-500 sm:px-3 py-1 h-fit w-fit  text-white  hover:bg-white  transition-transform  border  rounded-md cursor-pointer"
            onClick={() => {
              setIsConfirmationDialogOpen(true);
            }}
          >
            <H5> {t("Complete")}</H5>
          </button>
        </div>
        {isConfirmationDialogOpen && (
          <ConfirmationDialog
            isOpen={isConfirmationDialogOpen}
            close={() => setIsConfirmationDialogOpen(false)}
            confirm={() => {
              completeCheck();
              setIsConfirmationDialogOpen(false);
            }}
            title={t("Complete Check")}
            text={`${t("Are you sure you want to complete the check?")}`}
          />
        )}
      </div>
    </>
  );
};

export default Check;
