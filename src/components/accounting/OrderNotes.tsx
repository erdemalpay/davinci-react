import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useGetAllCategories } from "../../utils/api/menu/category";
import { useGetMenuItems } from "../../utils/api/menu/menu-item";
import { useGetOrderNotes } from "../../utils/api/order/orderNotes";
import { getItem } from "../../utils/getItem";
import GenericTable from "../panelComponents/Tables/GenericTable";
import { FormKeyTypeEnum, InputTypes } from "../panelComponents/shared/types";

const OrderNotes = () => {
  const { t } = useTranslation();
  const categories = useGetAllCategories();
  const items = useGetMenuItems();
  const notes = useGetOrderNotes();
  const [tableKey, setTableKey] = useState(0);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const allRows = notes?.map((note) => {
    return {
      ...note,
      categoryNames: note?.categories
        ?.map((categoryId) => {
          const foundCategory = getItem(categoryId, categories);
          return foundCategory ? foundCategory.name : "";
        })
        .join(", "),
      itemNames: note?.items
        ?.map((itemId) => {
          const foundItem = getItem(itemId, items);
          return foundItem ? foundItem.name : "";
        })
        .join(", "),
    };
  });
  const [rows, setRows] = useState(allRows ?? []);
  const columns = [
    { key: t("Note"), isSortable: true },
    {
      key: t("Categories"),
      isSortable: false,
    },
    { key: t("Items"), isSortable: false },
  ];
  const rowKeys = [
    { key: "note" },
    { key: "categoryNames" },
    { key: "itemNames" },
  ];
  const inputs = [
    {
      type: InputTypes.TEXTAREA,
      formKey: "note",
      label: t("Note"),
      placeholder: t("Note"),
      required: false,
    },
    {
      type: InputTypes.SELECT,
      formKey: "categories",
      label: t("Categories"),
      placeholder: t("Categories"),
      required: false,
      options: categories?.map((category) => ({
        label: category.name,
        value: category._id,
      })),
      isMultiple: true,
    },
    {
      type: InputTypes.SELECT,
      formKey: "items",
      label: t("Items"),
      placeholder: t("Items"),
      required: false,
      options: items?.map((item) => ({
        label: item.name,
        value: item._id,
      })),
      isMultiple: true,
    },
  ];
  const formKeys = [
    { key: "note", type: FormKeyTypeEnum.STRING },
    { key: "categories", type: FormKeyTypeEnum.STRING },
    { key: "items", type: FormKeyTypeEnum.STRING },
  ];
  useEffect(() => {
    setRows(allRows ?? []);
    setTableKey((prevKey) => prevKey + 1);
  }, [items, categories, notes]);

  return (
    <>
      <div className="w-[95%] mx-auto ">
        <GenericTable
          key={tableKey}
          rowKeys={rowKeys}
          //   actions={actions}
          columns={columns}
          rows={rows}
          title={t("Order Notes")}
          //   addButton={addButton}
          isActionsActive={false}
        />
      </div>
    </>
  );
};

export default OrderNotes;
