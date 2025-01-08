import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useUserContext } from "../../context/User.context";
import { RoleEnum, StockHistoryStatusEnum } from "../../types";
import { useGetAccountProducts } from "../../utils/api/account/product";
import {
  useAccountStockMutations,
  useGetAccountStocks,
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
          isSearch={false}
          filters={filters}
          isActionsActive={false}
          isExcel={user && [RoleEnum.MANAGER].includes(user?.role?._id)}
          excelFileName={t("GamesByLocation.xlsx")}
        />
      </div>
    </>
  );
};

export default GameStockLocation;
