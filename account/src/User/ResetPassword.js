import React, { useState } from "react";
import { resetPassword } from "../features/user/userSlice";
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux'
import {
  Container,
  Form,
  Segment,
  Button,
  Message,
} from "semantic-ui-react";

const ResetPassword = (props) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState(false);
  const [confirmPasswordError, setConfirmPasswordError] = useState(false);
  const [checkInputMessages, setCheckInputMessages] = useState([]);
  const { userId, token } = useParams();
  const [resetError, setResetError] = useState(null);

  const handleResetPassword = async () => {
    let error = false;
    var inputMessages = [];

    if (password === "") {
      setPasswordError(true);
      inputMessages.push("Password is required");
      error = true;
    } else if (password.length < 7) {
      setPasswordError(true);
      inputMessages.push("Password must be 7 characters or more");
      error = true;
    } else {
      setPasswordError(false);
    }

    if (password !== confirmPassword) {
      setConfirmPasswordError(true);
      inputMessages.push("The passwords did not match");
      error = true;
    } else {
      setConfirmPasswordError(false);
    }

    setCheckInputMessages(inputMessages);
    if (!error) {
      setResetError(null);
      let result;
      try {
        result = await dispatch(resetPassword({ userId, token, password })).unwrap();
      } catch (e) {
        console.error(e);
        setResetError({ text: "We couldn't reach the server. Please check your connection and try again.", newLink: false });
        return;
      }
      if (result.success) {
        navigate("/login");
      } else {
        console.error(result);
        if (result.message === "token expired") {
          setResetError({ text: "This password reset link has expired.", newLink: true });
        } else if (result.message === "token mismatch") {
          setResetError({ text: "This password reset link isn't valid. It may have been replaced by a newer one, or already used.", newLink: true });
        } else if (result.message === "User not found") {
          setResetError({ text: "We couldn't find an account for this link.", newLink: true });
        } else {
          setResetError({ text: typeof result.message === "string" && result.message ? result.message : "Something went wrong resetting your password. Please try again.", newLink: false });
        }
      }

    }
  };

  return (
    <div>
      <Container text>
        <Segment>
          <Form className="raised padding segment">
            <Form.Group widths="equal">
              <Form.Field>
                <Form.Input
                  name="password"
                  type="password"
                  onChange={e => setPassword(e.target.value)}
                  error={passwordError}
                  label="Password"
                  placeholder="Password..."
                />
              </Form.Field>
              <Form.Field>
                <Form.Input
                  name="confirmPassword"
                  type="password"
                  onChange={e => setConfirmPassword(e.target.value)}
                  error={confirmPasswordError}
                  label="Confirm Password"
                  placeholder="Confirm Password..."
                />
              </Form.Field>
            </Form.Group>
            <Button
              size="large"
              content="Reset Password"
              onClick={handleResetPassword}
              fluid
            />
            {checkInputMessages.length > 0 && (
              <div style={{ marginTop: "10px" }}>
                {checkInputMessages.map((msg) => (
                  <p key={msg} style={{ color: "red" }}>
                    {msg}
                  </p>
                ))}
              </div>
            )}
          </Form>
          {resetError && (
            <Message negative>
              <p>{resetError.text}</p>
              {resetError.newLink && <p><Link to="/send-reset-password">Request a new password reset email</Link></p>}
            </Message>
          )}
        </Segment>
      </Container>
    </div>
  );
};

export default ResetPassword;

