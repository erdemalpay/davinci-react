import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { useGetAccountFixtures } from "../../utils/api/account/fixture";
import GenericTable from "../panelComponents/Tables/GenericTable";

const BrandFixtures = () => {
  const { t } = useTranslation();
  const fixtures = useGetAccountFixtures();
  const { brandId } = useParams();
  if (!brandId) return <></>;
  const BrandFixtures = fixtures.filter((o) => o.brand?.includes(brandId));
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
        isActionsActive={false}
        key={brandId}
        rowKeys={rowKeys}
        columns={columns}
        rows={BrandFixtures}
        title={t("Brand Fixtures")}
      />
    </div>
  );
};

export default BrandFixtures;
