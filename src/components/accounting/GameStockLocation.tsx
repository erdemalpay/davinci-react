import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { TbTransferIn } from "react-icons/tb";
import { toast } from "react-toastify";
import { useUserContext } from "../../context/User.context";
import { RoleEnum, StockHistoryStatusEnum } from "../../types";
import { useGetAccountProducts } from "../../utils/api/account/product";
import {
  useAccountStockMutations,
  useGetAccountStocks,
  useStockTransferMutation,
} from "../../utils/api/account/stock";
import { useGetStockLocations } from "../../utils/api/location";
import { useGetMenuItems } from "../../utils/api/menu/menu-item";
import { getItem } from "../../utils/getItem";
import {
  ProductInput,
  QuantityInput,
  StockLocationInput,
} from "../../utils/panelInputs";
import { passesFilter } from "../../utils/passesFilter";
import SwitchButton from "../panelComponents/common/SwitchButton";
import GenericAddEditPanel from "../panelComponents/FormElements/GenericAddEditPanel";
import { FormKeyTypeEnum, InputTypes } from "../panelComponents/shared/types";
import GenericTable from "../panelComponents/Tables/GenericTable";

type FormElementsState = {
  [key: string]: any;
};
const GameStockLocation = () => {
  const { t } = useTranslation();
  const stocks = useGetAccountStocks();
  const { user } = useUserContext();
  const products = useGetAccountProducts();
  const items = useGetMenuItems();
  const [rowToAction, setRowToAction] = useState<any>();
  const [isStockTransferModalOpen, setIsStockTransferModalOpen] =
    useState(false);
  const { mutate: stockTransfer } = useStockTransferMutation();
  const locations = useGetStockLocations();
  const [tableKey, setTableKey] = useState(0);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filterPanelFormElements, setFilterPanelFormElements] =
    useState<FormElementsState>({
      product: [],
      bahceliMin: "",
      bahceliMax: "",
      neoramaMin: "",
      neoramaMax: "",
      amazonMin: "",
      amazonMax: "",
      hasarliMin: "",
      hasarliMax: "",
      neoDepoMin: "",
      neoDepoMax: "",
    });
  const [rows, setRows] = useState(() => {
    const groupedProducts = stocks
      ?.filter((stock) =>
        getItem(stock?.product, products)?.expenseType?.includes("oys")
      )
      ?.reduce((acc: any, stock) => {
        const productName = getItem(stock?.product, products)?.name;
        const quantity = stock?.quantity;
        if (!productName) {
          return acc;
        }
        if (!acc[productName]) {
          acc[productName] = {
            ...stock,
            prdct: productName,
          };
          acc[productName][`location_${stock.location}`] = quantity;
        } else {
          acc[productName][`location_${stock.location}`] = quantity;
        }
        return acc;
      }, {});
    return Object.values(groupedProducts);
  });
  const { createAccountStock } = useAccountStockMutations();
  const [stockTransferForm, setStockTransferForm] = useState({
    product: "",
    currentStockLocation: "",
    transferredStockLocation: "",
    quantity: 0,
  });
  const filterPanelInputs = [
    ProductInput({
      products: products?.filter((product) =>
        product?.expenseType?.includes("oys")
      ),
      required: true,
      isMultiple: true,
    }),
    {
      type: InputTypes.NUMBER,
      formKey: "bahceliMin",
      label: "Bahceli Min",
      placeholder: "Bahceli Min",
      required: false,
    },
    {
      type: InputTypes.NUMBER,
      formKey: "bahceliMax",
      label: "Bahçeli Max",
      placeholder: "Bahçeli Max",
      required: false,
    },
    {
      type: InputTypes.NUMBER,
      formKey: "neoramaMin",
      label: "Neorama Min",
      placeholder: "Neorama Min",
      required: false,
    },
    {
      type: InputTypes.NUMBER,
      formKey: "neoramaMax",
      label: "Neorama Max",
      placeholder: "Neorama Max",
      required: false,
    },
    {
      type: InputTypes.NUMBER,
      formKey: "amazonMin",
      label: "Amazon Min",
      placeholder: "Amazon Min",
      required: false,
    },
    {
      type: InputTypes.NUMBER,
      formKey: "amazonMax",
      label: "Amazon Max",
      placeholder: "Amazon Max",
      required: false,
    },
    {
      type: InputTypes.NUMBER,
      formKey: "hasarliMin",
      label: "Hasarlı Min",
      placeholder: "Hasarlı Min",
      required: false,
    },
    {
      type: InputTypes.NUMBER,
      formKey: "hasarliMax",
      label: "Hasarlı Max",
      placeholder: "Hasarlı Max",
      required: false,
    },
    {
      type: InputTypes.NUMBER,
      formKey: "neoDepoMin",
      label: "Neo Depo Min",
      placeholder: "Neo Depo Min",
      required: false,
    },
    {
      type: InputTypes.NUMBER,
      formKey: "neoDepoMax",
      label: "Neo Depo Max",
      placeholder: "Neo Depo Max",
      required: false,
    },
  ];

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
  const formKeys = [
    { key: "product", type: FormKeyTypeEnum.STRING },
    { key: "location", type: FormKeyTypeEnum.STRING },
    { key: "quantity", type: FormKeyTypeEnum.NUMBER },
  ];
  const stockTransferInputs = [
    {
      type: InputTypes.SELECT,
      formKey: "product",
      label: t("Product"),
      options: products.map((product) => ({
        value: product._id,
        label: product.name,
      })),
      placeholder: t("Product"),
      isReadOnly: true,
      required: false,
    },
    {
      type: InputTypes.SELECT,
      formKey: "currentStockLocation",
      label: t("From"),
      options: locations
        ?.filter(
          (location) =>
            location._id !== Number(stockTransferForm?.transferredStockLocation)
        )
        .map((location) => ({
          value: location._id,
          label: location.name,
        })),
      placeholder: t("From"),
      required: true,
    },
    {
      type: InputTypes.SELECT,
      formKey: "transferredStockLocation",
      label: t("Where"),
      options: locations
        ?.filter(
          (location) =>
            location._id !== Number(stockTransferForm?.currentStockLocation)
        )
        .map((location) => ({
          value: location._id,
          label: location.name,
        })),
      placeholder: t("Where"),
      required: true,
    },
    QuantityInput(),
  ];
  const stockTransferFormKeys = [
    { key: "product", type: FormKeyTypeEnum.STRING },
    { key: "currentStockLocation", type: FormKeyTypeEnum.STRING },
    { key: "transferredStockLocation", type: FormKeyTypeEnum.STRING },
    { key: "quantity", type: FormKeyTypeEnum.NUMBER },
  ];
  const columns = [
    { key: t("Product"), isSortable: true, correspondingKey: "prdct" },
  ];
  const rowKeys = [{ key: "prdct" }];
  locations.forEach((location) => {
    columns.push({
      key: location.name,
      isSortable: true,
      correspondingKey: `location_${location._id}`,
    });
    rowKeys.push({
      key: `location_${location._id}`,
    });
  });
  columns.push({ key: t("Action"), isSortable: false } as any);
  const addButton = {
    name: t("Add Stock"),
    isModal: true,
    modal: (
      <GenericAddEditPanel
        isOpen={isAddModalOpen}
        close={() => setIsAddModalOpen(false)}
        inputs={inputs}
        formKeys={formKeys}
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
  const filters = [
    {
      label: t("Show Filters"),
      isUpperSide: true,
      node: <SwitchButton checked={showFilters} onChange={setShowFilters} />,
    },
  ];
  const actions = [
    {
      name: t("Transfer"),
      icon: <TbTransferIn />,
      className: "text-green-500 cursor-pointer text-xl ",
      isModal: true,
      setRow: setRowToAction,
      modal: rowToAction ? (
        <GenericAddEditPanel
          isOpen={isStockTransferModalOpen}
          close={() => setIsStockTransferModalOpen(false)}
          inputs={stockTransferInputs}
          setForm={setStockTransferForm}
          constantValues={{ product: rowToAction.product }}
          submitFunction={() => {
            if (
              stockTransferForm.currentStockLocation === "" ||
              stockTransferForm.transferredStockLocation === "" ||
              stockTransferForm.quantity === 0
            ) {
              toast.error(t("Please fill all the fields"));
              return;
            }
            stockTransfer({
              currentStockLocation: stockTransferForm.currentStockLocation,
              transferredStockLocation:
                stockTransferForm.transferredStockLocation,
              product: rowToAction?.product,
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
      isDisabled: false,
    },
  ];

  useEffect(() => {
    const processedRows = stocks
      ?.filter((stock) =>
        getItem(stock?.product, products)?.expenseType?.includes("oys")
      )
      ?.filter((stock) => {
        return (
          !filterPanelFormElements?.product?.length ||
          filterPanelFormElements?.product?.some((panelProduct: string) =>
            passesFilter(panelProduct, stock?.product)
          )
        );
      })
      ?.reduce((acc: any, stock) => {
        const productName = getItem(stock?.product, products)?.name;
        const quantity = stock?.quantity;
        if (!productName) {
          return acc;
        }

        if (!acc[productName]) {
          acc[productName] = {
            ...stock,
            prdct: productName,
          };
          acc[productName][`location_${stock.location}`] = quantity;
        } else {
          acc[productName][`location_${stock.location}`] = quantity;
        }
        return acc;
      }, {});
    const proccessedArray = Object.values(processedRows);
    const filteredRows = proccessedArray.filter((row: any) => {
      const filters = [
        { minKey: "bahceliMin", maxKey: "bahceliMax", locationIndex: 1 },
        { minKey: "neoramaMin", maxKey: "neoramaMax", locationIndex: 2 },
        { minKey: "amazonMin", maxKey: "amazonMax", locationIndex: 3 },
        { minKey: "hasarliMin", maxKey: "hasarliMax", locationIndex: 5 },
        { minKey: "neoDepoMin", maxKey: "neoDepoMax", locationIndex: 6 },
      ];
      for (const filter of filters) {
        const { minKey, maxKey, locationIndex } = filter;
        const locationKey = `location_${locationIndex}`;
        const min = filterPanelFormElements[minKey];
        const max = filterPanelFormElements[maxKey];
        const value = row[locationKey];
        if (min !== "" && min > value) {
          return false;
        }
        if (max !== "" && max < value) {
          return false;
        }
      }
      return true;
    });
    setRows(Object.values(filteredRows));
    setTableKey((prev) => prev + 1);
  }, [stocks, filterPanelFormElements, products, locations, user, items]);

  const filterPanel = {
    isFilterPanelActive: showFilters,
    inputs: filterPanelInputs,
    formElements: filterPanelFormElements,
    setFormElements: setFilterPanelFormElements,
    closeFilters: () => setShowFilters(false),
    isApplyButtonActive: true,
  };

  return (
    <>
      <div className="w-[95%] mx-auto ">
        <GenericTable
          key={tableKey}
          rowKeys={rowKeys}
          columns={columns}
          rows={rows}
          title={t("Game Stocks by Location")}
          addButton={addButton}
          filterPanel={filterPanel}
          filters={filters}
          actions={actions}
          isActionsActive={true}
          isExcel={user && [RoleEnum.MANAGER].includes(user?.role?._id)}
          excelFileName={t("GamesByLocation.xlsx")}
        />
      </div>
    </>
  );
};

export default GameStockLocation;
