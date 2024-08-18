import { ArrowDownIcon, ArrowUpIcon } from "@heroicons/react/24/outline";
import { Input } from "@material-tailwind/react";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Autocomplete } from "../components/common/Autocomplete";
import { Header } from "../components/header/Header";
import GenericTable from "../components/panelComponents/Tables/GenericTable";
import { Caption, H5 } from "../components/panelComponents/Typography";
import { Activity, activityTypeDetails, RowPerPageEnum, User } from "../types";
import { ActivityFilter, useGetActivities } from "../utils/api/activity";
import { useGetUsers } from "../utils/api/user";
import { formatAsLocalDate } from "../utils/format";

const UserActivities = () => {
  const { t } = useTranslation();
  const [filterData, setFilterData] = useState<ActivityFilter>({
    limit: 10,
    page: 1,
  });
  const { data } = useGetActivities(filterData);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [tableKey, setTableKey] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const users = useGetUsers();
  const typeSuggestions = activityTypeDetails.map((activity) => {
    return { _id: activity.value, name: activity.label };
  });
  const columns = [
    {
      key: t("User"),
      isSortable: true,
      node: () => (
        <th
          key="user"
          className="font-bold text-left cursor-pointer"
          onClick={() => handleSort("user")}
        >
          <div className="flex gap-x-2 pl-3 items-center py-3 min-w-8">
            <H5>{t("User")}</H5>
            {filterData.sort === "user" &&
              (filterData.asc === 1 ? (
                <ArrowUpIcon className="h-4 w-4 my-auto" />
              ) : (
                <ArrowDownIcon className="h-4 w-4 my-auto" />
              ))}
          </div>
        </th>
      ),
    },
    {
      key: t("Type"),
      isSortable: true,
      node: () => (
        <th
          key="type"
          className="font-bold text-left cursor-pointer"
          onClick={() => handleSort("type")}
        >
          <div className="flex gap-x-2 pl-3 items-center py-3 min-w-8">
            <H5>{t("Type")}</H5>
            {filterData.sort === "type" &&
              (filterData.asc === 1 ? (
                <ArrowUpIcon className="h-4 w-4 my-auto" />
              ) : (
                <ArrowDownIcon className="h-4 w-4 my-auto" />
              ))}
          </div>
        </th>
      ),
    },
    {
      key: t("Date"),
      isSortable: true,
      node: () => (
        <th
          key="date"
          className="font-bold text-left cursor-pointer"
          onClick={() => handleSort("date")}
        >
          <div className="flex gap-x-2 pl-3 items-center py-3 min-w-8">
            <H5>{t("Date")}</H5>
            {filterData.sort === "date" &&
              (filterData.asc === 1 ? (
                <ArrowUpIcon className="h-4 w-4 my-auto" />
              ) : (
                <ArrowDownIcon className="h-4 w-4 my-auto" />
              ))}
          </div>
        </th>
      ),
    },
    {
      key: t("Hour"),
      isSortable: true,
      node: () => (
        <th
          key="hour"
          className="font-bold text-left cursor-pointer"
          onClick={() => handleSort("hour")}
        >
          <div className="flex gap-x-2 pl-3 items-center py-3 min-w-8">
            <H5>{t("Hour")}</H5>
            {filterData.sort === "hour" &&
              (filterData.asc === 1 ? (
                <ArrowUpIcon className="h-4 w-4 my-auto" />
              ) : (
                <ArrowDownIcon className="h-4 w-4 my-auto" />
              ))}
          </div>
        </th>
      ),
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
        return (
          <p
            className={`${foundActivity?.bgColor} w-fit px-2 py-0.5 rounded-md text-gray-800 text-sm font-medium`}
          >
            {foundActivity?.label}
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
  function handleDateSelection(event: React.FormEvent<HTMLInputElement>) {
    setFilterData({
      ...filterData,
      date: (event.target as HTMLInputElement).value,
      page: 1,
    });
  }
  function handleUserSelection(user: User) {
    if (!user) {
      setFilterData({ ...filterData, user: undefined, page: 1 });
    } else {
      setFilterData({ ...filterData, user: user._id, page: 1 });
    }
  }
  function handleTypeSelection(type: { _id: string; name: string }) {
    if (!type) {
      setFilterData({ ...filterData, type: undefined, page: 1 });
    } else {
      setFilterData({ ...filterData, type: type._id, page: 1 });
    }
  }

  function handleLimitSelection(value: number) {
    setFilterData({
      ...filterData,
      limit: value,
    });
  }

  function handlePageChange(value: number) {
    const newPage = filterData.page + value;
    if (newPage > 0 && newPage <= Math.ceil(totalItems / filterData.limit)) {
      setFilterData({
        ...filterData,
        page: newPage,
      });
    }
  }

  function handleSort(value: string) {
    if (filterData.sort === value) {
      if (filterData.asc === 1) {
        // if sorted ascending, convert to descending
        setFilterData({
          ...filterData,
          asc: -1,
        });
      } else {
        // if sorted descending remove sort
        setFilterData({
          ...filterData,
          asc: undefined,
          sort: undefined,
        });
      }
    } else {
      // if not sorted by this field, sort it by this field
      setFilterData({
        ...filterData,
        asc: 1,
        sort: value,
      });
    }
  }

  useEffect(() => {
    if (data) {
      const { items, totalCount } = data;
      setActivities(
        items.map((activity) => {
          return {
            ...activity,
            userName: activity.user.name,
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
        })
      );
      setTotalItems(totalCount);
    }
    setTableKey((prev) => prev + 1);
  }, [data]);
  return (
    <>
      <Header showLocationSelector={false} />
      <div className="w-[95%] mx-auto my-10 ">
        <div className="flex flex-col w-full mb-6">
          <div className="flex flex-col lg:flex-row justify-between w-full gap-x-4">
            <Autocomplete
              name="user"
              label={t("User")}
              suggestions={users}
              handleSelection={handleUserSelection}
              showSelected
            />
            <Autocomplete
              name="type"
              label={t("Type")}
              suggestions={typeSuggestions}
              handleSelection={handleTypeSelection}
              showSelected
            />
            <Input
              variant="standard"
              name="startDay"
              label={t("Date")}
              type="date"
              onChange={handleDateSelection}
            />
          </div>
        </div>
        <GenericTable
          key={tableKey}
          columns={columns}
          rows={activities}
          rowKeys={rowKeys}
          title={t("User Activities")}
          isActionsActive={false}
          isSearch={false}
          isRowsPerPage={false}
          isPagination={false}
          isCollapsible={true}
        />
        <div className="ml-auto flex flex-row justify-between w-fit mt-2 gap-4 __className_a182b8">
          {/* rows per page */}
          <div className="flex flex-row gap-2 px-6 items-center">
            <Caption>{t("Rows per page")}:</Caption>
            <select
              className=" rounded-md py-2 flex items-center focus:outline-none h-8 text-xs cursor-pointer"
              value={filterData?.limit}
              onChange={(value) =>
                handleLimitSelection(value.target.value as unknown as number)
              }
            >
              <option value={RowPerPageEnum.FIRST}>
                {RowPerPageEnum.FIRST}
              </option>
              <option value={RowPerPageEnum.SECOND}>
                {RowPerPageEnum.SECOND}
              </option>
              <option value={RowPerPageEnum.THIRD}>
                {RowPerPageEnum.THIRD}
              </option>
            </select>
          </div>
          {/* pagination */}
          <div className=" flex flex-row gap-2 items-center">
            <Caption>
              {((filterData.page || 1) - 1) * filterData.limit + 1} -{" "}
              {((filterData.page || 1) - 1) * filterData.limit +
                activities.length}
              {" of "}
              {totalItems}
            </Caption>
            <div className="flex flex-row gap-4">
              <button
                onClick={() => handlePageChange(-1)}
                className="cursor-pointer"
              >
                {"<"}
              </button>
              <button
                onClick={() => handlePageChange(1)}
                className="cursor-pointer"
              >
                {">"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default UserActivities;
