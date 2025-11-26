import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import MenuBar from "./components/MenuBar.js";
import Home from "./pages/Home";
import NewItem from "./pages/NewItem";
import RemoveItem from "./pages/RemoveItem";

import ProductDetails from "./pages/ProductDetails";
import EditProduct from "./pages/EditProduct";

function App() {
  return (
    <Router>
      <div className="App">
        <MenuBar />
        <main className="p-4 flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/new" element={<NewItem />} />
            <Route path="/remove" element={<RemoveItem />} />
            <Route path="/product/:id" element={<ProductDetails />} />
            <Route path="/product/:id/edit" element={<EditProduct />} />
          </Routes>
          <div className="h-14"></div>
        </main>
      </div>
    </Router>
  );
}

export default App;
