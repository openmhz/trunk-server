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
import { useResendConfirmEmail } from "./ResendConfirmEmail";

// Turns the server's terse messages into something a person can act on.
// kind: "success" | "resend" (a new email will help) | "error"
const interpret = (result) => {
  if (result && result.success) {
    return { kind: "success", text: "You have successfully confirmed your email address." };
  }
  switch (result && result.message) {
    case "already confirmed email":
      return { kind: "success", text: "Your email address is already confirmed." };
    case "token expired":
      return { kind: "resend", text: "This confirmation link has expired." };
    case "token mismatch":
      return { kind: "resend", text: "This confirmation link isn't valid. It may have been replaced by a newer email, so try the most recent one or request a new one." };
    case "User not found":
      return { kind: "error", text: "We couldn't find an account for this link. Please check that you copied the whole link, or register again." };
    default:
      return { kind: "error", text: "Something went wrong confirming your email address. Please try again in a few minutes." };
  }
};

const ConfirmEmail = (props) => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  const [outcome, setOutcome] = useState(null);
  const [resent, setResent] = useState(false);
  const { userId, token } = useParams();
  const { resend, error: resendError, sending } = useResendConfirmEmail();

  useEffect(() => {
    let cancelled = false;
    const checkConfirmation = async () => {
      let result;
      try {
        result = await dispatch(confirmEmail({ userId, token })).unwrap();
      } catch (e) {
        result = null;
      }
      if (!cancelled) {
        setOutcome(interpret(result));
        setLoading(false);
      }
    };
    checkConfirmation();
    return () => { cancelled = true; };
  }, [userId, token, dispatch]);

  const handleResend = async () => {
    if (await resend(userId)) {
      setResent(true);
    }
  };

  const dimmerProps = { active: loading };

  let body = null;
  if (outcome && outcome.kind === "success") {
    body = (
      <Message icon>
        <Icon name='check' />
        <Message.Content>
          <Message.Header>Success</Message.Header>
          <p>{outcome.text}</p>
          <Link to="/login?nextLocation=admin">
            <Button
              size="large"
              content="Continue to login"
              fluid
            /></Link>
        </Message.Content>
      </Message>
    );
  } else if (outcome) {
    body = (
      <Message icon>
        <Icon name='exclamation' />
        <Message.Content>
          <Message.Header>We couldn't confirm your email</Message.Header>
          <p>{outcome.text}</p>
          {outcome.kind === "resend" && !resent && (
            <Button
              size="large"
              content="Send a new confirmation email"
              onClick={handleResend}
              loading={sending}
              disabled={sending}
              fluid
            />
          )}
          {resent && <Message positive>A new confirmation email is on its way. Please use the link in the newest email.</Message>}
          {resendError && <Message negative>{resendError}</Message>}
        </Message.Content>
      </Message>
    );
  }

  return (
    <Container text>
      <Dimmer {...dimmerProps}>
        <Loader indeterminate>Confirming Email Address</Loader>
      </Dimmer>
      {body}
    </Container>
  );
}

export default ConfirmEmail;
