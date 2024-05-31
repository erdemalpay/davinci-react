import { format } from "date-fns";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FiEdit } from "react-icons/fi";
import { HiOutlineTrash } from "react-icons/hi2";
import { CheckoutCashout } from "../../types";
import {
  useCheckoutCashoutMutations,
  useGetCheckoutCashouts,
} from "../../utils/api/checkout/cashout";
import { useGetLocations } from "../../utils/api/location";
import { formatAsLocalDate } from "../../utils/format";
import { LocationInput } from "../../utils/panelInputs";
import { ConfirmationDialog } from "../common/ConfirmationDialog";
import GenericAddEditPanel from "../panelComponents/FormElements/GenericAddEditPanel";
import GenericTable from "../panelComponents/Tables/GenericTable";
import { FormKeyTypeEnum, InputTypes } from "../panelComponents/shared/types";

const Cashout = () => {
  const { t } = useTranslation();
  const cashouts = useGetCheckoutCashouts();
  const locations = useGetLocations();
  const [tableKey, setTableKey] = useState(0);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [rowToAction, setRowToAction] = useState<CheckoutCashout>();
  const [
    isCloseAllConfirmationDialogOpen,
    setIsCloseAllConfirmationDialogOpen,
  ] = useState(false);
  const {
    createCheckoutCashout,
    deleteCheckoutCashout,
    updateCheckoutCashout,
  } = useCheckoutCashoutMutations();
  const allRows =
    cashouts?.map((cashout) => ({
      ...cashout,
      usr: cashout?.user?.name,
      lctn: cashout?.location?.name,
      formattedDate: formatAsLocalDate(cashout?.date),
    })) ?? [];

  const [rows, setRows] = useState(allRows);
  const columns = [
    { key: t("Date"), isSortable: true },
    { key: t("User"), isSortable: true },
    { key: t("Location"), isSortable: true },
    { key: t("Amount"), isSortable: true },
    { key: t("Description"), isSortable: true },
    { key: t("Actions"), isSortable: false },
  ];

  const rowKeys = [
    {
      key: "date",
      className: "min-w-32 pr-2",
      node: (row: any) => {
        return row.formattedDate;
      },
    },
    {
      key: "usr",
      className: "min-w-32 pr-1",
    },
    { key: "lctn" },
    { key: "amount" },
    { key: "description" },
  ];
  const inputs = [
    {
      type: InputTypes.DATE,
      formKey: "date",
      label: t("Date"),
      placeholder: t("Date"),
      required: true,
      isDateInitiallyOpen: true,
    },
    LocationInput({ locations: locations, required: true }),
    {
      type: InputTypes.NUMBER,
      formKey: "amount",
      label: t("Amount"),
      placeholder: t("Amount"),
      required: true,
    },
    {
      type: InputTypes.TEXTAREA,
      formKey: "description",
      label: t("Description"),
      placeholder: t("Description"),
      required: false,
    },
  ];
  const formKeys = [
    { key: "date", type: FormKeyTypeEnum.DATE },
    { key: "location", type: FormKeyTypeEnum.STRING },
    { key: "amount", type: FormKeyTypeEnum.NUMBER },
    { key: "description", type: FormKeyTypeEnum.STRING },
  ];

  const addButton = {
    name: t(`Add Cashout`),
    isModal: true,
    modal: (
      <GenericAddEditPanel
        isOpen={isAddModalOpen}
        close={() => setIsAddModalOpen(false)}
        inputs={inputs}
        constantValues={{
          date: format(new Date(), "yyyy-MM-dd"),
        }}
        formKeys={formKeys}
        submitItem={createCheckoutCashout as any}
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
            deleteCheckoutCashout(rowToAction?._id);
            setIsCloseAllConfirmationDialogOpen(false);
          }}
          title={t("Delete Cashout")}
          text={`${rowToAction.amount} ${t("GeneralDeleteMessage")}`}
        />
      ) : null,
      className: "text-red-500 cursor-pointer text-2xl ml-auto ",
      isModal: true,
      isModalOpen: isCloseAllConfirmationDialogOpen,
      setIsModal: setIsCloseAllConfirmationDialogOpen,
      isPath: false,
    },
    {
      name: t("Edit"),
      icon: <FiEdit />,
      className: "text-blue-500 cursor-pointer text-xl mr-auto",
      isModal: true,
      setRow: setRowToAction,
      modal: rowToAction ? (
        <GenericAddEditPanel
          isOpen={isEditModalOpen}
          close={() => setIsEditModalOpen(false)}
          inputs={inputs}
          formKeys={formKeys}
          submitItem={updateCheckoutCashout as any}
          isEditMode={true}
          topClassName="flex flex-col gap-2 "
          itemToEdit={{
            id: rowToAction._id,
            updates: { ...rowToAction, location: rowToAction?.location?._id },
          }}
        />
      ) : null,
      isModalOpen: isEditModalOpen,
      setIsModal: setIsEditModalOpen,
      isPath: false,
    },
  ];
  useEffect(() => {
    setRows(allRows);
    setTableKey((prev) => prev + 1);
  }, [cashouts, locations]);

  return (
    <>
      <div className="w-[95%] mx-auto ">
        <GenericTable
          key={tableKey}
          rowKeys={rowKeys}
          actions={actions}
          columns={columns}
          rows={rows}
          title={t("Cashouts")}
          addButton={addButton}
        />
      </div>
    </>
  );
};

export default Cashout;