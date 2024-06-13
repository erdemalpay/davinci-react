import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { Header } from "../components/header/Header";
import GenericTable from "../components/panelComponents/Tables/GenericTable";
import { H5 } from "../components/panelComponents/Typography";
import { useGeneralContext } from "../context/General.context";
import { useUserContext } from "../context/User.context";
import { Routes } from "../navigation/constants";
import { AccountFixtureCountList, AccountStockLocation, User } from "../types";
import { useGetAccountFixtures } from "../utils/api/account/fixture";
import {
  useAccountFixtureCountMutations,
  useGetAccountFixtureCounts,
} from "../utils/api/account/fixtureCount";
import { useGetAccountFixtureCountLists } from "../utils/api/account/fixtureCountList";
import { useGetAccountFixtureStocks } from "../utils/api/account/fixtureStock";

const FixtureCount = () => {
  const { t, i18n } = useTranslation();
  const { user } = useUserContext();
  const navigate = useNavigate();
  const fixtures = useGetAccountFixtures();
  const counts = useGetAccountFixtureCounts();
  const stocks = useGetAccountFixtureStocks();
  const [rowToAction, setRowToAction] = useState<any>();
  const { updateAccountFixtureCount } = useAccountFixtureCountMutations();
  const countLists = useGetAccountFixtureCountLists();
  const [tableKey, setTableKey] = useState(0);
  const {
    setCurrentPage,
    setRowsPerPage,
    setSearchQuery,
    setCountListActiveTab,
    setSortConfigKey,
  } = useGeneralContext();
  const { location, countListId } = useParams();

  const [rows, setRows] = useState(() => {
    const currentCountList = countLists?.find(
      (countList) => countList._id === countListId
    );
    const currentCount = counts?.find((item) => {
      return (
        item.isCompleted === false &&
        (item.location as AccountStockLocation)._id === location &&
        (item.user as User)._id === user?._id &&
        (item.countList as AccountFixtureCountList)._id === countListId
      );
    });
    return (
      currentCountList?.fixtures
        ?.filter(
          (fixturesItem) =>
            location && fixturesItem.locations.includes(location)
        )
        ?.map((fixturesItem) => {
          const currentFixture = fixtures?.find(
            (fixture) => fixture._id === fixturesItem.fixture
          );
          if (!currentFixture) return;

          return {
            fixture: currentFixture?.name,
            quantity: currentCount?.fixtures?.find(
              (countFixture) =>
                (countFixture.fixture = currentFixture?._id) ?? 0
            )?.countQuantity,
          };
        }) ?? []
    );
  });

  const columns = [
    { key: t("Fixture"), isSortable: true },
    { key: t("Quantity"), isSortable: false },
    { key: t("Actions"), isSortable: false },
  ];
  const rowKeys = [
    { key: "fixture" },
    {
      key: "quantity",
    },
  ];
  useEffect(() => {
    setRows(() => {
      const currentCountList = countLists?.find(
        (countList) => countList._id === countListId
      );
      const currentCount = counts?.find((item) => {
        return (
          item.isCompleted === false &&
          (item.location as AccountStockLocation)._id === location &&
          (item.user as User)._id === user?._id &&
          (item.countList as AccountFixtureCountList)._id === countListId
        );
      });
      return (
        currentCountList?.fixtures
          ?.filter(
            (fixturesItem) =>
              location && fixturesItem.locations.includes(location)
          )
          ?.map((fixturesItem) => {
            const currentFixture = fixtures?.find(
              (fixture) => fixture._id === fixturesItem.fixture
            );
            if (!currentFixture) return;

            return {
              fixture: currentFixture?.name,
              quantity: currentCount?.fixtures?.find(
                (countFixture) =>
                  (countFixture.fixture = currentFixture?._id) ?? 0
              )?.countQuantity,
            };
          }) ?? []
      );
    });
    setTableKey((prev) => prev + 1);
  }, [
    countListId,
    countLists,
    location,
    fixtures,
    stocks,
    counts,
    i18n.language,
  ]);

  return (
    <>
      <Header />
      <div className="w-[95%] my-10 mx-auto ">
        <GenericTable
          key={tableKey}
          rowKeys={rowKeys}
          columns={columns}
          rows={rows}
          title={t("Fixture Count")}
          //   actions={actions}
        />
        <div className="flex justify-end mt-4">
          <button
            className="px-2  bg-blue-500 hover:text-blue-500 hover:border-blue-500 sm:px-3 py-1 h-fit w-fit  text-white  hover:bg-white  transition-transform  border  rounded-md cursor-pointer"
            onClick={() => {
              const currentCount = counts?.find((item) => {
                return (
                  item.isCompleted === false &&
                  (item.location as AccountStockLocation)._id === location &&
                  (item.user as User)._id === user?._id &&
                  (item.countList as AccountFixtureCountList)._id ===
                    countListId
                );
              });
              if (!currentCount) {
                return;
              }
              //   if (rows?.some((row) => row.packageDetails?.length === 0)) {
              //     toast.error(t("Please complete all product counts."));
              //     return;
              //   }
              updateAccountFixtureCount({
                id: currentCount?._id,
                updates: {
                  isCompleted: true,
                  completedAt: new Date(),
                },
              });
              setCountListActiveTab(countLists.length);
              setCurrentPage(1);
              // setRowsPerPage(RowPerPageEnum.FIRST);
              setSearchQuery("");
              setSortConfigKey(null);
              navigate(Routes.CountLists);
            }}
          >
            <H5> {t("Complete")}</H5>
          </button>
        </div>
      </div>
    </>
  );
};

export default FixtureCount;
