import { connect } from "react-redux"
import ResetPassword from "./ResetPassword"
import * as userActions from "./user-actions"

const mapStateToProps = (state) => {
	return {
		user: state.user
	}
}

export default connect(
	mapStateToProps,
	userActions
)(ResetPassword)
