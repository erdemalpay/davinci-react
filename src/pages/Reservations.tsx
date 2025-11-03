import { format } from "date-fns";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { FaCheck, FaPhone } from "react-icons/fa6";
import { FiEdit } from "react-icons/fi";
import { IoLockOpenOutline } from "react-icons/io5";
import { MdCancel } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import { GenericButton } from "../components/common/GenericButton";
import { Header } from "../components/header/Header";
import GenericAddEditPanel from "../components/panelComponents/FormElements/GenericAddEditPanel";
import ButtonTooltip from "../components/panelComponents/Tables/ButtonTooltip";
import GenericTable from "../components/panelComponents/Tables/GenericTable";
import { H5 } from "../components/panelComponents/Typography";
import SwitchButton from "../components/panelComponents/common/SwitchButton";
import {
  FormKeyTypeEnum,
  InputTypes,
} from "../components/panelComponents/shared/types";
import { ReservationCallDialog } from "../components/reservations/ReservationCallDialog";
import { CreateTableDialog } from "../components/tables/CreateTableDialog";
import { useLocationContext } from "../context/Location.context";
import { Routes } from "../navigation/constants";
import {
  ActionEnum,
  DisabledConditionEnum,
  Reservation,
  ReservationStatusEnum,
  TableTypes,
} from "../types";
import {
  useGetReservations,
  useReservationCallMutations,
  useReservationMutations,
  useUpdateReservationsOrderMutation,
} from "../utils/api/reservations";
import { useUserContext } from "../context/User.context";
import { useGetDisabledConditions } from "../utils/api/panelControl/disabledCondition";
import { getItem } from "../utils/getItem";

export default function Reservations() {
  const { t } = useTranslation();
  const reservations = useGetReservations();
  const navigate = useNavigate();
  const { mutate: updateReservationsOrder } =
    useUpdateReservationsOrderMutation();
  const [hideCompletedReservations, setHideCompletedReservations] =
    useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [rowToAction, setRowToAction] = useState<Reservation>();
  const { updateReservation, createReservation } = useReservationMutations();
  const [selectedReservation, setSelectedReservation] = useState<Reservation>();
  const { updateReservationCall } = useReservationCallMutations();
  const { selectedLocationId } = useLocationContext();
  const { user } = useUserContext();
  const disabledConditions = useGetDisabledConditions();
  const [isReservationCalledDialogOpen, setIsReservationCalledDialogOpen] =
    useState(false);
  const [isCreateTableDialogOpen, setIsCreateTableDialogOpen] = useState(false);

  const reservationsDisabledCondition = useMemo(() => {
    return getItem(DisabledConditionEnum.RESERVATIONS, disabledConditions);
  }, [disabledConditions]);

  function isCompleted(reservation: Reservation) {
    return [
      ReservationStatusEnum.NOT_COMING,
      ReservationStatusEnum.ALREADY_CAME,
      ReservationStatusEnum.CANCELLED,
    ].includes(reservation.status);
  }
  function handleCallResponse(value: ReservationStatusEnum) {
    if (!selectedReservation) return;
    updateReservationCall({
      id: selectedReservation._id,
      updates: {
        status: value,
      },
    });

    setIsReservationCalledDialogOpen(false);
  }

  function isCalled(reservation: Reservation) {
    return [
      ReservationStatusEnum.COMING,
      ReservationStatusEnum.NOT_COMING,
      ReservationStatusEnum.ALREADY_CAME,
    ].includes(reservation.status);
  }
  function getBgColor(reservation: Reservation) {
    switch (reservation.status) {
      case ReservationStatusEnum.WAITING:
        return "bg-white";
      case ReservationStatusEnum.NOT_COMING:
        return "bg-red-200";
      case ReservationStatusEnum.COMING:
        return "bg-blue-100";
      case ReservationStatusEnum.ALREADY_CAME:
        return "bg-green-100 ";
      case ReservationStatusEnum.NOT_RESPONDED:
        return "bg-yellow-100";
      case ReservationStatusEnum.CANCELLED:
        return "bg-red-100";
      default:
        return "bg-gray-100";
    }
  }
  const handleDrag = (DragRow: Reservation, DropRow: Reservation) => {
    updateReservationsOrder({
      id: DragRow._id,
      newOrder: DropRow.order,
    });
  };

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
        type: InputTypes.TEXT,
        formKey: "phone",
        label: t("Phone"),
        placeholder: t("Phone"),
        required: true,
        additionalType: "phone",
      },
      {
        type: InputTypes.TIME,
        formKey: "reservationHour",
        label: t("Reservation Time"),
        placeholder: t("Reservation Time"),
        required: true,
      },
      {
        type: InputTypes.TEXT,
        formKey: "reservedTable",
        label: t("Reserved Table"),
        placeholder: t("Reserved Table"),
        required: false,
      },
      {
        type: InputTypes.NUMBER,
        formKey: "playerCount",
        label: t("Player Count"),
        placeholder: t("Player Count"),
        required: false,
        minNumber: 0,
        isNumberButtonsActive: true,
        isOnClearActive: false,
      },
      {
        type: InputTypes.TEXTAREA,
        formKey: "note",
        label: t("Note"),
        placeholder: t("Note"),
        required: false,
      },
    ],
    [t]
  );

  const formKeys = useMemo(
    () => [
      { key: "name", type: FormKeyTypeEnum.STRING },
      { key: "phone", type: FormKeyTypeEnum.STRING },
      { key: "reservationHour", type: FormKeyTypeEnum.STRING },
      { key: "reservedTable", type: FormKeyTypeEnum.STRING },
      { key: "playerCount", type: FormKeyTypeEnum.NUMBER },
      { key: "location", type: FormKeyTypeEnum.NUMBER },
      { key: "note", type: FormKeyTypeEnum.STRING },
    ],
    []
  );

  const columns = useMemo(
    () => [
      { key: t("Name"), isSortable: true },
      { key: t("Phone"), isSortable: true },
      { key: t("Time"), isSortable: true },
      { key: t("Table"), isSortable: true },
      { key: t("Player Count"), isSortable: true },
      { key: t("Call Hour"), isSortable: true },
      { key: t("Approved Hour"), isSortable: true },
      { key: t("Status"), isSortable: true },
      { key: t("Note"), isSortable: true },
      { key: t("Actions"), isSortable: false },
    ],
    [t]
  );

  const rowKeys = useMemo(
    () => [
      {
        key: "name",
        className: "min-w-32 pr-1",
      },
      {
        key: "phone",
        className: "min-w-40",
      },
      {
        key: "reservationHour",
        className: "min-w-32",
      },
      {
        key: "reservedTable",
        className: "min-w-32",
      },
      {
        key: "playerCount",
        className: "min-w-32",
      },
      { key: "callHour" },
      { key: "approvedHour" },
      {
        key: "status",
        className: "min-w-32",
      },
      {
        key: "note",
        className: "min-w-32",
      },
    ],
    []
  );
  const actions = useMemo(
    () => [
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
            submitItem={updateReservation as any}
            isEditMode={true}
            topClassName="flex flex-col gap-2 "
            itemToEdit={{ id: rowToAction._id, updates: rowToAction }}
          />
        ) : null,

        isModalOpen: isEditModalOpen,
        setIsModal: setIsEditModalOpen,
        isPath: false,
        isDisabled: reservationsDisabledCondition?.actions?.some(
          (ac) =>
            ac.action === ActionEnum.UPDATE &&
            user?.role?._id &&
            !ac?.permissionsRoles?.includes(user?.role?._id)
        ),
      },
      {
        name: t("Called"),
        icon: null,
        isModal: false,
        isPath: false,
        setRow: setRowToAction,
        node: (row: Reservation) =>
          !isCompleted(row) && !isCalled(row) ? (
            <ButtonTooltip content={t("Called")}>
              <button
                className="text-blue-500 hover:text-blue-600 cursor-pointer p-1"
                onClick={() => {
                  setSelectedReservation(row);
                  setIsReservationCalledDialogOpen(true);
                }}
              >
                <FaPhone className="text-lg" />
              </button>
            </ButtonTooltip>
          ) : null,
        isDisabled: reservationsDisabledCondition?.actions?.some(
          (ac) =>
            ac.action === ActionEnum.CALLED &&
            user?.role?._id &&
            !ac?.permissionsRoles?.includes(user?.role?._id)
        ),
      },

      {
        name: "comeAction",
        icon: null,
        isModal: false,
        isPath: false,
        node: (row: Reservation) =>
          !isCompleted(row) ? (
            <ButtonTooltip content={t("Group has come")}>
              <button
                className="text-green-500 hover:text-green-600 cursor-pointer p-1"
                onClick={() => {
                  const now = new Date();
                  const hours = String(now.getHours()).padStart(2, "0");
                  const minutes = String(now.getMinutes()).padStart(2, "0");
                  const approvedHour = `${hours}:${minutes}`;
                  updateReservation({
                    id: row._id,
                    updates: {
                      status: ReservationStatusEnum.ALREADY_CAME,
                    },
                  });
                  setIsCreateTableDialogOpen(true);
                }}
              >
                <FaCheck className="text-xl" />
              </button>
            </ButtonTooltip>
          ) : null,
        isDisabled: reservationsDisabledCondition?.actions?.some(
          (ac) =>
            ac.action === ActionEnum.GROUP_CAME &&
            user?.role?._id &&
            !ac?.permissionsRoles?.includes(user?.role?._id)
        ),
      },
      {
        name: "cancelAction",
        icon: null,
        isModal: false,
        isPath: false,
        node: (row: Reservation) =>
          !isCompleted(row) ? (
            <ButtonTooltip content={t("Cancel")}>
              <button
                className="text-red-500 hover:text-red-600 cursor-pointer p-1"
                onClick={() => {
                  updateReservation({
                    id: row._id,
                    updates: { status: ReservationStatusEnum.CANCELLED },
                  });
                }}
              >
                <MdCancel className="text-xl" />
              </button>
            </ButtonTooltip>
          ) : null,
        isDisabled: reservationsDisabledCondition?.actions?.some(
          (ac) =>
            ac.action === ActionEnum.CANCEL &&
            user?.role?._id &&
            !ac?.permissionsRoles?.includes(user?.role?._id)
        ),
      },
      {
        name: "revertAction",
        icon: null,
        isModal: false,
        isPath: false,
        setRow: setRowToAction,
        isDisabled:
          (rowToAction && isCompleted(rowToAction)) ||
          reservationsDisabledCondition?.actions?.some(
            (ac) =>
              ac.action === ActionEnum.OPENBACK &&
              user?.role?._id &&
              !ac?.permissionsRoles?.includes(user?.role?._id)
          ),
        node: (row: Reservation) =>
          isCompleted(row) ? (
            <ButtonTooltip content={t("Open back")}>
              <button
                className="text-green-500 hover:text-green-600 cursor-pointer p-1"
                onClick={() => {
                  updateReservation({
                    id: row._id,
                    updates: { status: ReservationStatusEnum.WAITING },
                  });
                }}
              >
                <IoLockOpenOutline className="text-xl" />
              </button>
            </ButtonTooltip>
          ) : null,
      },
    ],
    [
      t,
      rowToAction,
      isEditModalOpen,
      inputs,
      formKeys,
      updateReservation,
      setSelectedReservation,
      setIsReservationCalledDialogOpen,
      setIsCreateTableDialogOpen,
      reservationsDisabledCondition,
      user,
    ]
  );

  const filters = useMemo(
    () => [
      {
        label: t("Hide Completed Reservations"),
        isUpperSide: false,
        node: (
          <SwitchButton
            checked={hideCompletedReservations}
            onChange={setHideCompletedReservations}
          />
        ),
        isDisabled: reservationsDisabledCondition?.actions?.some(
          (ac) =>
            ac.action === ActionEnum.HIDE_COMPLETED_RESERVATIONS &&
            user?.role?._id &&
            !ac?.permissionsRoles?.includes(user?.role?._id)
        ),
      },
      {
        isUpperSide: true,
        node: (
          <GenericButton
            variant="primary"
            size="sm"
            onClick={() => navigate(Routes.Tables)}
          >
            <H5>{t("Show Tables")}</H5>
          </GenericButton>
        ),
        isDisabled: reservationsDisabledCondition?.actions?.some(
          (ac) =>
            ac.action === ActionEnum.SHOW_TABLES &&
            user?.role?._id &&
            !ac?.permissionsRoles?.includes(user?.role?._id)
        ),
      },
    ],
    [t, hideCompletedReservations, navigate, reservationsDisabledCondition, user]
  );
  const addButton = useMemo(
    () => ({
      name: t(`Add Reservation`),
      isModal: true,
      modal: (
        <GenericAddEditPanel
          isOpen={isAddModalOpen}
          close={() => setIsAddModalOpen(false)}
          inputs={inputs}
          formKeys={formKeys}
          constantValues={{
            location: selectedLocationId,
            reservationHour: format(new Date(), "HH:mm"),
            playerCount: 0,
          }}
          submitItem={createReservation as any}
          topClassName="flex flex-col gap-2 "
        />
      ),
      isModalOpen: isAddModalOpen,
      setIsModal: setIsAddModalOpen,
      isPath: false,
      icon: null,
      className: "bg-blue-500 hover:text-blue-500 hover:border-blue-500 ",
      isDisabled: reservationsDisabledCondition?.actions?.some(
        (ac) =>
          ac.action === ActionEnum.ADD &&
          user?.role?._id &&
          !ac?.permissionsRoles?.includes(user?.role?._id)
      ),
    }),
    [
      t,
      isAddModalOpen,
      inputs,
      formKeys,
      selectedLocationId,
      createReservation,
      reservationsDisabledCondition,
      user,
    ]
  );

  const filteredReservations = useMemo(() => {
    if (hideCompletedReservations) {
      return reservations.filter((reservation) => !isCompleted(reservation));
    } else if (!hideCompletedReservations) {
      return reservations;
    }
  }, [reservations, hideCompletedReservations]);

  return (
    <>
      <Header showLocationSelector={true} />
      <div className="w-[98%] mx-auto my-10">
        <GenericTable
          rows={filteredReservations as Reservation[]}
          rowKeys={rowKeys}
          actions={actions}
          columns={columns}
          filters={filters}
          isActionsActive={true}
          title={t("Reservations")}
          addButton={addButton}
          rowClassNameFunction={getBgColor}
          isDraggable={true}
          onDragEnter={(DragRow, DropRow) => handleDrag(DragRow, DropRow)}
        />
        {isReservationCalledDialogOpen && (
          <ReservationCallDialog
            isOpen={isReservationCalledDialogOpen}
            close={() => setIsReservationCalledDialogOpen(false)}
            handle={handleCallResponse}
            reservation={selectedReservation}
          />
        )}
        {isCreateTableDialogOpen && (
          <CreateTableDialog
            isOpen={isCreateTableDialogOpen}
            close={() => setIsCreateTableDialogOpen(false)}
            type={TableTypes.NORMAL}
          />
        )}
      </div>
    </>
  );
}
