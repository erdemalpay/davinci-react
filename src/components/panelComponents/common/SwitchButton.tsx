import { Switch } from "@headlessui/react";

type Props = {
  checked: boolean;
  onChange: (value: (prev: boolean) => boolean) => void;
};

const SwitchButton = ({ checked, onChange }: Props) => {
  return (
    <Switch
      checked={checked}
      onChange={() => onChange((value) => !value)}
      className={`${checked ? "bg-green-500" : "bg-red-500"}
          relative inline-flex h-[20px] w-[36px] min-w-[36px] border-[1px] cursor-pointer rounded-full border-transparent transition-colors duration-200 ease-in-out focus:outline-none`}
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
