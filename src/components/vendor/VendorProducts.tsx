import { useTranslation } from "react-i18next";
import { AccountVendor } from "../../types";
import { useGetAccountProducts } from "../../utils/api/account/product";
import GenericTable from "../panelComponents/Tables/GenericTable";
type Props = { selectedVendor: AccountVendor };

const VendorProducts = ({ selectedVendor }: Props) => {
  const { t } = useTranslation();
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
      />
    </div>
  );
};

export default VendorProducts;
