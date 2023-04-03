import React, { useEffect, useState, } from "react";
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate, useSearchParams, Link  } from 'react-router-dom';
import UserForm from "./UserForm";
import {
  Container,
  Header
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
      console.log(result)
    } else {
      setMessage(result.message);
    }
  }


    // The Key on UserForm get updated when the user is loaded. This forces the Component to be completely redrawn, otherwise the changes in the Prop are not copied to State.
		return(
			<Container text>
        <Header as="h1">Update Profile</Header>
      <UserForm onSubmit={handleProfileSubmit} user={user} isEditing={true} requestMessage={message} isWaiting={props.isWaiting} key={user.userId}/>
			</Container>
		)
}

export default Profile
