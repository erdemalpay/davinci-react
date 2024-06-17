import { useTranslation } from "react-i18next";
import { AccountVendor } from "../../types";
import { useGetAccountServices } from "../../utils/api/account/service";
import GenericTable from "../panelComponents/Tables/GenericTable";
type Props = { selectedVendor: AccountVendor };

const VendorServices = ({ selectedVendor }: Props) => {
  const { t } = useTranslation();
  const services = useGetAccountServices();
  const vendorServices = services.filter((o) =>
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
        rows={vendorServices}
        title={t("Vendor Services")}
        isActionsActive={false}
      />
    </div>
  );
};

export default VendorServices;
