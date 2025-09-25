import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useOrderContext } from "../../../../context/Order.context";
import { useGetMemberships } from "../../../../utils/api/membership";
import { useGetOrderDiscounts } from "../../../../utils/api/order/orderDiscount";
import { formatDate } from "../../../../utils/dateUtil";
import SelectInput from "../../../panelComponents/FormElements/SelectInput";
import { H6 } from "../../../panelComponents/Typography";
import OrderScreenHeader from "./OrderScreenHeader";

const DiscountNoteScreen = () => {
  const { discountNote, setDiscountNote, selectedDiscount } = useOrderContext();
  const members = useGetMemberships();
  const discounts = useGetOrderDiscounts();
  const MEMBERDISCOUNTID = 8;
  const memberDiscount = useMemo(() => {
    return discounts?.find((discount) => discount._id === MEMBERDISCOUNTID);
  }, [discounts]);

  const { t } = useTranslation();
  return (
    <div className="flex flex-col h-[60%] overflow-scroll no-scrollbar  ">
      <div className="px-2 ">
        <OrderScreenHeader header="Discounts" />
        {/* note */}
        {selectedDiscount && selectedDiscount._id !== MEMBERDISCOUNTID && (
          <>
            <H6 className="min-w-10">{t("Discount Note")}</H6>
            <textarea
              value={discountNote}
              placeholder={t("Enter discount note")}
              onChange={(e) => setDiscountNote(e.target.value)}
              className="border text-base border-gray-300 rounded-md p-2 w-full h-32"
            />
          </>
        )}
        {selectedDiscount && selectedDiscount._id === MEMBERDISCOUNTID && (
          <SelectInput
            key={"discountNote"}
            value={discountNote as any}
            options={
              members
                ?.filter(
                  (membership) => membership.endDate >= formatDate(new Date())
                )
                ?.map((membership) => ({
                  value: membership._id,
                  label: membership.name,
                })) || []
            }
            placeholder={selectedDiscount?.note}
            onChange={(value) => setDiscountNote(value as any)}
          />
        )}
      </div>
    </div>
  );
};

export default DiscountNoteScreen;
