import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { GoPlusCircle } from "react-icons/go";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { Header } from "../components/header/Header";
import GenericAddEditPanel from "../components/panelComponents/FormElements/GenericAddEditPanel";
import {
  FormKeyTypeEnum,
  InputTypes,
} from "../components/panelComponents/shared/types";
import GenericTable from "../components/panelComponents/Tables/GenericTable";
import { H5 } from "../components/panelComponents/Typography";
import { useGeneralContext } from "../context/General.context";
import { useUserContext } from "../context/User.context";
import { Routes } from "../navigation/constants";
import {
  AccountFixture,
  AccountFixtureCountList,
  AccountStockLocation,
  User,
} from "../types";
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
  const [isAddFixtureOpen, setIsAddFixtureOpen] = useState(false);
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
  const [addForm, setAddForm] = useState({
    quantity: 0,
  });
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
        ?.map((listFixtures) => {
          return {
            fixture: fixtures?.find(
              (fixture) => fixture._id === listFixtures?.fixture
            )?.name,
            quantity:
              currentCount?.fixtures?.find(
                (countFixture) => countFixture.fixture == listFixtures.fixture
              )?.countQuantity ?? 0,
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
  const addInputs = [
    {
      type: InputTypes.NUMBER,
      formKey: "quantity",
      label: t("Quantity"),
      placeholder: t("Quantity"),
      required: true,
    },
  ];
  const addFormKeys = [{ key: "quantity", type: FormKeyTypeEnum.NUMBER }];
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
          ?.map((listFixtures) => {
            return {
              fixture: fixtures?.find(
                (fixture) => fixture._id === listFixtures?.fixture
              )?.name,
              quantity:
                currentCount?.fixtures?.find(
                  (countFixture) => countFixture.fixture == listFixtures.fixture
                )?.countQuantity ?? 0,
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
  const actions = [
    {
      name: "Add",
      isModal: true,
      setRow: setRowToAction,
      modal: rowToAction ? (
        <GenericAddEditPanel
          topClassName="flex flex-col gap-2 "
          buttonName={t("Add")}
          isOpen={isAddFixtureOpen}
          close={() => setIsAddFixtureOpen(false)}
          inputs={addInputs}
          formKeys={addFormKeys}
          submitItem={updateAccountFixtureCount as any}
          isEditMode={true}
          setForm={setAddForm}
          handleUpdate={() => {
            const rowFixture = fixtures.find(
              (fixture) => fixture.name === rowToAction?.fixture
            );
            const currentCount = counts?.find((item) => {
              return (
                item.isCompleted === false &&
                (item.location as AccountStockLocation)._id === location &&
                (item.user as User)._id === user?._id &&
                (item.countList as AccountFixtureCountList)._id === countListId
              );
            });
            if (!currentCount || !rowFixture) {
              return;
            }
            const fixtureStock = stocks?.find(
              (s) => (s.fixture as AccountFixture)._id === rowFixture?._id
            );
            const newFixtures = [
              ...(currentCount?.fixtures?.filter(
                (countFixture) => countFixture.fixture !== rowFixture?._id
              ) || []),
              {
                fixture: rowFixture?._id,
                countQuantity: addForm?.quantity,
                stockQuantity: fixtureStock?.quantity || 0,
              },
            ];
            updateAccountFixtureCount({
              id: currentCount?._id,
              updates: {
                fixtures: newFixtures,
              },
            });
          }}
        />
      ) : null,
      isModalOpen: isAddFixtureOpen,
      setIsModal: setIsAddFixtureOpen,
      isPath: false,
      icon: <GoPlusCircle className="w-5 h-5" />,
      className: " hover:text-blue-500 hover:border-blue-500 cursor-pointer",
    },
  ];
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
          actions={actions}
          isActionsActive={true}
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

              if (
                currentCount?.fixtures?.length !==
                countLists
                  ?.find((countList) => countList._id === countListId)
                  ?.fixtures?.filter(
                    (fixturesItem) =>
                      location && fixturesItem.locations.includes(location)
                  )?.length
              ) {
                toast.error(t("Please complete all fixture counts."));
                return;
              }
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
