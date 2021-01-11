import { connect } from "react-redux"
import * as userActions from "./user-actions"
import Terms from "./Terms"

function mapStateToProps(state) {
  return {
    user: state.user
  }
}

export default connect(
	mapStateToProps,
	userActions
)(Terms)
