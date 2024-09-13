import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { Header } from "../components/header/Header";
import PageNavigator from "../components/panelComponents/PageNavigator/PageNavigator";
import GenericTable from "../components/panelComponents/Tables/GenericTable";
import { H5 } from "../components/panelComponents/Typography";
import { useGeneralContext } from "../context/General.context";
import { useUserContext } from "../context/User.context";
import { Routes } from "../navigation/constants";
import { AccountFixtureCountList, RoleEnum, User } from "../types";
import { useAccountCountMutations } from "../utils/api/account/count";
import { useGetAccountFixtures } from "../utils/api/account/fixture";
import { useGetAccountFixtureCounts } from "../utils/api/account/fixtureCount";
import { useGetAccountFixtureCountLists } from "../utils/api/account/fixtureCountList";

const SingleFixtureCountArchive = () => {
  const { t } = useTranslation();
  const { archiveId } = useParams();
  const { user } = useUserContext();
  const [tableKey, setTableKey] = useState(0);
  const counts = useGetAccountFixtureCounts();
  const countLists = useGetAccountFixtureCountLists();
  const { updateAccountCount } = useAccountCountMutations();
  const fixtures = useGetAccountFixtures();
  const pad = (num: number) => (num < 10 ? `0${num}` : num);
  const { setCurrentPage, setRowsPerPage, setSearchQuery } =
    useGeneralContext();
  const foundCount = counts?.find((count) => count._id === archiveId);
  const pageNavigations = [
    {
      name: t("Count Archive"),
      path: Routes.CountLists,
      canBeClicked: true,
      additionalSubmitFunction: () => {
        setCurrentPage(1);
        // setRowsPerPage(RowPerPageEnum.FIRST);
        setSearchQuery("");
      },
    },
    {
      name:
        (foundCount?.countList as AccountFixtureCountList)?.name +
        " " +
        t("Countu"),
      path: `/fixture-archive/${archiveId}`,
      canBeClicked: false,
    },
  ];
  const [rows, setRows] = useState(() => {
    const currentCount = counts?.find((count) => count._id === archiveId);
    if (!currentCount) return [];
    const date = new Date(currentCount.createdAt);
    return (
      currentCount?.fixtures?.map((option) => ({
        fixture: fixtures?.find((item) => item._id === option.fixture)?.name,
        date: `${pad(date.getDate())}-${pad(
          date.getMonth() + 1
        )}-${date.getFullYear()}`,
        stockQuantity: option.stockQuantity,
        countQuantity: option.countQuantity,
      })) || []
    );
  });
  const columns = [
    { key: t("Date"), isSortable: true },
    { key: t("Fixture"), isSortable: true },
    { key: t("Stock Quantity"), isSortable: true },
    { key: t("Count Quantity"), isSortable: true },
  ];
  const rowKeys = [
    { key: "date", className: "min-w-32" },
    { key: "fixture" },
    { key: "stockQuantity" },
    { key: "countQuantity" },
  ];
  function getBgColor(row: {
    stockQuantity: number;
    countQuantity: number;
    product: string;
    unit: string;
  }) {
    if (Number(row.stockQuantity) === Number(row.countQuantity)) {
      return "bg-blue-100";
    } else if (Number(row.stockQuantity) > Number(row.countQuantity)) {
      return "bg-red-100";
    } else if (Number(row.stockQuantity) < Number(row.countQuantity)) {
      return "bg-green-100";
    }
    return "bg-green-500";
  }
  useEffect(() => {
    setRows(() => {
      const currentCount = counts?.find((count) => count._id === archiveId);
      if (!currentCount) return [];
      const date = new Date(currentCount.createdAt);
      return (
        currentCount?.fixtures?.map((option) => ({
          fixture: fixtures?.find((item) => item._id === option.fixture)?.name,
          date: `${pad(date.getDate())}-${pad(
            date.getMonth() + 1
          )}-${date.getFullYear()}`,
          stockQuantity: option.stockQuantity,
          countQuantity: option.countQuantity,
        })) || []
      );
    });
    setTableKey((prev) => prev + 1);
  }, [counts, fixtures, archiveId]);
  const filters = [
    {
      isUpperSide: false,
      node: (
        <button
          className="px-2 ml-auto bg-blue-500 hover:text-blue-500 hover:border-blue-500 sm:px-3 py-1 h-fit w-fit  text-white  hover:bg-white  transition-transform  border  rounded-md cursor-pointer"
          onClick={() => {
            if (archiveId) {
              updateAccountCount({
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
  if (user?.role?._id !== RoleEnum.MANAGER) {
    const columnIndex = columns.findIndex(
      (column) => column.key === t("Stock Quantity")
    );
    if (columnIndex !== -1) {
      columns.splice(columnIndex, 1);
    }
    const rowKeyIndex = rowKeys.findIndex(
      (rKey) => rKey.key === "stockQuantity"
    );
    if (rowKeyIndex !== -1) {
      rowKeys.splice(rowKeyIndex, 1);
    }
  }
  return (
    <>
      <Header />
      <PageNavigator navigations={pageNavigations} />
      <div className="w-[95%] mx-auto my-10 ">
        {foundCount && (
          <GenericTable
            key={tableKey}
            rowKeys={rowKeys}
            columns={columns}
            isActionsActive={false}
            rows={rows}
            rowClassNameFunction={
              user?.role?._id === RoleEnum.MANAGER ? getBgColor : undefined
            }
            filters={foundCount && !foundCount.isCompleted ? filters : []}
            title={`${(foundCount?.user as User)?.name}  ${t("Countu")}`} //date will be added here
          />
        )}
      </div>
    </>
  );
};

export default SingleFixtureCountArchive;
