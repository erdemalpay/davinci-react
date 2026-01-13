import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { FiEdit } from "react-icons/fi";
import { HiOutlineTrash } from "react-icons/hi2";
import { CheckSwitch } from "../components/common/CheckSwitch";
import { ConfirmationDialog } from "../components/common/ConfirmationDialog";
import { Header } from "../components/header/Header";
import GenericAddEditPanel from "../components/panelComponents/FormElements/GenericAddEditPanel";
import GenericTable from "../components/panelComponents/Tables/GenericTable";
import SwitchButton from "../components/panelComponents/common/SwitchButton";
import {
  FormKeyTypeEnum,
  InputTypes,
} from "../components/panelComponents/shared/types";
import { useUserContext } from "../context/User.context";
import {
  ActionEnum,
  DisabledConditionEnum,
} from "../types";
import {
  useCafeActivityMutations,
  useGetCafeActivitys,
} from "../utils/api/cafeActivity";
import { useGetStoreLocations } from "../utils/api/location";
import { useGetDisabledConditions } from "../utils/api/panelControl/disabledCondition";
import { formatAsLocalDate } from "../utils/format";
import { getItem } from "../utils/getItem";

const CafeActivity = () => {
  const cafeActivities = useGetCafeActivitys();
  const locations = useGetStoreLocations();
  const { t } = useTranslation();
  const { user } = useUserContext();
  const { createCafeActivity, deleteCafeActivity, updateCafeActivity } =
    useCafeActivityMutations();
  const disabledConditions = useGetDisabledConditions();
  const [rowToAction, setRowToAction] = useState<any>();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [
    isCloseAllConfirmationDialogOpen,
    setIsCloseAllConfirmationDialogOpen,
  ] = useState(false);
  const [showCompletedCafeActivities, setShowCompletedActivities] =
    useState(false);

  const cafeActivitiesDisabledCondition = useMemo(() => {
    return getItem(DisabledConditionEnum.CAFE_ACTIVITIES, disabledConditions);
  }, [disabledConditions]);

  const rows = useMemo(() => {
    return (
      cafeActivities
        ?.filter(
          (cafeActivity) =>
            !cafeActivity.isCompleted || showCompletedCafeActivities
        )
        ?.map((cafeActivity) => ({
          ...cafeActivity,
          formattedDate: formatAsLocalDate(cafeActivity.date),
          locationName: getItem(cafeActivity.location, locations)?.name,
        })) ?? []
    );
  }, [cafeActivities, showCompletedCafeActivities, locations]);

  const columns = useMemo(
    () => [
      { key: t("Date"), isSortable: true },
      { key: t("Location"), isSortable: true },
      { key: t("Hour"), isSortable: true },
      { key: t("Person Count"), isSortable: true },
      { key: t("Price"), isSortable: true },
      { key: t("Group Name"), isSortable: true },
      { key: t("Complimentary"), isSortable: true },
      { key: t("Actions"), isSortable: true },
    ],
    [t]
  );

  const rowKeys = useMemo(
    () => [
      { key: "date", node: (row: any) => row.formattedDate },
      { key: "locationName" },
      { key: "hour" },
      { key: "personCount" },
      { key: "price" },
      { key: "groupName" },
      { key: "complimentary" },
    ],
    []
  );

  const inputs = useMemo(
    () => [
      {
        type: InputTypes.DATE,
        formKey: "date",
        label: t("Date"),
        placeholder: t("Date"),
        required: true,
      },
      {
        type: InputTypes.SELECT,
        formKey: "location",
        label: t("Location"),
        options: locations.map((input) => ({
          value: input._id,
          label: input.name,
        })),
        placeholder: t("Location"),
        required: true,
      },
      {
        type: InputTypes.HOUR,
        formKey: "hour",
        label: t("Hour"),
        required: true,
      },
      {
        type: InputTypes.NUMBER,
        formKey: "personCount",
        label: t("Person Count"),
        placeholder: t("Person Count"),
        required: true,
      },
      {
        type: InputTypes.NUMBER,
        formKey: "price",
        label: t("Price"),
        placeholder: t("Price"),
        required: true,
      },
      {
        type: InputTypes.TEXT,
        formKey: "groupName",
        label: t("Group Name"),
        placeholder: t("Group Name"),
        required: true,
      },
      {
        type: InputTypes.TEXT,
        formKey: "complimentary",
        label: t("Complimentary"),
        placeholder: t("Complimentary"),
        required: false,
      },
    ],
    [t, locations]
  );

  const formKeys = useMemo(
    () => [
      { key: "date", type: FormKeyTypeEnum.DATE },
      { key: "location", type: FormKeyTypeEnum.NUMBER },
      { key: "hour", type: FormKeyTypeEnum.STRING },
      { key: "personCount", type: FormKeyTypeEnum.NUMBER },
      { key: "price", type: FormKeyTypeEnum.NUMBER },
      { key: "groupName", type: FormKeyTypeEnum.STRING },
      { key: "complimentary", type: FormKeyTypeEnum.STRING },
      { key: "isCompleted", type: FormKeyTypeEnum.BOOLEAN },
    ],
    []
  );

  const addButton = useMemo(
    () => ({
      name: t(`Add Activity`),
      isModal: true,
      modal: (
        <GenericAddEditPanel
          isOpen={isAddModalOpen}
          close={() => setIsAddModalOpen(false)}
          inputs={inputs}
          formKeys={formKeys}
          constantValues={{ isCompleted: false }}
          submitItem={createCafeActivity as any}
          generalClassName="overflow-visible "
          topClassName="flex flex-col gap-2 "
        />
      ),
      isModalOpen: isAddModalOpen,
      setIsModal: setIsAddModalOpen,
      isPath: false,
      icon: null,
      isDisabled: cafeActivitiesDisabledCondition?.actions?.some(
        (ac) =>
          ac.action === ActionEnum.ADD &&
          user?.role?._id &&
          !ac?.permissionsRoles?.includes(user?.role?._id)
      ),
      className: "bg-blue-500 hover:text-blue-500 hover:border-blue-500 ",
    }),
    [
      t,
      isAddModalOpen,
      inputs,
      formKeys,
      createCafeActivity,
      cafeActivitiesDisabledCondition,
      user,
    ]
  );

  const actions = useMemo(
    () => [
      {
        name: t("Delete"),
        icon: <HiOutlineTrash />,
        setRow: setRowToAction,
        modal: rowToAction ? (
          <ConfirmationDialog
            isOpen={isCloseAllConfirmationDialogOpen}
            close={() => setIsCloseAllConfirmationDialogOpen(false)}
            confirm={() => {
              deleteCafeActivity(rowToAction?._id);
              setIsCloseAllConfirmationDialogOpen(false);
            }}
            title={t("Delete Activity")}
            text={`${rowToAction.groupName} ${t("GeneralDeleteMessage")}`}
          />
        ) : null,
        className: "text-red-500 cursor-pointer text-2xl  ",
        isModal: true,
        isModalOpen: isCloseAllConfirmationDialogOpen,
        setIsModal: setIsCloseAllConfirmationDialogOpen,
        isPath: false,
        isDisabled: cafeActivitiesDisabledCondition?.actions?.some(
          (ac) =>
            ac.action === ActionEnum.DELETE &&
            user?.role?._id &&
            !ac?.permissionsRoles?.includes(user?.role?._id)
        ),
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
            inputs={inputs}
            formKeys={formKeys}
            submitItem={updateCafeActivity as any}
            isEditMode={true}
            topClassName="flex flex-col gap-2 "
            itemToEdit={{ id: rowToAction._id, updates: rowToAction }}
          />
        ) : null,
        isModalOpen: isEditModalOpen,
        setIsModal: setIsEditModalOpen,
        isPath: false,
        isDisabled: cafeActivitiesDisabledCondition?.actions?.some(
          (ac) =>
            ac.action === ActionEnum.UPDATE &&
            user?.role?._id &&
            !ac?.permissionsRoles?.includes(user?.role?._id)
        ),
      },
      {
        name: t("Toggle Active"),
        icon: null,
        node: (row: any) => (
          <div className="mt-2 mr-auto">
            <CheckSwitch
              checked={row.isCompleted}
              onChange={() => {
                updateCafeActivity({
                  id: row._id,
                  updates: {
                    isCompleted: !row.isCompleted,
                  },
                });
              }}
            ></CheckSwitch>
          </div>
        ),
        isDisabled: cafeActivitiesDisabledCondition?.actions?.some(
          (ac) =>
            ac.action === ActionEnum.TOGGLE &&
            user?.role?._id &&
            !ac?.permissionsRoles?.includes(user?.role?._id)
        ),
      },
    ],
    [
      t,
      rowToAction,
      isCloseAllConfirmationDialogOpen,
      deleteCafeActivity,
      isEditModalOpen,
      inputs,
      formKeys,
      updateCafeActivity,
      cafeActivitiesDisabledCondition,
      user,
    ]
  );

  const filters = useMemo(
    () => [
      {
        label: t("Show Completed Activities"),
        isUpperSide: true,
        node: (
          <SwitchButton
            checked={showCompletedCafeActivities}
            onChange={setShowCompletedActivities}
          />
        ),
        isDisabled: cafeActivitiesDisabledCondition?.actions?.some(
          (ac) =>
            ac.action === ActionEnum.SHOW_COMPLETED_ACTIVITIES &&
            user?.role?._id &&
            !ac?.permissionsRoles?.includes(user?.role?._id)
        ),
      },
    ],
    [t, showCompletedCafeActivities, cafeActivitiesDisabledCondition, user]
  );

  return (
    <>
      <Header showLocationSelector={false} />
      <div className="w-[98%] mx-auto my-10">
        <GenericTable
          rowKeys={rowKeys}
          actions={actions}
          isActionsActive={true}
          columns={columns}
          filters={filters}
          rows={rows}
          title={t("Activities")}
          addButton={addButton}
        />
      </div>
    </>
  );
};

export default CafeActivity;
