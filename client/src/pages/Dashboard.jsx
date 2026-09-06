function Dashboard({ currentUser }) {
  return (
    <main>
      <h1>FAE Dashboard</h1>

      <p>
        Welcome, {currentUser.username}!
      </p>
    </main>
  );
}

export default Dashboard;