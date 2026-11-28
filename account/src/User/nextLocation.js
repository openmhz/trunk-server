// Sends the person on to where they were headed after login / accepting terms.
// The frontend and admin apps live on other origins, so they need a real
// page load; "account" stays inside this app.
export const goToNextLocation = (nextLocation, navigate, fallback = "admin") => {
  const target = nextLocation || fallback;
  switch (target) {
    case "frontend":
      window.location.href = process.env.REACT_APP_FRONTEND_SERVER;
      break;
    case "account":
      navigate("/");
      break;
    case "admin":
    default:
      window.location.href = process.env.REACT_APP_ADMIN_SERVER;
      break;
  }
};
