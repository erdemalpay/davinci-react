import { Switch } from "@headlessui/react";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FiEdit } from "react-icons/fi";
import { HiOutlineTrash } from "react-icons/hi2";
import {
  AccountBrand,
  AccountExpenseType,
  AccountInvoice,
  AccountProduct,
  AccountVendor,
  Location,
} from "../../types";
import { useGetAccountBrands } from "../../utils/api/account/brand";
import { useGetAccountExpenseTypes } from "../../utils/api/account/expenseType";
import {
  useAccountInvoiceMutations,
  useGetAccountInvoices,
} from "../../utils/api/account/invoice";
import { useGetAccountProducts } from "../../utils/api/account/product";
import { useGetAccountUnits } from "../../utils/api/account/unit";
import { useGetAccountVendors } from "../../utils/api/account/vendor";
import { useGetLocations } from "../../utils/api/location";
import { formatAsLocalDate } from "../../utils/format";
import { passesFilter } from "../../utils/passesFilter";
import { ConfirmationDialog } from "../common/ConfirmationDialog";
import GenericAddEditPanel from "../panelComponents/FormElements/GenericAddEditPanel";
import GenericTable from "../panelComponents/Tables/GenericTable";
import { H5, P1 } from "../panelComponents/Typography";
import { FormKeyTypeEnum, InputTypes } from "../panelComponents/shared/types";

type Props = {};
type FormElementsState = {
  [key: string]: any;
};

const Invoice = (props: Props) => {
  const { t } = useTranslation();
  const invoices = useGetAccountInvoices();
  const units = useGetAccountUnits();
  const locations = useGetLocations();
  const expenseTypes = useGetAccountExpenseTypes();
  const brands = useGetAccountBrands();
  const vendors = useGetAccountVendors();
  const products = useGetAccountProducts();
  const [tableKey, setTableKey] = useState(0);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [rowToAction, setRowToAction] = useState<AccountInvoice>();
  const [isEnableEdit, setIsEnableEdit] = useState(false);
  const [form, setForm] = useState<Partial<AccountInvoice>>({
    date: "",
    product: "",
    expenseType: "",
    quantity: 0,
    totalExpense: 0,
    brand: "",
    location: 0,
    vendor: "",
    documentNo: "",
    price: 0,
    kdv: 0,
  });

  const [filterPanelFormElements, setFilterPanelFormElements] =
    useState<FormElementsState>({
      product: "",
      vendor: "",
      brand: "",
      expenseType: "",
      location: "",
      before: "",
      after: "",
    });

  const [
    isCloseAllConfirmationDialogOpen,
    setIsCloseAllConfirmationDialogOpen,
  ] = useState(false);

  const { createAccountInvoice, deleteAccountInvoice, updateAccountInvoice } =
    useAccountInvoiceMutations();
  const [rows, setRows] = useState(
    invoices.map((invoice) => {
      return {
        ...invoice,
        product: (invoice.product as AccountProduct)?.name,
        expenseType: (invoice.expenseType as AccountExpenseType)?.name,
        brand: (invoice.brand as AccountBrand)?.name,
        vendor: (invoice.vendor as AccountVendor)?.name,
        location: invoice.location as Location,
        lctn: (invoice.location as Location)?.name,
        unitPrice: parseFloat(
          `${parseFloat(
            (invoice.totalExpense / invoice.quantity).toFixed(4)
          ).toString()}`
        ),
        unit: units?.find(
          (unit) =>
            unit._id === ((invoice.product as AccountProduct).unit as string)
        )?.name,
        expType: invoice.expenseType as AccountExpenseType,
        brnd: invoice.brand as AccountBrand,
        vndr: invoice.vendor as AccountVendor,
      };
    })
  );
  const inputs = [
    {
      type: InputTypes.DATE,
      formKey: "date",
      label: t("Date"),
      placeholder: t("Date"),
      required: true,
    },
    {
      type: InputTypes.SELECT,
      formKey: "product",
      label: t("Product"),
      options: products.map((product) => {
        return {
          value: product._id,
          label: product.name,
        };
      }),
      placeholder: t("Product"),
      invalidateKeys: [{ key: "expenseType", defaultValue: 0 }],
      required: true,
    },
    {
      type: InputTypes.SELECT,
      formKey: "expenseType",
      label: t("Expense Type"),
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
      placeholder: t("Expense Type"),
      required: true,
    },
    {
      type: InputTypes.SELECT,
      formKey: "location",
      label: t("Location"),
      options: locations.map((location) => {
        return {
          value: location._id,
          label: location.name,
        };
      }),
      placeholder: t("Location"),
      required: true,
    },

    {
      type: InputTypes.SELECT,
      formKey: "brand",
      label: t("Brand"),
      options: brands
        ?.filter((brnd) =>
          products
            .find((prod) => prod._id === form?.product)
            ?.brand?.includes(brnd._id)
        )
        ?.map((brand) => {
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
      options: vendors
        ?.filter((vndr) =>
          products
            .find((prod) => prod._id === form?.product)
            ?.vendor?.includes(vndr._id)
        )
        ?.map((vendor) => {
          return {
            value: vendor._id,
            label: vendor.name,
          };
        }),
      placeholder: t("Vendor"),
      required: false,
    },
    {
      type: InputTypes.TEXT,
      formKey: "documentNo",
      label: t("Document No"),
      placeholder: t("Document No"),
      required: false,
    },
    {
      type: InputTypes.NUMBER,
      formKey: "quantity",
      label: t("Quantity"),
      placeholder: t("Quantity"),
      required: true,
    },
  ];
  const filterPanelInputs = [
    {
      type: InputTypes.SELECT,
      formKey: "product",
      label: t("Product"),
      options: products.map((product) => {
        return {
          value: product._id,
          label: product.name,
        };
      }),
      placeholder: t("Product"),
      required: true,
    },
    {
      type: InputTypes.SELECT,
      formKey: "vendor",
      label: t("Vendor"),
      options: vendors.map((item) => {
        return {
          value: item._id,
          label: item.name,
        };
      }),
      placeholder: t("Vendor"),
      required: true,
    },
    {
      type: InputTypes.SELECT,
      formKey: "brand",
      label: t("Brand"),
      options: brands.map((item) => {
        return {
          value: item._id,
          label: item.name,
        };
      }),
      placeholder: t("Brand"),
      required: true,
    },
    {
      type: InputTypes.SELECT,
      formKey: "expenseType",
      label: t("ExpenseType"),
      options: expenseTypes.map((item) => {
        return {
          value: item._id,
          label: item.name,
        };
      }),
      placeholder: t("ExpenseType"),
      required: true,
    },
    {
      type: InputTypes.SELECT,
      formKey: "location",
      label: t("Location"),
      options: locations.map((item) => {
        return {
          value: item._id,
          label: item.name,
        };
      }),
      placeholder: t("Location"),
      required: true,
    },
    {
      type: InputTypes.DATE,
      formKey: "after",
      label: t("After"),
      placeholder: t("After"),
      required: true,
    },
    {
      type: InputTypes.DATE,
      formKey: "before",
      label: t("Before"),
      placeholder: t("Before"),
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
    { key: "location", type: FormKeyTypeEnum.STRING },
    { key: "brand", type: FormKeyTypeEnum.STRING },
    { key: "vendor", type: FormKeyTypeEnum.STRING },
    { key: "documentNo", type: FormKeyTypeEnum.STRING },
    { key: "quantity", type: FormKeyTypeEnum.NUMBER },
  ];
  const columns = [
    { key: "ID", isSortable: true },
    { key: t("Date"), isSortable: true },
    {
      key: t("Document No"),
      isSortable: true,
      node: () => {
        return (
          <th key="documentNoColumn">
            <H5 className="min-w-32 my-auto h-full  py-3">
              {t("Document No")}
            </H5>
          </th>
        );
      },
    },
    { key: t("Brand"), isSortable: true },
    { key: t("Vendor"), isSortable: true },
    { key: t("Location"), isSortable: true },
    { key: t("Expense Type"), isSortable: true },
    { key: t("Product"), isSortable: true },
    { key: t("Quantity"), isSortable: true },
    { key: t("Unit"), isSortable: true },
    { key: t("Unit Price"), isSortable: true },
    { key: t("Total Expense"), isSortable: true },
  ];
  const rowKeys = [
    {
      key: "_id",
      className: "min-w-32 pr-2",
    },
    {
      key: "date",
      className: "min-w-32 pr-2",
      node: (row: AccountInvoice) => {
        return formatAsLocalDate(row.date);
      },
    },
    { key: "documentNo", className: "min-w-40 pr-2" },
    { key: "brand", className: "min-w-32 pr-2" },
    { key: "vendor", className: "min-w-32 pr-2" },
    { key: "lctn", className: "min-w-32 pr-4" },
    {
      key: "expenseType",
      node: (row: any) => {
        return (
          <div className=" min-w-32">
            <p
              className="w-fit rounded-md text-sm ml-2 px-2 py-1 text-white"
              style={{
                backgroundColor: row?.expType?.backgroundColor,
              }}
            >
              {(row?.expType as AccountExpenseType)?.name}
            </p>
          </div>
        );
      },
    },
    {
      key: "product",
      className: "min-w-32 pr-2",
    },
    {
      key: "quantity",
      className: "min-w-32",
    },
    {
      key: "unit",
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
    {
      key: "totalExpense",
      node: (row: any) => {
        return (
          <div className="min-w-32">
            <P1>{row.totalExpense} ₺</P1>
          </div>
        );
      },
    },
  ];
  const addButton = {
    name: t(`Add Invoice`),
    isModal: true,

    modal: (
      <GenericAddEditPanel
        isOpen={isAddModalOpen}
        close={() => setIsAddModalOpen(false)}
        inputs={[
          ...inputs,
          {
            type: InputTypes.NUMBER,
            formKey: "price",
            label: t("Price"),
            placeholder: t("Price"),
            required: true,
          },
          {
            type: InputTypes.NUMBER,
            formKey: "kdv",
            label: "Kdv",
            placeholder: "Kdv",
            required: true,
          },
        ]}
        formKeys={[
          ...formKeys,
          { key: "price", type: FormKeyTypeEnum.NUMBER },
          { key: "kdv", type: FormKeyTypeEnum.NUMBER },
        ]}
        submitFunction={() => {
          form.price &&
            form.kdv &&
            createAccountInvoice({
              ...form,
              totalExpense: Number(form.price) + Number(form.kdv),
            });
        }}
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
      name: t("Delete"),
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
      name: t("Edit"),
      isDisabled: !isEnableEdit,
      icon: <FiEdit />,
      className: "text-blue-500 cursor-pointer text-xl ",
      isModal: true,
      setRow: setRowToAction,
      modal: rowToAction ? (
        <GenericAddEditPanel
          isOpen={isEditModalOpen}
          close={() => setIsEditModalOpen(false)}
          inputs={[
            ...inputs,
            {
              type: InputTypes.NUMBER,
              formKey: "totalExpense",
              label: t("Total Expense"),
              placeholder: t("Total Expense"),
              required: true,
            },
          ]}
          formKeys={[
            ...formKeys,
            { key: "totalExpense", type: FormKeyTypeEnum.NUMBER },
          ]}
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
              brand: (
                invoices.find((invoice) => invoice._id === rowToAction._id)
                  ?.brand as AccountBrand
              )?._id,
              vendor: (
                invoices.find((invoice) => invoice._id === rowToAction._id)
                  ?.vendor as AccountVendor
              )?._id,
              documentNo: rowToAction.documentNo,
              location: (rowToAction.location as Location)._id,
            },
          }}
        />
      ) : null,

      isModalOpen: isEditModalOpen,
      setIsModal: setIsEditModalOpen,

      isPath: false,
    },
  ];

  const tableFilters = [
    {
      label: t("Enable Edit"),
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
    {
      label: t("Show Filters"),
      isUpperSide: false,
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
  ];

  useEffect(() => {
    setTableKey((prev) => prev + 1);
    setRows(
      invoices
        .filter((invoice) => {
          return (
            (passesFilter(
              filterPanelFormElements.product,
              (invoice.product as AccountProduct)?._id
            ) &&
              passesFilter(
                filterPanelFormElements.vendor,
                (invoice.vendor as AccountVendor)?._id
              ) &&
              passesFilter(
                filterPanelFormElements.brand,
                (invoice.brand as AccountBrand)?._id
              ) &&
              passesFilter(
                filterPanelFormElements.expenseType,
                (invoice.expenseType as AccountExpenseType)?._id
              ) &&
              passesFilter(
                filterPanelFormElements.location,
                (invoice.location as Location)?._id
              ) &&
              filterPanelFormElements.before === "") ||
            (invoice.date <= filterPanelFormElements.before &&
              (filterPanelFormElements.after === "" ||
                invoice.date >= filterPanelFormElements.after))
          );
        })
        .map((invoice) => {
          return {
            ...invoice,
            product: (invoice.product as AccountProduct)?.name,
            expenseType: (invoice.expenseType as AccountExpenseType)?.name,
            brand: (invoice.brand as AccountBrand)?.name,
            vendor: (invoice.vendor as AccountVendor)?.name,
            unitPrice: parseFloat(
              `${parseFloat(
                (invoice.totalExpense / invoice.quantity).toFixed(4)
              ).toString()}`
            ),
            lctn: (invoice.location as Location)?.name,
            unit: units?.find(
              (unit) =>
                unit._id ===
                ((invoice.product as AccountProduct).unit as string)
            )?.name,
            expType: invoice.expenseType as AccountExpenseType,
            brnd: invoice.brand as AccountBrand,
            vndr: invoice.vendor as AccountVendor,
            location: invoice.location as Location,
          };
        })
    );
  }, [invoices, filterPanelFormElements]);

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
          filters={tableFilters}
          isActionsActive={isEnableEdit}
          columns={
            isEnableEdit
              ? [...columns, { key: t("Action"), isSortable: false }]
              : columns
          }
          rows={rows}
          title={t("Invoices")}
          addButton={addButton}
          filterPanel={filterPanel}
        />
      </div>
    </>
  );
};

export default Invoice;
