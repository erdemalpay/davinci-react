import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { CiCirclePlus } from "react-icons/ci";
import { FiEdit } from "react-icons/fi";
import { useUserContext } from "../../context/User.context";
import { Location, RoleEnum } from "../../types";
import {
  useGetAllLocations,
  useLocationMutations,
} from "../../utils/api/location";
import { NameInput } from "../../utils/panelInputs";
import GenericAddEditPanel from "../panelComponents/FormElements/GenericAddEditPanel";
import { FormKeyTypeEnum, InputTypes } from "../panelComponents/shared/types";
import GenericTable from "../panelComponents/Tables/GenericTable";

const LocationPage = () => {
  const { t } = useTranslation();
  const { user } = useUserContext();
  const locations = useGetAllLocations();
  const [tableKey, setTableKey] = useState(0);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddShiftModalOpen, setIsAddShiftModalOpen] = useState(false);
  const [shiftForm, setShiftForm] = useState({
    hour: "",
  });
  const [rowToAction, setRowToAction] = useState<Location>();
  const initialForm = {
    type: [],
    tableCount: 0,
    ikasId: "",
  };
  const getRowTypeName = (type: number[]) => {
    if (type.includes(1) && type.includes(2)) {
      return t("Store and Stock");
    }
    if (type.includes(1)) {
      return t("Store");
    }
    if (type.includes(2)) {
      return t("Stock");
    }
  };
  const [form, setForm] = useState(initialForm as Partial<Location>);
  const { updateLocation, createStockLocation } = useLocationMutations();
  const [rows, setRows] = useState(locations);
  const columns = [
    { key: t("Name"), isSortable: true },
    { key: t("Type"), isSortable: false },
    { key: t("Table Count"), isSortable: false },
    { key: "Ikas ID", isSortable: false },
  ];
  if (
    user &&
    [RoleEnum.MANAGER, RoleEnum.CATERINGMANAGER, RoleEnum.GAMEMANAGER].includes(
      user?.role?._id
    )
  ) {
    columns.push({ key: t("Actions"), isSortable: false });
  }
  const rowKeys = [
    {
      key: "name",
      className: "min-w-32 pr-1",
    },
    {
      key: "type",
      className: "min-w-32 pr-1",
      node: (row: Location) => {
        return <p>{getRowTypeName(row.type)}</p>;
      },
    },
    {
      key: "tableCount",
    },
    {
      key: "ikasId",
      className: "min-w-32 pr-1",
    },
  ];
  const inputs = [
    NameInput(),
    {
      type: InputTypes.NUMBER,
      formKey: "tableCount",
      label: t("Table Count"),
      placeholder: t("Table Count"),
      required: false,
      isDisabled: isAddModalOpen || !form?.type?.includes(1),
    },
    {
      type: InputTypes.TEXT,
      formKey: "ikasId",
      label: "Ikas ID",
      placeholder: "Ikas ID",
      required: false,
    },
  ];
  const formKeys = [
    { key: "name", type: FormKeyTypeEnum.STRING },
    { key: "tableCount", type: FormKeyTypeEnum.NUMBER },
    { key: "ikasId", type: FormKeyTypeEnum.STRING },
  ];
  const addShiftInputs = [
    {
      type: InputTypes.HOUR,
      formKey: "hour",
      label: t("Hour"),
      required: true,
    },
  ];
  const addShiftFormKeys = [{ key: "hour", type: FormKeyTypeEnum.STRING }];
  const addButton = {
    name: t(`Add Stock Location`),
    isModal: true,
    modal: (
      <GenericAddEditPanel
        isOpen={isAddModalOpen}
        close={() => setIsAddModalOpen(false)}
        inputs={inputs}
        formKeys={formKeys}
        submitItem={createStockLocation as any}
        topClassName="flex flex-col gap-2 "
      />
    ),
    isModalOpen: isAddModalOpen,
    setIsModal: setIsAddModalOpen,
    isPath: false,
    icon: null,
    className: "bg-blue-500 hover:text-blue-500 hover:border-blue-500 ",
    isDisabled: user
      ? ![
          RoleEnum.MANAGER,
          RoleEnum.CATERINGMANAGER,
          RoleEnum.GAMEMANAGER,
        ].includes(user?.role?._id)
      : true,
  };
  const actions = [
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
          setForm={setForm}
          formKeys={formKeys}
          submitItem={updateLocation as any}
          isEditMode={true}
          topClassName="flex flex-col gap-2 "
          itemToEdit={{ id: Number(rowToAction._id), updates: rowToAction }}
        />
      ) : null,

      isModalOpen: isEditModalOpen,
      setIsModal: setIsEditModalOpen,
      isPath: false,
      isDisabled: user
        ? ![
            RoleEnum.MANAGER,
            RoleEnum.CATERINGMANAGER,
            RoleEnum.GAMEMANAGER,
          ].includes(user?.role?._id)
        : true,
    },
    {
      name: t("Add Shift"),
      icon: <CiCirclePlus />,
      className: "text-2xl mt-1  mr-auto cursor-pointer",
      isModal: true,
      setRow: setRowToAction,
      modal: (
        <GenericAddEditPanel
          isOpen={isAddShiftModalOpen}
          close={() => setIsAddShiftModalOpen(false)}
          inputs={addShiftInputs}
          formKeys={addShiftFormKeys}
          submitItem={updateLocation as any}
          isEditMode={true}
          setForm={setShiftForm}
          topClassName="flex flex-col gap-2  "
          handleUpdate={() => {
            if (rowToAction) {
              const updatedShifts = [
                ...(rowToAction.shifts || []),
                String(shiftForm.hour),
              ];

              updateLocation({
                id: Number(rowToAction._id),
                updates: {
                  shifts: updatedShifts,
                },
              });

              setIsAddShiftModalOpen(false);
            }
          }}
        />
      ),
      isModalOpen: isAddShiftModalOpen,
      setIsModal: setIsAddShiftModalOpen,
      isPath: false,
      isDisabled: user
        ? ![
            RoleEnum.MANAGER,
            RoleEnum.CATERINGMANAGER,
            RoleEnum.GAMEMANAGER,
          ].includes(user?.role?._id)
        : true,
    },
  ];
  useEffect(() => {
    setRows(locations);
    setTableKey((prev) => prev + 1);
  }, [locations]);
  return (
    <>
      <div className="w-[95%] mx-auto ">
        <GenericTable
          key={tableKey}
          rowKeys={rowKeys}
          actions={actions}
          columns={columns}
          rows={rows}
          title={t("Locations")}
          addButton={addButton}
          isActionsActive={
            user
              ? [
                  RoleEnum.MANAGER,
                  RoleEnum.CATERINGMANAGER,
                  RoleEnum.GAMEMANAGER,
                ].includes(user?.role?._id)
              : false
          }
        />
      </div>
    </>
  );
};

export default LocationPage;
