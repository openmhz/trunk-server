import React, { useState } from "react";
import { Button, Confirm, Container, Form, Header, Icon, List, Message, Segment, TextArea } from "semantic-ui-react";
import { useRegenerateKeyMutation } from "../features/api/apiSlice";
import { getErrorMessage, uploadConfigExample, TRUNK_RECORDER_URL } from "../Components/helpers";
import SystemStatus from "./SystemStatus";

const CopyButton = ({ text, label = "Copy" }) => {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      setCopied(false);
    }
  };
  return (
    <Button size="mini" icon labelPosition="left" onClick={copy} type="button">
      <Icon name={copied ? "check" : "copy"} />
      {copied ? "Copied" : label}
    </Button>
  );
};

const GetStarted = ({ system, isNew }) => {
  const [regenerateKey, { isLoading }] = useRegenerateKeyMutation();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState("");
  const [newKey, setNewKey] = useState(false);
  const example = uploadConfigExample(system);

  const handleRegenerate = async () => {
    setConfirmOpen(false);
    setError("");
    try {
      await regenerateKey(system.shortName).unwrap();
      setNewKey(true);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <Container text>
      {isNew && (
        <Message positive icon="check circle" header="Your system has been created"
          content="Follow the steps below to start sending calls." />
      )}
      <Header as="h2">Get started</Header>
      <p><SystemStatus system={system} showLink /></p>

      <Segment.Group>
        <Segment>
          <Header size="small">Short Name</Header>
          <code>{system.shortName}</code> <CopyButton text={system.shortName} />
        </Segment>
        <Segment>
          <Header size="small">API Key</Header>
          <code>{system.key}</code> <CopyButton text={system.key} />
          <div style={{ marginTop: "0.5em" }}>
            <Button size="mini" color="orange" onClick={() => setConfirmOpen(true)} loading={isLoading} disabled={isLoading}>
              Regenerate key
            </Button>
          </div>
          {newKey && <Message positive size="small" content="A new key has been generated. Update your recorder's config with it." />}
          {error && <Message negative size="small" content={error} />}
        </Segment>
        <Segment>
          <Header size="small">Upload Server</Header>
          <code>{process.env.REACT_APP_BACKEND_SERVER}</code> <CopyButton text={process.env.REACT_APP_BACKEND_SERVER || ""} />
        </Segment>
        <Segment>
          <Header size="small">Trunk Recorder config.json</Header>
          <p>Add these to your Trunk Recorder <code>config.json</code>: the system entry goes in the <code>systems</code> list and <code>uploadServer</code> sits at the top level.</p>
          <Form>
            <TextArea rows="10" readOnly="readOnly" value={example} />
          </Form>
          <div style={{ marginTop: "0.5em" }}><CopyButton text={example} label="Copy config" /></div>
        </Segment>
      </Segment.Group>

      <Header as="h3">Next steps</Header>
      <List ordered>
        <List.Item>Paste the snippet above into your Trunk Recorder <code>config.json</code>. The <code>shortName</code> in the <code>systems</code> entry must match exactly.</List.Item>
        <List.Item>Start Trunk Recorder. Calls will appear on your public page as they are recorded.</List.Item>
        <List.Item>Open the Talkgroups tab and import your talkgroups CSV (the same one Trunk Recorder uses) so calls get names.</List.Item>
      </List>
      <p>
        Need help? See the <a href={TRUNK_RECORDER_URL} target="_blank" rel="noopener noreferrer">Trunk Recorder documentation</a>.
      </p>

      <Confirm
        open={confirmOpen}
        header="Regenerate API key?"
        content="Your recorder will stop uploading until you update its config with the new key. The old key may keep working for up to a minute."
        confirmButton="Regenerate"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleRegenerate}
      />
    </Container>
  );
};

export default GetStarted;
