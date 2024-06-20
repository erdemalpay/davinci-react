import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FaCheck, FaPhone } from "react-icons/fa6";
import { FiEdit } from "react-icons/fi";
import { IoLockOpenOutline } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
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
import { AddReservationDialog } from "../components/reservations/AddReservationDialog";
import { ReservationCallDialog } from "../components/reservations/ReservationCallDialog";
import { CreateTableDialog } from "../components/tables/CreateTableDialog";
import { Routes } from "../navigation/constants";
import { Reservation, ReservationStatusEnum } from "../types/index";
import {
  useGetReservations,
  useReservationCallMutations,
  useReservationMutations,
} from "../utils/api/reservations";
export default function Reservations() {
  const { t } = useTranslation();
  const reservations = useGetReservations();
  const navigate = useNavigate();
  const [tableKey, setTableKey] = useState(0);
  const [hideCompletedReservations, setHideCompletedReservations] =
    useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateReservationDialogOpen, setIsCreateReservationDialogOpen] =
    useState(false);
  const [rowToAction, setRowToAction] = useState<Reservation>();
  const { updateReservation, createReservation } = useReservationMutations();
  const [selectedReservation, setSelectedReservation] = useState<Reservation>();
  const { updateReservationCall } = useReservationCallMutations();

  const [isReservationCalledDialogOpen, setIsReservationCalledDialogOpen] =
    useState(false);
  const [isCreateTableDialogOpen, setIsCreateTableDialogOpen] = useState(false);

  function isCompleted(reservation: Reservation) {
    return [
      ReservationStatusEnum.NOT_COMING,
      ReservationStatusEnum.ALREADY_CAME,
    ].includes(reservation.status);
  }
  function handleCallResponse(value: ReservationStatusEnum) {
    if (!selectedReservation) return;
    updateReservationCall({
      id: selectedReservation._id,
      updates: { status: value },
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
    }
  }
  const inputs = [
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
  ];
  const formKeys = [
    { key: "name", type: FormKeyTypeEnum.STRING },
    { key: "phone", type: FormKeyTypeEnum.STRING },
    { key: "reservationHour", type: FormKeyTypeEnum.STRING },
  ];
  const columns = [
    { key: t("Name"), isSortable: true },
    { key: t("Phone"), isSortable: true },
    { key: t("Time"), isSortable: true },
    { key: t("Reserved Table"), isSortable: true },
    { key: t("Status"), isSortable: true },
    { key: t("Actions"), isSortable: false },
  ];
  const rowKeys = [
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
      key: "status",
      className: "min-w-32",
    },
  ];
  const actions = [
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
              className="mt-2  min-w-6"
              onClick={() => {
                setSelectedReservation(row);
                setIsReservationCalledDialogOpen(true);
              }}
            >
              <FaPhone className="text-blue-500 cursor-pointer " />
            </button>
          </ButtonTooltip>
        ) : null,
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
              className="mt-2  min-w-6  "
              onClick={() => {
                updateReservation({
                  id: row._id,
                  updates: { status: ReservationStatusEnum.ALREADY_CAME },
                });
                setIsCreateTableDialogOpen(true);
              }}
            >
              <FaCheck className="text-green-500 text-xl cursor-pointer" />
            </button>
          </ButtonTooltip>
        ) : null,
    },
    {
      name: "revertAction",
      icon: null,
      isModal: false,
      isPath: false,
      setRow: setRowToAction,
      isDisabled: rowToAction && isCompleted(rowToAction),
      node: (row: Reservation) =>
        isCompleted(row) ? (
          <ButtonTooltip content={t("Open back")}>
            <button
              className="mt-2   "
              onClick={() => {
                updateReservation({
                  id: row._id,
                  updates: { status: ReservationStatusEnum.WAITING },
                });
              }}
            >
              <IoLockOpenOutline className="text-green-500 text-xl cursor-pointer" />
            </button>
          </ButtonTooltip>
        ) : null,
    },
  ];

  const filters = [
    {
      label: t("Hide Completed Reservations"),
      isUpperSide: false,
      node: (
        <SwitchButton
          checked={hideCompletedReservations}
          onChange={setHideCompletedReservations}
        />
      ),
    },
    {
      isUpperSide: true,
      node: (
        <button
          className={`px-2 sm:px-3 py-1 h-fit w-fit bg-blue-500 hover:text-blue-500 hover:border-blue-500
           text-white  hover:bg-white  transition-transform  border  rounded-md cursor-pointer`}
          onClick={() => navigate(Routes.Tables)}
        >
          <H5>{t("Show Tables")}</H5>
        </button>
      ),
    },
  ];
  const addButton = {
    name: t("Add Reservation"),
    isModal: true,
    modal: (
      <AddReservationDialog
        isOpen={isCreateReservationDialogOpen}
        close={() => setIsCreateReservationDialogOpen(false)}
        createReservation={createReservation}
      />
    ),
    isModalOpen: isCreateReservationDialogOpen,
    setIsModal: setIsCreateReservationDialogOpen,
    isPath: false,
    icon: null,
    className: "bg-blue-500 hover:text-blue-500 hover:border-blue-500",
  };
  const filteredReservations = () => {
    if (hideCompletedReservations) {
      return reservations.filter((reservation) => !isCompleted(reservation));
    } else if (!hideCompletedReservations) {
      return reservations;
    }
  };
  useEffect(() => {
    setTableKey((prev) => prev + 1);
  }, [reservations, hideCompletedReservations]);

  return (
    <>
      <Header showLocationSelector={false} />
      <div className="w-[90%] mx-auto my-10">
        <GenericTable
          key={tableKey}
          rows={filteredReservations() as Reservation[]}
          rowKeys={rowKeys}
          actions={actions}
          columns={columns}
          filters={filters}
          isActionsActive={true}
          title={t("Reservations")}
          addButton={addButton}
          rowClassNameFunction={getBgColor}
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
          />
        )}
      </div>
    </>
  );
}
