// in src/restricted.js
import React, { useEffect } from "react";
import { useSelector, useDispatch } from 'react-redux'
import { authenticateUser } from "../features/user/userSlice";
import { useNavigate, useLocation } from 'react-router-dom';
/**
 * Higher-order component (HOC) to wrap restricted pages
 */

const Restricted = ({ children }) => {
  const { authenticated, hasAuthenticated, terms } = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { hash, pathname, search } = location;

  useEffect(() => {
    dispatch(authenticateUser({}));
  }, []);

  if (hasAuthenticated) {
    if (authenticated) {
      if ((pathname != "/terms") && (terms != 1.1)) {
        navigate("/terms")
      } else {
        return children;
      }
    }
    else {
      navigate("/login")
    }
  }
  return <div />

};

export default Restricted