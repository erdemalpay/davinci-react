import { useTranslation } from "react-i18next";
import { useOrderContext } from "../../../../context/Order.context";
import { H6 } from "../../../panelComponents/Typography";
import OrderScreenHeader from "./OrderScreenHeader";

type Props = {};

const DiscountNoteScreen = (props: Props) => {
  const { discountNote, setDiscountNote } = useOrderContext();
  const { t } = useTranslation();
  return (
    <div className="flex flex-col h-52 overflow-scroll no-scrollbar  ">
      <div className="px-2 ">
        <OrderScreenHeader header="Discounts" />
        {/* note */}
        <H6 className="min-w-10">{t("Discount Note")}</H6>
        <textarea
          value={discountNote}
          placeholder={t("Enter discount note")}
          onChange={(e) => setDiscountNote(e.target.value)}
          className="border text-base border-gray-300 rounded-md p-2 w-full h-32"
        />
      </div>
    </div>
  );
};

export default DiscountNoteScreen;
