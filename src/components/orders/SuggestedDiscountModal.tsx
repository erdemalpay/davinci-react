type Props = {
  isOpen: boolean;
  closeModal: () => void;
};

const SuggestedDiscountModal = ({ isOpen, closeModal }: Props) => {
  return (
    <div className="md:rounded-l-none shadow-none overflow-scroll  no-scrollbar   bg-white rounded-lg  p-2">
      SelectedDiscountModal dsfs
      <button onClick={closeModal}>Close</button>
    </div>
  );
};

export default SuggestedDiscountModal;
