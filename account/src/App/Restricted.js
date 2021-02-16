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
                .get("/authenticated")
                .then(response => {
                  if (response.data.success) {
                    const user = response.data.user
                    store.dispatch({
                      type: types.LOGIN_SUCCESS_USER,
                      data: user
                    });
                  } else {
                    history.replace({ pathname: '/login',
            				state: { nextPathname: params.location.pathname } });
                  }
                })
                .catch(response => {
                  if (response instanceof Error) {
                    // Something happened during logout that triggered an Error
                    history.replace({ pathname: '/login',
            				state: { nextPathname: params.location.pathname } });
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