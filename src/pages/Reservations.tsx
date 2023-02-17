import { Switch } from "@headlessui/react";
import { LockOpenIcon } from "@heroicons/react/24/outline";
import { CheckIcon, PhoneIcon } from "@heroicons/react/24/solid";
import { Tooltip } from "@material-tailwind/react";
import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { EditableText } from "../components/common/EditableText";
import { Header } from "../components/header/Header";
import { AddReservationDialog } from "../components/reservations/AddReservationDialog";
import { ReservationCallDialog } from "../components/reservations/ReservationCallDialog";
import { CreateTableDialog } from "../components/tables/CreateTableDialog";
import { BaseRoutes } from "../navigation/routes";
import { Reservation, ReservationStatusEnum } from "../types/index";
import {
  useGetReservations,
  useReservationCallMutations,
  useReservationMutations,
} from "../utils/api/reservations";

export default function Reservations() {
  const reservations = useGetReservations();

  const navigate = useNavigate();

  const { updateReservation, createReservation } = useReservationMutations();

  const { updateReservationCall } = useReservationCallMutations();

  const [selectedReservation, setSelectedReservation] = useState<Reservation>();

  const [isCreateReservationDialogOpen, setIsCreateReservationDialogOpen] =
    useState(false);

  const [isReservationCalledDialogOpen, setIsReservationCalledDialogOpen] =
    useState(false);

  const [hideCompletedReservations, setHideCompletedReservations] =
    useState(false);

  const [isCreateTableDialogOpen, setIsCreateTableDialogOpen] = useState(false);

  function updateReservationHandler(
    event: FormEvent<HTMLInputElement>,
    item?: Reservation
  ) {
    if (!item) return;
    const target = event.target as HTMLInputElement;
    if (!target.value) return;
    if (target.name === "phone") {
      if (!target.value.match(/^[0-9]{11}$/)) {
        return toast.error("Check phone number.");
      }
    }
    updateReservation({
      id: item._id,
      updates: { [target.name]: target.value },
    });
    toast.success(`Reservation ${item.name} updated`);
  }

  function handleCallResponse(value: ReservationStatusEnum) {
    if (!selectedReservation) return;
    updateReservationCall({
      id: selectedReservation._id,
      updates: { status: value },
    });

    setIsReservationCalledDialogOpen(false);
  }

  function isCompleted(reservation: Reservation) {
    return [
      ReservationStatusEnum.NOT_COMING,
      ReservationStatusEnum.ALREADY_CAME,
    ].includes(reservation.status);
  }

  function isNotCompleted(reservation: Reservation) {
    return ![
      ReservationStatusEnum.NOT_COMING,
      ReservationStatusEnum.ALREADY_CAME,
    ].includes(reservation.status);
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
        return "bg-green-100";
      case ReservationStatusEnum.NOT_RESPONDED:
        return "bg-yellow-100";
    }
  }

  const reservationColumns = [
    {
      id: "name",
      header: "Name",
      cell: (row: Reservation) => (
        <EditableText
          name="name"
          text={row.name}
          onUpdate={updateReservationHandler}
          item={row}
        />
      ),
    },
    {
      id: "phone",
      header: "Phone",
      cell: (row: Reservation) => (
        <EditableText
          name="phone"
          text={row.phone}
          onUpdate={updateReservationHandler}
          item={row}
          type="phone"
        />
      ),
    },
    {
      id: "reservationHour",
      header: "Time",
      cell: (row: Reservation) => (
        <EditableText
          name="reservationHour"
          text={row.reservationHour}
          item={row}
          onUpdate={updateReservationHandler}
        />
      ),
    },
    {
      id: "reservedTable",
      header: "Table",
      cell: (row: Reservation) => {
        return row.status === ReservationStatusEnum.COMING ? (
          <EditableText
            name="reservedTable"
            text={row.reservedTable}
            onUpdate={updateReservationHandler}
            item={row}
          />
        ) : (
          <span>{row.reservedTable ? row.reservedTable : "-"}</span>
        );
      },
    },
    {
      id: "callCount",
      header: "Call Count",
      cell: (row: Reservation) => (
        <span>{row.callCount ? row.callCount : "-"}</span>
      ),
      hideOnMobile: true,
    },
    {
      id: "callTime",
      header: "Call Time",
      cell: (row: Reservation) => (
        <span>{row.callHour ? row.callHour : "-"}</span>
      ),
      hideOnMobile: true,
    },
    {
      id: "status",
      header: "Status",
      cell: (row: Reservation) => <span>{row.status}</span>,
    },
    {
      id: "callAction",
      header: "",
      hide: isCalled,
      cell: (row: Reservation) => (
        <div className="flex gap-4">
          <Tooltip content="Called">
            <button
              onClick={() => {
                setSelectedReservation(row);
                setIsReservationCalledDialogOpen(true);
              }}
            >
              <PhoneIcon className="text-blue-500 w-6 h-6" />
            </button>
          </Tooltip>
        </div>
      ),
    },
    {
      id: "comeAction",
      header: "",
      hide: isCompleted,
      cell: (row: Reservation) => (
        <div className="flex gap-4">
          <Tooltip content="Group has come">
            <button
              onClick={() => {
                updateReservation({
                  id: row._id,
                  updates: { status: ReservationStatusEnum.ALREADY_CAME },
                });
                setIsCreateTableDialogOpen(true);
              }}
            >
              <CheckIcon className="text-green-500 w-6 h-6" />
            </button>
          </Tooltip>
        </div>
      ),
    },
    {
      id: "revertAction",
      header: "",
      hide: isNotCompleted,
      cell: (row: Reservation) => (
        <div className="flex gap-4">
          <Tooltip content="Open back">
            <button
              onClick={() => {
                updateReservation({
                  id: row._id,
                  updates: { status: ReservationStatusEnum.WAITING },
                });
              }}
            >
              <LockOpenIcon className="text-green-500 w-6 h-6" />
            </button>
          </Tooltip>
        </div>
      ),
    },
  ];

  return (
    <>
      <Header showLocationSelector={true} />
      <div className="flex flex-col gap-4 mx-0 lg:mx-20 h-screen">
        <div className="bg-white shadow w-full px-6 py-5 mt-4 h-full">
          <div className="mb-5 rounded-tl-lg rounded-tr-lg">
            <div className="flex items-center justify-between mb-4">
              <p className="text-base lg:text-2xl font-bold leading-normal text-gray-800">
                Reservations
              </p>
            </div>
          </div>
          <div className="h-full w-full">
            <div className="flex justify-end gap-x-4">
              <button
                onClick={() => navigate(BaseRoutes.Tables)}
                className="my-3 bg-white transition duration-150 ease-in-out hover:border-gray-900 hover:text-gray-900 rounded border border-gray-800 text-gray-800 px-6 text-sm"
              >
                Show Tables
              </button>
              <button
                onClick={() => setIsCreateReservationDialogOpen(true)}
                className="my-3 bg-white rounded border border-gray-800 text-gray-800 px-6 py-2 text-sm"
              >
                Add Reservation
              </button>
            </div>
            <div className="flex justify-end gap-4 items-center">
              <h1 className="text-md">Hide Completed Reservations</h1>
              <Switch
                checked={hideCompletedReservations}
                onChange={() => setHideCompletedReservations((value) => !value)}
                className={`${
                  hideCompletedReservations ? "bg-green-500" : "bg-red-500"
                }
          relative inline-flex h-[20px] w-[36px] border-[1px] cursor-pointer rounded-full border-transparent transition-colors duration-200 ease-in-out focus:outline-none`}
              >
                <span
                  aria-hidden="true"
                  className={`${
                    hideCompletedReservations
                      ? "translate-x-4"
                      : "translate-x-0"
                  }
            pointer-events-none inline-block h-[18px] w-[18px] transform rounded-full bg-white transition duration-200 ease-in-out`}
                />
              </Switch>
            </div>
            <div className="w-full overflow-x-auto h-full">
              <table className="w-full whitespace-nowrap border border-gray-300 text-center">
                <thead>
                  <tr className="h-10 w-full text-sm leading-none text-gray-600">
                    {reservationColumns.map((column) => (
                      <th
                        key={column.id}
                        className={`font-bold text-left ${
                          column.hideOnMobile ? "hidden" : ""
                        }`}
                      >
                        <div className="justify-center flex gap-x-2">
                          {column.header}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="w-full">
                  {reservations
                    ?.filter(
                      (reservation) =>
                        !hideCompletedReservations || !isCompleted(reservation)
                    )
                    .map((reservation, index) => (
                      <tr
                        key={reservation._id}
                        className={`${getBgColor(
                          reservation
                        )} h-10 text-sm leading-none text-gray-700 border-b border-t border-gray-200 hover:bg-opacity-80`}
                      >
                        {reservationColumns.map((column) => {
                          return (
                            <td
                              key={column.id}
                              className={`${
                                isCompleted(reservation) ? "line-through" : ""
                              } ${column.hideOnMobile ? "hidden" : ""}`}
                            >
                              {!column.hide?.(reservation) &&
                                column.cell(reservation)}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      {isReservationCalledDialogOpen && (
        <ReservationCallDialog
          isOpen={isReservationCalledDialogOpen}
          close={() => setIsReservationCalledDialogOpen(false)}
          handle={handleCallResponse}
          reservation={selectedReservation}
        />
      )}
      {isCreateReservationDialogOpen && (
        <AddReservationDialog
          isOpen={isCreateReservationDialogOpen}
          close={() => setIsCreateReservationDialogOpen(false)}
          createReservation={createReservation}
        />
      )}
      {isCreateTableDialogOpen && (
        <CreateTableDialog
          isOpen={isCreateTableDialogOpen}
          close={() => setIsCreateTableDialogOpen(false)}
        />
      )}
    </>
  );
}
