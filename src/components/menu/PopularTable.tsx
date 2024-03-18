import { useState } from "react";
import { useTranslation } from "react-i18next";
import { HiOutlineTrash } from "react-icons/hi2";
import { NO_IMAGE_URL } from "../../navigation/constants";
import { MenuItem, MenuPopular } from "../../types";
import { usePopularMutations } from "../../utils/api/menu/popular";
import { ConfirmationDialog } from "../common/ConfirmationDialog";
import GenericTable from "../panelComponents/Tables/GenericTable";

type Props = {
  popularItems: MenuPopular[];
};

const PopularTable = ({ popularItems }: Props) => {
  const { t } = useTranslation();
  const { deletePopular, updatePopular } = usePopularMutations();
  const [rowToAction, setRowToAction] = useState<MenuItem>();
  const rows: MenuItem[] = popularItems.map((popularItem) => ({
    ...(popularItem.item as MenuItem),
    order: popularItem.order,
    _id: popularItem._id,
  }));

  const [
    isCloseAllConfirmationDialogOpen,
    setIsCloseAllConfirmationDialogOpen,
  ] = useState(false);
  const columns = [
    { key: "", isSortable: false },
    { key: t("Name"), isSortable: true },
    { key: t("Description"), isSortable: true },
    { key: `${t("Price")} (Bahçeli)`, isSortable: true },
    { key: `${t("Price")} (Neorama)`, isSortable: true },
    { key: t("Action"), isSortable: false },
  ];

  const rowKeys = [
    { key: "imageUrl", isImage: true },
    {
      key: "name",
    },
    {
      key: "description",
    },
    {
      key: "priceBahceli",
    },
    {
      key: "priceNeorama",
    },
  ];

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
            deletePopular(
              (
                popularItems.find((c) => c._id === rowToAction._id)
                  ?.item as MenuItem
              )?._id
            );
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
        rows={rows}
        title={t("Popular Items")}
        imageHolder={NO_IMAGE_URL}
        isDraggable={true}
        onDragEnter={(DragRow, DropRow) => handleDrag(DragRow, DropRow)}
      />
    </div>
  );
};

export default PopularTable;
