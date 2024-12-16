import { IoIosArrowForward } from "react-icons/io";
import { useGeneralContext } from "../../context/General.context";
import { TURKISHLIRA } from "../../types";
import { useGetCategories } from "../../utils/api/menu/category";
import { Header } from "../header/Header";

const ItemPage = () => {
  const categories = useGetCategories();
  const { selectedMenuItem, setSelectedMenuItem, setIsMenuItemPageOpen } =
    useGeneralContext();
  if (!categories || !selectedMenuItem) return null;
  const pageNavigations = [
    {
      name: "Menu",
      path: "",
      onClick: () => {
        setSelectedMenuItem(null);
        setIsMenuItemPageOpen(false);
      },
      canBeClicked: true,
    },
    {
      name: selectedMenuItem.name,
      path: "",
      canBeClicked: false,
      isLastOne: true,
    },
  ];
  return (
    <>
      <Header showLocationSelector={false} />
      {/* navigation*/}
      <div className="w-[95%] mx-auto mt-6 flex flex-row  items-center gap-3 __className_a182b8">
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
              setIsMenuItemPageOpen(false);
            }}
          >
            {navigation.name}
            {!navigation?.isLastOne && <IoIosArrowForward />}
          </div>
        ))}
      </div>
      {/* item details */}
      <div className="w-[95%] mx-auto flex flex-col gap-4 mt-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* item image */}
          <img
            src={selectedMenuItem?.imageUrl}
            alt={selectedMenuItem.name}
            className="w-[90%] h-96 "
          />
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
          </div>
        </div>
      </div>
    </>
  );
};

export default ItemPage;
