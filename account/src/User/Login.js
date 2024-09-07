import { useState } from "react";
import { useNavigate, useSearchParams, Link, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux'
import { loginUser } from "../features/user/userSlice";
import {
  Container,
  Header,
  Form,
  Grid,
  Segment,
  Button,
  Message,
  Icon,
  Divider
} from "semantic-ui-react";


const dividerStyle = {
  marginTop: "40px"
};

const forgotStyle = {
  marginTop: "40px",
  textAlign: "right"
};




const Login = (props) => {
  const { terms } = useSelector((state) => state.user);
  const [loginMessage, setLoginMessage] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  let [searchParams] = useSearchParams();
  const nextLocation = searchParams.get("nextLocation");
  const location = useLocation();
  const { hash, pathname, search } = location;
  const dispatch = useDispatch();

  const loginSubmit = async (event) => {
    event.preventDefault();
    const result = await dispatch(loginUser({ email, password })).unwrap();
    const user = result.user;
    if (result.success) {
      if ((pathname != "/terms") && (user.terms != 1.1)) {
        navigate("/terms")
      } else if (nextLocation) {
          switch (nextLocation) {
            case "frontend":
              window.location = process.env.REACT_APP_FRONTEND_SERVER;
              break;
            default:
            case "admin":
              window.location = process.env.REACT_APP_ADMIN_SERVER;
              break;
            case "account":
              navigate("/");
              break;
          }
        } else {
          navigate("/");
        }
      console.log(result)
    } else {
      console.error(result);
      setLoginMessage(result.message);
      if (result.reason === "unconfirmed email") {
        /*data.userId = response.data.userId;
        dispatch(loginEmailError(data));*/
        navigate("/wait-confirm-email");
      }
      /*
      if (result.reason === "unaccepted TOS") {
        navigate("/terms");
      }*/
    }
  }

  let loginMessageDisplay = (<></>)

  if (loginMessage) {
    loginMessageDisplay = (
      <Message icon>
        <Icon name="lemon" />
        <Message.Content>
          <Message.Header>Problems...</Message.Header>
          {loginMessage}
        </Message.Content>
      </Message>
    );
  }

  return (
    <Container>
      <Header as="h1">{process.env.REACT_APP_SITE_NAME}</Header>
      <Grid stackable >
        <Grid.Row>
          <Grid.Column width={9}>

            <Header size="large">Let's get this started!</Header>
            <Header size="small">
              {process.env.REACT_APP_SITE_NAME} makes it easy to share recordings from{" "}
              <a href="https://github.com/robotastic/trunk-recorder">
                Trunk Recorder
              </a>.</Header>
            <p>
              Trunk Recorder makes it easy to record the radio systems
              used by your local police and fire department. Trunk Recorder
              is sort of like an awesome version of those Scanners from
              Radio Shack... 10-4!
            </p>
            <p>
              This site is a work in progress. I plan on adding more
              features over time, but right now it can:
            </p>
            <ul>
              <li>30 day archive</li>
              <li>Filter by talkgroup</li>
            </ul>
            <p>
              All of this goodness is free! In the future, I might offer
              paid accounts with additional features and a longer archive
              period, but I will always try to have a free version.
            </p>
            <p>
              {" "}
              - Luke{" "}
              <a
                href="mailto:{process.env.REACT_APP_ADMIN_EMAIL}?Subject={process.env.REACT_APP_SITE_NAME}"
                target="_top"
              >
                admin@email.com
              </a>{" "}
            </p>
          </Grid.Column>
          <Grid.Column floated="right" width={6}>
            <Header as="h3">Need an account?</Header>
            <Button
              size="large"
              content="Register"
              onClick={() => navigate("/register")}
              fluid
            />
            <Divider style={dividerStyle} horizontal>Or</Divider>
            <Header as="h3">Login</Header>
            <Form onSubmit={loginSubmit}>
              <Segment padded>
                <Form.Field>
                  <Form.Input
                    icon="user"
                    iconPosition="left"
                    type="text"
                    name="email"
                    onChange={e => setEmail(e.target.value)}
                    value={email}
                    placeholder="E-mail address"
                  />
                </Form.Field>
                <Form.Field>
                  <Form.Input
                    icon="lock"
                    iconPosition="left"
                    type="password"
                    name="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Password"
                  />
                </Form.Field>

                <Button type="submit" size="large" value="Login" fluid>
                  Login
                </Button>
                {loginMessageDisplay}
              </Segment>
            </Form>
            <div style={forgotStyle} >
              <Link to="/send-reset-password">Forgot Password</Link>
            </div>
          </Grid.Column>
        </Grid.Row>
      </Grid>
    </Container>
  );
}


export default Login;
