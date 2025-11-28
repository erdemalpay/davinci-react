import { Dialog, Transition } from "@headlessui/react";
import { useTranslation } from "react-i18next";
import { GenericButton } from "../common/GenericButton";
import { Reservation, ReservationStatusEnum } from "../../types/index";

export function ReservationCallDialog({
  isOpen,
  close,
  handle,
  reservation,
}: {
  isOpen: boolean;
  close: () => void;
  handle: (status: ReservationStatusEnum) => void;
  reservation?: Reservation;
}) {
  const { t } = useTranslation();
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
                  <p className="text-base font-semibold">{t("Reservation called")}</p>
                </div>
                <div className="p-4 text-center">
                  {t("You called {{name}} ({{phone}}).", {
                    name: reservation?.name,
                    phone: reservation?.phone,
                  })}
                  <div className="flex items-center justify-between mt-9">
                    <GenericButton
                      onClick={() => handle(ReservationStatusEnum.NOT_COMING)}
                      variant="danger"
                      size="sm"
                    >
                      {t("Not coming")}
                    </GenericButton>
                    <GenericButton
                      onClick={() =>
                        handle(ReservationStatusEnum.NOT_RESPONDED)
                      }
                      variant="secondary"
                      size="sm"
                    >
                      {t("Not responded")}
                    </GenericButton>
                    <GenericButton
                      onClick={() => handle(ReservationStatusEnum.COMING)}
                      variant="primary"
                      size="sm"
                      className="bg-green-500 hover:bg-green-600"
                    >
                      {t("Coming")}
                    </GenericButton>
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
