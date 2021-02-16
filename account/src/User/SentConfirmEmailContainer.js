import { connect } from "react-redux"
import SentConfirmEmail from "./SentConfirmEmail"
import * as userActions from "./user-actions"

const mapStateToProps = (state) => {
	return {
		user: state.user
	}
}

export default connect(
	mapStateToProps,
	userActions
)(SentConfirmEmail)
