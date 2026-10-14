import { AccountCountProduct } from "../../types";
import ButtonTooltip from "../panelComponents/Tables/ButtonTooltip";

type Props = Pick<AccountCountProduct, "reservedQuantity" | "reservedDetails">;

// Sayımda pazaryeri siparişlerine ayrılmış adet; üzerine gelince hangi
// kanaldan hangi sipariş olduğu görülür. Sayılmış ama ayrılmış kaydı henüz
// alınmamış satırda "?" gösterilir.
const ReservedQuantityCell = ({ reservedQuantity, reservedDetails }: Props) => {
  if (reservedQuantity == null) return <span>?</span>;
  if (!reservedQuantity) return <span>-</span>;
  return (
    <ButtonTooltip
      content={(reservedDetails ?? []).map((detail, index) => (
        <div key={index} className="capitalize">
          {detail.channel} {detail.orderNumber} ({detail.quantity})
        </div>
      ))}
    >
      <span className="underline decoration-dotted cursor-help">
        {reservedQuantity}
      </span>
    </ButtonTooltip>
  );
};

export default ReservedQuantityCell;
