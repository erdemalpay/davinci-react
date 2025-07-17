import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FiEdit } from "react-icons/fi";
import { HiOutlineTrash } from "react-icons/hi2";
import { toast } from "react-toastify";
import { useFilterContext } from "../../context/Filter.context";
import { LocationShiftType } from "../../types";
import {
  useGetStoreLocations,
  useLocationMutations,
} from "../../utils/api/location";
import { CheckSwitch } from "../common/CheckSwitch";
import { ConfirmationDialog } from "../common/ConfirmationDialog";
import GenericAddEditPanel from "../panelComponents/FormElements/GenericAddEditPanel";
import GenericTable from "../panelComponents/Tables/GenericTable";
import SwitchButton from "../panelComponents/common/SwitchButton";
import { FormKeyTypeEnum, InputTypes } from "../panelComponents/shared/types";

type Props = {
  locationId: number;
};
const Shifts = ({ locationId }: Props) => {
  const { t } = useTranslation();
  const locations = useGetStoreLocations();
  const [rowToAction, setRowToAction] = useState<any>();
  const { showInactiveShifts, setShowInactiveShifts } = useFilterContext();
  const { updateLocation } = useLocationMutations();
  const [shiftForm, setShiftForm] = useState({
    hour: "",
    type: "",
    shiftEndHour: "",
  });
  const [tableKey, setTableKey] = useState(0);
  const [
    isCloseAllConfirmationDialogOpen,
    setIsCloseAllConfirmationDialogOpen,
  ] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const allRows = locations
    ?.find((l) => l._id === locationId)
    ?.shifts?.filter((shift) => {
      if (showInactiveShifts) {
        return true;
      }
      return shift.isActive;
    })
    ?.map((shift) => {
      return {
        ...shift,
        hour: shift.shift,
        shiftEndHour: shift.shiftEndHour,
      };
    });
  const [rows, setRows] = useState(allRows);
  const columns = [
    { key: t("Shift"), isSortable: true, correspondingKey: "shift" },
    { key: t("End Hour"), isSortable: true, correspondingKey: "shiftEndHour" },
    { key: t("Type"), isSortable: true, correspondingKey: "type" },
    { key: t("Actions"), isSortable: false },
  ];
  const rowKeys = [
    { key: "shift" },
    { key: "shiftEndHour" },
    { key: "type", node: (row: any) => t(row.type) },
  ];
  const addShiftInputs = [
    {
      type: InputTypes.HOUR,
      formKey: "hour",
      label: t("Start Hour"),
      required: true,
    },
    {
      type: InputTypes.HOUR,
      formKey: "shiftEndHour",
      label: t("End Hour"),
      required: true,
    },
    {
      type: InputTypes.SELECT,
      formKey: "type",
      label: t("Type"),
      options: Object.values(LocationShiftType)?.map((locationShiftType) => {
        return {
          value: locationShiftType,
          label: t(locationShiftType),
        };
      }),
      placeholder: t("Type"),
      isMultiple: false,
      required: true,
    },
  ];
  const addShiftFormKeys = [
    { key: "hour", type: FormKeyTypeEnum.STRING },
    { key: "shiftEndHour", type: FormKeyTypeEnum.STRING },
    { key: "type", type: FormKeyTypeEnum.STRING },
  ];
  const addButton = {
    name: t("Add Shift"),
    className: "bg-blue-500 hover:text-blue-500 hover:border-blue-500 ",
    isModal: true,
    setRow: setRowToAction,
    modal: (
      <GenericAddEditPanel
        isOpen={isAddModalOpen}
        close={() => setIsAddModalOpen(false)}
        inputs={addShiftInputs}
        formKeys={addShiftFormKeys}
        submitItem={updateLocation as any}
        isEditMode={true}
        setForm={setShiftForm}
        topClassName="flex flex-col gap-2  "
        handleUpdate={() => {
          const foundLocation = locations.find(
            (location) => location._id === locationId
          );
          const isHourExists = foundLocation?.shifts?.some(
            (shift) => shift.shift === shiftForm.hour
          );
          if (isHourExists) {
            toast.error(t("This shift start hour already exists."));
            return;
          }
          const updatedShifts = [
            ...(foundLocation?.shifts || []),
            {
              shift: shiftForm.hour,
              isActive: true,
              type: shiftForm.type,
              shiftEndHour: shiftForm.shiftEndHour,
            },
          ].sort(
            (a, b) =>
              parseInt(a.shift as string, 10) - parseInt(b.shift as string, 10)
          );
          updateLocation({
            id: Number(locationId),
            updates: {
              shifts: updatedShifts,
            },
          });
          setIsAddModalOpen(false);
        }}
      />
    ),
    isModalOpen: isAddModalOpen,
    setIsModal: setIsAddModalOpen,
    isPath: false,
    isDisabled: false,
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
            const foundLocation = locations.find(
              (location) => location._id === locationId
            );
            const updatedShifts = foundLocation?.shifts?.filter(
              (shift) => shift.shift !== rowToAction.shift
            );
            updateLocation({
              id: Number(locationId),
              updates: {
                shifts: updatedShifts,
              },
            });
            setRowToAction(null);
            setIsCloseAllConfirmationDialogOpen(false);
          }}
          title={t("Delete Shift")}
          text={`${rowToAction.shift} ${t("GeneralDeleteMessage")}`}
        />
      ) : null,
      className: "text-red-500 cursor-pointer text-2xl  ",
      isModal: true,
      isModalOpen: isCloseAllConfirmationDialogOpen,
      setIsModal: setIsCloseAllConfirmationDialogOpen,
      isPath: false,
      isDisabled: false,
    },
    {
      name: t("Edit"),
      icon: <FiEdit />,
      className: "text-blue-500 cursor-pointer text-xl",
      isModal: true,
      setRow: setRowToAction,
      modal: rowToAction ? (
        <GenericAddEditPanel
          isOpen={isEditModalOpen}
          close={() => setIsEditModalOpen(false)}
          setForm={setShiftForm}
          inputs={addShiftInputs}
          formKeys={addShiftFormKeys}
          submitItem={() => {
            const foundLocation = locations.find(
              (location) => location._id === locationId
            );
            const updatedShifts = foundLocation?.shifts
              ?.map((shift) => {
                if (shift.shift === rowToAction.shift) {
                  return {
                    ...shift,
                    shift: shiftForm.hour,
                    type: shiftForm.type,
                    shiftEndHour: shiftForm.shiftEndHour,
                  };
                }
                return shift;
              })
              .sort(
                (a, b) =>
                  parseInt(a.shift as string, 10) -
                  parseInt(b.shift as string, 10)
              );
            updateLocation({
              id: Number(locationId),
              updates: {
                shifts: updatedShifts,
              },
            });
          }}
          isEditMode={true}
          topClassName="flex flex-col gap-2 "
          itemToEdit={{ id: rowToAction._id, updates: rowToAction }}
        />
      ) : null,

      isModalOpen: isEditModalOpen,
      setIsModal: setIsEditModalOpen,
      isPath: false,
      isDisabled: false,
    },
    {
      name: t("Toggle Active"),
      isDisabled: !showInactiveShifts,
      isModal: false,
      isPath: false,
      icon: null,
      node: (row: any) => (
        <div className="mt-2 mr-auto">
          <CheckSwitch
            checked={row.isActive}
            onChange={() => {
              const foundLocation = locations.find(
                (location) => location._id === locationId
              );
              const updatedShifts = foundLocation?.shifts?.map((shift) => {
                if (shift.shift === row.shift) {
                  return {
                    ...shift,
                    isActive: !shift.isActive,
                  };
                }
                return shift;
              });
              updateLocation({
                id: Number(locationId),
                updates: {
                  shifts: updatedShifts,
                },
              });
            }}
          ></CheckSwitch>
        </div>
      ),
    },
  ];
  const filters = [
    {
      label: t("Show Inactive Shifts"),
      isUpperSide: false,
      node: (
        <SwitchButton
          checked={showInactiveShifts}
          onChange={() => {
            setShowInactiveShifts(!showInactiveShifts);
          }}
        />
      ),
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
          title={t("Shifts")}
          actions={actions}
          filters={filters}
          isActionsActive={true}
        />
      </div>
    </>
  );
};

export default Shifts;
