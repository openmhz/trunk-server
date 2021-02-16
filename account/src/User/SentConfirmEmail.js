import React, { Component } from "react"
import {
  Container,
  Message,
  Icon
} from "semantic-ui-react";

class SentConfirmEmail extends Component {

  render() {
    return (
      <div>
        <Container text>
          <Message icon>
            <Icon name='envelope outline' />
            <Message.Content>
              <Message.Header>Confirmation email sent!</Message.Header>
              <p>We sent an email to the address you gave us: {this.props.user.email}<br />
         Please click on the link in the email to verify the email address.</p>
            </Message.Content>
          </Message>
        </Container>
      </div>
    )
  }
}

export default SentConfirmEmail
