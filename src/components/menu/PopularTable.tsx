import { useState } from "react";
import { HiOutlineTrash } from "react-icons/hi2";
import { SlArrowDown, SlArrowUp } from "react-icons/sl";
import { toast } from "react-toastify";
import { NO_IMAGE_URL } from "../../navigation/constants";
import { MenuItem, MenuPopular } from "../../types";
import { usePopularMutations } from "../../utils/api/menu/popular";
import { ConfirmationDialog } from "../common/ConfirmationDialog";
import ButtonTooltip from "../panelComponents/Tables/ButtonTooltip";
import GenericTable from "../panelComponents/Tables/GenericTable";

type Props = {
  popularItems: MenuPopular[];
};

const PopularTable = ({ popularItems }: Props) => {
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
    { key: "Name", isSortable: true },
    { key: "Description", isSortable: true },
    { key: "Price (Bahçeli)", isSortable: true },
    { key: "Price (Neorama)", isSortable: true },
    { key: "Action", isSortable: false },
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

  function updatePopularItemOrder(popularItem: MenuItem, up: boolean) {
    const newOrder = up ? popularItem.order - 1 : popularItem.order + 1;
    const otherItem =
      popularItems && popularItems.find((c) => c.order === newOrder);
    updatePopular({
      id: popularItem._id,
      updates: { order: newOrder },
    });
    if (otherItem) {
      updatePopular({
        id: otherItem._id,
        updates: { order: popularItem.order },
      });
    }

    toast.success("Popular item order updated");
  }
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
      name: "Remove",
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
          title="Remove Popular Item"
          text={`${rowToAction.name} will be removed from popular items. Are you sure you want to continue?`}
        />
      ) : null,
      className: "text-red-500 cursor-pointer text-2xl w-fit ml-10",
      isModal: true,
      isModalOpen: isCloseAllConfirmationDialogOpen,
      setIsModal: setIsCloseAllConfirmationDialogOpen,
      isPath: false,
    },

    {
      name: "Move",
      icon: null,
      className: "text-blue-500 cursor-pointer text-xl",
      node: (row: MenuItem) => (
        <div className="flex flex-row justify-center items-center gap-2">
          <button
            onClick={() => updatePopularItemOrder(row, true)}
            className={`${row.order === 1 ? "invisible" : "visible"}`}
          >
            <ButtonTooltip content="Up">
              <SlArrowUp className="text-green-500 w-6 h-6" />
            </ButtonTooltip>
          </button>

          <button
            onClick={() => updatePopularItemOrder(row, false)}
            className={`${
              row.order === popularItems.length ? "invisible" : "visible"
            }`}
          >
            <ButtonTooltip content="Down">
              <SlArrowDown className="text-green-500 w-6 h-6" />
            </ButtonTooltip>
          </button>
        </div>
      ),

      isModal: false,
      setRow: setRowToAction,
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
        title={"Popular Items"}
        imageHolder={NO_IMAGE_URL}
        isDraggable={true}
        onDragEnter={(DragRow, DropRow) => handleDrag(DragRow, DropRow)}
      />
    </div>
  );
};

export default PopularTable;
