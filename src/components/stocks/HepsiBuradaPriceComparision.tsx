import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { TbTag } from "react-icons/tb";
import { useGetAccountProducts } from "../../utils/api/account/product";
import {
  HepsiburadaListing,
  useGetHepsiburadaListings,
  useUpdateAllHepsiburadaPricesMutation,
  useUpdateHepsiburadaProductPriceMutation,
} from "../../utils/api/hepsiburada";
import { useGetMenuItems } from "../../utils/api/menu/menu-item";
import GenericTable from "../panelComponents/Tables/GenericTable";
import ButtonFilter from "../panelComponents/common/ButtonFilter";

interface HepsiburadaListingsResponse {
  listings: HepsiburadaListing[];
  totalCount: number;
  limit: number;
  offset: number;
}

interface HepsiburadaRow {
  _id: string;
  name: string;
  hepsiburadaPrice: number;
  itemPrice: number;
  itemOnlinePrice: number;
  merchantSku?: string;
  hepsiburadaSku?: string;
}

const HepsiBuradaPriceComparision = () => {
  const { t } = useTranslation();
  const hepsiburadaResponse = useGetHepsiburadaListings();
  const hepsiburadaListings =
    (hepsiburadaResponse as unknown as HepsiburadaListingsResponse)?.listings ||
    [];

  const items = useGetMenuItems();
  const products = useGetAccountProducts();
  const { mutate: updateAllHepsiburadaPrices } =
    useUpdateAllHepsiburadaPricesMutation();
  const { mutate: updateHepsiburadaProductPrice } =
    useUpdateHepsiburadaProductPriceMutation();

  const hepsiburadaItemsProductsIds = useMemo(() => {
    return items
      ?.filter((item) => item.hepsiBuradaSku)
      ?.map((item) => item.matchedProduct);
  }, [items]);

  const hepsiburadaItemProducts = useMemo(() => {
    return products?.filter((product) =>
      hepsiburadaItemsProductsIds.includes(product._id)
    );
  }, [products, hepsiburadaItemsProductsIds]);

  const rows = useMemo(() => {
    return hepsiburadaItemProducts
      ?.map((hepsiburadaItemProduct) => {
        const foundItem = items.find(
          (item) => item.matchedProduct === hepsiburadaItemProduct._id
        );
        const foundHepsiburadaListing = hepsiburadaListings?.find(
          (hepsiburadaListing: HepsiburadaListing) =>
            hepsiburadaListing.hepsiburadaSku === foundItem?.hepsiBuradaSku ||
            hepsiburadaListing.merchantSku === foundItem?.hepsiBuradaSku
        );

        return {
          ...hepsiburadaItemProduct,
          hepsiburadaPrice: foundHepsiburadaListing?.price || 0,
          itemPrice: foundItem?.price,
          itemOnlinePrice: foundItem?.onlinePrice,
          merchantSku: foundHepsiburadaListing?.merchantSku,
          hepsiburadaSku: foundHepsiburadaListing?.hepsiburadaSku,
        };
      })
      .sort((a, b) => {
        const isAEqual = a.hepsiburadaPrice === a.itemOnlinePrice;
        const isBEqual = b.hepsiburadaPrice === b.itemOnlinePrice;
        if (isAEqual && !isBEqual) return 1;
        if (!isAEqual && isBEqual) return -1;
        return 0;
      });
  }, [hepsiburadaItemProducts, items, hepsiburadaListings]);

  const columns = useMemo(
    () => [
      { key: t("Product"), isSortable: true },
      { key: t("HepsiBurada Price"), isSortable: true },
      { key: t("Item Price"), isSortable: true },
      { key: t("Item Online Price"), isSortable: true },
      { key: t("Actions"), isSortable: false },
    ],
    [t]
  );

  const rowKeys = useMemo(
    () => [
      { key: "name" },
      { key: "hepsiburadaPrice" },
      { key: "itemPrice" },
      { key: "itemOnlinePrice" },
    ],
    []
  );

  const actions = useMemo(
    () => [
      {
        name: t("Update HepsiBurada Price"),
        icon: <TbTag />,
        className: "cursor-pointer text-2xl",
        onClick: (row: HepsiburadaRow) => {
          if (
            row.hepsiburadaPrice === row.itemOnlinePrice ||
            (!row.merchantSku && !row.hepsiburadaSku)
          )
            return;
          updateHepsiburadaProductPrice({
            merchantSku: row.merchantSku,
            hepsiburadaSku: row.hepsiburadaSku,
            price: row.itemOnlinePrice,
          });
        },
      },
    ],
    [t, updateHepsiburadaProductPrice]
  );

  const filters = useMemo(
    () => [
      {
        isUpperSide: false,
        node: (
          <ButtonFilter
            buttonName={t("Update All HepsiBurada Prices")}
            onclick={() => {
              updateAllHepsiburadaPrices();
            }}
          />
        ),
      },
    ],
    [t, updateAllHepsiburadaPrices]
  );

  return (
    <>
      <div className="w-[95%] mx-auto ">
        <GenericTable
          rowKeys={rowKeys}
          columns={columns}
          rows={rows}
          title={t("HepsiBurada Price Comparision")}
          filters={filters}
          isActionsActive={true}
          actions={actions}
          rowClassNameFunction={(row: HepsiburadaRow) => {
            if (row?.hepsiburadaPrice > row?.itemOnlinePrice) {
              return "bg-red-200";
            }
            if (row?.hepsiburadaPrice < row?.itemOnlinePrice) {
              return "bg-green-200";
            }
            return "";
          }}
        />
      </div>
    </>
  );
};

export default HepsiBuradaPriceComparision;
