import { format } from "date-fns";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import SelectInput from "../components/common/SelectInput";
import { Header } from "../components/header/Header";
import GenericAddEditPanel from "../components/panelComponents/FormElements/GenericAddEditPanel";
import TextInput from "../components/panelComponents/FormElements/TextInput";
import {
  FormKeyTypeEnum,
  InputTypes,
} from "../components/panelComponents/shared/types";
import { H5 } from "../components/panelComponents/Typography";
import { useUserContext } from "../context/User.context";
import { AccountCountList, AccountUnit } from "../types";
import { useAccountCountMutations } from "../utils/api/account/count";
import { useGetAccountCountLists } from "../utils/api/account/countList";
import { useGetAccountProducts } from "../utils/api/account/product";
import { useGetAccountStockLocations } from "../utils/api/account/stockLocation";

const Count = () => {
  const { t } = useTranslation();
  const { user } = useUserContext();
  const navigate = useNavigate();
  const [deneme, setDeneme] = useState("");
  const locations = useGetAccountStockLocations();
  const [searchQuery, setSearchQuery] = useState("");
  const products = useGetAccountProducts();
  const { createAccountCount } = useAccountCountMutations();
  const countLists = useGetAccountCountLists();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [form, setForm] = useState({
    location: "",
  });
  const [countProducts, setCountProducts] =
    useState<
      { product: string; stockQuantity: number; countQuantity: number | null }[]
    >();
  const { countListId } = useParams();
  const [selectedOption, setSelectedOption] = useState<AccountCountList>();
  const countListOptions = countLists?.map((countList) => {
    return {
      value: countList._id,
      label: countList.name,
    };
  });
  const createInputs = [
    {
      type: InputTypes.SELECT,
      formKey: "location",
      label: t("Location"),
      options: locations.map((location) => {
        return {
          value: location._id,
          label: location.name,
        };
      }),
      placeholder: t("Location"),
      required: true,
    },
  ];
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
          countQuantity: null,
        }));

        setCountProducts(newCountProducts);

        localStorage.setItem(
          `count-${countListId}`,
          JSON.stringify(newCountProducts)
        );
      }
    }
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
  const createFormKeys = [{ key: "location", type: FormKeyTypeEnum.STRING }];
  return (
    <>
      <Header />
      <div className="w-[95%] mx-auto ">
        <div className="sm:w-1/4 ">
          <SelectInput
            options={countListOptions}
            value={
              selectedOption
                ? {
                    value: selectedOption._id,
                    label: selectedOption.name,
                  }
                : {
                    value:
                      countLists.find((l) => l._id === countListId)?._id ?? "",
                    label:
                      countLists.find((l) => l._id === countListId)?.name ?? "",
                  }
            }
            onChange={(selectedOption) => {
              setSelectedOption(
                countLists?.find(
                  (option) => option._id === selectedOption?.value
                )
              );
              navigate(`/count/${selectedOption?.value}`);
            }}
            placeholder={t("Select a count list")}
          />
        </div>
      </div>
      <div className="my-10  px-10  flex flex-col gap-4">
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
        <div className=" flex flex-col gap-2 sm:grid sm:grid-cols-1 md:grid-cols-3 __className_a182b8">
          {countListId &&
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
                return (
                  <div
                    key={currentProduct?._id}
                    className="border border-gray-200 rounded-md px-4 py-1"
                  >
                    <TextInput
                      label={
                        currentProduct?.name +
                          " (" +
                          (currentProduct?.unit as AccountUnit)?.name +
                          ")" ?? ""
                      }
                      value={deneme}
                      onChange={setDeneme}
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
          disabled={true} //it willl be fixed
          className="px-2 ml-auto bg-blue-500 hover:text-blue-500 hover:border-blue-500 sm:px-3 py-1 h-fit w-fit  text-white  hover:bg-white  transition-transform  border  rounded-md cursor-pointer"
          onClick={() => {
            setIsAddModalOpen(true);
          }}
        >
          <H5> {t("Complete")}</H5>
        </button>
      </div>
      {isAddModalOpen && (
        <GenericAddEditPanel
          isOpen={isAddModalOpen}
          close={() => setIsAddModalOpen(false)}
          inputs={createInputs}
          formKeys={createFormKeys}
          submitFunction={() => {
            form.location &&
              user &&
              createAccountCount({
                ...form,
                status: "NotChecked",
                date: format(new Date(), "yyyy-MM-dd"),
                user: user._id,
              });
          }}
          submitItem={createAccountCount as any}
          topClassName="flex flex-col gap-2 "
          setForm={setForm}
        />
      )}
    </>
  );
};

export default Count;
