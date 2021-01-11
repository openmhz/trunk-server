import { connect } from "react-redux"
import SendResetPassword from "./SendResetPassword"
import * as userActions from "./user-actions"

const mapStateToProps = (state) => {
	return {
		user: state.user
	}
}

export default connect(
	mapStateToProps,
	userActions
)(SendResetPassword)
