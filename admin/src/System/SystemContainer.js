import { connect } from "react-redux"
import * as systemActionCreators from "./system-actions"
import * as talkgroupActionCreators from "../Talkgroups/talkgroup-actions"
import * as groupActionCreators from "../Group/group-actions"
import * as permissionActionCreators from "../Permission/permission-actions"
import * as errorActionCreators from "./error-actions"
import { bindActionCreators } from 'redux'
import System from "./System"

function mapStateToProps(state,props) {
  return {
    system: state.system.items.find((item) =>  item.shortName === props.match.params.shortName),
    permissions: state.permission.items,
    statistic: state.statistic[props.match.params.shortName],
    systemIsWaiting: state.system.isWaiting,
    talkgroupsIsWaiting: state.talkgroup.isWaiting,
    groupsIsWaiting: state.group.isWaiting,
    talkgroups: state.talkgroup.items[props.match.params.shortName],
    orderChange: state.group.orderChange,
    groups: state.group.items[props.match.params.shortName],
    errors: state.error.items[props.match.params.shortName],
    shortName: props.match.params.shortName,
    activeTab: (props.match.params.tab ? props.match.params.tab : 0)
	}
}

function mapDispatchToProps(dispatch) {
  return {
    groupActions: bindActionCreators(groupActionCreators, dispatch),
    systemActions: bindActionCreators(systemActionCreators, dispatch),
    talkgroupActions: bindActionCreators(talkgroupActionCreators, dispatch),
    errorActions: bindActionCreators(errorActionCreators, dispatch),
    permissionActions: bindActionCreators(permissionActionCreators, dispatch)
  }
}

export default connect(
	mapStateToProps,
	mapDispatchToProps
)(System)
