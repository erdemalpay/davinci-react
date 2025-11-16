import { forEach } from "lodash";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { CiCirclePlus } from "react-icons/ci";
import { FiEdit } from "react-icons/fi";
import { HiOutlineTrash } from "react-icons/hi2";
import { useNavigate } from "react-router-dom";
import { useGeneralContext } from "../../context/General.context";
import { useUserContext } from "../../context/User.context";
import {
  AccountVendor,
  ActionEnum,
  DisabledConditionEnum,
} from "../../types";
import {
  useAccountProductMutations,
  useGetAccountProducts,
} from "../../utils/api/account/product";
import { useGetAccountServices } from "../../utils/api/account/service";
import {
  useAccountVendorMutations,
  useGetAccountVendors,
} from "../../utils/api/account/vendor";
import { useGetDisabledConditions } from "../../utils/api/panelControl/disabledCondition";
import { useGetPanelControlPages } from "../../utils/api/panelControl/page";
import { getItem } from "../../utils/getItem";
import { NameInput } from "../../utils/panelInputs";
import { ConfirmationDialog } from "../common/ConfirmationDialog";
import GenericAddEditPanel from "../panelComponents/FormElements/GenericAddEditPanel";
import GenericTable from "../panelComponents/Tables/GenericTable";
import { FormKeyTypeEnum, InputTypes } from "../panelComponents/shared/types";

const Vendor = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useUserContext();
  const vendors = useGetAccountVendors();
  const pages = useGetPanelControlPages();
  const services = useGetAccountServices();
  const products = useGetAccountProducts();
  const { updateAccountProduct } = useAccountProductMutations();
  const { setCurrentPage, setSearchQuery, setSortConfigKey } =
    useGeneralContext();
  const disabledConditions = useGetDisabledConditions();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [rowToAction, setRowToAction] = useState<AccountVendor>();
  const [
    isCloseAllConfirmationDialogOpen,
    setIsCloseAllConfirmationDialogOpen,
  ] = useState(false);
  const { createAccountVendor, deleteAccountVendor, updateAccountVendor } =
    useAccountVendorMutations();
  const [productForm, setProductForm] = useState({ product: [] as string[] });

  const vendorDisabledCondition = useMemo(() => {
    return getItem(DisabledConditionEnum.ACCOUNTING_VENDOR, disabledConditions);
  }, [disabledConditions]);

  const rows = useMemo(() => {
    return vendors?.map((vendor) => ({
      ...vendor,
      productCount:
        products?.filter((item) => item?.vendor?.includes(vendor?._id))
          ?.length ?? 0,
      serviceCount:
        services?.filter((item) => item?.vendor?.includes(vendor?._id))
          ?.length ?? 0,
    }));
  }, [vendors, products, services]);

  const columns = useMemo(() => {
    return [
      { key: t("Name"), isSortable: true },
      { key: t("Product Count"), isSortable: true },
      { key: t("Service Count"), isSortable: true },
      { key: t("Actions"), isSortable: false },
    ];
  }, [t]);

  const rowKeys = useMemo(
    () => [
      {
        key: "name",
        className: "min-w-32 pr-1",
        node: (row: AccountVendor) =>
          user &&
          pages &&
          pages
            ?.find((page) => page._id === "vendor")
            ?.permissionRoles?.includes(user.role._id) ? (
            <p
              className="text-blue-700 w-fit cursor-pointer hover:text-blue-500 transition-transform"
              onClick={() => {
                setCurrentPage(1);
                setSearchQuery("");
                setSortConfigKey(null);
                navigate(`/vendor/${row._id}`);
              }}
            >
              {row.name}
            </p>
          ) : (
            <p>{row.name}</p>
          ),
      },
      { key: "productCount" },
      { key: "serviceCount" },
    ],
    [user, pages, setCurrentPage, setSearchQuery, setSortConfigKey, navigate]
  );

  const inputs = [NameInput()];
  const formKeys = [{ key: "name", type: FormKeyTypeEnum.STRING }];
  const addProductInputs = useMemo(
    () => [
      {
        type: InputTypes.SELECT,
        formKey: "product",
        label: t("Product"),
        options: products
          .filter(
            (product) =>
              !product.vendor?.some((item) => item === rowToAction?._id)
          )
          .map((product) => ({
            value: product._id,
            label: product.name,
          })),
        isMultiple: true,
        placeholder: t("Product"),
        required: true,
      },
    ],
    [t, products, rowToAction?._id]
  );

  const addProductFormKeys = useMemo(
    () => [{ key: "product", type: FormKeyTypeEnum.STRING }],
    []
  );

  const addButton = useMemo(
    () => ({
      name: t(`Add Vendor`),
      isModal: true,
      modal: (
        <GenericAddEditPanel
          isOpen={isAddModalOpen}
          close={() => setIsAddModalOpen(false)}
          inputs={inputs}
          formKeys={formKeys}
          submitItem={createAccountVendor as any}
          topClassName="flex flex-col gap-2"
        />
      ),
      isModalOpen: isAddModalOpen,
      setIsModal: setIsAddModalOpen,
      isPath: false,
      isDisabled: vendorDisabledCondition?.actions?.some(
        (ac) =>
          ac.action === ActionEnum.ADD &&
          user?.role?._id &&
          !ac?.permissionsRoles?.includes(user?.role?._id)
      ),
      icon: null,
      className: "bg-blue-500 hover:text-blue-500 hover:border-blue-500",
    }),
    [
      t,
      isAddModalOpen,
      inputs,
      formKeys,
      createAccountVendor,
      vendorDisabledCondition,
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
              deleteAccountVendor(rowToAction?._id);
              setIsCloseAllConfirmationDialogOpen(false);
            }}
            title={t("Delete Vendor")}
            text={`${rowToAction.name} ${t("GeneralDeleteMessage")}`}
          />
        ) : null,
        className: "text-red-500 cursor-pointer text-2xl ml-auto",
        isModal: true,
        isModalOpen: isCloseAllConfirmationDialogOpen,
        setIsModal: setIsCloseAllConfirmationDialogOpen,
        isPath: false,
        isDisabled: vendorDisabledCondition?.actions?.some(
          (ac) =>
            ac.action === ActionEnum.DELETE &&
            user?.role?._id &&
            !ac?.permissionsRoles?.includes(user?.role?._id)
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
            submitItem={updateAccountVendor as any}
            isEditMode
            topClassName="flex flex-col gap-2"
            itemToEdit={{ id: rowToAction._id, updates: rowToAction }}
          />
        ) : null,
        isModalOpen: isEditModalOpen,
        setIsModal: setIsEditModalOpen,
        isPath: false,
        isDisabled: vendorDisabledCondition?.actions?.some(
          (ac) =>
            ac.action === ActionEnum.UPDATE &&
            user?.role?._id &&
            !ac?.permissionsRoles?.includes(user?.role?._id)
        ),
      },
      {
        name: t("Add Into Product"),
        icon: <CiCirclePlus />,
        className: "text-2xl mt-1 mr-auto cursor-pointer",
        isModal: true,
        setRow: setRowToAction,
        modal: (
          <GenericAddEditPanel
            isOpen={isAddProductModalOpen}
            close={() => setIsAddProductModalOpen(false)}
            inputs={addProductInputs}
            formKeys={addProductFormKeys}
            submitItem={updateAccountProduct as any}
            isEditMode
            setForm={setProductForm}
            topClassName="flex flex-col gap-2"
            handleUpdate={() => {
              if (rowToAction) {
                forEach(productForm.product, (product) => {
                  updateAccountProduct({
                    id: product,
                    updates: {
                      vendor: [
                        ...(products?.find((p) => p._id === product)?.vendor ||
                          []),
                        rowToAction._id,
                      ],
                    },
                  });
                });
              }
            }}
          />
        ),
        isModalOpen: isAddProductModalOpen,
        setIsModal: setIsAddProductModalOpen,
        isPath: false,
        isDisabled: vendorDisabledCondition?.actions?.some(
          (ac) =>
            ac.action === ActionEnum.ADD_TO_ELEMENT &&
            user?.role?._id &&
            !ac?.permissionsRoles?.includes(user?.role?._id)
        ),
      },
    ],
    [
      t,
      rowToAction,
      isCloseAllConfirmationDialogOpen,
      isEditModalOpen,
      isAddProductModalOpen,
      inputs,
      formKeys,
      addProductInputs,
      addProductFormKeys,
      deleteAccountVendor,
      updateAccountVendor,
      updateAccountProduct,
      products,
      productForm.product,
      vendorDisabledCondition,
      user,
    ]
  );

  return (
    <div className="w-[95%] mx-auto">
      <GenericTable
        rowKeys={rowKeys}
        actions={actions}
        columns={columns}
        rows={rows}
        title={t("Vendors")}
        addButton={addButton}
        isActionsActive={true}
      />
    </div>
  );
};

export default Vendor;
