import { Switch } from "@headlessui/react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FiEdit } from "react-icons/fi";
import { HiOutlineTrash } from "react-icons/hi2";
import { TbPencilPlus } from "react-icons/tb";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useGeneralContext } from "../../context/General.context";
import { AccountCountList, StockLocationEnum } from "../../types";
import {
  useAccountCountListMutations,
  useGetAccountCountLists,
} from "../../utils/api/account/countList";
import { NameInput } from "../../utils/panelInputs";
import { CheckSwitch } from "../common/CheckSwitch";
import { ConfirmationDialog } from "../common/ConfirmationDialog";
import GenericAddEditPanel from "../panelComponents/FormElements/GenericAddEditPanel";
import { FormKeyTypeEnum } from "../panelComponents/shared/types";
import ButtonTooltip from "../panelComponents/Tables/ButtonTooltip";
import GenericTable from "../panelComponents/Tables/GenericTable";

const CountLists = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const countLists = useGetAccountCountLists();
  const [tableKey, setTableKey] = useState(0);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isEnableEdit, setIsEnableEdit] = useState(false);
  const { countListActiveTab, setCountListActiveTab } = useGeneralContext();
  const [rowToAction, setRowToAction] = useState<AccountCountList>();
  const [
    isCloseAllConfirmationDialogOpen,
    setIsCloseAllConfirmationDialogOpen,
  ] = useState(false);
  const {
    createAccountCountList,
    deleteAccountCountList,
    updateAccountCountList,
  } = useAccountCountListMutations();

  function handleLocationUpdate(item: AccountCountList, location: string) {
    const newLocations = item.locations || [];
    const index = newLocations.indexOf(location);
    if (index === -1) {
      newLocations.push(location);
    } else {
      newLocations.splice(index, 1);
    }
    updateAccountCountList({
      id: item._id,
      updates: { locations: newLocations },
    });
    toast.success(`${t("Count List updated successfully")}`);
  }
  const columns = [
    { key: t("Name"), isSortable: true },
    { key: "Bahçeli", isSortable: false },
    { key: "Neorama", isSortable: false },
    { key: "Amazon", isSortable: false },
    { key: t("Actions"), isSortable: false },
  ];
  const rowKeys = [
    { key: "name" },
    {
      key: "bahceli",
      node: (row: AccountCountList) =>
        isEnableEdit ? (
          <CheckSwitch
            checked={row.locations?.includes(StockLocationEnum.BAHCELI)}
            onChange={() =>
              handleLocationUpdate(row, StockLocationEnum.BAHCELI)
            }
          />
        ) : (
          <p
            className={`w-fit px-2 py-1 rounded-md text-white ${
              row.locations?.includes(StockLocationEnum.BAHCELI)
                ? "bg-green-500"
                : "bg-red-500"
            }`}
          >
            {row.locations?.includes(StockLocationEnum.BAHCELI)
              ? t("Yes")
              : t("No")}
          </p>
        ),
    },
    {
      key: "neorama",
      node: (row: AccountCountList) =>
        isEnableEdit ? (
          <CheckSwitch
            checked={row.locations?.includes(StockLocationEnum.NEORAMA)}
            onChange={() =>
              handleLocationUpdate(row, StockLocationEnum.NEORAMA)
            }
          />
        ) : (
          <p
            className={`w-fit px-2 py-1 rounded-md text-white ${
              row.locations?.includes(StockLocationEnum.NEORAMA)
                ? "bg-green-500"
                : "bg-red-500"
            }`}
          >
            {row.locations?.includes(StockLocationEnum.NEORAMA)
              ? t("Yes")
              : t("No")}
          </p>
        ),
    },
    {
      key: "amazon",
      node: (row: AccountCountList) =>
        isEnableEdit ? (
          <CheckSwitch
            checked={row.locations?.includes(StockLocationEnum.AMAZON)}
            onChange={() => handleLocationUpdate(row, StockLocationEnum.AMAZON)}
          />
        ) : (
          <p
            className={`w-fit px-2 py-1 rounded-md text-white ${
              row.locations?.includes(StockLocationEnum.AMAZON)
                ? "bg-green-500"
                : "bg-red-500"
            }`}
          >
            {row.locations?.includes(StockLocationEnum.AMAZON)
              ? t("Yes")
              : t("No")}
          </p>
        ),
    },
  ];
  const inputs = [NameInput()];
  const formKeys = [{ key: "name", type: FormKeyTypeEnum.STRING }];

  const addButton = {
    name: t(`Add Count List`),
    isModal: true,
    modal: (
      <GenericAddEditPanel
        isOpen={isAddModalOpen}
        close={() => {
          setCountListActiveTab(countListActiveTab + 1);
          setIsAddModalOpen(false);
        }}
        inputs={inputs}
        formKeys={formKeys}
        submitItem={createAccountCountList as any}
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
            deleteAccountCountList(rowToAction?._id);
            setCountListActiveTab(countListActiveTab - 1);
            setIsCloseAllConfirmationDialogOpen(false);
          }}
          title={t("Delete Count List")}
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
      className: "text-blue-500 cursor-pointer text-xl ",
      isModal: true,
      setRow: setRowToAction,
      modal: rowToAction ? (
        <GenericAddEditPanel
          isOpen={isEditModalOpen}
          close={() => setIsEditModalOpen(false)}
          inputs={inputs}
          formKeys={formKeys}
          submitItem={updateAccountCountList as any}
          isEditMode={true}
          topClassName="flex flex-col gap-2 "
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
    {
      name: t("Count"),
      setRow: setRowToAction,
      icon: <TbPencilPlus />,
      className: "text-blue-500 cursor-pointer text-xl mr-auto",
      isModal: false,
      isPath: false,
      node: (row: AccountCountList) => {
        return (
          <button
            className="cursor-pointer mt-1"
            onClick={() => {
              navigate(`/count/${row._id}`);
            }}
          >
            <ButtonTooltip content={t("Count")}>
              <TbPencilPlus className="text-green-500 cursor-pointer text-xl " />
            </ButtonTooltip>
          </button>
        );
      },
    },
  ];
  const filters = [
    {
      label: t("Location Edit"),
      isUpperSide: false,
      node: (
        <Switch
          checked={isEnableEdit}
          onChange={() => setIsEnableEdit((value) => !value)}
          className={`${isEnableEdit ? "bg-green-500" : "bg-red-500"}
          relative inline-flex h-[20px] w-[36px] min-w-[36px] border-[1px] cursor-pointer rounded-full border-transparent transition-colors duration-200 ease-in-out focus:outline-none`}
        >
          <span
            aria-hidden="true"
            className={`${isEnableEdit ? "translate-x-4" : "translate-x-0"}
            pointer-events-none inline-block h-[18px] w-[18px] transform rounded-full bg-white transition duration-200 ease-in-out`}
          />
        </Switch>
      ),
    },
  ];
  useEffect(() => setTableKey((prev) => prev + 1), [countLists]);

  return (
    <>
      <div className="w-[95%] mx-auto ">
        <GenericTable
          key={tableKey}
          rowKeys={rowKeys}
          actions={actions}
          columns={columns}
          filters={filters}
          rows={countLists}
          title={t("Count Lists")}
          addButton={addButton}
        />
      </div>
    </>
  );
};

export default CountLists;
