import { useState } from "react";
import { useTranslation } from "react-i18next";
import { MenuItem, OptionType } from "../../../types";
import { useGetMenuItems } from "../../../utils/api/menu/menu-item";
import MenuItemPriceHistoryChart from "../../menu/MenuItemPriceHistoryChart";
import SelectInput from "../../panelComponents/FormElements/SelectInput";

export default function MenuItemPriceChart() {
  const { t } = useTranslation();
  const items = useGetMenuItems();

  const itemOptions = items?.map((item) => {
    return {
      value: item._id.toString(),
      label: item.name,
    };
  });
  const [pickedItem, setSelectedItem] = useState<MenuItem | undefined>();
  // Ürünler sayfa açıldıktan sonra da gelebilir; seçim yapılmadıysa ilk ürün gösterilir.
  const selectedItem = pickedItem ?? items?.[0];

  return (
    <div className="flex flex-col gap-4  mx-auto">
      <div className="sm:w-1/4 px-4">
        <SelectInput
          label={t("Product")}
          options={itemOptions}
          value={
            selectedItem
              ? {
                  value: selectedItem._id.toString(),
                  label: selectedItem.name,
                }
              : null
          }
          onChange={(selectedOption) => {
            setSelectedItem(
              items?.find(
                (item) =>
                  item._id.toString() === (selectedOption as OptionType)?.value
              )
            );
          }}
          isOnClearActive={false}
          placeholder={t("Select a product")}
        />
      </div>

      {selectedItem && (
        <MenuItemPriceHistoryChart
          item={selectedItem}
          title={selectedItem.name}
        />
      )}
    </div>
  );
}
