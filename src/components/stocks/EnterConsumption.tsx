import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useGetAccountPackageTypes } from "../../utils/api/account/packageType";
import { useGetAccountProducts } from "../../utils/api/account/product";
import { useConsumptStockMutation } from "../../utils/api/account/stock";
import { useGetAccountStockLocations } from "../../utils/api/account/stockLocation";
import { QuantityInput, StockLocationInput } from "../../utils/panelInputs";
import GenericAddComponent from "../panelComponents/FormElements/GenericAddComponent";
import { FormKeyTypeEnum, InputTypes } from "../panelComponents/shared/types";

const EnterConsumption = () => {
  const { t } = useTranslation();
  const { mutate: consumptStock } = useConsumptStockMutation();
  const products = useGetAccountProducts();
  const packages = useGetAccountPackageTypes();
  const locations = useGetAccountStockLocations();
  const [form, setForm] = useState({
    product: "",
    packageType: "",
    location: "",
    quantity: 0,
  });
  const consumptInputs = [
    {
      type: InputTypes.SELECT,
      formKey: "product",
      label: t("Product"),
      options: products.map((product) => {
        return {
          value: product._id,
          label: product.name,
        };
      }),
      invalidateKeys: [{ key: "packageType", defaultValue: "" }],
      placeholder: t("Product"),
      required: true,
    },
    {
      type: InputTypes.SELECT,
      formKey: "packageType",
      label: t("Package Type"),
      options: products
        .find((prod) => prod._id === form?.product)
        ?.packages?.map((item) => {
          const packageType = packages.find((pkg) => pkg._id === item.package);
          return {
            value: packageType?._id,
            label: packageType?.name,
          };
        }),
      placeholder: t("Package Type"),
      required: true,
    },
    StockLocationInput({ locations: locations }),
    QuantityInput({ required: true }),
  ];
  const consumptFormKeys = [
    { key: "product", type: FormKeyTypeEnum.STRING },
    { key: "packageType", type: FormKeyTypeEnum.STRING },
    { key: "location", type: FormKeyTypeEnum.STRING },
    { key: "quantity", type: FormKeyTypeEnum.NUMBER },
  ];

  return (
    <GenericAddComponent
      inputs={consumptInputs}
      header={t("Enter Product Consumption")}
      formKeys={consumptFormKeys}
      setForm={setForm}
      submitItem={consumptStock as any}
      submitFunction={() => {
        consumptStock({
          ...form,
          quantity:
            form.quantity *
            (packages?.find((pkg) => pkg?._id === form?.packageType)
              ?.quantity ?? 1),
        });
      }}
      buttonName={t("Submit")}
      topClassName="flex flex-col gap-2 "
    />
  );
};

export default EnterConsumption;
