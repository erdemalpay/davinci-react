import EducationDashboard from "../components/education/EducationDashboard";
import { Header } from "../components/header/Header";

const Education = () => {
  return (
    <>
      <Header showLocationSelector={true} />
      <div className="w-[98%] mx-auto my-10">
        <EducationDashboard />
      </div>
    </>
  );
};

export default Education;
