import { connect } from "react-redux"
import ConfirmEmail from "./ConfirmEmail"
import * as userActions from "./user-actions"

const mapStateToProps = (state) => {
	return {
		user: state.user
	}
}

export default connect(
	mapStateToProps,
	userActions
)(ConfirmEmail)
