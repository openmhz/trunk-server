import {
  FETCH_CALL_INFO,
  FETCH_SUCCESS_CALL_INFO,
  FETCH_ERROR_CALL_INFO,
  FETCH_CALL,
  PREPEND_CALL,
  UPSERT_CALL,
  FETCH_SUCCESS_CALL,
  FETCH_SUCCESS_OLDER_CALL,
  FETCH_SUCCESS_NEWER_CALL,
  FETCH_ERROR_CALL,
  SET_SHORT_NAME,
  SET_ALL_FILTER,
  SET_GROUP_FILTER,
  SET_TALKGROUP_FILTER,
  SET_DATE_FILTER,
  SET_STARRED_FILTER,
  SET_FILTER,
  SET_CURRENT_CALL_ID,
  SET_LIVE,
  SET_CALL_TIME,
  ADD_STAR_SUCCESS
} from "./call-constants";

function updateObject(oldObject, newValues) {
    // Encapsulate the idea of passing a new object as the first parameter
    // to Object.assign to ensure we correctly copy data instead of mutating
    return Object.assign({}, oldObject, newValues);
}

function updateCallInItems(calls, action) {
return  calls.map( (item) => {
        if (item._id !== action.data._id) {
            // This isn't the item we care about - keep it as-is
            return item;
        }

        // Otherwise, this is the one we want - return an updated value
        return {
            ...action.data
        };
    });
}
/*
function updateObjectInArray(array, action) {
  return array.map((item, index) => {
    if (index !== action.index) {
      // This isn't the item we care about - keep it as-is
      return item
    }

    // Otherwise, this is the one we want - return an updated value
    return {
      ...item,
      ...action.item
    }
  })
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
*/
const now = new Date();
const call = (
  state = {
    isWaiting: false,
    shortName: "",
    byId: {},
    allIds: [],
    oldestCallTime: now,
    newestCallTime: now,
    filterType: 0,
    filterTalkgroups: [],
    filterGroupId: false,
    filterDate: false,
    filterStarred: false,
    currentCallId: false,
    live: false
  },
  action
) => {
  switch (action.type) {

    case SET_CURRENT_CALL_ID:
      return Object.assign({}, state, {currentCallId: action.data});
      
    case SET_CALL_TIME:
      return Object.assign({}, state, {newestCallTime: action.data, oldestCallTime: action.data });
    case SET_FILTER:
    {
      var filter={};
      filter.live = !action.data.live ? state.live : action.data.live;
      filter.filterStarred = !action.data.filterStarred ? false : action.data.filterStarred;
      filter.filterType = !action.data.filterType ? 0 : action.data.filterType;
      filter.filterTalkgroups = !action.data.filterTalkgroups ? [] : action.data.filterTalkgroups;
      filter.filterGroupId = !action.data.filterGroupId ? false : action.data.filterGroupId;
      filter.filterDate = !action.data.filterDate ? 0 : action.data.filterDate;
      return Object.assign({}, state, {
        live: action.data.live,
        filterType: action.data.filterType,
        filterTalkgroups: action.data.filterTalkgroups,
        filterGroupId: action.data.filterGroupId,
        filterDate: action.data.filterDate,
        filterStarred: action.data.filterStarred
      });
    }

    case SET_LIVE:
      return Object.assign({}, state, {live: action.data});
    
    case SET_SHORT_NAME:
      return Object.assign({}, state, {shortName: action.data});

    case SET_DATE_FILTER:
      return Object.assign({}, state, {filterDate: action.date});

    case SET_STARRED_FILTER:
        return Object.assign({}, state, {filterStarred: action.data});

    case SET_ALL_FILTER:
      return Object.assign({}, state, {filterType: 0, filterTalkgroups:[], filterGroupId: false});

    case SET_GROUP_FILTER:
      return Object.assign({}, state, {filterType: 1, filterTalkgroups:[], filterGroupId: action.groupId});

    case SET_TALKGROUP_FILTER:
      return Object.assign({}, state, {filterType: 2, filterTalkgroups: action.talkgroups, filterGroupId: false});

    case FETCH_CALL_INFO:
    case FETCH_CALL:
      return Object.assign({}, state, { isWaiting: true});

    case FETCH_SUCCESS_CALL_INFO:
      return Object.assign({}, state, {
        byId:  {...state.byId, [action.data._id]: action.data },
        isWaiting: false

      });

    case ADD_STAR_SUCCESS:
      return Object.assign({}, state,{
        byId:  {...state.byId, [action.data._id]: action.data },
        isWaiting: false

      });
  // This will set the items to the rx data
  case FETCH_SUCCESS_CALL:
  {
      const byId = action.data.calls.reduce((acc, call) => ({ ...acc, [call._id]: call }), {});
      const allIds =  action.data.calls.map(call => call._id);
      return Object.assign({}, state, {
          isWaiting: false,
          shortName: action.data.shortName,
          newestCallTime: new Date(action.data.calls[0].time),
          oldestCallTime: new Date(action.data.calls[action.data.calls.length-1].time),
          byId:  { ...byId},
          allIds: [...allIds]
        });
    }

  case UPSERT_CALL:
    if (typeof state.byId[action.data._id] !== "undefined") {
      return Object.assign({}, state, {
        byId:  {...state.byId, [action.data._id]: action.data },
      });
    } else {
      return Object.assign({}, state, {
        newestCallTime: new Date(action.data.time),
        byId:  {[action.data._id]: action.data, ...state.byId},
        allIds: [action.data._id, ...state.allIds]
      }); 
    }

  case PREPEND_CALL:
  return Object.assign({}, state, {
      isWaiting: false,
      newestCallTime: new Date(action.data.time),
      byId:  {[action.data._id]: action.data, ...state.byId},
      allIds: [action.data._id, ...state.allIds]
    });

// This will add the array of Calls in the data to the beginning of the existing array of Calls
    case FETCH_SUCCESS_NEWER_CALL:
    const byId = action.data.calls.reduce((acc, call) => ({ ...acc, [call._id]: call }), {});
    const allIds =  action.data.calls.map(call => call._id).reverse();
    return Object.assign({}, state, {
        isWaiting: false,
        shortName: action.data.shortName,
        newestCallTime: new Date(action.data.calls[action.data.calls.length-1].time),
        byId:  {...state.byId, ...byId},
        allIds: [...allIds, ...state.allIds]
      });

// This will add the array of Calls in the data to the end of the existing array of Calls
    case FETCH_SUCCESS_OLDER_CALL:
    {
    const byId = action.data.calls.reduce((acc, call) => ({ ...acc, [call._id]: call }), {});
    const allIds =  action.data.calls.map(call => call._id);
    return Object.assign({}, state, {
        isWaiting: false,
        shortName: action.data.shortName,
        oldestCallTime: new Date(action.data.calls[action.data.calls.length-1].time),
        byId:  {...state.byId, ...byId},
        allIds: [ ...state.allIds, ...allIds]
      });
    }
    case FETCH_ERROR_CALL_INFO:
    case FETCH_ERROR_CALL:
      return Object.assign({}, state, {
        isWaiting: false
      });

    default:
      return state;
  }
};

export default call;
