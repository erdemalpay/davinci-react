import { Dialog, Transition } from "@headlessui/react";
import { Reservation, ReservationStatusEnum } from "../../types/index";

export function ReservationCallDialog({
  isOpen,
  close,
  handle,
  reservation,
  text = "",
}: {
  isOpen: boolean;
  close: () => void;
  handle: (status: ReservationStatusEnum) => void;
  reservation?: Reservation;
  text?: string;
}) {
  return (
    <Transition
      show={isOpen}
      enter="transition duration-100 ease-out"
      enterFrom="transform scale-95 opacity-0"
      enterTo="transform scale-100 opacity-100"
      leave="transition duration-75 ease-out"
      leaveFrom="transform scale-100 opacity-100"
      leaveTo="transform scale-95 opacity-0"
    >
      <Dialog onClose={() => close()}>
        <Dialog.Overlay />
        <div
          id="popup"
          className="z-50 fixed w-full flex justify-center inset-0"
        >
          <div
            onClick={close}
            className="w-full h-full bg-gray-900 bg-opacity-50 z-0 absolute inset-0"
          />
          <div className="mx-auto container">
            <div className="flex items-center justify-center h-full w-full">
              <div className="bg-white rounded-md shadow fixed overflow-y-auto sm:h-auto w-10/12 lg:w-2/5">
                <div className="bg-gray-100 rounded-tl-md rounded-tr-md px-4 md:px-8 md:py-4 py-7 flex items-center justify-center lg:justify-start">
                  <p className="text-base font-semibold">Reservation called</p>
                </div>
                <div className="p-4 text-center">
                  You called {reservation?.name} ({reservation?.phone}).
                  <div className="flex items-center justify-between mt-9">
                    <button
                      onClick={() => handle(ReservationStatusEnum.NOT_COMING)}
                      className="px-6 py-3 bg-red-500 hover:bg-opacity-80 shadow rounded text-sm text-white"
                    >
                      Not coming
                    </button>
                    <button
                      onClick={() =>
                        handle(ReservationStatusEnum.NOT_RESPONDED)
                      }
                      className="px-6 py-3 bg-gray-500 hover:bg-opacity-80 shadow rounded text-sm text-white"
                    >
                      Not responded
                    </button>
                    <button
                      className="px-6 py-3 bg-green-500 hover:bg-opacity-80 shadow rounded text-sm text-white"
                      onClick={() => handle(ReservationStatusEnum.COMING)}
                    >
                      Coming
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
