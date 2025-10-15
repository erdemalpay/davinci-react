import { useOrderContext } from "../../../../context/Order.context";
import SharedDiscountNoteScreen from "../../../common/SharedDiscountNoteScreen";

const DiscountNoteScreen = () => {
  const { discountNote, setDiscountNote, selectedDiscount } = useOrderContext();

  return (
    <SharedDiscountNoteScreen
      discountNote={discountNote}
      setDiscountNote={setDiscountNote}
      selectedDiscount={selectedDiscount}
      showHeader={true}
      headerText="Discounts"
    />
  );
};

export default DiscountNoteScreen;
