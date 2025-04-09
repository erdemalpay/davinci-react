import React, { useState } from "react";

interface Education {
  _id: number;
  permissionRoles: number[];
  header: string;
  order: number;
  subheaders?: {
    componentType: string;
    subHeader?: string;
    paragraph?: string;
    imageUrl?: string;
    style?: {
      imageHeight?: string;
      imageWidth?: string;
      imageBorderRadius?: string;
      imageMargin?: string;
    };
  }[];
}

// Mock data: all items have permissionRoles that include 1.
const initialEducations: Education[] = [
  {
    _id: 1,
    permissionRoles: [1],
    header: "Education Header 1",
    order: 1,
    subheaders: [
      {
        componentType: "sub",
        subHeader: "Subheader 1.1",
        paragraph:
          "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc quis orci nibh. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; Aliquam commodo sodales condimentum. Aenean lectus urna, consequat malesuada ultricies quis, semper eget mauris. Nunc quis accumsan enim, at varius mi. Vestibulum facilisis lorem eu lacinia blandit. Vivamus ullamcorper, tortor vel blandit varius, libero enim interdum risus, a venenatis mi tellus non erat. Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
        imageUrl: "https://via.placeholder.com/150",
        style: {
          imageHeight: "150px",
          imageWidth: "150px",
          imageBorderRadius: "8px",
          imageMargin: "4px",
        },
      },
    ],
  },
  {
    _id: 2,
    permissionRoles: [2],
    header: "Education Header 2",
    order: 2,
    subheaders: [
      {
        componentType: "sub",
        subHeader: "Subheader 2.1",
        paragraph: "This is paragraph for subheader 2.1",
        imageUrl: "https://via.placeholder.com/150",
        style: {
          imageHeight: "150px",
          imageWidth: "150px",
          imageBorderRadius: "8px",
          imageMargin: "4px",
        },
      },
    ],
  },
  {
    _id: 3,
    permissionRoles: [1],
    header: "Education Header 3",
    order: 3,
    subheaders: [
      {
        componentType: "sub",
        subHeader: "Subheader 3.1",
        paragraph:
          "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc quis orci nibh. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; Aliquam commodo sodales condimentum. Aenean lectus urna, consequat malesuada ultricies quis, semper eget mauris.",
        imageUrl: "https://via.placeholder.com/150",
        style: {
          imageHeight: "150px",
          imageWidth: "150px",
          imageBorderRadius: "8px",
          imageMargin: "4px",
        },
      },
    ],
  },
  {
    _id: 4,
    permissionRoles: [1],
    header: "Education Header 4",
    order: 4,
    subheaders: [
      {
        componentType: "sub",
        subHeader: "Subheader 4.1",
        paragraph:
          "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc quis orci nibh. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; Aliquam commodo sodales condimentum.",
        imageUrl: "https://via.placeholder.com/150",
        style: {
          imageHeight: "150px",
          imageWidth: "150px",
          imageBorderRadius: "8px",
          imageMargin: "4px",
        },
      },
      {
        componentType: "sub",
        subHeader: "Subheader 4.1",
        paragraph:
          "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc quis orci nibh. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; Aliquam commodo sodales condimentum.",
        imageUrl: "https://via.placeholder.com/150",
        style: {
          imageHeight: "150px",
          imageWidth: "150px",
          imageBorderRadius: "8px",
          imageMargin: "4px",
        },
      },
    ],
  },
  {
    _id: 5,
    permissionRoles: [1],
    header: "Education Header 5",
    order: 5,
    subheaders: [
      {
        componentType: "sub",
        subHeader: "Subheader 4.1",
        paragraph:
          "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc quis orci nibh. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; Aliquam commodo sodales condimentum.",
        imageUrl: "https://via.placeholder.com/150",
        style: {
          imageHeight: "150px",
          imageWidth: "150px",
          imageBorderRadius: "8px",
          imageMargin: "4px",
        },
      },
    ],
  },
  {
    _id: 6,
    permissionRoles: [1],
    header: "Education Header ",
    order: 6,
    subheaders: [
      {
        componentType: "sub",
        subHeader: "Subheader 4.1",
        paragraph:
          "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc quis orci nibh. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; Aliquam commodo sodales condimentum.",
        imageUrl: "https://via.placeholder.com/150",
        style: {
          imageHeight: "150px",
          imageWidth: "150px",
          imageBorderRadius: "8px",
          imageMargin: "4px",
        },
      },
    ],
  },
];

// Mock user: role id is 1.
const mockUser = { role: { _id: 1 } };

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
  // When dragging starts, serialize the education object.
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData("education", JSON.stringify(education));
  };

  // Allow dropping by preventing default.
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  // When dropped, deserialize the dragged object and update the order.
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

const MockEducationDashboard: React.FC = () => {
  // Local state to simulate the education list.
  const [educations, setEducations] = useState<Education[]>(initialEducations);

  // Filter educations based on mockUser permission.
  const filteredEducations = educations.filter((edu) =>
    edu.permissionRoles.includes(mockUser.role._id)
  );

  // Sort by the "order" property.
  filteredEducations.sort((a, b) => a.order - b.order);

  // Update order when a header is dropped onto another.
  const handleDragEnter = (dragged: Education, target: Education) => {
    setEducations((prevEducations) => {
      const newEducations = prevEducations.map((edu) => {
        if (edu._id === dragged._id) {
          return { ...edu, order: target.order };
        }
        return edu;
      });
      return newEducations.sort((a, b) => a.order - b.order);
    });
  };

  // Scroll smoothly to the education section on header click.
  const handleSelect = (id: number) => {
    const element = document.getElementById(`edu-${id}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="flex h-full sticky top-16 ">
      {/* Sidebar with draggable headers remains fixed */}
      <div className="w-1/4 border-r border-gray-300 p-4 sticky top-16  h-full overflow-y-auto ">
        {filteredEducations.map((edu) => (
          <DraggableHeaderItem
            key={edu._id}
            education={edu}
            onDragEnter={handleDragEnter}
            onSelect={handleSelect}
          />
        ))}
      </div>

      {/* Main content area showing education details */}
      <div className="w-3/4 p-4 overflow-y-auto h-full">
        {filteredEducations.map((edu) => (
          <section
            key={edu._id}
            id={`edu-${edu._id}`}
            className=" scroll-mt-16 p-4"
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
    </div>
  );
};

export default MockEducationDashboard;
