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
import { useGetAccountProducts } from "../../utils/api/account/product";
import {
  useAccountStockMutations,
  useGetAccountStocks,
} from "../../utils/api/account/stock";
import { useGetAccountStockTypes } from "../../utils/api/account/stockType";
import { useGetLocations } from "../../utils/api/location";
import { ConfirmationDialog } from "../common/ConfirmationDialog";
import GenericAddEditPanel from "../panelComponents/FormElements/GenericAddEditPanel";
import GenericTable from "../panelComponents/Tables/GenericTable";
import { FormKeyTypeEnum, InputTypes } from "../panelComponents/shared/types";

type Props = {};

const Stock = (props: Props) => {
  const stocks = useGetAccountStocks();
  const products = useGetAccountProducts();
  const locations = useGetLocations();
  const stockTypes = useGetAccountStockTypes();
  const [tableKey, setTableKey] = useState(0);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [rowToAction, setRowToAction] = useState<AccountStock>();
  const [form, setForm] = useState({
    product: "",
    unit: "",
    stockType: "",
    location: 0,
    quantity: 0,
    unitPrice: 0,
  });
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
  const unitOptions = () => {
    const selectedProduct = products.filter(
      (product) => product._id === form.product
    )[0];
    if (!selectedProduct) return;
    return [
      {
        value: (selectedProduct.unit as AccountUnit)._id,
        label: (selectedProduct.unit as AccountUnit).name,
      },
    ];
  };
  const inputs = [
    {
      type: InputTypes.SELECT,
      formKey: "product",
      label: "Product",
      options: products.map((product) => {
        return {
          value: product._id,
          label: product.name,
        };
      }),
      placeholder: "Product",
      invalidateKeys: [{ key: "unit", defaultValue: 0 }],
      required: true,
    },
    {
      type: InputTypes.SELECT,
      formKey: "unit",
      label: "Unit",
      options: unitOptions(),
      placeholder: "Unit",
      required: true,
    },
    {
      type: InputTypes.SELECT,
      formKey: "stockType",
      label: "Stock Type",
      options: stockTypes.map((stockType) => {
        return {
          value: stockType._id,
          label: stockType.name,
        };
      }),
      placeholder: "Stock Type",
      required: true,
    },
    {
      type: InputTypes.SELECT,
      formKey: "location",
      label: "Location",
      options: locations.map((location) => {
        return {
          value: location._id,
          label: location.name,
        };
      }),
      placeholder: "Location",
      required: true,
    },
    {
      type: InputTypes.NUMBER,
      formKey: "quantity",
      label: "Quantity",
      placeholder: "Quantity",
      required: true,
    },
    {
      type: InputTypes.NUMBER,
      formKey: "unitPrice",
      label: "Unit Price",
      placeholder: "Unit Price",
      required: false,
    },
  ];
  const formKeys = [
    { key: "product", type: FormKeyTypeEnum.STRING },
    { key: "unit", type: FormKeyTypeEnum.STRING },
    { key: "stockType", type: FormKeyTypeEnum.STRING },
    { key: "location", type: FormKeyTypeEnum.STRING },
    { key: "quantity", type: FormKeyTypeEnum.NUMBER },
    { key: "unitPrice", type: FormKeyTypeEnum.NUMBER },
  ];
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
        setForm={setForm}
        submitItem={createAccountStock as any}
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
      setForm: setForm,
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
          rows={rows}
          title="Stocks"
          addButton={addButton}
        />
      </div>
    </>
  );
};

export default Stock;
