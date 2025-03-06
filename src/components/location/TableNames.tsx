import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { HiOutlineTrash } from "react-icons/hi2";
import {
  useGetStoreLocations,
  useLocationMutations,
} from "../../utils/api/location";
import { NameInput } from "../../utils/panelInputs";
import { ConfirmationDialog } from "../common/ConfirmationDialog";
import GenericAddEditPanel from "../panelComponents/FormElements/GenericAddEditPanel";
import GenericTable from "../panelComponents/Tables/GenericTable";
import { FormKeyTypeEnum } from "../panelComponents/shared/types";

type Props = {
  locationId: number;
};

const TableNames = ({ locationId }: Props) => {
  const { t } = useTranslation();
  const locations = useGetStoreLocations();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [rowToAction, setRowToAction] = useState<any>();
  const { updateLocation } = useLocationMutations();
  const [tableKey, setTableKey] = useState(0);
  const [
    isCloseAllConfirmationDialogOpen,
    setIsCloseAllConfirmationDialogOpen,
  ] = useState(false);
  const [form, setForm] = useState({
    name: "",
  });
  const allRows = locations
    ?.find((l) => l._id === locationId)
    ?.tableNames?.map((t) => {
      return {
        name: t,
      };
    });
  const [rows, setRows] = useState(allRows);
  const columns = [
    { key: t("Name"), isSortable: true, correspondingKey: "name" },
    { key: t("Actions"), isSortable: false },
  ];
  const rowKeys = [{ key: "name" }];
  const inputs = [NameInput()];
  const formKeys = [{ key: "name", type: FormKeyTypeEnum.STRING }];
  const addButton = {
    name: t(`Add Table`),
    isModal: true,
    modal: (
      <GenericAddEditPanel
        isOpen={isAddModalOpen}
        close={() => setIsAddModalOpen(false)}
        inputs={inputs}
        formKeys={formKeys}
        submitItem={updateLocation as any}
        setForm={setForm}
        topClassName="flex flex-col gap-2 "
        submitFunction={() => {
          const foundLocation = locations?.find((l) => l._id === locationId);
          if (!foundLocation) return;
          updateLocation({
            id: foundLocation._id,
            updates: {
              tableNames: [...(foundLocation?.tableNames || []), form.name],
            },
          });
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
      icon: <HiOutlineTrash />,
      setRow: setRowToAction,
      modal: rowToAction ? (
        <ConfirmationDialog
          isOpen={isCloseAllConfirmationDialogOpen}
          close={() => setIsCloseAllConfirmationDialogOpen(false)}
          confirm={() => {
            const foundLocation = locations?.find((l) => l._id === locationId);
            if (!foundLocation) return;
            const newTableNames = foundLocation?.tableNames?.filter(
              (tableName) => tableName !== rowToAction.name
            );
            updateLocation({
              id: foundLocation._id,
              updates: {
                tableNames: newTableNames,
              },
            });
            setIsCloseAllConfirmationDialogOpen(false);
          }}
          title={t("Delete Table")}
          text={`${rowToAction.name} ${t("GeneralDeleteMessage")}`}
        />
      ) : null,
      className: "text-red-500 cursor-pointer text-2xl ml-auto ",
      isModal: true,
      isModalOpen: isCloseAllConfirmationDialogOpen,
      setIsModal: setIsCloseAllConfirmationDialogOpen,
      isPath: false,
    },
  ];
  useEffect(() => {
    setRows(allRows);
    setTableKey((prev) => prev + 1);
  }, [locations]);
  return (
    <>
      <div className="w-[95%] mx-auto ">
        <GenericTable
          key={tableKey}
          rowKeys={rowKeys}
          columns={columns}
          isSearch={false}
          addButton={addButton}
          rows={rows ?? []}
          title={t("Tables")}
          actions={actions}
          isActionsActive={true}
        />
      </div>
    </>
  );
};

export default TableNames;
