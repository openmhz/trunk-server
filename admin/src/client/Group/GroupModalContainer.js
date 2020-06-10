import { connect } from "react-redux"
import * as groupActionCreators from "./group-actions"
import * as talkgroupActionCreators from "../Talkgroups/talkgroup-actions"
import { bindActionCreators } from 'redux'
import GroupModal from "./GroupModal"

//groups: state.group.items[props.match.params.shortName],
function mapStateToProps(state,props) {
  return {
    talkgroups: state.talkgroup.items[props.shortName],
    groups: state.group.items[props.shortName],
    shortName: props.shortName
	}
}

function mapDispatchToProps(dispatch) {
  return {
    groupActions: bindActionCreators(groupActionCreators,dispatch),
    talkgroupActions: bindActionCreators(talkgroupActionCreators, dispatch)
  }
}

export default connect(
	mapStateToProps,
	mapDispatchToProps
)(GroupModal)
