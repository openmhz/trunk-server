## Elements Used
- Create React App
- Redux
- [Redux Thunk](https://github.com/reduxjs/redux-thunk): lets you do AJAX calls 
- [connected-react-router](https://github.com/supasate/connected-react-router): Synchronize router state with redux store through uni-directional flow (i.e. history -> store -> router -> components). Basically, if you go back the redux store will update... I think
- [axios](https://github.com/axios/axios) - library for doing HTTP requests
- [@artsy/fresnel](https://github.com/artsy/fresnel) - Handles media requests for responsive designs and works server side too. https://github.com/Semantic-Org/Semantic-UI-React/pull/4008. Used for the Main page to make it responsive.
- [React Date Picker](https://github.com/Hacker0x01/react-datepicker) - the popup calendar that lets you pick a date. Used in the calendar Modal.
- [React Audio Player](https://github.com/justinmc/react-audio-player) - This is a light React wrapper around the HTML5 audio tag. It provides the ability to manipulate the player and listen to events through a nice React interface
- [date-fns](https://date-fns.org) - date-fns provides the most comprehensive, yet simple and consistent toolset for manipulating JavaScript dates in a browser & Node.js. Used in the calendar modal to figure out how far apart days are.
- [react-waypoint](https://github.com/civiccc/react-waypoint) - A React component to execute a function whenever you scroll to an element. Works in all containers that can scroll, including the window. Used to help scroll the list of calls.
- [Semantic UI](https://react.semantic-ui.com/usage) - The UI frontend
- [react-router-dom](https://reactrouter.com/web/guides/quick-start) - Adds routes to React
## Environment Variables
CRA lets you sub in env variables into both HTML and JS: https://create-react-app.dev/docs/adding-custom-environment-variables/