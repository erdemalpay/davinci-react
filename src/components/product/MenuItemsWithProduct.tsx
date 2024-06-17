import { useTranslation } from "react-i18next";
import { AccountProduct } from "../../types";
import { useGetMenuItems } from "../../utils/api/menu/menu-item";
import GenericTable from "../panelComponents/Tables/GenericTable";

type Props = { selectedProduct: AccountProduct };

const MenuItemsWithProduct = ({ selectedProduct }: Props) => {
  const { t } = useTranslation();
  const items = useGetMenuItems();
  const itemsIncludingProducts = items.filter((o) =>
    o.itemProduction?.some((p) => p.product === selectedProduct._id)
  );
  const columns = [{ key: t("Name"), isSortable: true }];
  const rowKeys = [
    {
      key: "name",
      className: "min-w-32 pr-1",
    },
  ];
  return (
    <div className="w-[95%] mx-auto ">
      <GenericTable
        key={selectedProduct._id}
        rowKeys={rowKeys}
        columns={columns}
        rows={itemsIncludingProducts}
        title={t("Menu Items with Product")}
        isActionsActive={false}
      />
    </div>
  );
};

export default MenuItemsWithProduct;
