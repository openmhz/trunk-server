import { connect } from "react-redux"
import * as userActions from "./user-actions"
import Register from "./Register"

const mapStateToProps = (state) => {
	return {
		isWaiting: state.user.isWaiting
	}
}

export default connect(
	mapStateToProps,
	userActions
)(Register)
