// in src/restricted.js
import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import * as types from "../User/user-constants";
import axios from "axios";
/**
 * Higher-order component (HOC) to wrap restricted pages
 */
const restricted = (BaseComponent, store) => {
    class Restricted extends Component {
        componentWillMount() {
            this.checkAuthentication(this.props);
        }

        componentWillReceiveProps(nextProps) {
            if (nextProps.location !== this.props.location) {
                this.checkAuthentication(nextProps);
            }
        }

        checkAuthentication(params) {
            const { history } = params;
            const authenticated = store.getState().user.authenticated;
            if (!authenticated) {
              axios
                .get(process.env.REACT_APP_ACCOUNT_SERVER + "/authenticated", {withCredentials: true})
                .then(response => {
                  if (response.data.success) {
                    const user = response.data.user
                    store.dispatch({
                      type: types.LOGIN_SUCCESS_USER,
                      data: user
                    });
                  } else {
                    window.location = process.env.REACT_APP_ACCOUNT_SERVER + "/login?nextLocation=admin";
                    /*history.replace({ pathname: '/login',
            				state: { nextPathname: params.location.pathname } });*/
                  }
                })
                .catch(response => {
                  if (response instanceof Error) {
                    window.location = process.env.REACT_APP_ACCOUNT_SERVER + "/login?nextLocation=admin";
                    // Something happened during logout that triggered an Error
                    console.log("Error", response.message);
                  }
                });

            }
        }
        render() {
            return <BaseComponent {...this.props} />;
        }
    }
    return withRouter(Restricted);
}
export default restricted