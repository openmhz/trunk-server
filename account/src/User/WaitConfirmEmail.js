import { sendConfirmEmail  } from "../features/user/userSlice";
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux'
import { Container, Header, Button, Message, Icon } from "semantic-ui-react";

const WaitConfirmEmail = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { email, userId } = useSelector((state) => state.user);

  const handleSendConfirmEmail = async () => {
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
          />
        </Message.Content>
      </Message>
    </Container>
  );
};

export default WaitConfirmEmail;
