type Props = {
  icon: React.ReactNode;
  title: string;
  value: string;
  color: string;
};
const InfoCard = ({ icon, title, value, color }: Props) => {
  return (
    <div
      className="flex flex-col gap-6 py-6 px-10 items-center justify-center opacity-20 rounded-md"
      style={{
        backgroundColor: `bg-${color}-300`,
        color: `text-${color}-500`,
      }}
    >
      <div className="text-2xl">{icon}</div>
      <div className="flex flex-col gap-2">
        <p>{title}</p>
        <p>{value}</p>
      </div>
    </div>
  );
};

export default InfoCard;
