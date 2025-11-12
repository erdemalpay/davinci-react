import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useUserContext } from "../../context/User.context";
import {
  ShiftChangeRequestType,
  ShiftChangeStatusEnum,
  ShiftChangeTypeEnum,
} from "../../types";
import { useGetStoreLocations } from "../../utils/api/location";
import {
  useCancelShiftChangeRequest,
  useGetMyShiftChangeRequests,
  useTargetApproveShiftChangeRequest,
  useTargetRejectShiftChangeRequest,
} from "../../utils/api/shiftChangeRequest";
import { useGetUsers } from "../../utils/api/user";
import { convertDateFormat } from "../../utils/format";
import ButtonFilter from "../panelComponents/common/ButtonFilter";
import SwitchButton from "../panelComponents/common/SwitchButton";
import { InputTypes } from "../panelComponents/shared/types";
import ButtonTooltip from "../panelComponents/Tables/ButtonTooltip";
import GenericTable from "../panelComponents/Tables/GenericTable";

const UserChangeRequestTab = () => {
  const { t } = useTranslation();
  const users = useGetUsers();
  const locations = useGetStoreLocations();
  const { user } = useUserContext();

  // UI state
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState<"PENDING" | "ALL">("PENDING");

  // Filter state
  const [filters, setFilters] = useState<any>({
    status: ShiftChangeStatusEnum.PENDING,
    after: "",
    before: "",
    requesterId: "",
    targetUserId: "",
    type: "",
    page: 1,
    limit: 50,
  });

  // Sync filters with tab
  const effectiveParams = useMemo(() => {
    const base = { ...filters, page: filters.page, limit: filters.limit };
    if (activeTab === "PENDING") {
      return { ...base, status: ShiftChangeStatusEnum.PENDING };
    }
    const { status, ...rest } = base;
    return rest;
  }, [filters, activeTab]);

  // Data
  const listResponse = useGetMyShiftChangeRequests(effectiveParams);
  const rows = listResponse?.data?.data || [];
  const hasManagerNote = rows.some(
    (row: ShiftChangeRequestType) =>
      !!row.managerNote && String(row.managerNote).trim().length > 0
  );

  // Approve/Reject mutations
  const { mutate: approve } = useTargetApproveShiftChangeRequest();
  const { mutate: reject } = useTargetRejectShiftChangeRequest();
  const { mutate: cancel } = useCancelShiftChangeRequest();
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  // Helpers
  const getUserName = (id?: string | { _id: string; name: string }) => {
    if (!id) return "-";
    if (typeof id === "object") return id.name || id._id || "-";
    return users?.find((u) => u._id === id)?.name || id || "-";
  };
  const getLocationName = (id?: number) =>
    locations?.find((l) => l._id === id)?.name || "-";

  const getTargetName = (row: ShiftChangeRequestType) =>
    typeof row.targetUserId === "object"
      ? row.targetUserId.name || row.targetUserId._id
      : getUserName(row.targetUserId);

  const getDerivedStatus = (row: ShiftChangeRequestType) => {
    const statusStr = String((row as any).status || "").toUpperCase();
    if (statusStr === "CANCELED" || statusStr === "CANCELLED") {
      return { text: t("UserCancelled"), cls: "bg-red-600" };
    }
    if (statusStr === "REJECTED") {
      return { text: t("Rejected"), cls: "bg-red-600" };
    }
    const manager = row.managerApprovalStatus;
    const target = row.targetUserApprovalStatus;
    if (manager === "REJECTED") {
      return { text: t("Rejected"), cls: "bg-red-600" };
    }
    if (manager === "APPROVED" && target === "PENDING") {
      return {
        text: t("Waiting {{name}}", { name: getTargetName(row) }),
        cls: "bg-amber-600",
      };
    }
    if (manager === "APPROVED" && target === "APPROVED") {
      return { text: t("Approved"), cls: "bg-green-600" };
    }
    return { text: t("Waiting Manager"), cls: "bg-amber-600" };
  };

  // Ayrı sütunlar: Talep Eden, Hedef, Tip, Kaynak, Hedef, Durum, Oluşturma, İşlemler
  const columns = [
    { key: t("Requester"), isSortable: false, correspondingKey: "requester" },
    { key: t("Target User"), isSortable: false, correspondingKey: "target" },
    { key: t("Type"), isSortable: false, correspondingKey: "type" },
    {
      key: t("Requester Shift"),
      isSortable: false,
      correspondingKey: "requesterShift",
    },
    {
      key: t("Target Shift"),
      isSortable: false,
      correspondingKey: "targetShift",
    },
    { key: t("Status"), isSortable: false, correspondingKey: "status" },
    {
      key: t("Manager Approval"),
      isSortable: false,
      correspondingKey: "managerApproved",
    },
    {
      key: t("Target Approval"),
      isSortable: false,
      correspondingKey: "targetUserApproved",
    },
    ...(hasManagerNote
      ? [
          {
            key: t("Manager Note"),
            isSortable: false,
            correspondingKey: "managerNote",
          },
        ]
      : []),
    {
      key: t("Requester Note"),
      isSortable: false,
      correspondingKey: "requesterNote",
    },
    { key: t("Actions"), isSortable: false, correspondingKey: "actions" },
  ];

  const baseRowKeys = [
    {
      key: "requester",
      node: (row: ShiftChangeRequestType) => {
        const id =
          typeof row.requesterId === "object"
            ? row.requesterId._id
            : row.requesterId;
        const color =
          users?.find((u) => u._id === id)?.role?.color || "#6B7280";
        return (
          <span
            className="px-2 py-1 rounded text-white"
            style={{ backgroundColor: color }}
          >
            {getUserName(row.requesterId)}
          </span>
        );
      },
    },
    {
      key: "target",
      node: (row: ShiftChangeRequestType) => {
        const id =
          typeof row.targetUserId === "object"
            ? row.targetUserId._id
            : row.targetUserId;
        const color =
          users?.find((u) => u._id === id)?.role?.color || "#6B7280";
        return (
          <span
            className="px-2 py-1 rounded text-white"
            style={{ backgroundColor: color }}
          >
            {getUserName(row.targetUserId)}
          </span>
        );
      },
    },
    {
      key: "type",
      node: (row: ShiftChangeRequestType) => (
        <span className="text-xs uppercase tracking-wide px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
          {t(row.type)}
        </span>
      ),
    },
    {
      key: "requesterShift",
      node: (row: ShiftChangeRequestType) => {
        const s = row.requesterShift;
        const loc = locations?.find((l) => l._id === s.location);
        return (
          <div className="text-sm">
            <div
              className="font-semibold leading-4"
              style={{ color: loc?.backgroundColor || "#6B7280" }}
            >
              {loc?.name || getLocationName(s.location)}
            </div>
            <div className="text-xs text-gray-700 leading-4">
              {convertDateFormat(s.day)}
            </div>
            <div className="text-xs text-gray-700 leading-4">
              {s.startTime}
              {s.endTime ? ` - ${s.endTime}` : ""}
            </div>
          </div>
        );
      },
    },
    {
      key: "targetShift",
      node: (row: ShiftChangeRequestType) => {
        const s = row.targetShift;
        const loc = locations?.find((l) => l._id === s.location);
        return (
          <div className="text-sm">
            <div
              className="font-semibold leading-4"
              style={{ color: loc?.backgroundColor || "#6B7280" }}
            >
              {loc?.name || getLocationName(s.location)}
            </div>
            <div className="text-xs text-gray-700 leading-4">
              {convertDateFormat(s.day)}
            </div>
            <div className="text-xs text-gray-700 leading-4">
              {s.startTime}
              {s.endTime ? ` - ${s.endTime}` : ""}
            </div>
          </div>
        );
      },
    },
    {
      key: "status",
      node: (row: ShiftChangeRequestType) => {
        const derived = getDerivedStatus(row);
        return <div className="text-sm">{derived.text}</div>;
      },
    },
    {
      key: "managerApproved",
      node: (row: ShiftChangeRequestType) => {
        const status = row.managerApprovalStatus || "PENDING";
        const map: Record<string, string> = {
          APPROVED: t("Approved"),
          REJECTED: t("Rejected"),
          PENDING: t("Pending"),
        };
        return <div className="text-sm">{map[status]}</div>;
      },
    },
    {
      key: "targetUserApproved",
      node: (row: ShiftChangeRequestType) => {
        const status = row.targetUserApprovalStatus || "PENDING";
        const map: Record<string, string> = {
          APPROVED: t("ApprovedByTargetUser"),
          REJECTED: t("RejectedByTargetUser"),
          PENDING: t("PendingByTargetUser"),
        };
        return <div className="text-sm">{map[status]}</div>;
      },
    },
  ];

  const rowKeys = [
    ...baseRowKeys,
    ...(hasManagerNote
      ? [
          {
            key: "managerNote",
            node: (row: ShiftChangeRequestType) => (
              <div className="text-sm max-w-xs break-words whitespace-pre-wrap">
                {row.managerNote || "-"}
              </div>
            ),
          },
        ]
      : []),
    {
      key: "requesterNote",
      node: (row: ShiftChangeRequestType) => (
        <div className="text-sm max-w-xs break-words whitespace-pre-wrap">
          {row.requesterNote || "-"}
        </div>
      ),
    },
    {
      key: "actions",
      node: (row: ShiftChangeRequestType) => {
        const currentUserId = user?._id;
        const requesterId =
          typeof row.requesterId === "object"
            ? row.requesterId._id
            : row.requesterId;
        const targetUserId =
          typeof row.targetUserId === "object"
            ? row.targetUserId._id
            : row.targetUserId;

        const isRequester = !!currentUserId && requesterId === currentUserId;
        const isTarget = !!currentUserId && targetUserId === currentUserId;

        const statusStr = String((row as any).status || "").toUpperCase();
        const isCanceled =
          statusStr === "CANCELED" || statusStr === "CANCELLED";
        const canTargetAct = row.targetUserApprovalStatus === "PENDING";
        const canRequesterCancel = row.status === "PENDING";

        if (isRequester) {
          return (
            <div className="flex flex-row gap-2 items-center">
              <ButtonTooltip content={t("Cancel")}>
                <button
                  aria-label={t("Cancel")}
                  title={t("Cancel")}
                  disabled={!canRequesterCancel || isCanceled}
                  className="p-2 rounded-full bg-red-600 text-white hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                  onClick={() => cancel({ id: row._id })}
                >
                  {/* use same reject icon */}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="h-4 w-4"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </ButtonTooltip>
            </div>
          );
        }

        if (isTarget) {
          return (
            <div className="flex flex-row gap-2 items-center">
              <ButtonTooltip content={t("Approve")}>
                <button
                  aria-label={t("Approve")}
                  title={t("Approve")}
                  disabled={!canTargetAct || isCanceled}
                  className="p-2 rounded-full bg-green-600 text-white hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                  onClick={() => approve({ id: row._id })}
                >
                  {/* check icon */}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="h-4 w-4"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-7.25 7.25a1 1 0 01-1.414 0l-3-3a1 1 0 111.414-1.414L8.5 11.336l6.543-6.543a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </ButtonTooltip>
              <ButtonTooltip content={t("Reject")}>
                <button
                  aria-label={t("Reject")}
                  title={t("Reject")}
                  disabled={!canTargetAct || isCanceled}
                  className="p-2 rounded-full bg-red-600 text-white hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                  onClick={() => reject({ id: row._id })}
                >
                  {/* x icon */}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="h-4 w-4"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </ButtonTooltip>
            </div>
          );
        }

        return null;
      },
    },
  ];

  const topFilters = [
    {
      isUpperSide: true,
      node: (
        <ButtonFilter
          buttonName={t("Pending Requests")}
          onclick={() => setActiveTab("PENDING")}
          backgroundColor="#F59E0B"
          isActive={activeTab === "PENDING"}
        />
      ),
    },
    {
      isUpperSide: true,
      node: (
        <ButtonFilter
          buttonName={t("All Changes")}
          onclick={() => setActiveTab("ALL")}
          backgroundColor="#6B7280"
          isActive={activeTab === "ALL"}
        />
      ),
    },
    {
      label: t("Show Filters"),
      isUpperSide: true,
      node: (
        <SwitchButton
          checked={showFilters}
          onChange={() => setShowFilters(!showFilters)}
        />
      ),
    },
  ];

  const filterPanelInputs = [
    {
      type: InputTypes.DATE,
      formKey: "after",
      label: t("Start Date"),
      placeholder: t("Start Date"),
      isDatePicker: true,
      isOnClearActive: true,
    },
    {
      type: InputTypes.DATE,
      formKey: "before",
      label: t("End Date"),
      placeholder: t("End Date"),
      isDatePicker: true,
      isOnClearActive: true,
    },
    {
      type: InputTypes.SELECT,
      formKey: "requesterId",
      label: t("Requester"),
      options: users?.map((u) => ({ value: u._id, label: u.name })),
      isOnClearActive: true,
    },
    {
      type: InputTypes.SELECT,
      formKey: "targetUserId",
      label: t("Target User"),
      options: users?.map((u) => ({ value: u._id, label: u.name })),
      isOnClearActive: true,
    },
    {
      type: InputTypes.SELECT,
      formKey: "type",
      label: t("Type"),
      options: [
        { value: ShiftChangeTypeEnum.SWAP, label: t("Swap") },
        { value: ShiftChangeTypeEnum.TRANSFER, label: t("Transfer") },
      ],
      isOnClearActive: true,
    },
  ];

  const filterPanel = {
    isFilterPanelActive: showFilters,
    inputs: filterPanelInputs,
    formElements: filters,
    setFormElements: setFilters,
    isApplyButtonActive: true,
    closeFilters: () => setShowFilters(false),
    additionalFilterCleanFunction: () =>
      setFilters({
        status: activeTab === "PENDING" ? ShiftChangeStatusEnum.PENDING : "",
        after: "",
        before: "",
        requesterId: "",
        targetUserId: "",
        type: "",
        page: 1,
        limit: 50,
      }),
  } as any;

  return (
    <div className="w-[95%] my-5 mx-auto">
      <GenericTable
        rowKeys={rowKeys}
        columns={columns}
        rows={rows}
        isActionsActive={true}
        filters={topFilters}
        title={
          activeTab === "PENDING" ? t("Pending Requests") : t("All Changes")
        }
        filterPanel={filterPanel}
      />
    </div>
  );
};

export default UserChangeRequestTab;
