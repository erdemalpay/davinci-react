import { debounce } from "lodash";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { OptionType, OrderDiscount } from "../../types";
import { useGetMemberships } from "../../utils/api/membership";
import { formatDate } from "../../utils/dateUtil";
import OrderScreenHeader from "../orders/orderPayment/orderList/OrderScreenHeader";
import SelectInput from "../panelComponents/FormElements/SelectInput";
import { H6 } from "../panelComponents/Typography";

type SharedDiscountNoteScreenProps = {
  discountNote: string | string[];
  setDiscountNote: (note: string | string[]) => void;
  selectedDiscount: OrderDiscount | null;
  showHeader?: boolean;
  headerText?: string;
  containerClassName?: string;
};

const SharedDiscountNoteScreen = ({
  discountNote,
  setDiscountNote,
  selectedDiscount,
  showHeader = true,
  headerText = "Discounts",
  containerClassName = "flex flex-col h-[60%] z-50",
}: SharedDiscountNoteScreenProps) => {
  const { t } = useTranslation();
  const members = useGetMemberships();
  const MEMBERDISCOUNTID = 8;

  const [localNote, setLocalNote] = useState(
    typeof discountNote === "string" ? discountNote : ""
  );

  // Sync when discount changes
  useEffect(() => {
    if (typeof discountNote === "string") {
      setLocalNote(discountNote);
    }
  }, [discountNote]);

  // Debounced context update
  const debouncedSetDiscountNote = useMemo(
    () => debounce((value: string) => setDiscountNote(value), 300),
    [setDiscountNote]
  );

  const handleNoteChange = (value: string) => {
    setLocalNote(value);
    debouncedSetDiscountNote(value);
  };

  const memberOptions =
    members
      ?.filter((membership) => membership.endDate >= formatDate(new Date()))
      ?.map((membership) => ({
        value: membership._id,
        label: membership.name,
      })) || [];

  return (
    <div className={containerClassName}>
      <div className="px-2 overflow-visible">
        {showHeader && <OrderScreenHeader header={headerText} />}

        {selectedDiscount && selectedDiscount._id !== MEMBERDISCOUNTID && (
          <>
            <H6 className="min-w-10">{t("Discount Note")}</H6>
            <textarea
              value={localNote}
              placeholder={t("Enter discount note")}
              onChange={(e) => handleNoteChange(e.target.value)}
              className="border text-base border-gray-300 rounded-md p-2 w-full h-32"
            />
          </>
        )}

        {selectedDiscount && selectedDiscount._id === MEMBERDISCOUNTID && (
          <SelectInput
            key={"discountNote"}
            value={
              Array.isArray(discountNote)
                ? discountNote
                    .map((name) =>
                      memberOptions.find((option) => option.label === name)
                    )
                    .filter((opt): opt is OptionType => opt !== undefined)
                : memberOptions.find(
                    (option) => option.label === discountNote
                  ) || null
            }
            isMultiple={true}
            options={memberOptions}
            placeholder={selectedDiscount?.note}
            onChange={(value) => {
              if (Array.isArray(value)) {
                // Çoklu seçim: array'i direkt gönder
                setDiscountNote(value.map((v) => v.label));
              } else if (value && "label" in value) {
                // Tekli seçim
                setDiscountNote(value.label);
              }
            }}
          />
        )}
      </div>
    </div>
  );
};

export default SharedDiscountNoteScreen;
