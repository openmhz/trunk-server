import { connect } from "react-redux"
import * as groupActionCreators from "../Group/group-actions"
import * as callActionCreators from "./call-actions"
import { bindActionCreators } from 'redux'
import GroupModal from "./GroupModal"

function mapStateToProps(state, props) {
  return {
    groups: state.group.items[props.shortName],
    groupsIsWaiting: state.group.isWaiting,
    shortName: props.shortName,
    selectedGroup: state.call.filterGroupId
	}
}

function mapDispatchToProps(dispatch) {
  return {
    groupActions: bindActionCreators(groupActionCreators, dispatch),
    callActions: bindActionCreators(callActionCreators, dispatch)
  }
}


export default connect(
	mapStateToProps,
	mapDispatchToProps
)(GroupModal)
