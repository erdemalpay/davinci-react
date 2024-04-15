import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import SelectInput from "../components/common/SelectInput";
import { Header } from "../components/header/Header";
import TextInput from "../components/panelComponents/FormElements/TextInput";
import { AccountCountList } from "../types";
import { useGetAccountCountLists } from "../utils/api/account/countList";
import { useGetAccountProducts } from "../utils/api/account/product";

const Count = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [deneme, setDeneme] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const products = useGetAccountProducts();
  const countLists = useGetAccountCountLists();
  const { countListId } = useParams();
  const [selectedOption, setSelectedOption] = useState<AccountCountList>();
  const countListOptions = countLists?.map((countList) => {
    return {
      value: countList._id,
      label: countList.name,
    };
  });
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
                      label={currentProduct?.name ?? ""}
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
      </div>
    </>
  );
};

export default Count;
