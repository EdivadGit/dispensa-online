import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import MenuBar from "./components/MenuBar.js";
import Home from "./pages/Home";
import NewItem from "./pages/NewItem";
import Remove from "./pages/Remove";

function App() {
  return (
    <Router>
      <div className="App">
        <MenuBar />
        <main className="p-4 h-[calc(100vh-3.5rem)] overflow-auto ">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/new" element={<NewItem />} />
            <Route path="/remove" element={<Remove />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
