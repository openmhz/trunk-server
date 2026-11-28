import { useState } from "react";
import { useDispatch } from "react-redux";
import { sendConfirmEmail } from "../features/user/userSlice";

// Shared "resend the confirmation email" logic.
// resend() resolves true when the email was sent; otherwise error holds a
// message that is safe to show to the person.
export const useResendConfirmEmail = () => {
  const dispatch = useDispatch();
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  const resend = async (userId) => {
    setError("");
    if (!userId) {
      setError("We lost track of which account to send to. Please log in again with your email and password and we will send a new email.");
      return false;
    }
    setSending(true);
    try {
      const result = await dispatch(sendConfirmEmail(userId)).unwrap();
      if (result && result.success) {
        return true;
      }
      if (result && result.message === "already confirmed email") {
        setError("This email address is already confirmed. You can log in now.");
      } else if (result && typeof result.message === "string" && result.message) {
        setError(result.message);
      } else {
        setError("We couldn't send the confirmation email. Please try again in a few minutes.");
      }
      return false;
    } catch (e) {
      setError("We couldn't reach the server to send the email. Please check your connection and try again.");
      return false;
    } finally {
      setSending(false);
    }
  };

  return { resend, error, sending };
};
