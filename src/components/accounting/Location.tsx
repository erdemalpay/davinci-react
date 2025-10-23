import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { FiEdit } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useGeneralContext } from "../../context/General.context";
import { useUserContext } from "../../context/User.context";
import { Location, RoleEnum } from "../../types";
import {
  useGetAllLocations,
  useLocationMutations,
} from "../../utils/api/location";
import { useGetPanelControlPages } from "../../utils/api/panelControl/page";
import GenericAddEditPanel from "../panelComponents/FormElements/GenericAddEditPanel";
import GenericTable from "../panelComponents/Tables/GenericTable";
import SwitchButton from "../panelComponents/common/SwitchButton";
import { FormKeyTypeEnum, InputTypes } from "../panelComponents/shared/types";

const LocationPage = () => {
  const { t } = useTranslation();
  const { user } = useUserContext();
  const pages = useGetPanelControlPages();
  const navigate = useNavigate();
  const { resetGeneralContext } = useGeneralContext();
  const locations = useGetAllLocations();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [rowToAction, setRowToAction] = useState<Location>();
  const initialForm = {
    type: [],
    tableCount: 0,
    ikasId: "",
  };
  const [form, setForm] = useState(initialForm as Partial<Location>);
  const { updateLocation, createStockLocation } = useLocationMutations();

  const isDisabledCondition = useMemo(() => {
    return user
      ? ![RoleEnum.MANAGER, RoleEnum.GAMEMANAGER].includes(user?.role?._id)
      : true;
  }, [user]);

  const getRowTypeName = useMemo(
    () => (type: number[]) => {
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
    },
    [t]
  );

  const rows = useMemo(() => locations, [locations]);

  const columns = useMemo(() => {
    const cols = [
      { key: t("Name"), isSortable: true },
      { key: t("Type"), isSortable: false },
      { key: t("Table Count"), isSortable: false },
      { key: t("Shelf Info"), isSortable: false },
      { key: t("Closed Days"), isSortable: false },
      { key: t("Shifts"), isSortable: false },
      { key: "Ikas ID", isSortable: false },
    ];
    if (!isDisabledCondition) {
      cols.push({ key: t("Actions"), isSortable: false });
    }
    return cols;
  }, [t, isDisabledCondition]);

  const rowKeys = useMemo(
    () => [
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
        key: "isShelfInfoRequired",
        node: (row: any) => {
          return (
            <SwitchButton
              checked={row?.isShelfInfoRequired}
              onChange={() => {
                updateLocation({
                  id: row._id,
                  updates: {
                    isShelfInfoRequired: !row?.isShelfInfoRequired,
                  },
                });
              }}
            />
          );
        },
      },
      {
        key: "closedDays",
        node: (row: any) => {
          return (
            <div className="flex flex-row gap-2 max-w-64 flex-wrap ">
              {row?.closedDays
                ?.sort((a: string, b: string) => {
                  const daysOrder = [
                    "Monday",
                    "Tuesday",
                    "Wednesday",
                    "Thursday",
                    "Friday",
                    "Saturday",
                    "Sunday",
                  ];
                  return daysOrder.indexOf(a) - daysOrder.indexOf(b);
                })
                ?.map((day: string, index: number) => (
                  <div
                    key={index}
                    className="flex flex-row px-1 py-0.5 bg-gray-400 rounded-md text-white"
                  >
                    <p>{t(day)}</p>
                  </div>
                ))}
            </div>
          );
        },
      },
      {
        key: "shifts",
        node: (row: any) => {
          return (
            <div className="flex flex-row gap-2 max-w-64 flex-wrap ">
              {row?.shifts?.map((shift: any, index: number) => (
                <div
                  key={index}
                  className="flex flex-row px-1 py-0.5 bg-red-400 rounded-md text-white"
                >
                  <p>
                    {shift.shift}
                    {shift.shiftEndHour && ` - ${shift.shiftEndHour}`}
                  </p>
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
    ],
    [
      user,
      pages,
      resetGeneralContext,
      navigate,
      getRowTypeName,
      updateLocation,
      t,
    ]
  );

  const inputs = useMemo(
    () => [
      {
        type: InputTypes.TEXT,
        formKey: "name",
        label: t("Name"),
        placeholder: t("Name"),
        required: true,
      },
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
      {
        type: InputTypes.SELECT,
        formKey: "closedDays",
        label: t("Closed Days"),
        placeholder: t("Closed Days"),
        required: false,
        options: [
          { label: t("Monday"), value: "Monday" },
          { label: t("Tuesday"), value: "Tuesday" },
          { label: t("Wednesday"), value: "Wednesday" },
          { label: t("Thursday"), value: "Thursday" },
          { label: t("Friday"), value: "Friday" },
          { label: t("Saturday"), value: "Saturday" },
          { label: t("Sunday"), value: "Sunday" },
        ],
        isMultiple: true,
        isDisabled: isAddModalOpen || !form?.type?.includes(1),
        isSortDisabled: true,
      },
    ],
    [t, isAddModalOpen, form?.type]
  );

  const formKeys = useMemo(
    () => [
      { key: "name", type: FormKeyTypeEnum.STRING },
      { key: "tableCount", type: FormKeyTypeEnum.NUMBER },
      { key: "ikasId", type: FormKeyTypeEnum.STRING },
      { key: "closedDays", type: FormKeyTypeEnum.STRING },
    ],
    []
  );

  const addButton = useMemo(
    () => ({
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
    }),
    [
      t,
      isAddModalOpen,
      inputs,
      formKeys,
      createStockLocation,
      isDisabledCondition,
    ]
  );

  const actions = useMemo(
    () => [
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
    ],
    [
      t,
      rowToAction,
      isEditModalOpen,
      inputs,
      formKeys,
      updateLocation,
      isDisabledCondition,
    ]
  );

  return (
    <>
      <div className="w-[95%] mx-auto ">
        <GenericTable
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
