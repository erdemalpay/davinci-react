import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { CiCirclePlus } from "react-icons/ci";
import { FiEdit } from "react-icons/fi";
import { IoCloseOutline } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import { useGeneralContext } from "../../context/General.context";
import { useUserContext } from "../../context/User.context";
import { Location, RoleEnum } from "../../types";
import {
  useGetAllLocations,
  useLocationMutations,
} from "../../utils/api/location";
import { useGetPanelControlPages } from "../../utils/api/panelControl/page";
import { NameInput } from "../../utils/panelInputs";
import GenericAddEditPanel from "../panelComponents/FormElements/GenericAddEditPanel";
import ButtonTooltip from "../panelComponents/Tables/ButtonTooltip";
import GenericTable from "../panelComponents/Tables/GenericTable";
import { FormKeyTypeEnum, InputTypes } from "../panelComponents/shared/types";

const LocationPage = () => {
  const { t } = useTranslation();
  const { user } = useUserContext();
  const pages = useGetPanelControlPages();
  const navigate = useNavigate();
  const { resetGeneralContext } = useGeneralContext();
  const locations = useGetAllLocations();
  const [tableKey, setTableKey] = useState(0);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddShiftModalOpen, setIsAddShiftModalOpen] = useState(false);
  const isDisabledCondition = user
    ? ![
        RoleEnum.MANAGER,
        RoleEnum.CATERINGMANAGER,
        RoleEnum.GAMEMANAGER,
      ].includes(user?.role?._id)
    : true;
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
    if (type.includes(3)) {
      return t("Online");
    }
  };
  const [form, setForm] = useState(initialForm as Partial<Location>);
  const { updateLocation, createStockLocation } = useLocationMutations();
  const [rows, setRows] = useState(locations);
  const columns = [
    { key: t("Name"), isSortable: true },
    { key: t("Type"), isSortable: false },
    { key: t("Table Count"), isSortable: false },
    { key: t("Shifts"), isSortable: false },
    { key: "Ikas ID", isSortable: false },
  ];
  if (!isDisabledCondition) {
    columns.push({ key: t("Actions"), isSortable: false });
  }
  const rowKeys = [
    {
      key: "name",
      className: "min-w-32 pr-1",
      node: (row: any) =>
        user &&
        pages &&
        pages
          ?.find((page) => page._id === "location")
          ?.permissionRoles?.includes(user.role._id) &&
        row.type.includes(1) ? (
          <p
            className="text-blue-700  w-fit  cursor-pointer hover:text-blue-500 transition-transform"
            onClick={() => {
              if (!row.type.includes(1)) return;
              resetGeneralContext();
              navigate(`/location/${row._id}`);
            }}
          >
            {row.name}
          </p>
        ) : (
          <p>{row.name}</p>
        ),
    },
    {
      key: "type",
      className: "min-w-32 pr-1",
      node: (row: Location) => {
        return <p>{getRowTypeName(row.type)}</p>;
      },
    },
    { key: "tableCount" },
    {
      key: "shifts",
      node: (row: any) => {
        return (
          <div className="flex flex-row gap-2 max-w-40 flex-wrap ">
            {row?.shifts?.map((shift: string, index: number) => (
              <div
                key={index}
                className="flex flex-row px-1 py-0.5 bg-red-400 rounded-md text-white"
              >
                <p>{shift}</p>
                <ButtonTooltip content={t("Delete")}>
                  <IoCloseOutline
                    className="cursor-pointer font-bold"
                    onClick={() => {
                      const updatedShifts = row.shifts.filter(
                        (foundShift: string) => foundShift !== shift
                      );
                      updatedShifts?.sort((a: string, b: string) => {
                        const [aHour, aMinute] = a.split(":").map(Number);
                        const [bHour, bMinute] = b.split(":").map(Number);
                        const totalMinutesA = aHour * 60 + aMinute;
                        const totalMinutesB = bHour * 60 + bMinute;
                        return totalMinutesA - totalMinutesB;
                      });
                      updateLocation({
                        id: Number(row._id),
                        updates: {
                          shifts: updatedShifts,
                        },
                      });
                    }}
                  />
                </ButtonTooltip>
              </div>
            ))}
          </div>
        );
      },
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
    isDisabled: isDisabledCondition,
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
      isDisabled: isDisabledCondition,
    },
    {
      name: t("Add Shift"),
      icon: <CiCirclePlus />,
      className: "text-2xl mt-1   cursor-pointer",
      isModal: true,
      setRow: setRowToAction,
      modal: rowToAction ? (
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
                shiftForm.hour,
              ];
              updatedShifts.sort((a, b) => {
                const [aHour, aMinute] = a.split(":").map(Number);
                const [bHour, bMinute] = b.split(":").map(Number);
                const totalMinutesA = aHour * 60 + aMinute;
                const totalMinutesB = bHour * 60 + bMinute;
                return totalMinutesA - totalMinutesB;
              });
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
      ) : null,
      isModalOpen: isAddShiftModalOpen,
      setIsModal: setIsAddShiftModalOpen,
      isPath: false,
      isDisabled: isDisabledCondition,
    },
  ];
  useEffect(() => {
    setRows(locations);
    setTableKey((prev) => prev + 1);
  }, [locations, user]);
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
          isActionsActive={!isDisabledCondition}
        />
      </div>
    </>
  );
};

export default LocationPage;
