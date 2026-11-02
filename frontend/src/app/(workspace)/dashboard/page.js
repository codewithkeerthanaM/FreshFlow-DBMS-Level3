
"use client";

import { useEffect, useState } from "react";
import {
  dataOf,
  dashboard,
  getList,
  endpoints,
} from "../../../services/api";

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalStock: 0,
    activeAlerts: 0,
    totalWaste: 0,
  });

  const [inventory, setInventory] = useState([]);
  const [alerts, setAlerts] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      try {
        setLoading(true);
        setError("");

        const [dashboardResponse, inventoryResponse, alertsResponse] =
          await Promise.all([
            dashboard(),
            getList(endpoints.inventory),
            getList(endpoints.alerts),
          ]);

        if (!isMounted) return;

        // Dashboard statistics
        const dashboardData = dataOf(dashboardResponse);
        const statistics = dashboardData.stats || dashboardData;

        setStats({
          totalProducts: statistics.totalProducts ?? 0,
          totalStock: statistics.totalStock ?? 0,
          activeAlerts: statistics.activeAlerts ?? 0,
          totalWaste: statistics.totalWaste ?? 0,
        });

        // Inventory data
        const inventoryData = dataOf(inventoryResponse);

        setInventory(
          Array.isArray(inventoryData) ? inventoryData : []
        );

        // Alerts data
        const alertData = dataOf(alertsResponse);

        setAlerts(
          Array.isArray(alertData) ? alertData : []
        );
      } catch (err) {
        if (!isMounted) return;

        setError(
          err.response?.data?.message ||
          err.message ||
          "Unable to load dashboard data."
        );
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="stack">

      {/* Page heading */}
      <div>
        <h1>Dashboard Overview</h1>
        <p className="muted">
          Monitor your products, inventory, alerts and waste.
        </p>
      </div>

      {/* Error message */}
      {error && (
        <div className="error">
          API Error: {error}
        </div>
      )}

      {/* Loading indicator */}
      {loading && (
        <div className="panel">
          <p>Loading dashboard data...</p>
        </div>
      )}

      {/* Statistics */}
      <div className="stats">

        <div className="stat">
          <label>Total Products</label>
          <strong>{stats.totalProducts}</strong>
        </div>

        <div className="stat">
          <label>Total Stock</label>
          <strong>{stats.totalStock}</strong>
        </div>

        <div className="stat">
          <label>Active Alerts</label>
          <strong>{stats.activeAlerts}</strong>
        </div>

        <div className="stat">
          <label>Total Waste</label>
          <strong>{stats.totalWaste}</strong>
        </div>

      </div>

      {/* Inventory overview */}
      <section className="panel">
        <div className="row-between">
          <div>
            <h2>Inventory Overview</h2>
            <p className="muted">
              Current batch-level stock information.
            </p>
          </div>
        </div>

        <div className="tablewrap">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Batch</th>
                <th>Quantity</th>
                <th>Expiry Date</th>
              </tr>
            </thead>

            <tbody>
              {!loading && inventory.length === 0 && (
                <tr>
                  <td colSpan="4" className="muted">
                    No inventory records found.
                  </td>
                </tr>
              )}

              {inventory.slice(0, 10).map((item, index) => (
                <tr key={item.Inventory_ID || index}>
                  <td>{item.Product_Name || "—"}</td>
                  <td>{item.Batch_Number || "—"}</td>
                  <td>{item.Quantity_On_Hand ?? 0}</td>
                  <td>
                    {item.Expiry_Date
                      ? new Date(item.Expiry_Date).toLocaleDateString()
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Recent alerts */}
      <section className="panel">
        <h2>Recent Alerts</h2>

        <p className="muted">
          Inventory notifications requiring attention.
        </p>

        {!loading && alerts.length === 0 && (
          <p className="muted">
            No alerts found.
          </p>
        )}

        {alerts.slice(0, 5).map((alert, index) => (
          <div
            className="alert-item"
            key={alert.Alert_ID || index}
          >
            <div>
              <strong>{alert.Alert_Type || "Alert"}</strong>
              <p>{alert.Message || "No message available."}</p>
            </div>

            <span className="badge">
              {alert.Status || "Unknown"}
            </span>
          </div>
        ))}
      </section>

    </div>
  );
}
