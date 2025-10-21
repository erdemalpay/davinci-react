import { Switch } from "@headlessui/react";

type Props = {
  checked: boolean;
  onChange: (value: (prev: boolean) => boolean) => void;
  disabled?: boolean;
};

const SwitchButton = ({ checked, onChange, disabled = false }: Props) => {
  return (
    <Switch
      checked={checked}
      onChange={() => onChange((value) => !value)}
      disabled={disabled}
      className={`${checked ? "bg-green-500" : "bg-red-500"}
          relative inline-flex h-[20px] w-[36px] min-w-[36px] border-[1px] ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"} rounded-full border-transparent transition-colors duration-200 ease-in-out focus:outline-none`}
    >
      <span
        aria-hidden="true"
        className={`${checked ? "translate-x-4" : "translate-x-0"}
            pointer-events-none inline-block h-[18px] w-[18px] transform rounded-full bg-white transition duration-200 ease-in-out`}
      />
    </Switch>
  );
};

export default SwitchButton;
