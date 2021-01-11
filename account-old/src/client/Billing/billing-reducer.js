import {
  UPDATE_CARD,
  UPDATE_CARD_SUCCESS,
  UPDATE_CARD_ERROR,
  FETCH_BILLING,
  FETCH_BILLING_SUCCESS,
  FETCH_BILLING_ERROR,
  FETCH_INVOICE,
  FETCH_INVOICE_SUCCESS,
  FETCH_INVOICE_ERROR
} from "./billing-constants";

function updateObject(oldObject, newValues) {
    // Encapsulate the idea of passing a new object as the first parameter
    // to Object.assign to ensure we correctly copy data instead of mutating
    return Object.assign({}, oldObject, newValues);
}

function updateObjectInArray(array, shortName, updatedItem) {
    return array.map( item => {
        if(item.shortName !== shortName) {
            // This isn't the item we care about - keep it as-is
            return item;
        }

        // Otherwise, this is the one we want - return an updated value
        return {
            ...item,
            ...updatedItem
        };
    });
}


const billing = (
  state = {
    isWaiting: false,
    source: false,
    invoices: []},
  action
) => {
  switch (action.type) {

    case UPDATE_CARD:
    case FETCH_BILLING:
    case FETCH_INVOICE:
      return Object.assign({}, state, { isWaiting: true});


    case UPDATE_CARD_SUCCESS:
    return Object.assign({}, state, { source: action.data.source, isWaiting: false});

    case FETCH_BILLING_SUCCESS:
    return Object.assign({}, state, { source: action.data.source, isWaiting: false});

    case FETCH_INVOICE_SUCCESS:
    return Object.assign({}, state, { invoices: action.data.invoices, isWaiting: false});

    case UPDATE_CARD_ERROR:
    case FETCH_BILLING_ERROR:
    case FETCH_INVOICE_ERROR:
      return Object.assign({}, state, {
        isWaiting: false
      });

    default:
      return state;
  }
};

export default billing;
