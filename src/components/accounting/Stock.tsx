import { useEffect, useState } from "react";
import { FiEdit } from "react-icons/fi";
import { HiOutlineTrash } from "react-icons/hi2";
import {
  AccountProduct,
  AccountStock,
  AccountStockType,
  AccountUnit,
  Location,
} from "../../types";
import {
  useAccountStockMutations,
  useGetAccountStocks,
} from "../../utils/api/account/stock";
import { ConfirmationDialog } from "../common/ConfirmationDialog";
import GenericAddEditPanel from "../panelComponents/FormElements/GenericAddEditPanel";
import GenericTable from "../panelComponents/Tables/GenericTable";
import { FormKeyTypeEnum, InputTypes } from "../panelComponents/shared/types";

type Props = {};
const inputs = [
  {
    type: InputTypes.TEXT,
    formKey: "name",
    label: "Name",
    placeholder: "Daha Bitmedi :)",
    required: true,
  },
];
const formKeys = [{ key: "name", type: FormKeyTypeEnum.STRING }];
const Stock = (props: Props) => {
  const stocks = useGetAccountStocks();
  const [tableKey, setTableKey] = useState(0);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [rowToAction, setRowToAction] = useState<AccountStock>();
  const [
    isCloseAllConfirmationDialogOpen,
    setIsCloseAllConfirmationDialogOpen,
  ] = useState(false);
  const [rows, setRows] = useState(
    stocks.map((stock) => {
      return {
        ...stock,
        prdct: (stock.product as AccountProduct).name,
        lctn: (stock.location as Location).name,
        stckTyp: (stock.stockType as AccountStockType).name,
        unt: (stock.unit as AccountUnit).name,
        totalPrice: (stock?.unitPrice ?? 0) * stock.quantity,
      };
    })
  );
  const { createAccountStock, deleteAccountStock, updateAccountStock } =
    useAccountStockMutations();
  const columns = [
    { key: "Stock Type", isSortable: true },
    { key: "Product", isSortable: true },
    { key: "Unit", isSortable: true },
    { key: "Location", isSortable: true },
    { key: "Quantity", isSortable: true },
    { key: "Unit Price", isSortable: true },
    { key: "Total Price", isSortable: true },
    { key: "Actions", isSortable: false },
  ];
  const rowKeys = [
    { key: "stckTyp" },
    { key: "prdct" },
    { key: "unt" },
    { key: "lctn" },
    { key: "quantity" },
    { key: "unitPrice" },
    { key: "totalPrice" },
  ];
  const addButton = {
    name: `Add Stock`,
    isModal: true,
    modal: (
      <GenericAddEditPanel
        isOpen={isAddModalOpen}
        close={() => setIsAddModalOpen(false)}
        inputs={inputs}
        formKeys={formKeys}
        submitItem={createAccountStock as any}
        topClassName="flex flex-col gap-2 "
        constantValues={{ used: false }}
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
      name: "Delete",
      icon: <HiOutlineTrash />,
      setRow: setRowToAction,
      modal: rowToAction ? (
        <ConfirmationDialog
          isOpen={isCloseAllConfirmationDialogOpen}
          close={() => setIsCloseAllConfirmationDialogOpen(false)}
          confirm={() => {
            deleteAccountStock(rowToAction?._id);
            setIsCloseAllConfirmationDialogOpen(false);
          }}
          title="Delete Stock"
          text={`${
            (rowToAction.product as AccountProduct).name
          } stock will be deleted. Are you sure you want to continue?`}
        />
      ) : null,
      className: "text-red-500 cursor-pointer text-2xl ml-auto ",
      isModal: true,
      isModalOpen: isCloseAllConfirmationDialogOpen,
      setIsModal: setIsCloseAllConfirmationDialogOpen,
      isPath: false,
    },
    {
      name: "Edit",
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
          submitItem={updateAccountStock as any}
          isEditMode={true}
          topClassName="flex flex-col gap-2 "
          itemToEdit={{ id: rowToAction._id, updates: rowToAction }}
        />
      ) : null,

      isModalOpen: isEditModalOpen,
      setIsModal: setIsEditModalOpen,

      isPath: false,
    },
  ];
  useEffect(() => {
    setRows(
      stocks.map((stock) => {
        return {
          ...stock,
          prdct: (stock.product as AccountProduct).name,
          lctn: (stock.location as Location).name,
          stckTyp: (stock.stockType as AccountStockType).name,
          unt: (stock.unit as AccountUnit).name,
          totalPrice: (stock?.unitPrice ?? 0) * stock.quantity,
        };
      })
    );
    setTableKey((prev) => prev + 1);
  }, [stocks]);

  return (
    <>
      <div className="w-[95%] mx-auto my-10">
        <GenericTable
          key={tableKey}
          rowKeys={rowKeys}
          actions={actions}
          columns={columns}
          rows={stocks}
          title="Stocks"
          addButton={addButton}
        />
      </div>
    </>
  );
};

export default Stock;
