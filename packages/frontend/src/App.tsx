import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { HomePage } from "./pages/HomePage";
import { PageViewPage } from "./pages/PageViewPage";

function App() {
    return (
        <BrowserRouter>
            <div className="app">
                <header className="app-header">
                    <Link to="/" className="app-logo">
                        📓 <span>Notebook Digitizer</span>
                    </Link>
                </header>
                <main className="app-content">
                    <Routes>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/page/:id" element={<PageViewPage />} />
                    </Routes>
                </main>
            </div>
        </BrowserRouter>
    );
}

export default App;
