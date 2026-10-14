import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { TbTag } from "react-icons/tb";
import { useGetAccountProducts } from "../../utils/api/account/product";
import { useGetMenuItems } from "../../utils/api/menu/menu-item";
import {
  MarketplaceChannel,
  useGetMarketplaceProducts,
  useUpdateAllMarketplacePricesMutation,
  useUpdateMarketplacePriceMutation,
} from "../../utils/api/marketplace";
import GenericTable from "../panelComponents/Tables/GenericTable";
import ButtonFilter from "../panelComponents/common/ButtonFilter";

interface MarketplacePriceRow {
  _id: string;
  name: string;
  marketplacePrice: number;
  itemPrice?: number;
  itemOnlinePrice?: number;
  productKey?: string;
}

const MarketplacePriceComparision = ({
  channel,
}: {
  channel: MarketplaceChannel;
}) => {
  const { t } = useTranslation();
  const marketplaceProducts = useGetMarketplaceProducts(channel);
  const items = useGetMenuItems();
  const products = useGetAccountProducts();
  const { mutate: updateAllPrices } =
    useUpdateAllMarketplacePricesMutation(channel);
  const { mutate: updateMarketplacePrice } =
    useUpdateMarketplacePriceMutation(channel);

  const channelItemProductIds = useMemo(() => {
    return items
      ?.filter((item) => item[channel.menuItemField])
      ?.map((item) => item.matchedProduct);
  }, [items]);

  const channelItemProducts = useMemo(() => {
    return products?.filter((product) =>
      channelItemProductIds.includes(product._id)
    );
  }, [products, channelItemProductIds]);

  const rows = useMemo(() => {
    return channelItemProducts
      ?.map((channelItemProduct) => {
        const foundItem = items.find(
          (item) => item.matchedProduct === channelItemProduct._id
        );
        const foundProduct = marketplaceProducts?.find(
          (product) =>
            product[channel.productKey] === foundItem?.[channel.menuItemField]
        );

        return {
          ...channelItemProduct,
          marketplacePrice: foundProduct
            ? channel.productPrice(foundProduct)
            : 0,
          itemPrice: foundItem?.price,
          itemOnlinePrice: foundItem?.onlinePrice,
          productKey: foundProduct?.[channel.productKey],
        };
      })
      .sort((a, b) => {
        const getOrder = (row: MarketplacePriceRow) => {
          if ((row.itemOnlinePrice ?? 0) > row.marketplacePrice) return 0;
          if ((row.itemOnlinePrice ?? 0) < row.marketplacePrice) return 1;
          return 2;
        };
        return getOrder(a) - getOrder(b);
      });
  }, [channelItemProducts, items, marketplaceProducts]);

  const columns = useMemo(
    () => [
      { key: t("Product"), isSortable: true },
      { key: t(`${channel.label} Price`), isSortable: true },
      { key: t("Item Price"), isSortable: true },
      { key: t("Item Online Price"), isSortable: true },
      { key: t("Actions"), isSortable: false },
    ],
    [t]
  );

  const rowKeys = useMemo(
    () => [
      { key: "name" },
      { key: "marketplacePrice" },
      { key: "itemPrice" },
      { key: "itemOnlinePrice" },
    ],
    []
  );

  const actions = useMemo(
    () => [
      {
        name: t(`Update ${channel.label} Price`),
        icon: <TbTag />,
        className: "cursor-pointer text-2xl",
        onClick: (row: MarketplacePriceRow) => {
          if (
            !row.productKey ||
            !row.itemOnlinePrice ||
            row.marketplacePrice === row.itemOnlinePrice
          )
            return;
          updateMarketplacePrice({
            key: row.productKey,
            value: row.itemOnlinePrice,
          });
        },
      },
    ],
    [t, updateMarketplacePrice]
  );

  const filters = useMemo(
    () => [
      {
        isUpperSide: false,
        node: (
          <ButtonFilter
            buttonName={t(`Update All ${channel.label} Prices`)}
            onclick={() => {
              updateAllPrices();
            }}
          />
        ),
      },
    ],
    [t, updateAllPrices]
  );

  return (
    <>
      <div className="w-[95%] mx-auto ">
        <GenericTable
          rowKeys={rowKeys}
          columns={columns}
          rows={rows}
          title={t(`${channel.label} Price Comparison`)}
          filters={filters}
          isActionsActive={true}
          actions={actions}
          rowClassNameFunction={(row: MarketplacePriceRow) => {
            if ((row?.itemOnlinePrice ?? 0) > row?.marketplacePrice)
              return "bg-red-200";
            if ((row?.itemOnlinePrice ?? 0) < row?.marketplacePrice)
              return "bg-green-200";
            return "";
          }}
        />
      </div>
    </>
  );
};

export default MarketplacePriceComparision;
