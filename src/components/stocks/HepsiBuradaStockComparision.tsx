import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { RiFileTransferFill } from "react-icons/ri";
import { TbTransferOut } from "react-icons/tb";
import { useUserContext } from "../../context/User.context";
import { ActionEnum, DisabledConditionEnum } from "../../types";
import { useGetAccountProducts } from "../../utils/api/account/product";
import {
  useAccountStockMutations,
  useGetAccountStocks,
} from "../../utils/api/account/stock";
import {
  HepsiburadaListing,
  useGetHepsiburadaListings,
  useUpdateAllHepsiburadaStocksMutation,
  useUpdateHepsiburadaProductStockMutation,
} from "../../utils/api/hepsiburada";
import { useGetMenuItems } from "../../utils/api/menu/menu-item";
import { useGetDisabledConditions } from "../../utils/api/panelControl/disabledCondition";
import { getItem } from "../../utils/getItem";
import { isActionDisabled } from "../../utils/permissions";
import Loading from "../common/Loading";
import GenericTable from "../panelComponents/Tables/GenericTable";
import ButtonFilter from "../panelComponents/common/ButtonFilter";

interface HepsiburadaListingsResponse {
  listings: HepsiburadaListing[];
  totalCount: number;
  limit: number;
  offset: number;
}

interface HepsiburadaStockRow {
  _id: string;
  name: string;
  hepsiburadaStock: number;
  storeStock: number;
  storeStockId?: string;
  merchantSku?: string;
  hepsiburadaSku?: string;
  foundStock?: any;
  itemPrice?: number;
}

const HepsiBuradaStockComparision = () => {
  const { t } = useTranslation();
  const { user } = useUserContext();
  const disabledConditions = useGetDisabledConditions();
  const hepsiburadaStockComparisionPageDisabledCondition = useMemo(
    () => getItem(DisabledConditionEnum.INTEGRATION_HEPSIBURADASTOCKCOMPARISION, disabledConditions),
    [disabledConditions]
  );
  const hepsiburadaResponse = useGetHepsiburadaListings();
  const hepsiburadaListings =
    (hepsiburadaResponse as unknown as HepsiburadaListingsResponse)?.listings ||
    [];
  const items = useGetMenuItems();
  const stocks = useGetAccountStocks();
  const products = useGetAccountProducts();
  const {
    mutate: updateAllHepsiburadaStocks,
    isPending: isUpdatingHepsiburadaStocks,
  } = useUpdateAllHepsiburadaStocksMutation();
  const { mutate: updateHepsiburadaProductStock } =
    useUpdateHepsiburadaProductStockMutation();
  const { updateAccountStock } = useAccountStockMutations();

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
        const foundStock = stocks.find(
          (stock) =>
            stock.product === hepsiburadaItemProduct._id && stock.location === 6
        );
        const foundMenuItem = items.find(
          (item) => item?.matchedProduct === hepsiburadaItemProduct._id
        );
        const foundHepsiburadaListing = hepsiburadaListings?.find(
          (hepsiburadaListing: HepsiburadaListing) =>
            hepsiburadaListing.hepsiburadaSku ===
              foundMenuItem?.hepsiBuradaSku ||
            hepsiburadaListing.merchantSku === foundMenuItem?.hepsiBuradaSku
        );

        return {
          ...hepsiburadaItemProduct,
          hepsiburadaStock: foundHepsiburadaListing?.availableStock ?? 0,
          storeStock: foundStock?.quantity ?? 0,
          storeStockId: foundStock?._id,
          merchantSku: foundHepsiburadaListing?.merchantSku,
          hepsiburadaSku: foundHepsiburadaListing?.hepsiburadaSku,
          foundStock: foundStock,
          itemPrice: foundMenuItem?.onlinePrice || foundMenuItem?.price,
        };
      })
      .sort((a, b) => {
        const getOrder = (row: HepsiburadaStockRow) => {
          if (row.hepsiburadaStock > row.storeStock) return 0;
          if (row.hepsiburadaStock < row.storeStock) return 1;
          return 2;
        };
        return getOrder(a) - getOrder(b);
      });
  }, [hepsiburadaItemProducts, stocks, hepsiburadaListings, items]);

  const columns = useMemo(
    () => [
      { key: t("Product"), isSortable: true },
      { key: t("HepsiBurada Stock"), isSortable: true },
      { key: t("Store Stock"), isSortable: true },
      { key: t("Actions"), isSortable: false },
    ],
    [t]
  );

  const rowKeys = useMemo(
    () => [{ key: "name" }, { key: "hepsiburadaStock" }, { key: "storeStock" }],
    []
  );

  const actions = useMemo(
    () => [
      {
        name: t("Update Store Stock"),
        icon: <RiFileTransferFill />,
        className: "cursor-pointer text-2xl",
        onClick: (row: HepsiburadaStockRow) => {
          if (row.hepsiburadaStock === row.storeStock) return;
          updateAccountStock({
            id: row?.storeStockId ?? "",
            updates: {
              ...row?.foundStock,
              quantity: row?.hepsiburadaStock,
            },
          });
        },
        isDisabled: isActionDisabled(hepsiburadaStockComparisionPageDisabledCondition, ActionEnum.UPDATESTORESTOCK, user),
      },
      {
        name: t("Update HepsiBurada Stock"),
        icon: <TbTransferOut />,
        className: "cursor-pointer text-2xl",
        onClick: (row: HepsiburadaStockRow) => {
          if (
            row.hepsiburadaStock === row.storeStock ||
            (!row.merchantSku && !row.hepsiburadaSku)
          )
            return;
          updateHepsiburadaProductStock({
            merchantSku: row.merchantSku,
            hepsiburadaSku: row.hepsiburadaSku,
            availableStock: row.storeStock,
            price: row.itemPrice ?? 0,
          });
        },
        isDisabled: isActionDisabled(hepsiburadaStockComparisionPageDisabledCondition, ActionEnum.UPDATEREMOTESTOCK, user),
      },
    ],
    [t, updateAccountStock, updateHepsiburadaProductStock, hepsiburadaStockComparisionPageDisabledCondition, user]
  );

  const filters = useMemo(
    () => [
      {
        isUpperSide: false,
        isDisabled: isUpdatingHepsiburadaStocks || isActionDisabled(hepsiburadaStockComparisionPageDisabledCondition, ActionEnum.SYNC, user),
        node: (
          <ButtonFilter
            buttonName={
              isUpdatingHepsiburadaStocks
                ? t("Updating...")
                : t("Update HepsiBurada Stocks")
            }
            onclick={() => {
              updateAllHepsiburadaStocks();
            }}
          />
        ),
      },
    ],
    [t, updateAllHepsiburadaStocks, isUpdatingHepsiburadaStocks, hepsiburadaStockComparisionPageDisabledCondition, user]
  );

  return (
    <>
      {isUpdatingHepsiburadaStocks && <Loading />}
      <div className="w-[95%] mx-auto">
        <GenericTable
          rowKeys={rowKeys}
          columns={columns}
          rows={rows}
          title={t("HepsiBurada Stock Comparison")}
          filters={filters}
          isActionsActive={true}
          actions={actions}
          rowClassNameFunction={(row: HepsiburadaStockRow) => {
            if (row?.hepsiburadaStock > row?.storeStock) {
              return "bg-red-200";
            }
            if (row?.hepsiburadaStock < row?.storeStock) {
              return "bg-green-200";
            }
            return "";
          }}
        />
      </div>
    </>
  );
};

export default HepsiBuradaStockComparision;
