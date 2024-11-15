import { useTranslation } from "react-i18next";
import { useLocationContext } from "../../context/Location.context";
import { useGetAccountProducts } from "../../utils/api/account/product";
import { useConsumptStockMutation } from "../../utils/api/account/stock";
import { useGetAccountStockLocations } from "../../utils/api/account/stockLocation";
import { getStockLocation } from "../../utils/getStockLocation";
import { QuantityInput, StockLocationInput } from "../../utils/panelInputs";
import GenericAddComponent from "../panelComponents/FormElements/GenericAddComponent";
import { FormKeyTypeEnum, InputTypes } from "../panelComponents/shared/types";

const EnterConsumption = () => {
  const { t } = useTranslation();
  const { mutate: consumptStock } = useConsumptStockMutation();
  const products = useGetAccountProducts();
  const locations = useGetAccountStockLocations();
  const { selectedLocationId } = useLocationContext();
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
      constantValues={{
        location: selectedLocationId
          ? getStockLocation(selectedLocationId)
          : "",
      }}
      header={t("Enter Product Consumption")}
      formKeys={consumptFormKeys}
      submitItem={consumptStock as any}
      buttonName={t("Submit")}
      topClassName="flex flex-col gap-2 "
    />
  );
};

export default EnterConsumption;
