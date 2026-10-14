import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { HiOutlineTrash } from "react-icons/hi2";
import { TbTransferIn } from "react-icons/tb";
import { useUserContext } from "../../context/User.context";
import { ActionEnum, DisabledConditionEnum, InventoryBox } from "../../types";
import { useGetGames } from "../../utils/api/game";
import {
  useDeactivateInventoryBoxesMutation,
  useGetInventoryBoxes,
  useGetInventoryLocations,
  useMoveInventoryBoxesMutation,
} from "../../utils/api/inventory";
import { useGetDisabledConditions } from "../../utils/api/panelControl/disabledCondition";
import { getItem } from "../../utils/getItem";
import { isActionDisabled } from "../../utils/permissions";
import { ConfirmationDialog } from "../common/ConfirmationDialog";
import GenericAddEditPanel from "../panelComponents/FormElements/GenericAddEditPanel";
import GenericTable from "../panelComponents/Tables/GenericTable";
import SwitchButton from "../panelComponents/common/SwitchButton";
import { FormKeyTypeEnum, InputTypes } from "../panelComponents/shared/types";
import AddBoxPanel from "./AddBoxPanel";
import { useInventoryFilters } from "./useInventoryFilters";

type MoveForm = { ids: string[]; location: number; note?: string };

const codeNumber = (id: string) => Number(id.split("-").pop());

const InventoryBoxes = () => {
  const { t } = useTranslation();
  const { user } = useUserContext();
  const boxes = useGetInventoryBoxes();
  const games = useGetGames();
  const locations = useGetInventoryLocations();
  const disabledConditions = useGetDisabledConditions();
  const { mutate: moveBoxes } = useMoveInventoryBoxesMutation();
  const { mutate: deactivateBoxes } = useDeactivateInventoryBoxesMutation();
  const { filterPanel, showFiltersToggle, criteria } = useInventoryFilters();
  const [isEnableEdit, setIsEnableEdit] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);
  const [rowToAction, setRowToAction] = useState<any>();

  const disabledCondition = useMemo(
    () =>
      getItem(DisabledConditionEnum.INVENTORY_INVENTORY, disabledConditions),
    [disabledConditions]
  );

  const rows = useMemo(() => {
    const { game, location, code } = criteria;
    const boxesByGame = new Map<number, InventoryBox[]>();
    boxes
      .filter(
        (box) =>
          (game === undefined || box.game === game) &&
          (location === undefined || box.location === location) &&
          (!code || box._id.toLowerCase().includes(code))
      )
      .forEach((box) =>
        boxesByGame.set(box.game, [...(boxesByGame.get(box.game) ?? []), box])
      );
    return [...boxesByGame.entries()]
      .map(([gameId, list]) => ({
        _id: gameId,
        gameName: getItem(gameId, games)?.name ?? String(gameId),
        total: list.length,
        boxes: [...list].sort((a, b) => codeNumber(a._id) - codeNumber(b._id)),
      }))
      .sort((a, b) => a.gameName.localeCompare(b.gameName, "tr"))
      .map((group) => ({
        ...group,
        collapsible: {
          collapsibleHeader: t("Boxes"),
          collapsibleColumns: [
            { key: t("Code"), isSortable: false },
            { key: t("Location"), isSortable: false },
            ...(isEnableEdit
              ? [
                  {
                    key: t("Actions"),
                    isSortable: false,
                    className: "text-center",
                  },
                ]
              : []),
          ],
          collapsibleRows: group.boxes.map((box) => ({
            _id: box._id,
            locationName:
              getItem(box.location, locations)?.name ?? box.location,
          })),
          collapsibleRowKeys: [{ key: "_id" }, { key: "locationName" }],
        },
      }));
  }, [boxes, games, locations, criteria, isEnableEdit, t]);

  const columns = useMemo(
    () => [
      { key: t("Game"), isSortable: true },
      { key: t("Boxes"), isSortable: true },
    ],
    [t]
  );

  const rowKeys = useMemo(() => [{ key: "gameName" }, { key: "total" }], []);

  const moveInputs = useMemo(
    () => [
      {
        type: InputTypes.SELECT,
        formKey: "ids",
        label: t("Boxes"),
        options: (rowToAction?.boxes ?? []).map((box: InventoryBox) => ({
          value: box._id,
          label: box._id,
        })),
        isMultiple: true,
        placeholder: t("Boxes"),
        required: true,
      },
      {
        type: InputTypes.SELECT,
        formKey: "location",
        label: t("Location"),
        options: locations
          .filter((location) => location.active)
          .map((location) => ({
            value: location._id,
            label: location.name,
          })),
        placeholder: t("Location"),
        required: true,
      },
      {
        type: InputTypes.TEXT,
        formKey: "note",
        label: t("Note"),
        placeholder: t("Note"),
        required: false,
      },
    ],
    [locations, rowToAction, t]
  );

  const moveFormKeys = useMemo(
    () => [
      { key: "ids", type: FormKeyTypeEnum.ARRAY },
      { key: "location", type: FormKeyTypeEnum.NUMBER },
      { key: "note", type: FormKeyTypeEnum.STRING },
    ],
    []
  );

  const collapsibleActions = useMemo(
    () => [
      {
        name: t("Remove from inventory"),
        icon: <HiOutlineTrash />,
        className: "text-red-500 cursor-pointer text-2xl",
        isModal: true,
        setRow: setRowToAction,
        modal: rowToAction ? (
          <ConfirmationDialog
            isOpen={isRemoveModalOpen}
            close={() => setIsRemoveModalOpen(false)}
            confirm={() => {
              deactivateBoxes({ ids: [rowToAction._id] });
              setIsRemoveModalOpen(false);
            }}
            title={t("Remove from inventory")}
            text={`${rowToAction._id} ${t(
              "will be removed from the inventory. Are you sure you want to continue?"
            )}`}
          />
        ) : null,
        isModalOpen: isRemoveModalOpen,
        setIsModal: setIsRemoveModalOpen,
        isPath: false,
        isDisabled: isActionDisabled(
          disabledCondition,
          ActionEnum.DELETE,
          user
        ),
      },
      {
        name: t("Move"),
        icon: <TbTransferIn />,
        className: "text-green-500 cursor-pointer text-xl",
        isModal: true,
        setRow: setRowToAction,
        modal: rowToAction ? (
          <GenericAddEditPanel
            isOpen={isMoveModalOpen}
            close={() => setIsMoveModalOpen(false)}
            header={`${t("Move")} ${rowToAction._id}`}
            inputs={moveInputs}
            formKeys={moveFormKeys}
            submitItem={
              ((form: MoveForm) =>
                moveBoxes({
                  ids: form.ids,
                  location: form.location,
                  note: form.note || undefined,
                })) as any
            }
            constantValues={{ ids: [rowToAction._id] }}
            buttonName={t("Move")}
            topClassName="flex flex-col gap-2 "
          />
        ) : null,
        isModalOpen: isMoveModalOpen,
        setIsModal: setIsMoveModalOpen,
        isPath: false,
        isDisabled: isActionDisabled(
          disabledCondition,
          ActionEnum.UPDATE,
          user
        ),
      },
    ],
    [
      t,
      rowToAction,
      isMoveModalOpen,
      isRemoveModalOpen,
      moveInputs,
      moveFormKeys,
      moveBoxes,
      deactivateBoxes,
      disabledCondition,
      user,
    ]
  );

  const addButton = useMemo(
    () => ({
      name: t("Add Product"),
      isModal: true,
      modal: (
        <AddBoxPanel
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

  const filters = useMemo(
    () => [
      {
        label: t("Enable Edit"),
        isUpperSide: true,
        node: (
          <SwitchButton
            checked={isEnableEdit}
            onChange={() => setIsEnableEdit(!isEnableEdit)}
          />
        ),
        isDisabled: isActionDisabled(
          disabledCondition,
          ActionEnum.ENABLEEDIT,
          user
        ),
      },
      showFiltersToggle,
    ],
    [t, showFiltersToggle, isEnableEdit, disabledCondition, user]
  );

  return (
    <div className="w-[95%] mx-auto">
      <GenericTable
        rowKeys={rowKeys}
        columns={columns}
        rows={rows}
        filterPanel={filterPanel}
        filters={filters}
        addButton={addButton}
        title={t("Inventory")}
        isActionsActive={isEnableEdit}
        isCollapsible={true}
        collapsibleActions={isEnableEdit ? collapsibleActions : []}
      />
    </div>
  );
};

export default InventoryBoxes;
