import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { FiEdit } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useGeneralContext } from "../../context/General.context";
import { useUserContext } from "../../context/User.context";
import { ActionEnum, DisabledConditionEnum, Location } from "../../types";
import {
  useGetAllLocations,
  useLocationMutations,
} from "../../utils/api/location";
import { useGetDisabledConditions } from "../../utils/api/panelControl/disabledCondition";
import { useGetPanelControlPages } from "../../utils/api/panelControl/page";
import { getItem } from "../../utils/getItem";
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
  const disabledConditions = useGetDisabledConditions();

  const locationsDisabledCondition = useMemo(() => {
    return getItem(
      DisabledConditionEnum.ACCOUNTING_LOCATIONS,
      disabledConditions
    );
  }, [disabledConditions]);

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
      { key: t("Phone Number"), isSortable: false },
      { key: t("Map Location"), isSortable: false },
      { key: t("Opening Hours"), isSortable: false },
      { key: t("Shelf Info"), isSortable: false },
      { key: t("Show on Orders Summary"), isSortable: false },
      { key: t("Active"), isSortable: false },
      { key: t("Activity Note"), isSortable: false },
      { key: t("Shifts"), isSortable: false },
      { key: "Ikas ID", isSortable: false },
      { key: t("Actions"), isSortable: false }
    ];
    return cols;
  }, [t]);

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
            <div
              className="px-2 py-1 rounded-md w-fit text-white cursor-pointer hover:opacity-80 transition-all"
              style={{ backgroundColor: row.backgroundColor }}
              onClick={() => {
                if (!row.type.includes(1)) return;
                resetGeneralContext();
                navigate(`/location/${row._id}`);
              }}
            >
              {row.name}
            </div>
          ) : (
            <div
              className="px-2 py-1 rounded-md w-fit text-white"
              style={{ backgroundColor: row.backgroundColor }}
            >
              {row.name}
            </div>
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
        key: "phoneNumber",
        className: "min-w-32 pr-1",
      },
      {
        key: "googleMapsUrl",
        className: "min-w-32 pr-1",
        node: (row: Location) => {
          return row.googleMapsUrl ? (
            <a
              href={row.googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline"
            >
              {t("View Map")}
            </a>
          ) : null;
        },
      },
      {
        key: "dailyHours",
        className: "min-w-48 pr-1",
        node: (row: any) => {
          if (!row.dailyHours || row.dailyHours.length === 0) return null;

          const daysOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
          const sortedHours = [...row.dailyHours].sort((a, b) =>
            daysOrder.indexOf(a.day) - daysOrder.indexOf(b.day)
          );

          return (
            <div className="flex flex-col gap-1 max-w-64">
              {sortedHours.map((dayHour: any, index: number) => (
                <div key={index} className="flex flex-row gap-1 text-sm">
                  <span className="font-medium min-w-20">{t(dayHour.day)}:</span>
                  <span className="text-gray-600">
                    {dayHour.isClosed
                      ? t("Closed")
                      : `${dayHour.openingTime || "--"} - ${dayHour.closingTime || "--"}`
                    }
                  </span>
                </div>
              ))}
            </div>
          );
        },
      },
      {
        key: "isShelfInfoRequired",
        node: (row: any) => {
          const isUpdateDisabled = locationsDisabledCondition?.actions?.some(
            (ac) =>
              ac.action === ActionEnum.UPDATE &&
              user?.role?._id &&
              !ac.permissionsRoles.includes(user.role._id)
          );
          return (
            <div
              className={
                isUpdateDisabled ? "opacity-50 cursor-not-allowed" : ""
              }
            >
              <SwitchButton
                checked={row?.isShelfInfoRequired}
                onChange={() => {
                  if (isUpdateDisabled) return;
                  updateLocation({
                    id: row._id,
                    updates: {
                      isShelfInfoRequired: !row?.isShelfInfoRequired,
                    },
                  });
                }}
              />
            </div>
          );
        },
      },
      {
        key: "seenInOrdersSummaryPage",
        node: (row: any) => {
          const isUpdateDisabled = locationsDisabledCondition?.actions?.some(
            (ac) =>
              ac.action === ActionEnum.UPDATE &&
              user?.role?._id &&
              !ac.permissionsRoles.includes(user.role._id)
          );
          return (
            <div
              className={
                isUpdateDisabled ? "opacity-50 cursor-not-allowed" : ""
              }
            >
              <SwitchButton
                checked={row?.seenInOrdersSummaryPage}
                onChange={() => {
                  if (isUpdateDisabled) return;
                  updateLocation({
                    id: row._id,
                    updates: {
                      seenInOrdersSummaryPage: !row?.seenInOrdersSummaryPage,
                    },
                  });
                }}
              />
            </div>
          );
        },
      },
      {
        key: "active",
        node: (row: any) => {
          const isUpdateDisabled = locationsDisabledCondition?.actions?.some(
            (ac) =>
              ac.action === ActionEnum.UPDATE &&
              user?.role?._id &&
              !ac.permissionsRoles.includes(user.role._id)
          );
          return (
            <div
              className={
                isUpdateDisabled ? "opacity-50 cursor-not-allowed" : ""
              }
            >
              <SwitchButton
                checked={row?.active}
                onChange={() => {
                  if (isUpdateDisabled) return;
                  updateLocation({
                    id: row._id,
                    updates: {
                      active: !row?.active,
                    },
                  });
                }}
              />
            </div>
          );
        },
      },
      {
        key: "activityNote",
        className: "min-w-32 pr-1",
        node: (row: any) => {
          return <p>{row.activityNote || "-"}</p>;
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
        type: InputTypes.COLOR,
        formKey: "backgroundColor",
        label: t("Background Color"),
        placeholder: t("Background Color"),
        required: !!form?.type?.includes(1),
      }
    ],
    [t, isAddModalOpen, form?.type]
  );

  const editInputs = useMemo(
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
        isDisabled: !form?.type?.includes(1),
      },
      {
        type: InputTypes.TEXT,
        formKey: "phoneNumber",
        label: t("Phone Number"),
        placeholder: t("Phone Number"),
        required: false,
      },
      {
        type: InputTypes.TEXT,
        formKey: "googleMapsUrl",
        label: t("Map Location"),
        placeholder: t("Map Location"),
        required: false,
      },
      {
        type: InputTypes.TEXT,
        formKey: "ikasId",
        label: "Ikas ID",
        placeholder: "Ikas ID",
        required: false,
      },
      {
        type: InputTypes.COLOR,
        formKey: "backgroundColor",
        label: t("Background Color"),
        placeholder: t("Background Color"),
        required: !!form?.type?.includes(1),
      },
      {
        type: InputTypes.DAILYHOURS,
        formKey: "dailyHours",
        label: t("Daily Opening Hours"),
        placeholder: t("Daily Opening Hours"),
        required: false,
        isDisabled: !form?.type?.includes(1),
      },
      {
        type: InputTypes.TEXTAREA,
        formKey: "activityNote",
        label: t("Activity Note"),
        placeholder: t("Activity Note"),
        required: false,
      }
    ],
    [t, form?.type]
  );

  const formKeys = useMemo(
    () => [
      { key: "name", type: FormKeyTypeEnum.STRING },
      { key: "tableCount", type: FormKeyTypeEnum.NUMBER },
      { key: "phoneNumber", type: FormKeyTypeEnum.STRING },
      { key: "googleMapsUrl", type: FormKeyTypeEnum.STRING },
      { key: "ikasId", type: FormKeyTypeEnum.STRING },
      { key: "backgroundColor", type: FormKeyTypeEnum.COLOR },
      { key: "dailyHours", type: FormKeyTypeEnum.STRING },
      { key: "activityNote", type: FormKeyTypeEnum.STRING },
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
      isDisabled: locationsDisabledCondition?.actions?.some(
        (ac) =>
          ac.action === ActionEnum.ADD &&
          user?.role?._id &&
          !ac.permissionsRoles.includes(user.role._id)
      ),
    }),
    [
      t,
      isAddModalOpen,
      inputs,
      formKeys,
      createStockLocation,
      locationsDisabledCondition,
      user,
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
            inputs={editInputs}
            setForm={setForm}
            formKeys={formKeys}
            submitItem={updateLocation as any}
            isEditMode={true}
            topClassName="flex flex-col gap-2 "
            itemToEdit={{ id: Number(rowToAction._id), updates: rowToAction }}
            generalClassName="max-h-[90vh] overflow-y-auto"
          />
        ) : null,
        isModalOpen: isEditModalOpen,
        setIsModal: setIsEditModalOpen,
        isPath: false,
        isDisabled: locationsDisabledCondition?.actions?.some(
          (ac) =>
            ac.action === ActionEnum.UPDATE &&
            user?.role?._id &&
            !ac.permissionsRoles.includes(user.role._id)
        ),
      },
    ],
    [
      t,
      rowToAction,
      isEditModalOpen,
      editInputs,
      formKeys,
      updateLocation,
      locationsDisabledCondition,
      user,
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
          isActionsActive={true}
        />
      </div>
    </>
  );
};

export default LocationPage;
