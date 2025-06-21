import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { IoIosArrowForward } from "react-icons/io";
import { RiDeleteBinLine } from "react-icons/ri";
import { toast } from "react-toastify";
import { useGeneralContext } from "../../context/General.context";
import { TURKISHLIRA } from "../../types";
import { useGetStockLocations } from "../../utils/api/location";
import { useGetCategories } from "../../utils/api/menu/category";
import {
  useCreateDamagedItemMutation,
  useGetMenuItems,
  useMenuItemMutations,
} from "../../utils/api/menu/menu-item";
import { getItem } from "../../utils/getItem";
import { NameInput } from "../../utils/panelInputs";
import { Header } from "../header/Header";
import ImageUpload from "../imageUpload/ImageUpload";
import GenericAddEditPanel from "../panelComponents/FormElements/GenericAddEditPanel";
import { H5 } from "../panelComponents/Typography";
import { FormKeyTypeEnum, InputTypes } from "../panelComponents/shared/types";

const ItemPage = () => {
  const { t } = useTranslation();
  const categories = useGetCategories();
  const { selectedMenuItem, setSelectedMenuItem } = useGeneralContext();
  const items = useGetMenuItems();
  const foundItem = getItem(selectedMenuItem?._id, items);
  const [componentKey, setComponentKey] = useState(0);
  const stockLocations = useGetStockLocations();
  const { mutate: createDamagedItem } = useCreateDamagedItemMutation();
  const { updateItem } = useMenuItemMutations();
  const [isCreateDamagedItemOpen, setIsCreateDamagedItemOpen] = useState(false);
  if (!categories || !selectedMenuItem) return null;
  const [form, setForm] = useState({
    name: "",
    oldStockLocation: 0,
    newStockLocation: 0,
    stockQuantity: 0,
    price: 0,
    category: 0,
    itemId: selectedMenuItem?._id,
  });
  const handleDeleteImage = (image: string) => {
    if (!foundItem) return;
    const updatedImages = foundItem?.productImages?.filter(
      (img) => img !== image
    );
    updateItem({
      id: foundItem._id,
      updates: {
        ...foundItem,
        productImages: updatedImages ?? [],
      },
    });
  };
  const createDamagedItemInputs = [
    NameInput(),
    {
      type: InputTypes.SELECT,
      formKey: "oldStockLocation",
      label: t("Old Stock Location"),
      options: stockLocations?.map((location) => {
        return {
          value: location._id,
          label: location.name,
        };
      }),
      placeholder: t("Old Stock Location"),
      required: true,
    },
    {
      type: InputTypes.SELECT,
      formKey: "newStockLocation",
      label: t("New Stock Location"),
      options: stockLocations?.map((location) => {
        return {
          value: location._id,
          label: location.name,
        };
      }),
      placeholder: t("New Stock Location"),
      required: true,
    },
    {
      type: InputTypes.NUMBER,
      formKey: "stockQuantity",
      label: t("Stock Quantity"),
      placeholder: t("Stock Quantity"),
      required: true,
    },
    {
      type: InputTypes.NUMBER,
      formKey: "price",
      label: t("Price"),
      placeholder: t("Price"),
      required: true,
    },
    {
      type: InputTypes.SELECT,
      formKey: "category",
      label: t("Category"),
      options: categories?.map((category) => {
        return {
          value: category._id,
          label: category.name,
        };
      }),
      placeholder: t("Category"),
      required: true,
    },
  ];
  const createDamagedItemFormKeys = [
    { key: "name", type: FormKeyTypeEnum.STRING },
    { key: "oldStockLocation", type: FormKeyTypeEnum.NUMBER },
    { key: "newStockLocation", type: FormKeyTypeEnum.NUMBER },
    { key: "stockQuantity", type: FormKeyTypeEnum.NUMBER },
    { key: "price", type: FormKeyTypeEnum.NUMBER },
    { key: "category", type: FormKeyTypeEnum.NUMBER },
  ];
  const pageNavigations = [
    {
      name: "Menu",
      path: "",
      canBeClicked: true,
    },
    {
      name: selectedMenuItem.name,
      path: "",
      canBeClicked: false,
      isLastOne: true,
    },
  ];
  useEffect(() => {
    setComponentKey((prev) => prev + 1);
  }, [items, stockLocations]);
  return (
    <>
      <Header showLocationSelector={false} />
      {/* navigation*/}
      <div
        key={componentKey + "itemPage"}
        className="w-[95%] mx-auto mt-6 flex flex-row  items-center gap-3 __className_a182b8"
      >
        {pageNavigations.map((navigation, index) => (
          <div
            key={index}
            className={`flex flex-row justify-between items-center gap-3  ${
              navigation.canBeClicked && " cursor-pointer"
            } text-sm ${
              navigation?.isLastOne ? "text-gray-600" : "text-gray-400"
            } `}
            onClick={() => {
              if (!navigation.canBeClicked) return;
              setSelectedMenuItem(null);
            }}
          >
            {navigation.name}
            {!navigation?.isLastOne && <IoIosArrowForward />}
          </div>
        ))}
      </div>
      {/* item details */}
      <div className="w-[95%] mx-auto flex flex-col gap-4 mt-10 ">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border border-gray-200 p-4 rounded-md shadow-sm">
          {/* item image */}
          <div className="flex flex-col gap-2">
            <img
              src={selectedMenuItem?.imageUrl}
              alt={selectedMenuItem.name}
              className="sm:w-[90%] h-96 sm:h-[30rem] rounded-md "
            />
            <div className="flex flex-row gap-2 flex-wrap">
              {foundItem?.productImages?.map((image) => (
                <div
                  key={image}
                  className="relative w-24 h-24 rounded-md overflow-hidden"
                >
                  <img
                    src={image}
                    alt={selectedMenuItem.name}
                    className="w-full h-full object-cover"
                  />
                  <RiDeleteBinLine
                    onClick={() => handleDeleteImage(image)}
                    size={20}
                    className="absolute bottom-0 right-0 text-red-500 hover:text-red-700 cursor-pointer"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* item info */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <h1 className="text-2xl font-semibold">
                {selectedMenuItem.name}
              </h1>
              <p>{selectedMenuItem.description}</p>
            </div>
            <div className="flex flex-col gap-2">
              <h1 className="text-lg font-semibold">
                Price: {selectedMenuItem.price + "  " + TURKISHLIRA}
              </h1>
              <h1 className="text-lg font-semibold">
                Category: {selectedMenuItem.category}
              </h1>
            </div>
            <button
              className="px-2 mt-auto  ml-auto bg-blue-500 hover:text-blue-500 hover:border-blue-500 sm:px-3 py-1 h-fit w-fit  text-white  hover:bg-white  transition-transform  border  rounded-md cursor-pointer"
              onClick={() => setIsCreateDamagedItemOpen(true)}
            >
              <H5> {t("Create Damaged Item")}</H5>
            </button>
          </div>
        </div>
        <ImageUpload isFolderSelect={false} itemId={selectedMenuItem._id} />
      </div>
      {isCreateDamagedItemOpen && (
        <GenericAddEditPanel
          isOpen={isCreateDamagedItemOpen}
          close={() => setIsCreateDamagedItemOpen(false)}
          inputs={createDamagedItemInputs}
          formKeys={createDamagedItemFormKeys}
          submitItem={createDamagedItem as any}
          topClassName="flex flex-col gap-2 "
          constantValues={{
            category: selectedMenuItem.category,
            name: "Hasarlı " + selectedMenuItem.name,
            price: selectedMenuItem.price,
          }}
          setForm={setForm}
          submitFunction={() => {
            if (form.name === selectedMenuItem.name) {
              toast.error(
                t("Name of the item should be different than the original item")
              );
              return;
            }
            createDamagedItem({
              ...form,
              price: Number(form.price),
              stockQuantity: Number(form.stockQuantity),
              itemId: selectedMenuItem._id,
            });
          }}
        />
      )}
    </>
  );
};

export default ItemPage;
