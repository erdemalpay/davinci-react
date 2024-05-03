import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FiEdit } from "react-icons/fi";
import { HiOutlineTrash } from "react-icons/hi2";
import { TbPencilPlus } from "react-icons/tb";
import { useNavigate } from "react-router-dom";
import { AccountCountList, AccountStockLocation } from "../../types";
import {
  useAccountCountListMutations,
  useGetAccountCountLists,
} from "../../utils/api/account/countList";
import { useGetAccountStockLocations } from "../../utils/api/account/stockLocation";
import { NameInput, StockLocationInput } from "../../utils/panelInputs";
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
  const locations = useGetAccountStockLocations();
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
  const columns = [
    { key: t("Name"), isSortable: true },
    { key: t("Location"), isSortable: true },
    { key: t("Actions"), isSortable: false },
  ];
  const rowKeys = [
    {
      key: "name",
      node: (row: AccountCountList) => (
        <p
          className="text-blue-700  w-fit  cursor-pointer hover:text-blue-500 transition-transform"
          onClick={() => {
            navigate(`/count-list/${row._id}`);
          }}
        >
          {row.name}
        </p>
      ),
      className: "min-w-32 pr-1",
    },
    {
      key: "location",
      node: (row: AccountCountList) => (
        <p>{(row.location as AccountStockLocation).name}</p>
      ),
    },
  ];
  const inputs = [NameInput(), StockLocationInput({ locations: locations })];
  const formKeys = [
    { key: "name", type: FormKeyTypeEnum.STRING },
    { key: "location", type: FormKeyTypeEnum.STRING },
  ];

  const addButton = {
    name: t(`Add Count List`),
    isModal: true,
    modal: (
      <GenericAddEditPanel
        isOpen={isAddModalOpen}
        close={() => setIsAddModalOpen(false)}
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
          close={() => setIsCloseAllConfirmationDialogOpen(false)}
          confirm={() => {
            deleteAccountCountList(rowToAction?._id);
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
              location: (rowToAction.location as AccountStockLocation)._id,
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
  useEffect(() => setTableKey((prev) => prev + 1), [countLists]);

  return (
    <>
      <div className="w-[95%] mx-auto ">
        <GenericTable
          key={tableKey}
          rowKeys={rowKeys}
          actions={actions}
          columns={columns}
          rows={countLists}
          title={t("Count Lists")}
          addButton={addButton}
        />
      </div>
    </>
  );
};

export default CountLists;
