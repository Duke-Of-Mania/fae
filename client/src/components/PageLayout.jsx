// This component provides the shared visual structure
// used by pages throughout the FAE application.
function PageLayout({ children }) {
  return (
    <div className="page-layout">
      {/* Header contains the application name and navigation. */}
      <header className="site-header">
        <div className="site-logo">
          FAE
        </div>

        {/* Navigation will eventually contain links
            to the major areas of the application. */}
        <nav>
          {/* Login navigation will be added here later. */}
        </nav>
      </header>

      {/* The main content changes depending on which
          page the user is currently viewing. */}
      <main className="page-content">
        {children}
      </main>

      {/* Footer provides a consistent bottom section
          for every page using this layout. */}
      <footer className="site-footer">
        <p>FAE &copy; 2026</p>
      </footer>
    </div>
  );
}

// Export the component so individual pages can
// use the shared layout.
export default PageLayout;