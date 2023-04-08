// in src/restricted.js
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

  if (hasAuthenticated) {
    if (authenticated) {
      return children;;
    } 
   else {
    window.location = process.env.REACT_APP_ACCOUNT_SERVER + "/login?nextLocation=admin";
  } 
}
  return <div/>
  
};

export default Restricted