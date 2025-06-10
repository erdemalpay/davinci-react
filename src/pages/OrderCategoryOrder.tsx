import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Header } from "../components/header/Header";
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
  const [tableKey, setTableKey] = useState(0);
  const allRows =
    allCategories
      ?.filter((category) => {
        return category?.active;
      })
      ?.sort((a, b) => a.orderCategoryOrder - b.orderCategoryOrder) || [];
  const [rows, setRows] = useState(allRows);
  const columns = [
    { key: "", isSortable: false },
    { key: t("Name"), isSortable: true },
  ];
  const rowKeys = [{ key: "imageUrl", isImage: true }, { key: "name" }];
  const handleDrag = (DragRow: MenuCategory, DropRow: MenuCategory) => {
    updateOrderCategoriesOrder({
      id: DragRow._id,
      newOrder: DropRow.orderCategoryOrder,
    });
  };
  useEffect(() => {
    setRows(allRows);
    setTableKey((prev) => prev + 1);
  }, [allCategories]);
  return (
    <>
      <Header showLocationSelector={false} />
      <div className="w-[95%] mx-auto my-10 flex flex-col gap-6 ">
        <GenericTable
          key={tableKey}
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
