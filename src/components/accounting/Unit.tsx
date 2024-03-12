import { useEffect, useState } from "react";
import { FiEdit } from "react-icons/fi";
import { HiOutlineTrash } from "react-icons/hi2";
import { AccountUnit } from "../../types";
import {
  useAccountUnitMutations,
  useGetAccountUnits,
} from "../../utils/api/account/unit";
import { ConfirmationDialog } from "../common/ConfirmationDialog";
import GenericAddEditPanel from "../panelComponents/FormElements/GenericAddEditPanel";
import GenericTable from "../panelComponents/Tables/GenericTable";
import { FormKeyTypeEnum, InputTypes } from "../panelComponents/shared/types";

type Props = {};
const inputs = [
  {
    type: InputTypes.TEXT,
    formKey: "name",
    label: "Name",
    placeholder: "Name",
    required: true,
  },
];
const formKeys = [{ key: "name", type: FormKeyTypeEnum.STRING }];
const Unit = (props: Props) => {
  const units = useGetAccountUnits();
  const [tableKey, setTableKey] = useState(0);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [rowToAction, setRowToAction] = useState<AccountUnit>();
  const [
    isCloseAllConfirmationDialogOpen,
    setIsCloseAllConfirmationDialogOpen,
  ] = useState(false);
  const { createAccountUnit, deleteAccountUnit, updateAccountUnit } =
    useAccountUnitMutations();
  const columns = [
    { key: "Name", isSortable: true },
    { key: "Actions", isSortable: false },
  ];
  const rowKeys = [
    {
      key: "name",
      className: "min-w-32 pr-1",
    },
  ];
  const addButton = {
    name: `Add Unit`,
    isModal: true,
    modal: (
      <GenericAddEditPanel
        isOpen={isAddModalOpen}
        close={() => setIsAddModalOpen(false)}
        inputs={inputs}
        formKeys={formKeys}
        submitItem={createAccountUnit as any}
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
            deleteAccountUnit(rowToAction?._id);
            setIsCloseAllConfirmationDialogOpen(false);
          }}
          title="Delete Unit"
          text={`${rowToAction.name} will be deleted. Are you sure you want to continue?`}
        />
      ) : null,
      className: "text-red-500 cursor-pointer text-2xl ml-auto ",
      isModal: true,
      isModalOpen: isCloseAllConfirmationDialogOpen,
      setIsModal: setIsCloseAllConfirmationDialogOpen,
      isPath: false,
    },
    {
      name: "Edit",
      icon: <FiEdit />,
      className: "text-blue-500 cursor-pointer text-xl mr-auto",
      isModal: true,
      setRow: setRowToAction,
      modal: rowToAction ? (
        <GenericAddEditPanel
          isOpen={isEditModalOpen}
          close={() => setIsEditModalOpen(false)}
          inputs={inputs}
          formKeys={formKeys}
          submitItem={updateAccountUnit as any}
          isEditMode={true}
          topClassName="flex flex-col gap-2 "
          itemToEdit={{ id: rowToAction._id, updates: rowToAction }}
        />
      ) : null,

      isModalOpen: isEditModalOpen,
      setIsModal: setIsEditModalOpen,

      isPath: false,
    },
  ];
  useEffect(() => setTableKey((prev) => prev + 1), [units]);

  return (
    <>
      <div className="w-[95%] mx-auto my-10">
        <GenericTable
          key={tableKey}
          rowKeys={rowKeys}
          actions={actions}
          columns={columns}
          rows={units}
          title="Units"
          addButton={addButton}
        />
      </div>
    </>
  );
};

export default Unit;
