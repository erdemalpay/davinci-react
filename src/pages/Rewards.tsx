import { format } from "date-fns";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { FaCheck } from "react-icons/fa6";
import { FiEdit } from "react-icons/fi";
import { HiOutlineTrash } from "react-icons/hi2";
import { IoLockOpenOutline } from "react-icons/io5";
import { ConfirmationDialog } from "../components/common/ConfirmationDialog";
import { Header } from "../components/header/Header";
import GenericAddEditPanel from "../components/panelComponents/FormElements/GenericAddEditPanel";
import GenericTable from "../components/panelComponents/Tables/GenericTable";
import SwitchButton from "../components/panelComponents/common/SwitchButton";
import {
  FormKeyTypeEnum,
  InputTypes,
} from "../components/panelComponents/shared/types";
import { useUserContext } from "../context/User.context";
import { ActionEnum, DisabledConditionEnum, Reward } from "../types";
import { useGetDisabledConditions } from "../utils/api/panelControl/disabledCondition";
import { useGetRewards, useRewardMutations } from "../utils/api/reward";
import { getItem } from "../utils/getItem";
import { formatAsLocalDate } from "../utils/format";

export default function Rewards() {
  const { t } = useTranslation();
  const rewards = useGetRewards();
  const { user } = useUserContext();
  const disabledConditions = useGetDisabledConditions();
  const today = format(new Date(), "yyyy-MM-dd");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [rowToAction, setRowToAction] = useState<Reward>();
  const { deleteReward, updateReward, createReward } = useRewardMutations();
  const [
    isCloseAllConfirmationDialogOpen,
    setIsCloseAllConfirmationDialogOpen,
  ] = useState(false);
  const [showExpiredRewards, setShowExpiredRewards] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const rewardsDisabledCondition = useMemo(() => {
    return getItem(DisabledConditionEnum.REWARDS, disabledConditions);
  }, [disabledConditions]);

  const inputs = useMemo(
    () => [
      {
        type: InputTypes.TEXT,
        formKey: "name",
        label: t("Name"),
        placeholder: t("Name"),
        required: true,
      },
      {
        type: InputTypes.DATE,
        formKey: "startDate",
        label: t("Start Date"),
        placeholder: t("Start Date"),
        required: true,
      },
      {
        type: InputTypes.DATE,
        formKey: "endDate",
        label: t("End Date"),
        placeholder: t("End Date"),
        required: true,
      },
    ],
    [t]
  );

  const formKeys = useMemo(
    () => [
      { key: "name", type: FormKeyTypeEnum.STRING },
      { key: "startDate", type: FormKeyTypeEnum.DATE },
      { key: "endDate", type: FormKeyTypeEnum.DATE },
    ],
    []
  );

  const columns = useMemo(
    () => [
      { key: t("Name"), isSortable: true },
      { key: t("Start Date"), isSortable: true },
      { key: t("End Date"), isSortable: true },
      { key: t("Actions"), isSortable: false },
    ],
    [t]
  );

  const rowKeys = useMemo(
    () => [
      { key: "name", className: "min-w-40 pr-1" },
      {
        key: "startDate",
        className: "min-w-32",
        node: (row: Reward) => {
          return formatAsLocalDate(row.startDate);
        },
      },
      {
        key: "endDate",
        className: "min-w-32",
        node: (row: Reward) => {
          return formatAsLocalDate(row.endDate);
        },
      },
    ],
    []
  );
  const addButton = useMemo(
    () => ({
      name: t("Add Reward"),
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
      isDisabled: rewardsDisabledCondition?.actions?.some(
        (ac) =>
          ac.action === ActionEnum.ADD &&
          user?.role?._id &&
          !ac?.permissionsRoles?.includes(user?.role?._id)
      ),
    }),
    [t, isAddModalOpen, inputs, formKeys, createReward, rewardsDisabledCondition, user]
  );
  const actions = useMemo(
    () => [
      {
        name: "markUsed",
        isModal: false,
        isPath: false,
        icon: null,
        node: (row: Reward) => {
          const isSetUnusedDisabled = rewardsDisabledCondition?.actions?.some(
            (ac) =>
              ac.action === ActionEnum.SET_UNUSED &&
              user?.role?._id &&
              !ac?.permissionsRoles?.includes(user?.role?._id)
          );
          const isSetUsedDisabled = rewardsDisabledCondition?.actions?.some(
            (ac) =>
              ac.action === ActionEnum.SET_USED &&
              user?.role?._id &&
              !ac?.permissionsRoles?.includes(user?.role?._id)
          );

          if (row.used && !isSetUnusedDisabled) {
            return (
              <button
                onClick={() => {
                  updateReward({ id: row._id, updates: { used: false } });
                }}
                title={t("Set unused")}
                className="cursor-pointer"
              >
                <IoLockOpenOutline className="text-green-500 w-6 h-6 mt-2" />
              </button>
            );
          } else if (!row.used && !isSetUsedDisabled) {
            return (
              <button
                onClick={() => {
                  updateReward({ id: row._id, updates: { used: true } });
                }}
                title={t("Set used")}
                className="cursor-pointer"
              >
                <FaCheck className="text-green-500 w-6 h-6 mt-2" />
              </button>
            );
          }
          return null;
        },
      },
      {
        name: t("Delete"),
        isModal: false,
        isPath: false,
        icon: null,
        node: (row: Reward) => {
          const isDeleteDisabled = rewardsDisabledCondition?.actions?.some(
            (ac) =>
              ac.action === ActionEnum.DELETE &&
              user?.role?._id &&
              !ac?.permissionsRoles?.includes(user?.role?._id)
          );

          if (isDeleteDisabled) return null;

          return (
            <>
              <button
                onClick={() => {
                  setRowToAction(row);
                  setIsCloseAllConfirmationDialogOpen(true);
                }}
                className="text-red-500 cursor-pointer"
              >
                <HiOutlineTrash className="text-2xl" />
              </button>
              {rowToAction?._id === row._id && (
                <ConfirmationDialog
                  isOpen={isCloseAllConfirmationDialogOpen}
                  close={() => setIsCloseAllConfirmationDialogOpen(false)}
                  confirm={() => {
                    deleteReward(rowToAction?._id);
                    setIsCloseAllConfirmationDialogOpen(false);
                  }}
                  title="Delete Reward"
                  text={`${rowToAction.name} ${t("GeneralDeleteMessage")}`}
                />
              )}
            </>
          );
        },
      },
      {
        name: t("Edit"),
        isModal: false,
        isPath: false,
        icon: null,
        node: (row: Reward) => {
          const isUpdateDisabled = rewardsDisabledCondition?.actions?.some(
            (ac) =>
              ac.action === ActionEnum.UPDATE &&
              user?.role?._id &&
              !ac?.permissionsRoles?.includes(user?.role?._id)
          );

          if (isUpdateDisabled) return null;

          return (
            <>
              <button
                onClick={() => {
                  setRowToAction(row);
                  setIsEditModalOpen(true);
                }}
                className="text-blue-500 cursor-pointer"
              >
                <FiEdit className="text-xl" />
              </button>
              {rowToAction?._id === row._id && (
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
              )}
            </>
          );
        },
      },
    ],
    [
      t,
      updateReward,
      rowToAction,
      isCloseAllConfirmationDialogOpen,
      deleteReward,
      isEditModalOpen,
      inputs,
      formKeys,
      rewardsDisabledCondition,
      user,
    ]
  );
  const filters = useMemo(
    () => [
      {
        label: t("Show Expired/Used Rewards"),
        isUpperSide: false,
        node: (
          <SwitchButton
            checked={showExpiredRewards}
            onChange={setShowExpiredRewards}
          />
        ),
        isDisabled: rewardsDisabledCondition?.actions?.some(
          (ac) =>
            ac.action === ActionEnum.SHOW_EXPIRED_OR_USED_REWARDS &&
            user?.role?._id &&
            !ac?.permissionsRoles?.includes(user?.role?._id)
        ),
      },
    ],
    [t, showExpiredRewards, rewardsDisabledCondition, user]
  );

  const filteredRewards = useMemo(() => {
    if (!showExpiredRewards) {
      return rewards?.filter(
        (reward) => reward.endDate >= today && !reward.used
      );
    } else if (showExpiredRewards) {
      return rewards;
    }
  }, [showExpiredRewards, rewards, today]);

  return (
    <>
      <Header showLocationSelector={false} />
      <div className="w-[98%] mx-auto my-10">
        <GenericTable
          rowKeys={rowKeys}
          actions={actions}
          isActionsActive={true}
          columns={columns}
          filters={filters}
          rows={filteredRewards as Reward[]}
          title={t("Free Entrance Rewards")}
          addButton={addButton}
        />
      </div>
    </>
  );
}
