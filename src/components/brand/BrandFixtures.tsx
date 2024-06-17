import { useTranslation } from "react-i18next";
import { AccountBrand } from "../../types";
import { useGetAccountFixtures } from "../../utils/api/account/fixture";
import GenericTable from "../panelComponents/Tables/GenericTable";
type Props = { selectedBrand: AccountBrand };

const BrandFixtures = ({ selectedBrand }: Props) => {
  const { t } = useTranslation();
  const fixtures = useGetAccountFixtures();
  const BrandFixtures = fixtures.filter((o) =>
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
        isActionsActive={false}
        key={selectedBrand._id}
        rowKeys={rowKeys}
        columns={columns}
        rows={BrandFixtures}
        title={t("Brand Fixtures")}
      />
    </div>
  );
};

export default BrandFixtures;
