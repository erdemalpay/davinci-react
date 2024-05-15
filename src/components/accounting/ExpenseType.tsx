import { forEach } from "lodash";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { CiCirclePlus } from "react-icons/ci";
import { FiEdit } from "react-icons/fi";
import { HiOutlineTrash } from "react-icons/hi2";
import { TbHexagonPlus } from "react-icons/tb";
import { AccountExpenseType, AccountUnit } from "../../types";
import {
  useAccountExpenseTypeMutations,
  useGetAccountExpenseTypes,
} from "../../utils/api/account/expenseType";
import {
  useAccountFixtureMutations,
  useGetAccountFixtures,
} from "../../utils/api/account/fixture";
import {
  useAccountProductMutations,
  useGetAccountProducts,
} from "../../utils/api/account/product";
import { BackgroundColorInput, NameInput } from "../../utils/panelInputs";
import { ConfirmationDialog } from "../common/ConfirmationDialog";
import GenericAddEditPanel from "../panelComponents/FormElements/GenericAddEditPanel";
import GenericTable from "../panelComponents/Tables/GenericTable";
import { FormKeyTypeEnum, InputTypes } from "../panelComponents/shared/types";

const ExpenseType = () => {
  const { t } = useTranslation();
  const expenseTypes = useGetAccountExpenseTypes();
  const [tableKey, setTableKey] = useState(0);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const products = useGetAccountProducts();
  const fixtures = useGetAccountFixtures();
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [isAddFixureModalOpen, setIsAddFixtureModalOpen] = useState(false);
  const { updateAccountProduct } = useAccountProductMutations();
  const { updateAccountFixture } = useAccountFixtureMutations();
  const [rowToAction, setRowToAction] = useState<AccountExpenseType>();
  const [
    isCloseAllConfirmationDialogOpen,
    setIsCloseAllConfirmationDialogOpen,
  ] = useState(false);
  const {
    createAccountExpenseType,
    deleteAccountExpenseType,
    updateAccountExpenseType,
  } = useAccountExpenseTypeMutations();
  const [productForm, setProductForm] = useState({
    product: [],
  });
  const [fixtureForm, setFixtureForm] = useState({
    fixture: [],
  });
  const columns = [
    { key: t("Name"), isSortable: true },
    { key: t("Actions"), isSortable: false },
  ];
  const rowKeys = [
    {
      key: "name",

      node: (row: AccountExpenseType) => (
        <div
          className={` px-2 py-1 rounded-md  w-fit text-white`}
          style={{ backgroundColor: row.backgroundColor }}
        >
          {row.name}
        </div>
      ),
    },
  ];
  const inputs = [NameInput(), BackgroundColorInput()];
  const formKeys = [
    { key: "name", type: FormKeyTypeEnum.STRING },
    { key: "backgroundColor", type: FormKeyTypeEnum.COLOR },
  ];
  const addProductInputs = [
    {
      type: InputTypes.SELECT,
      formKey: "product",
      label: t("Product"),
      options: products
        .filter(
          (product) =>
            !product.expenseType?.some((item) => item === rowToAction?._id)
        )
        .map((product) => {
          return {
            value: product._id,
            label: product.name + `(${(product.unit as AccountUnit).name})`,
          };
        }),
      isMultiple: true,
      placeholder: t("Product"),
      required: true,
    },
  ];
  const addProductFormKeys = [{ key: "product", type: FormKeyTypeEnum.STRING }];
  const addFixtureInputs = [
    {
      type: InputTypes.SELECT,
      formKey: "fixture",
      label: t("Fixture"),
      options: fixtures
        .filter(
          (fixture) =>
            !fixture.expenseType?.some((item) => item === rowToAction?._id)
        )
        .map((fixture) => {
          return {
            value: fixture._id,
            label: fixture.name,
          };
        }),
      isMultiple: true,
      placeholder: t("Fixture"),
      required: true,
    },
  ];
  const addFixtureFormKeys = [{ key: "fixture", type: FormKeyTypeEnum.STRING }];
  const addButton = {
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
          itemToEdit={{ id: rowToAction._id, updates: rowToAction }}
        />
      ) : null,

      isModalOpen: isEditModalOpen,
      setIsModal: setIsEditModalOpen,
      isPath: false,
    },
    {
      name: t("Add Into Fixture"),
      icon: <TbHexagonPlus />,
      className: "text-2xl mt-1 text-gray-600  cursor-pointer",
      isModal: true,
      setRow: setRowToAction,
      modal: (
        <GenericAddEditPanel
          isOpen={isAddFixureModalOpen}
          close={() => setIsAddFixtureModalOpen(false)}
          inputs={addFixtureInputs}
          formKeys={addFixtureFormKeys}
          submitItem={updateAccountFixture as any}
          isEditMode={true}
          setForm={setFixtureForm}
          topClassName="flex flex-col gap-2  "
          handleUpdate={() => {
            if (rowToAction) {
              forEach(fixtureForm.fixture, (fixture) => {
                updateAccountFixture({
                  id: fixture,
                  updates: {
                    expenseType: [
                      ...(fixtures?.find((p) => p._id === fixture)
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
      isModalOpen: isAddFixureModalOpen,
      setIsModal: setIsAddFixtureModalOpen,
      isPath: false,
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
          setForm={setProductForm}
          topClassName="flex flex-col gap-2  "
          handleUpdate={() => {
            if (rowToAction) {
              forEach(productForm.product, (product) => {
                updateAccountProduct({
                  id: product,
                  updates: {
                    expenseType: [
                      ...(products?.find((p) => p._id === product)
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
    },
  ];
  useEffect(() => setTableKey((prev) => prev + 1), [expenseTypes]);

  return (
    <>
      <div className="w-[95%] mx-auto ">
        <GenericTable
          key={tableKey}
          rowKeys={rowKeys}
          actions={actions}
          columns={columns}
          rows={expenseTypes}
          title={t("Expense Types")}
          addButton={addButton}
        />
      </div>
    </>
  );
};

export default ExpenseType;
