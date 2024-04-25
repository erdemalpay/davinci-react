import { Switch } from "@headlessui/react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FiEdit } from "react-icons/fi";
import { HiOutlineTrash } from "react-icons/hi2";
import { useGeneralContext } from "../../context/General.context";
import {
  AccountExpenseCategory,
  AccountProduct,
  AccountStockType,
  AccountUnit,
} from "../../types";
import { useGetAccountBrands } from "../../utils/api/account/brand";
import { useGetAccountExpenseCategorys } from "../../utils/api/account/expenseCategory";
import { useGetAccountExpenseTypes } from "../../utils/api/account/expenseType";
import { useGetAccountPackageTypes } from "../../utils/api/account/packageType";
import {
  useAccountProductMutations,
  useGetAccountProducts,
  useJoinProductsMutation,
} from "../../utils/api/account/product";
import { useGetAccountStockTypes } from "../../utils/api/account/stockType";
import { useGetAccountUnits } from "../../utils/api/account/unit";
import { useGetAccountVendors } from "../../utils/api/account/vendor";
import { passesFilter } from "../../utils/passesFilter";
import { ConfirmationDialog } from "../common/ConfirmationDialog";
import GenericAddEditPanel from "../panelComponents/FormElements/GenericAddEditPanel";
import { FormKeyTypeEnum, InputTypes } from "../panelComponents/shared/types";
import GenericTable from "../panelComponents/Tables/GenericTable";
import { H5, P1 } from "../panelComponents/Typography";

type Props = {};

type FormElementsState = {
  [key: string]: any;
};
const Product = (props: Props) => {
  const { t } = useTranslation();
  const products = useGetAccountProducts();
  const [tableKey, setTableKey] = useState(0);
  const units = useGetAccountUnits();
  const expenseTypes = useGetAccountExpenseTypes();
  const expenseCategories = useGetAccountExpenseCategorys();
  const stockTypes = useGetAccountStockTypes();
  const brands = useGetAccountBrands();
  const vendors = useGetAccountVendors();
  const packages = useGetAccountPackageTypes();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [rowToAction, setRowToAction] = useState<AccountProduct>();
  const [showFilters, setShowFilters] = useState(false);
  const { setCurrentPage } = useGeneralContext();
  const { mutate: joinProducts } = useJoinProductsMutation();
  const [isJoinProductModalOpen, setIsJoinProductModalOpen] = useState(false);
  const [filterPanelFormElements, setFilterPanelFormElements] =
    useState<FormElementsState>({
      brand: "",
      vendor: "",
      expenseType: "",
      expenseCategory: "",
      stockType: "",
      unit: "",
      package: "",
      name: "",
    });
  const [form, setForm] = useState({
    stayedProduct: "",
    removedProduct: "",
  });
  const [inputForm, setInputForm] = useState({
    brand: [],
    vendor: [],
    expenseType: [],
    stockType: "",
    expenseCategory: "",
    unit: "",
    packages: [],
    name: "",
  });
  const [
    isCloseAllConfirmationDialogOpen,
    setIsCloseAllConfirmationDialogOpen,
  ] = useState(false);
  const { createAccountProduct, deleteAccountProduct, updateAccountProduct } =
    useAccountProductMutations();

  const [rows, setRows] = useState(
    products.map((product) => {
      return {
        ...product,
        unit: (product.unit as AccountUnit)?.name,
        stockType: (product.stockType as AccountStockType)?.name,
        stckType: product.stockType,
        expenseCategory: (product.expenseCategory as AccountExpenseCategory)
          ?.name,
      };
    })
  );
  const joinProductInputs = [
    {
      type: InputTypes.SELECT,
      formKey: "stayedProduct",
      label: t("Stayed Product"),
      options: products
        .filter((product) => product._id !== form.removedProduct)
        .map((product) => {
          return {
            value: product._id,
            label: product.name + `(${(product.unit as AccountUnit).name})`,
          };
        }),
      placeholder: t("Stayed Product"),
      required: true,
    },
    {
      type: InputTypes.SELECT,
      formKey: "removedProduct",
      label: t("Removed Product"),
      options: products
        .filter((product) => product._id !== form.stayedProduct)
        .map((product) => {
          return {
            value: product._id,
            label: product.name + `(${(product.unit as AccountUnit).name})`,
          };
        }),
      placeholder: t("Removed Product"),
      required: true,
    },
  ];
  const filterPanelInputs = [
    {
      type: InputTypes.SELECT,
      formKey: "brand",
      label: t("Brand"),
      options: brands.map((brand) => {
        return {
          value: brand._id,
          label: brand.name,
        };
      }),
      placeholder: t("Brand"),
      required: false,
    },
    {
      type: InputTypes.SELECT,
      formKey: "vendor",
      label: t("Vendor"),
      options: vendors.map((vendor) => {
        return {
          value: vendor._id,
          label: vendor.name,
        };
      }),
      placeholder: t("Vendor"),
      required: false,
    },
    {
      type: InputTypes.SELECT,
      formKey: "expenseType",
      label: t("Expense Type"),
      options: expenseTypes.map((expenseType) => {
        return {
          value: expenseType._id,
          label: expenseType.name,
        };
      }),
      placeholder: t("Expense Type"),
      required: true,
    },
    {
      type: InputTypes.SELECT,
      formKey: "stockType",
      label: t("Stock Type"),
      options: stockTypes.map((stockType) => {
        return {
          value: stockType._id,
          label: stockType.name,
        };
      }),
      placeholder: t("Stock Type"),
      required: true,
    },
    {
      type: InputTypes.SELECT,
      formKey: "expenseCategory",
      label: t("Expense Category"),
      options: expenseCategories.map((expenseCategory) => {
        return {
          value: expenseCategory._id,
          label: expenseCategory.name,
        };
      }),
      placeholder: t("Expense Category"),
      required: true,
    },
    {
      type: InputTypes.SELECT,
      formKey: "package",
      label: t("Package Type"),
      options: packages.map((item) => {
        return {
          value: item._id,
          label: item.name,
        };
      }),
      placeholder: t("Package Type"),
      required: true,
    },
    {
      type: InputTypes.SELECT,
      formKey: "unit",
      label: t("Unit"),
      options: units.map((unit) => {
        return {
          value: unit._id,
          label: unit.name,
        };
      }),
      placeholder: t("Unit"),
      required: true,
    },
  ];
  const inputs = [
    {
      type: InputTypes.TEXT,
      formKey: "name",
      label: t("Name"),
      placeholder: t("Name"),
      required: true,
    },
    {
      type: InputTypes.SELECT,
      formKey: "unit",
      label: t("Unit"),
      options: units.map((unit) => {
        return {
          value: unit._id,
          label: unit.name,
        };
      }),
      placeholder: t("Unit"),
      required: true,
    },
    {
      type: InputTypes.SELECT,
      formKey: "expenseType",
      label: t("Expense Type"),
      options: expenseTypes.map((expenseType) => {
        return {
          value: expenseType._id,
          label: expenseType.name,
        };
      }),
      placeholder: t("Expense Type"),
      isMultiple: true,
      required: true,
    },
    {
      type: InputTypes.SELECT,
      formKey: "stockType",
      label: t("Stock Type"),
      options: stockTypes.map((stockType) => {
        return {
          value: stockType._id,
          label: stockType.name,
        };
      }),
      placeholder: t("Stock Type"),
      required: true,
    },
    {
      type: InputTypes.SELECT,
      formKey: "expenseCategory",
      label: t("Expense Category"),
      options: expenseCategories.map((expenseCategory) => {
        return {
          value: expenseCategory._id,
          label: expenseCategory.name,
        };
      }),
      placeholder: t("Expense Category"),
      required: true,
    },
    {
      type: InputTypes.SELECT,
      formKey: "packages",
      label: t("Package Type"),
      options: packages.map((item) => {
        return {
          value: item._id,
          label: item.name,
        };
      }),
      isMultiple: true,
      placeholder: t("Package Type"),
      required: true,
    },
    {
      type: InputTypes.SELECT,
      formKey: "brand",
      label: t("Brand"),
      options: brands.map((brand) => {
        return {
          value: brand._id,
          label: brand.name,
        };
      }),
      placeholder: t("Brand"),
      isMultiple: true,
      required: false,
    },
    {
      type: InputTypes.SELECT,
      formKey: "vendor",
      label: t("Vendor"),
      options: vendors.map((vendor) => {
        return {
          value: vendor._id,
          label: vendor.name,
        };
      }),
      placeholder: t("Vendor"),
      isMultiple: true,
      required: false,
    },
  ];
  const joinProductFormKeys = [
    { key: "stayedProduct", type: FormKeyTypeEnum.STRING },
    { key: "removedProduct", type: FormKeyTypeEnum.STRING },
  ];
  const formKeys = [
    { key: "name", type: FormKeyTypeEnum.STRING },
    { key: "unit", type: FormKeyTypeEnum.STRING },
    { key: "expenseType", type: FormKeyTypeEnum.STRING },
    { key: "stockType", type: FormKeyTypeEnum.STRING },
    { key: "expenseCategory", type: FormKeyTypeEnum.STRING },
    { key: "packages", type: FormKeyTypeEnum.STRING },
    { key: "brand", type: FormKeyTypeEnum.STRING },
    { key: "vendor", type: FormKeyTypeEnum.STRING },
  ];
  const columns = [
    { key: t("Name"), isSortable: true },
    { key: t("Unit"), isSortable: true },
    { key: t("Expense Type"), isSortable: true },
    { key: t("Category"), isSortable: true },
    { key: t("Stock Type"), isSortable: true },
    { key: t("Package Type"), isSortable: true },
    { key: t("Brand"), isSortable: true },
    { key: t("Vendor"), isSortable: true },
    { key: t("Unit Price"), isSortable: true },
    { key: t("Actions"), isSortable: false },
  ];
  const rowKeys = [
    { key: "name", className: "min-w-32 pr-1" },
    { key: "unit", className: "min-w-32" },
    {
      key: "expenseType",
      className: "min-w-32",
      node: (row: AccountProduct) => {
        return row.expenseType.map((expType: string) => {
          const foundExpenseType = expenseTypes.find(
            (expenseType) => expenseType._id === expType
          );
          return (
            <span
              key={foundExpenseType?.name ?? "" + row._id}
              className={`text-sm  px-2 py-1 mr-1 rounded-md w-fit text-white`}
              style={{ backgroundColor: foundExpenseType?.backgroundColor }}
            >
              {foundExpenseType?.name}
            </span>
          );
        });
      },
    },
    { key: "expenseCategory", className: "min-w-32" },
    {
      key: "stockType",
      className: "min-w-32",
      node: (row: any) => {
        return (
          <span
            key={row?.stckType?.name ?? "" + row._id}
            className={`text-sm  px-2 py-1 mr-1 rounded-md w-fit text-white`}
            style={{ backgroundColor: row?.stckType?.backgroundColor }}
          >
            {row?.stckType?.name}
          </span>
        );
      },
    },
    {
      key: "packages",
      className: "min-w-32",
      node: (row: AccountProduct) => {
        return row?.packages?.map((item, index) => {
          const foundPackage = packages.find((p) => p._id === item.package);
          return (
            <span
              key={foundPackage?.name ?? "" + row._id}
              className={`text-sm  px-2 py-1 mr-1 rounded-md w-fit `}
            >
              {foundPackage?.name}
              {(row?.packages?.length ?? 0) - 1 !== index && ","}
            </span>
          );
        });
      },
    },
    {
      key: "brand",
      className: "min-w-32",
      node: (row: AccountProduct) => {
        if (row.brand) {
          return row?.brand?.map((brand: string, index) => {
            const foundBrand = brands.find((br) => br._id === brand);
            if (!foundBrand)
              return <div key={row._id + "not found brand"}>-</div>;
            return (
              <span
                key={foundBrand.name + foundBrand._id + row._id}
                className={`text-sm   mr-1  w-fit`}
              >
                {foundBrand?.name}
                {(row?.brand?.length ?? 0) - 1 !== index && ","}
              </span>
            );
          });
        }
      },
    },
    {
      key: "vendor",
      className: "min-w-32",
      node: (row: AccountProduct) => {
        if (row.vendor) {
          return row?.vendor?.map((vendor: string, index) => {
            const foundVendor = vendors.find((vn) => vn._id === vendor);
            if (!foundVendor)
              return <div key={row._id + "not found vendor"}>-</div>;
            return (
              <span
                key={foundVendor.name + foundVendor._id + row._id}
                className={`text-sm mr-1  w-fit`}
              >
                {foundVendor?.name}
                {(row?.vendor?.length ?? 0) - 1 !== index && ","}
              </span>
            );
          });
        }
      },
    },
    {
      key: "unitPrice",
      node: (row: any) => {
        return (
          <div className="min-w-32">
            <P1>{row.unitPrice} ₺</P1>
          </div>
        );
      },
    },
  ];
  const addButton = {
    name: t(`Add Product`),
    isModal: true,
    modal: (
      <GenericAddEditPanel
        isOpen={isAddModalOpen}
        close={() => setIsAddModalOpen(false)}
        inputs={inputs}
        formKeys={formKeys}
        setForm={setInputForm}
        submitItem={createAccountProduct as any}
        generalClassName="overflow-scroll"
        submitFunction={() => {
          createAccountProduct({
            ...inputForm,
            packages:
              inputForm?.packages.map((pkg: any) => ({
                package: pkg as string,
                packageUnitPrice: 0,
              })) ?? [],
          });
          setInputForm({
            brand: [],
            vendor: [],
            expenseType: [],
            stockType: "",
            expenseCategory: "",
            unit: "",
            packages: [],
            name: "",
          });
        }}
        topClassName="flex flex-col gap-2 "
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
            deleteAccountProduct(rowToAction?._id);
            setIsCloseAllConfirmationDialogOpen(false);
          }}
          title={t("Delete Product")}
          text={`${rowToAction.name} ${t("GeneralDeleteMessage")}`}
        />
      ) : null,
      className: "text-red-500 cursor-pointer text-2xl  ",
      isModal: true,
      isModalOpen: isCloseAllConfirmationDialogOpen,
      setIsModal: setIsCloseAllConfirmationDialogOpen,
      isPath: false,
    },
    {
      name: t("Edit"),
      icon: <FiEdit />,
      className: "text-blue-500 cursor-pointer text-xl ",
      isModal: true,
      setRow: setRowToAction,
      modal: rowToAction ? (
        <GenericAddEditPanel
          isOpen={isEditModalOpen}
          close={() => setIsEditModalOpen(false)}
          inputs={inputs}
          formKeys={formKeys}
          generalClassName="overflow-scroll"
          submitItem={updateAccountProduct as any}
          isEditMode={true}
          topClassName="flex flex-col gap-2 "
          setForm={setInputForm}
          constantValues={{
            name: rowToAction.name,
            unit: units.find(
              (unit) => unit.name === (rowToAction?.unit as string)
            )?._id,
            expenseType: rowToAction.expenseType,
            stockType: stockTypes.find(
              (stockType) =>
                stockType.name === (rowToAction?.stockType as string)
            )?._id,
            brand: rowToAction.brand,
            vendor: rowToAction.vendor,
            expenseCategory: expenseCategories.find(
              (expenseCategory) =>
                expenseCategory.name === rowToAction?.expenseCategory
            )?._id,
            packages: rowToAction?.packages?.map((pkg) => pkg.package),
          }}
          handleUpdate={() => {
            updateAccountProduct({
              id: rowToAction?._id,
              updates: {
                ...inputForm,
                packages:
                  inputForm?.packages.map((pkg: any) => ({
                    package: pkg as string,
                    packageUnitPrice: 0,
                  })) ?? [],
              },
            });
          }}
        />
      ) : null,

      isModalOpen: isEditModalOpen,
      setIsModal: setIsEditModalOpen,
      isPath: false,
    },
  ];
  useEffect(() => {
    setRows(
      products
        .filter((product) => {
          return (
            passesFilter(
              filterPanelFormElements.stockType,
              (product.stockType as AccountStockType)?._id
            ) &&
            passesFilter(
              filterPanelFormElements.unit,
              (product.unit as AccountUnit)?._id
            ) &&
            passesFilter(
              filterPanelFormElements.expenseCategory,
              (product.expenseCategory as AccountExpenseCategory)?._id
            ) &&
            (filterPanelFormElements.brand === "" ||
              product.brand?.includes(filterPanelFormElements.brand)) &&
            (filterPanelFormElements.vendor === "" ||
              product.vendor?.includes(filterPanelFormElements.vendor)) &&
            (filterPanelFormElements.expenseType === "" ||
              product.expenseType?.includes(
                filterPanelFormElements.expenseType
              )) &&
            (filterPanelFormElements.package === "" ||
              product.packages?.some(
                (pkg) => pkg.package === filterPanelFormElements.package
              ))
          );
        })
        .map((product) => {
          return {
            ...product,
            unit: (product.unit as AccountUnit)?.name,
            stockType: (product.stockType as AccountStockType)?.name,
            stckType: product.stockType,
            expenseCategory: (product.expenseCategory as AccountExpenseCategory)
              ?.name,
          };
        })
    );
    setCurrentPage(1);
    setTableKey((prev) => prev + 1);
  }, [products, filterPanelFormElements]);

  const filters = [
    {
      label: t("Show Filters"),
      isUpperSide: true,
      node: (
        <Switch
          checked={showFilters}
          onChange={() => setShowFilters((value) => !value)}
          className={`${showFilters ? "bg-green-500" : "bg-red-500"}
          relative inline-flex h-[20px] w-[36px] min-w-[36px] border-[1px] cursor-pointer rounded-full border-transparent transition-colors duration-200 ease-in-out focus:outline-none`}
        >
          <span
            aria-hidden="true"
            className={`${showFilters ? "translate-x-4" : "translate-x-0"}
            pointer-events-none inline-block h-[18px] w-[18px] transform rounded-full bg-white transition duration-200 ease-in-out`}
          />
        </Switch>
      ),
    },
    {
      isUpperSide: false,
      node: (
        <button
          className="px-2 ml-auto bg-blue-500 hover:text-blue-500 hover:border-blue-500 sm:px-3 py-1 h-fit w-fit  text-white  hover:bg-white  transition-transform  border  rounded-md cursor-pointer"
          onClick={() => {
            setIsJoinProductModalOpen(true);
          }}
        >
          <H5> {t("Join Products")}</H5>
        </button>
      ),
    },
  ];
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
          actions={actions}
          columns={columns}
          rows={rows}
          title={t("Products")}
          addButton={addButton}
          filters={filters}
          filterPanel={filterPanel}
        />
        {isJoinProductModalOpen && (
          <GenericAddEditPanel
            isOpen={isJoinProductModalOpen}
            close={() => setIsJoinProductModalOpen(false)}
            inputs={joinProductInputs}
            formKeys={joinProductFormKeys}
            submitItem={joinProducts as any}
            setForm={setForm}
            isEditMode={false}
            topClassName="flex flex-col gap-2 "
            buttonName={t("Join")}
          />
        )}
      </div>
    </>
  );
};

export default Product;
