import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div style={{ textAlign: "center", marginTop: 100 }}>
      <h1>404</h1>
      <p>Page not found</p>
      <Link to="/">Go Home</Link>
    </div>
  );
}
