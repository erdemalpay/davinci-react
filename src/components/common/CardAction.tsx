interface CardActionProps {
  onClick: () => void;
  IconComponent: React.ComponentType<{ className?: string }>;
}

export function CardAction({ onClick, IconComponent }: CardActionProps) {
  return (
    <button onClick={onClick} className="focus:outline-none">
      <IconComponent className="h-8 w-8 sm:h-6 sm:w-6" />
    </button>
  );
}
