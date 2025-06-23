import { format } from "date-fns";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Header } from "../components/header/Header";
import GenericTable from "../components/panelComponents/Tables/GenericTable";
import SwitchButton from "../components/panelComponents/common/SwitchButton";
import { InputTypes } from "../components/panelComponents/shared/types";
import { useFilterContext } from "../context/Filter.context";
import { activityTypeDetails, commonDateOptions } from "../types";
import { useGetActivities } from "../utils/api/activity";
import { useGetUsers } from "../utils/api/user";
import { formatAsLocalDate } from "../utils/format";
import { getItem } from "../utils/getItem";

const UserActivities = () => {
  const { t } = useTranslation();
  const {
    filterActivityFormElements,
    setFilterActivityFormElements,
    showActivityFilters,
    setShowActivityFilters,
    initialFilterActivityFormElements,
  } = useFilterContext();
  const activities = useGetActivities(filterActivityFormElements);
  const [tableKey, setTableKey] = useState(0);
  const users = useGetUsers();
  const allRows = activities?.map((activity) => {
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
            node: (row: any) => {
              return <pre>{JSON.stringify(row?.payload, null, 2)}</pre>;
            },
          },
        ],
      },
    };
  });
  const [rows, setRows] = useState(allRows);
  const columns = [
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
  ];
  const rowKeys = [
    { key: "userName" },
    {
      key: "type",
      node: (row: any) => {
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
      node: (row: any) => {
        return <p>{row?.formattedCreatedDate}</p>;
      },
    },
    { key: "createHour" },
  ];
  const filterPanelInputs = [
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
        .filter((user) => user.active)
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
  ];
  const filters = [
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
  ];
  const filterPanel = {
    isFilterPanelActive: showActivityFilters,
    inputs: filterPanelInputs,
    formElements: filterActivityFormElements,
    setFormElements: setFilterActivityFormElements,
    additionalFilterCleanFunction: () => {
      setFilterActivityFormElements(initialFilterActivityFormElements);
    },
    closeFilters: () => setShowActivityFilters(false),
  };

  useEffect(() => {
    setRows(allRows);
    setTableKey((prev) => prev + 1);
  }, [activities, users]);
  return (
    <>
      <Header showLocationSelector={false} />
      <div className="w-[95%] mx-auto my-10">
        <GenericTable
          key={tableKey}
          rowKeys={rowKeys}
          columns={columns}
          rows={rows ?? []}
          filterPanel={filterPanel}
          filters={filters}
          isSearch={false}
          title={t("User Activities")}
          isActionsActive={false}
          isCollapsible={true}
        />
      </div>
    </>
  );
};

export default UserActivities;
