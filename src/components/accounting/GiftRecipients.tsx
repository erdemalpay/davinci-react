import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { FiEdit } from "react-icons/fi";
import { HiOutlineTrash } from "react-icons/hi2";
import { useUserContext } from "../../context/User.context";
import { ActionEnum, DisabledConditionEnum, GiftRecipient } from "../../types";
import {
  useGetGiftRecipients,
  useGetGiftTags,
  useGiftRecipientMutations,
} from "../../utils/api/giftTracking";
import { useGetDisabledConditions } from "../../utils/api/panelControl/disabledCondition";
import { getItem } from "../../utils/getItem";
import { isActionDisabled } from "../../utils/permissions";
import { ConfirmationDialog } from "../common/ConfirmationDialog";
import GiftTagChips, { GiftBlacklistBadge } from "../giftTracking/GiftTagChips";
import { getTagNames } from "../giftTracking/giftGroups";
import GenericTable from "../panelComponents/Tables/GenericTable";
import GiftRecipientPanel from "./GiftRecipientPanel";

const GiftRecipients = () => {
  const { t } = useTranslation();
  const { user } = useUserContext();
  const recipients = useGetGiftRecipients();
  const tags = useGetGiftTags();
  const disabledConditions = useGetDisabledConditions();
  const { deleteGiftRecipient } = useGiftRecipientMutations();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [rowToAction, setRowToAction] = useState<GiftRecipient>();

  const disabledCondition = useMemo(
    () =>
      getItem(
        DisabledConditionEnum.ACCOUNTING_GIFTRECIPIENTS,
        disabledConditions
      ),
    [disabledConditions]
  );

  const rows = useMemo(
    () =>
      recipients.map((recipient) => ({
        ...recipient,
        tagNames: getTagNames(recipient.tags, tags),
        // Boolean alan aramada "true"/"false" metniyle eşleştiği için etiket tutulur
        blacklistLabel: recipient.isBlacklisted ? t("Blacklist") : "",
      })),
    [recipients, tags, t]
  );

  const columns = useMemo(
    () => [
      { key: t("Name"), isSortable: true, correspondingKey: "name" },
      { key: t("Tags"), isSortable: false, correspondingKey: "tagNames" },
      {
        key: t("Contact Person"),
        isSortable: true,
        correspondingKey: "contactPerson",
      },
      { key: t("Phone"), isSortable: false, correspondingKey: "phone" },
      { key: t("Address"), isSortable: false, correspondingKey: "address" },
      {
        key: t("Instagram"),
        isSortable: false,
        correspondingKey: "instagramUrl",
      },
      {
        key: t("Instagram Followers"),
        isSortable: true,
        correspondingKey: "instagramFollowers",
      },
      {
        key: t("YouTube Followers"),
        isSortable: true,
        correspondingKey: "youtubeFollowers",
      },
      {
        key: t("Blacklist"),
        isSortable: true,
        correspondingKey: "blacklistLabel",
      },
      { key: t("Actions"), isSortable: false },
    ],
    [t]
  );

  const rowKeys = useMemo(
    () => [
      { key: "name" },
      {
        key: "tagNames",
        node: (row: GiftRecipient) => (
          <GiftTagChips tagIds={row.tags} tags={tags} />
        ),
      },
      { key: "contactPerson" },
      { key: "phone" },
      { key: "address" },
      {
        key: "instagramUrl",
        node: (row: GiftRecipient) =>
          row.instagramUrl ? (
            <a
              href={row.instagramUrl}
              target="_blank"
              rel="noreferrer"
              className="text-blue-500 underline"
            >
              {t("Instagram")}
            </a>
          ) : null,
      },
      {
        key: "instagramFollowers",
        node: (row: GiftRecipient) => row.instagramFollowers || "",
      },
      {
        key: "youtubeFollowers",
        node: (row: GiftRecipient) => row.youtubeFollowers || "",
      },
      {
        key: "blacklistLabel",
        node: (row: GiftRecipient) =>
          row.isBlacklisted ? <GiftBlacklistBadge /> : null,
      },
    ],
    [t, tags]
  );

  const searchRowKeys = useMemo(
    () => rowKeys.filter((rowKey) => rowKey.key !== "instagramUrl"),
    [rowKeys]
  );

  const addButton = useMemo(
    () => ({
      name: t("Add Recipient"),
      isModal: true,
      modal: (
        <GiftRecipientPanel
          isOpen={isAddModalOpen}
          close={() => setIsAddModalOpen(false)}
        />
      ),
      isModalOpen: isAddModalOpen,
      setIsModal: setIsAddModalOpen,
      isPath: false,
      icon: null,
      className: "bg-blue-500 hover:text-blue-500 hover:border-blue-500 ",
      isDisabled: isActionDisabled(disabledCondition, ActionEnum.ADD, user),
    }),
    [t, isAddModalOpen, disabledCondition, user]
  );

  const actions = useMemo(
    () => [
      {
        name: t("Edit Recipient"),
        icon: <FiEdit />,
        className: "text-blue-500 cursor-pointer text-xl",
        isModal: true,
        setRow: setRowToAction,
        modal: rowToAction ? (
          <GiftRecipientPanel
            isOpen={isEditModalOpen}
            close={() => setIsEditModalOpen(false)}
            recipient={rowToAction}
          />
        ) : null,
        isModalOpen: isEditModalOpen,
        setIsModal: setIsEditModalOpen,
        isPath: false,
        isDisabled: isActionDisabled(
          disabledCondition,
          ActionEnum.UPDATE,
          user
        ),
      },
      {
        name: t("Delete Recipient"),
        icon: <HiOutlineTrash />,
        className: "text-red-500 cursor-pointer text-2xl",
        isModal: true,
        setRow: setRowToAction,
        modal: rowToAction ? (
          <ConfirmationDialog
            isOpen={isDeleteModalOpen}
            close={() => setIsDeleteModalOpen(false)}
            confirm={() => {
              deleteGiftRecipient(rowToAction._id);
              setIsDeleteModalOpen(false);
            }}
            title={t("Delete Recipient")}
            text={`${rowToAction.name} ${t("GeneralDeleteMessage")}`}
          />
        ) : null,
        isModalOpen: isDeleteModalOpen,
        setIsModal: setIsDeleteModalOpen,
        isPath: false,
        isDisabled: isActionDisabled(
          disabledCondition,
          ActionEnum.DELETE,
          user
        ),
      },
    ],
    [
      t,
      rowToAction,
      isEditModalOpen,
      isDeleteModalOpen,
      deleteGiftRecipient,
      disabledCondition,
      user,
    ]
  );

  return (
    <div className="w-[95%] mx-auto">
      <GenericTable
        rowKeys={rowKeys}
        searchRowKeys={searchRowKeys}
        columns={columns}
        rows={rows}
        actions={actions}
        addButton={addButton}
        title={t("Gift Recipients")}
        isActionsActive={true}
        isExcel={!isActionDisabled(disabledCondition, ActionEnum.EXCEL, user)}
        excelFileName="GiftRecipients.xlsx"
      />
    </div>
  );
};

export default GiftRecipients;
