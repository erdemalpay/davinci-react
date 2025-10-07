import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { KOVADAPILAVCATEGORYID, MenuItem } from "../../types";
import { useGetStoreLocations } from "../../utils/api/location";
import { useGetCategories } from "../../utils/api/menu/category";
import {
  useGetMenuItems,
  useMenuItemMutations,
} from "../../utils/api/menu/menu-item";
import { getItem } from "../../utils/getItem";
import { CheckSwitch } from "../common/CheckSwitch";
import GenericTable from "../panelComponents/Tables/GenericTable";

const KovadaPilavMenu = () => {
  const { t } = useTranslation();
  const items = useGetMenuItems();
  const locations = useGetStoreLocations();
  const { updateItem } = useMenuItemMutations();
  const allRows = items?.filter(
    (item) => item.category === KOVADAPILAVCATEGORYID
  );
  const categories = useGetCategories();
  const kovadaPilavCategory = getItem(KOVADAPILAVCATEGORYID, categories);
  const [tableKey, setTableKey] = useState(0);
  const [rows, setRows] = useState(allRows);
  function handleLocationUpdate(item: MenuItem, location: number) {
    const newLocations = item?.locations || [];
    const index = newLocations.indexOf(location);
    if (index === -1) {
      newLocations.push(location);
    } else {
      newLocations.splice(index, 1);
    }
    updateItem({
      id: item?._id,
      updates: {
        ...item,
        locations: newLocations,
      },
    });
  }
  const columns = [
    { key: t("Name"), isSortable: true },
    { key: t("Description"), isSortable: false },
  ];
  const rowKeys = [{ key: "name" }, { key: "description" }];
  for (const location of locations) {
    if (kovadaPilavCategory?.locations?.includes(location._id)) {
      columns.push({
        key: location.name,
        isSortable: false,
      });
      (rowKeys as any).push({
        key: location.name,
        node: (row: any) => {
          const isExist = row?.locations?.includes(location._id);
          return (
            <CheckSwitch
              checked={isExist}
              onChange={() => handleLocationUpdate(row, location._id)}
            />
          );
        },
      });
    }
  }
  useEffect(() => {
    setRows(allRows);
    setTableKey((prevKey) => prevKey + 1);
  }, [items, locations, categories]);
  return (
    <>
      <div className="w-[95%] mx-auto ">
        <GenericTable
          key={tableKey}
          rowKeys={rowKeys}
          columns={columns}
          rows={rows}
          isToolTipEnabled={false}
          title={t("Kovada Pilav Menu")}
          isActionsActive={false}
        />
      </div>
    </>
  );
};

export default KovadaPilavMenu;
