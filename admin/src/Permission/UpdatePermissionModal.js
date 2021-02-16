import React, { Component } from "react";
import ReactDOM from "react-dom";
import {
  Container,
  Checkbox,
  Header,
  Form,
  Grid,
  Modal,
  Rail,
  Segment,
  List,
  Input,
  Button,
  Message,
  Icon,
  Table
} from "semantic-ui-react";

// ----------------------------------------------------
const requestMessageStyle = {
  color: "red"
};

// ----------------------------------------------------
class UpdatePermissionModal extends Component {
  constructor(props) {
    super(props);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleClose = this.handleClose.bind(this);
    this.handleChange = this.handleChange.bind(this);
    // Set initial state
    this.state = {
      newRole: false,
      permission: false
    };
  }

  componentDidMount() {

  }

  componentWillReceiveProps(nextProps) {

    if (nextProps.permissions && nextProps.updatePermissionId) {
      var updatePermission = nextProps.permissions.find(permission=> permission._id === nextProps.updatePermissionId);

      if (updatePermission) {
        this.setState({permission: updatePermission, newRole: updatePermission.role});
      }
    }
  }

  handleChange = (e, { name, value }) => this.setState({ newRole: value })




  handleClose = () => this.props.onClose(false);
  handleSubmit() {
    if (this.props.updatePermissionId) {
      const data = {permissionId: this.props.updatePermissionId, shortName: this.props.shortName, role: this.state.newRole }

      this.props.permissionActions.update(data).then(requestMessage => {
        if (requestMessage) {
          // report to the user is there was a problem during registration
          this.setState({
            requestMessage
          });
          this.props.onClose(false);
        } else {
          this.props.onClose(true);
        }
      });


    }
  }

  render() {

    const railStyle = {
      top: "15px",
      minHeight: "200px"
    };
    var user = ""
    if (this.state.permission) {
      user = this.state.permission.email
    }
    return (
      <Modal size='tiny' open={this.props.open} onClose={this.handleClose} centered={false}>
        <Modal.Header>Select Role</Modal.Header>
        <Modal.Content >
          <Modal.Description>
          <Form>
       <Form.Field>
         Set role for <b>{user}</b>:
       </Form.Field>
       <Form.Field>
         <Checkbox
           radio
           label='User'
           name='checkboxRadioGroup'
           value={5}
           checked={(this.state.newRole >= 0) && (this.state.newRole < 10)}
           onChange={this.handleChange}
         />
       </Form.Field>
       <Form.Field>
         <Checkbox
           radio
           label='Admin'
           name='checkboxRadioGroup'
           value={15}
           checked={(this.state.newRole >= 10) && (this.state.newRole < 20)}
           onChange={this.handleChange}
         />
       </Form.Field>
     </Form>

    </Modal.Description>
  </Modal.Content>
  <Modal.Actions>
    <Button onClick={this.handleSubmit} >
      <Icon name='checkmark' /> Update
    </Button>
  </Modal.Actions>
</Modal>

    );
  }
}

export default UpdatePermissionModal;
