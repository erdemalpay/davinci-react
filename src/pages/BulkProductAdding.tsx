import { useTranslation } from "react-i18next";
import { Header } from "../components/header/Header";
import GenericTable from "../components/panelComponents/Tables/GenericTable";

const BulkProductAdding = () => {
  const { t } = useTranslation();
  const rows = [
    {
      name: "7 Wonders Duel",
      expenseType: "Oyun Satışı",
      brand: "    ",
      vendor: "Kaissa Games",
      category: "İthal Oyunlar",
      price: 2100,
      onlinePrice: 2450,
      description: "    ",
    },
    {
      name: "Orta boy çöp poşeti",
      expenseType: "Genel,Mutfak Genel",
      brand: "Eczacıbaşı,Selpak",
      vendor: "Öz Rize,Anka Toptan,Pem Ambalaj",
      category: "     ",
      price: "  ",
      onlinePrice: "   ",
      description: "    ",
    },
    {
      name: "Margharita",
      expenseType: "    ",
      brand: "    ",
      vendor: "    ",
      category: "Pizzalar",
      price: 280,
      onlinePrice: "   ",
      description: "Domates sos, Mozerella peyniri, Fesleğen",
    },
  ];
  const columns = [
    {
      key: `${t("Name")} **`,
      isSortable: false,
      className: "text-red-500",
      correspondingKey: "name",
    },
    {
      key: `${t("Expense Type")} *`,
      isSortable: true,
      className: "text-blue-500",
      correspondingKey: "expenseType",
    },
    {
      key: t("Brand"),
      isSortable: true,
      className: "text-blue-500",
      correspondingKey: "brand",
    },
    {
      key: t("Vendor"),
      isSortable: true,
      className: "text-blue-500",
      correspondingKey: "vendor",
    },
    {
      key: `${t("Menu Category")} *`,
      isSortable: true,
      className: "text-orange-500",
      correspondingKey: "category",
    },
    {
      key: `${t("Price")} *`,
      isSortable: true,
      correspondingKey: "price",
      className: "text-orange-500",
    },
    {
      key: t("Online Price"),
      isSortable: true,
      correspondingKey: "onlinePrice",
      className: "text-orange-500",
    },
    {
      key: t("Description"),
      isSortable: true,
      correspondingKey: "description",
      className: "text-orange-500",
    },
  ];
  const rowKeys = [
    { key: "name" },
    { key: "expenseType", className: "pr-4" },
    { key: "brand", className: "pr-4" },
    { key: "vendor", className: "pr-4" },
    { key: "category" },
    { key: "price" },
    { key: "onlinePrice" },
    { key: "description" },
  ];
  return (
    <>
      <Header showLocationSelector={false} />
      <div className="w-[98%] mx-auto my-10 flex flex-col gap-6 ">
        <GenericTable
          rows={rows}
          rowKeys={rowKeys}
          isActionsActive={false}
          columns={columns}
          isExcel={true}
          title={t("Bulk Product Adding")}
          isSearch={false}
          isColumnFilter={false}
          isPagination={false}
          isRowsPerPage={false}
          //   filters={filters}
          excelFileName={t("BulkProductAdding.xlsx")}
        />
        <p className="indent-2 text-sm">
          {t(
            "The Name field must not be left blank. The blue columns are designated for entering product details, while the orange columns are for menu item details. Fields marked with an asterisk (*) are mandatory. You can fill out either product details or menu item details independently.The Expense Type, Brand and Vendor fields allow multiple entries. When entering multiple values, separate them with commas."
          )}
        </p>
      </div>
    </>
  );
};

export default BulkProductAdding;
