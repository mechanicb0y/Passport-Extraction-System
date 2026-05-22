import { Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "./layouts/AppLayout.jsx";
import { ExtractionProvider } from "./hooks/useExtractionState.jsx";
import { ThemeProvider } from "./hooks/useTheme.jsx";
import { ToastProvider } from "./hooks/useToast.jsx";
import HelpPage from "./pages/HelpPage.jsx";
import HistoryPage from "./pages/HistoryPage.jsx";
import ResultsPage from "./pages/ResultsPage.jsx";
import UploadPage from "./pages/UploadPage.jsx";

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <ExtractionProvider>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/" element={<UploadPage />} />
              <Route path="/results" element={<ResultsPage />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="/help" element={<HelpPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </ExtractionProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
