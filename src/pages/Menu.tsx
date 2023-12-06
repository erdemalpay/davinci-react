import { TrashIcon } from "@heroicons/react/24/outline";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  PlusIcon,
} from "@heroicons/react/24/solid";
import { Tooltip } from "@material-tailwind/react";
import { get } from "lodash";
import { FormEvent, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { CheckSwitch } from "../components/common/CheckSwitch";
import { EditableText } from "../components/common/EditableText";
import { EditModeText } from "../components/common/EditModeText";
import { Header } from "../components/header/Header";
import { AddMenuCategoryDialog } from "../components/menu/AddCategoryDialog";
import { AddMenuItemDialog } from "../components/menu/AddItemDialog";
import ImageUploader from "../components/upload/ImageUploader";
import { NO_IMAGE_URL } from "../navigation/constants";
import { MenuCategory, MenuItem } from "../types";
import { useCategoryMutations, useGetCategories } from "../utils/api/category";
import { useGetMenuItems, useMenuItemMutations } from "../utils/api/menu-item";

interface ItemGroup {
  category: string;
  order: number;
  items: MenuItem[];
}

export default function MenuCategories() {
  const categories = useGetCategories();
  const { deleteCategory, updateCategory, createCategory } =
    useCategoryMutations();

  const items = useGetMenuItems();
  const { deleteItem, updateItem, createItem } = useMenuItemMutations();

  const [isCreateItemDialogOpen, setIsCreateItemDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<MenuCategory>();

  const [isCreateCategoryDialogOpen, setIsCreateCategoryDialogOpen] =
    useState(false);

  const [itemGroups, setItemGroups] = useState<ItemGroup[]>([]);

  useEffect(() => {
    const itemGroups: ItemGroup[] = [];
    if (!items) return;
    items.forEach((item) => {
      const category = item.category as MenuCategory;
      const existingGroup = itemGroups.find(
        (itemGroup) => itemGroup.category === category.name
      );
      if (existingGroup) {
        existingGroup.items.push(item);
      } else {
        const newGroup = {
          category: category.name,
          order: category.order,
          items: [item],
        };
        itemGroups.push(newGroup);
      }
    });
    itemGroups.sort((a, b) => (a.order > b.order ? 1 : -1));
    setItemGroups(itemGroups);
  }, [items]);

  function updateCategoryHandler(
    event: FormEvent<HTMLInputElement>,
    item?: MenuCategory
  ) {
    if (!item) return;
    const target = event.target as HTMLInputElement;
    if (!target.value) return;
    updateCategory({
      id: item._id,
      updates: { [target.name]: target.value },
    });
    toast.success(`Category ${item.name} updated`);
  }

  function updateCategoryOrder(category: MenuCategory, up: boolean) {
    const newOrder = up ? category.order - 1 : category.order + 1;
    const otherItem =
      categories && categories.find((c) => c.order === newOrder);
    updateCategory({
      id: category._id,
      updates: { order: newOrder },
    });
    if (otherItem) {
      updateCategory({
        id: otherItem._id,
        updates: { order: category.order },
      });
    }
    toast.success("Category order updated");
  }

  function updateHandler(event: FormEvent<HTMLInputElement>, item?: MenuItem) {
    if (!item) return;
    const target = event.target as HTMLInputElement;
    if (!target.value) return;
    if (get(item, target.name) === +target.value) {
      return;
    }

    updateItem({
      id: item._id,
      updates: { [target.name]: target.value },
    });
    toast.success(`Item ${item.name} updated`);
  }

  function checkDeleteCategory(category: MenuCategory) {
    if (items && items.find((item) => item.category === category._id)) {
      toast.error(
        `Category "${category.name}" cannot be deleted, it has items assigned. Remove/reassign them first to delete this category.`,
        { autoClose: 5000 }
      );
    } else {
      deleteCategory(category._id);
    }
  }

  const categoryColumns = [
    {
      id: "name",
      header: "Name",
      cell: (row: MenuCategory) => (
        <EditableText
          name="name"
          text={row.name}
          onUpdate={updateCategoryHandler}
          item={row}
        />
      ),
    },
    {
      id: "delete",
      header: "Action",
      cell: (row: MenuCategory, index: number, length: number) => (
        <div className="flex gap-4">
          <Tooltip content="Add item to this category">
            <button
              onClick={() => {
                setSelectedCategory(row);
                setIsCreateItemDialogOpen(true);
              }}
            >
              <PlusIcon className="text-green-500 w-6 h-6" />
            </button>
          </Tooltip>
          <Tooltip content="Move up">
            <button
              onClick={() => updateCategoryOrder(row, true)}
              className={`${index === 0 ? "invisible" : "visible"}`}
            >
              <ChevronUpIcon className="text-blue-500 w-6 h-6" />
            </button>
          </Tooltip>
          <Tooltip content="Move down">
            <button
              onClick={() => updateCategoryOrder(row, false)}
              className={`${index === length - 1 ? "invisible" : "visible"}`}
            >
              <ChevronDownIcon className="text-blue-500 w-6 h-6" />
            </button>
          </Tooltip>
          <Tooltip content="Delete category">
            <button onClick={() => checkDeleteCategory(row)}>
              <TrashIcon className="text-red-500 w-6 h-6" />
            </button>
          </Tooltip>
        </div>
      ),
    },
  ];

  const itemColumns = [
    {
      id: "image",
      header: "Image",
      cell: (row: MenuItem) => (
        <div className="mr-2">
          <ImageUploader
            initialImageUrl={row.imageUrl || NO_IMAGE_URL}
            filename={row.name}
            onSuccessCallback={(url) =>
              updateItem({ id: row._id, updates: { imageUrl: url } })
            }
          />
        </div>
      ),
    },
    {
      id: "name",
      header: "Name",
      cell: (row: MenuItem) => (
        <EditableText
          name="name"
          text={row.name}
          onUpdate={updateHandler}
          item={row}
        />
      ),
    },
    {
      id: "description",
      header: "Description",
      cell: (row: MenuItem) => (
        <EditableText
          name="description"
          text={row.description}
          onUpdate={updateHandler}
          item={row}
        />
      ),
    },
    {
      id: "priceBahceli",
      header: "Price (Bahçeli)",
      cell: (row: MenuItem) => (
        <EditModeText
          name="priceBahceli"
          type="number"
          text={row.priceBahceli + ""}
          onUpdate={updateHandler}
          item={row}
          editMode={editMode}
        />
      ),
    },
    {
      id: "priceNeorama",
      header: "Price (Neorama)",
      cell: (row: MenuItem) => (
        <EditModeText
          name="priceNeorama"
          type="number"
          text={row.priceNeorama + ""}
          onUpdate={updateHandler}
          item={row}
          editMode={editMode}
        />
      ),
    },
    {
      id: "delete",
      header: "Action",
      cell: (row: MenuItem) => (
        <Tooltip content="Delete">
          <button onClick={() => deleteItem(row._id)}>
            <TrashIcon className="text-red-500 w-6 h-6" />
          </button>
        </Tooltip>
      ),
    },
  ];

  return (
    <>
      <Header showLocationSelector={false} />

      <div className="flex flex-col gap-4 mx-0 lg:mx-20">
        <div className="bg-white shadow w-full px-6 py-5 mt-4">
          <div className="mb-5 rounded-tl-lg rounded-tr-lg">
            <div className="flex items-center justify-between mb-4">
              <p className="text-base lg:text-2xl font-bold leading-normal text-gray-800">
                Categories
              </p>
            </div>
          </div>
          <div className="h-full w-full">
            <div className="flex justify-end gap-x-4">
              <button
                onClick={() => setIsCreateCategoryDialogOpen(true)}
                className="my-3 bg-white rounded border border-gray-800 text-gray-800 px-6 py-2 text-sm"
              >
                Add Category
              </button>
            </div>
            <div className="w-full overflow-x-auto">
              <table className="w-full whitespace-nowrap">
                <thead>
                  <tr className="h-10 w-full text-sm leading-none text-gray-600">
                    {categoryColumns.map((column) => (
                      <th key={column.id} className="font-bold text-left">
                        <div className="flex gap-x-2">{column.header}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="w-full">
                  {categories?.map((category, index) => (
                    <tr
                      key={category._id}
                      className="h-10 text-sm leading-none text-gray-700 border-b border-t border-gray-200 bg-white hover:bg-gray-100"
                    >
                      {categoryColumns.map((column) => {
                        return (
                          <td key={column.id} className="">
                            {column.cell(category, index, categories.length)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-x-4 items-center">
          <h1 className="text-md">Edit Prices</h1>
          <CheckSwitch
            checked={editMode}
            onChange={() => setEditMode((value) => !value)}
            checkedBg="bg-red-500"
          ></CheckSwitch>
        </div>
        {itemGroups.map((itemGroup) => (
          <div
            key={itemGroup.category}
            className="bg-white shadow w-full px-6 py-5 mt-4"
          >
            <div className="mb-5 rounded-tl-lg rounded-tr-lg">
              <div className="flex items-center justify-between mb-4">
                <p className="text-base lg:text-2xl font-bold leading-normal text-gray-800">
                  {itemGroup.category}
                </p>
              </div>
            </div>
            <div className="h-full w-full">
              <div className="w-full overflow-x-auto">
                <table className="w-full whitespace-nowrap">
                  <thead>
                    <tr className="h-10 w-full text-sm leading-none text-gray-600">
                      {itemColumns.map((column) => (
                        <th
                          key={column.id}
                          className="font-bold text-left w-1/4"
                        >
                          <div className="flex gap-x-2">{column.header}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="w-full">
                    {itemGroup.items?.map((item) => (
                      <tr
                        key={item._id}
                        className="h-10 text-sm leading-none text-gray-700 border-b border-t border-gray-200 bg-white hover:bg-gray-100"
                      >
                        {itemColumns.map((column) => {
                          return (
                            <td key={column.id} className="">
                              {column.cell(item)}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ))}
      </div>
      {isCreateCategoryDialogOpen && (
        <AddMenuCategoryDialog
          isOpen={isCreateCategoryDialogOpen}
          close={() => setIsCreateCategoryDialogOpen(false)}
          createCategory={createCategory}
        />
      )}
      {isCreateItemDialogOpen && (
        <AddMenuItemDialog
          isOpen={isCreateItemDialogOpen}
          close={() => setIsCreateItemDialogOpen(false)}
          createItem={createItem}
          category={selectedCategory}
        />
      )}
    </>
  );
}
