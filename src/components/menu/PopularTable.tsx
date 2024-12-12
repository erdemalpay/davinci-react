import { useState } from "react";
import { useTranslation } from "react-i18next";
import { HiOutlineTrash } from "react-icons/hi2";
import { IoCheckmark, IoCloseOutline } from "react-icons/io5";
import { useUserContext } from "../../context/User.context";
import { NO_IMAGE_URL } from "../../navigation/constants";
import { MenuItem, MenuPopular } from "../../types";
import { useGetStoreLocations } from "../../utils/api/location";
import { useGetCategories } from "../../utils/api/menu/category";
import { useGetMenuItems } from "../../utils/api/menu/menu-item";
import { usePopularMutations } from "../../utils/api/menu/popular";
import { getItem } from "../../utils/getItem";
import { ConfirmationDialog } from "../common/ConfirmationDialog";
import GenericTable from "../panelComponents/Tables/GenericTable";

type Props = {
  popularItems: MenuPopular[];
};

const PopularTable = ({ popularItems }: Props) => {
  const { t } = useTranslation();
  const categories = useGetCategories();
  const items = useGetMenuItems();
  const locations = useGetStoreLocations();
  const { deletePopular, updatePopular } = usePopularMutations();
  const { user } = useUserContext();
  const [rowToAction, setRowToAction] = useState<MenuItem>();
  // const isDisabledCondition = user
  //   ? ![
  //       RoleEnum.MANAGER,
  //       RoleEnum.CATERINGMANAGER,
  //       RoleEnum.GAMEMANAGER,
  //     ].includes(user?.role?._id)
  //   : true;
  const rows = popularItems.map((popItem) => {
    const popularItem = getItem(popItem.item, items);
    return {
      ...popularItem,
      order: popItem.order,
      _id: popItem._id,
      category: categories?.find((c) => c._id === popularItem?.category)?.name,
    };
  });
  const [
    isCloseAllConfirmationDialogOpen,
    setIsCloseAllConfirmationDialogOpen,
  ] = useState(false);
  const columns = [
    { key: "", isSortable: false },
    { key: t("Name"), isSortable: true },
    { key: t("Description"), isSortable: true },
    { key: t("Category"), isSortable: true },
    { key: `${t("Price")}`, isSortable: true },
  ];
  const rowKeys = [
    { key: "imageUrl", isImage: true },
    { key: "name", className: "pr-2" },
    { key: "description" },
    {
      key: "category",
      className: "min-w-32 pr-2",
    },
    {
      key: "price",
      node: (item: MenuItem) => {
        return `${item.price} ₺`;
      },
    },
  ];
  const insertIndex = 3;
  for (const location of locations) {
    columns.splice(insertIndex, 0, { key: location.name, isSortable: false });
    (rowKeys as any).splice(insertIndex, 0, {
      key: location.name,
      node: (row: any) => {
        const isExist = row?.locations?.includes(location._id);
        return isExist ? (
          <IoCheckmark className="text-blue-500 text-2xl" />
        ) : (
          <IoCloseOutline className="text-red-800 text-2xl" />
        );
      },
    });
  }
  columns.push({ key: t("Action"), isSortable: false });
  const handleDrag = (DragRow: MenuItem, DropRow: MenuItem) => {
    updatePopular({
      id: DragRow._id,
      updates: { order: DropRow.order },
    });
    updatePopular({
      id: DropRow._id,
      updates: { order: DragRow.order },
    });
  };
  const actions = [
    {
      name: t("Remove"),
      icon: <HiOutlineTrash />,
      setRow: setRowToAction,
      modal: rowToAction ? (
        <ConfirmationDialog
          isOpen={isCloseAllConfirmationDialogOpen}
          close={() => setIsCloseAllConfirmationDialogOpen(false)}
          confirm={() => {
            const popularItem = getItem(
              popularItems.find((c) => c._id === rowToAction._id)?.item,
              items
            );
            if (popularItem) {
              deletePopular(popularItem?._id);
            }
            setIsCloseAllConfirmationDialogOpen(false);
          }}
          title={t("Remove Popular Item")}
          text={`${rowToAction.name} will be removed from popular items. Are you sure you want to continue?`}
        />
      ) : null,
      className: "text-red-500 cursor-pointer text-2xl ",
      isModal: true,
      isModalOpen: isCloseAllConfirmationDialogOpen,
      setIsModal: setIsCloseAllConfirmationDialogOpen,
      isPath: false,
    },
  ];
  return (
    <div className="w-[95%] mx-auto">
      <GenericTable
        rowKeys={rowKeys}
        actions={actions}
        columns={columns}
        isActionsActive={true}
        rows={rows}
        title={t("Popular Items")}
        imageHolder={NO_IMAGE_URL}
        isDraggable={true}
        onDragEnter={(DragRow: MenuItem, DropRow) =>
          handleDrag(DragRow, DropRow)
        }
      />
    </div>
  );
};

export default PopularTable;
