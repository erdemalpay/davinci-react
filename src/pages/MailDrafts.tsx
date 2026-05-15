import { Dialog, Transition } from "@headlessui/react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Fragment, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { HiOutlineTrash } from "react-icons/hi2";
import { MdOutlineSend } from "react-icons/md";
import { toast } from "react-toastify";
import { ConfirmationDialog } from "../components/common/ConfirmationDialog";
import { GenericButton } from "../components/common/GenericButton";
import {
  MailTemplatePreview,
  mailTemplateOptions,
} from "../components/mailTemplates";
import GenericTable from "../components/panelComponents/Tables/GenericTable";
import SwitchButton from "../components/panelComponents/common/SwitchButton";
import { InputTypes } from "../components/panelComponents/shared/types";
import { FormElementsState } from "../types";
import { Paths } from "../utils/api/factory";
import {
  MailDraft,
  MailDraftStatus,
  MailSubscription,
  SubscriptionStatus,
  useGetActiveSubscriptions,
  useGetQueryMailDrafts,
  useMailDraftMutations,
} from "../utils/api/mail";
import { formatAsLocalDate } from "../utils/format";

type MailDraftRow = MailDraft & {
  formattedCreatedAt: string;
  formattedUpdatedAt: string;
  formattedSentAt: string;
  recipientsDisplay: string;
  collapsible: {
    collapsibleColumns: { key: string; isSortable: boolean }[];
    collapsibleRows: Pick<MailDraft, "mailType" | "variables">[];
    collapsibleRowKeys: {
      key: string;
      node: (row: Pick<MailDraft, "mailType" | "variables">) => React.ReactNode;
    }[];
  };
};

const mailDraftStatusOptions = [
  {
    value: MailDraftStatus.DRAFT,
    label: "Draft",
    backgroundColor: "bg-gray-500",
  },
  {
    value: MailDraftStatus.READY,
    label: "Ready",
    backgroundColor: "bg-blue-500",
  },
  {
    value: MailDraftStatus.SENT,
    label: "Sent",
    backgroundColor: "bg-green-500",
  },
  {
    value: MailDraftStatus.ARCHIVED,
    label: "Archived",
    backgroundColor: "bg-orange-500",
  },
];

type SendDraftDialogProps = {
  draft?: MailDraftRow;
  isOpen: boolean;
  close: () => void;
  subscriptions: MailSubscription[];
  onSend: (recipients: string[]) => void;
};

const SendDraftDialog = ({
  draft,
  isOpen,
  close,
  subscriptions,
  onSend,
}: SendDraftDialogProps) => {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const activeSubscriptions = useMemo(() => {
    const seenEmails = new Set<string>();

    return subscriptions
      ?.filter(
        (subscription) => subscription.status === SubscriptionStatus.ACTIVE
      )
      ?.filter((subscription) => {
        if (!subscription.email || seenEmails.has(subscription.email)) {
          return false;
        }

        seenEmails.add(subscription.email);
        return true;
      });
  }, [subscriptions]);

  const visibleSubscriptions = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    if (!normalizedSearch) return activeSubscriptions;

    return activeSubscriptions.filter((subscription) =>
      `${subscription.name ?? ""} ${subscription.email}`
        .toLowerCase()
        .includes(normalizedSearch)
    );
  }, [activeSubscriptions, search]);

  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);

  useEffect(() => {
    if (!isOpen) return;

    const draftRecipientSet = new Set(draft?.recipients ?? []);
    const selectedFromDraft = activeSubscriptions
      .filter((subscription) => draftRecipientSet.has(subscription.email))
      .map((subscription) => subscription.email);

    setSelectedEmails(selectedFromDraft);
  }, [draft, isOpen, activeSubscriptions]);

  const isAllSelected =
    visibleSubscriptions.length > 0 &&
    visibleSubscriptions.every((subscription) =>
      selectedEmails.includes(subscription.email)
    );

  const toggleSelectAll = () => {
    if (isAllSelected) {
      const visibleEmails = new Set(
        visibleSubscriptions.map((subscription) => subscription.email)
      );

      setSelectedEmails((prev) =>
        prev.filter((email) => !visibleEmails.has(email))
      );
      return;
    }

    setSelectedEmails((prev) =>
      Array.from(
        new Set([
          ...prev,
          ...visibleSubscriptions.map((subscription) => subscription.email),
        ])
      )
    );
  };

  const toggleEmail = (email: string) => {
    setSelectedEmails((prev) =>
      prev.includes(email)
        ? prev.filter((selectedEmail) => selectedEmail !== email)
        : [...prev, email]
    );
  };

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog onClose={close}>
        <Dialog.Overlay />
        <div className="fixed inset-0 z-[99999] flex w-full justify-center">
          <div
            onClick={close}
            className="absolute inset-0 z-0 h-full w-full bg-gray-900 bg-opacity-50"
          />
          <div className="container mx-auto">
            <div className="flex h-full w-full items-center justify-center">
              <div className="fixed w-11/12 max-w-4xl rounded-md bg-white shadow">
                <div className="rounded-t-md bg-gray-100 px-4 py-5 md:px-8">
                  <p className="text-base font-semibold">
                    {t("Send Mail Draft")}
                  </p>
                </div>
                <div className="flex flex-col gap-4 p-5">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {draft?.name}
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      {draft?.subject || t("No subject")}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-sm font-semibold text-gray-900">
                        {t("Mail Subscriptions")}
                      </p>
                      <input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder={t("Search")}
                        className="h-10 rounded-md border border-gray-300 px-3 text-sm outline-none focus:border-blue-500 sm:w-72"
                      />
                    </div>

                    <div className="max-h-[420px] overflow-auto rounded-md border border-gray-200">
                      <table className="w-full border-collapse text-left text-sm">
                        <thead className="sticky top-0 bg-gray-50">
                          <tr>
                            <th className="w-12 border-b border-gray-200 px-3 py-3">
                              <input
                                type="checkbox"
                                checked={isAllSelected}
                                onChange={toggleSelectAll}
                                disabled={visibleSubscriptions.length === 0}
                                className="h-4 w-4 cursor-pointer"
                              />
                            </th>
                            <th className="border-b border-gray-200 px-3 py-3 font-semibold text-gray-700">
                              {t("Email")}
                            </th>
                            <th className="border-b border-gray-200 px-3 py-3 font-semibold text-gray-700">
                              {t("Name")}
                            </th>
                            <th className="border-b border-gray-200 px-3 py-3 font-semibold text-gray-700">
                              {t("Subscribed Types")}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {visibleSubscriptions.length === 0 ? (
                            <tr>
                              <td
                                colSpan={4}
                                className="px-3 py-8 text-center text-gray-500"
                              >
                                {t("No subscriptions found")}
                              </td>
                            </tr>
                          ) : (
                            visibleSubscriptions.map((subscription) => {
                              const isSelected = selectedEmails.includes(
                                subscription.email
                              );

                              return (
                                <tr
                                  key={subscription._id ?? subscription.email}
                                  onClick={() =>
                                    toggleEmail(subscription.email)
                                  }
                                  className={`cursor-pointer border-b border-gray-100 hover:bg-gray-50 ${
                                    isSelected ? "bg-blue-50" : "bg-white"
                                  }`}
                                >
                                  <td className="px-3 py-3">
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={() =>
                                        toggleEmail(subscription.email)
                                      }
                                      onClick={(event) =>
                                        event.stopPropagation()
                                      }
                                      className="h-4 w-4 cursor-pointer"
                                    />
                                  </td>
                                  <td className="px-3 py-3 text-gray-900">
                                    {subscription.email}
                                  </td>
                                  <td className="px-3 py-3 text-gray-600">
                                    {subscription.name || "-"}
                                  </td>
                                  <td className="px-3 py-3 text-gray-600">
                                    {subscription.subscribedTypes?.join(", ") ||
                                      "-"}
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <p className="text-xs text-gray-500">
                    {selectedEmails.length} {t("recipient selected")}
                  </p>

                  <div className="mt-2 flex items-center justify-between">
                    <GenericButton
                      onClick={close}
                      variant="danger"
                      size="sm"
                      className="px-6 py-3"
                    >
                      {t("Cancel")}
                    </GenericButton>
                    <GenericButton
                      onClick={() => onSend(selectedEmails)}
                      disabled={selectedEmails.length === 0}
                      variant="primary"
                      size="sm"
                      className="px-6 py-3 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {t("Send")}
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
};

const MailDrafts = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [showFilters, setShowFilters] = useState(false);
  const [selectedDraft, setSelectedDraft] = useState<MailDraftRow>();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSendDialogOpen, setIsSendDialogOpen] = useState(false);
  const [filterPanelFormElements, setFilterPanelFormElements] =
    useState<FormElementsState>({
      status: "",
      mailType: "",
    });
  const { deleteMailDraft, sendMailDraft } = useMailDraftMutations();
  const mailSubscriptions = useGetActiveSubscriptions();
  const mailDraftsPayload = useGetQueryMailDrafts(filterPanelFormElements);

  const invalidateDrafts = () => {
    queryClient.invalidateQueries({ queryKey: [`${Paths.Mail}/drafts`] });
  };

  const rows = useMemo(
    () =>
      mailDraftsPayload.map((draft) => ({
        ...draft,
        formattedCreatedAt: draft.createdAt
          ? formatAsLocalDate(format(draft.createdAt, "yyyy-MM-dd"))
          : "-",
        formattedUpdatedAt: draft.updatedAt
          ? formatAsLocalDate(format(draft.updatedAt, "yyyy-MM-dd"))
          : "-",
        formattedSentAt: draft.sentAt
          ? formatAsLocalDate(format(draft.sentAt, "yyyy-MM-dd"))
          : "-",
        recipientsDisplay: draft.recipients?.join(", ") || "-",
        collapsible: {
          collapsibleColumns: [{ key: t("Preview"), isSortable: false }],
          collapsibleRows: [
            {
              mailType: draft.mailType,
              variables: draft.variables ?? {},
            },
          ],
          collapsibleRowKeys: [
            {
              key: "preview",
              node: (row: Pick<MailDraft, "mailType" | "variables">) => (
                <div className="max-h-[620px] overflow-auto bg-gray-100">
                  <MailTemplatePreview
                    mailType={row.mailType}
                    values={Object.fromEntries(
                      Object.entries(row.variables ?? {}).map(
                        ([key, value]) => [
                          key,
                          value == null ? "" : String(value),
                        ]
                      )
                    )}
                  />
                </div>
              ),
            },
          ],
        },
      })) ?? [],
    [mailDraftsPayload, t]
  );

  const columns = useMemo(
    () => [
      { key: t("Name"), isSortable: true },
      { key: t("Subject"), isSortable: true },
      { key: t("Mail Type"), isSortable: true },
      { key: t("Status"), isSortable: true },
      { key: t("Recipients"), isSortable: false },
      { key: t("Created At"), isSortable: true },
      { key: t("Updated At"), isSortable: true },
      { key: t("Sent At"), isSortable: true },
      { key: t("Actions"), isSortable: false },
    ],
    [t]
  );

  const rowKeys = useMemo(
    () => [
      { key: "name", className: "min-w-44" },
      { key: "subject", className: "min-w-48" },
      {
        key: "mailType",
        className: "min-w-40 pr-1",
        node: (row: MailDraftRow) => {
          const mailType = mailTemplateOptions.find(
            (item) => item.value === row.mailType
          );
          return mailType ? (
            <div className="w-fit rounded-md bg-blue-500 px-2 py-1 text-sm font-semibold text-white">
              {t(mailType.label)}
            </div>
          ) : null;
        },
      },
      {
        key: "status",
        className: "min-w-32 pr-1",
        node: (row: MailDraftRow) => {
          const status = mailDraftStatusOptions.find(
            (item) => item.value === row.status
          );
          return status ? (
            <div
              className={`w-fit rounded-md px-2 py-1 text-sm font-semibold text-white ${status.backgroundColor}`}
            >
              {t(status.label)}
            </div>
          ) : null;
        },
      },
      { key: "recipientsDisplay", className: "min-w-64" },
      { key: "formattedCreatedAt", className: "min-w-32" },
      { key: "formattedUpdatedAt", className: "min-w-32" },
      { key: "formattedSentAt", className: "min-w-32" },
    ],
    [t]
  );
  console.log(mailSubscriptions);
  const actions = useMemo(
    () => [
      {
        name: t("Send"),
        icon: <MdOutlineSend />,
        className: "text-green-600 cursor-pointer text-2xl",
        isModal: true,
        setRow: setSelectedDraft,
        modal: selectedDraft ? (
          <SendDraftDialog
            draft={selectedDraft}
            isOpen={isSendDialogOpen}
            close={() => setIsSendDialogOpen(false)}
            subscriptions={mailSubscriptions}
            onSend={(recipients) => {
              sendMailDraft(selectedDraft._id, { recipients })
                .then(() => {
                  toast.success(t("Mail draft sent"));
                  invalidateDrafts();
                })
                .finally(() => setIsSendDialogOpen(false));
            }}
          />
        ) : null,
        isModalOpen: isSendDialogOpen,
        setIsModal: setIsSendDialogOpen,
        isPath: false,
        isDisabled: selectedDraft?.status === MailDraftStatus.SENT,
      },
      {
        name: t("Delete"),
        icon: <HiOutlineTrash />,
        className: "text-red-500 cursor-pointer text-2xl",
        isModal: true,
        setRow: setSelectedDraft,
        modal: selectedDraft ? (
          <ConfirmationDialog
            isOpen={isDeleteDialogOpen}
            close={() => setIsDeleteDialogOpen(false)}
            confirm={() => {
              deleteMailDraft(selectedDraft._id, {
                onSuccess: () => {
                  toast.success(t("Mail draft deleted"));
                  invalidateDrafts();
                },
              });
              setIsDeleteDialogOpen(false);
            }}
            title={t("Delete Mail Draft")}
            text={`${selectedDraft.name} ${t("GeneralDeleteMessage")}`}
          />
        ) : null,
        isModalOpen: isDeleteDialogOpen,
        setIsModal: setIsDeleteDialogOpen,
        isPath: false,
      },
    ],
    [
      t,
      selectedDraft,
      isSendDialogOpen,
      isDeleteDialogOpen,
      sendMailDraft,
      deleteMailDraft,
      mailSubscriptions,
    ]
  );

  const filterPanelInputs = useMemo(
    () => [
      {
        type: InputTypes.SELECT,
        formKey: "status",
        label: t("Status"),
        options: mailDraftStatusOptions.map((status) => ({
          value: status.value,
          label: t(status.label),
        })),
        placeholder: t("Status"),
        required: false,
      },
      {
        type: InputTypes.SELECT,
        formKey: "mailType",
        label: t("Mail Type"),
        options: mailTemplateOptions.map((type) => ({
          value: type.value,
          label: t(type.label),
        })),
        placeholder: t("Mail Type"),
        required: false,
      },
    ],
    [t]
  );

  const filterPanel = useMemo(
    () => ({
      isFilterPanelActive: showFilters,
      inputs: filterPanelInputs,
      formElements: filterPanelFormElements,
      setFormElements: setFilterPanelFormElements,
      closeFilters: () => setShowFilters(false),
    }),
    [showFilters, filterPanelInputs, filterPanelFormElements]
  );

  const filters = useMemo(
    () => [
      {
        label: t("Show Filters"),
        isUpperSide: true,
        node: <SwitchButton checked={showFilters} onChange={setShowFilters} />,
      },
    ],
    [t, showFilters]
  );

  return (
    <div className="w-[95%] mx-auto">
      <GenericTable
        rowKeys={rowKeys}
        columns={columns}
        rows={rows}
        actions={actions}
        title={t("Mail Drafts")}
        filterPanel={filterPanel}
        filters={filters}
        isActionsActive={true}
        isCollapsible={true}
      />
    </div>
  );
};

export default MailDrafts;
