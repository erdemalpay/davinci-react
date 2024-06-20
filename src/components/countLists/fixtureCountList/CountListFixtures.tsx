import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { IoCheckmark, IoCloseOutline } from "react-icons/io5";
import { toast } from "react-toastify";
import { AccountFixtureCountList } from "../../../types";
import { useGetAccountFixtures } from "../../../utils/api/account/fixture";
import {
  useAccountFixtureCountListMutations,
  useGetAccountFixtureCountLists,
} from "../../../utils/api/account/fixtureCountList";
import { useGetAccountStockLocations } from "../../../utils/api/account/stockLocation";
import { CheckSwitch } from "../../common/CheckSwitch";
import GenericTable from "../../panelComponents/Tables/GenericTable";
import SwitchButton from "../../panelComponents/common/SwitchButton";
import { RowKeyType } from "../../panelComponents/shared/types";

const CountListFixtures = () => {
  const { t } = useTranslation();
  const countLists = useGetAccountFixtureCountLists();
  const [tableKey, setTableKey] = useState(0);
  const fixtures = useGetAccountFixtures();
  const locations = useGetAccountStockLocations();
  const [isEnableEdit, setIsEnableEdit] = useState(false);
  const { updateAccountFixtureCountList } =
    useAccountFixtureCountListMutations();
  const allRows = fixtures.map((item) => ({
    fixture: item._id,
    name: item.name,
  }));
  const [rows, setRows] = useState(allRows);
  function handleCountListUpdate(row: any, countList: AccountFixtureCountList) {
    if (countList?.fixtures?.find((item) => item.fixture === row.fixture)) {
      const newFixtures = countList?.fixtures?.filter(
        (item) => item.fixture !== row?.fixture
      );
      updateAccountFixtureCountList({
        id: countList._id,
        updates: { fixtures: newFixtures },
      });
    } else {
      const newFixtures = countList.fixtures || [];
      newFixtures.push({
        fixture: row.fixture,
        locations: locations.map((location) => location._id),
      });
      updateAccountFixtureCountList({
        id: countList._id,
        updates: { fixtures: newFixtures },
      });

      toast.success(`${t("Count List updated successfully")}`);
    }
  }

  const columns = [{ key: t("Name"), isSortable: true }];
  const rowKeys: RowKeyType<any>[] = [
    {
      key: "name",
    },
  ];

  // Adding location columns and rowkeys
  for (const countList of countLists) {
    columns.push({
      key: countList.name,
      isSortable: true,
    });
    rowKeys.push({
      key: countList._id,
      node: (row: any) =>
        isEnableEdit ? (
          <div
            className={`${
              countLists?.length === 1 ? "flex justify-center" : ""
            }`}
          >
            <CheckSwitch
              checked={
                countList?.fixtures?.find(
                  (item) => item.fixture === row.fixture
                )
                  ? true
                  : false
              }
              onChange={() => handleCountListUpdate(row, countList)}
            />
          </div>
        ) : countList?.fixtures?.find(
            (item) => item.fixture === row.fixture
          ) ? (
          <IoCheckmark
            className={`text-blue-500 text-2xl ${
              countLists?.length === 1 ? "mx-auto" : ""
            }`}
          />
        ) : (
          <IoCloseOutline
            className={`text-red-800 text-2xl  ${
              countLists?.length === 1 ? "mx-auto" : ""
            }`}
          />
        ),
    });
  }
  const filters = [
    {
      label: t("Enable Edit"),
      isUpperSide: false,
      node: <SwitchButton checked={isEnableEdit} onChange={setIsEnableEdit} />,
    },
  ];
  useEffect(() => {
    setRows(allRows);
    setTableKey((prev) => prev + 1);
  }, [countLists, locations, fixtures]);

  return (
    <>
      <div className="w-[95%] mx-auto ">
        <GenericTable
          key={tableKey}
          rowKeys={rowKeys}
          columns={columns}
          filters={filters}
          rows={rows}
          title={t("Count List Fixtures")}
          isActionsActive={false}
        />
      </div>
    </>
  );
};

export default CountListFixtures;
