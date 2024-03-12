import { useEffect, useState } from "react";
import { FiEdit } from "react-icons/fi";
import { HiOutlineTrash } from "react-icons/hi2";
import { AccountProduct, AccountUnit } from "../../types";
import {
  useAccountProductMutations,
  useGetAccountProducts,
} from "../../utils/api/account/product";
import { useGetAccountUnits } from "../../utils/api/account/unit";
import { ConfirmationDialog } from "../common/ConfirmationDialog";
import GenericAddEditPanel from "../panelComponents/FormElements/GenericAddEditPanel";
import GenericTable from "../panelComponents/Tables/GenericTable";
import { FormKeyTypeEnum, InputTypes } from "../panelComponents/shared/types";

type Props = {};

const Product = (props: Props) => {
  const products = useGetAccountProducts();
  const [tableKey, setTableKey] = useState(0);
  const units = useGetAccountUnits();
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
      required: false,
    },
  ];
  const formKeys = [
    { key: "name", type: FormKeyTypeEnum.STRING },
    { key: "unit", type: FormKeyTypeEnum.STRING },
  ];
  const columns = [
    { key: "Name", isSortable: true },
    { key: "Unit", isSortable: true },
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
        constantValues={{ used: false }}
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
