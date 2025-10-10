import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { HiOutlineTrash } from "react-icons/hi";
import { IoCopyOutline } from "react-icons/io5";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { GenericButton } from "../components/common/GenericButton";
import { Header } from "../components/header/Header";
import PageNavigator from "../components/panelComponents/PageNavigator/PageNavigator";
import SearchInput from "../components/panelComponents/common/SearchInput";
import { Routes } from "../navigation/constants";
import { useDeleteImageMutation, useGetFolderImages } from "../utils/api/asset";

function SingleFolderPage() {
  const { t } = useTranslation();
  const { folderName } = useParams();
  if (!folderName) return <></>;
  const { mutate: deleteImage } = useDeleteImageMutation();
  const [componentKey, setComponentKey] = useState(0);
  const folderImages = useGetFolderImages(folderName as string);
  const [searchQuery, setSearchQuery] = useState("");
  useEffect(() => {
    setComponentKey((prev) => prev + 1);
  }, [folderImages]);

  const pageNavigations = [
    {
      name: t("Images"),
      path: Routes.Images,
      canBeClicked: true,
    },
    {
      name: folderName as string,
      path: "",
      canBeClicked: false,
    },
  ];

  return (
    <>
      <Header showLocationSelector={false} />
      <PageNavigator navigations={pageNavigations} />
      <div className="flex flex-col gap-2 w-[95%] mx-auto mt-5 ">
        <SearchInput
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e);
          }}
        />
        <div
          key={componentKey}
          className="flex flex-row flex-wrap gap-4 items-center w-full mt-4"
        >
          {folderImages
            ?.filter((image) => {
              if (searchQuery === "") return true;
              return image.publicId
                .toLowerCase()
                .includes(searchQuery.toLowerCase());
            })
            ?.map((image) => (
              <div key={image.url} className="flex flex-col gap-2">
                {/* image */}
                <img
                  src={image.url}
                  alt={image.publicId}
                  className="w-full max-w-40 h-32 rounded-md shadow-sm"
                />
                <div className="flex flex-row gap-1 ">
                  <p>{image.publicId}</p>
                  {/* buttons */}
                  <GenericButton
                    variant="icon"
                    className="text-2xl cursor-pointer  text-gray-500 hover:text-gray-800  transform transition duration-300 hover:scale-105"
                    onClick={() => {
                      navigator.clipboard.writeText(image.publicId);
                      toast.success(t("Image ID copied to clipboard"));
                    }}
                  >
                    <IoCopyOutline />
                  </GenericButton>
                  <GenericButton
                    variant="icon"
                    className="text-2xl cursor-pointer  text-red-500 hover:text-red-800  transform transition duration-300 hover:scale-105"
                    onClick={() => {
                      deleteImage(image.url);
                    }}
                  >
                    <HiOutlineTrash />
                  </GenericButton>
                </div>
              </div>
            ))}
        </div>
      </div>
    </>
  );
}
export default SingleFolderPage;
