import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { useWebSocket } from '../hooks/useWebSocket';

const DashboardLayout = () => {
  // Initialize WebSocket connection at the layout level
  // so it runs once and feeds data into Zustand stores globally
  useWebSocket();

  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">
        <Navbar />
        <Outlet />
      </main>
    </div>
  );
};

export default DashboardLayout;
