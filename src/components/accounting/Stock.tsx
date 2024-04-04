import { Switch } from "@headlessui/react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FiEdit } from "react-icons/fi";
import { HiOutlineTrash } from "react-icons/hi2";
import { useGeneralContext } from "../../context/General.context";
import {
  AccountProduct,
  AccountStock,
  AccountStockLocation,
  AccountStockType,
  AccountUnit,
} from "../../types";
import { useGetAccountProducts } from "../../utils/api/account/product";
import {
  useAccountStockMutations,
  useGetAccountStocks,
} from "../../utils/api/account/stock";
import { useGetAccountStockLocations } from "../../utils/api/account/stockLocation";
import { useGetAccountStockTypes } from "../../utils/api/account/stockType";
import { useGetAccountUnits } from "../../utils/api/account/unit";
import { passesFilter } from "../../utils/passesFilter";
import { ConfirmationDialog } from "../common/ConfirmationDialog";
import GenericAddEditPanel from "../panelComponents/FormElements/GenericAddEditPanel";
import GenericTable from "../panelComponents/Tables/GenericTable";
import { FormKeyTypeEnum, InputTypes } from "../panelComponents/shared/types";

type Props = {};

type FormElementsState = {
  [key: string]: any;
};
const Stock = (props: Props) => {
  const { t } = useTranslation();
  const stocks = useGetAccountStocks();
  const products = useGetAccountProducts();
  const units = useGetAccountUnits();
  const locations = useGetAccountStockLocations();
  const stockTypes = useGetAccountStockTypes();
  const [tableKey, setTableKey] = useState(0);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isEnableEdit, setIsEnableEdit] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [rowToAction, setRowToAction] = useState<AccountStock>();
  const { setCurrentPage } = useGeneralContext();
  const [filterPanelFormElements, setFilterPanelFormElements] =
    useState<FormElementsState>({
      location: "",
      stockType: "",
    });
  const [form, setForm] = useState({
    product: "",
    location: "",
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
        lctn: (stock.location as AccountStockLocation).name,
        stockType: stockTypes?.find(
          (stockType) =>
            stockType._id === (stock.product as AccountProduct).stockType
        )?.name,
        unit: units?.find(
          (unit) => unit._id === (stock.product as AccountProduct).unit
        )?.name,
        totalPrice: parseFloat(
          ((stock?.unitPrice ?? 0) * stock.quantity).toFixed(1)
        ),
      };
    })
  );

  const { createAccountStock, deleteAccountStock, updateAccountStock } =
    useAccountStockMutations();
  const inputs = [
    {
      type: InputTypes.SELECT,
      formKey: "product",
      label: t("Product"),
      options: products.map((product) => {
        return {
          value: product._id,
          label: product.name + `(${(product.unit as AccountUnit).name})`,
        };
      }),
      placeholder: t("Product"),
      required: true,
    },
    {
      type: InputTypes.SELECT,
      formKey: "location",
      label: t("Location"),
      options: locations.map((location) => {
        return {
          value: location._id,
          label: location.name,
        };
      }),
      placeholder: t("Location"),
      required: true,
    },
    {
      type: InputTypes.NUMBER,
      formKey: "quantity",
      label: t("Quantity"),
      placeholder: t("Quantity"),
      required: true,
    },
  ];
  const formKeys = [
    { key: "product", type: FormKeyTypeEnum.STRING },
    { key: "location", type: FormKeyTypeEnum.STRING },
    { key: "quantity", type: FormKeyTypeEnum.NUMBER },
  ];
  const columns = [
    { key: t("Stock Type"), isSortable: true },
    { key: t("Product"), isSortable: true },
    { key: t("Unit"), isSortable: true },
    { key: t("Location"), isSortable: true },
    { key: t("Quantity"), isSortable: true },
    { key: t("Unit Price"), isSortable: true },
    { key: t("Total Price"), isSortable: true },
  ];

  const rowKeys = [
    {
      key: "stockType",
      node: (row: any) => (
        <div
          className={` px-2 py-1 rounded-md  w-fit text-white`}
          style={{
            backgroundColor: stockTypes?.find(
              (stockType) =>
                stockType._id === (row.product as AccountProduct).stockType
            )?.backgroundColor,
          }}
        >
          {row?.stockType}
        </div>
      ),
    },
    { key: "prdct" },
    { key: "unit" },
    { key: "lctn" },
    { key: "quantity" },
    { key: "unitPrice" },
    { key: "totalPrice", className: !isEnableEdit ? "text-center" : "" },
  ];
  const addButton = {
    name: t("Add Stock"),
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
      name: t("Delete"),
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
          title={t("Delete Stock")}
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
      name: t("Edit"),
      icon: <FiEdit />,
      className: "text-blue-500 cursor-pointer text-xl mr-auto",
      isModal: true,
      setRow: setRowToAction,
      setForm: setForm,
      onClick: (row: AccountStock) => {
        setForm({
          ...form,
          product: (row.product as AccountProduct)._id,
        });
      },
      modal: rowToAction ? (
        <GenericAddEditPanel
          isOpen={isEditModalOpen}
          close={() => setIsEditModalOpen(false)}
          inputs={inputs}
          formKeys={formKeys}
          submitItem={updateAccountStock as any}
          isEditMode={true}
          topClassName="flex flex-col gap-2 "
          itemToEdit={{
            id: rowToAction._id,
            updates: {
              product: (
                stocks.find((stock) => stock._id === rowToAction._id)
                  ?.product as AccountProduct
              )?._id,

              stockType: (
                stocks.find((stock) => stock._id === rowToAction._id)
                  ?.stockType as AccountStockType
              )?._id,
              location: (
                stocks.find((stock) => stock._id === rowToAction._id)
                  ?.location as AccountStockLocation
              )?._id,
              quantity: stocks.find((stock) => stock._id === rowToAction._id)
                ?.quantity,
              unitPrice: stocks.find((stock) => stock._id === rowToAction._id)
                ?.unitPrice,
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
      label: t("Enable Edit"),
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
    {
      label: t("Show Filters"),
      isUpperSide: true,
      node: (
        <Switch
          checked={showFilters}
          onChange={() => setShowFilters((value) => !value)}
          className={`${showFilters ? "bg-green-500" : "bg-red-500"}
          relative inline-flex h-[20px] w-[36px] min-w-[36px] border-[1px] cursor-pointer rounded-full border-transparent transition-colors duration-200 ease-in-out focus:outline-none`}
        >
          <span
            aria-hidden="true"
            className={`${showFilters ? "translate-x-4" : "translate-x-0"}
            pointer-events-none inline-block h-[18px] w-[18px] transform rounded-full bg-white transition duration-200 ease-in-out`}
          />
        </Switch>
      ),
    },
  ];
  useEffect(() => {
    setRows(
      stocks
        .filter((stock) => {
          return (
            passesFilter(
              filterPanelFormElements.location,
              (stock.location as AccountStockLocation)?._id
            ) &&
            passesFilter(
              filterPanelFormElements.stockType,
              stockTypes?.find(
                (stockType) =>
                  stockType._id === (stock.product as AccountProduct).stockType
              )?._id
            )
          );
        })
        .map((stock) => {
          return {
            ...stock,
            prdct: (stock.product as AccountProduct).name,
            lctn: (stock.location as AccountStockLocation).name,
            stockType: stockTypes?.find(
              (stockType) =>
                stockType._id === (stock.product as AccountProduct).stockType
            )?.name,
            unit: units?.find(
              (unit) => unit._id === (stock.product as AccountProduct).unit
            )?.name,
            totalPrice: parseFloat(
              ((stock?.unitPrice ?? 0) * stock.quantity).toFixed(1)
            ),
          };
        })
    );
    setCurrentPage(1);
    setTableKey((prev) => prev + 1);
  }, [stocks, filterPanelFormElements]);
  const filterPanelInputs = [
    {
      type: InputTypes.SELECT,
      formKey: "location",
      label: t("Location"),
      options: locations.map((item) => {
        return {
          value: item._id,
          label: item.name,
        };
      }),
      placeholder: t("Location"),
      required: true,
    },
    {
      type: InputTypes.SELECT,
      formKey: "stockType",
      label: t("Stock Type"),
      options: stockTypes.map((item) => {
        return {
          value: item._id,
          label: item.name,
        };
      }),
      placeholder: t("Stock Type"),
      required: true,
    },
  ];
  const filterPanel = {
    isFilterPanelActive: showFilters,
    inputs: filterPanelInputs,
    formElements: filterPanelFormElements,
    setFormElements: setFilterPanelFormElements,
    closeFilters: () => setShowFilters(false),
  };
  return (
    <>
      <div className="w-[95%] mx-auto ">
        <GenericTable
          key={tableKey}
          rowKeys={rowKeys}
          actions={isEnableEdit ? actions : []}
          filters={filters}
          columns={
            isEnableEdit
              ? [...columns, { key: t("Action"), isSortable: false }]
              : columns
          }
          rows={rows}
          title={t("Stocks")}
          addButton={addButton}
          filterPanel={filterPanel}
        />
      </div>
    </>
  );
};

export default Stock;
