import { useEffect, useState } from "react";

export default function DressLoans({ api, apiBase }) {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState("OPEN");

  async function load() {
    let url = `${apiBase}/api/dress-loans`;

    if (filter === "OVERDUE") {
      url = `${apiBase}/api/dress-loans?overdue=true`;
    } else if (filter !== "ALL") {
      url = `${apiBase}/api/dress-loans?status=${filter}`;
    }

    const data = await api.request(url);
    setItems(data);
  }

  useEffect(() => {
    load();
  }, [filter]);

  async function returnLoan(id) {
    const returned_by = prompt("Nombre de quien devuelve:");
    if (!returned_by) return;

    await api.request(`${apiBase}/api/dress-loans/${id}/return`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ returned_by })
    });

    load();
  }

  return (
    <div>
      <h2>Préstamos</h2>

      <div style={{ marginBottom: 20 }}>
        <button onClick={() => setFilter("OPEN")}>Abiertos</button>
        <button onClick={() => setFilter("OVERDUE")}>Vencidos</button>
        <button onClick={() => setFilter("RETURNED")}>Devueltos</button>
        <button onClick={() => setFilter("ALL")}>Todos</button>
      </div>

      <table>
        <thead>
          <tr>
            <th>Vestido</th>
            <th>Cliente</th>
            <th>Entrega</th>
            <th>Vencimiento</th>
            <th>Estado</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {items.map((l) => (
            <tr key={l.id}>
              <td>{l.dress_id}</td>
              <td>{l.customer_name}</td>
              <td>{new Date(l.delivered_at).toLocaleDateString()}</td>
              <td>{new Date(l.due_at).toLocaleDateString()}</td>
              <td>{l.status}</td>
              <td>
                {l.status === "OPEN" && (
                  <button onClick={() => returnLoan(l.id)}>
                    Registrar devolución
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
