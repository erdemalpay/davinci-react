import { Switch } from "@headlessui/react";
import { FormEvent, useEffect, useState } from "react";
import { HiOutlineTrash } from "react-icons/hi2";
import { toast } from "react-toastify";
import { ConfirmationDialog } from "../components/common/ConfirmationDialog";
import { Header } from "../components/header/Header";
import GenericAddEditPanel from "../components/panelComponents/FormElements/GenericAddEditPanel";
import GenericTable from "../components/panelComponents/Tables/GenericTable";
import {
  FormKeyTypeEnum,
  InputTypes,
} from "../components/panelComponents/shared/types";
import { Membership } from "../types";
import {
  useGetMemberships,
  useMembershipMutations,
} from "../utils/api/membership";

import { formatDate } from "../utils/dateUtil";

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
export default function NewMembership() {
  const { deleteMembership, updateMembership, createMembership } =
    useMembershipMutations();
  const memberships = useGetMemberships();
  const [showExpiredMemberships, setShowExpiredMemberships] = useState(false);
  const [
    isCloseAllConfirmationDialogOpen,
    setIsCloseAllConfirmationDialogOpen,
  ] = useState(false);
  const [rowToAction, setRowToAction] = useState<Membership>();
  const [tableKey, setTableKey] = useState(0);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const today = formatDate(new Date());
  function updateMembershipHandler(
    event: FormEvent<HTMLInputElement>,
    item?: Membership
  ) {
    if (!item) return;
    const target = event.target as HTMLInputElement;
    if (!target.value) return;

    updateMembership({
      id: item._id,
      updates: { [target.name]: target.value },
    });
    toast.success(`Membership ${item.name} updated`);
  }
  const columns = ["Name", "Start Date", "End Date", "Actions"];

  const rowKeys = [
    { key: "name", className: "min-w-40" },
    { key: "startDate", className: "min-w-32" },
    { key: "endDate", className: "min-w-32" },
  ];
  const actions = [
    {
      name: "Delete",
      icon: <HiOutlineTrash />,
      setRow: setRowToAction,
      modal: rowToAction ? (
        <ConfirmationDialog
          isOpen={isCloseAllConfirmationDialogOpen}
          close={() => setIsCloseAllConfirmationDialogOpen(false)}
          confirm={() => {
            deleteMembership(rowToAction?._id);
            setIsCloseAllConfirmationDialogOpen(false);
          }}
          title="Delete Item"
          text={`${rowToAction.name} will be deleted. Are you sure you want to continue?`}
        />
      ) : null,
      className: "text-red-500 cursor-pointer text-2xl",
      isModal: true,
      isModalOpen: isCloseAllConfirmationDialogOpen,
      setIsModal: setIsCloseAllConfirmationDialogOpen,
      isPath: false,
    },
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
        submitItem={createMembership as any}
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

  const filters = [
    {
      label: "Show Expired Memberships",
      node: (
        <Switch
          checked={showExpiredMemberships}
          onChange={() => setShowExpiredMemberships((value) => !value)}
          className={`${showExpiredMemberships ? "bg-green-500" : "bg-red-500"}
          relative inline-flex h-[20px] w-[36px] min-w-[36px] border-[1px] cursor-pointer rounded-full border-transparent transition-colors duration-200 ease-in-out focus:outline-none`}
        >
          <span
            aria-hidden="true"
            className={`${
              showExpiredMemberships ? "translate-x-4" : "translate-x-0"
            }
            pointer-events-none inline-block h-[18px] w-[18px] transform rounded-full bg-white transition duration-200 ease-in-out`}
          />
        </Switch>
      ),
    },
  ];
  const filteredRewards = () => {
    if (!showExpiredMemberships) {
      return memberships?.filter((membership) => membership.endDate >= today);
    } else if (showExpiredMemberships) {
      return memberships;
    }
  };
  useEffect(() => {
    setTableKey((prev) => prev + 1);
  }, [showExpiredMemberships, memberships]);

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
          rows={filteredRewards() as Membership[]}
          title="Memberships"
          addButton={addButton}
        />
      </div>
    </>
  );
}
