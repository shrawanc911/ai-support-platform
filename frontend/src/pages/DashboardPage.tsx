export default function DashboardPage(){
    return (
      <div className="page-header">
        <header>
          <div>
            <h1>Support Dashboard</h1>
            <p>Monitor your customer support operations.</p>
          </div>
        </header>
        <section className="stats-grid">
          <div className="stat-card">
            <span>Open Tickets</span>
            <strong>12</strong>
          </div>
          <div className="stat-car">
            <span>In Progress</span>
            <strong>7</strong>
          </div>
          <div className="stat-car">
            <span>Waiting</span>
            <strong>4</strong>
          </div>
          <div className="stat-car">
            <span>Resolved</span>
            <strong>24</strong>
          </div>
        </section>
      </div>
    );
}