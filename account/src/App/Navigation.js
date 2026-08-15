import { useState } from "react";
import { Menu, Dropdown, Modal, Button, Icon } from "semantic-ui-react";
import { useSelector, useDispatch } from 'react-redux'
import { logoutUser } from "../features/user/userSlice";

const navStyle = {
  marginBottom: "30px"
};

const Navigation = (props) => {
  const dispatch = useDispatch();
  const { email, authenticated, admin } = useSelector((state) => state.user);
  const [confirmingLogout, setConfirmingLogout] = useState(false);

  const logout = () => {
    setConfirmingLogout(false);
    dispatch(logoutUser({}));
  };

  // This is its own site on its own hostname, so "back to the rest of it" has
  // to be a full URL. Without these there was no way off the profile page at
  // all - you had to know to edit the address bar.
  const frontendServer = process.env.REACT_APP_FRONTEND_SERVER;
  const adminServer = process.env.REACT_APP_ADMIN_SERVER;
  const profileLink = process.env.REACT_APP_ACCOUNT_SERVER + "/profile";

  return (
    <div>
      <Menu style={navStyle}>
        <Menu.Item header href={frontendServer}>
          {process.env.REACT_APP_SITE_NAME}
        </Menu.Item>
        <Menu.Item link href={`${frontendServer}/systems`}>
          <Icon name="headphones" /> Listen
        </Menu.Item>
        <Menu.Menu position="right">
          {admin &&
            <Menu.Item link href={adminServer}>Admin</Menu.Item>}
          {authenticated
            ? <Dropdown item text={email}>
                <Dropdown.Menu>
                  <Dropdown.Item href={profileLink}>Profile</Dropdown.Item>
                  <Dropdown.Item onClick={() => setConfirmingLogout(true)}>Log out</Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            : <Menu.Item link href={`${frontendServer}/`}>Home</Menu.Item>}
        </Menu.Menu>
      </Menu>

      <Modal open={confirmingLogout} size="tiny" onClose={() => setConfirmingLogout(false)}>
        <Modal.Header>Log out?</Modal.Header>
        <Modal.Content>
          <p>This signs you out of {process.env.REACT_APP_SITE_NAME} everywhere - your account, the player, and the admin portal.</p>
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
