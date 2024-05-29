import { useTranslation } from "react-i18next";
import { AccountBrand } from "../../types";
import { useGetAccountProducts } from "../../utils/api/account/product";
import GenericTable from "../panelComponents/Tables/GenericTable";
type Props = { selectedBrand: AccountBrand };

const BrandProducts = ({ selectedBrand }: Props) => {
  const { t } = useTranslation();
  const products = useGetAccountProducts();
  const BrandProducts = products.filter((o) =>
    o.brand?.includes(selectedBrand._id)
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
        key={selectedBrand._id}
        rowKeys={rowKeys}
        columns={columns}
        rows={BrandProducts}
        title={t("Brand Products")}
      />
    </div>
  );
};

export default BrandProducts;
