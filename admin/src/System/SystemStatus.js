import { Label, Icon } from "semantic-ui-react";
import { timeAgo, publicSystemUrl } from "../Components/helpers";

// Shows whether uploads are arriving, plus (optionally) a link to the public page for the system.
const SystemStatus = ({ system, showLink = false }) => {
  let label;
  if (system.active) {
    label = <Label color="green" size="small"><Icon name="circle" />Receiving calls</Label>;
  } else if (system.lastActive) {
    label = <Label size="small"><Icon name="clock outline" />Last call {timeAgo(system.lastActive)}</Label>;
  } else {
    label = <Label size="small"><Icon name="circle outline" />No calls received yet</Label>;
  }
  return (
    <span>
      {label}
      {showLink && (
        <a href={publicSystemUrl(system.shortName)} target="_blank" rel="noopener noreferrer" style={{ marginLeft: "1em" }}>
          View public page <Icon name="external" />
        </a>
      )}
    </span>
  );
};

export default SystemStatus;
