import React, { Component } from "react";
import {
  Container,
  Dimmer,
  Loader,
  Button,
  Message,
  Icon
} from "semantic-ui-react";
import { Link } from "react-router-dom";

class ConfirmEmail extends Component {

  state = {
    loading: true,
    confirmMessage: { success: false, message:""}
  };
  componentDidMount() {
    const { match: { params } } = this.props;

    this.props
      .confirmEmail(params.userId, params.token)
      .then(confirmMessage => {
        if (confirmMessage) {
          // report to the user is there was a problem during login
          this.setState({
            confirmMessage: confirmMessage, loading: false
          });
        }
      });
  }

  render() {
    var dimmerProps = {  };
    if (this.state.loading) {
      dimmerProps["active"] = true;
    }
    return (

      <Container text>
      <Dimmer {...dimmerProps}>
            <Loader indeterminate>Confirming Email Address</Loader>
          </Dimmer>
        
          
        {this.state.confirmMessage.success ? (
          <Message icon>
          
       <Icon name='check'/>
       <Message.Content>
         <Message.Header>Success</Message.Header>
           <p>You have successfully confirmed you email address.</p>
             <Link to="/">
              <Button
                  size="large"
                  content="Continue to Login"
                  fluid
                /></Link>

       </Message.Content>
       </Message>
        ) : (
          <Message icon>
          <Icon name='exclamation'/>
          <Message.Content>
            <Message.Header>Error</Message.Header>
            <p>{this.state.confirmMessage.message}</p>
          </Message.Content>
          
          </Message>
        )}
      
     </Container>
    );
  }
}

export default ConfirmEmail;
