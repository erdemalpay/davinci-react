import { forEach } from "lodash";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { CiCirclePlus } from "react-icons/ci";
import { FiEdit } from "react-icons/fi";
import { HiOutlineTrash } from "react-icons/hi2";
import { useUserContext } from "../../context/User.context";
import { AccountPackageType, AccountUnit, RoleEnum } from "../../types";
import {
  useAccountPackageTypeMutations,
  useGetAccountPackageTypes,
} from "../../utils/api/account/packageType";
import {
  useAccountProductMutations,
  useGetAccountProducts,
} from "../../utils/api/account/product";
import { useGetAccountUnits } from "../../utils/api/account/unit";
import { getItem } from "../../utils/getItem";
import { NameInput, QuantityInput, UnitInput } from "../../utils/panelInputs";
import { ConfirmationDialog } from "../common/ConfirmationDialog";
import GenericAddEditPanel from "../panelComponents/FormElements/GenericAddEditPanel";
import GenericTable from "../panelComponents/Tables/GenericTable";
import { FormKeyTypeEnum, InputTypes } from "../panelComponents/shared/types";

const PackageType = () => {
  const { t } = useTranslation();
  const packageTypes = useGetAccountPackageTypes();
  const { user } = useUserContext();
  const [tableKey, setTableKey] = useState(0);
  const units = useGetAccountUnits();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const products = useGetAccountProducts();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [form, setForm] = useState({
    product: [],
  });
  const { updateAccountProduct } = useAccountProductMutations();
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [rowToAction, setRowToAction] = useState<AccountPackageType>();
  const [
    isCloseAllConfirmationDialogOpen,
    setIsCloseAllConfirmationDialogOpen,
  ] = useState(false);
  const {
    createAccountPackageType,
    deleteAccountPackageType,
    updateAccountPackageType,
  } = useAccountPackageTypeMutations();
  const allRows = packageTypes.map((packageType) => {
    return {
      ...packageType,
      unt: (packageType?.unit as AccountUnit)?.name,
      productCount:
        products?.filter((item) =>
          item?.packages?.some((p) => p.package === packageType._id)
        )?.length ?? 0,
    };
  });
  const [rows, setRows] = useState(allRows);
  const columns = [
    { key: t("Name"), isSortable: true },
    { key: t("Unit"), isSortable: true },
    { key: t("Quantity"), isSortable: true },
    { key: t("Product Count"), isSortable: true },
  ];
  if (
    user &&
    [RoleEnum.MANAGER, RoleEnum.CATERINGMANAGER, RoleEnum.GAMEMANAGER].includes(
      user?.role?._id
    )
  ) {
    columns.push({ key: t("Actions"), isSortable: false });
  }
  const rowKeys = [
    {
      key: "name",
      className: "min-w-32 pr-1",
    },
    {
      key: "unt",
      className: "min-w-32 pr-1",
    },
    {
      key: "quantity",
      className: "min-w-32 pr-1",
    },
    { key: "productCount" },
  ];
  const inputs = [
    NameInput(),
    UnitInput({ units: units, required: true }),
    QuantityInput(),
  ];
  const formKeys = [
    { key: "name", type: FormKeyTypeEnum.STRING },
    { key: "unit", type: FormKeyTypeEnum.STRING },
    { key: "quantity", type: FormKeyTypeEnum.NUMBER },
  ];

  const addProductInputs = [
    {
      type: InputTypes.SELECT,
      formKey: "product",
      label: t("Product"),
      options: products
        .filter(
          (product) =>
            !product.packages?.some(
              (item) => item.package === rowToAction?._id
            ) && product?.unit === (rowToAction?.unit as AccountUnit)?._id
        )
        .map((product) => {
          const productUnit = getItem(product?.unit, units);
          return {
            value: product._id,
            label: product.name + `(${productUnit?.name})`,
          };
        }),
      isMultiple: true,
      placeholder: t("Product"),
      required: true,
    },
  ];
  const addProductFormKeys = [{ key: "product", type: FormKeyTypeEnum.STRING }];
  const addButton = {
    name: t(`Add Package Type`),
    isModal: true,
    modal: (
      <GenericAddEditPanel
        isOpen={isAddModalOpen}
        close={() => setIsAddModalOpen(false)}
        inputs={inputs}
        formKeys={formKeys}
        submitItem={createAccountPackageType as any}
        topClassName="flex flex-col gap-2 "
      />
    ),
    isModalOpen: isAddModalOpen,
    setIsModal: setIsAddModalOpen,
    isPath: false,
    isDisabled: user
      ? ![
          RoleEnum.MANAGER,
          RoleEnum.CATERINGMANAGER,
          RoleEnum.GAMEMANAGER,
        ].includes(user?.role?._id)
      : true,
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
            deleteAccountPackageType(rowToAction?._id);
            setIsCloseAllConfirmationDialogOpen(false);
          }}
          title={t("Delete Package Type")}
          text={`${rowToAction.name} ${t("GeneralDeleteMessage")}`}
        />
      ) : null,
      className: "text-red-500 cursor-pointer text-2xl ml-auto ",
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
          submitItem={updateAccountPackageType as any}
          isEditMode={true}
          topClassName="flex flex-col gap-2 "
          itemToEdit={{
            id: rowToAction._id,
            updates: {
              ...rowToAction,
              unit: (rowToAction.unit as AccountUnit)._id,
            },
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
    {
      name: t("Add Into Product"),
      icon: <CiCirclePlus />,
      className: "text-2xl mt-1  mr-auto cursor-pointer",
      isModal: true,
      setRow: setRowToAction,
      modal: (
        <GenericAddEditPanel
          isOpen={isAddProductModalOpen}
          close={() => setIsAddProductModalOpen(false)}
          inputs={addProductInputs}
          formKeys={addProductFormKeys}
          submitItem={updateAccountProduct as any}
          isEditMode={true}
          setForm={setForm}
          topClassName="flex flex-col gap-2  "
          handleUpdate={() => {
            if (rowToAction) {
              forEach(form.product, (product) => {
                updateAccountProduct({
                  id: product,
                  updates: {
                    packages: [
                      ...(products?.find((p) => p._id === product)?.packages ||
                        []),
                      {
                        package: rowToAction._id,
                        packageUnitPrice: 0,
                      },
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
    setRows(allRows);
    setTableKey((prev) => prev + 1);
  }, [packageTypes, products]);

  return (
    <>
      <div className="w-[95%] mx-auto ">
        <GenericTable
          key={tableKey}
          rowKeys={rowKeys}
          actions={actions}
          columns={columns}
          rows={rows}
          title={t("Package Types")}
          addButton={addButton}
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
      </div>
    </>
  );
};

export default PackageType;
