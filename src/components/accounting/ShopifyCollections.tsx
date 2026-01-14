import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { FiEdit } from "react-icons/fi";
import { HiOutlineTrash } from "react-icons/hi2";
import { useUserContext } from "../../context/User.context";
import {
  ActionEnum,
  DisabledConditionEnum,
  ProductCategories,
} from "../../types";
import {
  useGetShopifyCollections,
  useShopifyCollectionsMutations,
} from "../../utils/api/account/productCategories";
import { useGetDisabledConditions } from "../../utils/api/panelControl/disabledCondition";
import { getItem } from "../../utils/getItem";
import { ConfirmationDialog } from "../common/ConfirmationDialog";
import GenericAddEditPanel from "../panelComponents/FormElements/GenericAddEditPanel";
import GenericTable from "../panelComponents/Tables/GenericTable";
import { FormKeyTypeEnum, InputTypes } from "../panelComponents/shared/types";

const ShopifyCollectionsPage = () => {
  const { t } = useTranslation();
  const { user } = useUserContext();
  const shopifyCollections = useGetShopifyCollections();
  const disabledConditions = useGetDisabledConditions();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [
    isCloseAllConfirmationDialogOpen,
    setIsCloseAllConfirmationDialogOpen,
  ] = useState(false);
  const [rowToAction, setRowToAction] = useState<ProductCategories>();

  const {
    createShopifyCollections,
    updateShopifyCollections,
    deleteShopifyCollections,
  } = useShopifyCollectionsMutations();

  const shopifyCollectionsPageDisabledCondition = useMemo(() => {
    return getItem(
      DisabledConditionEnum.ACCOUNTING_PRODUCTCATEGORIES,
      disabledConditions
    );
  }, [disabledConditions]);

  const rows = useMemo(() => shopifyCollections, [shopifyCollections]);

  const columns = useMemo(() => {
    return [
      { key: t("Name"), isSortable: true },
      { key: "Shopify ID", isSortable: false },
      { key: t("Actions"), isSortable: false },
    ];
  }, [t]);

  const rowKeys = useMemo(
    () => [
      { key: "name", className: "min-w-32 pr-1" },
      { key: "shopifyId", className: "min-w-32 pr-1" },
    ],
    []
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
        type: InputTypes.TEXT,
        formKey: "shopifyId",
        label: "Shopify ID",
        placeholder: "Shopify ID",
        required: false,
      },
    ],
    []
  );

  const formKeys = useMemo(
    () => [
      { key: "name", type: FormKeyTypeEnum.STRING },
      { key: "shopifyId", type: FormKeyTypeEnum.STRING },
    ],
    []
  );

  const addButton = useMemo(
    () => ({
      name: t(`Add Shopify Collection`),
      isModal: true,
      modal: (
        <GenericAddEditPanel
          isOpen={isAddModalOpen}
          close={() => setIsAddModalOpen(false)}
          inputs={inputs}
          formKeys={formKeys}
          submitItem={createShopifyCollections as any}
          topClassName="flex flex-col gap-2"
        />
      ),
      isModalOpen: isAddModalOpen,
      setIsModal: setIsAddModalOpen,
      isPath: false,
      icon: null,
      className: "bg-blue-500 hover:text-blue-500 hover:border-blue-500",
      isDisabled: shopifyCollectionsPageDisabledCondition?.actions?.some(
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
      createShopifyCollections,
      shopifyCollectionsPageDisabledCondition,
      user,
    ]
  );

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
            inputs={inputs}
            formKeys={formKeys}
            submitItem={updateShopifyCollections as any}
            isEditMode
            topClassName="flex flex-col gap-2"
            itemToEdit={{ id: rowToAction._id, updates: rowToAction }}
          />
        ) : null,
        isModalOpen: isEditModalOpen,
        setIsModal: setIsEditModalOpen,
        isPath: false,
        isDisabled: shopifyCollectionsPageDisabledCondition?.actions?.some(
          (ac) =>
            ac.action === ActionEnum.UPDATE &&
            user?.role?._id &&
            !ac?.permissionsRoles?.includes(user?.role?._id)
        ),
      },
      {
        name: t("Delete"),
        icon: <HiOutlineTrash />,
        setRow: setRowToAction,
        modal: rowToAction ? (
          <ConfirmationDialog
            isOpen={isCloseAllConfirmationDialogOpen}
            close={() => setIsCloseAllConfirmationDialogOpen(false)}
            confirm={() => {
              deleteShopifyCollections(rowToAction?._id);
              setIsCloseAllConfirmationDialogOpen(false);
            }}
            title={t("Delete Shopify Collection")}
            text={`${rowToAction.name} ${t("GeneralDeleteMessage")}`}
          />
        ) : null,
        className: "text-red-500 cursor-pointer text-2xl",
        isModal: true,
        isModalOpen: isCloseAllConfirmationDialogOpen,
        setIsModal: setIsCloseAllConfirmationDialogOpen,
        isPath: false,
        isDisabled: shopifyCollectionsPageDisabledCondition?.actions?.some(
          (ac) =>
            ac.action === ActionEnum.DELETE &&
            user?.role?._id &&
            !ac?.permissionsRoles?.includes(user?.role?._id)
        ),
      },
    ],
    [
      t,
      rowToAction,
      isEditModalOpen,
      isCloseAllConfirmationDialogOpen,
      inputs,
      formKeys,
      updateShopifyCollections,
      deleteShopifyCollections,
      shopifyCollectionsPageDisabledCondition,
      user,
    ]
  );

  return (
    <div className="w-[95%] mx-auto ">
      <GenericTable
        rowKeys={rowKeys}
        actions={actions}
        columns={columns}
        rows={rows}
        title={t("Shopify Collections")}
        addButton={addButton}
        isActionsActive={true}
      />
    </div>
  );
};

export default ShopifyCollectionsPage;
