import { Dialog, Transition } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/solid";
import { format } from "date-fns";
import { Table } from "../../types";
import { useForm } from "../../hooks/useForm";
import { useTableMutations } from "../../utils/api/table";
import { Input } from "@material-tailwind/react";
import { LocationContext } from "../../context/LocationContext";
import { useContext } from "react";

export function CreateTableDialog({
  isOpen,
  close,
}: {
  isOpen: boolean;
  close: () => void;
}) {
  const { selectedLocationId } = useContext(LocationContext);
  const date = format(new Date(), "yyyy-MM-dd");
  const startHour = format(new Date(), "HH:mm");
  const initialTable: Partial<Table> = {
    name: "",
    date,
    location: selectedLocationId,
    playerCount: 0,
    startHour,
    gameplays: [],
  };
  const { data, handleUpdate } = useForm(initialTable);
  const { createTable } = useTableMutations();

  async function handleCreate() {
    createTable(data);
    close();
  }

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
            className="w-full h-full bg-gray-900 z-0 absolute inset-0"
          />
          <div className="mx-auto container">
            <div className="flex items-center justify-center h-full w-full">
              <div className="bg-white rounded-md shadow fixed overflow-y-auto sm:h-auto w-10/12 md:w-8/12 lg:w-1/2 2xl:w-2/5">
                <div className="bg-gray-100 rounded-tl-md rounded-tr-md px-4 md:px-8 md:py-4 py-7 flex items-center justify-between">
                  <p className="text-base font-semibold">Create New Table</p>
                  <button onClick={close} className="focus:outline-none">
                    <XMarkIcon className="h-6 w-6" />
                  </button>
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
                    <Input
                      name="playerCount"
                      variant="standard"
                      label="Player Count"
                      type="number"
                      min={0}
                      value={data.playerCount}
                      onChange={handleUpdate}
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
                  <div className="flex items-center justify-between mt-9">
                    <button
                      onClick={close}
                      className="px-6 py-3 bg-gray-400 hover:bg-gray-500 shadow rounded text-sm text-white"
                    >
                      Cancel
                    </button>
                    <button
                      disabled={!data.name}
                      className="px-6 py-3 bg-gray-800 hover:bg-opacity-80 shadow rounded text-sm text-white disabled:bg-gray-300"
                      onClick={handleCreate}
                    >
                      Create Table
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
