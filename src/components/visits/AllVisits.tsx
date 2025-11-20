import { format, startOfMonth } from "date-fns";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { HiOutlineTrash } from "react-icons/hi2";
import { useFilterContext } from "../../context/Filter.context";
import { useUserContext } from "../../context/User.context";
import { DateRangeKey, RoleEnum, commonDateOptions } from "../../types";
import { dateRanges } from "../../utils/api/dateRanges";
import { useGetStoreLocations } from "../../utils/api/location";
import { useGetUsersMinimal } from "../../utils/api/user";
import { useGetFilteredVisits, useVisitMutation } from "../../utils/api/visit";
import { convertDateFormat } from "../../utils/format";
import { getItem } from "../../utils/getItem";
import { ConfirmationDialog } from "../common/ConfirmationDialog";
import GenericTable from "../panelComponents/Tables/GenericTable";
import SwitchButton from "../panelComponents/common/SwitchButton";
import { InputTypes } from "../panelComponents/shared/types";

const AllVisits = () => {
  const { t } = useTranslation();
  const { user } = useUserContext();
  const users = useGetUsersMinimal();
  const locations = useGetStoreLocations();
  const { deleteVisit } = useVisitMutation();
  const [
    isCloseAllConfirmationDialogOpen,
    setIsCloseAllConfirmationDialogOpen,
  ] = useState(false);
  const [rowToAction, setRowToAction] = useState<any>();
  const initialFilterPanelFormElements = {
    date: "",
    after: format(startOfMonth(new Date()), "yyyy-MM-dd"),
    before: "",
    user: "",
    location: "",
  };
  const {
    filterAllVisitsPanelFormElements,
    setFilterAllVisitsPanelFormElements,
    showAllVisitsFilters,
    setShowAllVisitsFilters,
  } = useFilterContext();

  const visits = useGetFilteredVisits(
    filterAllVisitsPanelFormElements.after,
    filterAllVisitsPanelFormElements.before
  );

  const isDisabledCondition = useMemo(() => {
    return user && ![RoleEnum.MANAGER].includes(user?.role?._id);
  }, [user]);

  const rows = useMemo(() => {
    const allRows = visits
      ?.filter((visit) => {
        if (filterAllVisitsPanelFormElements.user !== "") {
          return visit.user === filterAllVisitsPanelFormElements.user;
        }
        if (filterAllVisitsPanelFormElements.location !== "") {
          return visit.location === filterAllVisitsPanelFormElements.location;
        }
        return true;
      })
      ?.map((visit) => {
        const foundUser = getItem(visit.user, users);
        const foundLocation = getItem(visit.location, locations);
        return {
          ...visit,
          formattedDate: convertDateFormat(visit.date),
          userName: foundUser?.name,
          locationName: foundLocation?.name,
          userRole: foundUser?.role?.name,
          finishHour: visit?.finishHour ?? " ",
        };
      });
    return allRows || [];
  }, [visits, filterAllVisitsPanelFormElements, users, locations]);

  const columns = useMemo(() => {
    const baseColumns = [
      { key: t("User"), isSortable: true, correspondingKey: "userName" },
      { key: t("Role"), isSortable: true, correspondingKey: "userRole" },
      {
        key: t("Location"),
        isSortable: true,
        correspondingKey: "locationName",
      },
      { key: t("Date"), isSortable: true, correspondingKey: "formattedDate" },
      { key: t("Start Hour"), isSortable: true, correspondingKey: "startHour" },
      {
        key: t("Finish Hour"),
        isSortable: true,
        correspondingKey: "finishHour",
      },
    ];
    if (!isDisabledCondition) {
      baseColumns.push({ key: t("Actions"), isSortable: false } as any);
    }
    return baseColumns;
  }, [t, isDisabledCondition]);

  const rowKeys = useMemo(
    () => [
      { key: "userName" },
      { key: "userRole" },
      { key: "locationName" },
      {
        key: "date",
        node: (row: any) => {
          return <p className="min-w-32 pr-2">{row.formattedDate}</p>;
        },
      },
      { key: "startHour" },
      { key: "finishHour" },
    ],
    []
  );

  const filters = useMemo(
    () => [
      {
        label: t("Show Filters"),
        isUpperSide: true,
        node: (
          <SwitchButton
            checked={showAllVisitsFilters}
            onChange={() => {
              setShowAllVisitsFilters(!showAllVisitsFilters);
            }}
          />
        ),
      },
    ],
    [t, showAllVisitsFilters, setShowAllVisitsFilters]
  );

  const actions = useMemo(
    () => [
      {
        name: t("Delete"),
        icon: <HiOutlineTrash />,
        setRow: setRowToAction,
        modal: rowToAction ? (
          <ConfirmationDialog
            isOpen={isCloseAllConfirmationDialogOpen}
            close={() => setIsCloseAllConfirmationDialogOpen(false)}
            confirm={() => {
              deleteVisit(rowToAction?._id);
              setIsCloseAllConfirmationDialogOpen(false);
            }}
            title={t("Delete Visit")}
            text={`${t("Visit")} ${t("GeneralDeleteMessage")}`}
          />
        ) : null,
        className: "text-red-500 cursor-pointer text-2xl ",
        isModal: true,
        isModalOpen: isCloseAllConfirmationDialogOpen,
        setIsModal: setIsCloseAllConfirmationDialogOpen,
        isPath: false,
        isDisabled: isDisabledCondition,
      },
    ],
    [
      t,
      rowToAction,
      isCloseAllConfirmationDialogOpen,
      deleteVisit,
      isDisabledCondition,
    ]
  );

  const filterPanelInputs = useMemo(
    () => [
      {
        type: InputTypes.SELECT,
        formKey: "date",
        label: t("Date"),
        options: commonDateOptions.map((option) => {
          return {
            value: option.value,
            label: t(option.label),
          };
        }),
        placeholder: t("Date"),
        required: true,
        additionalOnChange: ({
          value,
          label,
        }: {
          value: string;
          label: string;
        }) => {
          const dateRange = dateRanges[value as DateRangeKey];
          if (dateRange) {
            setFilterAllVisitsPanelFormElements({
              ...filterAllVisitsPanelFormElements,
              ...dateRange(),
            });
          }
        },
      },
      {
        type: InputTypes.DATE,
        formKey: "after",
        label: t("Start Date"),
        placeholder: t("Start Date"),
        required: true,
        isDatePicker: true,
        invalidateKeys: [{ key: "date", defaultValue: "" }],
        isOnClearActive: false,
      },
      {
        type: InputTypes.DATE,
        formKey: "before",
        label: t("End Date"),
        placeholder: t("End Date"),
        required: true,
        isDatePicker: true,
        invalidateKeys: [{ key: "date", defaultValue: "" }],
        isOnClearActive: false,
      },
      {
        type: InputTypes.SELECT,
        formKey: "location",
        label: t("Location"),
        options: locations.map((input) => ({
          value: input._id,
          label: input.name,
        })),
        placeholder: t("Location"),
        required: true,
      },
      {
        type: InputTypes.SELECT,
        formKey: "user",
        label: t("User"),
        options: users.map((user) => {
          return {
            value: user._id,
            label: user.name,
          };
        }),
        placeholder: t("User"),
        required: true,
      },
    ],
    [
      t,
      filterAllVisitsPanelFormElements,
      setFilterAllVisitsPanelFormElements,
      locations,
      users,
    ]
  );

  const filterPanel = useMemo(
    () => ({
      isFilterPanelActive: showAllVisitsFilters,
      inputs: filterPanelInputs,
      formElements: filterAllVisitsPanelFormElements,
      setFormElements: setFilterAllVisitsPanelFormElements,
      closeFilters: () => setShowAllVisitsFilters(false),
      additionalFilterCleanFunction: () => {
        setFilterAllVisitsPanelFormElements(initialFilterPanelFormElements);
      },
    }),
    [
      showAllVisitsFilters,
      filterPanelInputs,
      filterAllVisitsPanelFormElements,
      setFilterAllVisitsPanelFormElements,
      setShowAllVisitsFilters,
      initialFilterPanelFormElements,
    ]
  );

  return (
    <>
      <div className="w-[95%] my-5 mx-auto ">
        <GenericTable
          rowKeys={rowKeys}
          columns={columns}
          rows={rows}
          isActionsActive={!isDisabledCondition}
          filterPanel={filterPanel}
          filters={filters}
          title={t("All Visits")}
          actions={!isDisabledCondition ? actions : []}
          isExcel={true}
          excelFileName={`Visits.xlsx`}
        />
      </div>
    </>
  );
};
export default AllVisits;
