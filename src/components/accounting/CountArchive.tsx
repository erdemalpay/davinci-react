import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
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
        return {
          ...count,
          cntLst: (count.countList as AccountCountList).name,
          lctn: (count.location as AccountStockLocation).name,
          usr: (count.user as User)?.name,
          // date: formatAsLocalDate(count.date),
        };
      })
  );
  const columns = [
    { key: t("Date"), isSortable: true },
    { key: t("NounCount"), isSortable: true },
    { key: t("Location"), isSortable: true },
    { key: t("User"), isSortable: true },
    { key: t("Status"), isSortable: false },
  ];
  const rowKeys = [
    // {
    //   key: "date",
    //   className: "min-w-32",
    //   node: (row: AccountCount) => {
    //     return row.date;
    //   },
    // },
    {
      key: "cntLst",
      node: (row: AccountCount) => (
        <p
          className="text-blue-700  w-fit  cursor-pointer hover:text-blue-500 transition-transform"
          onClick={() => {
            if (row.isCompleted) {
              // navigate(`/archive/${row._id}`);
            } else {
              navigate(
                `/count/${(row.location as AccountStockLocation)._id}/${
                  (row.countList as AccountCountList)._id
                }`
              );
            }
          }}
        >
          {(row.countList as AccountCountList).name}
        </p>
      ),
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
          return {
            ...count,
            cntLst: (count.countList as AccountCountList).name,
            lctn: (count.location as AccountStockLocation).name,
            usr: (count.user as User)?.name,
            // date: formatAsLocalDate(count.date),
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
