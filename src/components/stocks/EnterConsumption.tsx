import { useState } from "react";
import { useTranslation } from "react-i18next";
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
  const locations = useGetAccountStockLocations();
  const [form, setForm] = useState({
    product: "",
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
      placeholder: t("Product"),
      required: true,
    },
    StockLocationInput({ locations: locations }),
    QuantityInput({ required: true }),
  ];
  const consumptFormKeys = [
    { key: "product", type: FormKeyTypeEnum.STRING },
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
      buttonName={t("Submit")}
      topClassName="flex flex-col gap-2 "
    />
  );
};

export default EnterConsumption;
