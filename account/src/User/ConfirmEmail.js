import React, { useState, useEffect } from "react";
import {
  Container,
  Dimmer,
  Loader,
  Button,
  Message,
  Icon
} from "semantic-ui-react";
import { Link, useParams } from "react-router-dom";
import { confirmEmail } from "../features/user/userSlice";
import { useDispatch } from 'react-redux'

const ConfirmEmail = (props) => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  const [confirmMessage, setConfirmMessage] = useState({ success: false, message: "" });
  const { userId, token } = useParams();


  const checkConfirmation = async(userId, token) => {
    const result = await dispatch(confirmEmail({ userId, token })).unwrap();
    if (result) {
      setConfirmMessage(result);
      setLoading(false);
    }
  }

  useEffect(() => {
    checkConfirmation(userId, token);
  }, [userId, token]);

  const dimmerProps = { active: loading };

  return (
    <Container text>
      <Dimmer {...dimmerProps}>
        <Loader indeterminate>Confirming Email Address</Loader>
      </Dimmer>

      {confirmMessage.success ? (
        <Message icon>
          <Icon name='check' />
          <Message.Content>
            <Message.Header>Success</Message.Header>
            <p>You have successfully confirmed you email address.</p>
            <Link to="/login?nextLocation=admin">
              <Button
                size="large"
                content="Continue to Login"
                fluid
              /></Link>
          </Message.Content>
        </Message>
      ) : (
        <Message icon>
          <Icon name='exclamation' />
          <Message.Content>
            <Message.Header>Error</Message.Header>
            <p>{confirmMessage.message}</p>
          </Message.Content>
        </Message>
      )}

    </Container>
  );
}

export default ConfirmEmail;


