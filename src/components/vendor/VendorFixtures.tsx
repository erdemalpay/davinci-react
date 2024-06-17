import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { useGetAccountFixtures } from "../../utils/api/account/fixture";
import { useGetAccountVendors } from "../../utils/api/account/vendor";
import GenericTable from "../panelComponents/Tables/GenericTable";

const VendorFixtures = () => {
  const { t } = useTranslation();
  const { vendorId } = useParams();
  const vendors = useGetAccountVendors();
  const selectedVendor = vendors?.find((item) => item._id === vendorId);
  if (!selectedVendor) return <></>;
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
        isActionsActive={false}
      />
    </div>
  );
};

export default VendorFixtures;
