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
  useGetN11Products,
  useUpdateAllN11StocksMutation,
  useUpdateN11StockMutation,
} from "../../utils/api/n11";
import Loading from "../common/Loading";
import GenericTable from "../panelComponents/Tables/GenericTable";
import ButtonFilter from "../panelComponents/common/ButtonFilter";

interface N11StockRow {
  _id: string;
  name: string;
  n11Stock: number;
  storeStock: number;
  storeStockId?: string;
  stockCode?: string;
  foundStock?: any;
}

const N11StockComparision = () => {
  const { t } = useTranslation();
  const n11Products = useGetN11Products();
  const items = useGetMenuItems();
  const stocks = useGetAccountStocks();
  const products = useGetAccountProducts();
  const { mutate: updateAllN11Stocks, isPending: isUpdatingN11Stocks } =
    useUpdateAllN11StocksMutation();
  const { mutate: updateN11Stock } = useUpdateN11StockMutation();
  const { updateAccountStock } = useAccountStockMutations();

  const n11ItemsProductsIds = useMemo(() => {
    return items
      ?.filter((item) => item.n11StockCode)
      ?.map((item) => item.matchedProduct);
  }, [items]);

  const n11ItemProducts = useMemo(() => {
    return products?.filter((product) =>
      n11ItemsProductsIds.includes(product._id)
    );
  }, [products, n11ItemsProductsIds]);

  const rows = useMemo(() => {
    return n11ItemProducts
      ?.map((n11ItemProduct) => {
        const foundStock = stocks.find(
          (stock) =>
            stock.product === n11ItemProduct._id && stock.location === 6
        );
        const foundMenuItem = items.find(
          (item) => item?.matchedProduct === n11ItemProduct._id
        );
        const foundN11Product = n11Products?.find(
          (n11Product) => n11Product.stockCode === foundMenuItem?.n11StockCode
        );

        return {
          ...n11ItemProduct,
          n11Stock: foundN11Product?.quantity ?? 0,
          storeStock: foundStock?.quantity ?? 0,
          storeStockId: foundStock?._id,
          stockCode: foundN11Product?.stockCode,
          foundStock: foundStock,
        };
      })
      .sort((a, b) => {
        const getOrder = (row: N11StockRow) => {
          if (row.n11Stock > row.storeStock) return 0;
          if (row.n11Stock < row.storeStock) return 1;
          return 2;
        };
        return getOrder(a) - getOrder(b);
      });
  }, [n11ItemProducts, stocks, n11Products, items]);

  const columns = useMemo(
    () => [
      { key: t("Product"), isSortable: true },
      { key: t("n11 Stock"), isSortable: true },
      { key: t("Store Stock"), isSortable: true },
      { key: t("Actions"), isSortable: false },
    ],
    [t]
  );

  const rowKeys = useMemo(
    () => [{ key: "name" }, { key: "n11Stock" }, { key: "storeStock" }],
    []
  );

  const actions = useMemo(
    () => [
      {
        name: t("Update Store Stock"),
        icon: <RiFileTransferFill />,
        className: "cursor-pointer text-2xl",
        onClick: (row: N11StockRow) => {
          if (row.n11Stock === row.storeStock) return;
          updateAccountStock({
            id: row?.storeStockId ?? "",
            updates: {
              ...row?.foundStock,
              quantity: row?.n11Stock,
            },
          });
        },
      },
      {
        name: t("Update n11 Stock"),
        icon: <TbTransferOut />,
        className: "cursor-pointer text-2xl",
        onClick: (row: N11StockRow) => {
          if (row.n11Stock === row.storeStock || !row.stockCode) return;
          updateN11Stock({
            stockCode: row.stockCode,
            quantity: row.storeStock,
          });
        },
      },
    ],
    [t, updateAccountStock, updateN11Stock]
  );

  const filters = useMemo(
    () => [
      {
        isUpperSide: false,
        isDisabled: isUpdatingN11Stocks,
        node: (
          <ButtonFilter
            buttonName={
              isUpdatingN11Stocks ? t("Updating...") : t("Update n11 Stocks")
            }
            onclick={() => {
              updateAllN11Stocks();
            }}
          />
        ),
      },
    ],
    [t, updateAllN11Stocks, isUpdatingN11Stocks]
  );

  return (
    <>
      {isUpdatingN11Stocks && <Loading />}
      <div className="w-[95%] mx-auto">
        <GenericTable
          rowKeys={rowKeys}
          columns={columns}
          rows={rows}
          title={t("n11 Stock Comparison")}
          filters={filters}
          isActionsActive={true}
          actions={actions}
          rowClassNameFunction={(row: N11StockRow) => {
            if (row?.n11Stock > row?.storeStock) return "bg-red-200";
            if (row?.n11Stock < row?.storeStock) return "bg-green-200";
            return "";
          }}
        />
      </div>
    </>
  );
};

export default N11StockComparision;
