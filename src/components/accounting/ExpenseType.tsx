import { forEach } from "lodash";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { CiCirclePlus } from "react-icons/ci";
import { FiEdit } from "react-icons/fi";
import { HiOutlineTrash } from "react-icons/hi2";
import { useUserContext } from "../../context/User.context";
import {
  AccountExpenseType,
  ActionEnum,
  DisabledConditionEnum,
} from "../../types";
import {
  useAccountExpenseTypeMutations,
  useGetAccountExpenseTypes,
} from "../../utils/api/account/expenseType";
import {
  useAccountProductMutations,
  useGetAccountProducts,
} from "../../utils/api/account/product";
import { useGetAccountServices } from "../../utils/api/account/service";
import { useGetDisabledConditions } from "../../utils/api/panelControl/disabledCondition";
import { getItem } from "../../utils/getItem";
import { BackgroundColorInput, NameInput } from "../../utils/panelInputs";
import { ConfirmationDialog } from "../common/ConfirmationDialog";
import GenericAddEditPanel from "../panelComponents/FormElements/GenericAddEditPanel";
import GenericTable from "../panelComponents/Tables/GenericTable";
import { FormKeyTypeEnum, InputTypes } from "../panelComponents/shared/types";

const ExpenseType = () => {
  const { t } = useTranslation();
  const expenseTypes = useGetAccountExpenseTypes();
  const products = useGetAccountProducts();
  const services = useGetAccountServices();
  const { user } = useUserContext();
  const disabledConditions = useGetDisabledConditions();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [rowToAction, setRowToAction] = useState<AccountExpenseType>();
  const [
    isCloseAllConfirmationDialogOpen,
    setIsCloseAllConfirmationDialogOpen,
  ] = useState(false);
  const [productForm, setProductForm] = useState({ product: [] as string[] });

  const {
    createAccountExpenseType,
    deleteAccountExpenseType,
    updateAccountExpenseType,
  } = useAccountExpenseTypeMutations();
  const { updateAccountProduct } = useAccountProductMutations();

  const expenseTypeDisabledCondition = useMemo(() => {
    return getItem(
      DisabledConditionEnum.ACCOUNTING_EXPENSETYPE,
      disabledConditions
    );
  }, [disabledConditions]);

  const rows = useMemo(() => {
    return expenseTypes.map((i) => ({
      ...i,
      productCount:
        products?.filter((item) => item?.expenseType?.includes(i?._id))
          ?.length ?? 0,
      serviceCount:
        services?.filter((item) => item?.expenseType?.includes(i?._id))
          ?.length ?? 0,
    }));
  }, [expenseTypes, products, services]);

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
        node: (row: AccountExpenseType) => (
          <div
            className="px-2 py-1 rounded-md w-fit text-white"
            style={{ backgroundColor: row.backgroundColor }}
          >
            {row.name}
          </div>
        ),
      },
      { key: "productCount" },
      { key: "serviceCount" },
    ],
    []
  );

  const inputs = [NameInput(), BackgroundColorInput()];

  const formKeys = useMemo(
    () => [
      { key: "name", type: FormKeyTypeEnum.STRING },
      { key: "backgroundColor", type: FormKeyTypeEnum.COLOR },
    ],
    []
  );

  const addProductInputs = useMemo(
    () => [
      {
        type: InputTypes.SELECT,
        formKey: "product",
        label: t("Product"),
        options: products
          .filter(
            (product) =>
              !product.expenseType?.some((et) => et === rowToAction?._id)
          )
          .map((product) => ({ value: product?._id, label: product?.name })),
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
      name: t(`Add Expense Type`),
      isModal: true,
      modal: (
        <GenericAddEditPanel
          isOpen={isAddModalOpen}
          close={() => setIsAddModalOpen(false)}
          inputs={inputs}
          formKeys={formKeys}
          submitItem={createAccountExpenseType as any}
          topClassName="flex flex-col gap-2 "
        />
      ),
      isModalOpen: isAddModalOpen,
      setIsModal: setIsAddModalOpen,
      isPath: false,
      icon: null,
      className: "bg-blue-500 hover:text-blue-500 hover:border-blue-500 ",
      isDisabled: expenseTypeDisabledCondition?.actions?.some(
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
      createAccountExpenseType,
      expenseTypeDisabledCondition,
      user,
    ]
  );

  const actions = useMemo(
    () =>
      [
        {
          name: t("Delete"),
          icon: <HiOutlineTrash />,
          setRow: setRowToAction,
          modal: rowToAction ? (
            <ConfirmationDialog
              isOpen={isCloseAllConfirmationDialogOpen}
              close={() => setIsCloseAllConfirmationDialogOpen(false)}
              confirm={() => {
                deleteAccountExpenseType(rowToAction?._id);
                setIsCloseAllConfirmationDialogOpen(false);
              }}
              title={t("Delete Expense Type")}
              text={`${rowToAction.name} ${t("GeneralDeleteMessage")}`}
            />
          ) : null,
          className: "text-red-500 cursor-pointer text-2xl ml-auto ",
          isModal: true,
          isModalOpen: isCloseAllConfirmationDialogOpen,
          setIsModal: setIsCloseAllConfirmationDialogOpen,
          isPath: false,
          isDisabled: expenseTypeDisabledCondition?.actions?.some(
            (ac) =>
              ac.action === ActionEnum.DELETE &&
              user?.role?._id &&
              !ac?.permissionsRoles?.includes(user?.role?._id)
          ),
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
              submitItem={updateAccountExpenseType as any}
              isEditMode={true}
              topClassName="flex flex-col gap-2 "
              itemToEdit={{ id: rowToAction?._id, updates: rowToAction }}
            />
          ) : null,
          isModalOpen: isEditModalOpen,
          setIsModal: setIsEditModalOpen,
          isPath: false,
          isDisabled: expenseTypeDisabledCondition?.actions?.some(
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
              isEditMode={true}
              setForm={setProductForm}
              topClassName="flex flex-col gap-2"
              handleUpdate={() => {
                if (rowToAction) {
                  forEach(productForm.product, (product) => {
                    updateAccountProduct({
                      id: product,
                      updates: {
                        expenseType: [
                          ...(products?.find((p) => p?._id === product)
                            ?.expenseType || []),
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
          isDisabled: expenseTypeDisabledCondition?.actions?.some(
            (ac) =>
              ac.action === ActionEnum.ADD_TO_ELEMENT &&
              user?.role?._id &&
              !ac?.permissionsRoles?.includes(user?.role?._id)
          ),
        },
      ] as const,
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
      updateAccountExpenseType,
      deleteAccountExpenseType,
      updateAccountProduct,
      products,
      productForm.product,
      expenseTypeDisabledCondition,
      user,
    ]
  );

  return (
    <div className="w-[95%] mx-auto">
      <GenericTable
        rowKeys={rowKeys}
        actions={actions as any}
        columns={columns}
        rows={rows}
        title={t("Expense Types")}
        addButton={addButton as any}
        isActionsActive={true}
      />
    </div>
  );
};

export default ExpenseType;
