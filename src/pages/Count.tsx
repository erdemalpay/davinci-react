import { format } from "date-fns";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { Header } from "../components/header/Header";
import TextInput from "../components/panelComponents/FormElements/TextInput";
import { H5 } from "../components/panelComponents/Typography";
import { useGeneralContext } from "../context/General.context";
import { useUserContext } from "../context/User.context";
import { Routes } from "../navigation/constants";
import { AccountStockLocation, StocksPageTabEnum } from "../types";
import { useAccountCountMutations } from "../utils/api/account/count";
import { useGetAccountCountLists } from "../utils/api/account/countList";
import { useGetAccountProducts } from "../utils/api/account/product";

const Count = () => {
  const { t } = useTranslation();
  const { user } = useUserContext();
  const navigate = useNavigate();
  const [countProductsKey, setCountProductsKey] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const products = useGetAccountProducts();
  const { setAccountingActiveTab } = useGeneralContext();
  const { createAccountCount } = useAccountCountMutations();
  const countLists = useGetAccountCountLists();
  const [countProducts, setCountProducts] = useState<
    {
      product: string;
      stockQuantity: number;
      countQuantity: number | string;
    }[]
  >([]);
  const { countListId } = useParams();

  useEffect(() => {
    const localData = localStorage.getItem(`count-${countListId}`);
    if (localData) {
      setCountProducts(JSON.parse(localData));
    } else {
      const foundList = countLists.find((item) => item._id === countListId);

      if (foundList?.products) {
        const newCountProducts = foundList.products.map((product) => ({
          product: product,
          stockQuantity: 0,
          countQuantity: "",
        }));
        setCountProducts(newCountProducts);
        localStorage.setItem(
          `count-${countListId}`,
          JSON.stringify(newCountProducts)
        );
      }
    }
    setCountProductsKey((prev) => prev + 1);
  }, [countListId, countLists]);

  const handleCountProductChange = (
    product: string,
    key: string,
    value: any
  ) => {
    const newCountProducts = countProducts?.map((item) => {
      if (item.product === product) {
        return {
          ...item,
          [key]: value,
        };
      }
      return item;
    });

    setCountProducts(newCountProducts);
    localStorage.setItem(
      `count-${countListId}`,
      JSON.stringify(newCountProducts)
    );
  };
  const submitFunction = () => {
    if (
      user &&
      countProducts?.filter((item) => item.countQuantity === "").length === 0 &&
      countProducts.length > 0
    ) {
      createAccountCount({
        location: (
          countLists.find((item) => item._id === countListId)
            ?.location as AccountStockLocation
        )._id,
        countList: countListId,
        status: false,
        date: format(new Date(), "yyyy-MM-dd"),
        user: user._id,
        products: countProducts.map((item) => ({
          product: item.product,
          countQuantity: item.countQuantity as number,
          stockQuantity: item.stockQuantity,
        })),
      });
      const foundList = countLists.find((item) => item._id === countListId);
      if (foundList?.products) {
        const newCountProducts = foundList.products.map((product) => ({
          product: product,
          stockQuantity: 0,
          countQuantity: "",
        }));
        setCountProducts(newCountProducts);

        localStorage.setItem(
          `count-${countListId}`,
          JSON.stringify(newCountProducts)
        );
        setCountProductsKey((prev) => prev + 1);
      }
      setAccountingActiveTab(StocksPageTabEnum.COUNTLIST);
      navigate(Routes.Stocks);
    } else {
      toast.error(t("Please fill all the fields"));
    }
  };

  return (
    <>
      <Header />
      <div className="my-10 px-4 sm:px-10  flex flex-col gap-4">
        {/* search button */}
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
          }}
          placeholder={t("Search")}
          className="border border-gray-200 rounded-md py-2 px-3 w-fit focus:outline-none"
        />
        {/* count inputs */}
        <div
          key={countProductsKey}
          className=" flex flex-col gap-2 sm:grid sm:grid-cols-1 md:grid-cols-3 __className_a182b8"
        >
          {countListId &&
            countProducts &&
            countLists
              .find((row) => row._id === countListId)
              ?.products?.filter((item) => {
                return products
                  .find((o) => o._id === item)
                  ?.name.toLowerCase()
                  .includes(searchQuery.toLowerCase());
              })
              ?.map((product) => {
                const currentProduct = products.find(
                  (item) => item._id === product
                );
                const currentValue = countProducts
                  ?.find((item) => item.product === currentProduct?._id)
                  ?.countQuantity?.toString();

                return (
                  <div
                    key={currentProduct?._id}
                    className="border border-gray-200 rounded-md px-4 py-1"
                  >
                    <TextInput
                      label={currentProduct?.name ?? ""}
                      value={currentValue ?? ""}
                      onChange={(target) => {
                        handleCountProductChange(
                          currentProduct?._id ?? "",
                          "countQuantity",
                          target
                        );
                      }}
                      type="number"
                      inputWidth={"w-[30%] ml-auto "}
                      isTopFlexRow={true}
                    />
                  </div>
                );
              })}
        </div>
        {/* complete button */}
        <button
          className="px-2 ml-auto bg-blue-500 hover:text-blue-500 hover:border-blue-500 sm:px-3 py-1 h-fit w-fit  text-white  hover:bg-white  transition-transform  border  rounded-md cursor-pointer"
          onClick={submitFunction}
        >
          <H5> {t("Complete")}</H5>
        </button>
      </div>
    </>
  );
};

export default Count;
