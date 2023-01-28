interface CardActionProps {
  onClick: () => void;
  IconComponent: React.ComponentType<{ className: string }>;
}

export function CardAction({ onClick, IconComponent }: CardActionProps) {
  return (
    <button onClick={onClick} className="focus:outline-none">
      <IconComponent className="h-6 w-6" />
    </button>
  );
}
