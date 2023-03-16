import axios from "axios";
//import { browserHistory } from "react-router"
import * as types from "./error-constants";
import { push } from  '@lagunovsky/redux-react-router';


function beginFetch() {
  return { type: types.FETCH };
}

function fetchSuccess(data) {
  return { type: types.FETCH_SUCCESS,
  data };
}

function fetchError(data) {
  return { type: types.FETCH_ERROR,
  data };
}

export function changeUrl(url) {
  return dispatch => {
    dispatch(push(url));
  };
}

export function fetch(shortName) {
  return (dispatch, getState) => {

    dispatch(beginFetch());

    return axios
      .get(process.env.REACT_APP_BACKEND_SERVER + "/" + shortName + "/errors",  {withCredentials: true})
      .then(response => {
        if (response.data) {
          var data ={
            shortName: shortName,
            errors: response.data
          }
          dispatch(fetchSuccess(data));
        } else {
          dispatch(fetchError());
          let registerMessage = response.data.message;
          return registerMessage;
        }
      })
      .catch(response => {
        if (response instanceof Error) {
          // Something happened in setting up the request that triggered an Error
          console.log("Error", response.message);
        }
      });
  };
}
