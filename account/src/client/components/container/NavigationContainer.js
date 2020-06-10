import { connect } from "react-redux"
import * as userActions from "../../User/user-actions"
import Navigation from "../pure/Navigation"


// Function passed in to `connect` to subscribe to Redux store updates.
// Any time it updates, mapStateToProps is called.
const mapStateToProps = (state) => {
	return {
		user: state.user
	}

}

// Connects React component to the redux store
// It does not modify the component class passed to it
// Instead, it returns a new, connected component class, for you to use.
export default connect(
	mapStateToProps,
	userActions
)(Navigation)
