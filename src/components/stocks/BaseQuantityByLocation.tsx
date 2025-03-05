import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { FaFileUpload } from "react-icons/fa";
import { FiEdit } from "react-icons/fi";
import * as XLSX from "xlsx";
import { useGetAccountExpenseTypes } from "../../utils/api/account/expenseType";
import {
  useAccountProductMutations,
  useGetAccountProducts,
  useUpdateProductsBaseQuantities,
} from "../../utils/api/account/product";
import { useGetAccountVendors } from "../../utils/api/account/vendor";
import { useGetAllLocations } from "../../utils/api/location";
import { ExpenseTypeInput, VendorInput } from "../../utils/panelInputs";
import GenericAddEditPanel from "../panelComponents/FormElements/GenericAddEditPanel";
import ButtonTooltip from "../panelComponents/Tables/ButtonTooltip";
import GenericTable from "../panelComponents/Tables/GenericTable";
import SwitchButton from "../panelComponents/common/SwitchButton";
import { FormKeyTypeEnum, InputTypes } from "../panelComponents/shared/types";

type FormElementsState = {
  [key: string]: any;
};
interface Quantities {
  [key: string]: any;
}
const BaseQuantityByLocation = () => {
  const { t } = useTranslation();
  const products = useGetAccountProducts();
  const [showFilters, setShowFilters] = useState(false);
  const { mutate: updateProductsBaseQuantities } =
    useUpdateProductsBaseQuantities();
  const locations = useGetAllLocations();
  const expenseTypes = useGetAccountExpenseTypes();
  const vendors = useGetAccountVendors();
  const [rowToAction, setRowToAction] = useState<any>();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [tableKey, setTableKey] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const { updateAccountProduct } = useAccountProductMutations();
  const allRows = products?.map((product) => {
    const quantitiesObject = locations?.reduce<Quantities>((acc, location) => {
      const foundBaseQuantity= product?.baseQuantities?.find(
        (baseQuantity) => baseQuantity?.location === location._id
      )
      acc[`${location._id}`] = `min=${foundBaseQuantity?.minQuantity ?? 0} / max=${foundBaseQuantity?.maxQuantity ?? 0}`;
      acc[`${location._id}min`] = `${foundBaseQuantity?.minQuantity ?? 0}`;
      acc[`${location._id}max`] = `${foundBaseQuantity?.maxQuantity ?? 0}`;
      return acc;
    }, {});
    return {
      ...product,
      ...quantitiesObject,
    };
  });
  const initialFormState = locations.reduce((acc: any, location) => {
    acc[location._id.toString()+"min"] = 1;
    acc[location._id.toString()+"max"] = 1;
    return acc;
  }, {});

  const [form, setForm] = useState(initialFormState);
  const editInputs = locations?.flatMap((location) => [
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
  
  const editFormKeys = locations?.flatMap((location) => {
    return [
      { key: String(location._id)+"min", type: FormKeyTypeEnum.NUMBER },
      { key: String(location._id)+"max", type: FormKeyTypeEnum.NUMBER }
    ];
  });
  const [filterPanelFormElements, setFilterPanelFormElements] =
    useState<FormElementsState>({
      expenseType: [],
      vendor: [],
    });
  const [rows, setRows] = useState(allRows);
  const filterPanelInputs = [
    ExpenseTypeInput({ expenseTypes: expenseTypes, isMultiple: true }),
    VendorInput({ vendors: vendors, isMultiple: true }),
  ];
  const columns = [
    { key: t("Name"), isSortable: true, correspondingKey: "name" },
  ];
  const rowKeys = [{ key: "name" }];
  locations?.forEach((location) => {
    columns.push({
      key: location.name,
      isSortable: true,
      correspondingKey: `${location._id}`,
    });
    rowKeys.push({
      key: `${location._id}`,
    });
  });

  columns.push({ key: t("Action"), isSortable: false } as any);
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
    updateProductsBaseQuantities(items);
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
  const actions = [
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
                maxQuantity:  Number(form[`${location._id}max`]),
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
    },
  ];
  const filters = [
    {
      isUpperSide: false,
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
    const filteredRows = allRows?.filter((row) => {
      if (filterPanelFormElements.expenseType.length !== 0) {
        return row.expenseType?.some((expense) =>
          filterPanelFormElements.expenseType.includes(expense)
        );
      } else if (filterPanelFormElements.vendor.length !== 0) {
        return row.vendor?.some((vendor) =>
          filterPanelFormElements.vendor.includes(vendor)
        );
      }
      return true;
    });
    setRows(filteredRows);
    setTableKey((prev) => prev + 1);
  }, [products, locations, expenseTypes, filterPanelFormElements, vendors]);
  return (
    <>
      <div className="w-[95%] mx-auto ">
        <GenericTable
          key={tableKey}
          rowKeys={rowKeys}
          columns={columns}
          rows={rows}
          actions={actions}
          title={t("Base Quantity By Location")}
          filters={filters}
          isActionsActive={true}
          isExcel={true}
          filterPanel={filterPanel}
          excelFileName={t("BaseQuantityByLocation.xlsx")}
        />
      </div>
    </>
  );
};

export default BaseQuantityByLocation;
