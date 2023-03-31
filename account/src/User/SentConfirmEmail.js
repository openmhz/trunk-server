import React from "react";
import { Container, Message, Icon } from "semantic-ui-react";
import { useSelector } from 'react-redux'

const SentConfirmEmail = ({ user }) => {
  const { email } = useSelector((state) => state.user);
  return (
    <div>
      <Container text>
        <Message icon>
          <Icon name='envelope outline' />
          <Message.Content>
            <Message.Header>Confirmation email sent!</Message.Header>
            <p>
              We sent an email to the address you gave us: {email}<br />
              Please click on the link in the email to verify the email address.
            </p>
          </Message.Content>
        </Message>
      </Container>
    </div>
  );
};

export default SentConfirmEmail;
