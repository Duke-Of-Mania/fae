function Dashboard({ currentUser }) {
  return (
    <section className="panel">
      <h1>FAE Dashboard</h1>

      <p>
        Welcome, {currentUser.username}!
      </p>
    </section>
  );
}

export default Dashboard;
