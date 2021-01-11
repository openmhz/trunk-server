import axios from "axios";
import * as types from "./billing-constants";
import { push } from 'connected-react-router';


function beginUpdateCard() {
  return { type: types.UPDATE_CARD };
}

function updateCardSuccess(data) {
  return { type: types.UPDATE_CARD_SUCCESS, data };
}

function updateCardError(data) {
  return { type: types.UPDATE_CARD_ERROR, data };
}


function beginFetchBilling() {
  return { type: types.FETCH_BILLING };
}

function fetchBillingSuccess(data) {
  return { type: types.FETCH_BILLING_SUCCESS,
  data };
}


function fetchBillingError(data) {
  return { type: types.FETCH_BILLING_ERROR,
  data };
}

function beginFetchInvoice() {
  return { type: types.FETCH_INVOICE };
}

function fetchInvoiceSuccess(data) {
  return { type: types.FETCH_INVOICE_SUCCESS,
  data };
}


function fetchInvoiceError(data) {
  return { type: types.FETCH_INVOICE_ERROR,
  data };
}

function makeUserRequest(method, data, api = "/login") {
  // returns a Promise
  return axios({
    method: method,
    url: api,
    data: data
  });
}

export function changeUrl(url) {
  return dispatch => {
    dispatch(push(url));
  };
}

// Example of an Async Action Creator
// http://redux.js.org/docs/advanced/AsyncActions.html

export function updateCard(data) {
  return dispatch => {
    dispatch(beginUpdateCard());

    return makeUserRequest("post", data,  "/api/customer/", {withCredentials: true})
      .then(response => {
        if (response.data.success) {
     

          dispatch(updateCardSuccess(response.data));
        } else {
          dispatch(updateCardError());
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




export function fetchBilling() {
  return (dispatch, getState) => {

    dispatch(beginFetchBilling());

    return axios
      .get("/api/billing", {withCredentials: true})
      .then(response => {
        if (response.data.success) {
          dispatch(fetchBillingSuccess(response.data));
        } else {
          dispatch(fetchBillingError());
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

export function fetchInvoices() {
  return (dispatch, getState) => {

    dispatch(beginFetchInvoice());

    return axios
      .get("/api/invoices", {withCredentials: true})
      .then(response => {
        if (response.data.success) {
          dispatch(fetchInvoiceSuccess(response.data));
        } else {
          dispatch(fetchInvoiceError());
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
