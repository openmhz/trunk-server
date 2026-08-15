import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, Dropdown, Modal, Button } from "semantic-ui-react";
import { useSelector, useDispatch } from 'react-redux'
import { logoutUser } from "../features/user/userSlice";

const navStyle = {
  marginBottom: "30px"
};

const Navigation = (props) => {
  const dispatch = useDispatch();
  const { email, admin } = useSelector((state) => state.user);
  const [confirmingLogout, setConfirmingLogout] = useState(false);

  const logout = () => {
    setConfirmingLogout(false);
    dispatch(logoutUser({}));
  };

  var profileLink = process.env.REACT_APP_ACCOUNT_SERVER + "/profile";
  return (
    <div>
      <Menu style={navStyle}>
        <Menu.Item name="systems" header>
          {process.env.REACT_APP_SITE_NAME}
        </Menu.Item>
        <Menu.Menu position="right">
          {admin &&
          <Link to="/users">
            <Menu.Item name="users">Users</Menu.Item>
          </Link> }
          {admin &&
          <Link to="/login-activity">
            <Menu.Item name="login-activity">Login Activity</Menu.Item>
          </Link> }
          {admin &&
          <Link to="/active-users">
            <Menu.Item name="active-users">Active Users</Menu.Item>
          </Link> }
          {admin &&
          <Link to="/all-systems">
            <Menu.Item name="all-systems">All Systems</Menu.Item>
          </Link>
          }
          <Link to="/list-systems">
            <Menu.Item name="systems"> Systems</Menu.Item>
          </Link>
          <Link to="/about">
            <Menu.Item name="about">About</Menu.Item>
          </Link>
          <Dropdown item text={ email }>
            <Dropdown.Menu>
              <Dropdown.Item href={profileLink}>Profile</Dropdown.Item>
              <Dropdown.Item onClick={() => setConfirmingLogout(true)}>Log out</Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </Menu.Menu>
      </Menu>

      {/* One session covers the player, this portal and your account, so
          logging out here logs you out of all three. Worth saying out loud
          before it happens. */}
      <Modal open={confirmingLogout} size="tiny" onClose={() => setConfirmingLogout(false)}>
        <Modal.Header>Log out?</Modal.Header>
        <Modal.Content>
          <p>This signs you out of the admin portal and of {process.env.REACT_APP_SITE_NAME} itself.</p>
        </Modal.Content>
        <Modal.Actions>
          <Button onClick={() => setConfirmingLogout(false)}>Stay signed in</Button>
          <Button primary onClick={logout}>Log out</Button>
        </Modal.Actions>
      </Modal>
    </div>
  );
}


export default Navigation;
