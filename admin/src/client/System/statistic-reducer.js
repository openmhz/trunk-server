

const FETCH_SUCCESS_STATISTIC = "FETCH_SUCCESS_STATISTIC"

const statistic = (
  state = {},
  action
) => {
  switch (action.type) {


    case FETCH_SUCCESS_STATISTIC:
    return Object.assign({}, state,  {...action.data});

    default:
      return state;
  }
};

export default statistic;
