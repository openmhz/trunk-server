import React, { Component } from "react";
import { Menu, Dropdown } from "semantic-ui-react";

const navStyle = {
  marginBottom: "30px"
};

class Navigation extends Component {
  constructor(props) {
    super(props);
    this._logout = this._logout.bind(this);
  }

  _logout = event => {
    event.preventDefault();
    this.props.manualLogout();
  };

  render() {
    var profileLink = process.env.REACT_APP_ACCOUNT_SERVER + "/profile";
    return (
      <div>
        {this.props.user.authenticated ? (
          <Menu style={navStyle}>
              <Menu.Item name="systems" header>
              {process.env.REACT_APP_SITE_NAME}
              </Menu.Item>
            <Menu.Menu position="right">
              {/* <Link to="/update-plans">
                <Menu.Item name="systems">Update Plans</Menu.Item>
              </Link> */}
              <Dropdown item text={this.props.user.email}>
                <Dropdown.Menu>
                    <Dropdown.Item href={profileLink}>Profile</Dropdown.Item>
                    {/* <Dropdown.Item href={billingLink}>Billing</Dropdown.Item> */}
                    <Dropdown.Item onClick={this._logout}>Logout</Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </Menu.Menu>
          </Menu>
        ) : (
          <Menu style={navStyle}>
              <Menu.Item name="systems" header>
                OpenMHz
              </Menu.Item>
          </Menu>
        )}
      </div>
    );
  }
}

export default Navigation;
