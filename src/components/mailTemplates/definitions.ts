import { MailType } from "../../utils/api/mail";
import {
  MailTemplateOption,
  MailTemplateParameterDefinition,
} from "./types";

export const mailTemplateOptions: MailTemplateOption[] = [
  { value: MailType.BACK_IN_STOCK, label: "Back in Stock" },
  { value: MailType.CUSTOMER_MESSAGE, label: "Customer Message" },
  { value: MailType.ORDER_UPDATE, label: "Order Update" },
  { value: MailType.CAMPAIGN_ANNOUNCEMENT, label: "Campaign Announcement" },
];

export const mailTemplateParameterDefinitions: Record<
  MailType,
  MailTemplateParameterDefinition[]
> = {
  [MailType.BACK_IN_STOCK]: [
    {
      key: "productName",
      label: "Product name",
      type: "string",
      required: true,
      description: "Name of the product that is available again.",
      example: "DaVinci Premium Kahve Makinesi",
    },
    {
      key: "email",
      label: "Customer email",
      type: "email",
      required: true,
      description: "Recipient email address.",
      example: "customer@example.com",
    },
    {
      key: "productUrl",
      label: "Product URL",
      type: "url",
      required: true,
      description: "URL where the customer can view or buy the product.",
      example: "https://example.com/products/coffee-machine",
    },
    {
      key: "supportEmail",
      label: "Support email",
      type: "email",
      required: true,
      description: "Email address customers can contact for support.",
      example: "support@example.com",
    },
    {
      key: "productImage",
      label: "Product image",
      type: "url",
      required: false,
      description: "Optional image URL for the product.",
    },
    {
      key: "price",
      label: "Price",
      type: "currency",
      required: false,
      description: "Optional product price shown in the email.",
      example: "2.499 TL",
    },
  ],
  [MailType.CUSTOMER_MESSAGE]: [
    {
      key: "headline",
      label: "Headline",
      type: "string",
      required: true,
      description: "Main title of the email.",
      example: "Sizin icin kisa bir bilgilendirme",
    },
    {
      key: "message",
      label: "Message",
      type: "multiline",
      required: true,
      description: "Main email body prepared by the frontend draft editor.",
      example: "Talebinizle ilgili detaylari sizinle paylasmak istedik.",
    },
    {
      key: "imageUrl",
      label: "Image URL",
      type: "url",
      required: false,
      description: "Optional image displayed above the message body.",
      example: "https://example.com/images/customer-message.jpg",
    },
    {
      key: "imageAlt",
      label: "Image alt text",
      type: "string",
      required: false,
      description: "Optional accessible description for the image.",
      example: "Kampanya gorseli",
    },
    {
      key: "ctaText",
      label: "Button text",
      type: "string",
      required: false,
      description: "Optional call-to-action button label.",
      example: "Detaylari Gor",
    },
    {
      key: "ctaUrl",
      label: "Button URL",
      type: "url",
      required: false,
      description: "Optional call-to-action button URL.",
      example: "https://example.com/account",
    },
    {
      key: "note",
      label: "Footer note",
      type: "multiline",
      required: false,
      description: "Optional note displayed below the main message.",
    },
  ],
  [MailType.ORDER_UPDATE]: [
    {
      key: "statusTitle",
      label: "Status title",
      type: "string",
      required: true,
      description: "Short status headline for the order update.",
      example: "Siparisiniz kargoya verildi",
    },
    {
      key: "statusMessage",
      label: "Status message",
      type: "multiline",
      required: true,
      description: "Detailed order status message.",
      example: "Paketiniz bugun kargo firmasina teslim edildi.",
    },
    {
      key: "orderNumber",
      label: "Order number",
      type: "string",
      required: false,
      description: "Optional customer-facing order number.",
      example: "DV-10482",
    },
    {
      key: "trackingUrl",
      label: "Tracking URL",
      type: "url",
      required: false,
      description: "Optional shipping or order tracking URL.",
    },
    {
      key: "estimatedDeliveryDate",
      label: "Estimated delivery date",
      type: "date",
      required: false,
      description: "Optional estimated delivery date.",
      example: "2026-05-20",
    },
  ],
  [MailType.CAMPAIGN_ANNOUNCEMENT]: [
    {
      key: "campaignTitle",
      label: "Campaign title",
      type: "string",
      required: true,
      description: "Main title of the campaign.",
      example: "Hafta Sonuna Ozel Firsatlar",
    },
    {
      key: "campaignMessage",
      label: "Campaign message",
      type: "multiline",
      required: true,
      description: "Main campaign description prepared in the draft editor.",
      example: "Secili urunlerde sinirli sureli indirimleri kesfedin.",
    },
    {
      key: "ctaText",
      label: "Button text",
      type: "string",
      required: true,
      description: "Call-to-action button label.",
      example: "Kampanyayi Incele",
    },
    {
      key: "ctaUrl",
      label: "Button URL",
      type: "url",
      required: true,
      description: "Campaign landing page URL.",
      example: "https://example.com/campaigns/weekend",
    },
    {
      key: "discountCode",
      label: "Discount code",
      type: "string",
      required: false,
      description: "Optional discount code shown in the email.",
      example: "DAVINCI20",
    },
    {
      key: "expiresAt",
      label: "Expiration date",
      type: "date",
      required: false,
      description: "Optional campaign expiration date.",
      example: "2026-05-31",
    },
  ],
};

export const getRequiredMailTemplateParameters = (
  mailType: MailType
): string[] =>
  mailTemplateParameterDefinitions[mailType]
    .filter((parameter) => parameter.required)
    .map((parameter) => parameter.key);

export const getInitialMailTemplateValues = (
  mailType: MailType
): Record<string, string> =>
  mailTemplateParameterDefinitions[mailType].reduce<Record<string, string>>(
    (values, parameter) => {
      values[parameter.key] = parameter.example ?? "";
      return values;
    },
    {}
  );
