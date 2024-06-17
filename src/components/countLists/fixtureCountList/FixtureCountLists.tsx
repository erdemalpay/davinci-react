import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FiEdit } from "react-icons/fi";
import { HiOutlineTrash } from "react-icons/hi2";
import { IoCheckmark, IoCloseOutline } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useGeneralContext } from "../../../context/General.context";
import { AccountFixtureCountList } from "../../../types";
import {
  useAccountFixtureCountListMutations,
  useGetAccountFixtureCountLists,
} from "../../../utils/api/account/fixtureCountList";
import { useGetAccountStockLocations } from "../../../utils/api/account/stockLocation";
import { NameInput } from "../../../utils/panelInputs";
import { CheckSwitch } from "../../common/CheckSwitch";
import { ConfirmationDialog } from "../../common/ConfirmationDialog";
import SwitchButton from "../../panelComponents/common/SwitchButton";
import GenericAddEditPanel from "../../panelComponents/FormElements/GenericAddEditPanel";
import {
  FormKeyTypeEnum,
  RowKeyType,
} from "../../panelComponents/shared/types";
import GenericTable from "../../panelComponents/Tables/GenericTable";

const FixtureCountLists = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const fixtureCountLists = useGetAccountFixtureCountLists();
  const [tableKey, setTableKey] = useState(0);
  const locations = useGetAccountStockLocations();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isEnableEdit, setIsEnableEdit] = useState(false);
  const [rowToAction, setRowToAction] = useState<AccountFixtureCountList>();
  const { setCurrentPage, setSortConfigKey, setSearchQuery } =
    useGeneralContext();
  const [
    isCloseAllConfirmationDialogOpen,
    setIsCloseAllConfirmationDialogOpen,
  ] = useState(false);
  const {
    createAccountFixtureCountList,
    updateAccountFixtureCountList,
    deleteAccountFixtureCountList,
  } = useAccountFixtureCountListMutations();

  function handleLocationUpdate(
    item: AccountFixtureCountList,
    location: string
  ) {
    const newLocations = item.locations || [];
    const index = newLocations.indexOf(location);
    if (index === -1) {
      newLocations.push(location);
    } else {
      newLocations.splice(index, 1);
    }
    updateAccountFixtureCountList({
      id: item._id,
      updates: { locations: newLocations },
    });
    toast.success(`${t("Count List updated successfully")}`);
  }
  const columns = [{ key: t("Name"), isSortable: true }];
  const rowKeys: RowKeyType<AccountFixtureCountList>[] = [
    {
      key: "name",
      node: (row: AccountFixtureCountList) => (
        <p
          className="text-blue-700  w-fit  cursor-pointer hover:text-blue-500 transition-transform"
          onClick={() => {
            setCurrentPage(1);
            // setRowsPerPage(RowPerPageEnum.FIRST);
            setSearchQuery("");
            setSortConfigKey(null);
            navigate(`/fixture-count-list/${row._id}`);
          }}
        >
          {row.name}
        </p>
      ),
    },
  ];

  // Adding location columns and rowkeys
  for (const location of locations) {
    columns.push({ key: location?.name, isSortable: true });
    rowKeys.push({
      key: location._id,
      node: (row: AccountFixtureCountList) =>
        isEnableEdit ? (
          <CheckSwitch
            checked={row?.locations?.includes(location._id)}
            onChange={() => handleLocationUpdate(row, location?._id)}
          />
        ) : row?.locations?.includes(location?._id) ? (
          <IoCheckmark
            className={`text-blue-500 text-2xl ${
              row?.locations?.length > 1 ? "" : "mx-auto"
            }`}
          />
        ) : (
          <IoCloseOutline
            className={`text-red-800 text-2xl ${
              row?.locations?.length > 1 ? "" : "mx-auto"
            }`}
          />
        ),
    });
  }
  columns.push({ key: t("Actions"), isSortable: false });
  const inputs = [NameInput()];
  const formKeys = [{ key: "name", type: FormKeyTypeEnum.STRING }];

  const addButton = {
    name: t(`Add Fixture Count List`),
    isModal: true,
    modal: (
      <GenericAddEditPanel
        isOpen={isAddModalOpen}
        close={() => {
          setIsAddModalOpen(false);
        }}
        inputs={inputs}
        formKeys={formKeys}
        submitItem={createAccountFixtureCountList as any}
        topClassName="flex flex-col gap-2 "
      />
    ),
    isModalOpen: isAddModalOpen,
    setIsModal: setIsAddModalOpen,
    isPath: false,
    icon: null,
    className: "bg-blue-500 hover:text-blue-500 hover:border-blue-500 ",
  };
  const actions = [
    {
      name: t("Delete"),
      icon: <HiOutlineTrash />,
      setRow: setRowToAction,
      modal: rowToAction ? (
        <ConfirmationDialog
          isOpen={isCloseAllConfirmationDialogOpen}
          close={() => {
            setIsCloseAllConfirmationDialogOpen(false);
          }}
          confirm={() => {
            deleteAccountFixtureCountList(rowToAction?._id);
            setIsCloseAllConfirmationDialogOpen(false);
          }}
          title={t("Delete Fixture Count List")}
          text={`${rowToAction.name} ${t("GeneralDeleteMessage")}`}
        />
      ) : null,
      className: "text-red-500 cursor-pointer text-2xl  ",
      isModal: true,
      isModalOpen: isCloseAllConfirmationDialogOpen,
      setIsModal: setIsCloseAllConfirmationDialogOpen,
      isPath: false,
    },
    {
      name: t("Edit"),
      icon: <FiEdit />,
      className: "text-blue-500 cursor-pointer text-xl  ",
      isModal: true,
      setRow: setRowToAction,
      modal: rowToAction ? (
        <GenericAddEditPanel
          isOpen={isEditModalOpen}
          close={() => {
            setIsEditModalOpen(false);
          }}
          inputs={inputs}
          formKeys={formKeys}
          submitItem={updateAccountFixtureCountList as any}
          isEditMode={true}
          topClassName="flex flex-col gap-2  "
          submitFunction={() => {
            updateAccountFixtureCountList({
              id: rowToAction._id,
              updates: {
                name: rowToAction.name,
              },
            });
          }}
          itemToEdit={{
            id: rowToAction._id,
            updates: {
              name: rowToAction.name,
            },
          }}
        />
      ) : null,
      isModalOpen: isEditModalOpen,
      setIsModal: setIsEditModalOpen,
      isPath: false,
    },
  ];
  const filters = [
    {
      label: t("Location Edit"),
      isUpperSide: false,
      node: <SwitchButton checked={isEnableEdit} onChange={setIsEnableEdit} />,
    },
  ];
  useEffect(
    () => setTableKey((prev) => prev + 1),
    [fixtureCountLists, locations]
  );

  return (
    <>
      <div className="w-[95%] mx-auto ">
        <GenericTable
          key={tableKey}
          rowKeys={rowKeys}
          actions={actions}
          isActionsActive={true}
          columns={columns}
          filters={filters}
          rows={fixtureCountLists}
          title={t("Fixture Count Lists")}
          addButton={addButton}
        />
      </div>
    </>
  );
};

export default FixtureCountLists;
