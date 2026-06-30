import { useTranslation } from "react-i18next";
import { ShopifyAdminCustomer } from "../../types";

type Props = { customer?: ShopifyAdminCustomer };

const ShopifyCustomerSummary = ({ customer }: Props) => {
  const { t, i18n } = useTranslation();

  const addr = customer?.defaultAddress;
  const addressParts = [addr?.address1, addr?.city, addr?.province, addr?.zip, addr?.country]
    .filter(Boolean)
    .join(", ");

  const marketingState = customer?.emailMarketingConsent?.marketingState;
  const isSubscribed = marketingState === "SUBSCRIBED";

  const fields = [
    {
      label: t("Email"),
      value: customer?.defaultEmailAddress?.emailAddress ?? "-",
    },
    {
      label: t("Phone"),
      value: customer?.defaultPhoneNumber?.phoneNumber ?? "-",
    },
    {
      label: t("Email Subscription"),
      value: marketingState
        ? isSubscribed
          ? t("Subscribed")
          : t("Not Subscribed")
        : "-",
      highlight: marketingState ? (isSubscribed ? "green" : "gray") : undefined,
    },
    {
      label: t("Default Address"),
      value: addressParts || "-",
    },
    {
      label: t("Created At"),
      value: customer?.createdAt
        ? new Date(customer.createdAt).toLocaleDateString(i18n.language)
        : "-",
    },
  ];

  return (
    <div className="w-[95%] mx-auto my-6">
      <dl className="flex flex-col gap-4">
        {fields.map((field) => (
          <div key={field.label} className="flex flex-col gap-0.5">
            <dt className="text-xs text-gray-400 uppercase tracking-wide">
              {field.label}
            </dt>
            <dd className="text-sm">
              {field.highlight ? (
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    field.highlight === "green"
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {field.value}
                </span>
              ) : (
                <span className="text-gray-800">{field.value}</span>
              )}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
};

export default ShopifyCustomerSummary;
