import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { IoCheckmark, IoCloseOutline } from "react-icons/io5";
import { toast } from "react-toastify";
import { AccountCountList } from "../../types";
import {
  useAccountCountListMutations,
  useGetAccountCountLists,
} from "../../utils/api/account/countList";
import { useGetAccountExpenseTypes } from "../../utils/api/account/expenseType";
import { useGetAccountProducts } from "../../utils/api/account/product";
import { useGetStockLocations } from "../../utils/api/location";
import { ExpenseTypeInput } from "../../utils/panelInputs";
import { CheckSwitch } from "../common/CheckSwitch";
import GenericTable from "../panelComponents/Tables/GenericTable";
import SwitchButton from "../panelComponents/common/SwitchButton";
import { RowKeyType } from "../panelComponents/shared/types";

type FormElementsState = {
  [key: string]: any;
};

const CountListProducts = () => {
  const { t } = useTranslation();
  const countLists = useGetAccountCountLists();
  const [tableKey, setTableKey] = useState(0);
  const products = useGetAccountProducts();
  const locations = useGetStockLocations();
  const expenseTypes = useGetAccountExpenseTypes();
  const [isEnableEdit, setIsEnableEdit] = useState(false);
  const [filterPanelFormElements, setFilterPanelFormElements] =
    useState<FormElementsState>({
      expenseType: "",
    });
  const [showFilters, setShowFilters] = useState(false);
  const filterPanelInputs = [ExpenseTypeInput({ expenseTypes: expenseTypes })];
  const { updateAccountCountList } = useAccountCountListMutations();
  const allRows = products.filter((product) => {
    return (
      filterPanelFormElements.expenseType === "" ||
      product.expenseType?.includes(filterPanelFormElements.expenseType)
    );
  });

  const [rows, setRows] = useState(allRows);
  function handleCountListUpdate(row: any, countList: AccountCountList) {
    if (countList?.products?.find((item) => item.product === row.product)) {
      const newProducts = countList.products.filter(
        (item) => item.product !== row.product
      );
      updateAccountCountList({
        id: countList._id,
        updates: { products: newProducts },
      });
    } else {
      const newProducts = countList.products || [];
      newProducts.push({
        product: row.product,
        locations: locations.map((location) => location._id),
      });
      updateAccountCountList({
        id: countList._id,
        updates: { products: newProducts },
      });

      toast.success(`${t("Count List updated successfully")}`);
    }
  }

  const columns = [{ key: t("Name"), isSortable: true }];

  const checkProductIsInCountLists = (product: string) => {
    return countLists?.some((countList) =>
      countList?.products?.some((item) => item.product === product)
    );
  };
  const rowKeys: RowKeyType<any>[] = [
    {
      key: "name",
      node: (row) => {
        const className = checkProductIsInCountLists(row.product)
          ? ""
          : "bg-red-200 w-fit px-2 py-1 rounded-md text-white";
        return <div className={className}>{row.name}</div>;
      },
    },
  ];

  // Adding location columns and rowkeys
  for (const countList of countLists) {
    columns.push({ key: countList.name, isSortable: true });
    rowKeys.push({
      key: countList._id,
      node: (row: any) => {
        const isChecked = countList?.products?.some(
          (item) => item.product === row.product
        );
        return isEnableEdit ? (
          <div
            className={`${
              countLists?.length === 1 ? "flex justify-center" : ""
            }`}
          >
            <CheckSwitch
              checked={isChecked ?? false}
              onChange={() => handleCountListUpdate(row, countList)}
            />
          </div>
        ) : isChecked ? (
          <IoCheckmark
            className={`text-blue-500 text-2xl ${
              countLists?.length === 1 ? "mx-auto" : ""
            }`}
          />
        ) : (
          <IoCloseOutline
            className={`text-red-800 text-2xl ${
              countLists?.length === 1 ? "mx-auto" : ""
            }`}
          />
        );
      },
    });
  }
  const filters = [
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
  const filterPanel = {
    isFilterPanelActive: showFilters,
    inputs: filterPanelInputs,
    formElements: filterPanelFormElements,
    setFormElements: setFilterPanelFormElements,
    closeFilters: () => setShowFilters(false),
  };
  useEffect(() => {
    setRows(allRows);
    setTableKey((prev) => prev + 1);
  }, [countLists, locations, products, filterPanelFormElements]);
  return (
    <>
      <div className="w-[95%] mx-auto ">
        <GenericTable
          key={tableKey}
          rowKeys={rowKeys}
          columns={columns}
          filters={filters}
          rows={rows}
          filterPanel={filterPanel}
          title={t("Count List Products")}
          isActionsActive={false}
        />
      </div>
    </>
  );
};

export default CountListProducts;
