import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { useGetAccountProducts } from "../../utils/api/account/product";
import GenericTable from "../panelComponents/Tables/GenericTable";

const BrandProducts = () => {
  const { t } = useTranslation();
  const products = useGetAccountProducts();
  const { brandId } = useParams();
  if (!brandId) return <></>;
  const BrandProducts = products.filter((o) => o.brand?.includes(brandId));
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
        key={brandId}
        isActionsActive={false}
        rowKeys={rowKeys}
        columns={columns}
        rows={BrandProducts}
        title={t("Brand Products")}
      />
    </div>
  );
};

export default BrandProducts;
