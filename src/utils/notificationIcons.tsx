import {
  MdCheckCircle,
  MdError,
  MdInfo,
  MdShoppingCart,
  MdWarning,
} from "react-icons/md";
import { NotificationType } from "../types";

/**
 * NotificationType için ilgili Material ikonunu döner.
 * Bilinmeyen tip için INFORMATION ikonuna fallback yapar.
 */
export const getNotificationTypeIcon = (
  type: NotificationType | undefined,
  className?: string
): JSX.Element => {
  switch (type) {
    case NotificationType.WARNING:
      return <MdWarning className={className} />;
    case NotificationType.ERROR:
      return <MdError className={className} />;
    case NotificationType.SUCCESS:
      return <MdCheckCircle className={className} />;
    case NotificationType.ORDER:
      return <MdShoppingCart className={className} />;
    case NotificationType.INFORMATION:
    default:
      return <MdInfo className={className} />;
  }
};
