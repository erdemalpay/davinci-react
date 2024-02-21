import TextInput from "../FormElements/TextInput";
import { H4, P2 } from "../Typography";
import ItemContainer from "../common/ItemContainer";

type Props = {};

const PersonalDetails = (props: Props) => {
  return (
    <ItemContainer>
      <div className="flex flex-col gap-2">
        <H4>Personal Details</H4>
        <P2>To change your personal detail , edit and save from here</P2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TextInput
          label="First Name"
          placeholder="Enter first name"
          type="text"
          value="John"
          onChange={(value) => console.log(value)}
        />
        <TextInput
          label="Last Name"
          placeholder="Enter last name"
          type="text"
          value="Doe"
          onChange={(value) => console.log(value)}
        />
        <TextInput
          label="Email"
          placeholder="Enter email"
          type="email"
          value="email@example.com"
          onChange={(value) => console.log(value)}
        />
        <TextInput
          label="Email"
          placeholder="Enter email"
          type="email"
          value="email@example.com"
          onChange={(value) => console.log(value)}
        />
        <TextInput
          label="Email"
          placeholder="Enter email"
          type="email"
          value="email@example.com"
          onChange={(value) => console.log(value)}
        />
      </div>
    </ItemContainer>
  );
};

export default PersonalDetails;
