import { useState } from "react";
import Login from "./Login";
import RecipeForm from "./RecipeForm";
import "./App.css";

function App() {
  const [token, setToken] = useState<string | null>(null);

  return (
    <div style={{ maxWidth: 400, margin: "2rem auto", fontFamily: "sans-serif" }}>
      <h1>Sourdough App</h1>
      {!token ? (
        <Login onLogin={setToken} />
      ) : (
        <div>
          <p>Logged in! (JWT token stored)</p>
          <RecipeForm token={token} />
          <button onClick={() => setToken(null)}>Log out</button>
        </div>
      )}
    </div>
  );
}

export default App;
