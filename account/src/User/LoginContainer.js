import { connect } from "react-redux"
import * as userActions from "./user-actions"
import Login from "./Login"
import queryString from '../query-string';


// Function passed in to `connect` to subscribe to Redux store updates.
// Any time it updates, mapStateToProps is called.
// The second argument "ownProps" contains props passed to the component
const mapStateToProps = (state, props) => {

	let nextPathname = false;

	try {nextPathname = props.location.state.nextPathname}
	catch(err) {}
	const uri = queryString.parse(props.location.search);
	let nextLocation = uri['nextLocation'];

	return {

		user: state.user,
		nextPathname, // this prop passed in by React Router
		nextLocation
	}
}



// Connects React component to the redux store
// It does not modify the component class passed to it
// Instead, it returns a new, connected component class, for you to use.
export default connect(
	mapStateToProps,
	userActions
)(Login)
