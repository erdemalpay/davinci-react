import { Switch } from "@headlessui/react";
import { addMonths, format } from "date-fns";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { FiEdit } from "react-icons/fi";
import { HiOutlineTrash } from "react-icons/hi2";
import { ConfirmationDialog } from "../components/common/ConfirmationDialog";
import { Header } from "../components/header/Header";
import GenericAddEditPanel from "../components/panelComponents/FormElements/GenericAddEditPanel";
import GenericTable from "../components/panelComponents/Tables/GenericTable";
import {
  FormKeyTypeEnum,
  InputTypes,
} from "../components/panelComponents/shared/types";
import { useUserContext } from "../context/User.context";
import {
  ActionEnum,
  DisabledConditionEnum,
  type Membership,
} from "../types";
import {
  useGetMemberships,
  useMembershipMutations,
} from "../utils/api/membership";
import { useGetDisabledConditions } from "../utils/api/panelControl/disabledCondition";
import { formatDate } from "../utils/dateUtil";
import { formatAsLocalDate } from "../utils/format";
import { getItem } from "../utils/getItem";

export default function Memberships() {
  const { t } = useTranslation();
  const { deleteMembership, updateMembership, createMembership } =
    useMembershipMutations();
  const memberships = useGetMemberships();
  const { user } = useUserContext();
  const disabledConditions = useGetDisabledConditions();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showExpiredMemberships, setShowExpiredMemberships] = useState(false);
  const [
    isCloseAllConfirmationDialogOpen,
    setIsCloseAllConfirmationDialogOpen,
  ] = useState(false);
  const [rowToAction, setRowToAction] = useState<Membership>();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const today = formatDate(new Date());
  const membershipsDisabledCondition = useMemo(() => {
    return getItem(DisabledConditionEnum.MEMBERSHIPS, disabledConditions);
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
      { key: "name", className: "min-w-40" },
      {
        key: "startDate",
        className: "min-w-32",
        node: (row: Membership) => {
          return formatAsLocalDate(row.startDate);
        },
      },
      {
        key: "endDate",
        className: "min-w-32",
        node: (row: Membership) => {
          return formatAsLocalDate(row.endDate);
        },
      },
    ],
    []
  );
  const actions = useMemo(
    () => [
      {
        name: t("Delete"),
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
            title={t("Delete Membership")}
            text={`${rowToAction.name} ${t("GeneralDeleteMessage")}`}
          />
        ) : null,
        className: "text-red-500 cursor-pointer text-2xl",
        isModal: true,
        isModalOpen: isCloseAllConfirmationDialogOpen,
        setIsModal: setIsCloseAllConfirmationDialogOpen,
        isPath: false,
        isDisabled: membershipsDisabledCondition?.actions?.some(
          (ac) =>
            ac.action === ActionEnum.DELETE &&
            user?.role?._id &&
            !ac?.permissionsRoles?.includes(user?.role?._id)
        ),
      },
      {
        name: t("Edit"),
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
            folderName="user"
            submitItem={updateMembership as any}
            isEditMode={true}
            topClassName="flex flex-col gap-2 "
            itemToEdit={{
              id: rowToAction._id,
              updates: {
                ...rowToAction,
              },
            }}
          />
        ) : null,

        isModalOpen: isEditModalOpen,
        setIsModal: setIsEditModalOpen,

        isPath: false,
        isDisabled: membershipsDisabledCondition?.actions?.some(
          (ac) =>
            ac.action === ActionEnum.UPDATE &&
            user?.role?._id &&
            !ac?.permissionsRoles?.includes(user?.role?._id)
        ),
      },
    ],
    [
      t,
      rowToAction,
      isCloseAllConfirmationDialogOpen,
      deleteMembership,
      isEditModalOpen,
      inputs,
      formKeys,
      updateMembership,
      membershipsDisabledCondition,
      user,
    ]
  );
  const addButton = useMemo(
    () => ({
      name: t("Add Membership"),
      isModal: true,
      modal: (
        <GenericAddEditPanel
          isOpen={isAddModalOpen}
          close={() => setIsAddModalOpen(false)}
          inputs={inputs}
          formKeys={formKeys}
          submitItem={createMembership as any}
          topClassName="flex flex-col gap-2 "
          constantValues={{
            startDate: format(new Date(), "yyyy-MM-dd"),
            endDate: format(addMonths(new Date(), 1), "yyyy-MM-dd"),
          }}
        />
      ),
      isModalOpen: isAddModalOpen,
      setIsModal: setIsAddModalOpen,
      isPath: false,
      icon: null,
      className: "bg-blue-500 hover:text-blue-500 hover:border-blue-500",
      isDisabled: membershipsDisabledCondition?.actions?.some(
        (ac) =>
          ac.action === ActionEnum.ADD &&
          user?.role?._id &&
          !ac?.permissionsRoles?.includes(user?.role?._id)
      ),
    }),
    [
      t,
      isAddModalOpen,
      inputs,
      formKeys,
      createMembership,
      membershipsDisabledCondition,
      user,
    ]
  );

  const filters = useMemo(() => {
    const isShowExpiredDisabled =
      membershipsDisabledCondition?.actions?.some(
        (ac) =>
          ac.action === ActionEnum.SHOW_EXPIRED_MEMBERSHIPS &&
          user?.role?._id &&
          !ac?.permissionsRoles?.includes(user?.role?._id)
      ) ?? false;

    return [
      {
        label: t("Show Expired Memberships"),
        isUpperSide: false,
        node: (
          <Switch
            checked={showExpiredMemberships}
            disabled={isShowExpiredDisabled}
            onChange={() => {
              if (isShowExpiredDisabled) {
                return;
              }
              setShowExpiredMemberships((value) => !value);
            }}
            className={`${showExpiredMemberships ? "bg-green-500" : "bg-red-500"} ${
              isShowExpiredDisabled ? "opacity-50 cursor-not-allowed" : ""
            }
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
        isDisabled: isShowExpiredDisabled,
      },
    ];
  }, [t, showExpiredMemberships, membershipsDisabledCondition, user]);

  const filteredRows = useMemo(() => {
    if (!showExpiredMemberships) {
      return memberships?.filter((membership) => membership.endDate >= today);
    } else if (showExpiredMemberships) {
      return memberships;
    }
  }, [showExpiredMemberships, memberships, today]);

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
          rows={filteredRows as Membership[]}
          title={t("Memberships")}
          addButton={addButton}
        />
      </div>
    </>
  );
}
