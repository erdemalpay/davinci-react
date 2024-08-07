import { format } from "date-fns";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useGeneralContext } from "../../../context/General.context";
import { useUserContext } from "../../../context/User.context";
import {
  AccountCount,
  AccountCountList,
  AccountStockLocation,
  RoleEnum,
  User,
} from "../../../types";
import { useGetAccountCounts } from "../../../utils/api/account/count";
import { useGetAccountStockLocations } from "../../../utils/api/account/stockLocation";
import { useGetUsers } from "../../../utils/api/user";
import { formatAsLocalDate } from "../../../utils/format";
import { StockLocationInput } from "../../../utils/panelInputs";
import { passesFilter } from "../../../utils/passesFilter";
import GenericTable from "../../panelComponents/Tables/GenericTable";
import SwitchButton from "../../panelComponents/common/SwitchButton";
import { InputTypes } from "../../panelComponents/shared/types";

type FormElementsState = {
  [key: string]: any;
};
const CountArchive = () => {
  const { t } = useTranslation();
  const [showFilters, setShowFilters] = useState(false);
  const navigate = useNavigate();
  const counts = useGetAccountCounts();
  const users = useGetUsers();
  const locations = useGetAccountStockLocations();
  const { setCurrentPage, setSearchQuery, setSortConfigKey } =
    useGeneralContext();
  const pad = (num: number) => (num < 10 ? `0${num}` : num);
  const { user } = useUserContext();
  const [tableKey, setTableKey] = useState(0);
  const [filterPanelFormElements, setFilterPanelFormElements] =
    useState<FormElementsState>({
      createdBy: "",
      countList: "",
      location: "",
      after: "",
      before: "",
    });
  const allRows = counts
    .filter((count) => {
      if (
        (count.user as User)?._id === user?._id ||
        (user &&
          [
            RoleEnum.MANAGER,
            RoleEnum.GAMEMANAGER,
            RoleEnum.CATERINGMANAGER,
          ].includes(user.role._id))
      ) {
        return count;
      }
    })
    .map((count) => {
      if (!count.createdAt) {
        return null;
      }
      const startDate = new Date(count?.createdAt);
      const endDate = new Date(count?.completedAt ?? 0);
      return {
        ...count,
        cntLst: (count.countList as AccountCountList).name,
        cntLstId: (count.countList as AccountCountList)._id,
        lctn: (count.location as AccountStockLocation).name,
        lctnId: (count.location as AccountStockLocation)._id,
        usr: (count.user as User)?.name,
        usrId: (count.user as User)?._id,
        startDate: format(count.createdAt, "yyyy-MM-dd"),
        formattedStartDate: formatAsLocalDate(
          format(count.createdAt, "yyyy-MM-dd")
        ),
        startHour: `${pad(startDate.getHours())}:${pad(
          startDate.getMinutes()
        )}`,
        endDate: count?.completedAt
          ? format(count.completedAt, "yyyy-MM-dd")
          : "",
        formattedEndDate: count?.completedAt
          ? formatAsLocalDate(format(count.completedAt, "yyyy-MM-dd"))
          : "-",
        endHour: count?.completedAt
          ? `${pad(endDate.getHours())}:${pad(endDate.getMinutes())}`
          : "-",
      };
    })
    .filter((item) => item !== null);
  const [rows, setRows] = useState(allRows);
  const columns = [
    { key: t("Start Date"), isSortable: true },
    { key: t("Start Hour"), isSortable: true },
    { key: t("End Date"), isSortable: true },
    { key: t("End Hour"), isSortable: true },
    { key: t("NounCount"), isSortable: true },
    { key: t("Location"), isSortable: true },
    { key: t("User"), isSortable: true },
    { key: t("Status"), isSortable: false },
  ];
  const rowKeys = [
    {
      key: "startDate",
      node: (row: any) => (
        <p
          className="text-blue-700  w-fit  cursor-pointer hover:text-blue-500 transition-transform"
          onClick={() => {
            if (row.isCompleted) {
              setCurrentPage(1);
              // setRowsPerPage(RowPerPageEnum.FIRST);
              setSortConfigKey(null);
              setSearchQuery("");
              navigate(`/archive/${row._id}`);
            } else {
              setCurrentPage(1);
              // setRowsPerPage(RowPerPageEnum.FIRST);
              setSearchQuery("");
              setSortConfigKey(null);
              navigate(
                `/count/${(row.location as AccountStockLocation)._id}/${
                  (row.countList as AccountCountList)._id
                }`
              );
            }
          }}
        >
          {row.formattedStartDate}
        </p>
      ),
      className: "min-w-32",
    },
    {
      key: "startHour",
      className: "min-w-32 pr-1",
    },
    {
      key: "endDate",
      className: "min-w-32 pr-1",
      node: (row: any) => {
        return <p>{row.formattedEndDate}</p>;
      },
    },
    {
      key: "endHour",
      className: "min-w-32 pr-1",
    },
    {
      key: "cntLst",
      className: "min-w-32 pr-1",
    },
    { key: "lctn" },
    { key: "usr" },
    {
      key: "isCompleted",
      node: (row: AccountCount) => {
        if (row.isCompleted) {
          return (
            <span className="bg-green-500 w-fit px-2 py-1 rounded-md  text-white min-w-32">
              {t("Completed")}
            </span>
          );
        } else {
          return (
            <span className="bg-red-500 w-fit px-2 py-1 rounded-md text-white flex items-center">
              {t("Not Completed")}
            </span>
          );
        }
      },
    },
  ];
  const filterPanelInputs = [
    {
      type: InputTypes.SELECT,
      formKey: "createdBy",
      label: t("Created By"),
      options: users
        .filter((user) => user.active)
        .map((user) => ({
          value: user._id,
          label: user.name,
        })),
      placeholder: t("Created By"),
      required: true,
    },

    StockLocationInput({ locations: locations, required: true }),
    {
      type: InputTypes.SELECT,
      formKey: "countList",
      label: t("NounCount"),
      options: counts.map((count) => ({
        value: (count.countList as AccountCountList)._id,
        label: t((count.countList as AccountCountList).name),
      })),
      placeholder: t("NounCount"),
      required: true,
    },

    {
      type: InputTypes.DATE,
      formKey: "after",
      label: t("Start Date"),
      placeholder: t("Start Date"),
      required: true,
      isDatePicker: true,
    },
    {
      type: InputTypes.DATE,
      formKey: "before",
      label: t("End Date"),
      placeholder: t("End Date"),
      required: true,
      isDatePicker: true,
    },
  ];
  const filterPanel = {
    isFilterPanelActive: showFilters,
    inputs: filterPanelInputs,
    formElements: filterPanelFormElements,
    setFormElements: setFilterPanelFormElements,
    closeFilters: () => setShowFilters(false),
  };
  const filters = [
    {
      label: t("Show Filters"),
      isUpperSide: true,
      node: <SwitchButton checked={showFilters} onChange={setShowFilters} />,
    },
  ];
  useEffect(() => {
    const filteredRows = allRows.filter((row) => {
      if (!row?.startDate) return false;
      return (
        (filterPanelFormElements.before === "" ||
          row.startDate <= filterPanelFormElements.before) &&
        (filterPanelFormElements.after === "" ||
          row.startDate >= filterPanelFormElements.after) &&
        passesFilter(filterPanelFormElements.location, row.lctnId) &&
        passesFilter(filterPanelFormElements.countList, row.cntLstId) &&
        passesFilter(filterPanelFormElements.createdBy, row.usrId)
      );
    });
    setRows(filteredRows);
    setTableKey((prev) => prev + 1);
  }, [counts, user, locations, users, filterPanelFormElements]);

  return (
    <>
      <div className="w-[95%] mx-auto ">
        <GenericTable
          key={tableKey}
          rowKeys={rowKeys}
          isActionsActive={false}
          columns={columns}
          rows={rows}
          title={t("Count Archive")}
          filterPanel={filterPanel}
          filters={filters}
        />
      </div>
    </>
  );
};

export default CountArchive;
