import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { RiFileTransferFill } from "react-icons/ri";
import { TbTransferOut } from "react-icons/tb";
import { useGetAccountProducts } from "../../utils/api/account/product";
import {
  useAccountStockMutations,
  useGetAccountStocks,
} from "../../utils/api/account/stock";
import { useGetMenuItems } from "../../utils/api/menu/menu-item";
import {
  MarketplaceChannel,
  useGetMarketplaceProducts,
  useUpdateAllMarketplaceStocksMutation,
  useUpdateMarketplaceStockMutation,
} from "../../utils/api/marketplace";
import Loading from "../common/Loading";
import GenericTable from "../panelComponents/Tables/GenericTable";
import ButtonFilter from "../panelComponents/common/ButtonFilter";

interface MarketplaceStockRow {
  _id: string;
  name: string;
  marketplaceStock: number;
  storeStock: number;
  storeStockId?: string;
  productKey?: string;
  foundStock?: any;
}

const MarketplaceStockComparision = ({
  channel,
}: {
  channel: MarketplaceChannel;
}) => {
  const { t } = useTranslation();
  const marketplaceProducts = useGetMarketplaceProducts(channel);
  const items = useGetMenuItems();
  const stocks = useGetAccountStocks();
  const products = useGetAccountProducts();
  const { mutate: updateAllStocks, isPending: isUpdatingStocks } =
    useUpdateAllMarketplaceStocksMutation(channel);
  const { mutate: updateMarketplaceStock } =
    useUpdateMarketplaceStockMutation(channel);
  const { updateAccountStock } = useAccountStockMutations();

  const channelItemProductIds = useMemo(() => {
    return items
      ?.filter((item) => item[channel.menuItemField])
      ?.map((item) => item.matchedProduct);
  }, [items, channel]);

  const channelItemProducts = useMemo(() => {
    return products?.filter((product) =>
      channelItemProductIds.includes(product._id)
    );
  }, [products, channelItemProductIds]);

  const rows = useMemo(() => {
    return channelItemProducts
      ?.map((channelItemProduct) => {
        const foundStock = stocks.find(
          (stock) =>
            stock.product === channelItemProduct._id && stock.location === 6
        );
        const foundMenuItem = items.find(
          (item) => item?.matchedProduct === channelItemProduct._id
        );
        const foundProduct = marketplaceProducts?.find(
          (product) =>
            product[channel.productKey] ===
            foundMenuItem?.[channel.menuItemField]
        );

        return {
          ...channelItemProduct,
          marketplaceStock: foundProduct
            ? channel.productStock(foundProduct)
            : 0,
          storeStock: foundStock?.quantity ?? 0,
          storeStockId: foundStock?._id,
          productKey: foundProduct?.[channel.productKey],
          foundStock: foundStock,
        };
      })
      .sort((a, b) => {
        const getOrder = (row: MarketplaceStockRow) => {
          if (row.marketplaceStock > row.storeStock) return 0;
          if (row.marketplaceStock < row.storeStock) return 1;
          return 2;
        };
        return getOrder(a) - getOrder(b);
      });
  }, [channelItemProducts, stocks, marketplaceProducts, items, channel]);

  const columns = useMemo(
    () => [
      { key: t("Product"), isSortable: true },
      { key: t(`${channel.label} Stock`), isSortable: true },
      { key: t("Store Stock"), isSortable: true },
      { key: t("Actions"), isSortable: false },
    ],
    [t, channel]
  );

  const rowKeys = useMemo(
    () => [{ key: "name" }, { key: "marketplaceStock" }, { key: "storeStock" }],
    []
  );

  const actions = useMemo(
    () => [
      {
        name: t("Update Store Stock"),
        icon: <RiFileTransferFill />,
        className: "cursor-pointer text-2xl",
        onClick: (row: MarketplaceStockRow) => {
          if (row.marketplaceStock === row.storeStock) return;
          updateAccountStock({
            id: row?.storeStockId ?? "",
            updates: {
              ...row?.foundStock,
              quantity: row?.marketplaceStock,
            },
          });
        },
      },
      {
        name: t(`Update ${channel.label} Stock`),
        icon: <TbTransferOut />,
        className: "cursor-pointer text-2xl",
        onClick: (row: MarketplaceStockRow) => {
          if (row.marketplaceStock === row.storeStock || !row.productKey)
            return;
          updateMarketplaceStock({
            key: row.productKey,
            value: row.storeStock,
          });
        },
      },
    ],
    [t, channel, updateAccountStock, updateMarketplaceStock]
  );

  const filters = useMemo(
    () => [
      {
        isUpperSide: false,
        isDisabled: isUpdatingStocks,
        node: (
          <ButtonFilter
            buttonName={
              isUpdatingStocks
                ? t("Updating...")
                : t(`Update ${channel.label} Stocks`)
            }
            onclick={() => {
              updateAllStocks();
            }}
          />
        ),
      },
    ],
    [t, channel, updateAllStocks, isUpdatingStocks]
  );

  return (
    <>
      {isUpdatingStocks && <Loading />}
      <div className="w-[95%] mx-auto">
        <GenericTable
          rowKeys={rowKeys}
          columns={columns}
          rows={rows}
          title={t(`${channel.label} Stock Comparison`)}
          filters={filters}
          isActionsActive={true}
          actions={actions}
          rowClassNameFunction={(row: MarketplaceStockRow) => {
            if (row?.marketplaceStock > row?.storeStock) return "bg-red-200";
            if (row?.marketplaceStock < row?.storeStock) return "bg-green-200";
            return "";
          }}
        />
      </div>
    </>
  );
};

export default MarketplaceStockComparision;
