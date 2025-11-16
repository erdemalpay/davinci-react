import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { CiCirclePlus } from "react-icons/ci";
import { FiEdit } from "react-icons/fi";
import { HiOutlineTrash } from "react-icons/hi2";
import { useNavigate } from "react-router-dom";
import { useFilterContext } from "../../context/Filter.context";
import { useGeneralContext } from "../../context/General.context";
import { useUserContext } from "../../context/User.context";
import {
  AccountProduct,
  ActionEnum,
  DisabledConditionEnum,
} from "../../types";
import { useGetAccountBrands } from "../../utils/api/account/brand";
import { useGetAccountExpenseTypes } from "../../utils/api/account/expenseType";
import {
  useAccountProductMutations,
  useGetAllAccountProducts,
  useJoinProductsMutation,
} from "../../utils/api/account/product";
import { useGetAccountVendors } from "../../utils/api/account/vendor";
import { useGetCategories } from "../../utils/api/menu/category";
import {
  useGetMenuItems,
  useMenuItemMutations,
} from "../../utils/api/menu/menu-item";
import { useGetDisabledConditions } from "../../utils/api/panelControl/disabledCondition";
import { useGetPanelControlPages } from "../../utils/api/panelControl/page";
import { getItem } from "../../utils/getItem";
import { CheckSwitch } from "../common/CheckSwitch";
import { ConfirmationDialog } from "../common/ConfirmationDialog";
import GenericAddEditPanel from "../panelComponents/FormElements/GenericAddEditPanel";
import GenericTable from "../panelComponents/Tables/GenericTable";
import { P1 } from "../panelComponents/Typography";
import ButtonFilter from "../panelComponents/common/ButtonFilter";
import SwitchButton from "../panelComponents/common/SwitchButton";
import { FormKeyTypeEnum, InputTypes } from "../panelComponents/shared/types";

const Product = () => {
  const { t } = useTranslation();
  const { user } = useUserContext();
  const products = useGetAllAccountProducts();
  const items = useGetMenuItems();
  const expenseTypes = useGetAccountExpenseTypes();
  const brands = useGetAccountBrands();
  const categories = useGetCategories();
  const navigate = useNavigate();
  const vendors = useGetAccountVendors();
  const pages = useGetPanelControlPages();
  const disabledConditions = useGetDisabledConditions();

  const productDisabledCondition = useMemo(() => {
    return getItem(DisabledConditionEnum.ACCOUNTING_PRODUCT, disabledConditions);
  }, [disabledConditions]);

  const [showInactiveProducts, setShowInactiveProducts] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isMenuItemAddModalOpen, setIsMenuItemAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [rowToAction, setRowToAction] = useState<AccountProduct>();
  const { setCurrentPage, setSearchQuery, setSortConfigKey } =
    useGeneralContext();
  const { createItem } = useMenuItemMutations();
  const { mutate: joinProducts } = useJoinProductsMutation();
  const [isJoinProductModalOpen, setIsJoinProductModalOpen] = useState(false);

  const {
    filterProductPanelFormElements,
    setFilterProductPanelFormElements,
    showProductFilters,
    setShowProductFilters,
  } = useFilterContext();

  const [form, setForm] = useState({ stayedProduct: "", removedProduct: "" });

  const initialInputForm = {
    brand: [] as string[],
    vendor: [] as string[],
    expenseType: [] as string[],
    name: "",
    matchedMenuItem: "",
  };
  const [inputForm, setInputForm] = useState(initialInputForm);

  const [
    isCloseAllConfirmationDialogOpen,
    setIsCloseAllConfirmationDialogOpen,
  ] = useState(false);

  const { createAccountProduct, deleteAccountProduct, updateAccountProduct } =
    useAccountProductMutations();

  const rows = useMemo(() => {
    const base = showInactiveProducts
      ? products
      : products.filter((p) => !p.deleted);
    return base.filter((product) => {
      if (
        filterProductPanelFormElements.brand !== "" &&
        !product.brand?.includes(filterProductPanelFormElements.brand)
      )
        return false;
      if (
        filterProductPanelFormElements.vendor !== "" &&
        !product.vendor?.includes(filterProductPanelFormElements.vendor)
      )
        return false;
      if (
        filterProductPanelFormElements.expenseType !== "" &&
        !product.expenseType?.includes(
          filterProductPanelFormElements.expenseType
        )
      )
        return false;
      return true;
    });
  }, [products, showInactiveProducts, filterProductPanelFormElements]);

  const joinProductInputs = useMemo(
    () => [
      {
        type: InputTypes.SELECT,
        formKey: "stayedProduct",
        label: t("Stayed Product"),
        options: products
          .filter((product) => product._id !== form.removedProduct)
          .map((product) => ({ value: product._id, label: product.name })),
        placeholder: t("Stayed Product"),
        required: true,
      },
      {
        type: InputTypes.SELECT,
        formKey: "removedProduct",
        label: t("Removed Product"),
        options: products
          .filter((product) => product._id !== form.stayedProduct)
          .map((product) => ({ value: product._id, label: product.name })),
        placeholder: t("Removed Product"),
        required: true,
      },
    ],
    [t, products, form.removedProduct, form.stayedProduct]
  );

  const filterPanelInputs = useMemo(
    () => [
      {
        type: InputTypes.SELECT,
        formKey: "brand",
        label: t("Brand"),
        options: brands.map((brand) => ({
          value: brand._id,
          label: brand.name,
        })),
        placeholder: t("Brand"),
        required: true,
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
        required: true,
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
        required: true,
      },
    ],
    [brands, vendors, expenseTypes]
  );

  const inputs = useMemo(
    () => [
      {
        type: InputTypes.TEXT,
        formKey: "name",
        label: t("Name"),
        placeholder: t("Name"),
        required: true,
      },
      {
        type: InputTypes.SELECT,
        formKey: "brand",
        label: t("Brand"),
        options: brands.map((brand) => ({
          value: brand._id,
          label: brand.name,
        })),
        isMultiple: true,
        placeholder: t("Brand"),
        required: true,
      },
      {
        type: InputTypes.SELECT,
        formKey: "vendor",
        label: t("Vendor"),
        options: vendors.map((vendor) => ({
          value: vendor._id,
          label: vendor.name,
        })),
        isMultiple: true,
        placeholder: t("Vendor"),
        required: true,
      },
      {
        type: InputTypes.SELECT,
        formKey: "expenseType",
        label: t("Expense Type"),
        options: expenseTypes.map((expenseType) => ({
          value: expenseType._id,
          label: expenseType.name,
        })),
        isMultiple: true,
        placeholder: t("Expense Type"),
        required: true,
      },
      {
        type: InputTypes.SELECT,
        formKey: "matchedMenuItem",
        label: t("Matched Menu Item"),
        options: items.map((item) => ({ value: item._id, label: item.name })),
        placeholder: t("Matched Menu Item"),
        required: false,
      },
    ],
    [t, expenseTypes, vendors, brands, items]
  );

  const formKeys = useMemo(
    () => [
      { key: "name", type: FormKeyTypeEnum.STRING },
      { key: "expenseType", type: FormKeyTypeEnum.STRING },
      { key: "vendor", type: FormKeyTypeEnum.STRING },
      { key: "brand", type: FormKeyTypeEnum.STRING },
      { key: "matchedMenuItem", type: FormKeyTypeEnum.STRING },
    ],
    []
  );

  const menuItemInputs = useMemo(
    () => [
      {
        type: InputTypes.SELECT,
        formKey: "category",
        label: t("Category"),
        options: categories.map((category) => ({
          value: category._id,
          label: category.name,
        })),
        placeholder: t("Category"),
        required: true,
      },
      {
        type: InputTypes.TEXTAREA,
        formKey: "description",
        label: t("Description"),
        placeholder: t("Description"),
        required: false,
      },
      {
        type: InputTypes.NUMBER,
        formKey: "price",
        label: `${t("Price")}`,
        placeholder: `${t("Price")}`,
        required: true,
      },
      {
        type: InputTypes.NUMBER,
        formKey: "onlinePrice",
        label: `${t("Online Price")}`,
        placeholder: `${t("Online Price")}`,
        required: false,
      },
      {
        type: InputTypes.IMAGE,
        formKey: "imageUrl",
        label: "Image",
        required: false,
        folderName: "menu",
      },
    ],
    [t, categories]
  );

  const menuItemFormKeys = useMemo(
    () => [
      { key: "category", type: FormKeyTypeEnum.STRING },
      { key: "description", type: FormKeyTypeEnum.STRING },
      { key: "price", type: FormKeyTypeEnum.NUMBER },
      { key: "onlinePrice", type: FormKeyTypeEnum.NUMBER },
      { key: "imageUrl", type: FormKeyTypeEnum.STRING },
    ],
    []
  );

  const joinProductFormKeys = useMemo(
    () => [
      { key: "stayedProduct", type: FormKeyTypeEnum.STRING },
      { key: "removedProduct", type: FormKeyTypeEnum.STRING },
    ],
    []
  );

  const columns = useMemo(() => {
    return [
      { key: t("Name"), isSortable: true, correspondingKey: "name" },
      {
        key: t("Expense Type"),
        isSortable: true,
        correspondingKey: "expenseType",
      },
      { key: t("Brand"), isSortable: true, correspondingKey: "brand" },
      { key: t("Vendor"), isSortable: true, correspondingKey: "vendor" },
      { key: t("Unit Price"), isSortable: true, correspondingKey: "unitPrice" },
      { key: t("Matched Menu Item"), isSortable: true },
      { key: t("Actions"), isSortable: false },
    ];
  }, [t]);

  const rowKeys = useMemo(() => {
    return [
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
              className="text-blue-700 w-fit cursor-pointer hover:text-blue-500 transition-transform"
              onClick={() => {
                setCurrentPage(1);
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
      {
        key: "expenseType",
        className: "min-w-32",
        node: (row: AccountProduct) =>
          row.expenseType.map((expType: string, index) => {
            const foundExpenseType = expenseTypes.find(
              (e) => e._id === expType
            );
            return (
              <span
                key={foundExpenseType?.name ?? index + row._id + "expenseType"}
                className="text-sm px-2 py-1 mr-1 rounded-md w-fit text-white font-semibold"
                style={{ backgroundColor: foundExpenseType?.backgroundColor }}
              >
                {foundExpenseType?.name}
              </span>
            );
          }),
      },
      {
        key: "brand",
        className: "min-w-32",
        node: (row: AccountProduct) =>
          row.brand?.map((brand: string, index) => {
            const foundBrand = brands.find((br) => br._id === brand);
            if (!foundBrand)
              return <div key={row._id + index + "brand"}>-</div>;
            return (
              <span
                key={foundBrand.name + foundBrand._id + row._id}
                className="text-sm mr-1 w-fit"
              >
                {foundBrand?.name}
                {(row?.brand?.length ?? 0) - 1 !== index && ","}
              </span>
            );
          }),
      },
      {
        key: "vendor",
        className: "min-w-32",
        node: (row: AccountProduct) =>
          row.vendor?.map((vendor: string, index) => {
            const foundVendor = vendors.find((vn) => vn._id === vendor);
            if (!foundVendor)
              return <div key={row._id + index + "vendor"}>-</div>;
            return (
              <span
                key={foundVendor.name + foundVendor._id + row._id}
                className="text-sm mr-1 w-fit"
              >
                {foundVendor?.name}
                {(row?.vendor?.length ?? 0) - 1 !== index && ","}
              </span>
            );
          }),
      },
      {
        key: "unitPrice",
        node: (row: AccountProduct) => (
          <div className="min-w-32">
            <P1>{row.unitPrice} ₺</P1>
          </div>
        ),
      },
      {
        key: "matchedMenuItem",
        node: (row: AccountProduct) => (
          <div className="min-w-32">
            <P1>{getItem(row?.matchedMenuItem, items)?.name ?? "-"}</P1>
          </div>
        ),
      },
    ];
  }, [
    user,
    pages,
    setCurrentPage,
    setSearchQuery,
    setSortConfigKey,
    navigate,
    expenseTypes,
    brands,
    vendors,
    items,
  ]);

  const addButton = useMemo(
    () => ({
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
              matchedMenuItem: Number(inputForm?.matchedMenuItem),
            });
            setInputForm(initialInputForm);
          }}
          topClassName="flex flex-col gap-2"
        />
      ),
      isModalOpen: isAddModalOpen,
      setIsModal: setIsAddModalOpen,
      isPath: false,
      icon: null,
      isDisabled: productDisabledCondition?.actions?.some(
        (ac) =>
          ac.action === ActionEnum.ADD &&
          user?.role?._id &&
          !ac.permissionsRoles.includes(user.role._id)
      ),
      className: "bg-blue-500 hover:text-blue-500 hover:border-blue-500",
    }),
    [
      t,
      isAddModalOpen,
      inputs,
      formKeys,
      createAccountProduct,
      inputForm,
      productDisabledCondition,
      user,
    ]
  );

  const actions = useMemo(
    () => [
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
        className: "text-red-500 cursor-pointer text-2xl",
        isModal: true,
        isModalOpen: isCloseAllConfirmationDialogOpen,
        setIsModal: setIsCloseAllConfirmationDialogOpen,
        isPath: false,
        isDisabled: productDisabledCondition?.actions?.some(
          (ac) =>
            ac.action === ActionEnum.DELETE &&
            user?.role?._id &&
            !ac.permissionsRoles.includes(user.role._id)
        ),
      },
      {
        name: t(`Add Item`),
        isModal: true,
        setRow: setRowToAction,
        modal: rowToAction ? (
          <GenericAddEditPanel
            isOpen={isMenuItemAddModalOpen}
            close={() => setIsMenuItemAddModalOpen(false)}
            inputs={menuItemInputs}
            formKeys={menuItemFormKeys}
            submitItem={createItem as any}
            constantValues={{
              name: rowToAction.name,
              locations: [1, 2],
              matchedProduct: rowToAction._id,
            }}
            folderName="menu"
          />
        ) : null,
        isModalOpen: isMenuItemAddModalOpen,
        setIsModal: setIsMenuItemAddModalOpen,
        isPath: false,
        icon: <CiCirclePlus />,
        className: "text-2xl mt-1 cursor-pointer",
        isDisabled: productDisabledCondition?.actions?.some(
          (ac) =>
            ac.action === ActionEnum.ADD_TO_ELEMENT &&
            user?.role?._id &&
            !ac.permissionsRoles.includes(user.role._id)
        ),
      },
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
            inputs={inputs}
            formKeys={formKeys}
            generalClassName="overflow-visible"
            submitItem={updateAccountProduct as any}
            isEditMode
            topClassName="flex flex-col gap-2"
            setForm={setInputForm}
            constantValues={{
              name: rowToAction.name,
              expenseType: rowToAction.expenseType,
              brand: rowToAction.brand,
              vendor: rowToAction.vendor,
              matchedMenuItem: rowToAction.matchedMenuItem,
            }}
            handleUpdate={() => {
              updateAccountProduct({
                id: rowToAction?._id,
                updates: {
                  ...inputForm,
                  matchedMenuItem: Number(inputForm?.matchedMenuItem),
                },
              });
            }}
          />
        ) : null,
        isModalOpen: isEditModalOpen,
        setIsModal: setIsEditModalOpen,
        isPath: false,
        isDisabled: productDisabledCondition?.actions?.some(
          (ac) =>
            ac.action === ActionEnum.UPDATE &&
            user?.role?._id &&
            !ac.permissionsRoles.includes(user.role._id)
        ),
      },
      {
        name: t("Toggle Active"),
        isDisabled: !showInactiveProducts,
        isModal: false,
        isPath: false,
        icon: null,
        node: (row: any) => (
          <div className="mt-2 mr-auto">
            <CheckSwitch
              checked={!row?.deleted}
              onChange={() => {
                updateAccountProduct({
                  id: row._id,
                  updates: { deleted: !row?.deleted },
                });
              }}
            />
          </div>
        ),
      },
    ],
    [
      t,
      rowToAction,
      isCloseAllConfirmationDialogOpen,
      isMenuItemAddModalOpen,
      isEditModalOpen,
      inputs,
      formKeys,
      menuItemInputs,
      menuItemFormKeys,
      createItem,
      updateAccountProduct,
      inputForm,
      productDisabledCondition,
      user,
      showInactiveProducts,
      deleteAccountProduct,
    ]
  );

  const filters = useMemo(
    () => [
      {
        label: t("Show Filters"),
        isUpperSide: true,
        node: (
          <SwitchButton
            checked={showProductFilters}
            onChange={() => setShowProductFilters(!showProductFilters)}
          />
        ),
      },
      {
        label: t("Show Inactive Products"),
        isUpperSide: false,
        isDisabled: productDisabledCondition?.actions?.some(
          (ac) =>
            ac.action === ActionEnum.SHOW_INACTIVE_ELEMENTS &&
            user?.role?._id &&
            !ac.permissionsRoles.includes(user.role._id)
        ),
        node: (
          <SwitchButton
            checked={showInactiveProducts}
            onChange={setShowInactiveProducts}
          />
        ),
      },
      {
        isUpperSide: false,
        isDisabled: productDisabledCondition?.actions?.some(
          (ac) =>
            ac.action === ActionEnum.COMBINE_ELEMENTS &&
            user?.role?._id &&
            !ac.permissionsRoles.includes(user.role._id)
        ),
        node: (
          <ButtonFilter
            buttonName={t("Join Products")}
            onclick={() => setIsJoinProductModalOpen(true)}
          />
        ),
      },
    ],
    [
      t,
      showProductFilters,
      setShowProductFilters,
      showInactiveProducts,
      productDisabledCondition,
      user,
    ]
  );

  const filterPanel = useMemo(
    () => ({
      isFilterPanelActive: showProductFilters,
      inputs: filterPanelInputs,
      formElements: filterProductPanelFormElements,
      setFormElements: setFilterProductPanelFormElements,
      closeFilters: () => setShowProductFilters(false),
    }),
    [
      showProductFilters,
      filterPanelInputs,
      filterProductPanelFormElements,
      setFilterProductPanelFormElements,
      setShowProductFilters,
    ]
  );

  return (
    <div className="w-[95%] mx-auto ">
      <GenericTable
        rowKeys={rowKeys}
        actions={actions}
        columns={columns}
        rows={rows}
        title={t("Products")}
        addButton={addButton}
        filters={filters}
        filterPanel={filterPanel}
        isExcel={
          user &&
          !productDisabledCondition?.actions?.some(
            (ac) =>
              ac.action === ActionEnum.EXCEL &&
              user?.role?._id &&
              !ac.permissionsRoles.includes(user.role._id)
          )
        }
        isActionsActive={true}
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
          topClassName="flex flex-col gap-2"
          buttonName={t("Join")}
        />
      )}
    </div>
  );
};

export default Product;
