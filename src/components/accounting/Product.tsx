import { useEffect, useState } from "react";
import { FiEdit } from "react-icons/fi";
import { HiOutlineTrash } from "react-icons/hi2";
import { AccountProduct, AccountUnit } from "../../types";
import { useGetAccountBrands } from "../../utils/api/account/brand";
import { useGetAccountExpenseTypes } from "../../utils/api/account/expenseType";
import {
  useAccountProductMutations,
  useGetAccountProducts,
} from "../../utils/api/account/product";
import { useGetAccountUnits } from "../../utils/api/account/unit";
import { useGetAccountVendors } from "../../utils/api/account/vendor";
import { ConfirmationDialog } from "../common/ConfirmationDialog";
import GenericAddEditPanel from "../panelComponents/FormElements/GenericAddEditPanel";
import GenericTable from "../panelComponents/Tables/GenericTable";
import { FormKeyTypeEnum, InputTypes } from "../panelComponents/shared/types";

type Props = {};

const Product = (props: Props) => {
  const products = useGetAccountProducts();
  const [tableKey, setTableKey] = useState(0);
  const units = useGetAccountUnits();
  const expenseTypes = useGetAccountExpenseTypes();
  const brands = useGetAccountBrands();
  const vendors = useGetAccountVendors();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [rowToAction, setRowToAction] = useState<AccountProduct>();
  const [
    isCloseAllConfirmationDialogOpen,
    setIsCloseAllConfirmationDialogOpen,
  ] = useState(false);
  const { createAccountProduct, deleteAccountProduct, updateAccountProduct } =
    useAccountProductMutations();
  const [rows, setRows] = useState(
    products.map((row) => {
      return {
        ...row,
        unit: (row.unit as AccountUnit)?.name,
      };
    })
  );
  const inputs = [
    {
      type: InputTypes.TEXT,
      formKey: "name",
      label: "Name",
      placeholder: "Name",
      required: true,
    },
    {
      type: InputTypes.SELECT,
      formKey: "unit",
      label: "Unit",
      options: units.map((unit) => {
        return {
          value: unit._id,
          label: unit.name,
        };
      }),
      placeholder: "Unit",
      required: true,
    },
    {
      type: InputTypes.SELECT,
      formKey: "expenseType",
      label: "Expense Type",
      options: expenseTypes.map((expenseType) => {
        return {
          value: expenseType._id,
          label: expenseType.name,
        };
      }),
      placeholder: "Expense Type",
      isMultiple: true,
      required: true,
    },
    {
      type: InputTypes.SELECT,
      formKey: "brand",
      label: "Brand",
      options: brands.map((brand) => {
        return {
          value: brand._id,
          label: brand.name,
        };
      }),
      placeholder: "Brand",
      isMultiple: true,
      required: false,
    },
    {
      type: InputTypes.SELECT,
      formKey: "vendor",
      label: "Vendor",
      options: vendors.map((vendor) => {
        return {
          value: vendor._id,
          label: vendor.name,
        };
      }),
      placeholder: "Vendor",
      isMultiple: true,
      required: false,
    },
  ];
  const formKeys = [
    { key: "name", type: FormKeyTypeEnum.STRING },
    { key: "unit", type: FormKeyTypeEnum.STRING },
    { key: "expenseType", type: FormKeyTypeEnum.STRING },
    { key: "brand", type: FormKeyTypeEnum.STRING },
    { key: "vendor", type: FormKeyTypeEnum.STRING },
  ];
  const columns = [
    { key: "Name", isSortable: true },
    { key: "Unit", isSortable: true },
    { key: "Expense Type", isSortable: true },
    { key: "Brand", isSortable: true },
    { key: "Vendor", isSortable: true },
    { key: "Actions", isSortable: false },
  ];
  const rowKeys = [
    {
      key: "name",
      className: "min-w-32 pr-1",
    },
    {
      key: "unit",
      className: "min-w-32",
    },
    {
      key: "expenseType",
      className: "min-w-32",
      node: (row: AccountProduct) => {
        return row.expenseType.map((expType: number) => {
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
    {
      key: "brand",
      className: "min-w-32",
      node: (row: AccountProduct) => {
        if (row.brand) {
          return row?.brand?.map((brand: number) => {
            const foundBrand = brands.find((br) => br._id === brand);
            if (!foundBrand)
              return <div key={row._id + "not found brand"}>-</div>;
            return (
              <span
                key={foundBrand.name + foundBrand._id + row._id}
                className={`text-sm   mr-1  w-fit`}
              >
                {foundBrand?.name}
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
          return row?.vendor?.map((vendor: number) => {
            const foundVendor = vendors.find((vn) => vn._id === vendor);
            if (!foundVendor)
              return <div key={row._id + "not found vendor"}>-</div>;
            return (
              <span
                key={foundVendor.name + foundVendor._id + row._id}
                className={`text-sm mr-1  w-fit`}
              >
                {foundVendor?.name}
              </span>
            );
          });
        }
      },
    },
  ];
  const addButton = {
    name: `Add Product`,
    isModal: true,
    modal: (
      <GenericAddEditPanel
        isOpen={isAddModalOpen}
        close={() => setIsAddModalOpen(false)}
        inputs={inputs}
        formKeys={formKeys}
        submitItem={createAccountProduct as any}
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
      name: "Delete",
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
          title="Delete Product"
          text={`${rowToAction.name} will be deleted. Are you sure you want to continue?`}
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
          submitItem={updateAccountProduct as any}
          isEditMode={true}
          topClassName="flex flex-col gap-2 "
          itemToEdit={{
            id: rowToAction._id,
            updates: {
              name: rowToAction.name,
              unit: units.find(
                (unit) => unit.name === (rowToAction?.unit as string)
              )?._id,
            },
          }}
        />
      ) : null,

      isModalOpen: isEditModalOpen,
      setIsModal: setIsEditModalOpen,

      isPath: false,
    },
  ];
  useEffect(() => {
    setTableKey((prev) => prev + 1);
    setRows(
      products.map((product) => {
        return {
          ...product,
          unit: (product.unit as AccountUnit)?.name,
        };
      })
    );
  }, [products]);

  return (
    <>
      <div className="w-[95%] mx-auto my-10">
        <GenericTable
          key={tableKey}
          rowKeys={rowKeys}
          actions={actions}
          columns={columns}
          rows={rows}
          title="Products"
          addButton={addButton}
        />
      </div>
    </>
  );
};

export default Product;
