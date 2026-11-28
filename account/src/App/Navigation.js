import { Menu, Dropdown } from "semantic-ui-react";
import { useSelector, useDispatch } from 'react-redux'
import { logoutUser } from "../features/user/userSlice";

const navStyle = {
  marginBottom: "30px"
};

const Navigation = (props) => {
  const dispatch = useDispatch();
  const { email, authenticated } = useSelector((state) => state.user);

  const logout = event => {
    event.preventDefault();
    dispatch(logoutUser({}));
  };

  var profileLink = process.env.REACT_APP_ACCOUNT_SERVER + "/profile";
  return (
    <div>
      <Menu style={navStyle}>
        <Menu.Item name="systems" header>
          {process.env.REACT_APP_SITE_NAME}
        </Menu.Item>
        {authenticated && (
          <Menu.Menu position="right">
            <Menu.Item href={process.env.REACT_APP_ADMIN_SERVER}>Manage your radio systems</Menu.Item>
            <Dropdown item text={ email }>
              <Dropdown.Menu>
                <Dropdown.Item href={profileLink}>Profile</Dropdown.Item>
                <Dropdown.Item onClick={logout}>Logout</Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </Menu.Menu>
        )}
      </Menu>
    </div>
  );
}


export default Navigation;
