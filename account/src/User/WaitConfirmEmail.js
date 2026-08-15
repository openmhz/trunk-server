import { sendConfirmEmail  } from "../features/user/userSlice";
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux'
import { Container, Header, Button, Message, Icon } from "semantic-ui-react";

const WaitConfirmEmail = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const stored = useSelector((state) => state.user);

  // Arriving from the sign-in modal on the main site means a fresh page load
  // and an empty store, so fall back to the query string it hands over.
  // Without this the resend button posts to /users//send-confirm and 404s.
  const userId = stored.userId || searchParams.get("userId");
  const email = stored.email || searchParams.get("email");

  const handleSendConfirmEmail = async () => {
    if (!userId) return;
    await dispatch(sendConfirmEmail(userId)).unwrap();
    navigate("/sent-confirm-email")
  };

  return (
    <Container text>
      <Message icon>
        <Icon name="envelope outline" />
        <Message.Content>
          <Message.Header>Confirm your email address</Message.Header>
          <p>
            We sent an email to the address you gave us: {email}
            <br />
            Please click on the link in the email to verify the email address.
          </p>
          <Header as="h3">Didn't get an email?</Header>
          <p>So, you have waited a bit and haven't gotten anything?</p>
          <p>...and you checked your spam folder?</p>
          <p>Well, click below.</p>
          <Button
            size="large"
            content="Resend Email Confirmation"
            onClick={handleSendConfirmEmail}
            disabled={!userId}
          />
        </Message.Content>
      </Message>
    </Container>
  );
};

export default WaitConfirmEmail;
