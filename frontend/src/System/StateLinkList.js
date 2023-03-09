import {

    List,

} from "semantic-ui-react";

const StateLinkList = (states) => {
    let stateList = [];
    if (states) {
        let keys = Object.keys(states);
        keys.sort();


        for (var i = 0; i < keys.length; ++i) {
            const state = keys[i];
            stateList.push((

                <List.Item key={"short-"+state}>
                    <List.Content>
                        <List.Header><a href={"#" + state}>{state}</a></List.Header>
                    </List.Content>
                </List.Item>

            ))
        }
    }
    return stateList;
}

export default StateLinkList