import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useUserContext } from "../../context/User.context";
import {
  useEducationMutations,
  useGetEducations,
} from "../../utils/api/education";
import { useGetAllUserRoles } from "../../utils/api/user";
import Loading from "../common/Loading";
import GenericAddEditPanel from "../panelComponents/FormElements/GenericAddEditPanel";
import ButtonFilter from "../panelComponents/common/ButtonFilter";
import { FormKeyTypeEnum, InputTypes } from "../panelComponents/shared/types";
import { Education } from "./../../types/index";

interface DraggableHeaderItemProps {
  education: Education;
  onDragEnter: (dragged: Education, target: Education) => void;
  onSelect: (id: number) => void;
}

const DraggableHeaderItem: React.FC<DraggableHeaderItemProps> = ({
  education,
  onDragEnter,
  onSelect,
}) => {
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData("education", JSON.stringify(education));
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const draggedData = e.dataTransfer.getData("education");
    const draggedEducation: Education = JSON.parse(draggedData);
    if (draggedEducation._id !== education._id) {
      onDragEnter(draggedEducation, education);
    }
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={() => onSelect(education._id)}
      className="cursor-pointer p-2 border-l-4 border-transparent hover:border-blue-500 hover:bg-gray-100 transition-colors"
    >
      {education.header}
    </div>
  );
};

const EducationDashboard = () => {
  const { user } = useUserContext();
  const educations = useGetEducations();
  const roles = useGetAllUserRoles();
  if (!user || !educations || !roles) {
    return <Loading />;
  }
  const { t } = useTranslation();
  const contentRef = useRef<HTMLDivElement>(null);
  const [componentKey, setComponentKey] = useState(0);
  const { updateEducation, createEducation } = useEducationMutations();
  const [isAddNewEducationModalOpen, setIsAddNewEducationModalOpen] =
    useState(false);
  const filteredEducations: Education[] =
    educations?.filter((edu: Education) =>
      edu?.permissionRoles?.includes(user?.role?._id)
    ) || [];
  filteredEducations.sort((a, b) => a.order - b.order);
  const [headerForm, setHeaderForm] = useState({
    header: "",
    permissionRoles: [1],
  });
  const headerInputs = [
    {
      type: InputTypes.TEXT,
      formKey: "header",
      label: t("Header"),
      placeholder: t("Header"),
      required: true,
    },
    {
      type: InputTypes.SELECT,
      formKey: "permissionRoles",
      label: t("Roles"),
      options: roles?.map((role) => {
        return {
          value: role._id,
          label: role.name,
        };
      }),
      isMultiple: true,
      placeholder: t("Roles"),
      required: true,
    },
  ];
  const headerFormKeys = [
    { key: "header", type: FormKeyTypeEnum.STRING },
    { key: "permissionRoles", type: FormKeyTypeEnum.STRING },
  ];
  const handleSelect = (id: number) => {
    const element = document.getElementById(`edu-${id}`);
    if (element && contentRef.current) {
      const containerTop = contentRef.current.getBoundingClientRect().top;
      const elementTop = element.getBoundingClientRect().top;
      const offset = elementTop - containerTop;
      contentRef.current.scrollTo({ top: offset, behavior: "smooth" });
    }
  };
  const handleDragEnter = (dragged: Education, target: Education) => {
    /* 
      Uncomment and implement update logic as needed.
      updateEducation({
        id: dragged._id,
        newOrder: target.order,
      });
      Optionally, refetch to refresh the list order.
    */
  };
  useEffect(() => {
    setComponentKey((prevKey) => prevKey + 1);
  }, [educations, user, roles]);
  return (
    <div key={"component" + componentKey} className="flex h-screen">
      {/* Sidebar with draggable headers that stays fixed */}
      <div className="w-1/4 border-r border-gray-300 p-4 sticky top-0 h-screen overflow-y-auto">
        {filteredEducations.map((edu) => (
          <DraggableHeaderItem
            key={edu._id}
            education={edu}
            onDragEnter={handleDragEnter}
            onSelect={handleSelect}
          />
        ))}
        <ButtonFilter
          buttonName={"+ " + t("Add New Header")}
          onclick={() => {
            setIsAddNewEducationModalOpen(true);
          }}
        />
      </div>

      {/* Main content area showing education details */}
      <div ref={contentRef} className="w-3/4 p-4 overflow-y-auto h-screen">
        {filteredEducations?.map((edu) => (
          <section
            key={edu._id}
            id={`edu-${edu._id}`}
            className="mb-8 scroll-mt-16"
          >
            <h2 className="text-2xl font-bold mb-4">{edu.header}</h2>
            {edu.subheaders?.map((sub, index) => (
              <div key={index} className="mb-4">
                {sub.subHeader && (
                  <h3 className="text-xl font-semibold">{sub.subHeader}</h3>
                )}
                {sub.paragraph && <p className="mt-1">{sub.paragraph}</p>}
                {sub.imageUrl && (
                  <img
                    src={sub.imageUrl}
                    alt={sub.subHeader}
                    className="mt-2"
                    style={{
                      height: sub.style?.imageHeight,
                      width: sub.style?.imageWidth,
                      borderRadius: sub.style?.imageBorderRadius,
                      margin: sub.style?.imageMargin,
                    }}
                  />
                )}
              </div>
            ))}
          </section>
        ))}
      </div>
      {isAddNewEducationModalOpen && (
        <GenericAddEditPanel
          isOpen={isAddNewEducationModalOpen}
          close={() => setIsAddNewEducationModalOpen(false)}
          inputs={headerInputs}
          formKeys={headerFormKeys}
          submitItem={createEducation as any}
          setForm={setHeaderForm}
          submitFunction={() => {
            createEducation({
              ...headerForm,
              order: educations?.length ?? 0,
            });
          }}
          topClassName="flex flex-col gap-2 "
        />
      )}
    </div>
  );
};

export default EducationDashboard;
