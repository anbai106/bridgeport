import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import './index.css';
import App from './App';
import Publications from './routes/publications';
import Contributors from './routes/contributors';
import reportWebVitals from './reportWebVitals';

ReactDOM.render(
  <React.StrictMode>
    <BrowserRouter basename={process.env.PUBLIC_URL}>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/search" element={<App />}>
          <Route path=":query" element={<App />} />
        </Route>
        <Route path="/MuSIC" element={<App />}>
          <Route path=":MuSIC" element={<App />} />
        </Route>
        <Route path="/SNP" element={<App />}>
          <Route path=":SNP" element={<App />} />
        </Route>
        <Route path="/MUSE" element={<App />}>
          <Route path=":MUSE" element={<App />} />
        </Route>
        <Route path="/IWAS" element={<App />}>
          <Route path=":IWAS" element={<App />} />
        </Route>
        <Route path="/geneAnalysis" element={<App />}>
          <Route path=":geneAnalysis" element={<App />} />
        </Route>
        <Route path="/C" element={<App />}>
          <Route path=":atlas" element={<App />} />
        </Route>
        <Route path="/publications" element={<Publications />} />
        <Route path="/contributors" element={<Contributors />} />
        <Route
          path="*"
          element={
            <main style={{ padding: "1rem" }}>
              <p>There's nothing here!</p>
            </main>
          }
        />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
