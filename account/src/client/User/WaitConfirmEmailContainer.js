import { connect } from "react-redux"
import WaitConfirmEmail from "./WaitConfirmEmail"
import * as userActions from "./user-actions"

const mapStateToProps = (state) => {
	return {
		user: state.user
	}
}

export default connect(
	mapStateToProps,
	userActions
)(WaitConfirmEmail)
