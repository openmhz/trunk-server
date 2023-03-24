// in src/restricted.js
//import React, { Component } from 'react';
import React, { useEffect} from "react";
import { useSelector, useDispatch } from 'react-redux'
import { authenticateUser  } from "../features/user/userSlice";
/**
 * Higher-order component (HOC) to wrap restricted pages
 */


const Restricted = ({children }) => {
  const { authenticated, hasAuthenticated } = useSelector((state) => state.user);
  const dispatch = useDispatch();
  
  useEffect(() => {
    dispatch(authenticateUser({}));
  },[]);

  useEffect(() => {
    if (!authenticated) {
      console.log("I loaded things and it is not good")
    }
  }, [hasAuthenticated])

  if (authenticated) {
    return children;;
  }
  return <div/>
  
};

/*
const restricted = (BaseComponent, store) => {
  
  class Restricted extends Component {
    componentDidMount() {
      this.checkAuthentication(this.props);
    }

    componentDidUpdate(prevProps) {
      if (prevProps.location !== this.props.location) {
        this.checkAuthentication(this.props);
      }
    }

    checkAuthentication(params) {
      const authenticated = store.getState().user.authenticated;
      if (!authenticated) {
        axios
          .get(process.env.REACT_APP_ACCOUNT_SERVER + "/authenticated", { withCredentials: true })
          .then(response => {
            if (response.data.success) {
              const user = response.data.user
              store.dispatch({
                type: types.LOGIN_SUCCESS_USER,
                data: user
              });
            } else {
              window.location = process.env.REACT_APP_ACCOUNT_SERVER + "/login?nextLocation=admin";
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
*/

export default Restricted