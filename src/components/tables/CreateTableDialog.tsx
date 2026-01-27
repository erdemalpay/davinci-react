import { Dialog, Transition } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/solid";
import { Input } from "@material-tailwind/react";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";
import { useLocationContext } from "../../context/Location.context";
import { useForm } from "../../hooks/useForm";
import { Table } from "../../types";
import { useTableMutations } from "../../utils/api/table";
import { GenericButton } from "../common/GenericButton";
import TextInput from "../panelComponents/FormElements/TextInput";

export function CreateTableDialog({
  isOpen,
  close,
  isOnlineSale = false,
  type,
}: {
  isOpen: boolean;
  close: () => void;
  isOnlineSale?: boolean;
  type: string;
}) {
  const { t } = useTranslation();
  const { selectedLocationId } = useLocationContext();
  const date = format(new Date(), "yyyy-MM-dd");
  const startHour = format(new Date(), "HH:mm");
  const initialTable: Partial<Table> = {
    name: "",
    date,
    location: selectedLocationId,
    playerCount: 2,
    startHour,
    gameplays: [],
    tables: [],
  };
  const { data, handleUpdate } = useForm(initialTable);
  const { createTable } = useTableMutations();

  async function handleCreate(isAddEntryOrder: boolean) {
    const tableData = {
      ...data,
      ...(isOnlineSale && { isOnlineSale: true }),
      isAutoEntryAdded: isAddEntryOrder,
      type: type,
    };
    createTable({
      tableDto: tableData,
    } as any);
    close();
  } // this will be set with proper payload but for now it is any

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
            className="w-full h-full bg-gray-500 bg-opacity-50 z-0 absolute inset-0"
          />
          <div className="mx-auto container">
            <div className="flex items-center justify-center h-full w-full">
              <div className="bg-white rounded-md shadow fixed overflow-y-auto sm:h-auto w-10/12 md:w-8/12 lg:w-1/2 2xl:w-2/5">
                <div className="bg-gray-100 rounded-tl-md rounded-tr-md px-4 md:px-8 md:py-4 py-7 flex items-center justify-between">
                  <p className="text-base font-semibold">Create New Table</p>
                  <GenericButton onClick={close} variant="icon">
                    <XMarkIcon className="h-6 w-6" />
                  </GenericButton>
                </div>
                <div className="px-4 md:px-10 md:pt-4 md:pb-4 pb-8">
                  <div className="flex flex-col gap-4">
                    <Input
                      variant="standard"
                      name="name"
                      label="Table Name"
                      type="text"
                      onChange={handleUpdate}
                    />
                    <TextInput
                      label={t("Player Count")}
                      placeholder={t("Player Count")}
                      type="number"
                      value={data.playerCount}
                      isNumberButtonsActive={true}
                      isOnClearActive={false}
                      minNumber={0}
                      onChange={(value) => {
                        handleUpdate({
                          target: {
                            name: "playerCount",
                            value,
                          },
                        } as any);
                      }}
                    />
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Input
                      name="startHour"
                      variant="standard"
                      label="Start Time"
                      type="time"
                      value={data.startHour}
                      onChange={handleUpdate}
                    ></Input>
                    <Input
                      name="finishHour"
                      variant="standard"
                      label="End Time"
                      type="time"
                      onChange={handleUpdate}
                    />
                  </div>
                  <div className="flex items-center justify-end gap-2 mt-9">
                    <GenericButton
                      onClick={close}
                      variant="secondary"
                      size="md"
                      className="shadow"
                    >
                      {t("Cancel")}
                    </GenericButton>
                    <GenericButton
                      disabled={!data.name}
                      variant="black"
                      size="md"
                      className="shadow"
                      onClick={() => handleCreate(false)}
                    >
                      {t("Create Without Entry")}
                    </GenericButton>
                    <GenericButton
                      disabled={!data.name}
                      variant="black"
                      size="md"
                      className="shadow"
                      onClick={() => handleCreate(true)}
                    >
                      {t("Create With Entry")}
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
