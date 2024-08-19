import { useTranslation } from "react-i18next";
import { useAccountPaymentMutations } from "../../utils/api/account/payment";
import { useGetAccountPaymentMethods } from "../../utils/api/account/paymentMethod";
import { useGetAccountStockLocations } from "../../utils/api/account/stockLocation";
import { useGetAccountVendors } from "../../utils/api/account/vendor";
import { StockLocationInput } from "../../utils/panelInputs";
import GenericAddComponent from "../panelComponents/FormElements/GenericAddComponent";
import { FormKeyTypeEnum, InputTypes } from "../panelComponents/shared/types";

const AddVendorPayment = () => {
  const { t } = useTranslation();
  const { createAccountPayment } = useAccountPaymentMutations();
  const vendors = useGetAccountVendors();
  const paymentMethods = useGetAccountPaymentMethods();
  const locations = useGetAccountStockLocations();

  const inputs = [
    {
      type: InputTypes.SELECT,
      formKey: "vendor",
      label: t("Vendor"),
      options: vendors?.map((vendor) => {
        return {
          value: vendor._id,
          label: vendor.name,
        };
      }),
      placeholder: t("Vendor"),
      required: true,
    },
    {
      type: InputTypes.NUMBER,
      formKey: "amount",
      label: t("Amount"),
      placeholder: t("Amount"),
      required: true,
    },
    StockLocationInput({ locations: locations }),
    {
      type: InputTypes.SELECT,
      formKey: "paymentMethod",
      label: t("Payment Method"),
      options: paymentMethods?.map((paymentMethod) => {
        return {
          value: paymentMethod._id,
          label: t(paymentMethod.name),
        };
      }),
      placeholder: t("Payment Method"),
      required: true,
    },
    {
      type: InputTypes.DATE,
      formKey: "date",
      label: t("Date"),
      placeholder: t("Date"),
      required: true,
      isDatePicker: true,
    },
  ];
  const formKeys = [
    { key: "vendor", type: FormKeyTypeEnum.STRING },
    { key: "amount", type: FormKeyTypeEnum.NUMBER },
    { key: "location", type: FormKeyTypeEnum.STRING },
    { key: "paymentMethod", type: FormKeyTypeEnum.STRING },
  ];

  return (
    <GenericAddComponent
      inputs={inputs}
      header={t("Add Vendor Payment")}
      formKeys={formKeys}
      submitItem={createAccountPayment as any}
      buttonName={t("Submit")}
      topClassName="flex flex-col gap-2 "
    />
  );
};

export default AddVendorPayment;