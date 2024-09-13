import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { HiOutlineTrash } from "react-icons/hi2";
import { IoCheckmark, IoCloseOutline } from "react-icons/io5";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { CheckSwitch } from "../components/common/CheckSwitch";
import { ConfirmationDialog } from "../components/common/ConfirmationDialog";
import SelectInput from "../components/common/SelectInput";
import { Header } from "../components/header/Header";
import ButtonFilter from "../components/panelComponents/common/ButtonFilter";
import SwitchButton from "../components/panelComponents/common/SwitchButton";
import GenericAddEditPanel from "../components/panelComponents/FormElements/GenericAddEditPanel";
import {
  FormKeyTypeEnum,
  InputTypes,
  RowKeyType,
} from "../components/panelComponents/shared/types";
import GenericTable from "../components/panelComponents/Tables/GenericTable";
import { useGeneralContext } from "../context/General.context";
import { useUserContext } from "../context/User.context";
import { AccountFixtureCountList, RoleEnum } from "../types";
import { useGetAccountFixtures } from "../utils/api/account/fixture";
import {
  useAccountFixtureCountMutations,
  useGetAccountFixtureCounts,
} from "../utils/api/account/fixtureCount";
import {
  useAccountFixtureCountListMutations,
  useGetAccountFixtureCountLists,
} from "../utils/api/account/fixtureCountList";
import { useGetAccountStockLocations } from "../utils/api/account/stockLocation";
import { StockLocationInput } from "../utils/panelInputs";

interface LocationEntries {
  [key: string]: boolean;
}

const FixtureCountList = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { fixtureCountListId } = useParams();
  const { user } = useUserContext();
  const locations = useGetAccountStockLocations();
  const fixtureCountLists = useGetAccountFixtureCountLists();
  const { setCurrentPage, setRowsPerPage, setSearchQuery, setSortConfigKey } =
    useGeneralContext();
  const [tableKey, setTableKey] = useState(0);
  const { updateAccountFixtureCountList } =
    useAccountFixtureCountListMutations();
  const [isEnableEdit, setIsEnableEdit] = useState(false);
  const [selectedFixtureCountList, setSelectedFixtureCountList] =
    useState<AccountFixtureCountList>();
  const [isCountLocationModalOpen, setIsCountLocationModalOpen] =
    useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [
    isCloseAllConfirmationDialogOpen,
    setIsCloseAllConfirmationDialogOpen,
  ] = useState(false);
  const [rowToAction, setRowToAction] = useState<FixtureCountListRowType>();
  const { createAccountFixtureCount } = useAccountFixtureCountMutations();
  const fixtures = useGetAccountFixtures();
  const [form, setForm] = useState({
    fixture: [],
  });
  const FixtureCountListOption = fixtureCountLists?.map((p) => {
    return {
      value: p._id,
      label: p.name,
    };
  });
  type FixtureCountListRowType = {
    fixture: string;
  };
  const currentFixtureCountList = fixtureCountLists?.find(
    (item) => item._id === fixtureCountListId
  );
  if (!currentFixtureCountList) {
    return <></>;
  }
  const [countLocationForm, setCountLocationForm] = useState({
    location: "",
  });
  const counts = useGetAccountFixtureCounts();

  const countLocationInputs = [
    StockLocationInput({
      locations: locations.filter((l) =>
        fixtureCountLists
          .find((row) => row._id === fixtureCountListId)
          ?.locations?.includes(l._id)
      ),
    }),
  ];
  const countLocationFormKeys = [
    { key: "location", type: FormKeyTypeEnum.STRING },
  ];
  function handleLocationUpdate(row: any, changedLocationId: string) {
    const currentFixtureCountList = fixtureCountLists.find(
      (item) => item._id === fixtureCountListId
    );
    if (!currentFixtureCountList) return;
    const newFixtures = [
      ...(currentFixtureCountList.fixtures?.filter(
        (p) =>
          p.fixture !==
          (fixtures?.find((it) => it.name === row?.fixture)?._id ?? "")
      ) || []),

      {
        fixture: fixtures?.find((it) => it.name === row?.fixture)?._id ?? "",
        locations: Object.entries(row).reduce((acc, [key, value]) => {
          if (key === "fixture" || typeof key !== "string") return acc;
          if (key === changedLocationId) {
            if (!value) {
              acc.push(key);
            }
          } else if (value) {
            acc.push(key);
          }
          return acc;
        }, [] as string[]),
      },
    ];

    updateAccountFixtureCountList({
      id: currentFixtureCountList._id,
      updates: { fixtures: newFixtures },
    });

    toast.success(`${t("Count List updated successfully")}`);
  }
  const rows = () => {
    let fixtureRows = [];
    const currentFixtureCountList = fixtureCountLists.find(
      (item) => item._id === fixtureCountListId
    );
    if (currentFixtureCountList && currentFixtureCountList.fixtures) {
      for (let item of currentFixtureCountList.fixtures) {
        const fixture = fixtures.find((it) => it._id === item.fixture);
        if (fixture) {
          const locationEntries = locations?.reduce<LocationEntries>(
            (acc, location) => {
              acc[location._id] =
                item.locations?.includes(location._id) ?? false;
              return acc;
            },
            {}
          );
          fixtureRows.push({
            fixture: fixture.name,
            ...locationEntries,
          });
        }
      }
    }
    fixtureRows = fixtureRows.sort((a, b) => {
      if (a.fixture < b.fixture) {
        return -1;
      }
      if (a.fixture > b.fixture) {
        return 1;
      }
      return 0;
    });
    return fixtureRows;
  };
  const addfixtureInputs = [
    {
      type: InputTypes.SELECT,
      formKey: "fixture",
      label: t("Fixture"),
      options: fixtures
        .filter((item) => {
          const fixtureCountList = fixtureCountLists.find(
            (item) => item._id === fixtureCountListId
          );
          return !fixtureCountList?.fixtures?.some(
            (pro) => pro.fixture === item._id
          );
        })
        .map((fixture) => {
          return {
            value: fixture._id,
            label: fixture.name,
          };
        }),
      isMultiple: true,
      placeholder: t("Fixture"),
      required: true,
    },
  ];
  const addFixtureFormKey = [{ key: "fixture", type: FormKeyTypeEnum.STRING }];
  const columns = [{ key: t("Name"), isSortable: true }];
  const rowKeys: RowKeyType<any>[] = [{ key: "fixture" }];
  locations.forEach((item) => {
    columns.push({ key: item.name, isSortable: true });
    rowKeys.push({
      key: item._id,
      node: (row: any) =>
        isEnableEdit ? (
          <CheckSwitch
            checked={row[item._id]}
            onChange={() => handleLocationUpdate(row, item._id)}
          />
        ) : row[item?._id] ? (
          <IoCheckmark className="text-blue-500 text-2xl " />
        ) : (
          <IoCloseOutline className="text-red-800 text-2xl " />
        ),
    });
  });
  if (
    user &&
    [RoleEnum.MANAGER, RoleEnum.CATERINGMANAGER].includes(user?.role?._id)
  ) {
    columns.push({ key: t("Actions"), isSortable: false });
  }

  const addButton = {
    name: t("Add Fixture"),
    icon: "",
    className: "bg-blue-500 hover:text-blue-500 hover:border-blue-500 ",
    isModal: true,
    modal: fixtureCountListId ? (
      <GenericAddEditPanel
        isOpen={isAddModalOpen}
        close={() => setIsAddModalOpen(false)}
        inputs={addfixtureInputs}
        formKeys={addFixtureFormKey}
        submitItem={updateAccountFixtureCountList as any}
        isEditMode={true}
        setForm={setForm}
        topClassName="flex flex-col gap-2 "
        handleUpdate={() => {
          const FixtureCountListfixtures = () => {
            let fixtureRows = [];
            const fixtures =
              fixtureCountLists.find((item) => item._id === fixtureCountListId)
                ?.fixtures || [];
            const newFixtures = form.fixture?.map((item) => ({
              fixture: item,
              locations:
                fixtureCountLists.find(
                  (item) => item._id === fixtureCountListId
                )?.locations ?? [],
            }));
            fixtureRows = [...fixtures, ...newFixtures];
            return fixtureRows;
          };
          updateAccountFixtureCountList({
            id: fixtureCountListId,
            updates: {
              fixtures: FixtureCountListfixtures(),
            },
          });
        }}
      />
    ) : (
      ""
    ),
    isModalOpen: isAddModalOpen,
    setIsModal: setIsAddModalOpen,
    isPath: false,
  };
  const actions = [
    {
      name: t("Delete"),
      icon: <HiOutlineTrash />,
      setRow: setRowToAction,
      modal: rowToAction ? (
        <ConfirmationDialog
          isOpen={isCloseAllConfirmationDialogOpen}
          close={() => setIsCloseAllConfirmationDialogOpen(false)}
          confirm={() => {
            if (fixtureCountListId && rowToAction) {
              const currentFixtureCountList = fixtureCountLists.find(
                (item) => item._id === fixtureCountListId
              );
              const newFixtures = currentFixtureCountList?.fixtures?.filter(
                (item) =>
                  item.fixture !==
                  fixtures?.find((p) => p.name === rowToAction.fixture)?._id
              );
              updateAccountFixtureCountList({
                id: fixtureCountListId,
                updates: {
                  fixtures: newFixtures,
                },
              });
            }
            setIsCloseAllConfirmationDialogOpen(false);
          }}
          title={t("Delete Count List Item")}
          text={`${rowToAction?.fixture} ${t("GeneralDeleteMessage")}`}
        />
      ) : (
        ""
      ),
      className: "text-red-500 cursor-pointer text-2xl  ",
      isModal: true,
      isModalOpen: isCloseAllConfirmationDialogOpen,
      setIsModal: setIsCloseAllConfirmationDialogOpen,
      isPath: false,
    },
  ];
  const filters = [
    {
      isUpperSide: true,
      node: (
        <ButtonFilter
          buttonName={t("Count")}
          onclick={() => {
            setIsCountLocationModalOpen(true);
          }}
        />
      ),
    },
    {
      label: t("Location Edit"),
      isUpperSide: false,
      isDisabled: user
        ? ![RoleEnum.MANAGER, RoleEnum.CATERINGMANAGER].includes(user.role._id)
        : true,
      node: <SwitchButton checked={isEnableEdit} onChange={setIsEnableEdit} />,
    },
  ];

  useEffect(() => {
    setTableKey((prev) => prev + 1);
  }, [fixtureCountLists, fixtures, fixtureCountListId]);

  // adjust columns and rowkeys  according to locations deletes if neccessary
  locations.forEach((location) => {
    if (
      !fixtureCountLists
        .find((item) => item._id === fixtureCountListId)
        ?.locations.includes(location._id)
    ) {
      const columnIndex = columns.findIndex(
        (column) => column.key === location.name
      );
      if (columnIndex !== -1) {
        columns.splice(columnIndex, 1);
      }
      const rowKeyIndex = rowKeys.findIndex(
        (rKey) => rKey.key === location._id
      );
      if (rowKeyIndex !== -1) {
        rowKeys.splice(rowKeyIndex, 1);
      }
    }
  });

  if (!user) return <></>;
  return (
    <>
      <Header showLocationSelector={false} />
      <div className="flex flex-col gap-4">
        <div className="w-[95%] mx-auto">
          <div className="sm:w-1/4 ">
            <SelectInput
              options={FixtureCountListOption}
              value={
                selectedFixtureCountList
                  ? {
                      value: selectedFixtureCountList._id,
                      label: selectedFixtureCountList.name,
                    }
                  : {
                      value: currentFixtureCountList._id,
                      label: currentFixtureCountList.name,
                    }
              }
              onChange={(selectedOption) => {
                setSelectedFixtureCountList(
                  fixtureCountLists?.find(
                    (p) => p._id === selectedOption?.value
                  )
                );
                setCurrentPage(1);
                // setRowsPerPage(RowPerPageEnum.FIRST);
                setSearchQuery("");
                setSortConfigKey(null);
                navigate(`/fixture-count-list/${selectedOption?.value}`);
              }}
              placeholder={t("Select a count list")}
            />
          </div>
        </div>
        <div className="w-[95%] my-5 mx-auto ">
          <GenericTable
            key={tableKey}
            rowKeys={rowKeys}
            columns={columns}
            rows={rows()}
            isActionsActive={true}
            actions={
              [RoleEnum.MANAGER, RoleEnum.CATERINGMANAGER].includes(
                user.role._id
              )
                ? actions
                : undefined
            }
            addButton={
              [RoleEnum.MANAGER, RoleEnum.CATERINGMANAGER].includes(
                user.role._id
              )
                ? addButton
                : undefined
            }
            filters={filters}
            title={
              fixtureCountLists.find((row) => row._id === fixtureCountListId)
                ?.name
            }
          />

          {isCountLocationModalOpen && (
            <GenericAddEditPanel
              isOpen={isCountLocationModalOpen}
              close={() => setIsCountLocationModalOpen(false)}
              inputs={countLocationInputs}
              formKeys={countLocationFormKeys}
              submitItem={() => {}}
              submitFunction={async () => {
                if (countLocationForm.location === "" || !user) return;
                if (
                  counts?.filter((item) => {
                    return (
                      item.isCompleted === false &&
                      item.location === countLocationForm.location &&
                      item.user === user._id &&
                      (item.countList as AccountFixtureCountList)._id ===
                        fixtureCountListId
                    );
                  }).length > 0
                ) {
                  setCurrentPage(1);
                  setSearchQuery("");
                  setSortConfigKey(null);
                  navigate(
                    `/fixture-count/${countLocationForm.location}/${fixtureCountListId}`
                  );
                } else {
                  createAccountFixtureCount({
                    location: countLocationForm.location,
                    countList: fixtureCountListId,
                    isCompleted: false,
                    createdAt: new Date(),
                    user: user._id,
                  });
                  setCurrentPage(1);
                  setSearchQuery("");
                  setSortConfigKey(null);
                  navigate(
                    `/fixture-count/${countLocationForm.location}/${fixtureCountListId}`
                  );
                }
              }}
              setForm={setCountLocationForm}
              isEditMode={false}
              topClassName="flex flex-col gap-2 "
              buttonName={t("Submit")}
            />
          )}
        </div>
      </div>
    </>
  );
};

export default FixtureCountList;
