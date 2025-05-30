import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useFilterContext } from "../../context/Filter.context";
import { useGeneralContext } from "../../context/General.context";
import { useGetAccountExpenseTypes } from "../../utils/api/account/expenseType";
import {
  useAccountProductMutations,
  useGetAccountProducts,
} from "../../utils/api/account/product";
import { useGetStockLocations } from "../../utils/api/location";
import { ExpenseTypeInput, ProductInput } from "../../utils/panelInputs";
import TextInput from "../panelComponents/FormElements/TextInput";
import GenericTable from "../panelComponents/Tables/GenericTable";
import SwitchButton from "../panelComponents/common/SwitchButton";
import { InputTypes } from "../panelComponents/shared/types";

const ProductShelfInfo = () => {
  const { t } = useTranslation();
  const locations = useGetStockLocations();
  const products = useGetAccountProducts();
  const expenseTypes = useGetAccountExpenseTypes();
  const [tableKey, setTableKey] = useState(0);
  const { currentPage } = useGeneralContext();
  const {
    isEnableProductShelfEdit,
    setIsEnableProductShelfEdit,
    filterProductShelfInfoFormElements,
    setFilterProductShelfInfoFormElements,
    showProductShelfInfoFilters,
    setShowProductShelfInfoFilters,
  } = useFilterContext();
  const { updateAccountProduct } = useAccountProductMutations();
  const allRows = products
    ?.filter((product) => {
      const matchesExpense =
        filterProductShelfInfoFormElements?.expenseType?.length === 0 ||
        product?.expenseType?.some((exp) =>
          filterProductShelfInfoFormElements?.expenseType?.includes(exp)
        );

      const matchesProduct =
        filterProductShelfInfoFormElements?.product?.length === 0 ||
        filterProductShelfInfoFormElements?.product?.includes(product._id);
      return matchesExpense && matchesProduct;
    })
    ?.map((product) => {
      const shelfFields = (product.shelfInfo ?? [])?.reduce<
        Record<string, string>
      >((acc, si) => {
        acc[String(si.location)] = si.shelf;
        return acc;
      }, {});
      return {
        ...product,
        ...shelfFields,
      };
    });

  const [rows, setRows] = useState(allRows);
  const columns = [
    { key: t("Name"), isSortable: true, correspondingKey: "name" },
  ];
  const rowKeys = [
    {
      key: "name",
      node: (row: any) => {
        return <p>{row.name}</p>;
      },
    },
  ];
  locations
    ?.filter((location) => location?.isShelfInfoRequired)
    ?.forEach((location) => {
      columns.push({
        key: location.name,
        isSortable: true,
        correspondingKey: `${location._id}`,
      });
      rowKeys.push({
        key: `${location._id}`,
        node: (row: any) => {
          return isEnableProductShelfEdit ? (
            <div key={currentPage + row._id + row?.[`${location._id}`]}>
              <TextInput
                key={`${location._id}`}
                type={InputTypes.TEXT}
                value={row?.[`${location._id}`] ?? ""}
                label={""}
                placeholder={""}
                inputWidth="w-32"
                onChange={(value) => {
                  const newShelfInfo = locations?.map((l) => {
                    if (l._id === location._id) {
                      return {
                        location: l._id,
                        shelf: value,
                      };
                    }
                    return {
                      location: l._id,
                      shelf: row[`${l._id}`],
                    };
                  });
                  updateAccountProduct({
                    id: row._id,
                    updates: {
                      shelfInfo: newShelfInfo,
                    },
                  });
                }}
                isDebounce={true}
              />
            </div>
          ) : (
            <p>{row?.[`${location._id}`] ?? ""}</p>
          );
        },
      });
    });
  const filterPanelInputs = [
    ProductInput({
      products: products,
      isMultiple: true,
    }),
    ExpenseTypeInput({
      expenseTypes: expenseTypes,
      isMultiple: true,
    }),
  ];
  const filters = [
    {
      label: t("Show Filters"),
      isUpperSide: true,
      node: (
        <SwitchButton
          checked={showProductShelfInfoFilters}
          onChange={() => {
            setShowProductShelfInfoFilters(!showProductShelfInfoFilters);
          }}
        />
      ),
    },
    {
      label: t("Enable Edit"),
      isUpperSide: false,
      node: (
        <SwitchButton
          checked={isEnableProductShelfEdit}
          onChange={() => {
            setIsEnableProductShelfEdit(!isEnableProductShelfEdit);
          }}
        />
      ),
    },
  ];
  const filterPanel = {
    isFilterPanelActive: showProductShelfInfoFilters,
    inputs: filterPanelInputs,
    formElements: filterProductShelfInfoFormElements,
    setFormElements: setFilterProductShelfInfoFormElements,
    closeFilters: () => setShowProductShelfInfoFilters(false),
  };
  useEffect(() => {
    setRows(allRows);
    setTableKey((prevKey) => prevKey + 1);
  }, [
    locations,
    products,
    expenseTypes,
    filterProductShelfInfoFormElements,
    isEnableProductShelfEdit,
  ]);
  return (
    <>
      <div className="w-[95%] mx-auto ">
        <GenericTable
          key={tableKey}
          rowKeys={rowKeys}
          columns={columns}
          rows={rows}
          title={t("Product Shelf Info")}
          filters={filters}
          isActionsActive={false}
          isExcel={true}
          filterPanel={filterPanel}
          excelFileName={t("ProductShelfInfo.xlsx")}
        />
      </div>
    </>
  );
};

export default ProductShelfInfo;
