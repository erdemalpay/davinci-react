import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import GenericTable from "../components/panelComponents/Tables/GenericTable";
import { NO_IMAGE_URL } from "../navigation/constants";
import { MenuCategory } from "../types";
import {
  useGetAllCategories,
  useUpdateOrderCategoriesOrderMutation,
} from "../utils/api/menu/category";

const OrderCategoryOrder = () => {
  const { t } = useTranslation();
  const allCategories = useGetAllCategories();
  const { mutate: updateOrderCategoriesOrder } =
    useUpdateOrderCategoriesOrderMutation();

  const rows = useMemo(() => {
    return (
      allCategories
        ?.filter((category) => {
          return category?.active;
        })
        ?.sort((a, b) => a.orderCategoryOrder - b.orderCategoryOrder) || []
    );
  }, [allCategories]);

  const columns = useMemo(
    () => [
      { key: "", isSortable: false },
      { key: t("Name"), isSortable: true },
    ],
    [t]
  );

  const rowKeys = useMemo(
    () => [{ key: "imageUrl", isImage: true }, { key: "name" }],
    []
  );

  const handleDrag = (DragRow: MenuCategory, DropRow: MenuCategory) => {
    updateOrderCategoriesOrder({
      id: DragRow._id,
      newOrder: DropRow.orderCategoryOrder,
    });
  };

  return (
    <>
      <div className="w-[95%] mx-auto my-10 flex flex-col gap-6 ">
        <GenericTable
          rowKeys={rowKeys}
          columns={columns}
          isActionsActive={false}
          rows={rows}
          title={t("Order Categories Order")}
          imageHolder={NO_IMAGE_URL}
          isDraggable={true}
          onDragEnter={(DragRow: MenuCategory, DropRow) =>
            handleDrag(DragRow, DropRow)
          }
        />
      </div>
    </>
  );
};

export default OrderCategoryOrder;
