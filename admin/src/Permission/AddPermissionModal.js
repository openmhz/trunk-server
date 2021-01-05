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
class AddPermissionModal extends Component {
  constructor(props) {
    super(props);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleClose = this.handleClose.bind(this);
    this.handleChange = this.handleChange.bind(this);
    // Set initial state
    this.state = {
      role: 5,
      email: "",
      error: ""
    };
  }

  componentDidMount() {

  }

  componentWillReceiveProps(nextProps) {

  }

  handleInputChange = (e, { name, value }) => this.setState({ [name]: value });
  handleChange = (e, { newRole }) => this.setState({ newRole })




  handleClose = () => {
    this.setState({
      error: ""
    });
    this.props.onClose(false);
  }
  handleSubmit() {
    //if (this.props.updatePermissionId) {
      const data = {email: this.state.email, shortName: this.props.shortName, role: this.state.role }

      this.props.permissionActions.addPermission(data).then(requestMessage => {
        if (requestMessage) {
          // report to the user is there was a problem during registration
          this.setState({
            error: requestMessage
          });
          //this.props.onClose(false);
        } else {
          this.setState({
            error: ""
          });
          this.props.onClose(true);
        }
      });


    //}
  }

  render() {

    const railStyle = {
      top: "15px",
      minHeight: "200px"
    };
    var errorMessage = "";

    if (this.state.error) {
      errorMessage = (
      <Message negative>
        <Message.Header>That didn't work...</Message.Header>
        <p>{this.state.error}</p>
      </Message>
      )
    }

    return (
      <Modal size='tiny' open={this.props.open} onClose={this.handleClose} centered={false}>
        <Modal.Header>Select Role</Modal.Header>
        <Modal.Content >
          <Modal.Description>
          <Form>
       <Form.Field>
         Add User Access to System: {this.props.shortName}
       </Form.Field>
       <Form.Field>
         <Input label="User's email" placeholder='user@domain.com' name='email' onChange={this.handleInputChange} />
       </Form.Field>
       <Form.Field>
         <Checkbox
           radio
           label='User'
           name='role'
           value={5}
           checked={(this.state.role >= 0) && (this.state.role < 10)}
           onChange={this.handleInputChange}
         />
       </Form.Field>
       <Form.Field>
         <Checkbox
           radio
           label='Admin'
           name='role'
           value={15}
           checked={(this.state.role >= 10) && (this.state.role < 20)}
           onChange={this.handleInputChange}
         />
       </Form.Field>
     </Form>
     {errorMessage}
    </Modal.Description>
  </Modal.Content>
  <Modal.Actions>
    <Button onClick={this.handleClose} >
      <Icon name='remove' /> Cancel
    </Button>
    <Button onClick={this.handleSubmit} >
      <Icon name='plus' /> Add
    </Button>
  </Modal.Actions>
</Modal>

    );
  }
}

export default AddPermissionModal;
