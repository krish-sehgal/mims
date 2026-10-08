import { Navigate, Route, Routes } from "react-router-dom";
import { RequireAuth } from "./auth/RequireAuth";
import { Layout } from "./components/Layout";
import DashboardPage from "./pages/DashboardPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import LoginPage from "./pages/LoginPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import ProductFormPage from "./pages/ProductFormPage";
import ProductsPage from "./pages/ProductsPage";
import RegisterPage from "./pages/RegisterPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import TransactionDetailPage from "./pages/TransactionDetailPage";
import TransactionFormPage from "./pages/TransactionFormPage";
import TransactionsPage from "./pages/TransactionsPage";
import UnitsPage from "./pages/UnitsPage";

function App() {
    return (
        <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            <Route element={<RequireAuth />}>
                <Route element={<Layout />}>
                    <Route index element={<DashboardPage />} />
                    <Route path="products" element={<ProductsPage />} />
                    <Route path="products/new" element={<ProductFormPage />} />
                    <Route path="products/:id" element={<ProductDetailPage />} />
                    <Route path="products/:id/edit" element={<ProductFormPage />} />
                    <Route path="units" element={<UnitsPage />} />
                    <Route path="transactions" element={<TransactionsPage />} />
                    <Route path="transactions/new" element={<TransactionFormPage />} />
                    <Route path="transactions/:id" element={<TransactionDetailPage />} />
                </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

export default App;
