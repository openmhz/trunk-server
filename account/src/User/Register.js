import { useState } from "react";
import { registerUser } from "../features/user/userSlice";
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux'
import {
  Container,
  Header,
  Message,
  Icon
} from "semantic-ui-react";

import UserForm from "./UserForm";

function Register(props) {
  const [requestMessage, setRequestMessage] = useState("");
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const onRegisterSubmit = async (user) => {
    const result = await dispatch(registerUser(user)).unwrap();
    if (result.success) {
      navigate("/sent-confirm-email");
    } else {
      console.error(result);
      setRequestMessage(result.message);
    }
  };

  return (
    <div>
      <Container text>
        <Message icon>
          <Icon name='headphones' />
          <Message.Content>
            <Message.Header>Welcome!</Message.Header>
            <p>An account lets you listen to every radio system on {process.env.REACT_APP_SITE_NAME}. We ask for your callsign because it is how other listeners will see you.</p>
            <p>Want to contribute a feed of your own? Once you are signed in you can add a system and start uploading with <a href="https://github.com/robotastic/trunk-recorder">Trunk Recorder</a>.</p>
          </Message.Content>
        </Message>
      </Container>
      <Container text>
        <Header style={{ paddingTop: '20px' }} as="h1">Register</Header>
        <UserForm onSubmit={onRegisterSubmit} requestMessage={requestMessage} isWaiting={props.isWaiting} />
      </Container>
    </div>
  );
}

export default Register;
