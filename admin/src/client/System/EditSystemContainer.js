import { connect } from "react-redux"
import EditSystem from "./EditSystem"
import * as systemActions from "./system-actions"



const mapStateToProps = (state, props) => {

	return {
		system: state.system.items.find((item) =>  item.shortName === props.match.params.shortName),
		user: state.user
	}
}

export default connect(
	mapStateToProps,
	systemActions
)(EditSystem)
