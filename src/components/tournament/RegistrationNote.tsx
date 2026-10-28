import { Fragment } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { PublicRoutes } from "../../navigation/constants";

// Notta {iptal} yazılan yere kaydı iptal etme bağlantısı konur (backend'deki mail ile aynı işaret)
export const CANCEL_LINK_TOKEN = "{iptal}";

interface Props {
  note: string;
  checkInCode?: string;
}

const RegistrationNote = ({ note, checkInCode }: Props) => {
  const { t } = useTranslation();
  const linkText = t("CancelRegistrationHere");
  return (
    <p className="whitespace-pre-line">
      {note.split(CANCEL_LINK_TOKEN).map((part, index) => (
        <Fragment key={index}>
          {index > 0 &&
            (checkInCode ? (
              <Link
                to={PublicRoutes.TournamentCancel.replace(":code", checkInCode)}
                className="text-indigo-700 underline"
              >
                {linkText}
              </Link>
            ) : (
              linkText
            ))}
          {part}
        </Fragment>
      ))}
    </p>
  );
};

export default RegistrationNote;
