import { Switch } from "@headlessui/react";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import { FiEdit } from "react-icons/fi";
import { HiOutlineTrash } from "react-icons/hi2";
import {
  AccountExpenseType,
  AccountInvoice,
  AccountProduct,
} from "../../types";
import { useGetAccountExpenseTypes } from "../../utils/api/account/expenseType";
import {
  useAccountInvoiceMutations,
  useGetAccountInvoices,
} from "../../utils/api/account/invoice";
import { useGetAccountProducts } from "../../utils/api/account/product";
import { useGetAccountUnits } from "../../utils/api/account/unit";
import { formatAsLocalDate } from "../../utils/format";
import { ConfirmationDialog } from "../common/ConfirmationDialog";
import GenericAddEditPanel from "../panelComponents/FormElements/GenericAddEditPanel";
import GenericTable from "../panelComponents/Tables/GenericTable";
import { FormKeyTypeEnum, InputTypes } from "../panelComponents/shared/types";

type Props = {};

const Invoice = (props: Props) => {
  const invoices = useGetAccountInvoices();
  const units = useGetAccountUnits();
  const expenseTypes = useGetAccountExpenseTypes();
  const products = useGetAccountProducts();
  const [tableKey, setTableKey] = useState(0);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [rowToAction, setRowToAction] = useState<AccountInvoice>();
  const [isEnableEdit, setIsEnableEdit] = useState(false);
  const [form, setForm] = useState<Partial<AccountInvoice>>({
    date: "",
    product: "",
    expenseType: "",
    quantity: 0,
    totalExpense: 0,
    brand: "",
    company: "",
    documentNo: "",
  });
  const [
    isCloseAllConfirmationDialogOpen,
    setIsCloseAllConfirmationDialogOpen,
  ] = useState(false);
  const { createAccountInvoice, deleteAccountInvoice, updateAccountInvoice } =
    useAccountInvoiceMutations();
  const [rows, setRows] = useState(
    invoices.map((row) => {
      return {
        ...row,
        product: (row.product as AccountProduct)?.name,
        expenseType: (row.expenseType as AccountExpenseType).name,
        unitPrice: parseFloat((row.totalExpense / row.quantity).toFixed(1)),
        unit: units.find(
          (unit) =>
            unit._id === ((row.product as AccountProduct).unit as number)
        )?.name,
        expType: row.expenseType as AccountExpenseType,
      };
    })
  );
  const inputs = [
    {
      type: InputTypes.DATE,
      formKey: "date",
      label: "Date",
      placeholder: "Date",
      required: true,
    },
    {
      type: InputTypes.SELECT,
      formKey: "product",
      label: "Product",
      options: products.map((product) => {
        return {
          value: product._id,
          label: product.name,
        };
      }),
      placeholder: "Product",
      invalidateKeys: [{ key: "expenseType", defaultValue: 0 }],
      required: true,
    },
    {
      type: InputTypes.SELECT,
      formKey: "expenseType",
      label: "Expense Type",
      options: expenseTypes
        .filter((exp) =>
          products
            .find((prod) => prod._id === form?.product)
            ?.expenseType.includes(exp._id)
        )
        ?.map((expenseType) => {
          return {
            value: expenseType._id,
            label: expenseType.name,
          };
        }),
      placeholder: "Expense Type",
      required: true,
    },
    {
      type: InputTypes.NUMBER,
      formKey: "quantity",
      label: "Quantity",
      placeholder: "Quantity",
      required: true,
    },
    {
      type: InputTypes.NUMBER,
      formKey: "totalExpense",
      label: "Total Expense",
      placeholder: "Total Expense",
      required: true,
    },
    {
      type: InputTypes.TEXT,
      formKey: "brand",
      label: "Brand",
      placeholder: "Brand",
      required: true,
    },
    {
      type: InputTypes.TEXT,
      formKey: "company",
      label: "Company",
      placeholder: "Company",
      required: true,
    },
    {
      type: InputTypes.TEXT,
      formKey: "documentNo",
      label: "Document No",
      placeholder: "Document No",
      required: true,
    },
  ];
  const formKeys = [
    { key: "date", type: FormKeyTypeEnum.DATE },
    {
      key: "product",
      type: FormKeyTypeEnum.STRING,
    },
    { key: "expenseType", type: FormKeyTypeEnum.STRING },
    { key: "brand", type: FormKeyTypeEnum.STRING },
    { key: "company", type: FormKeyTypeEnum.STRING },
    { key: "documentNo", type: FormKeyTypeEnum.STRING },
    { key: "quantity", type: FormKeyTypeEnum.NUMBER },
    { key: "totalExpense", type: FormKeyTypeEnum.NUMBER },
  ];
  const columns = [
    { key: "ID", isSortable: true },
    { key: "Product", isSortable: true },
    { key: "Expense Type", isSortable: true },
    { key: "Brand", isSortable: true },
    { key: "Company", isSortable: true },
    { key: "Document No", isSortable: true },
    { key: "Date", isSortable: true },
    { key: "Quantity", isSortable: true },
    { key: "Unit", isSortable: true },
    { key: "Unit Price", isSortable: true },
    { key: "Total Expense", isSortable: true },
  ];
  const rowKeys = [
    {
      key: "_id",
    },
    {
      key: "product",
      className: "min-w-32",
    },

    {
      key: "expenseType",
      node: (row: any) => {
        return (
          <p
            className="w-fit rounded-md px-2 py-1 text-white"
            style={{
              backgroundColor: row.expType.backgroundColor,
            }}
          >
            {(row.expType as AccountExpenseType).name}
          </p>
        );
      },
    },
    { key: "brand" },
    { key: "company" },
    { key: "documentNo" },

    {
      key: "date",
      className: "min-w-32",
      node: (row: AccountInvoice) => {
        return formatAsLocalDate(row.date);
      },
    },
    {
      key: "quantity",
    },
    {
      key: "unit",
    },
    {
      key: "unitPrice",
    },
    {
      key: "totalExpense",
    },
  ];
  const addButton = {
    name: `Add Invoice`,
    isModal: true,

    modal: (
      <GenericAddEditPanel
        isOpen={isAddModalOpen}
        close={() => setIsAddModalOpen(false)}
        inputs={inputs}
        formKeys={formKeys}
        submitItem={createAccountInvoice as any}
        topClassName="flex flex-col gap-2 "
        setForm={setForm}
        constantValues={{
          date: format(new Date(), "yyyy-MM-dd"),
        }}
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
      name: "Delete",
      isDisabled: !isEnableEdit,
      icon: <HiOutlineTrash />,
      setRow: setRowToAction,
      modal: rowToAction ? (
        <ConfirmationDialog
          isOpen={isCloseAllConfirmationDialogOpen}
          close={() => setIsCloseAllConfirmationDialogOpen(false)}
          confirm={() => {
            deleteAccountInvoice(rowToAction?._id);
            setIsCloseAllConfirmationDialogOpen(false);
          }}
          title="Delete Invoice"
          text={`${rowToAction.product} invoice will be deleted. Are you sure you want to continue?`}
        />
      ) : null,
      className: "text-red-500 cursor-pointer text-2xl  ",
      isModal: true,
      isModalOpen: isCloseAllConfirmationDialogOpen,
      setIsModal: setIsCloseAllConfirmationDialogOpen,
      isPath: false,
    },
    {
      name: "Edit",
      isDisabled: !isEnableEdit,
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
          setForm={setForm}
          submitItem={updateAccountInvoice as any}
          isEditMode={true}
          topClassName="flex flex-col gap-2 "
          itemToEdit={{
            id: rowToAction._id,
            updates: {
              date: rowToAction.date,
              product: (
                invoices.find((invoice) => invoice._id === rowToAction._id)
                  ?.product as AccountProduct
              )?._id,
              expenseType: (
                invoices.find((invoice) => invoice._id === rowToAction._id)
                  ?.expenseType as AccountExpenseType
              )?._id,
              quantity: rowToAction.quantity,
              totalExpense: rowToAction.totalExpense,
              brand: rowToAction.brand,
              company: rowToAction.company,
              documentNo: rowToAction.documentNo,
            },
          }}
        />
      ) : null,

      isModalOpen: isEditModalOpen,
      setIsModal: setIsEditModalOpen,

      isPath: false,
    },
  ];

  const filters = [
    {
      label: "Enable Edit",
      isUpperSide: false,
      node: (
        <Switch
          checked={isEnableEdit}
          onChange={() => setIsEnableEdit((value) => !value)}
          className={`${isEnableEdit ? "bg-green-500" : "bg-red-500"}
          relative inline-flex h-[20px] w-[36px] min-w-[36px] border-[1px] cursor-pointer rounded-full border-transparent transition-colors duration-200 ease-in-out focus:outline-none`}
        >
          <span
            aria-hidden="true"
            className={`${isEnableEdit ? "translate-x-4" : "translate-x-0"}
            pointer-events-none inline-block h-[18px] w-[18px] transform rounded-full bg-white transition duration-200 ease-in-out`}
          />
        </Switch>
      ),
    },
  ];
  useEffect(() => {
    setTableKey((prev) => prev + 1);
    setRows(
      invoices.map((row) => {
        return {
          ...row,
          product: (row.product as AccountProduct)?.name,
          expenseType: (row.expenseType as AccountExpenseType).name,
          unitPrice: parseFloat((row.totalExpense / row.quantity).toFixed(1)),
          unit: units.find(
            (unit) =>
              unit._id === ((row.product as AccountProduct).unit as number)
          )?.name,
          expType: row.expenseType as AccountExpenseType,
        };
      })
    );
  }, [invoices]);

  return (
    <>
      <div className="w-[95%] mx-auto my-10">
        <GenericTable
          key={tableKey}
          rowKeys={rowKeys}
          actions={actions}
          filters={filters}
          isActionsActive={isEnableEdit}
          columns={
            isEnableEdit
              ? [...columns, { key: "Action", isSortable: false }]
              : columns
          }
          rows={rows}
          title="Invoices"
          addButton={addButton}
        />
      </div>
    </>
  );
};

export default Invoice;
