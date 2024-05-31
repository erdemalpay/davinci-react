import { useTranslation } from "react-i18next";
import { AccountVendor } from "../../types";
import { useGetAccountFixtures } from "../../utils/api/account/fixture";
import GenericTable from "../panelComponents/Tables/GenericTable";
type Props = { selectedVendor: AccountVendor };

const VendorFixtures = ({ selectedVendor }: Props) => {
  const { t } = useTranslation();
  const fixtures = useGetAccountFixtures();
  const vendorFixtures = fixtures.filter((o) =>
    o?.vendor?.includes(selectedVendor?._id)
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
        key={selectedVendor._id}
        rowKeys={rowKeys}
        columns={columns}
        rows={vendorFixtures}
        title={t("Vendor Fixtures")}
      />
    </div>
  );
};

export default VendorFixtures;
