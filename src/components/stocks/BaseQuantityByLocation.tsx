import { useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { FaFileUpload } from "react-icons/fa";
import { FiEdit } from "react-icons/fi";
import * as XLSX from "xlsx";
import { useFilterContext } from "../../context/Filter.context";
import { useUserContext } from "../../context/User.context";
import { ActionEnum, DisabledConditionEnum } from "../../types";
import { useGetAccountExpenseTypes } from "../../utils/api/account/expenseType";
import {
  useAccountProductMutations,
  useGetAccountProducts,
  useUpdateMultipleBaseQuantitiesMutation,
} from "../../utils/api/account/product";
import { useUpdateProductBaseStocks } from "../../utils/api/account/stock";
import { useGetAccountVendors } from "../../utils/api/account/vendor";
import { useGetStockLocations } from "../../utils/api/location";
import { useGetDisabledConditions } from "../../utils/api/panelControl/disabledCondition";
import { getItem } from "../../utils/getItem";
import GenericAddEditPanel from "../panelComponents/FormElements/GenericAddEditPanel";
import TextInput from "../panelComponents/FormElements/TextInput";
import ButtonTooltip from "../panelComponents/Tables/ButtonTooltip";
import GenericTable from "../panelComponents/Tables/GenericTable";
import ButtonFilter from "../panelComponents/common/ButtonFilter";
import SwitchButton from "../panelComponents/common/SwitchButton";
import { FormKeyTypeEnum, InputTypes } from "../panelComponents/shared/types";

interface Quantities {
  [key: string]: any;
}

const BaseQuantityByLocation = () => {
  const { t } = useTranslation();
  const { user } = useUserContext();
  const products = useGetAccountProducts();
  const { mutate: updateProductBaseStocks } = useUpdateProductBaseStocks();
  const locations = useGetStockLocations();
  const expenseTypes = useGetAccountExpenseTypes();
  const vendors = useGetAccountVendors();
  const disabledConditions = useGetDisabledConditions();
  const [rowToAction, setRowToAction] = useState<any>();
  const {
    filterBaseQuantityPanelFormElements,
    setFilterBaseQuantityPanelFormElements,
    showBaseQuantityFilters,
    setShowBaseQuantityFilters,
  } = useFilterContext();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { mutate: updateMultipleBaseQuantities } =
    useUpdateMultipleBaseQuantitiesMutation();
  const { updateAccountProduct } = useAccountProductMutations();

  const baseQuantityPageDisabledCondition = useMemo(() => {
    return getItem(
      DisabledConditionEnum.STOCK_BASEQUANTITYBYLOCATION,
      disabledConditions
    );
  }, [disabledConditions]);

  const allRows = useMemo(() => {
    return products?.map((product) => {
      const quantitiesObject = locations?.reduce<Quantities>(
        (acc, location) => {
          const foundBaseQuantity = product?.baseQuantities?.find(
            (baseQuantity) => baseQuantity?.location === location._id
          );
          acc[`${location._id}`] = `min=${
            foundBaseQuantity?.minQuantity ?? 0
          } / max=${foundBaseQuantity?.maxQuantity ?? 0}`;
          acc[`${location._id}min`] = `${foundBaseQuantity?.minQuantity ?? 0}`;
          acc[`${location._id}max`] = `${foundBaseQuantity?.maxQuantity ?? 0}`;
          return acc;
        },
        {}
      );
      return {
        ...product,
        ...quantitiesObject,
      };
    });
  }, [products, locations]);

  const initialFormState = useMemo(() => {
    return locations.reduce((acc: any, location) => {
      acc[location._id.toString() + "min"] = 1;
      acc[location._id.toString() + "max"] = 1;
      return acc;
    }, {});
  }, [locations]);

  const [form, setForm] = useState(initialFormState);

  const editInputs = useMemo(() => {
    return locations?.flatMap((location) => [
      {
        type: InputTypes.NUMBER,
        formKey: location._id.toString() + "min",
        label: location.name,
        placeholder: "Min",
        isNumberButtonsActive: true,
        required: false,
      },
      {
        type: InputTypes.NUMBER,
        formKey: location._id.toString() + "max",
        placeholder: "Max",
        isNumberButtonsActive: true,
        required: false,
      },
    ]);
  }, [locations]);

  const editFormKeys = useMemo(() => {
    return locations?.flatMap((location) => {
      return [
        { key: String(location._id) + "min", type: FormKeyTypeEnum.NUMBER },
        { key: String(location._id) + "max", type: FormKeyTypeEnum.NUMBER },
      ];
    });
  }, [locations]);

  const rows = useMemo(() => {
    const { expenseType: expenseFilter, vendor: vendorFilter } =
      filterBaseQuantityPanelFormElements;

    return allRows?.filter((row) => {
      let matchesExpense = true;
      let matchesVendor = true;
      if (expenseFilter.length > 0) {
        matchesExpense =
          row.expenseType?.some((e) => expenseFilter.includes(e)) ?? false;
      }
      if (vendorFilter.length > 0) {
        matchesVendor =
          row.vendor?.some((v) => vendorFilter.includes(v)) ?? false;
      }
      return matchesExpense && matchesVendor;
    });
  }, [allRows, filterBaseQuantityPanelFormElements]);

  const filterPanelInputs = useMemo(
    () => [
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
      {
        type: InputTypes.SELECT,
        formKey: "vendor",
        label: t("Vendor"),
        options: vendors.map((vendor) => ({
          value: vendor._id,
          label: vendor.name,
        })),
        placeholder: t("Vendor"),
        isMultiple: true,
        required: false,
      },
    ],
    [expenseTypes, vendors, t]
  );

  const columns = useMemo(() => {
    const cols = [
      { key: t("Name"), isSortable: true, correspondingKey: "name" },
    ];

    locations?.forEach((location, index) => {
      cols.push(
        {
          key: location.name + "Min",
          isSortable: true,
          correspondingKey: `${location._id}min`,
        },
        {
          key: location.name + "Max",
          isSortable: true,
          correspondingKey: `${location._id}max`,
        }
      );
    });

    cols.push({ key: t("Actions"), isSortable: false } as any);
    return cols;
  }, [t, locations]);

  const rowKeys = useMemo(() => {
    const keys = [
      {
        key: "name",
        node: (row: any) => {
          return <p>{row.name}</p>;
        },
      },
    ];

    locations?.forEach((location, index) => {
      keys.push(
        {
          key: `${location._id}min`,
          node: (row: any) => {
            const isUpdateDisabled =
              baseQuantityPageDisabledCondition?.actions?.some(
                (ac) =>
                  ac.action === ActionEnum.UPDATE &&
                  user?.role?._id &&
                  !ac?.permissionsRoles?.includes(user?.role?._id)
              );
            return (
              <div>
                <TextInput
                  key={`${location._id}min`}
                  type={"number"}
                  isDebounce={true}
                  className={"text-center w-20 h-10"}
                  inputWidth="w-32 md:w-32  mx-8"
                  value={row?.[`${location._id}min`] ?? 0}
                  label={""}
                  placeholder={""}
                  disabled={isUpdateDisabled}
                  onChange={(value) => {
                    if (value === "") {
                      return;
                    }
                    const newBaseQuantities = locations.map((l) => {
                      return {
                        location: l._id,
                        minQuantity:
                          Number(l._id) === Number(location._id)
                            ? Number(value)
                            : Number(row[`${l._id}min`]),
                        maxQuantity: Number(row[`${l._id}max`]),
                      };
                    });
                    updateAccountProduct({
                      id: row._id,
                      updates: {
                        baseQuantities: newBaseQuantities,
                      },
                    });
                  }}
                  isOnClearActive={true}
                  isNumberButtonsActive={true}
                  isDateInitiallyOpen={false}
                  isTopFlexRow={false}
                  minNumber={0}
                  isMinNumber={true}
                />
              </div>
            );
          },
        },
        {
          key: `${location._id}max`,
          node: (row: any) => {
            const isUpdateDisabled =
              baseQuantityPageDisabledCondition?.actions?.some(
                (ac) =>
                  ac.action === ActionEnum.UPDATE &&
                  user?.role?._id &&
                  !ac?.permissionsRoles?.includes(user?.role?._id)
              );
            return (
              <div>
                <TextInput
                  key={`${location._id}max`}
                  type={"number"}
                  value={row?.[`${location._id}max`] ?? 0}
                  className={"text-center w-20 h-10"}
                  inputWidth="w-32 md:w-32  mx-8"
                  label={""}
                  placeholder={""}
                  disabled={isUpdateDisabled}
                  onChange={(value) => {
                    if (value === "") {
                      return;
                    }
                    const newBaseQuantities = locations.map((l) => {
                      return {
                        location: l._id,
                        minQuantity: Number(row[`${l._id}min`]),
                        maxQuantity:
                          Number(l._id) === Number(location._id)
                            ? Number(value)
                            : Number(row[`${l._id}max`]),
                      };
                    });
                    updateAccountProduct({
                      id: row._id,
                      updates: {
                        baseQuantities: newBaseQuantities,
                      },
                    });
                  }}
                  isDebounce={true}
                  isOnClearActive={true}
                  isNumberButtonsActive={true}
                  isDateInitiallyOpen={false}
                  isTopFlexRow={false}
                  minNumber={0}
                  isMinNumber={true}
                />
              </div>
            );
          },
        }
      );
    });

    return keys;
  }, [
    locations,
    baseQuantityPageDisabledCondition,
    user,
    updateAccountProduct,
  ]);

  const processExcelData = (data: any[]) => {
    const headers = data[0];
    const columnKeys = columns.map((column) => column.key);
    const keys = rowKeys.map((rowKey) => rowKey.key);
    const items = data.slice(1).reduce((accum: any[], row) => {
      const item: any = {};
      row.forEach((cell: any, index: number) => {
        const translatedIndex = columnKeys.indexOf(headers[index]);
        if (translatedIndex !== -1) {
          const key = keys[translatedIndex];
          item[key] = cell;
        }
      });
      if (Object.keys(item).length > 0) {
        accum.push(item);
      }
      return accum;
    }, []);
    const result: any[] = [];

    items.forEach((data) => {
      const foundProduct = products.find(
        (product) => product.name === data.name
      );
      if (!foundProduct) {
        return;
      }
      const baseQuantities: any[] = [];
      Object.keys(data).forEach((key) => {
        if (key.endsWith("min")) {
          const location = key.replace("min", "");
          const minQuantity = data[key];
          const maxQuantity = data[`${location}max`];

          baseQuantities.push({
            location: parseInt(location, 10),
            minQuantity,
            maxQuantity,
          });
        }
      });
      result.push({
        _id: foundProduct._id,
        baseQuantities,
      });
    });
    updateMultipleBaseQuantities(result);
  };
  const uploadExcelFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      const buffer = e.target?.result;
      if (buffer) {
        const wb = XLSX.read(buffer, { type: "array" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
        processExcelData(data);
      }
    };
    reader.readAsArrayBuffer(file);
  };
  const handleFileButtonClick = () => {
    if (inputRef.current) {
      inputRef.current.click();
    }
  };
  const actions = useMemo(
    () => [
      {
        name: t("Edit"),
        icon: <FiEdit />,
        className: "text-blue-500 cursor-pointer text-xl",
        isModal: true,
        setRow: setRowToAction,
        modal: rowToAction ? (
          <GenericAddEditPanel
            isOpen={isEditModalOpen}
            close={() => setIsEditModalOpen(false)}
            inputs={editInputs}
            formKeys={editFormKeys}
            submitItem={updateAccountProduct as any}
            constantValues={rowToAction}
            setForm={setForm}
            submitFunction={() => {
              const newBaseQuantities = locations?.map((location) => {
                return {
                  location: location._id,
                  minQuantity: Number(form[`${location._id}min`]),
                  maxQuantity: Number(form[`${location._id}max`]),
                };
              });
              updateAccountProduct({
                id: rowToAction._id,
                updates: {
                  baseQuantities: newBaseQuantities,
                },
              });
            }}
            generalClassName="overflow-scroll"
            topClassName="flex flex-col gap-2 "
          />
        ) : null,
        isModalOpen: isEditModalOpen,
        setIsModal: setIsEditModalOpen,
        isPath: false,
        isDisabled: baseQuantityPageDisabledCondition?.actions?.some(
          (ac) =>
            ac.action === ActionEnum.UPDATE &&
            user?.role?._id &&
            !ac?.permissionsRoles?.includes(user?.role?._id)
        ),
      },
    ],
    [
      t,
      rowToAction,
      isEditModalOpen,
      editInputs,
      editFormKeys,
      updateAccountProduct,
      form,
      locations,
      baseQuantityPageDisabledCondition,
      user,
    ]
  );

  const filters = useMemo(
    () => [
      {
        isUpperSide: false,
        isDisabled: baseQuantityPageDisabledCondition?.actions?.some(
          (ac) =>
            ac.action === ActionEnum.UPLOAD &&
            user?.role?._id &&
            !ac?.permissionsRoles?.includes(user?.role?._id)
        ),
        node: (
          <div
            className="my-auto  items-center text-xl cursor-pointer border px-2 py-1 rounded-md hover:bg-blue-50  bg-opacity-50 hover:scale-105"
            onClick={handleFileButtonClick}
          >
            <input
              type="file"
              accept=".xlsx, .xls"
              onChange={uploadExcelFile}
              style={{ display: "none" }}
              ref={inputRef}
            />
            <ButtonTooltip content={t("Upload")}>
              <FaFileUpload />
            </ButtonTooltip>
          </div>
        ),
      },
      {
        isUpperSide: false,
        isDisabled: baseQuantityPageDisabledCondition?.actions?.some(
          (ac) =>
            ac.action === ActionEnum.SETBASEAMOUNT &&
            user?.role?._id &&
            !ac?.permissionsRoles?.includes(user?.role?._id)
        ),
        node: (
          <ButtonFilter
            buttonName={t("Set Base Quantities")}
            onclick={() => {
              updateProductBaseStocks();
            }}
          />
        ),
      },
      {
        label: t("Show Filters"),
        isUpperSide: true,
        node: (
          <SwitchButton
            checked={showBaseQuantityFilters}
            onChange={() => {
              setShowBaseQuantityFilters(!showBaseQuantityFilters);
            }}
          />
        ),
      },
    ],
    [
      baseQuantityPageDisabledCondition,
      user,
      handleFileButtonClick,
      uploadExcelFile,
      inputRef,
      t,
      updateProductBaseStocks,
      showBaseQuantityFilters,
      setShowBaseQuantityFilters,
    ]
  );

  const filterPanel = useMemo(
    () => ({
      isFilterPanelActive: showBaseQuantityFilters,
      inputs: filterPanelInputs,
      formElements: filterBaseQuantityPanelFormElements,
      setFormElements: setFilterBaseQuantityPanelFormElements,
      closeFilters: () => setShowBaseQuantityFilters(false),
    }),
    [
      showBaseQuantityFilters,
      filterPanelInputs,
      filterBaseQuantityPanelFormElements,
      setFilterBaseQuantityPanelFormElements,
      setShowBaseQuantityFilters,
    ]
  );

  return (
    <>
      <div className="w-[95%] mx-auto ">
        <GenericTable
          rowKeys={rowKeys}
          columns={columns}
          rows={rows}
          actions={actions}
          title={t("Base Quantity By Location")}
          filters={filters}
          isActionsActive={true}
          isExcel={
            user &&
            !baseQuantityPageDisabledCondition?.actions?.some(
              (ac) =>
                ac.action === ActionEnum.EXCEL &&
                user?.role?._id &&
                !ac?.permissionsRoles?.includes(user?.role?._id)
            )
          }
          filterPanel={filterPanel}
          isToolTipEnabled={false}
          excelFileName={t("BaseQuantityByLocation.xlsx")}
        />
      </div>
    </>
  );
};

export default BaseQuantityByLocation;
