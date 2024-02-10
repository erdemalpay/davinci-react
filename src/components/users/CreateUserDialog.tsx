import { Dialog, Transition } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/solid";
import { Input } from "@material-tailwind/react";
import { UseMutateFunction } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { useForm } from "../../hooks/useForm";
import { User } from "../../types/index";
import { usernamify } from "../../utils/string";

export function CreateUserDialog({
  isOpen,
  close,
  createUser,
}: {
  isOpen: boolean;
  close: () => void;
  createUser: UseMutateFunction<User, unknown, Partial<User>>;
}) {
  const { data, handleUpdate } = useForm({
    name: "",
    _id: "",
    active: true,
  });

  async function handleCreate() {
    createUser({
      ...data,
      _id: usernamify(data.name),
      active: true,
    });
    toast.success(`New user created for ${data.name}`);
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
          className="z-20 fixed w-full flex justify-center inset-0"
        >
          <div
            onClick={close}
            className="w-full h-full bg-gray-500 bg-opacity-50 z-0 absolute inset-0"
          />
          <div className="mx-auto container">
            <div className="flex items-center justify-center h-full w-full">
              <div className="bg-white rounded-md shadow fixed overflow-y-auto sm:h-auto w-10/12 md:w-8/12 lg:w-1/2 2xl:w-2/5">
                <div className="bg-gray-100 rounded-tl-md rounded-tr-md px-4 md:px-8 md:py-4 py-7 flex items-center justify-between">
                  <p className="text-base font-semibold">Create User</p>
                  <button onClick={close} className="focus:outline-none">
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
                <div className="px-4 lg:px-10 flex flex-col mt-4 gap-2">
                  <Input
                    variant="standard"
                    name="name"
                    label="Name"
                    type="text"
                    value={data.name}
                    onChange={handleUpdate}
                  />
                  <div className="flex flex-col lg:flex-row gap-2 mt-4">
                    <Input
                      variant="standard"
                      name="_id"
                      label="Username"
                      type="text"
                      value={usernamify(data.name)}
                      onChange={handleUpdate}
                      readOnly
                    />
                  </div>
                  <div className="flex items-center justify-between my-4">
                    <button
                      onClick={close}
                      className="px-6 py-3 bg-gray-400 hover:bg-gray-500 shadow rounded text-sm text-white"
                    >
                      Cancel
                    </button>
                    <button
                      className="px-6 py-3 bg-gray-800 hover:bg-opacity-80 shadow rounded text-sm text-white disabled:bg-gray-300"
                      onClick={handleCreate}
                      disabled={!data.name}
                    >
                      Create
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
