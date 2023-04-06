import React, { useState } from "react";
import { resetPassword } from "../features/user/userSlice";
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux'
import {
  Container,
  Form,
  Segment,
  Button,
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
      const result = await dispatch(resetPassword({ userId, token, password })).unwrap();
      if (result.success) {
        navigate("/login");
      } else {
        console.error(result);
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
        </Segment>
      </Container>
    </div>
  );
};

export default ResetPassword;

