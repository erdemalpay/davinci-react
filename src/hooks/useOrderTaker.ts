import { useTranslation } from "react-i18next";
import {
  FormKeyTypeEnum,
  InputTypes,
} from "../components/panelComponents/shared/types";
import { useDataContext } from "../context/Data.context";
import { RoleEnum } from "../types";

// Ortak kasa hesabında siparişi kimin aldığı seçilir (ActiveVisitList'teki aktif kişiler)
export const useOrderTaker = () => {
  const { t } = useTranslation();
  const { user, users = [], visits = [] } = useDataContext();
  const isCounterUser = user?.role?._id === RoleEnum.COUNTER;
  const orderTakerInputs = isCounterUser
    ? [
        {
          type: InputTypes.SELECT,
          formKey: "createdBy",
          label: t("Order Taker"),
          options: users
            .filter(
              (u) =>
                u.role?._id !== RoleEnum.COUNTER &&
                visits.some(
                  (visit) => visit.user === u._id && !visit.finishHour
                )
            )
            .map((u) => ({ value: u._id, label: u.name })),
          placeholder: t("Order Taker"),
          required: true,
        },
      ]
    : [];
  const orderTakerFormKeys = isCounterUser
    ? [{ key: "createdBy", type: FormKeyTypeEnum.STRING }]
    : [];
  return { isCounterUser, orderTakerInputs, orderTakerFormKeys };
};
