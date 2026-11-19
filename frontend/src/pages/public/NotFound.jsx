import { Link } from 'react-router-dom';
export default function NotFound() {
  return (
    <div className="container-x section text-center">
      <p className="text-6xl font-bold text-royal">404</p>
      <h1 className="mt-2">Page not found</h1>
      <p className="mt-2 text-muted">The page you are looking for does not exist or has been moved.</p>
      <Link to="/" className="btn-primary mt-6 no-underline">Back to home</Link>
    </div>
  );
}
