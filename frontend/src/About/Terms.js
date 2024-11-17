import React from "react";
import { Link } from 'react-router-dom'
import { Segment, Container,Header,  Menu, Icon } from "semantic-ui-react";


const Terms = () => {
  return (
    <div>
      <Container text>
      <Menu fixed="top">
        <Link to="/"><Menu.Item link><Icon name='arrow left' /> Home</Menu.Item></Link>
        <Link to="/events"><Menu.Item link>Events</Menu.Item></Link>
        <Link to="/systems"><Menu.Item link>Listen</Menu.Item></Link>
        <Link to="/terms"><Menu.Item link>Terms of Service</Menu.Item></Link>
      </Menu>
        <Segment attached>
        <Header as='h1'>Terms of Service</Header>
<em>Last updated: June 28, 2024</em>

<Header as='h2'>Introduction</Header>

Welcome and thank you for using OpenMHz. While it has been written and maintained by one person, the community around OpenMHz is very generous in contributing code and recordings. The goal of the Terms of Service is to help better define the relationship between OpenMHz and the people who use it.

When we say “Company”, "I", "me", “we”, “our”, or “us” in this document, we are referring to Robotastic, which is a Sole Proprietorship based in Washington, DC.

When we say “Services”, we mean any product created and maintained by Robotastic. That includes the OpenMHz.com website, content, API, and podcast, whether delivered within a web browser, desktop application, mobile application, or another format.

When we say “You” or “your”, we are referring to the people or organizations that own an account with one or more of our Services.

We may update these Terms of Service ("Terms") in the future. You can track all changes made since mid-2024 on GitHub. Typically these changes have been to clarify some of these terms by linking to an expanded related policy. Whenever we make a significant change to our policies, we will refresh the date at the top of this page and take any other appropriate steps to notify account holders.

When you use our Services, now or in the future, you are agreeing to the latest Terms. There may be times where we do not exercise or enforce a right or provision of the Terms; however, that does not mean we are waiving that right or provision. These Terms do contain a limitation of our liability.

If you violate any of the Terms, we may terminate your account. That’s a broad statement and it means you need to place a lot of trust in us.

<Header as='h2'>1. Use of Services</Header>

OpenMHz provides access to live and archived audio from public safety radio systems, as well as associated metadata and statistics ("Content"). You may access this content through the web interface and iOS app. Additionally, you may contribute Content to OpenMHz using our API.

<Header as='h2'>2. Contributing Content</Header>

By contributing Content to OpenMHz, you grant OpenMHz a perpetual, irrevocable, worldwide, royalty-free license to distribute, sublicense, and otherwise make the Content available to others.

<Header as='h2'>3. Reuse of Content</Header>

You may reuse Content obtained from the OpenMHz website and app, subject to the following conditions:
- Credit is given to OpenMHz, if it is feasible for the type of distribution medium and it doesn't make things look ugly for You.
- The Content is not provided en masse to others via scraping or other means.
- The Content is not used to misrepresent a situation or for any unlawful purpose.
- The Content is hosted by You and does not make use of OpenMHz's infrastructure. Linking to the OpenMHz website is acceptable, linking directly to the audio files is not.

<Header as='h2'>4. No Resale of Services</Header>

You agree not to sell, resell, or offer for any commercial purposes, any portion of OpenMHz. This includes the wrapping of the OpenMHz website as a mobile or desktop app.

<Header as='h2'>5. API Access</Header>

The OpenMHz API is designed solely to support the OpenMHz website frontend and iOS app. You may not use the API for any other purpose without explicit permission from OpenMHz. The infrastructure for OpenMHz has not been well designed, and unauthorized use may result in the whole thing crashing. Additionally, some API calls may place a significant load on the server, and preplanning is required to avoid this. We will allow for API access on a case-by-case basis. Please contact us at: luke@robotastic.com

<Header as='h2'>6. Legal Compliance</Header>

Contributors are solely responsible for ensuring that the contributed Content provided to OpenMHz complies with all applicable laws and regulations. OpenMHz is not liable for any Content that violates legal statutes.

<Header as='h2'>7. Right to Remove Content</Header>

OpenMHz reserves the right to remove any recordings from our Services at our discretion, for any reason, without prior notice.

<Header as='h2'>8. No Guarantees</Header>

OpenMHz does not guarantee that our Services will be available at all times or that they will function without interruption or errors. We provide our Services “as is” and “as available,” without any warranties of any kind, either express or implied. While we strive to provide accurate information, we do not guarantee that the Content on our Services is complete, accurate, or up-to-date. There is a good chance that at some point in time I will mess up and accidentally delete the database for the website and associated recordings. You should not assume that contributed Content will be reliably maintained.

<Header as='h2'>9. Limitation of Liability</Header>

To the fullest extent permitted by law, OpenMHz shall not be liable for any direct, indirect, incidental, special, consequential, or punitive damages arising out of your use of, or inability to use, our Services.

<Header as='h2'>10. Amendments</Header>

OpenMHz reserves the right to amend these Terms at any time. Your continued use of our Services following any changes indicates your acceptance of the new Terms.

<Header as='h2'>11. OpenMHz Intellectual Property</Header>

All intellectual property rights in the Services, including trademarks, logos, and any content created by OpenMHz, are owned by Robotastic. You may use the OpenMHz name to describe where content was obtained from. Do not you use the OpenMHz name in a way that implies endorsement or affiliation with OpenMHz. Do not call your App OpenMHz.

<Header as='h2'>12. Indemnification</Header>

You agree to indemnify, defend, and hold harmless OpenMHz, its officers, directors, employees, and agents from and against any claims, liabilities, damages, losses, and expenses, including reasonable attorney’s fees, arising out of or in any way connected with your access to or use of the Services or your violation of these Terms.

<Header as='h2'>13. Be Nice</Header>

The Services are provided as a labor of love by a single individual. I have a limited amount of time to work on the Services and funding to support the infrastructure. Please keep this in mind as you use the Services and act respectfully.

<Header as='h2'>14. Contact Me</Header>

If you have any questions or concerns about these Terms, please contact me at luke@robotastic.com.

By using OpenMHz, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service. Thank you for using our Services!

These Terms were written to help set expectations around usage. If you think something is missing or could be better stated, please reach out.
        </Segment>
      </Container>
    </div>
  );
};

export default Terms;
