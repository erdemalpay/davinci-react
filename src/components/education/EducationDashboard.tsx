import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { CiCircleChevDown, CiCircleChevUp } from "react-icons/ci";
import { useUserContext } from "../../context/User.context";
import {
  useEducationMutations,
  useGetEducations,
} from "../../utils/api/education";
import { useGetAllUserRoles } from "../../utils/api/user";
import Loading from "../common/Loading";
import GenericAddEditPanel from "../panelComponents/FormElements/GenericAddEditPanel";
import { H5 } from "../panelComponents/Typography";
import ButtonFilter from "../panelComponents/common/ButtonFilter";
import { FormKeyTypeEnum, InputTypes } from "../panelComponents/shared/types";
import { Education, RoleEnum } from "./../../types/index";

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
  const isDisabledCondition = user
    ? ![RoleEnum.MANAGER].includes(user?.role?._id)
    : true;
  const { t } = useTranslation();
  const [componentKey, setComponentKey] = useState(0);
  const { updateEducation, createEducation } = useEducationMutations();
  const [isAddNewEducationModalOpen, setIsAddNewEducationModalOpen] =
    useState(false);
  const [isUpdateHeaderModalOpen, setIsUpdateHeaderModalOpen] = useState(false);
  const [headerToAction, setHeaderToAction] = useState<Education | null>(null);
  const [subHeaderToAction, setSubHeaderToAction] = useState<any>(null);
  const [isAddNewSubHeaderModalOpen, setIsAddNewSubHeaderModalOpen] =
    useState(false);
  const [isUpdateSubHeaderModalOpen, setIsUpdateSubHeaderModalOpen] =
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
  const [updateForm, setUpdateForm] = useState({
    subHeader: "",
    paragraph: "",
  });
  const subHeaderInputs = [
    {
      type: InputTypes.TEXT,
      formKey: "subHeader",
      label: t("Sub Header"),
      placeholder: t("Sub Header"),
      required: false,
    },
    {
      type: InputTypes.TEXTAREA,
      formKey: "paragraph",
      label: t("Paragraph"),
      placeholder: t("Paragraph"),
      required: false,
      inputClassName: "h-64",
    },
  ];
  const subHeaderFormKeys = [
    { key: "subHeader", type: FormKeyTypeEnum.STRING },
    { key: "paragraph", type: FormKeyTypeEnum.STRING },
  ];
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

  const handleDragEnter = (dragged: Education, target: Education) => {
    updateEducation({
      id: dragged._id,
      updates: {
        order: target.order,
      },
    });
  };

  // Scroll smoothly to the education section on header click.
  const handleSelect = (id: number) => {
    const element = document.getElementById(`edu-${id}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };
  useEffect(() => {
    setComponentKey((prevKey) => prevKey + 1);
  }, [educations, user, roles]);
  return (
    <div
      key={"component" + componentKey}
      className="flex h-full sticky top-16 "
    >
      {/* Sidebar with draggable headers that stays fixed */}
      <div className="hidden sm:block w-1/4 border-r border-gray-300 p-4 sticky top-[104px]  h-full overflow-y-auto ">
        {filteredEducations.map((edu, index) => (
          <DraggableHeaderItem
            key={edu._id}
            education={edu}
            onDragEnter={handleDragEnter}
            onSelect={handleSelect}
          />
        ))}
        {!isDisabledCondition && (
          <ButtonFilter
            buttonName={"+ " + t("Add New Header")}
            onclick={() => {
              setHeaderToAction(null);
              setIsAddNewEducationModalOpen(true);
            }}
          />
        )}
      </div>

      {/* Main content area showing education details */}
      <div className="sm:w-3/4 p-2 sm:p-4 overflow-y-auto h-full">
        {filteredEducations?.map((edu, index) => (
          <section
            key={edu._id}
            id={`edu-${edu._id}`}
            className=" scroll-mt-16 p-4"
          >
            <div className="flex flex-row gap-2 items-center">
              <h2
                className={`text-2xl font-bold ${
                  !isDisabledCondition && "cursor-pointer"
                } `}
                onClick={() => {
                  if (isDisabledCondition) return;
                  setHeaderToAction(edu);
                  setIsUpdateHeaderModalOpen(true);
                }}
              >
                {edu.header}
              </h2>
              {!isDisabledCondition && (
                <div className="flex flex-row items-center gap-4">
                  <button
                    className="px-2 text-sm bg-blue-500 hover:text-blue-500 hover:border-blue-500  py-1 h-fit w-fit  text-white  hover:bg-white  transition-transform  border  rounded-md cursor-pointer"
                    onClick={() => {
                      setHeaderToAction(edu);
                      setSubHeaderToAction(null);
                      setIsAddNewSubHeaderModalOpen(true);
                    }}
                  >
                    <H5> {"+ " + t("Add New Sub Header")}</H5>
                  </button>
                  <div className="flex flex-row items-center gap-2">
                    {edu?.permissionRoles?.map((roleId) => {
                      const role = roles?.find((role) => role._id === roleId);
                      return (
                        <span
                          key={roleId}
                          className={` text-white px-2 py-1 rounded-md text-xs`}
                          style={{ backgroundColor: role?.color }}
                        >
                          {role?.name}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            {edu.subheaders
              ?.sort((a, b) => a.order - b.order)
              ?.map((sub, index) => (
                <div key={index} className="mb-4">
                  <div className="flex flex-row gap-1 items-center w-fit">
                    {!isDisabledCondition && index !== 0 && (
                      <CiCircleChevUp
                        className="text-green-500 cursor-pointer text-2xl "
                        onClick={() => {
                          const targetOrder = sub.order - 1;
                          const updatedSubheaders = (edu.subheaders || []).map(
                            (subHeader) => {
                              if (subHeader.order === sub.order) {
                                return {
                                  ...subHeader,
                                  order: targetOrder,
                                };
                              }
                              if (subHeader.order === targetOrder) {
                                return {
                                  ...subHeader,
                                  order: sub.order,
                                };
                              }
                              return subHeader;
                            }
                          );
                          updateEducation({
                            id: edu._id,
                            updates: {
                              subheaders: updatedSubheaders,
                            },
                          });
                        }}
                      />
                    )}
                    {sub.subHeader && (
                      <h3
                        onClick={() => {
                          if (isDisabledCondition) return;
                          setHeaderToAction(edu);
                          setSubHeaderToAction(sub);
                          setIsUpdateSubHeaderModalOpen(true);
                        }}
                        className={`text-lg font-semibold ${
                          !isDisabledCondition && "cursor-pointer"
                        }`}
                      >
                        {sub.subHeader}
                      </h3>
                    )}
                    {!isDisabledCondition &&
                      index !== (edu?.subheaders?.length ?? 0) - 1 &&
                      (edu.subheaders?.length ?? 0) > 1 && (
                        <CiCircleChevDown
                          className="text-red-500 cursor-pointer text-2xl ml-auto"
                          onClick={() => {
                            const targetOrder = sub.order + 1;
                            const updatedSubheaders = (
                              edu.subheaders || []
                            ).map((subHeader) => {
                              if (subHeader.order === sub.order) {
                                return {
                                  ...subHeader,
                                  order: targetOrder,
                                };
                              }
                              if (subHeader.order === targetOrder) {
                                return {
                                  ...subHeader,
                                  order: sub.order,
                                };
                              }
                              return subHeader;
                            });
                            updateEducation({
                              id: edu._id,
                              updates: {
                                subheaders: updatedSubheaders,
                              },
                            });
                          }}
                        />
                      )}
                  </div>

                  {sub.paragraph && (
                    <p
                      onClick={() => {
                        if (isDisabledCondition) return;
                        setHeaderToAction(edu);
                        setSubHeaderToAction(sub);
                        setIsUpdateSubHeaderModalOpen(true);
                      }}
                      className="mt-1"
                    >
                      {sub.paragraph}
                    </p>
                  )}
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
      {(isAddNewEducationModalOpen || isUpdateHeaderModalOpen) && (
        <GenericAddEditPanel
          isOpen={isAddNewEducationModalOpen || isUpdateHeaderModalOpen}
          close={() => {
            setIsAddNewEducationModalOpen(false);
            setIsUpdateHeaderModalOpen(false);
          }}
          inputs={headerInputs}
          formKeys={headerFormKeys}
          submitItem={createEducation as any}
          setForm={setHeaderForm}
          constantValues={{ ...headerToAction }}
          submitFunction={() => {
            if (isUpdateHeaderModalOpen && headerToAction) {
              updateEducation({
                id: headerToAction._id,
                updates: {
                  ...headerForm,
                },
              });
            } else if (isAddNewEducationModalOpen) {
              createEducation({
                ...headerForm,
                order: educations?.length ?? 0,
              });
            }
          }}
          topClassName="flex flex-col gap-2 "
        />
      )}

      {(isAddNewSubHeaderModalOpen || isUpdateSubHeaderModalOpen) &&
        headerToAction && (
          <GenericAddEditPanel
            isOpen={isAddNewSubHeaderModalOpen || isUpdateSubHeaderModalOpen}
            close={() => {
              setIsAddNewSubHeaderModalOpen(false);
              setIsUpdateSubHeaderModalOpen(false);
            }}
            inputs={subHeaderInputs}
            formKeys={subHeaderFormKeys}
            submitItem={updateEducation as any}
            setForm={setUpdateForm}
            constantValues={{ ...subHeaderToAction }}
            submitFunction={() => {
              if (isAddNewSubHeaderModalOpen && headerToAction) {
                updateEducation({
                  id: headerToAction._id,
                  updates: {
                    subheaders: [
                      ...(headerToAction.subheaders || []),
                      {
                        ...updateForm,
                        order: headerToAction.subheaders?.length ?? 0,
                      },
                    ],
                  },
                });
              } else if (isUpdateSubHeaderModalOpen && subHeaderToAction) {
                updateEducation({
                  id: headerToAction._id,
                  updates: {
                    subheaders: [
                      ...(headerToAction.subheaders || []).map((sub) => {
                        if (sub.order === subHeaderToAction.order) {
                          return { ...sub, ...updateForm };
                        }
                        return sub;
                      }),
                    ],
                  },
                });
              }
            }}
            topClassName="flex flex-col gap-2  "
          />
        )}
    </div>
  );
};

export default EducationDashboard;
