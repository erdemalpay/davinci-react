import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { useGetAccountProducts } from "../../utils/api/account/product";
import { useGetAccountVendors } from "../../utils/api/account/vendor";
import GenericTable from "../panelComponents/Tables/GenericTable";

const VendorProducts = () => {
  const { t } = useTranslation();
  const { vendorId } = useParams();
  const vendors = useGetAccountVendors();
  const selectedVendor = vendors?.find((item) => item._id === vendorId);
  if (!selectedVendor) return <></>;
  const products = useGetAccountProducts();
  const vendorProducts = products.filter((o) =>
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
        rows={vendorProducts}
        title={t("Vendor Products")}
        isActionsActive={false}
      />
    </div>
  );
};

export default VendorProducts;
