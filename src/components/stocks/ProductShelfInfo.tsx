import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useFilterContext } from "../../context/Filter.context";
import { useGeneralContext } from "../../context/General.context";
import { useUserContext } from "../../context/User.context";
import { AccountProduct, ActionEnum, DisabledConditionEnum } from "../../types";
import { useGetAccountExpenseTypes } from "../../utils/api/account/expenseType";
import {
  useAccountProductMutations,
  useGetAccountProducts,
} from "../../utils/api/account/product";
import { useGetStockLocations } from "../../utils/api/location";
import { useGetDisabledConditions } from "../../utils/api/panelControl/disabledCondition";
import { getItem } from "../../utils/getItem";
import TextInput from "../panelComponents/FormElements/TextInput";
import GenericTable from "../panelComponents/Tables/GenericTable";
import SwitchButton from "../panelComponents/common/SwitchButton";
import { InputTypes } from "../panelComponents/shared/types";

const ProductShelfInfo = () => {
  const { t } = useTranslation();
  const { user } = useUserContext();
  const locations = useGetStockLocations();
  const products = useGetAccountProducts();
  const expenseTypes = useGetAccountExpenseTypes();
  const disabledConditions = useGetDisabledConditions();
  const { currentPage } = useGeneralContext();
  const {
    isEnableProductShelfEdit,
    setIsEnableProductShelfEdit,
    filterProductShelfInfoFormElements,
    setFilterProductShelfInfoFormElements,
    showProductShelfInfoFilters,
    setShowProductShelfInfoFilters,
    showProductsWithoutShelf,
    setShowProductsWithoutShelf,
  } = useFilterContext();
  const { updateAccountProduct } = useAccountProductMutations();

  const selectedLocation = filterProductShelfInfoFormElements?.location;
  const selectedLocationKey = selectedLocation ? String(selectedLocation) : "";

  const productHasShelfAtLocation = (
    product: AccountProduct,
    locationKey: string
  ) =>
    (product?.shelfInfo ?? []).some(
      (si) => String(si.location) === locationKey && !!si.shelf?.trim()
    );

  const productShelfInfoPageDisabledCondition = useMemo(() => {
    return getItem(
      DisabledConditionEnum.STOCK_PRODUCTSHELFINFO,
      disabledConditions
    );
  }, [disabledConditions]);

  const rows = useMemo(() => {
    return products
      ?.filter((product) => {
        const matchesExpense =
          filterProductShelfInfoFormElements?.expenseType?.length === 0 ||
          product?.expenseType?.some((exp) =>
            filterProductShelfInfoFormElements?.expenseType?.includes(exp)
          );

        const matchesProduct =
          filterProductShelfInfoFormElements?.product?.length === 0 ||
          filterProductShelfInfoFormElements?.product?.includes(product._id);

        let matchesLocation = true;
        if (selectedLocationKey && !showProductsWithoutShelf) {
          matchesLocation = productHasShelfAtLocation(
            product,
            selectedLocationKey
          );
        }

        return matchesExpense && matchesProduct && matchesLocation;
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
  }, [
    products,
    filterProductShelfInfoFormElements,
    selectedLocationKey,
    showProductsWithoutShelf,
  ]);

  const columns = useMemo(() => {
    const cols = [
      { key: t("Product"), isSortable: true, correspondingKey: "name" },
    ];

    locations
      ?.filter(
        (location) =>
          location?.isShelfInfoRequired &&
          (!selectedLocationKey || String(location._id) === selectedLocationKey)
      )
      ?.forEach((location) => {
        cols.push({
          key: location.name,
          isSortable: true,
          correspondingKey: `${location._id}`,
        });
      });

    return cols;
  }, [t, locations, selectedLocationKey]);

  const rowKeys = useMemo(() => {
    const keys = [
      {
        key: "name",
        node: (row: any) => {
          return <p>{row.name}</p>;
        },
      },
    ];

    locations
      ?.filter(
        (location) =>
          location?.isShelfInfoRequired &&
          (!selectedLocationKey || String(location._id) === selectedLocationKey)
      )
      ?.forEach((location) => {
        keys.push({
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

    return keys;
  }, [
    locations,
    selectedLocationKey,
    isEnableProductShelfEdit,
    currentPage,
    updateAccountProduct,
  ]);

  const filterPanelInputs = useMemo(() => {
    const productOptions = (
      selectedLocationKey && !showProductsWithoutShelf
        ? products.filter((product) =>
            productHasShelfAtLocation(product, selectedLocationKey)
          )
        : products
    ).map((product) => ({
      value: product._id,
      label: product.name,
    }));

    return [
      {
        type: InputTypes.SELECT,
        formKey: "location",
        label: t("Location"),
        options: locations
          ?.filter((location) => location?.isShelfInfoRequired)
          ?.map((location) => ({
            value: location._id,
            label: location.name,
          })),
        placeholder: t("Location"),
        required: false,
      },
      {
        type: InputTypes.SELECT,
        formKey: "product",
        label: t("Product"),
        options: productOptions,
        placeholder: t("Product"),
        isMultiple: true,
        required: false,
      },
      {
        type: InputTypes.SELECT,
        formKey: "expenseType",
        label: t("Expense Type"),
        options: expenseTypes.map((expenseType) => ({
          value: expenseType._id,
          label: expenseType.name,
        })),
        placeholder: t("Expense Type"),
        isMultiple: true,
        required: false,
      },
    ];
  }, [
    products,
    expenseTypes,
    locations,
    selectedLocationKey,
    showProductsWithoutShelf,
    t,
  ]);

  const filters = useMemo(
    () => [
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
        isUpperSide: true,
        isDisabled: productShelfInfoPageDisabledCondition?.actions?.some(
          (ac) =>
            ac.action === ActionEnum.ENABLEEDIT &&
            user?.role?._id &&
            !ac?.permissionsRoles?.includes(user?.role?._id)
        ),
        node: (
          <SwitchButton
            checked={isEnableProductShelfEdit}
            onChange={() => {
              setIsEnableProductShelfEdit(!isEnableProductShelfEdit);
            }}
          />
        ),
      },
      {
        label: t("Show Products Without Shelf Info"),
        isUpperSide: true,
        node: (
          <SwitchButton
            checked={showProductsWithoutShelf}
            onChange={() => {
              setShowProductsWithoutShelf(!showProductsWithoutShelf);
            }}
          />
        ),
      },
    ],
    [
      t,
      showProductShelfInfoFilters,
      setShowProductShelfInfoFilters,
      productShelfInfoPageDisabledCondition,
      user,
      isEnableProductShelfEdit,
      setIsEnableProductShelfEdit,
      showProductsWithoutShelf,
      setShowProductsWithoutShelf,
    ]
  );

  const filterPanel = useMemo(
    () => ({
      isFilterPanelActive: showProductShelfInfoFilters,
      inputs: filterPanelInputs,
      formElements: filterProductShelfInfoFormElements,
      setFormElements: setFilterProductShelfInfoFormElements,
      closeFilters: () => setShowProductShelfInfoFilters(false),
    }),
    [
      showProductShelfInfoFilters,
      filterPanelInputs,
      filterProductShelfInfoFormElements,
      setFilterProductShelfInfoFormElements,
      setShowProductShelfInfoFilters,
    ]
  );

  return (
    <>
      <div className="w-[95%] mx-auto ">
        <GenericTable
          rowKeys={rowKeys}
          columns={columns}
          rows={rows}
          title={t("Product Shelf Info")}
          filters={filters}
          isActionsActive={false}
          isExcel={
            user &&
            !productShelfInfoPageDisabledCondition?.actions?.some(
              (ac) =>
                ac.action === ActionEnum.EXCEL &&
                user?.role?._id &&
                !ac?.permissionsRoles?.includes(user?.role?._id)
            )
          }
          isToolTipEnabled={false}
          filterPanel={filterPanel}
          excelFileName="ProductShelfInfo.xlsx"
        />
      </div>
    </>
  );
};

export default ProductShelfInfo;
