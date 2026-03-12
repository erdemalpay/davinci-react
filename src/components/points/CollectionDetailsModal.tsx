import { useTranslation } from "react-i18next";
import { FormattedCollectionData } from "../../hooks/useFormattedCollectionData";

type CollectionDetailsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  collectionData: FormattedCollectionData;
};

const CollectionDetailsModal = ({
  isOpen,
  onClose,
  collectionData,
}: CollectionDetailsModalProps) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg w-11/12 md:w-3/4 lg:w-3/5 xl:w-2/5 max-w-3xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 flex-1 overflow-y-auto">
          <h3 className="text-lg font-semibold mb-4">{t("Collection Details")}</h3>

          {/* Collection Info Grid */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="text-sm font-medium text-gray-700">{t("Date")}</label>
              <p className="text-sm text-gray-900">{collectionData.date}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">{t("Create Hour")}</label>
              <p className="text-sm text-gray-900">{collectionData.hour}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">{t("Table Id")}</label>
              <p className="text-sm text-gray-900">{collectionData.tableId}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">{t("Table Name")}</label>
              <p className="text-sm text-gray-900">{collectionData.tableName}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">{t("Location")}</label>
              <p className="text-sm text-gray-900">{collectionData.locationName}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">{t("Created By")}</label>
              <p className="text-sm text-gray-900">{collectionData.cashier}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">{t("Amount")}</label>
              <p className="text-sm text-gray-900">{collectionData.amount?.toFixed(2)} ₺</p>
            </div>
            {collectionData.shopifyShippingAmount !== undefined &&
              collectionData.shopifyShippingAmount !== null && (
                <div>
                  <label className="text-sm font-medium text-gray-700">{t("Shipping Cost")}</label>
                  <p className="text-sm text-gray-900">
                    {collectionData.shopifyShippingAmount?.toFixed(2)} ₺
                  </p>
                </div>
              )}
            {collectionData.shopifyDiscountAmount !== undefined &&
              collectionData.shopifyDiscountAmount !== null && (
                <div>
                  <label className="text-sm font-medium text-gray-700">{t("Discount")}</label>
                  <p className="text-sm text-gray-900">
                    {collectionData.shopifyDiscountAmount?.toFixed(2)} ₺
                  </p>
                </div>
              )}
            <div>
              <label className="text-sm font-medium text-gray-700">{t("Status")}</label>
              <p className="text-sm text-gray-900">{t(collectionData.status)}</p>
            </div>
            {collectionData.cancelledBy && (
              <div>
                <label className="text-sm font-medium text-gray-700">{t("Cancelled By")}</label>
                <p className="text-sm text-gray-900">{collectionData.cancelledBy}</p>
              </div>
            )}
            {collectionData.cancelledAt && (
              <div>
                <label className="text-sm font-medium text-gray-700">{t("Cancelled At")}</label>
                <p className="text-sm text-gray-900">{collectionData.cancelledAt}</p>
              </div>
            )}
            {collectionData.cancelNote && (
              <div className="col-span-2">
                <label className="text-sm font-medium text-gray-700">{t("Cancel Note")}</label>
                <p className="text-sm text-gray-900">{collectionData.cancelNote}</p>
              </div>
            )}
          </div>

          {/* Orders Table */}
          {collectionData.orders && collectionData.orders.length > 0 && (
            <div className="border-t pt-4">
              <h4 className="text-md font-semibold mb-3">{t("Orders")}</h4>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t("Product")}
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t("Quantity")}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {collectionData.orders.map(
                    (order: { product: string; quantity: number }, index: number) => (
                      <tr key={index}>
                        <td className="px-4 py-2 text-sm text-gray-900">{order.product}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{order.quantity}</td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer with Close button on the right */}
        <div className="px-6 py-4 border-t flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
          >
            {t("Close")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CollectionDetailsModal;
