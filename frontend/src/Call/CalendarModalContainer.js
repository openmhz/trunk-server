import { connect } from "react-redux"
import * as callActionCreators from "./call-actions"
import { bindActionCreators } from 'redux'
import CalendarModal from "./CalendarModal"

function mapStateToProps(state, props) {
  return {
    groups: state.group.items[props.shortName],
    talkgroups: state.talkgroup.items[props.shortName],
    talkgroupsIsWaiting: state.talkgroup.isWaiting,
    groupsIsWaiting: state.group.isWaiting,
    shortName: props.shortName,
    activeTab: state.call.filterType,
    selectedTalkgroups: state.call.filterTalkgroups
	}
}

function mapDispatchToProps(dispatch) {
  return {
    callActions: bindActionCreators(callActionCreators, dispatch)
  }
}


export default connect(
	mapStateToProps,
	mapDispatchToProps
)(CalendarModal)
