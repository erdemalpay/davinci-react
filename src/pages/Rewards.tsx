import { Switch } from "@headlessui/react";
import { LockOpenIcon, TrashIcon } from "@heroicons/react/24/outline";
import { CheckIcon } from "@heroicons/react/24/solid";
import { Tooltip } from "@material-tailwind/react";
import { format } from "date-fns";
import { FormEvent, useState } from "react";
import { toast } from "react-toastify";
import { EditableText } from "../components/common/EditableText";
import { Header } from "../components/header/Header";
import { CreateRewardDialog } from "../components/rewards/CreateRewardDialog";
import { Reward } from "../types";
import { useGetRewards, useRewardMutations } from "../utils/api/reward";

export default function Rewards() {
  const { deleteReward, updateReward, createReward } = useRewardMutations();

  const rewards = useGetRewards();

  const [isCreateRewardDialogOpen, setIsCreateRewardDialogOpen] =
    useState(false);

  const [showExpiredRewards, setShowExpiredRewards] = useState(false);

  const today = format(new Date(), "yyyy-MM-dd");

  function updateRewardHandler(
    event: FormEvent<HTMLInputElement>,
    item?: Reward
  ) {
    if (!item) return;
    const target = event.target as HTMLInputElement;
    if (!target.value) return;

    updateReward({
      id: item._id,
      updates: { [target.name]: target.value },
    });
    toast.success(`Reward ${item.name} updated`);
  }

  const columns = [
    {
      id: "name",
      header: "Name",
      cell: (row: Reward) => (
        <EditableText
          name="name"
          text={row.name}
          onUpdate={updateRewardHandler}
          item={row}
        />
      ),
    },
    {
      id: "startDate",
      header: "Start Date",
      cell: (row: Reward) => (
        <EditableText
          name="startDate"
          text={row.startDate}
          onUpdate={updateRewardHandler}
          item={row}
          type="date"
        />
      ),
    },
    {
      id: "endDate",
      header: "End Date",
      cell: (row: Reward) => (
        <EditableText
          name="endDate"
          text={row.endDate}
          onUpdate={updateRewardHandler}
          item={row}
          type="date"
        />
      ),
    },
    {
      id: "markUsed",
      header: "",
      cell: (row: Reward) =>
        row.used ? (
          <Tooltip content="Set unused">
            <button
              onClick={() =>
                updateReward({ id: row._id, updates: { used: false } })
              }
            >
              <LockOpenIcon className="text-green-500 w-6 h-6" />
            </button>
          </Tooltip>
        ) : (
          <Tooltip content="Set used">
            <button
              onClick={() =>
                updateReward({ id: row._id, updates: { used: true } })
              }
            >
              <CheckIcon className="text-green-500 w-6 h-6" />
            </button>
          </Tooltip>
        ),
    },
    {
      id: "delete",
      header: "Action",
      cell: (row: Reward) => (
        <Tooltip content="Delete">
          <button onClick={() => deleteReward(row._id)}>
            <TrashIcon className="text-red-500 w-6 h-6" />
          </button>
        </Tooltip>
      ),
    },
  ];

  return (
    <>
      <Header showLocationSelector={false} />

      <div className="flex flex-col gap-4 mx-0 lg:mx-20">
        <div className="bg-white shadow w-full px-6 py-5 mt-4">
          <div className="mb-5 rounded-tl-lg rounded-tr-lg">
            <div className="flex items-center justify-between mb-4">
              <p className="text-base lg:text-2xl font-bold leading-normal text-gray-800">
                Free Entrance Rewards
              </p>
            </div>
          </div>
          <div className="h-full w-full">
            <div className="flex justify-end gap-x-4">
              <button
                onClick={() => setIsCreateRewardDialogOpen(true)}
                className="my-3 bg-white rounded border border-gray-800 text-gray-800 px-6 py-2 text-sm"
              >
                Add
              </button>
            </div>
            <div className="flex justify-end gap-4 items-center">
              <h1 className="text-md">Show Expired/Used Rewards</h1>
              <Switch
                checked={showExpiredRewards}
                onChange={() => setShowExpiredRewards((value) => !value)}
                className={`${
                  showExpiredRewards ? "bg-green-500" : "bg-red-500"
                }
          relative inline-flex h-[20px] w-[36px] border-[1px] cursor-pointer rounded-full border-transparent transition-colors duration-200 ease-in-out focus:outline-none`}
              >
                <span
                  aria-hidden="true"
                  className={`${
                    showExpiredRewards ? "translate-x-4" : "translate-x-0"
                  }
            pointer-events-none inline-block h-[18px] w-[18px] transform rounded-full bg-white transition duration-200 ease-in-out`}
                />
              </Switch>
            </div>

            <div className="w-full overflow-x-auto">
              <table className="w-full whitespace-nowrap">
                <thead>
                  <tr className="h-10 w-full text-sm leading-none text-gray-600">
                    {columns.map((column) => (
                      <th key={column.id} className="font-bold text-left">
                        <div className="flex gap-x-2">{column.header}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="w-full">
                  {rewards
                    ?.filter(
                      (reward) =>
                        showExpiredRewards ||
                        (reward.endDate >= today && !reward.used)
                    )
                    ?.map((reward) => (
                      <tr
                        key={reward._id}
                        className="h-10 text-sm leading-none text-gray-700 border-b border-t border-gray-200 bg-white hover:bg-gray-100"
                      >
                        {columns.map((column) => {
                          return (
                            <td key={column.id} className="">
                              {column.cell(reward)}
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
      {isCreateRewardDialogOpen && (
        <CreateRewardDialog
          isOpen={isCreateRewardDialogOpen}
          close={() => setIsCreateRewardDialogOpen(false)}
          createReward={createReward}
        />
      )}
    </>
  );
}
