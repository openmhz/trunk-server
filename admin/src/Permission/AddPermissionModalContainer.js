import { connect } from "react-redux"
import * as permissionActionCreators from "./permission-actions"
import { bindActionCreators } from 'redux'
import AddPermissionModal from "./AddPermissionModal"

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
)(AddPermissionModal)
