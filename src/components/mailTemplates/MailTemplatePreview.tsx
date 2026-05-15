import { MailType } from "../../utils/api/mail";
import BackInStockMailTemplate from "./BackInStockMailTemplate";
import CampaignAnnouncementMailTemplate from "./CampaignAnnouncementMailTemplate";
import CustomerMessageMailTemplate from "./CustomerMessageMailTemplate";
import OrderUpdateMailTemplate from "./OrderUpdateMailTemplate";
import { MailTemplateProps } from "./types";

type Props = MailTemplateProps & {
  mailType: MailType;
};

export default function MailTemplatePreview({ mailType, values }: Props) {
  switch (mailType) {
    case MailType.CUSTOMER_MESSAGE:
      return <CustomerMessageMailTemplate values={values} />;
    case MailType.ORDER_UPDATE:
      return <OrderUpdateMailTemplate values={values} />;
    case MailType.CAMPAIGN_ANNOUNCEMENT:
      return <CampaignAnnouncementMailTemplate values={values} />;
    case MailType.BACK_IN_STOCK:
    default:
      return <BackInStockMailTemplate values={values} />;
  }
}
