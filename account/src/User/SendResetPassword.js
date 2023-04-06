import { useState } from "react";
import {
  Form,
  Grid,
  Segment,
  Button,
  Message,
  Icon
} from "semantic-ui-react";
import { sendResetPassword } from "../features/user/userSlice";
import { Link } from "react-router-dom";
import { useDispatch } from 'react-redux'



const SendResetPassword = () => {
  const dispatch = useDispatch();
  const [checkInputMessages, setCheckInputMessages] = useState("");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const returnStyle = {
    marginTop: "30px"
  };

  const handleSendResetPassword = async () => {
    if (email === "") {
      setEmailError(true);
      setCheckInputMessages("Email is required");
    } else {
      const result = await dispatch(sendResetPassword({ email })).unwrap();
      if (result.success) {
        setResetSent(true);
        setEmailError(true);
      } else {
        setCheckInputMessages(result.message);
        console.error(result);
      }
    }
  };

  var resetMessage = "";
  if (checkInputMessages.length) {
    resetMessage = (
      <Message compact warning icon>
        <Icon name="lightning" />
        <Message.Content>
          <Message.Header>Problems...</Message.Header>
          {checkInputMessages}
        </Message.Content>
      </Message>
    );
  }

  return (
    <Grid verticalAlign="middle" centered>
      <Grid.Row>
        <Grid.Column width={6}>
          {!resetSent ? (
            <div>
              <h2>Forgot your password?</h2>
              <Form className="raised padding segment">
                Enter the email address for your account.
                <Form.Field>
                  <Form.Input
                    type="text"
                    name="email"
                    onChange={e => setEmail(e.target.value)}
                    value={email}
                    error={emailError}
                    label="Email"
                    placeholder="Email..."
                  />
                </Form.Field>
                <Button
                  size="large"
                  content="Reset Password"
                  onClick={handleSendResetPassword}
                  fluid
                />
              </Form>
              {resetMessage}
            </div>
          ) : (
            <Segment raised padded="very">
              <h2>Reset Link Sent </h2>
              <div>
                An email with a link to reset your password was sent to: {email}
              </div>
              <Link to="/" style={returnStyle}>
                <Icon name="left arrow" />
                Back to OpenMHz
              </Link>
            </Segment>
          )}
        </Grid.Column>
      </Grid.Row>
    </Grid>
  );
}

export default SendResetPassword;
