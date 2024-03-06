import { Switch } from "@headlessui/react";
import { format } from "date-fns";
import { FormEvent, useEffect, useState } from "react";
import { FaCheck } from "react-icons/fa6";
import { FiEdit } from "react-icons/fi";
import { HiOutlineTrash } from "react-icons/hi2";
import { IoLockOpenOutline } from "react-icons/io5";
import { toast } from "react-toastify";
import { ConfirmationDialog } from "../components/common/ConfirmationDialog";
import { Header } from "../components/header/Header";
import GenericAddEditPanel from "../components/panelComponents/FormElements/GenericAddEditPanel";
import ButtonTooltip from "../components/panelComponents/Tables/ButtonTooltip";
import GenericTable from "../components/panelComponents/Tables/GenericTable";
import {
  FormKeyTypeEnum,
  InputTypes,
} from "../components/panelComponents/shared/types";
import { Reward } from "../types";
import { useGetRewards, useRewardMutations } from "../utils/api/reward";

const inputs = [
  {
    type: InputTypes.TEXT,
    formKey: "name",
    label: "Name",
    placeholder: "Name",
    required: true,
  },
  {
    type: InputTypes.DATE,
    formKey: "startDate",
    label: "Start Date",
    placeholder: "Start Date",
    required: true,
  },
  {
    type: InputTypes.DATE,
    formKey: "endDate",
    label: "End Date",
    placeholder: "End Date",
    required: true,
  },
];
const formKeys = [
  { key: "name", type: FormKeyTypeEnum.STRING },
  { key: "startDate", type: FormKeyTypeEnum.DATE },
  { key: "endDate", type: FormKeyTypeEnum.DATE },
];
export default function Rewards() {
  const rewards = useGetRewards();
  const today = format(new Date(), "yyyy-MM-dd");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { deleteReward, updateReward, createReward } = useRewardMutations();
  const [
    isCloseAllConfirmationDialogOpen,
    setIsCloseAllConfirmationDialogOpen,
  ] = useState(false);
  const [rowToAction, setRowToAction] = useState<Reward>();
  const [showExpiredRewards, setShowExpiredRewards] = useState(false);
  const [tableKey, setTableKey] = useState(0);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const columns = [
    { key: "Name", isSortable: true },
    { key: "Start Date", isSortable: true },
    { key: "End Date", isSortable: true },
    { key: "Actions", isSortable: false },
  ];

  const rowKeys = [
    { key: "name", className: "min-w-40" },
    { key: "startDate", className: "min-w-32" },
    { key: "endDate", className: "min-w-32" },
  ];
  const addButton = {
    name: `Add`,
    isModal: true,
    modal: (
      <GenericAddEditPanel
        isOpen={isAddModalOpen}
        close={() => setIsAddModalOpen(false)}
        inputs={inputs}
        formKeys={formKeys}
        submitItem={createReward as any}
        topClassName="flex flex-col gap-2 "
        constantValues={{ used: false }}
      />
    ),
    isModalOpen: isAddModalOpen,
    setIsModal: setIsAddModalOpen,
    isPath: false,
    icon: null,
    className: "bg-blue-500 hover:text-blue-500 hover:border-blue-500",
  };
  const actions = [
    {
      name: "markUsed",
      isModal: false,
      isPath: false,
      icon: null,
      node: (row: Reward) =>
        row.used ? (
          <ButtonTooltip content="Set unused">
            <button
              onClick={() => {
                updateReward({ id: row._id, updates: { used: false } });
              }}
            >
              <IoLockOpenOutline className="text-green-500 w-6 h-6" />
            </button>
          </ButtonTooltip>
        ) : (
          <ButtonTooltip content="Set used">
            <button
              onClick={() => {
                updateReward({ id: row._id, updates: { used: true } });
              }}
            >
              <FaCheck className="text-green-500 w-6 h-6" />
            </button>
          </ButtonTooltip>
        ),
    },
    {
      name: "Delete",
      icon: <HiOutlineTrash />,
      setRow: setRowToAction,
      modal: rowToAction ? (
        <ConfirmationDialog
          isOpen={isCloseAllConfirmationDialogOpen}
          close={() => setIsCloseAllConfirmationDialogOpen(false)}
          confirm={() => {
            deleteReward(rowToAction?._id);
            setIsCloseAllConfirmationDialogOpen(false);
          }}
          title="Delete Reward"
          text={`${rowToAction.name} will be deleted. Are you sure you want to continue?`}
        />
      ) : null,
      className: "text-red-500 cursor-pointer text-2xl",
      isModal: true,
      isModalOpen: isCloseAllConfirmationDialogOpen,
      setIsModal: setIsCloseAllConfirmationDialogOpen,
      isPath: false,
    },
    {
      name: "Edit",
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
          submitItem={updateReward as any}
          isEditMode={true}
          topClassName="flex flex-col gap-2 "
          itemToEdit={{ id: rowToAction._id, updates: rowToAction }}
        />
      ) : null,

      isModalOpen: isEditModalOpen,
      setIsModal: setIsEditModalOpen,

      isPath: false,
    },
  ];

  const filters = [
    {
      label: "Show Expired/Used Rewards",
      node: (
        <Switch
          checked={showExpiredRewards}
          onChange={() => {
            setShowExpiredRewards((value) => !value);
          }}
          className={`${showExpiredRewards ? "bg-green-500" : "bg-red-500"}
          relative inline-flex h-[20px] w-[36px] min-w-[36px] border-[1px] cursor-pointer rounded-full border-transparent transition-colors duration-200 ease-in-out focus:outline-none`}
        >
          <span
            aria-hidden="true"
            className={`${
              showExpiredRewards ? "translate-x-4" : "translate-x-0"
            }
            pointer-events-none inline-block h-[18px] w-[18px] transform rounded-full bg-white transition duration-200 ease-in-out`}
          />
        </Switch>
      ),
    },
  ];
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
  const filteredRewards = () => {
    if (!showExpiredRewards) {
      return rewards?.filter(
        (reward) => reward.endDate >= today && !reward.used
      );
    } else if (showExpiredRewards) {
      return rewards;
    }
  };
  useEffect(() => {
    setTableKey((prev) => prev + 1);
  }, [showExpiredRewards, rewards]);
  return (
    <>
      <Header showLocationSelector={false} />
      <div className="w-[90%] mx-auto my-10">
        <GenericTable
          key={tableKey}
          rowKeys={rowKeys}
          actions={actions}
          columns={columns}
          filters={filters}
          rows={filteredRewards() as Reward[]}
          title="Free Entrance Rewards"
          addButton={addButton}
        />
      </div>
    </>
  );
}
