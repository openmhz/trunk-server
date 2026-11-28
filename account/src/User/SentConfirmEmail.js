import React, { useState } from "react";
import { Container, Message, Icon, Button } from "semantic-ui-react";
import { useSelector } from 'react-redux'
import { useResendConfirmEmail } from "./ResendConfirmEmail";

const SentConfirmEmail = () => {
  const { email, userId } = useSelector((state) => state.user);
  const { resend, error, sending } = useResendConfirmEmail();
  const [resent, setResent] = useState(false);

  const handleResend = async () => {
    setResent(false);
    if (await resend(userId)) {
      setResent(true);
    }
  };

  return (
    <div>
      <Container text>
        <Message icon>
          <Icon name='envelope outline' />
          <Message.Content>
            <Message.Header>{resent ? "Another confirmation email sent!" : "Confirmation email sent!"}</Message.Header>
            <p>
              We sent an email{email ? <> to <strong>{email}</strong></> : " to the address you gave us"}.<br />
              Please click on the link in the email to verify the email address.
            </p>
            <p>Nothing after a few minutes? Check your spam folder, then:</p>
            <Button
              content="Resend"
              onClick={handleResend}
              loading={sending}
              disabled={sending}
            />
            {error && <Message negative>{error}</Message>}
          </Message.Content>
        </Message>
      </Container>
    </div>
  );
};

export default SentConfirmEmail;
