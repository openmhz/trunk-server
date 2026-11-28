import  { useState, } from "react";
import { useSelector, useDispatch } from 'react-redux'
import UserForm from "./UserForm";
import {
  Container,
  Header,
  Button,
  Message
} from "semantic-ui-react";
import { updateProfile } from "../features/user/userSlice";

const Profile = (props) => {
  const [message, setMessage] = useState("");
  const user = useSelector((state) => state.user);
  const dispatch = useDispatch();
  
  const handleProfileSubmit = async (updatedUser) => {
      updatedUser.userId = user.userId

      const result = await dispatch(updateProfile(updatedUser)).unwrap();
      if (result.success) {
      setMessage("");
    } else {
      setMessage(typeof result.message === "string" ? result.message : "Unable to update profile.");
    }
  }


    // The Key on UserForm get updated when the user is loaded. This forces the Component to be completely redrawn, otherwise the changes in the Prop are not copied to State.
		return(
			<Container text>
        <Message icon>
          <Message.Content>
            <Message.Header>Ready to share recordings?</Message.Header>
            <p>Add and manage your radio systems in the admin area.</p>
            <Button primary as="a" href={process.env.REACT_APP_ADMIN_SERVER}>Manage your radio systems</Button>
          </Message.Content>
        </Message>
        <Header as="h1">Update Profile</Header>
      <UserForm onSubmit={handleProfileSubmit} user={user} isEditing={true} requestMessage={message} isWaiting={props.isWaiting} key={user.userId}/>
			</Container>
		)
}

export default Profile
