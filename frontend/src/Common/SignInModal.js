import { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Modal,
  Form,
  Button,
  Message,
  Icon,
  Divider
} from "semantic-ui-react";

import { loginUser } from "../features/user/userSlice";

/**
 * Signing in without leaving the front page.
 *
 * The account service is still the only thing that authenticates anyone; this
 * posts to it and the shared cookie does the rest. Two outcomes cannot be
 * handled here and hand off to the account site instead: an unconfirmed email
 * address, which needs the resend flow, and terms that have not been accepted.
 */
const SignInModal = ({ open, onClose }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const accountServer = process.env.REACT_APP_ACCOUNT_SERVER;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const close = () => {
    setMessage("");
    setPassword("");
    setBusy(false);
    onClose();
  };

  const submit = async () => {
    if (!email || !password) {
      setMessage("Enter your email address and password.");
      return;
    }
    setBusy(true);
    setMessage("");

    let result;
    try {
      result = await dispatch(loginUser({ email, password })).unwrap();
    } catch (err) {
      setBusy(false);
      setMessage("Could not reach the sign-in service. Please try again.");
      return;
    }
    setBusy(false);

    if (!result.success) {
      // The address exists but has never been confirmed. That needs the resend
      // flow, which lives on the account site - carry the id across so its
      // resend button has something to work with.
      if (result.reason === "unconfirmed email") {
        const params = new URLSearchParams({ email: email });
        if (result.userId) params.set("userId", result.userId);
        window.location = `${accountServer}/wait-confirm-email?${params.toString()}`;
        return;
      }
      setMessage(result.message || "Invalid email or password.");
      return;
    }

    // Terms are versioned and accepting them writes to the account. Send them
    // there to do it, then they land back on their profile.
    if (result.user && result.user.terms !== 1.1) {
      window.location = `${accountServer}/terms`;
      return;
    }

    close();
    navigate("/systems");
  };

  return (
    <Modal open={open} onClose={close} size="tiny" closeIcon>
      <Modal.Header>Sign in to {process.env.REACT_APP_SITE_NAME}</Modal.Header>
      <Modal.Content>
        <Form onSubmit={submit}>
          <Form.Input
            icon="user"
            iconPosition="left"
            type="text"
            name="email"
            label="Email"
            autoComplete="username"
            value={email}
            onChange={(e, { value }) => setEmail(value)}
          />
          <Form.Input
            icon="lock"
            iconPosition="left"
            type="password"
            name="password"
            label="Password"
            autoComplete="current-password"
            value={password}
            onChange={(e, { value }) => setPassword(value)}
          />
          {message &&
            <Message negative>
              <Icon name="exclamation circle" />
              {message}
            </Message>}
          {/* Submits the form, so Enter in either field works too. */}
          <Button primary fluid size="large" type="submit" loading={busy} disabled={busy}>
            Sign in
          </Button>
        </Form>

        <div style={{ marginTop: "14px", textAlign: "right" }}>
          <a href={`${accountServer}/send-reset-password`}>Forgot password</a>
        </div>

        <Divider horizontal>Or</Divider>

        <Button
          fluid
          size="large"
          href={`${accountServer}/register`}
          content="Create an account"
        />
      </Modal.Content>
    </Modal>
  );
};

export default SignInModal;
