import { connect } from "react-redux"
import * as systemActions from "./system-actions"
import CreateSystem from "./CreateSystem"

function mapStateToProps(state) {
  return {
    user: state.user
  }
}

export default connect(
	mapStateToProps,
	systemActions
)(CreateSystem)
