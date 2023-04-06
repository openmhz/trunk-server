import React, { useState } from "react";
import { Segment, Container, Button } from "semantic-ui-react";

const Terms = ({ user, acceptTerms }) => {
  const [requestMessage, setRequestMessage] = useState(null);

  const handleAccept = () => {
    acceptTerms(user.userId).then((requestMessage) => {
      if (requestMessage) {
        setRequestMessage(requestMessage);
      }
    });
  };

  const handleDecline = () => {};

  return (
    <div>
      <Container text>
        <Segment attached>
          The agreement is useful to The Guardian to set the rules and guidelines for visitors, users and customers:

          Registration: inform users that they must agree to a set of rules when they register on your website or mobile app
          Disable or terminate accounts: inform users that their accounts can be disabled or terminated if abuses happen on your website or mobile app, e.g. spamming, swearing etc.
          Owner of content: notify users that you, the company, is the owner of the content appearing on your website or mobile app – except in cases where other users can post content (upload, share, create etc.) where the users are the owners of such content
          Changes to the agreement: users should be informed about upcoming changes to the agreement before the changes are applied.
          DMCA: The Guardian is also informing owners of copyright content that they can submit a DMCA notice to the website if they found infringing content in their DMCA clause.
          And more
          These are only a few examples of what kind of clauses and disclosures you can add in this kind of agreement.

          What is a Terms of Use
          While a Terms of Use is recommended to have, it’s not mandatory by law as the Privacy Policy agreement is required.

          This agreement serves a single purpose: to inform users of rules that they must agree to. A Privacy Policy must inform users about your privacy practices (what data you collect, why, how, etc.)

          The definition of a Terms of Use agreement is simple:

          Terms of service (also known as terms of use and terms and conditions, commonly abbreviated as ToS or TOS and TOU) are rules which one must agree to abide by in order to use a service.

          Wikipedia
          Because this agreement simply acts as a contract between you, the company, and the users using or accessing your website or mobile app, the agreement can be named as you’d like:

          Terms of Use (ToU)
          Terms of Service (ToS)
          Terms and Conditions (T&amp;C)
          User Agreement
          Conditions of Use
          And so on
          The “Conditions of Use” of Amazon could be named “Terms of Use”:
        </Segment>
        <Button.Group attached="bottom">
          <Button onClick={handleDecline}>Decline</Button>
          <Button.Or />
          <Button positive onClick={handleAccept}>
            Accept
          </Button>
        </Button.Group>
      </Container>
    </div>
  );
};

export default Terms;
