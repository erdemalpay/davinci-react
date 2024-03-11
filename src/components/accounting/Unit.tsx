import { useEffect, useState } from "react";
import {
  useAccountUnitMutations,
  useGetAccountUnits,
} from "../../utils/api/account-unit";
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
  const { createAccountUnit, deleteAccountUnit, updateAccountUnit } =
    useAccountUnitMutations();
  const columns = [{ key: "Name", isSortable: true }];
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
    className: "bg-blue-500 hover:text-blue-500 hover:border-blue-500",
  };
  useEffect(() => setTableKey((prev) => prev + 1), [units]);

  return (
    <>
      <div className="w-[95%] mx-auto my-10">
        <GenericTable
          key={tableKey}
          rowKeys={rowKeys}
          actions={[]}
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
