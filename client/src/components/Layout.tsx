import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useToast } from "./Toast";
import { Button } from "./ui";

const NAV_ITEMS = [
    { to: "/", label: "Dashboard", end: true },
    { to: "/products", label: "Products", end: false },
    { to: "/units", label: "Units", end: false },
    { to: "/transactions", label: "Transactions", end: false }
];

export function Layout() {
    const { user, logout } = useAuth();
    const { notify } = useToast();
    const navigate = useNavigate();

    async function handleLogout() {
        await logout();
        notify("Logged out", "info");
        navigate("/login", { replace: true });
    }

    return (
        <div className="app-shell">
            <aside className="sidebar">
                <div className="brand">StockFlow</div>
                <nav className="nav">
                    {NAV_ITEMS.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.end}
                            className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
                        >
                            {item.label}
                        </NavLink>
                    ))}
                </nav>
            </aside>
            <div className="main">
                <header className="topbar">
                    <div className="topbar-title">Inventory Management</div>
                    <div className="user-box">
                        <span className="user-email">{user?.email || `User #${user?.id ?? ""}`}</span>
                        <Button variant="secondary" onClick={handleLogout}>
                            Log out
                        </Button>
                    </div>
                </header>
                <main className="content">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
