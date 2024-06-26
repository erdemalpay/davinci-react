import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FiEdit } from "react-icons/fi";
import { HiOutlineTrash } from "react-icons/hi2";
import { useNavigate } from "react-router-dom";
import { useGeneralContext } from "../../context/General.context";
import { useUserContext } from "../../context/User.context";
import { AccountProduct, AccountUnit, RoleEnum } from "../../types";
import { useGetAccountBrands } from "../../utils/api/account/brand";
import { useGetAccountExpenseTypes } from "../../utils/api/account/expenseType";
import { useGetAccountPackageTypes } from "../../utils/api/account/packageType";
import {
  useAccountProductMutations,
  useGetAccountProducts,
  useJoinProductsMutation,
} from "../../utils/api/account/product";
import { useGetAccountUnits } from "../../utils/api/account/unit";
import { useGetAccountVendors } from "../../utils/api/account/vendor";
import { useGetPanelControlPages } from "../../utils/api/panelControl/page";
import {
  BrandInput,
  ExpenseTypeInput,
  NameInput,
  PackageTypeInput,
  UnitInput,
  VendorInput,
} from "../../utils/panelInputs";
import { passesFilter } from "../../utils/passesFilter";
import { ConfirmationDialog } from "../common/ConfirmationDialog";
import ButtonFilter from "../panelComponents/common/ButtonFilter";
import SwitchButton from "../panelComponents/common/SwitchButton";
import GenericAddEditPanel from "../panelComponents/FormElements/GenericAddEditPanel";
import { FormKeyTypeEnum, InputTypes } from "../panelComponents/shared/types";
import GenericTable from "../panelComponents/Tables/GenericTable";
import { P1 } from "../panelComponents/Typography";

type FormElementsState = {
  [key: string]: any;
};
const Product = () => {
  const { t } = useTranslation();
  const { user } = useUserContext();
  const products = useGetAccountProducts();
  const [tableKey, setTableKey] = useState(0);
  const units = useGetAccountUnits();
  const expenseTypes = useGetAccountExpenseTypes();
  const brands = useGetAccountBrands();
  const navigate = useNavigate();
  const vendors = useGetAccountVendors();
  const packages = useGetAccountPackageTypes();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [rowToAction, setRowToAction] = useState<AccountProduct>();
  const pages = useGetPanelControlPages();
  const [showFilters, setShowFilters] = useState(false);
  const {
    setCurrentPage,
    setRowsPerPage,
    setSearchQuery,
    sortConfigKey,
    setSortConfigKey,
  } = useGeneralContext();
  const { mutate: joinProducts } = useJoinProductsMutation();
  const [isJoinProductModalOpen, setIsJoinProductModalOpen] = useState(false);
  const [filterPanelFormElements, setFilterPanelFormElements] =
    useState<FormElementsState>({
      brand: "",
      vendor: "",
      expenseType: "",
      unit: "",
      packages: "",
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
        .filter((product) => {
          const stayedProductUnit = products.find(
            (p) => p._id === form?.stayedProduct
          )?.unit;
          return !(
            product._id === form?.stayedProduct ||
            (product.unit as AccountUnit)?._id !==
              (stayedProductUnit as AccountUnit)?._id
          );
        })
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
    BrandInput({ brands: brands }),
    VendorInput({ vendors: vendors }),
    ExpenseTypeInput({ expenseTypes: expenseTypes }),
    PackageTypeInput({ packages: packages }),
    UnitInput({ units: units }),
  ];
  const inputs = [
    NameInput(),
    UnitInput({
      units: units,
      invalidateKeys: [{ key: "packages", defaultValue: "" }],
      required: true,
    }),
    ExpenseTypeInput({
      expenseTypes: expenseTypes,
      isMultiple: true,
      required: true,
    }),
    PackageTypeInput({
      packages: packages.filter(
        (p) => (p.unit as AccountUnit)._id === inputForm.unit
      ),
      isMultiple: true,
      required: true,
    }),
    VendorInput({
      vendors: vendors,
      isMultiple: true,
      required: true,
    }),
    BrandInput({ brands: brands, isMultiple: true }),
  ];
  const formKeys = [
    { key: "name", type: FormKeyTypeEnum.STRING },
    { key: "unit", type: FormKeyTypeEnum.STRING },
    { key: "expenseType", type: FormKeyTypeEnum.STRING },
    { key: "packages", type: FormKeyTypeEnum.STRING },
    { key: "vendor", type: FormKeyTypeEnum.STRING },
    { key: "brand", type: FormKeyTypeEnum.STRING },
  ];
  const joinProductFormKeys = [
    { key: "stayedProduct", type: FormKeyTypeEnum.STRING },
    { key: "removedProduct", type: FormKeyTypeEnum.STRING },
  ];
  const columns = [
    { key: t("Name"), isSortable: true },
    { key: t("Unit"), isSortable: true },
    { key: t("Expense Type"), isSortable: true },
    { key: t("Package Type"), isSortable: true },
    { key: t("Brand"), isSortable: true },
    { key: t("Vendor"), isSortable: true },
    { key: t("Unit Price"), isSortable: true },
    { key: t("Actions"), isSortable: false },
  ];

  const rowKeys = [
    {
      key: "name",
      className: "min-w-32 pr-1",
      node: (row: AccountProduct) =>
        user &&
        pages &&
        pages
          ?.find((page) => page._id === "product")
          ?.permissionRoles?.includes(user.role._id) ? (
          <p
            className="text-blue-700  w-fit  cursor-pointer hover:text-blue-500 transition-transform"
            onClick={() => {
              setCurrentPage(1);
              // setRowsPerPage(RowPerPageEnum.FIRST);
              setSearchQuery("");
              setSortConfigKey(null);
              navigate(`/product/${row._id}`);
            }}
          >
            {row.name}
          </p>
        ) : (
          <p>{row.name}</p>
        ),
    },
    { key: "unit", className: "min-w-32" },
    {
      key: "expenseType",
      className: "min-w-32",
      node: (row: AccountProduct) => {
        return row.expenseType.map((expType: string, index) => {
          const foundExpenseType = expenseTypes.find(
            (expenseType) => expenseType._id === expType
          );
          return (
            <span
              key={foundExpenseType?.name ?? index + row._id + "expenseType"}
              className={`text-sm  px-2 py-1 mr-1 rounded-md w-fit text-white font-semibold`}
              style={{ backgroundColor: foundExpenseType?.backgroundColor }}
            >
              {foundExpenseType?.name}
            </span>
          );
        });
      },
    },
    {
      key: "packages",
      className: "min-w-32",
      node: (row: AccountProduct) => {
        return row?.packages?.map((item, index) => {
          if (!item.package || !packages) return null;
          return (
            <span
              key={
                packages?.find((p) => p._id === item.package)?.name ??
                index + row._id + "packages"
              }
              className={`text-sm  px-2 py-1 mr-1 rounded-md w-fit `}
            >
              {packages?.find((p) => p._id === item.package)?.name}
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
              return <div key={row._id + index + "brand"}>-</div>;
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
              return <div key={row._id + index + "vendor"}>-</div>;
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
  if (
    user &&
    ![
      RoleEnum.MANAGER,
      RoleEnum.CATERINGMANAGER,
      RoleEnum.GAMEMANAGER,
    ].includes(user?.role?._id)
  ) {
    columns.splice(
      columns.findIndex((column) => column.key === "Unit Price"),
      1
    );
    columns.splice(
      columns.findIndex((column) => column.key === "Actions"),
      1
    );
    rowKeys.splice(
      rowKeys.findIndex((rowKey) => rowKey.key === "unitPrice"),
      1
    );
  }
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
        generalClassName="overflow-visible"
        submitFunction={() => {
          createAccountProduct({
            ...inputForm,
            packages:
              inputForm?.packages?.map((pkg: any) => ({
                package: pkg as string,
                packageUnitPrice: 0,
              })) ?? [],
          });
          setInputForm({
            brand: [],
            vendor: [],
            expenseType: [],
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
    isDisabled: user
      ? ![
          RoleEnum.MANAGER,
          RoleEnum.CATERINGMANAGER,
          RoleEnum.GAMEMANAGER,
        ].includes(user?.role?._id)
      : true,
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
      isDisabled: user
        ? ![
            RoleEnum.MANAGER,
            RoleEnum.CATERINGMANAGER,
            RoleEnum.GAMEMANAGER,
          ].includes(user?.role?._id)
        : true,
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
          generalClassName="overflow-visible"
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
            brand: rowToAction.brand,
            vendor: rowToAction.vendor,
            packages: rowToAction.packages?.map((pkg) => pkg.package),
          }}
          handleUpdate={() => {
            updateAccountProduct({
              id: rowToAction?._id,
              updates: {
                ...inputForm,
                packages:
                  inputForm?.packages?.map((pkg: any) => ({
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
      isDisabled: user
        ? ![
            RoleEnum.MANAGER,
            RoleEnum.CATERINGMANAGER,
            RoleEnum.GAMEMANAGER,
          ].includes(user?.role?._id)
        : true,
    },
  ];
  useEffect(() => {
    setRows(
      products
        .filter((product) => {
          return (
            passesFilter(
              filterPanelFormElements.unit,
              (product.unit as AccountUnit)?._id
            ) &&
            (filterPanelFormElements.brand === "" ||
              product.brand?.includes(filterPanelFormElements.brand)) &&
            (filterPanelFormElements.vendor === "" ||
              product.vendor?.includes(filterPanelFormElements.vendor)) &&
            (filterPanelFormElements.expenseType === "" ||
              product.expenseType?.includes(
                filterPanelFormElements.expenseType
              )) &&
            (filterPanelFormElements.packages === "" ||
              product.packages?.some(
                (pkg) => pkg.package === filterPanelFormElements.packages
              ))
          );
        })
        .map((product) => {
          return {
            ...product,
            unit: (product.unit as AccountUnit)?.name,
          };
        })
    );
    if (Object.values(filterPanelFormElements).some((value) => value !== "")) {
      setCurrentPage(1);
    }
    setTableKey((prev) => prev + 1);
  }, [products, filterPanelFormElements]);

  const filters = [
    {
      label: t("Show Filters"),
      isUpperSide: true,
      node: <SwitchButton checked={showFilters} onChange={setShowFilters} />,
    },
    {
      isUpperSide: false,
      isDisabled: user
        ? ![
            RoleEnum.MANAGER,
            RoleEnum.CATERINGMANAGER,
            RoleEnum.GAMEMANAGER,
          ].includes(user?.role?._id)
        : true,
      node: (
        <ButtonFilter
          buttonName={t("Join Products")}
          onclick={() => {
            setIsJoinProductModalOpen(true);
          }}
        />
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
          isActionsActive={
            user
              ? [
                  RoleEnum.MANAGER,
                  RoleEnum.CATERINGMANAGER,
                  RoleEnum.GAMEMANAGER,
                ].includes(user?.role?._id)
              : false
          }
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
