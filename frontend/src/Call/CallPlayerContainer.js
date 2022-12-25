import { connect } from "react-redux"
import * as callActionCreators from "./call-actions"
import * as talkgroupActionCreators from "../Talkgroups/talkgroup-actions"
import * as groupActionCreators from "../Group/group-actions"
import * as systemActionCreators from "../System/system-actions"
import { bindActionCreators } from 'redux'
import CallPlayer from "./CallPlayer"
import {
  useLocation,
  useNavigate,
  useParams
} from "react-router-dom";

// glorious solution here: https://stackoverflow.com/questions/71097375/how-can-i-use-withrouter-in-react-router-v6-for-passing-props
function withRouter(Component) {
  function ComponentWithRouterProp(props) {
    let location = useLocation();
    let navigate = useNavigate();
    let params = useParams();
    return (
      <Component
        {...props}
        router={{ location, navigate, params }}
      />
    );
  }

  return ComponentWithRouterProp;
}

function mapStateToProps(state, props) {
  const  shortName  = props.router.params.shortName;
  return {
		callsById: state.call.byId,
    callsAllIds: state.call.allIds,
    oldestCallTime: state.call.oldestCallTime,
    newestCallTime: state.call.newestCallTime,
    live: state.call.live,
    filterDate: state.call.filterDate,
    filterType: state.call.filterType,
    filterTalkgroups: state.call.filterTalkgroups,
    filterGroupId: state.call.filterGroupId,
    filterStarred: state.call.filterStarred,
    system: state.system.items.find((item) =>  item.shortName === shortName),
    groups: state.group.items[shortName],
    talkgroups: state.talkgroup.items[shortName],
    callsIsWaiting: state.call.isWaiting,
    systemIsWaiting: state.system.isWaiting,
    talkgroupsIsWaiting: state.talkgroup.isWaiting,
    groupsIsWaiting: state.group.isWaiting,
    location: props.router.location,
    shortName: shortName
	}
}

function mapDispatchToProps(dispatch) {
  return {
    groupActions: bindActionCreators(groupActionCreators, dispatch),
    systemActions: bindActionCreators(systemActionCreators, dispatch),
    callActions: bindActionCreators(callActionCreators, dispatch),
    talkgroupActions: bindActionCreators(talkgroupActionCreators, dispatch)
  }
}


export default withRouter(connect(
	mapStateToProps,
	mapDispatchToProps
)(CallPlayer))
