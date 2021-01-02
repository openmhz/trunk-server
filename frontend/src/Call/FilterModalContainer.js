import { connect } from "react-redux"
import * as talkgroupActionCreators from "../Talkgroups/talkgroup-actions"
import * as groupActionCreators from "../Group/group-actions"
import * as callActionCreators from "./call-actions"
import { bindActionCreators } from 'redux'
import FilterModal from "./FilterModal"

function mapStateToProps(state, props) {
  return {
    groups: state.group.items[props.shortName],
    talkgroups: state.talkgroup.items[props.shortName],
    talkgroupsIsWaiting: state.talkgroup.isWaiting,
    groupsIsWaiting: state.group.isWaiting,
    shortName: props.shortName,
    activeTab: state.call.filterType,
    selectedTalkgroups: state.call.filterTalkgroups,
    selectedGroup: state.call.filterGroupId,
    filterStarred: state.call.filterStarred
	}
}

function mapDispatchToProps(dispatch) {
  return {
    groupActions: bindActionCreators(groupActionCreators, dispatch),
    talkgroupActions: bindActionCreators(talkgroupActionCreators, dispatch),
    callActions: bindActionCreators(callActionCreators, dispatch)
  }
}


export default connect(
	mapStateToProps,
	mapDispatchToProps
)(FilterModal)
