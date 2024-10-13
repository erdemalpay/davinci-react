import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { CiSearch } from "react-icons/ci";
import { FiEdit } from "react-icons/fi";
import { HiOutlineTrash } from "react-icons/hi2";
import { useGeneralContext } from "../../context/General.context";
import { useUserContext } from "../../context/User.context";
import { AccountStock, RoleEnum, StockHistoryStatusEnum } from "../../types";
import { useGetAccountExpenseTypes } from "../../utils/api/account/expenseType";
import { useGetAccountProducts } from "../../utils/api/account/product";
import {
  useAccountStockMutations,
  useGetAccountStocks,
} from "../../utils/api/account/stock";
import { useGetAccountStockLocations } from "../../utils/api/account/stockLocation";
import { getItem } from "../../utils/getItem";
import {
  ExpenseTypeInput,
  ProductInput,
  QuantityInput,
  StockLocationInput,
} from "../../utils/panelInputs";
import { passesFilter } from "../../utils/passesFilter";
import { ConfirmationDialog } from "../common/ConfirmationDialog";
import GenericAddEditPanel from "../panelComponents/FormElements/GenericAddEditPanel";
import GenericTable from "../panelComponents/Tables/GenericTable";
import SwitchButton from "../panelComponents/common/SwitchButton";
import { FormKeyTypeEnum } from "../panelComponents/shared/types";

type FormElementsState = {
  [key: string]: any;
};
const Stock = () => {
  const { t } = useTranslation();
  const stocks = useGetAccountStocks();
  const { user } = useUserContext();
  const products = useGetAccountProducts();
  const expenseTypes = useGetAccountExpenseTypes();
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
      const expense = parseFloat(
        (
          (getItem(stock.product, products)?.unitPrice ?? 0) * stock.quantity
        ).toFixed(1)
      );
      return acc + expense;
    }, 0);
  });
  const { setCurrentPage, setSearchQuery, searchQuery } = useGeneralContext();
  const [filterPanelFormElements, setFilterPanelFormElements] =
    useState<FormElementsState>({
      product: [],
      location: "",
      expenseType: "",
    });
  const [form, setForm] = useState({
    product: "",
    location: "",
    quantity: 0,
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
        prdct: getItem(stock.product, products)?.name,
        lctn: getItem(stock.location, locations)?.name,
        unitPrice: getItem(stock.product, products)?.unitPrice,
        totalPrice: parseFloat(
          (
            (getItem(stock.product, products)?.unitPrice ?? 0) * stock.quantity
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
      invalidateKeys: [],
      required: true,
    }),
    StockLocationInput({ locations: locations }),
    QuantityInput(),
  ];
  const formKeys = [
    { key: "product", type: FormKeyTypeEnum.STRING },
    { key: "location", type: FormKeyTypeEnum.STRING },
    { key: "quantity", type: FormKeyTypeEnum.NUMBER },
  ];
  const columns = [
    { key: t("Product"), isSortable: true },
    { key: t("Location"), isSortable: true },
    { key: t("Quantity"), isSortable: true },
    { key: t("Unit Price"), isSortable: true },
    { key: t("Total Price"), isSortable: true },
  ];

  const rowKeys = [
    { key: "prdct" },
    { key: "lctn" },
    { key: "quantity" },
    {
      key: "unitPrice",
      node: (row: any) => <div>{row.unitPrice} ₺</div>,
    },
    {
      key: "totalPrice",
      node: (row: any) => <div>{row.totalPrice} ₺</div>,
    },
  ];
  if (
    user &&
    ![
      RoleEnum.MANAGER,
      RoleEnum.CATERINGMANAGER,
      RoleEnum.GAMEMANAGER,
    ].includes(user?.role?._id)
  ) {
    const splicedColumns = ["Unit Price", "Total Price"];
    const splicedRowKeys = ["unitPrice", "totalPrice"];
    splicedColumns.forEach((item) => {
      columns.splice(
        columns.findIndex((column) => column.key === item),
        1
      );
    });
    splicedRowKeys.forEach((item) => {
      rowKeys.splice(
        rowKeys.findIndex((rowKey) => rowKey.key === item),
        1
      );
    });
  }
  if (isEnableEdit) {
    columns.push({ key: t("Action"), isSortable: false });
  }
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
            getItem(rowToAction.product, products)?.name
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
          product: row.product,
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
              product: stocks.find((stock) => stock._id === rowToAction._id)
                ?.product,
              location: stocks.find((stock) => stock._id === rowToAction._id)
                ?.location,
              quantity: stocks.find((stock) => stock._id === rowToAction._id)
                ?.quantity,
              unitPrice: getItem(
                stocks.find((stock) => stock._id === rowToAction._id)?.product,
                products
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
      isDisabled: user ? ![RoleEnum.MANAGER].includes(user?.role?._id) : true,
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
          passesFilter(filterPanelFormElements.location, stock.location) &&
          getItem(stock.product, products)?.expenseType?.some((type) =>
            passesFilter(filterPanelFormElements.expenseType, type)
          ) &&
          (!filterPanelFormElements.product.length ||
            filterPanelFormElements.product?.some((panelProduct: string) =>
              passesFilter(panelProduct, getItem(stock.product, products)?._id)
            ))
        );
      })
      .map((stock) => {
        return {
          ...stock,
          prdct: getItem(stock.product, products)?.name,
          lctn: getItem(stock.location, locations)?.name,
          unitPrice: getItem(stock.product, products)?.unitPrice,
          totalPrice: parseFloat(
            (
              (getItem(stock.product, products)?.unitPrice ?? 0) *
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
      const expense = parseFloat(
        (
          (getItem(stock.product, products)?.unitPrice ?? 0) * stock.quantity
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
    ProductInput({
      products: products,
      required: true,
      isMultiple: true,
    }),
    ExpenseTypeInput({ expenseTypes: expenseTypes, required: true }),
    StockLocationInput({ locations: locations }),
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
          columns={columns}
          rows={rows}
          title={t("Product Stocks")}
          addButton={addButton}
          filterPanel={filterPanel}
          isSearch={false}
          outsideSearch={outsideSearch}
          isActionsActive={isEnableEdit}
        />
      </div>
    </>
  );
};

export default Stock;
