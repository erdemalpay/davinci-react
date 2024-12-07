import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { HiOutlineTrash } from "react-icons/hi";
import { useParams } from "react-router-dom";
import { Header } from "../components/header/Header";
import PageNavigator from "../components/panelComponents/PageNavigator/PageNavigator";
import { Routes } from "../navigation/constants";
import { useDeleteImageMutation, useGetFolderImages } from "../utils/api/asset";

function SingleFolderPage() {
  const { t } = useTranslation();
  const { folderName } = useParams();
  if (!folderName) return <></>;
  const { mutate: deleteImage } = useDeleteImageMutation();
  const [componentKey, setComponentKey] = useState(0);
  const folderImages = useGetFolderImages(folderName as string);
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
      <div
        key={componentKey}
        className="flex flex-row flex-wrap gap-4 w-[95%] mx-auto mt-5"
      >
        {folderImages?.map((image) => (
          <div key={image.url} className="flex flex-col gap-2">
            {/* image */}
            <img
              src={image.url}
              alt={image.publicId}
              className="w-32 h-32 rounded-md shadow-sm"
            />
            {/* buttons */}
            <div className="ml-auto">
              <button
                className="text-2xl cursor-pointer  text-red-500 hover:text-red-800  transform transition duration-300 hover:scale-105 "
                onClick={() => {
                  deleteImage(image.publicId);
                }}
              >
                <HiOutlineTrash />
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
export default SingleFolderPage;
