import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Container, Header, Button, Segment, Icon, Loader } from "semantic-ui-react";

import { authenticateUser, selectUser } from "../features/user/userSlice";

/**
 * Wraps anything that needs a signed-in listener.
 *
 * The backend returns 401 for call content, and without this the page simply
 * renders empty - which looks like the site is broken rather than like you need
 * an account. Asks the account service who you are, then either renders the
 * children or explains what to do about it.
 */
const RequireListener = ({ children }) => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const accountServer = process.env.REACT_APP_ACCOUNT_SERVER;

  useEffect(() => {
    if (!user.hasChecked) {
      dispatch(authenticateUser());
    }
  }, [dispatch, user.hasChecked]);

  // Do not flash the sign-in wall before the answer arrives.
  if (!user.hasChecked) {
    return (
      <Container text style={{ paddingTop: "80px", textAlign: "center" }}>
        <Loader active inline="centered" size="large" />
      </Container>
    );
  }

  if (user.authenticated) {
    return children;
  }

  // nextLocation is the account service's own convention for where to go after
  // signing in. It maps to a configured origin rather than taking a URL from
  // the query string, so it cannot be turned into an open redirect.
  return (
    <Container text style={{ paddingTop: "60px" }}>
      <Segment padded="very" textAlign="center">
        <Header as="h2" icon>
          <Icon name="headphones" />
          Sign in to listen
          <Header.Subheader style={{ marginTop: "12px" }}>
            Recordings on {process.env.REACT_APP_SITE_NAME} are for licensed amateur
            radio operators. Signing in takes a minute and is free.
          </Header.Subheader>
        </Header>
        <div style={{ marginTop: "28px" }}>
          <Button
            primary
            size="large"
            href={`${accountServer}/login?nextLocation=frontend`}
          >
            Sign in
          </Button>
          <Button
            size="large"
            style={{ marginLeft: "10px" }}
            href={`${accountServer}/register`}
          >
            Create an account
          </Button>
        </div>
      </Segment>
    </Container>
  );
};

export default RequireListener;
