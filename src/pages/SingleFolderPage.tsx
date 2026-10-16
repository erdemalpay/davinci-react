import { useEffect, useRef, useState } from "react";
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
import {
  SCREEN_IMAGES_FOLDER,
  ScreenImage,
  useDeleteImageMutation,
  useGetFolderImages,
  useGetScreenImages,
  useUpdateScreenImagesMutation,
} from "../utils/api/asset";

function SingleFolderPage() {
  const { t } = useTranslation();
  const { folderName } = useParams();
  if (!folderName) return <></>;
  const { mutate: deleteImage } = useDeleteImageMutation();
  const [componentKey, setComponentKey] = useState(0);
  const folderImages = useGetFolderImages(folderName as string);
  const [searchQuery, setSearchQuery] = useState("");
  // tv-screen images are shown on the TV in this order, each for its duration
  const isScreenFolder = folderName === SCREEN_IMAGES_FOLDER;
  const screenImages = useGetScreenImages(isScreenFolder);
  const { mutate: updateScreenImages, isPending: isSavingScreenImages } =
    useUpdateScreenImagesMutation();
  // null until the user changes something; then it holds the unsaved list
  const [editedScreenImages, setEditedScreenImages] = useState<
    ScreenImage[] | null
  >(null);
  const draggedPublicIdRef = useRef<string | null>(null);
  useEffect(() => {
    setComponentKey((prev) => prev + 1);
  }, [folderImages]);
  const currentScreenImages = editedScreenImages ?? screenImages ?? [];

  const images = isScreenFolder ? currentScreenImages : folderImages;

  const moveScreenImage = (draggedPublicId: string, targetPublicId: string) => {
    const from = currentScreenImages.findIndex(
      (image) => image.publicId === draggedPublicId
    );
    const to = currentScreenImages.findIndex(
      (image) => image.publicId === targetPublicId
    );
    if (from === -1 || to === -1 || from === to) return;
    const next = [...currentScreenImages];
    const [dragged] = next.splice(from, 1);
    next.splice(to, 0, dragged);
    setEditedScreenImages(next);
  };

  const setScreenImageDuration = (publicId: string, duration: number) => {
    setEditedScreenImages(
      currentScreenImages.map((image) =>
        image.publicId === publicId ? { ...image, duration } : image
      )
    );
  };

  const saveScreenImages = () => {
    if (
      currentScreenImages.some(
        ({ duration }) => !Number.isInteger(duration) || duration < 1
      )
    ) {
      toast.error(t("Duration must be at least 1 second"));
      return;
    }
    updateScreenImages(
      currentScreenImages.map(({ publicId, duration }) => ({
        publicId,
        duration,
      })),
      {
        onSuccess: () => {
          setEditedScreenImages(null);
          toast.success(t("Saved"));
        },
      }
    );
  };

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
        <div className="flex flex-row items-center gap-2">
          <div className="flex-1">
            <SearchInput
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e);
              }}
            />
          </div>
          {isScreenFolder && (
            <GenericButton
              onClick={saveScreenImages}
              disabled={isSavingScreenImages}
            >
              {t("Save")}
            </GenericButton>
          )}
        </div>
        <div
          key={componentKey}
          className="flex flex-row flex-wrap gap-4 w-full mt-4"
        >
          {images
            ?.filter((image) => {
              if (searchQuery === "") return true;
              return image.publicId
                .toLowerCase()
                .includes(searchQuery.toLowerCase());
            })
            ?.map((image) => (
              <div
                key={image.url}
                draggable={isScreenFolder}
                onDragStart={() => {
                  draggedPublicIdRef.current = image.publicId;
                }}
                onDragOver={(e) => e.preventDefault()}
                onDragEnter={() => {
                  if (draggedPublicIdRef.current) {
                    moveScreenImage(draggedPublicIdRef.current, image.publicId);
                  }
                }}
                onDragEnd={() => {
                  draggedPublicIdRef.current = null;
                }}
                className={`flex flex-col gap-3 p-3 bg-white border border-gray-200 rounded-lg shadow-sm w-48 hover:shadow-md transition-shadow ${
                  isScreenFolder ? "cursor-move" : ""
                }`}
              >
                {/* image */}
                <img
                  src={image.url}
                  alt={image.publicId}
                  className="w-full h-32 object-contain rounded-md"
                />
                {/* content */}
                <div className="flex flex-col gap-2">
                  <p
                    className="text-sm text-gray-700 text-center truncate"
                    title={image.publicId}
                  >
                    {image.publicId}
                  </p>
                  {isScreenFolder && (
                    <label className="flex flex-row items-center justify-center gap-2 text-sm text-gray-700">
                      {t("Duration")}
                      <input
                        type="number"
                        min={1}
                        value={(image as ScreenImage).duration || ""}
                        onChange={(e) =>
                          setScreenImageDuration(
                            image.publicId,
                            Number(e.target.value)
                          )
                        }
                        className="w-16 px-2 py-1 border border-gray-300 rounded-md text-center"
                      />
                      {t("sec")}
                    </label>
                  )}
                  {/* buttons */}
                  <div className="flex flex-row gap-2 justify-center">
                    <GenericButton
                      variant="icon"
                      className="text-xl cursor-pointer text-gray-500 hover:text-gray-800 transform transition duration-300 hover:scale-110 border border-gray-300"
                      onClick={() => {
                        navigator.clipboard.writeText(image.publicId);
                        toast.success(t("Image ID copied to clipboard"));
                      }}
                    >
                      <IoCopyOutline />
                    </GenericButton>
                    <GenericButton
                      variant="icon"
                      className="text-xl cursor-pointer text-red-500 hover:text-red-800 transform transition duration-300 hover:scale-110 border border-gray-300"
                      onClick={() => {
                        deleteImage(image.url);
                      }}
                    >
                      <HiOutlineTrash />
                    </GenericButton>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    </>
  );
}
export default SingleFolderPage;
