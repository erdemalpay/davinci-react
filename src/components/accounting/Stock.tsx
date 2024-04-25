import { Switch } from "@headlessui/react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FiEdit } from "react-icons/fi";
import { HiOutlineTrash } from "react-icons/hi2";
import { useGeneralContext } from "../../context/General.context";
import {
  AccountPackageType,
  AccountProduct,
  AccountStock,
  AccountStockLocation,
  AccountUnit,
} from "../../types";
import { useGetAccountPackageTypes } from "../../utils/api/account/packageType";
import { useGetAccountProducts } from "../../utils/api/account/product";
import {
  useAccountStockMutations,
  useGetAccountStocks,
} from "../../utils/api/account/stock";
import { useGetAccountStockLocations } from "../../utils/api/account/stockLocation";
import { useGetAccountUnits } from "../../utils/api/account/unit";
import { passesFilter } from "../../utils/passesFilter";
import { ConfirmationDialog } from "../common/ConfirmationDialog";
import GenericAddEditPanel from "../panelComponents/FormElements/GenericAddEditPanel";
import GenericTable from "../panelComponents/Tables/GenericTable";
import { FormKeyTypeEnum, InputTypes } from "../panelComponents/shared/types";

type FormElementsState = {
  [key: string]: any;
};
const Stock = () => {
  const { t } = useTranslation();
  const stocks = useGetAccountStocks();
  const units = useGetAccountUnits();
  const products = useGetAccountProducts();
  const packages = useGetAccountPackageTypes();
  const locations = useGetAccountStockLocations();
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
      packageType: "",
    });
  const [form, setForm] = useState({
    product: "",
    location: "",
    quantity: 0,
    packageType: "",
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
        pckgType: (stock?.packageType as AccountPackageType)?.name,
        lctn: (stock.location as AccountStockLocation).name,
        unit: units?.find(
          (unit) => unit._id === (stock.product as AccountProduct).unit
        )?.name,
        unitPrice: stock?.packageType
          ? (stock.product as AccountProduct).packages?.find(
              (pkg) =>
                pkg.package === (stock?.packageType as AccountPackageType)?._id
            )?.packageUnitPrice
          : (stock.product as AccountProduct)?.unitPrice,
        totalPrice: stock?.packageType
          ? parseFloat(
              (
                ((stock.product as AccountProduct).unitPrice ?? 0) *
                stock.quantity *
                (stock.packageType as AccountPackageType).quantity
              ).toFixed(1)
            )
          : parseFloat(
              (
                ((stock.product as AccountProduct).unitPrice ?? 0) *
                stock.quantity
              ).toFixed(1)
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
      invalidateKeys: [{ key: "packageType", defaultValue: "" }],
      placeholder: t("Product"),
      required: true,
    },
    {
      type: InputTypes.SELECT,
      formKey: "packageType",
      label: t("Package Type"),
      options: packages.map((item) => {
        return {
          value: item._id,
          label: item.name,
        };
      }),
      placeholder: t("Package Type"),
      required:
        (products.find((prod) => prod._id === form?.product)?.packages
          ?.length ?? 0) > 0,
      isDisabled:
        (products?.find((prod) => prod._id === form?.product)?.packages
          ?.length ?? 0) < 1,
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
    { key: "packageType", type: FormKeyTypeEnum.STRING },
    { key: "location", type: FormKeyTypeEnum.STRING },
    { key: "quantity", type: FormKeyTypeEnum.NUMBER },
  ];
  const columns = [
    { key: t("Product"), isSortable: true },
    { key: t("Package Type"), isSortable: true },
    { key: t("Unit"), isSortable: true },
    { key: t("Location"), isSortable: true },
    { key: t("Quantity"), isSortable: true },
    { key: t("Unit Price"), isSortable: true },
    { key: t("Total Price"), isSortable: true },
  ];

  const rowKeys = [
    { key: "prdct" },
    { key: "pckgType", className: "min-w-32 " },
    { key: "unit" },
    { key: "lctn" },
    { key: "quantity" },
    {
      key: "unitPrice",
      node: (row: any) => <div>{row.unitPrice} ₺</div>,
    },
    {
      key: "totalPrice",
      node: (row: any) => (
        <div className={!isEnableEdit ? "text-center" : ""}>
          {row.totalPrice} ₺
        </div>
      ),
    },
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
        generalClassName="overflow-visible"
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
          generalClassName="overflow-visible"
          itemToEdit={{
            id: rowToAction._id,
            updates: {
              product: (
                stocks.find((stock) => stock._id === rowToAction._id)
                  ?.product as AccountProduct
              )?._id,
              location: (
                stocks.find((stock) => stock._id === rowToAction._id)
                  ?.location as AccountStockLocation
              )?._id,
              quantity: stocks.find((stock) => stock._id === rowToAction._id)
                ?.quantity,
              packageType: (
                stocks.find((stock) => stock._id === rowToAction._id)
                  ?.packageType as AccountPackageType
              )?._id,
              unitPrice: (
                stocks.find((stock) => stock._id === rowToAction._id)
                  ?.product as AccountProduct
              )?.unitPrice,
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
              filterPanelFormElements.packageType,
              (stock.packageType as AccountPackageType)?._id
            )
          );
        })
        .map((stock) => {
          return {
            ...stock,
            prdct: (stock.product as AccountProduct).name,
            pckgType: (stock?.packageType as AccountPackageType)?.name,
            lctn: (stock.location as AccountStockLocation).name,
            unitPrice: stock?.packageType
              ? (stock.product as AccountProduct).packages?.find(
                  (pkg) =>
                    pkg.package ===
                    (stock?.packageType as AccountPackageType)?._id
                )?.packageUnitPrice
              : (stock.product as AccountProduct)?.unitPrice,
            unit: units?.find(
              (unit) => unit._id === (stock.product as AccountProduct).unit
            )?.name,
            totalPrice: stock?.packageType
              ? parseFloat(
                  (
                    ((stock?.product as AccountProduct)?.packages?.find(
                      (pkg) =>
                        pkg.package ===
                        (stock.packageType as AccountPackageType)?._id
                    )?.packageUnitPrice ?? 0) *
                    stock.quantity *
                    (stock.packageType as AccountPackageType).quantity
                  ).toFixed(1)
                )
              : parseFloat(
                  (
                    ((stock.product as AccountProduct).unitPrice ?? 0) *
                    stock.quantity
                  ).toFixed(1)
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
      formKey: "packageType",
      label: t("Package Type"),
      options: packages.map((item) => {
        return {
          value: item._id,
          label: item.name,
        };
      }),
      placeholder: t("Package Type"),
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
