import { useEffect } from "react";
import { useHistory } from "react-router-dom";

export default function LandingPage() {
  const history = useHistory();

  useEffect(() => {
    history.replace("/login");
  }, [history]);

  return null;
}