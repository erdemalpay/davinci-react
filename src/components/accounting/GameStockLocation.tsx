import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { TbTransferIn } from "react-icons/tb";
import { toast } from "react-toastify";
import { useFilterContext } from "../../context/Filter.context";
import { useUserContext } from "../../context/User.context";
import {
  ActionEnum,
  DisabledConditionEnum,
  StockHistoryStatusEnum,
} from "../../types";
import { useGetAccountProducts } from "../../utils/api/account/product";
import {
  useAccountStockMutations,
  useGetAccountStocks,
  useStockTransferMutation,
} from "../../utils/api/account/stock";
import { useGetStockLocations } from "../../utils/api/location";
import { useGetMenuItems } from "../../utils/api/menu/menu-item";
import { useGetDisabledConditions } from "../../utils/api/panelControl/disabledCondition";
import { getItem } from "../../utils/getItem";
import { passesFilter } from "../../utils/passesFilter";
import GenericAddEditPanel from "../panelComponents/FormElements/GenericAddEditPanel";
import GenericTable from "../panelComponents/Tables/GenericTable";
import SwitchButton from "../panelComponents/common/SwitchButton";
import { FormKeyTypeEnum, InputTypes } from "../panelComponents/shared/types";

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
  const disabledConditions = useGetDisabledConditions();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const {
    filtershowGameStockLocationFiltersPanelFormElements,
    setFiltershowGameStockLocationFiltersPanelFormElements,
    showGameStockLocationFilters,
    setShowGameStockLocationFilters,
  } = useFilterContext();

  const { createAccountStock } = useAccountStockMutations();
  const [stockTransferForm, setStockTransferForm] = useState({
    product: "",
    currentStockLocation: "",
    transferredStockLocation: "",
    quantity: 0,
  });

  const gameStockLocationPageDisabledCondition = useMemo(() => {
    return getItem(
      DisabledConditionEnum.STOCK_GAMESTOCKLOCATION,
      disabledConditions
    );
  }, [disabledConditions]);

  const filteredStocks = useMemo(() => {
    return stocks
      ?.filter((stock) =>
        getItem(stock?.product, products)?.expenseType?.includes("oys")
      )
      ?.filter((stock) => {
        return (
          !filtershowGameStockLocationFiltersPanelFormElements?.product
            ?.length ||
          filtershowGameStockLocationFiltersPanelFormElements?.product?.some(
            (panelProduct: string) => passesFilter(panelProduct, stock?.product)
          )
        );
      });
  }, [stocks, products, filtershowGameStockLocationFiltersPanelFormElements]);

  const rows = useMemo(() => {
    const processedRows = filteredStocks?.reduce((acc: any, stock) => {
      const foundProduct = getItem(stock?.product, products);
      const matchedItem = items?.find(
        (item) => item?.matchedProduct === stock?.product
      );
      const productName = foundProduct?.name;
      const quantity = stock?.quantity;
      if (!productName) {
        return acc;
      }

      if (!acc[productName]) {
        acc[productName] = {
          ...stock,
          prdct: productName,
          sku: matchedItem?.sku,
          barcode: matchedItem?.barcode,
        };
        acc[productName][`location_${stock.location}`] = quantity;
      } else {
        acc[productName][`location_${stock.location}`] = quantity;
      }
      return acc;
    }, {});

    const proccessedArray = Object.values(processedRows || {});
    const filteredRows = proccessedArray.filter((row: any) => {
      const filters = [
        { minKey: "bahceliMin", maxKey: "bahceliMax", locationIndex: 1 },
        { minKey: "neoramaMin", maxKey: "neoramaMax", locationIndex: 2 },
        { minKey: "amazonMin", maxKey: "amazonMax", locationIndex: 3 },
        { minKey: "neoDepoMin", maxKey: "neoDepoMax", locationIndex: 6 },
      ];
      for (const filter of filters) {
        const { minKey, maxKey, locationIndex } = filter;
        const locationKey = `location_${locationIndex}`;
        const min = filtershowGameStockLocationFiltersPanelFormElements[minKey];
        const max = filtershowGameStockLocationFiltersPanelFormElements[maxKey];
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
    return Object.values(filteredRows);
  }, [
    filteredStocks,
    products,
    items,
    filtershowGameStockLocationFiltersPanelFormElements,
  ]);

  const filterPanelInputs = useMemo(
    () => [
      {
        type: InputTypes.SELECT,
        formKey: "product",
        label: t("Product"),
        options: products
          ?.filter((product) => product?.expenseType?.includes("oys"))
          ?.map((product) => ({
            value: product._id,
            label: product.name,
          })),
        placeholder: t("Product"),
        required: true,
        isMultiple: true,
      },
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
    ],
    [products, t]
  );

  const inputs = useMemo(
    () => [
      {
        type: InputTypes.SELECT,
        formKey: "product",
        label: t("Product"),
        options: products
          ?.filter((product) => product?.expenseType?.includes("oys"))
          ?.map((product) => ({
            value: product._id,
            label: product.name,
          })),
        placeholder: t("Product"),
        required: true,
      },
      {
        type: InputTypes.SELECT,
        formKey: "location",
        label: t("Location"),
        options: locations.map((input) => ({
          value: input._id,
          label: input.name,
        })),
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
    ],
    [products, locations, t]
  );

  const formKeys = useMemo(
    () => [
      { key: "product", type: FormKeyTypeEnum.STRING },
      { key: "location", type: FormKeyTypeEnum.STRING },
      { key: "quantity", type: FormKeyTypeEnum.NUMBER },
    ],
    []
  );

  const stockTransferInputs = useMemo(
    () => [
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
              location._id !==
              Number(stockTransferForm?.transferredStockLocation)
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
      {
        type: InputTypes.NUMBER,
        formKey: "quantity",
        label: t("Quantity"),
        placeholder: t("Quantity"),
        required: true,
      },
    ],
    [products, locations, stockTransferForm, t]
  );

  const stockTransferFormKeys = useMemo(
    () => [
      { key: "product", type: FormKeyTypeEnum.STRING },
      { key: "currentStockLocation", type: FormKeyTypeEnum.STRING },
      { key: "transferredStockLocation", type: FormKeyTypeEnum.STRING },
      { key: "quantity", type: FormKeyTypeEnum.NUMBER },
    ],
    []
  );

  const columns = useMemo(() => {
    const cols = [
      { key: t("Product"), isSortable: true, correspondingKey: "prdct" },
      { key: t("Sku"), isSortable: true, correspondingKey: "sku" },
      { key: t("Barcode"), isSortable: true, correspondingKey: "barcode" },
    ];
    locations.forEach((location) => {
      cols.push({
        key: location.name,
        isSortable: true,
        correspondingKey: `location_${location._id}`,
      });
    });
    cols.push({ key: t("Action"), isSortable: false } as any);
    return cols;
  }, [t, locations]);

  const rowKeys = useMemo(() => {
    const keys = [{ key: "prdct" }, { key: "sku" }, { key: "barcode" }];
    locations.forEach((location) => {
      keys.push({
        key: `location_${location._id}`,
      });
    });
    return keys;
  }, [locations]);

  const addButton = useMemo(
    () => ({
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
      isDisabled: gameStockLocationPageDisabledCondition?.actions?.some(
        (ac) =>
          ac.action === ActionEnum.ADD &&
          user?.role?._id &&
          !ac?.permissionsRoles?.includes(user?.role?._id)
      ),
    }),
    [
      t,
      isAddModalOpen,
      inputs,
      formKeys,
      createAccountStock,
      gameStockLocationPageDisabledCondition,
      user,
    ]
  );

  const filters = useMemo(
    () => [
      {
        label: t("Show Filters"),
        isUpperSide: true,
        node: (
          <SwitchButton
            checked={showGameStockLocationFilters}
            onChange={() => {
              setShowGameStockLocationFilters(!showGameStockLocationFilters);
            }}
          />
        ),
      },
    ],
    [t, showGameStockLocationFilters, setShowGameStockLocationFilters]
  );

  const actions = useMemo(
    () => [
      {
        name: t("Transfer"),
        icon: <TbTransferIn />,
        className: "text-green-500 cursor-pointer text-2xl ",
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
        isDisabled: gameStockLocationPageDisabledCondition?.actions?.some(
          (ac) =>
            ac.action === ActionEnum.TRANSFER &&
            user?.role?._id &&
            !ac?.permissionsRoles?.includes(user?.role?._id)
        ),
      },
    ],
    [
      t,
      rowToAction,
      isStockTransferModalOpen,
      stockTransferInputs,
      stockTransferForm,
      stockTransferFormKeys,
      stockTransfer,
      gameStockLocationPageDisabledCondition,
      user,
    ]
  );

  const filterPanel = useMemo(
    () => ({
      isFilterPanelActive: showGameStockLocationFilters,
      inputs: filterPanelInputs,
      formElements: filtershowGameStockLocationFiltersPanelFormElements,
      setFormElements: setFiltershowGameStockLocationFiltersPanelFormElements,
      closeFilters: () => setShowGameStockLocationFilters(false),
      isApplyButtonActive: true,
    }),
    [
      showGameStockLocationFilters,
      filterPanelInputs,
      filtershowGameStockLocationFiltersPanelFormElements,
      setFiltershowGameStockLocationFiltersPanelFormElements,
      setShowGameStockLocationFilters,
    ]
  );

  return (
    <>
      <div className="w-[95%] mx-auto ">
        <GenericTable
          rowKeys={rowKeys}
          columns={columns}
          rows={rows}
          title={t("Game Stocks by Location")}
          addButton={addButton}
          filterPanel={filterPanel}
          filters={filters}
          actions={actions}
          isActionsActive={true}
          isToolTipEnabled={false}
          isExcel={
            user &&
            !gameStockLocationPageDisabledCondition?.actions?.some(
              (ac) =>
                ac.action === ActionEnum.EXCEL &&
                user?.role?._id &&
                !ac?.permissionsRoles?.includes(user?.role?._id)
            )
          }
          excelFileName={t("GamesByLocation.xlsx")}
        />
      </div>
    </>
  );
};

export default GameStockLocation;
