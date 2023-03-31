import React, { useState } from "react";
import { registerUser  } from "../features/user/userSlice";
import { useNavigate, useSearchParams, Link  } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux'
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
  const onRegisterSubmit = async(user) => {
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
          <Icon name='trophy'/>
          <Message.Content>
            <Message.Header>Welcome!</Message.Header>
              <p>Creating an account on OpenMHz is the first step in sharing radio system recordings using Trunk Recorder.</p>
              <p>After creating an account, head over <a href="https://github.com/robotastic/trunk-recorder">here</a> to learn more about Trunk Recorder</p>
              <p> - Luke</p>
          </Message.Content>
        </Message>
      </Container>
      <Container text>
        <Header style={{ paddingTop: '20px' }} as="h1">Register</Header>
        <UserForm onSubmit={onRegisterSubmit} requestMessage={requestMessage} isWaiting={props.isWaiting}/>
      </Container>
    </div>
  );
}

export default Register;
