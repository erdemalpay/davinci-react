import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { CiSearch } from "react-icons/ci";
import { FiEdit } from "react-icons/fi";
import { HiOutlineTrash } from "react-icons/hi2";
import { useGeneralContext } from "../../context/General.context";
import {
  AccountPackageType,
  AccountProduct,
  AccountStock,
  AccountStockLocation,
  StockHistoryStatusEnum,
} from "../../types";
import { useGetAccountPackageTypes } from "../../utils/api/account/packageType";
import { useGetAccountProducts } from "../../utils/api/account/product";
import {
  useAccountStockMutations,
  useGetAccountStocks,
} from "../../utils/api/account/stock";
import { useGetAccountStockLocations } from "../../utils/api/account/stockLocation";
import { useGetAccountUnits } from "../../utils/api/account/unit";
import {
  ProductInput,
  QuantityInput,
  StockLocationInput,
} from "../../utils/panelInputs";
import { passesFilter } from "../../utils/passesFilter";
import { ConfirmationDialog } from "../common/ConfirmationDialog";
import GenericAddEditPanel from "../panelComponents/FormElements/GenericAddEditPanel";
import GenericTable from "../panelComponents/Tables/GenericTable";
import SwitchButton from "../panelComponents/common/SwitchButton";
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
  const [temporarySearch, setTemporarySearch] = useState("");
  const [rowToAction, setRowToAction] = useState<AccountStock>();
  const [generalTotalExpense, setGeneralTotalExpense] = useState(() => {
    return stocks.reduce((acc, stock) => {
      const expense = stock.packageType
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
          );
      return acc + expense;
    }, 0);
  });
  const { setCurrentPage, setSearchQuery, searchQuery } = useGeneralContext();
  const [filterPanelFormElements, setFilterPanelFormElements] =
    useState<FormElementsState>({
      product: "",
      location: "",
      packageType: "",
    });
  const [form, setForm] = useState({
    product: "",
    location: "",
    quantity: 0,
    packageType: "",
    status: "",
  });
  const [
    isCloseAllConfirmationDialogOpen,
    setIsCloseAllConfirmationDialogOpen,
  ] = useState(false);
  const [rows, setRows] = useState(
    stocks.map((stock) => {
      return {
        ...stock,
        prdct: (stock.product as AccountProduct)?.name,
        pckgType: (stock?.packageType as AccountPackageType)?.name,
        lctn: (stock.location as AccountStockLocation)?.name,
        unit: units?.find(
          (unit) => unit._id === (stock.product as AccountProduct)?.unit
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
    ProductInput({
      products: products,
      invalidateKeys: [{ key: "packageType", defaultValue: "" }],
      required: true,
    }),
    {
      type: InputTypes.SELECT,
      formKey: "packageType",
      label: t("Package Type"),
      options: products
        .find((prod) => prod._id === form?.product)
        ?.packages?.map((item) => {
          const packageType = packages.find((pkg) => pkg._id === item.package);
          return {
            value: packageType?._id,
            label: packageType?.name,
          };
        }),
      placeholder: t("Package Type"),
      required: true,
      isDisabled: false,
    },
    StockLocationInput({ locations: locations }),
    QuantityInput(),
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
        constantValues={{ status: StockHistoryStatusEnum.STOCKENTRY }}
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
      label: t("Total") + " :",
      isUpperSide: false,
      node: (
        <div className="flex flex-row gap-2">
          <p>
            {new Intl.NumberFormat("en-US", {
              style: "decimal",
              minimumFractionDigits: 3,
              maximumFractionDigits: 3,
            }).format(generalTotalExpense)}{" "}
            ₺
          </p>
        </div>
      ),
    },
    {
      label: t("Enable Edit"),
      isUpperSide: true,
      node: <SwitchButton checked={isEnableEdit} onChange={setIsEnableEdit} />,
    },
    {
      label: t("Show Filters"),
      isUpperSide: true,
      node: <SwitchButton checked={showFilters} onChange={setShowFilters} />,
    },
  ];
  useEffect(() => {
    const processedRows = stocks
      .filter((stock) => {
        return (
          passesFilter(
            filterPanelFormElements.location,
            (stock.location as AccountStockLocation)?._id
          ) &&
          passesFilter(
            filterPanelFormElements.product,
            (stock.product as AccountProduct)?._id
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
          lctn: (stock.location as AccountStockLocation)?.name,
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
      });
    const filteredRows = processedRows.filter((row) =>
      rowKeys.some((rowKey) => {
        const value = row[rowKey.key as keyof typeof row];
        const query = searchQuery.trimStart().toLocaleLowerCase("tr-TR");
        if (typeof value === "string") {
          return value.toLocaleLowerCase("tr-TR").includes(query);
        } else if (typeof value === "number") {
          return value.toString().includes(query);
        } else if (typeof value === "boolean") {
          return (value ? "true" : "false").includes(query);
        }
        return false;
      })
    );
    const newGeneralTotalExpense = filteredRows.reduce((acc, stock) => {
      const expense = stock.packageType
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
          );
      return acc + expense;
    }, 0);
    setRows(filteredRows);
    setGeneralTotalExpense(newGeneralTotalExpense);
    if (
      searchQuery !== "" ||
      Object.values(filterPanelFormElements).some((value) => value !== "")
    ) {
      setCurrentPage(1);
    }
    setTableKey((prev) => prev + 1);
  }, [stocks, filterPanelFormElements, searchQuery]);
  const filterPanelInputs = [
    ProductInput({ products: products, required: true }),
    StockLocationInput({ locations: locations }),
    {
      type: InputTypes.SELECT,
      formKey: "packageType",
      label: t("Package Type"),
      options: packages
        .sort((a, b) => a.quantity - b.quantity)
        .map((item) => {
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
  const outsideSearch = () => {
    return (
      <div className="flex flex-row relative min-w-32">
        <input
          type="text"
          value={temporarySearch}
          onChange={(e) => {
            setTemporarySearch(e.target.value);
            if (e.target.value === "") {
              setSearchQuery(e.target.value);
            }
          }}
          autoFocus={true}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              setSearchQuery(temporarySearch);
            }
          }}
          placeholder={t("Search")}
          className="border border-gray-200 rounded-md py-2 px-3 w-full focus:outline-none"
        />
        <CiSearch
          className="w-9 h-full p-2 bg-blue-gray-100 text-black cursor-pointer my-auto rounded-md absolute right-0 top-1/2 transform -translate-y-1/2"
          onClick={() => {
            setSearchQuery(temporarySearch);
          }}
        />
      </div>
    );
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
          title={t("Product Stocks")}
          addButton={addButton}
          filterPanel={filterPanel}
          isSearch={false}
          outsideSearch={outsideSearch}
        />
      </div>
    </>
  );
};

export default Stock;
