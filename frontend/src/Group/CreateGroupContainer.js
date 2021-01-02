import { connect } from "react-redux"
import * as groupActionCreators from "./group-actions"
import * as talkgroupActionCreators from "../Talkgroups/talkgroup-actions"
import { bindActionCreators } from 'redux'
import CreateGroup from "./CreateGroup"

//groups: state.group.items[props.match.params.shortName],
function mapStateToProps(state,props) {
  return {
    talkgroups: state.talkgroup.items[props.match.params.shortName],
    shortName: props.match.params.shortName
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
)(CreateGroup)
