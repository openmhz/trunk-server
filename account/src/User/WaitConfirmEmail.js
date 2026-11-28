import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux'
import { Container, Header, Button, Message, Icon } from "semantic-ui-react";
import { useResendConfirmEmail } from "./ResendConfirmEmail";

const WaitConfirmEmail = () => {
  const navigate = useNavigate();
  const { email, userId, confirmEmailSent } = useSelector((state) => state.user);
  const { resend, error, sending } = useResendConfirmEmail();

  const handleSendConfirmEmail = async () => {
    if (await resend(userId)) {
      navigate("/sent-confirm-email");
    }
  };

  return (
    <Container text>
      <Message icon>
        <Icon name="envelope outline" />
        <Message.Content>
          <Message.Header>Confirm your email address</Message.Header>
          {confirmEmailSent === false ? (
            <p>
              Your account was created{email ? <> for <strong>{email}</strong></> : null}, but
              we couldn't send the confirmation email. Use Resend below to try again.
            </p>
          ) : (
            <p>
              We sent an email{email ? <> to <strong>{email}</strong></> : " to the address you gave us"}.
              <br />
              Please click on the link in the email to verify the email address.
            </p>
          )}
          <Header as="h3">Didn't get an email?</Header>
          <p>So, you have waited a bit and haven't gotten anything?</p>
          <p>...and you checked your spam folder?</p>
          <p>Well, click below.</p>
          <Button
            size="large"
            content="Resend Email Confirmation"
            onClick={handleSendConfirmEmail}
            loading={sending}
            disabled={sending}
          />
          {error && <Message negative>{error}</Message>}
        </Message.Content>
      </Message>
    </Container>
  );
};

export default WaitConfirmEmail;
