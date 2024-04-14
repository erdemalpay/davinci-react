import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import SelectInput from "../components/common/SelectInput";
import { Header } from "../components/header/Header";
import GenericTable from "../components/panelComponents/Tables/GenericTable";
import { P1 } from "../components/panelComponents/Typography";
import { AccountCountList, AccountProduct, AccountUnit } from "../types";
import { useGetAccountCountLists } from "../utils/api/account/countList";
import { useGetAccountProducts } from "../utils/api/account/product";

const CountList = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const countLists = useGetAccountCountLists();
  const { countListId } = useParams();
  const products = useGetAccountProducts();
  const countListOptions = countLists?.map((countList) => {
    return {
      value: countList._id,
      label: countList.name,
    };
  });
  const [selectedOption, setSelectedOption] = useState<AccountCountList>();
  const rows = () => {
    let productRows = [];
    const currentCountList = countLists.find(
      (item) => item._id === countListId
    );
    if (currentCountList && currentCountList.products) {
      for (let productId of currentCountList.products) {
        const product = products.find((product) => product._id === productId);
        if (product) {
          productRows.push(product);
        }
      }
    }
    return productRows;
  };

  const columns = [
    { key: t("Name"), isSortable: true },
    { key: t("Unit"), isSortable: true },
    { key: t("Actions"), isSortable: false },
  ];
  const rowKeys = [
    { key: "name" },
    {
      key: "unit",
      node: (row: AccountProduct) => <P1>{(row.unit as AccountUnit)?.name}</P1>,
    },
  ];

  return (
    <>
      <Header showLocationSelector={false} />
      <div className="w-[95%] mx-auto">
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
              navigate(`/count-list/${selectedOption?.value}`);
            }}
            placeholder={t("Select a count list")}
          />
        </div>
      </div>
      <div className="w-[95%] my-10 mx-auto ">
        <GenericTable
          rowKeys={rowKeys}
          columns={columns}
          rows={rows()}
          title={countLists.find((row) => row._id === countListId)?.name}
        />
      </div>
    </>
  );
};

export default CountList;
