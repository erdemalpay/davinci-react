import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useGeneralContext } from "../../context/General.context";
import { useUserContext } from "../../context/User.context";
import {
  AccountCount,
  AccountCountList,
  AccountStockLocation,
  RoleEnum,
  User,
} from "../../types";
import { useGetAccountCounts } from "../../utils/api/account/count";
import GenericTable from "../panelComponents/Tables/GenericTable";

const CountArchive = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const counts = useGetAccountCounts();
  const { setCurrentPage, setRowsPerPage, setSearchQuery, setSortConfigKey } =
    useGeneralContext();
  const pad = (num: number) => (num < 10 ? `0${num}` : num);
  const { user } = useUserContext();
  const [tableKey, setTableKey] = useState(0);
  const [rows, setRows] = useState(
    counts
      .filter((count) => {
        if (
          (count.user as User)?._id === user?._id ||
          user?.role._id === RoleEnum.MANAGER
        ) {
          return count;
        }
      })
      .map((count) => {
        const startDate = new Date(count.createdAt);
        const endDate = new Date(count?.completedAt ?? 0);
        return {
          ...count,
          cntLst: (count.countList as AccountCountList).name,
          lctn: (count.location as AccountStockLocation).name,
          usr: (count.user as User)?.name,
          startDate: `${pad(startDate.getDate())}-${pad(
            startDate.getMonth() + 1
          )}-${startDate.getFullYear()}`,
          startHour: `${pad(startDate.getHours())}:${pad(
            startDate.getMinutes()
          )}`,
          endDate: count?.completedAt
            ? `${pad(endDate.getDate())}-${pad(
                endDate.getMonth() + 1
              )}-${endDate.getFullYear()}`
            : "-",
          endHour: count?.completedAt
            ? `${pad(endDate.getHours())}:${pad(endDate.getMinutes())}`
            : "-",
        };
      })
  );
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
          {row.startDate}
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
  useEffect(() => {
    setRows(
      counts
        .filter((count) => {
          if (
            (count.user as User)?._id === user?._id ||
            user?.role._id === RoleEnum.MANAGER
          ) {
            return count;
          }
        })
        .map((count) => {
          const startDate = new Date(count.createdAt);
          const endDate = new Date(count?.completedAt ?? 0);
          return {
            ...count,
            cntLst: (count.countList as AccountCountList).name,
            lctn: (count.location as AccountStockLocation).name,
            usr: (count.user as User)?.name,
            startDate: `${pad(startDate.getDate())}-${pad(
              startDate.getMonth() + 1
            )}-${startDate.getFullYear()}`,
            startHour: `${pad(startDate.getHours())}:${pad(
              startDate.getMinutes()
            )}`,
            endDate: count?.completedAt
              ? `${pad(endDate.getDate())}-${pad(
                  endDate.getMonth() + 1
                )}-${endDate.getFullYear()}`
              : "-",
            endHour: count?.completedAt
              ? `${pad(endDate.getHours())}:${pad(endDate.getMinutes())}`
              : "-",
          };
        })
    );
    setTableKey((prev) => prev + 1);
  }, [counts]);

  return (
    <>
      <div className="w-[95%] mx-auto ">
        <GenericTable
          key={tableKey}
          rowKeys={rowKeys}
          columns={columns}
          rows={rows}
          title={t("Count Archive")}
        />
      </div>
    </>
  );
};

export default CountArchive;
