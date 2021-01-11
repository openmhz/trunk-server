import { connect } from "react-redux"
import Profile from "./Profile"
import * as userActions from "./user-actions"

const mapStateToProps = (state) => {
	return {
		user: state.user,
		isWaiting: state.user.isWaiting
	}
}

export default connect(
	mapStateToProps,
	userActions
)(Profile)
