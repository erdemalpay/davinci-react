import { useEffect, useState } from "react";
import { FcFolder } from "react-icons/fc";
import { useNavigate } from "react-router-dom";
import { Header } from "../components/header/Header";
import { useGetFolderNames } from "../utils/api/asset";

function Images() {
  const navigate = useNavigate();
  const folders = useGetFolderNames();
  const [componentKey, setComponentKey] = useState(0);
  if (!folders) return <></>;

  useEffect(() => {
    setComponentKey((prev) => prev + 1);
  }, [folders]);
  return (
    <>
      <Header showLocationSelector={false} />
      <div
        key={componentKey}
        className="flex flex-row gap-4 w-[95%] mx-auto mt-5 "
      >
        {folders?.map((folder) => (
          <div
            key={folder}
            className="flex flex-col items-center justify-between cursor-pointer hover:text-blue-500 transform transition duration-300 hover:scale-105 "
            onClick={() => navigate(`/folder/${folder}`)}
          >
            <FcFolder className="h-20 w-20 mr-2" />
            <p>{folder}</p>
          </div>
        ))}
      </div>
    </>
  );
}
export default Images;
