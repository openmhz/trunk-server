// in src/restricted.js
import React, { useEffect } from "react";
import { useSelector, useDispatch } from 'react-redux'
import { authenticateUser } from "../features/user/userSlice";
import { useNavigate } from 'react-router-dom';
/**
 * Higher-order component (HOC) to wrap restricted pages
 */

const Restricted = ({ children }) => {
  const { authenticated, hasAuthenticated } = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    dispatch(authenticateUser({}));
  }, []);

  if (hasAuthenticated) {
    if (authenticated) {
      return children;
    }
    else {
      navigate("/login")
    }
  }
  return <div />

};

export default Restricted