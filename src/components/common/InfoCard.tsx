type Props = {
  icon: React.ReactNode;
  title: string;
  value: string;
  color: string;
};
const InfoCard = ({ icon, title, value, color }: Props) => {
  return (
    <div
      className={`flex flex-col gap-5 py-6 px-10 items-center justify-center bg-${color}-300 bg-opacity-20 text-${color}-500 rounded-md `}
    >
      <div className="text-4xl  ">{icon}</div>
      <div className="flex flex-col items-center font-medium gap-2">
        <p className="text-center">{title}</p>
        <p>{value}</p>
      </div>
    </div>
  );
};

export default InfoCard;
