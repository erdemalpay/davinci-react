import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { IoCheckmark, IoCloseOutline } from "react-icons/io5";
import { toast } from "react-toastify";
import { MenuItem } from "../../types";
import { useGetStoreLocations } from "../../utils/api/location";
import { useGetCategories } from "../../utils/api/menu/category";
import {
  useGetMenuItems,
  useMenuItemMutations,
} from "../../utils/api/menu/menu-item";
import { getItem } from "../../utils/getItem";
import { CheckSwitch } from "../common/CheckSwitch";
import SwitchButton from "../panelComponents/common/SwitchButton";
import GenericTable from "../panelComponents/Tables/GenericTable";

const ClosedItems = () => {
  const { t } = useTranslation();
  const [tableKey, setTableKey] = useState(0);
  const items = useGetMenuItems();
  const [isLocationEnableEdit, setIsLocationEnableEdit] = useState(false);
  const { updateItem } = useMenuItemMutations();
  const categories = useGetCategories();
  const locations = useGetStoreLocations();
  const allRows = items
    ?.filter((item) => item?.locations?.length !== locations?.length)
    ?.map((item) => {
      return {
        ...item,
        category: getItem(item.category, categories)?.name,
      };
    });
  const [rows, setRows] = useState(allRows);
  function handleLocationUpdate(item: MenuItem, location: number) {
    const newLocations = item?.locations || [];
    // Add if it doesn't exist, remove otherwise
    const index = newLocations.indexOf(location);
    if (index === -1) {
      newLocations.push(location);
    } else {
      newLocations.splice(index, 1);
    }
    updateItem({
      id: item?._id,
      updates: { locations: newLocations },
    });
    toast.success(`${t("Menu Item updated successfully")}`);
  }
  const columns = [
    { key: t("Name"), isSortable: true },
    { key: t("Category"), isSortable: true },
    { key: `${t("Price")}`, isSortable: true },
  ];
  const rowKeys = [
    { key: "name", className: "pr-2" },
    {
      key: "category",
      className: "min-w-32 pr-2",
    },
    {
      key: "price",
      node: (item: any) => {
        return `${item.price} ₺`;
      },
    },
  ];
  for (const location of locations) {
    columns.push({ key: location.name, isSortable: false });
    (rowKeys as any).push({
      key: location.name,
      node: (row: any) => {
        const isExist = row?.locations?.includes(location._id);
        if (isLocationEnableEdit) {
          return (
            <CheckSwitch
              checked={isExist}
              onChange={() => handleLocationUpdate(row, location._id)}
            />
          );
        }
        return isExist ? (
          <IoCheckmark className="text-blue-500 text-2xl" />
        ) : (
          <IoCloseOutline className="text-red-800 text-2xl" />
        );
      },
    });
  }

  const filters = [
    {
      label: t("Location Edit"),
      isUpperSide: false,
      node: (
        <SwitchButton
          checked={isLocationEnableEdit}
          onChange={setIsLocationEnableEdit}
        />
      ),
    },
  ];
  useEffect(() => {
    setRows(allRows);
    setTableKey((prev) => prev + 1);
  }, [items, locations, isLocationEnableEdit]);
  return (
    <div className="w-[95%] mx-auto">
      <GenericTable
        key={tableKey}
        rowKeys={rowKeys}
        columns={columns}
        isActionsActive={false}
        rows={rows}
        title={t("Closed Items")}
        filters={filters}
      />
    </div>
  );
};

export default ClosedItems;
