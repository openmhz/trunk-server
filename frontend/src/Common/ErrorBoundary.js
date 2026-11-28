import React from "react";

// Catches render errors anywhere below it, so a crash shows a message instead of a blank page.
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("Unhandled render error:", error, info && info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div style={{ padding: "4em 1em", textAlign: "center" }}>
        <h2>Something went wrong</h2>
        <p>
          <a href="/" onClick={(e) => { e.preventDefault(); window.location.reload(); }}>Reload</a>
        </p>
      </div>
    );
  }
}

export default ErrorBoundary;
