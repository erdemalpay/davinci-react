import { format } from "date-fns";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Header } from "../components/header/Header";
import GenericTable from "../components/panelComponents/Tables/GenericTable";
import SwitchButton from "../components/panelComponents/common/SwitchButton";
import { InputTypes } from "../components/panelComponents/shared/types";
import { useFilterContext } from "../context/Filter.context";
import { useGeneralContext } from "../context/General.context";
import { Activity, activityTypeDetails, commonDateOptions } from "../types";
import { useGetActivities } from "../utils/api/activity";
import { useGetUsersMinimal } from "../utils/api/user";
import { formatAsLocalDate } from "../utils/format";
import { getItem } from "../utils/getItem";

type CollapsibleRow = {
  collapsibleColumns: { key: string; isSortable: boolean }[];
  collapsibleRows: { payload: any }[]; // payload can be any type
  collapsibleRowKeys: {
    key: string;
    node: (row: any) => React.ReactNode;
  }[];
};
type ActivityRow = Activity & {
  userName?: string;
  userId?: string | number;
  createdDate: string;
  formattedCreatedDate: string;
  createHour: string;
  collapsible: CollapsibleRow;
};
const UserActivities = () => {
  const { t } = useTranslation();
  const {
    filterActivityFormElements,
    setFilterActivityFormElements,
    showActivityFilters,
    setShowActivityFilters,
    initialFilterActivityFormElements,
  } = useFilterContext();
  const { rowsPerPage, currentPage, setCurrentPage } = useGeneralContext();
  const activitiesPayload = useGetActivities(
    currentPage,
    rowsPerPage,
    filterActivityFormElements
  );
  const users = useGetUsersMinimal();

  const rows = useMemo(() => {
    return activitiesPayload?.data?.map((activity) => {
      return {
        ...activity,
        userName: getItem(activity.user, users)?.name,
        userId: activity.user._id,
        createdDate: activity?.createdAt
          ? format(activity.createdAt, "yyyy-MM-dd")
          : "",
        formattedCreatedDate: activity?.createdAt
          ? formatAsLocalDate(format(activity.createdAt, "yyyy-MM-dd"))
          : "",
        createHour: activity?.createdAt
          ? format(activity.createdAt, "HH:mm")
          : "",
        collapsible: {
          collapsibleColumns: [{ key: t("Payload"), isSortable: false }],
          collapsibleRows: activity?.payload
            ? [
                {
                  payload: activity.payload,
                },
              ]
            : [],
          collapsibleRowKeys: [
            {
              key: "payload",
              node: (row: ActivityRow) => {
                return <pre>{JSON.stringify(row?.payload, null, 2)}</pre>;
              },
            },
          ],
        },
      };
    });
  }, [activitiesPayload, users, t]);

  const columns = useMemo(
    () => [
      {
        key: t("User"),
        isSortable: true,
        correspondingKey: "user",
      },
      { key: t("Type"), isSortable: true, correspondingKey: "type" },
      {
        key: t("Date"),
        isSortable: true,
        correspondingKey: "createdAt",
      },
      {
        key: t("Hour"),
        isSortable: true,
        correspondingKey: "hour",
      },
    ],
    [t]
  );

  const rowKeys = useMemo(
    () => [
      { key: "userName" },
      {
        key: "type",
        node: (row: ActivityRow) => {
          const foundActivity = activityTypeDetails.find(
            (activity) => activity.value === row.type
          );
          if (!foundActivity) return null;
          return (
            <p
              className={`${foundActivity?.bgColor} w-fit px-2 py-0.5 rounded-md text-white text-sm font-semibold`}
            >
              {t(foundActivity?.label)}
            </p>
          );
        },
      },
      {
        key: "createdDate",
        className: `min-w-32   `,
        node: (row: ActivityRow) => {
          return <p>{row?.formattedCreatedDate}</p>;
        },
      },
      { key: "createHour" },
    ],
    [t]
  );

  const filterPanelInputs = useMemo(
    () => [
      {
        type: InputTypes.SELECT,
        formKey: "date",
        label: t("Date"),
        options: commonDateOptions.map((option) => ({
          value: option.value,
          label: t(option.label),
        })),
        placeholder: t("Date"),
        required: true,
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
        formKey: "user",
        label: t("User"),
        options: users
          .map((user) => ({
            value: user._id,
            label: user.name,
          })),
        placeholder: t("User"),
        required: false,
      },
      {
        type: InputTypes.SELECT,
        formKey: "type",
        label: t("Type"),
        options: activityTypeDetails,
        placeholder: t("Type"),
        required: false,
      },
    ],
    [t, users]
  );

  const filters = useMemo(
    () => [
      {
        label: t("Show Filters"),
        isUpperSide: true,
        node: (
          <SwitchButton
            checked={showActivityFilters}
            onChange={() => {
              setShowActivityFilters(!showActivityFilters);
            }}
          />
        ),
      },
    ],
    [t, showActivityFilters, setShowActivityFilters]
  );

  const filterPanel = useMemo(
    () => ({
      isFilterPanelActive: showActivityFilters,
      inputs: filterPanelInputs,
      formElements: filterActivityFormElements,
      setFormElements: setFilterActivityFormElements,
      additionalFilterCleanFunction: () => {
        setFilterActivityFormElements(initialFilterActivityFormElements);
      },
      closeFilters: () => setShowActivityFilters(false),
    }),
    [
      showActivityFilters,
      filterPanelInputs,
      filterActivityFormElements,
      setFilterActivityFormElements,
      initialFilterActivityFormElements,
      setShowActivityFilters,
    ]
  );

  const pagination = useMemo(() => {
    return activitiesPayload
      ? {
          totalPages: activitiesPayload.totalPages,
          totalRows: activitiesPayload.totalNumber,
        }
      : null;
  }, [activitiesPayload]);

  const outsideSort = useMemo(
    () => ({
      filterPanelFormElements: filterActivityFormElements,
      setFilterPanelFormElements: setFilterActivityFormElements,
    }),
    [filterActivityFormElements, setFilterActivityFormElements]
  );
  useMemo(() => {
    setCurrentPage(1);
  }, [filterActivityFormElements, setCurrentPage]);

  return (
    <>
      <Header showLocationSelector={false} />
      <div className="w-[95%] mx-auto my-10">
        <GenericTable
          rowKeys={rowKeys}
          columns={columns}
          rows={rows ?? []}
          filterPanel={filterPanel}
          filters={filters}
          isSearch={false}
          title={t("User Activities")}
          isActionsActive={false}
          isCollapsible={true}
          outsideSortProps={outsideSort}
          {...(pagination && { pagination })}
        />
      </div>
    </>
  );
};

export default UserActivities;
