import { connect } from "react-redux"
import * as permissionActionCreators from "./permission-actions"
import { bindActionCreators } from 'redux'
import UpdatePermissionModal from "./UpdatePermissionModal"

//groups: state.group.items[props.match.params.shortName],
function mapStateToProps(state,props) {
  return {
    permissions: state.permission.items,
    shortName: props.shortName
	}
}

function mapDispatchToProps(dispatch) {
  return {
    permissionActions: bindActionCreators(permissionActionCreators,dispatch)
  }
}

export default connect(
	mapStateToProps,
	mapDispatchToProps
)(UpdatePermissionModal)
