import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { CiSearch } from "react-icons/ci";
import { FiEdit } from "react-icons/fi";
import { HiOutlineTrash } from "react-icons/hi2";
import { TbTransferIn } from "react-icons/tb";
import { toast } from "react-toastify";
import { useGeneralContext } from "../../context/General.context";
import { useUserContext } from "../../context/User.context";
import { AccountStock, RoleEnum, StockHistoryStatusEnum } from "../../types";
import { useGetAccountProducts } from "../../utils/api/account/product";
import {
  useAccountStockMutations,
  useGetAccountStocks,
  useStockTransferMutation,
} from "../../utils/api/account/stock";
import { useGetAccountStockLocations } from "../../utils/api/account/stockLocation";
import { getItem } from "../../utils/getItem";
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
import {
  FormKeyTypeEnum,
  GenericInputType,
  InputTypes,
} from "../panelComponents/shared/types";

type FormElementsState = {
  [key: string]: any;
};
const GameStock = () => {
  const { t } = useTranslation();
  const stocks = useGetAccountStocks();
  const { user } = useUserContext();
  const products = useGetAccountProducts();
  const locations = useGetAccountStockLocations();
  const [tableKey, setTableKey] = useState(0);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isEnableEdit, setIsEnableEdit] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [temporarySearch, setTemporarySearch] = useState("");
  const { mutate: stockTransfer } = useStockTransferMutation();
  const [rowToAction, setRowToAction] = useState<AccountStock>();
  const [isStockTransferModalOpen, setIsStockTransferModalOpen] =
    useState(false);
  const [stockTransferForm, setStockTransferForm] = useState({
    currentLocation: "",
    transferredLocation: "",
    quantity: 0,
  });
  const [generalTotalExpense, setGeneralTotalExpense] = useState(() => {
    return stocks
      .filter((stock) =>
        getItem(stock.product, products)?.expenseType?.includes("oys")
      )
      .reduce((acc, stock) => {
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

  const [rows, setRows] = useState(() => {
    const groupedProducts = stocks
      ?.filter((stock) =>
        getItem(stock.product, products)?.expenseType?.includes("oys")
      )
      ?.reduce((acc: any, stock) => {
        const productName = getItem(stock.product, products)?.name;
        const locationName = getItem(stock.location, locations)?.name;
        const unitPrice = getItem(stock.product, products)?.unitPrice ?? 0;
        const quantity = stock.quantity;
        const totalPrice = parseFloat((unitPrice * quantity).toFixed(1));
        if (!productName) {
          return acc;
        }
        if (!acc[productName]) {
          acc[productName] = {
            ...stock,
            prdct: productName,
            unitPrice,
            totalGroupPrice: 0,
            totalQuantity: 0,
            collapsible: {
              collapsibleColumns: [
                { key: t("Location"), isSortable: true },
                { key: t("Quantity"), isSortable: true },
                { key: t("Total Price"), isSortable: true },
              ],
              collapsibleRowKeys: [
                { key: "location" },
                { key: "quantity" },
                {
                  key: "totalPrice",
                  node: (row: any) => <div>{row.totalPrice} ₺</div>,
                },
              ],
              collapsibleRows: [],
            },
          };
        }
        acc[productName].totalGroupPrice += totalPrice;
        acc[productName].totalQuantity += quantity;

        acc[productName].collapsible.collapsibleRows.push({
          location: locationName,
          quantity: quantity,
          totalPrice: totalPrice,
        });

        return acc;
      }, {});
    return Object.values(groupedProducts);
  });

  const { createAccountStock, deleteAccountStock, updateAccountStock } =
    useAccountStockMutations();
  const inputs = [
    ProductInput({
      products: products?.filter((product) =>
        product?.expenseType?.includes("oys")
      ),
      required: true,
    }),
    StockLocationInput({ locations: locations }),
    QuantityInput(),
  ];
  const stockTransferInputs = [
    {
      type: InputTypes.SELECT,
      formKey: "currentLocation",
      label: t("From"),
      options: locations.map((input) => {
        return {
          value: input._id,
          label: input.name,
        };
      }),
      placeholder: t("From"),
      required: true,
    },
    {
      type: InputTypes.SELECT,
      formKey: "transferredLocation",
      label: t("Where"),
      options: locations.map((input) => {
        return {
          value: input._id,
          label: input.name,
        };
      }),
      placeholder: t("Where"),
      required: true,
    },

    QuantityInput(),
  ];
  const formKeys = [
    { key: "product", type: FormKeyTypeEnum.STRING },
    { key: "location", type: FormKeyTypeEnum.STRING },
    { key: "quantity", type: FormKeyTypeEnum.NUMBER },
  ];
  const stockTransferFormKeys = [
    { key: "currentLocation", type: FormKeyTypeEnum.STRING },
    { key: "transferredLocation", type: FormKeyTypeEnum.STRING },
    { key: "quantity", type: FormKeyTypeEnum.NUMBER },
  ];
  const columns = [
    { key: t("Product"), isSortable: true },
    { key: t("Quantity"), isSortable: true },
    { key: t("Unit Price"), isSortable: true },
    { key: t("Total Price"), isSortable: true },
  ];

  const rowKeys = [
    { key: "prdct" },
    { key: "totalQuantity" },
    {
      key: "unitPrice",
      node: (row: any) => <div>{row.unitPrice} ₺</div>,
    },
    {
      key: "totalGroupPrice",
      node: (row: any) => <div>{row.totalGroupPrice} ₺</div>,
    },
  ];
  if (user && ![RoleEnum.MANAGER].includes(user?.role?._id)) {
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
      className:
        user?.role?._id === RoleEnum.MANAGER
          ? "text-blue-500 cursor-pointer text-xl "
          : "text-blue-500 cursor-pointer text-xl mr-auto",
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
    {
      name: t("Transfer"),
      icon: <TbTransferIn />,
      className: "text-green-500 cursor-pointer text-xl mr-auto",
      isModal: true,
      setRow: setRowToAction,
      modal: rowToAction ? (
        <GenericAddEditPanel
          isOpen={isStockTransferModalOpen}
          close={() => setIsStockTransferModalOpen(false)}
          inputs={stockTransferInputs as GenericInputType[]}
          setForm={setStockTransferForm}
          submitFunction={() => {
            if (
              stockTransferForm.currentLocation === "" ||
              stockTransferForm.transferredLocation === "" ||
              stockTransferForm.quantity === 0
            ) {
              toast.error(t("Please fill all the fields"));
              return;
            }
            stockTransfer({
              currentStockLocation: stockTransferForm.currentLocation,
              transferredStockLocation: stockTransferForm.transferredLocation,
              product: rowToAction.product,
              quantity: stockTransferForm.quantity,
            });
          }}
          formKeys={stockTransferFormKeys}
          submitItem={stockTransfer as any}
          topClassName="flex flex-col gap-2 "
        />
      ) : null,
      isModalOpen: isStockTransferModalOpen,
      setIsModal: setIsStockTransferModalOpen,
      isPath: false,
      isDisabled: user?.role?._id !== RoleEnum.MANAGER,
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
      ?.filter((stock) =>
        getItem(stock.product, products)?.expenseType?.includes("oys")
      )
      ?.filter((stock) => {
        return (
          passesFilter(filterPanelFormElements?.location, stock.location) &&
          (!filterPanelFormElements?.product?.length ||
            filterPanelFormElements?.product?.some((panelProduct: string) =>
              passesFilter(panelProduct, getItem(stock.product, products)?._id)
            ))
        );
      })
      ?.reduce((acc: any, stock) => {
        const productName = getItem(stock.product, products)?.name;
        const locationName = getItem(stock.location, locations)?.name;
        const unitPrice = getItem(stock.product, products)?.unitPrice ?? 0;
        const quantity = stock.quantity;
        const totalPrice = parseFloat((unitPrice * quantity).toFixed(1));
        if (!productName) {
          return acc;
        }
        if (!acc[productName]) {
          acc[productName] = {
            ...stock,
            prdct: productName,
            unitPrice,
            totalGroupPrice: 0,
            totalQuantity: 0,
            collapsible: {
              collapsibleColumns: [
                { key: t("Location"), isSortable: true },
                { key: t("Quantity"), isSortable: true },
                { key: t("Total Price"), isSortable: true },
              ],
              collapsibleRowKeys: [
                { key: "location" },
                { key: "quantity" },
                {
                  key: "totalPrice",
                  node: (row: any) => (
                    <div className="text-sm">{row.totalPrice} ₺</div>
                  ),
                },
              ],
              collapsibleRows: [],
            },
          };
        }
        acc[productName].totalGroupPrice += totalPrice;
        acc[productName].totalQuantity += quantity;

        acc[productName].collapsible.collapsibleRows.push({
          location: locationName,
          quantity: quantity,
          totalPrice: totalPrice,
        });

        return acc;
      }, {});
    const filteredRows = Object.values(processedRows).filter((row: any) =>
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
    const newGeneralTotalExpense = filteredRows.reduce(
      (acc: any, stock: any) => {
        const expense = parseFloat(stock.totalGroupPrice.toFixed(1));
        return acc + expense;
      },
      0
    );
    setRows(filteredRows);
    setGeneralTotalExpense(newGeneralTotalExpense as number);
    if (
      searchQuery !== "" ||
      Object.values(filterPanelFormElements)?.some((value) => value !== "")
    ) {
      setCurrentPage(1);
    }

    setTableKey((prev) => prev + 1);
  }, [stocks, filterPanelFormElements, searchQuery, products, locations, user]);
  const filterPanelInputs = [
    ProductInput({
      products: products?.filter((product) =>
        product?.expenseType?.includes("oys")
      ),
      required: true,
      isMultiple: true,
    }),
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
          actions={actions}
          filters={filters}
          columns={columns}
          rows={rows}
          title={t("Game Stocks")}
          addButton={addButton}
          filterPanel={filterPanel}
          isSearch={false}
          outsideSearch={outsideSearch}
          isActionsActive={isEnableEdit}
          isCollapsible={true}
        />
      </div>
    </>
  );
};

export default GameStock;
