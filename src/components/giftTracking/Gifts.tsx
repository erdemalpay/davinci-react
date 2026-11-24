import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { CiCirclePlus } from "react-icons/ci";
import { FiEdit } from "react-icons/fi";
import { HiOutlineTrash } from "react-icons/hi2";
import { useGeneralContext } from "../../context/General.context";
import { useUserContext } from "../../context/User.context";
import {
  ActionEnum,
  DisabledConditionEnum,
  FormElementsState,
  Gift,
} from "../../types";
import { useGetAllAccountProducts } from "../../utils/api/account/product";
import {
  useGetGiftRecipients,
  useGetGiftTags,
  useGetGifts,
  useGiftMutations,
} from "../../utils/api/giftTracking";
import { useGetDisabledConditions } from "../../utils/api/panelControl/disabledCondition";
import { getItem } from "../../utils/getItem";
import { isActionDisabled } from "../../utils/permissions";
import { ConfirmationDialog } from "../common/ConfirmationDialog";
import GenericTable from "../panelComponents/Tables/GenericTable";
import SwitchButton from "../panelComponents/common/SwitchButton";
import { InputTypes } from "../panelComponents/shared/types";
import GiftPanel from "./GiftPanel";
import GiftTagChips, { GiftBlacklistBadge } from "./GiftTagChips";
import {
  GiftGroup,
  formatGiftDate,
  getGiftItemNames,
  getLabelOptions,
  getTagNames,
  giftTypeLabels,
  groupGifts,
  shareStatusLabels,
} from "./giftGroups";

type GiftRow = { _id: number; gift: Gift };

const Gifts = () => {
  const { t } = useTranslation();
  const { user } = useUserContext();
  const { setCurrentPage, setExpandedRows } = useGeneralContext();
  const recipients = useGetGiftRecipients();
  const gifts = useGetGifts();
  const tags = useGetGiftTags();
  const products = useGetAllAccountProducts();
  const disabledConditions = useGetDisabledConditions();
  const { deleteGift } = useGiftMutations();
  const [showFilters, setShowFilters] = useState(false);
  const [filterForm, setFilterForm] = useState<FormElementsState>({});
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isRowAddModalOpen, setIsRowAddModalOpen] = useState(false);
  const [isGiftEditModalOpen, setIsGiftEditModalOpen] = useState(false);
  const [isGiftDeleteModalOpen, setIsGiftDeleteModalOpen] = useState(false);
  const [rowToAction, setRowToAction] = useState<GiftGroup>();
  const [giftToAction, setGiftToAction] = useState<GiftRow>();

  const disabledCondition = useMemo(
    () => getItem(DisabledConditionEnum.GIFTTRACKING, disabledConditions),
    [disabledConditions]
  );

  const criteria = useMemo(
    () => ({
      tags: Array.isArray(filterForm.tags) ? filterForm.tags.map(Number) : [],
      blacklistedOnly: !!filterForm.blacklisted,
      after: filterForm.after || undefined,
      before: filterForm.before || undefined,
      type: filterForm.type || undefined,
    }),
    [filterForm]
  );

  useEffect(() => {
    setExpandedRows({});
  }, [criteria, setExpandedRows]);

  const rows = useMemo(
    () =>
      groupGifts(recipients, gifts, criteria).map((group) => ({
        ...group,
        tagNames: getTagNames(group.recipient.tags, tags),
        contactPerson: group.recipient.contactPerson ?? "",
        phone: group.recipient.phone ?? "",
        instagramFollowers: group.recipient.instagramFollowers || "",
        collapsible: {
          collapsibleHeader: t("Gifts"),
          collapsibleColumns: [
            { key: t("Date"), isSortable: false },
            { key: t("Type"), isSortable: false },
            { key: t("Games"), isSortable: false },
            { key: t("Share Status"), isSortable: false },
            { key: t("Engagement"), isSortable: false },
            { key: t("Order No"), isSortable: false },
            { key: t("Note"), isSortable: false },
            {
              key: t("Actions"),
              isSortable: false,
              className: "text-center",
            },
          ],
          collapsibleRows: group.gifts.map((gift) => ({
            _id: gift._id,
            gift,
            formattedDate: formatGiftDate(gift.date),
            typeLabel: t(giftTypeLabels[gift.type]),
            productNames: getGiftItemNames(gift.items, products),
            shareStatusLabel: gift.shareStatus
              ? t(shareStatusLabels[gift.shareStatus])
              : "",
            engagement: gift.engagement ?? "",
            orderReference: gift.orderReference ?? "",
            note: gift.note ?? "",
          })),
          collapsibleRowKeys: [
            { key: "formattedDate" },
            { key: "typeLabel" },
            { key: "productNames" },
            { key: "shareStatusLabel" },
            { key: "engagement" },
            { key: "orderReference" },
            { key: "note" },
          ],
        },
      })),
    [recipients, gifts, tags, products, criteria, t]
  );

  const columns = useMemo(
    () => [
      { key: t("Name"), isSortable: true },
      { key: t("Tags"), isSortable: false },
      { key: t("Contact Person"), isSortable: true },
      { key: t("Phone"), isSortable: false },
      { key: t("Instagram Followers"), isSortable: true },
      { key: t("Total Sent"), isSortable: true },
      { key: t("Last Sent"), isSortable: true },
      { key: t("Actions"), isSortable: false },
    ],
    [t]
  );

  const rowKeys = useMemo(
    () => [
      {
        key: "name",
        node: (row: GiftGroup) => (
          <div className="flex items-center gap-2">
            {row.name}
            {row.recipient.isBlacklisted && <GiftBlacklistBadge />}
          </div>
        ),
      },
      {
        key: "tagNames",
        node: (row: GiftGroup) => (
          <GiftTagChips tagIds={row.recipient.tags} tags={tags} />
        ),
      },
      { key: "contactPerson" },
      { key: "phone" },
      { key: "instagramFollowers" },
      { key: "total" },
      {
        key: "lastDate",
        node: (row: GiftGroup) => formatGiftDate(row.lastDate),
      },
    ],
    [tags]
  );

  const addButton = useMemo(
    () => ({
      name: t("Add Gift"),
      isModal: true,
      modal: (
        <GiftPanel
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
        name: t("Add Gift"),
        icon: <CiCirclePlus />,
        className: "text-green-500 cursor-pointer text-2xl",
        isModal: true,
        setRow: setRowToAction,
        modal: rowToAction ? (
          <GiftPanel
            isOpen={isRowAddModalOpen}
            close={() => setIsRowAddModalOpen(false)}
            recipientId={rowToAction._id}
          />
        ) : null,
        isModalOpen: isRowAddModalOpen,
        setIsModal: setIsRowAddModalOpen,
        isPath: false,
        isDisabled: isActionDisabled(disabledCondition, ActionEnum.ADD, user),
      },
    ],
    [t, rowToAction, isRowAddModalOpen, disabledCondition, user]
  );

  const collapsibleActions = useMemo(
    () => [
      {
        name: t("Edit Gift"),
        icon: <FiEdit />,
        className: "text-blue-500 cursor-pointer text-xl",
        isModal: true,
        setRow: (row: unknown) => setGiftToAction(row as GiftRow),
        modal: giftToAction ? (
          <GiftPanel
            isOpen={isGiftEditModalOpen}
            close={() => setIsGiftEditModalOpen(false)}
            gift={giftToAction.gift}
          />
        ) : null,
        isModalOpen: isGiftEditModalOpen,
        setIsModal: setIsGiftEditModalOpen,
        isPath: false,
        isDisabled: isActionDisabled(
          disabledCondition,
          ActionEnum.UPDATE,
          user
        ),
      },
      {
        name: t("Delete Gift"),
        icon: <HiOutlineTrash />,
        className: "text-red-500 cursor-pointer text-2xl",
        isModal: true,
        setRow: (row: unknown) => setGiftToAction(row as GiftRow),
        modal: giftToAction ? (
          <ConfirmationDialog
            isOpen={isGiftDeleteModalOpen}
            close={() => setIsGiftDeleteModalOpen(false)}
            confirm={() => {
              deleteGift(giftToAction._id);
              setIsGiftDeleteModalOpen(false);
            }}
            title={t("Delete Gift")}
            text={`${formatGiftDate(giftToAction.gift.date)} ${t(
              "GeneralDeleteMessage"
            )}`}
          />
        ) : null,
        isModalOpen: isGiftDeleteModalOpen,
        setIsModal: setIsGiftDeleteModalOpen,
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
      giftToAction,
      isGiftEditModalOpen,
      isGiftDeleteModalOpen,
      deleteGift,
      disabledCondition,
      user,
    ]
  );

  const filterPanel = useMemo(
    () => ({
      isFilterPanelActive: showFilters,
      inputs: [
        {
          type: InputTypes.SELECT,
          formKey: "tags",
          label: t("Tags"),
          placeholder: t("Tags"),
          options: tags.map((tag) => ({ value: tag._id, label: tag.name })),
          isMultiple: true,
          required: false,
        },
        {
          type: InputTypes.SELECT,
          formKey: "type",
          label: t("Type"),
          placeholder: t("Type"),
          options: getLabelOptions(giftTypeLabels, t),
          required: false,
        },
        {
          type: InputTypes.DATE,
          formKey: "after",
          label: t("Start Date"),
          placeholder: t("Start Date"),
          required: false,
          isDatePicker: true,
        },
        {
          type: InputTypes.DATE,
          formKey: "before",
          label: t("End Date"),
          placeholder: t("End Date"),
          required: false,
          isDatePicker: true,
        },
      ],
      formElements: filterForm,
      setFormElements: setFilterForm,
      closeFilters: () => setShowFilters(false),
      additionalFilterCleanFunction: () => setFilterForm({}),
    }),
    [t, tags, showFilters, filterForm]
  );

  const filters = useMemo(
    () => [
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
      {
        label: t("Blacklisted only"),
        isUpperSide: true,
        node: (
          <SwitchButton
            checked={!!filterForm.blacklisted}
            onChange={() => {
              setFilterForm((prev) => ({
                ...prev,
                blacklisted: !prev.blacklisted,
              }));
              setCurrentPage(1);
            }}
          />
        ),
      },
    ],
    [t, showFilters, filterForm.blacklisted, setCurrentPage]
  );

  const excelColumns = useMemo(
    () => [
      { key: t("Name"), correspondingKey: "name" },
      { key: t("Tags"), correspondingKey: "tagNames" },
      { key: t("Contact Person"), correspondingKey: "contactPerson" },
      { key: t("Phone"), correspondingKey: "phone" },
      { key: t("Date"), correspondingKey: "formattedDate" },
      { key: t("Type"), correspondingKey: "typeLabel" },
      { key: t("Games"), correspondingKey: "productNames" },
      { key: t("Share Status"), correspondingKey: "shareStatusLabel" },
      { key: t("Engagement"), correspondingKey: "engagement" },
      { key: t("Order No"), correspondingKey: "orderReference" },
      { key: t("Note"), correspondingKey: "note" },
    ],
    [t]
  );

  const excelRows = useMemo(
    () =>
      rows.flatMap((row) =>
        row.collapsible.collapsibleRows.map((giftRow) => ({
          name: row.name,
          tagNames: row.tagNames,
          contactPerson: row.contactPerson,
          instagramFollowers: row.instagramFollowers,
          total: row.total,
          lastDate: row.lastDate,
          phone: row.phone,
          ...giftRow,
        }))
      ),
    [rows]
  );

  return (
    <div className="w-[95%] mx-auto">
      <GenericTable
        rowKeys={rowKeys}
        columns={columns}
        rows={rows}
        actions={actions}
        filterPanel={filterPanel}
        filters={filters}
        addButton={addButton}
        title={t("Gifts")}
        isActionsActive={true}
        isCollapsible={true}
        collapsibleActions={collapsibleActions}
        rowClassNameFunction={(row: GiftGroup) =>
          row.recipient.isBlacklisted ? "bg-red-100" : ""
        }
        isExcel={!isActionDisabled(disabledCondition, ActionEnum.EXCEL, user)}
        excelFileName="GiftTracking.xlsx"
        excelRows={excelRows}
        excelColumns={excelColumns}
      />
    </div>
  );
};

export default Gifts;
