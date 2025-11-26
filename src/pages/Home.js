import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Product from "../class/Product";
import { Icon } from "@mdi/react";
import {
  mdiLoading,
  mdiAlertCircle,
  mdiMagnify,
  mdiFilter,
  mdiSort,
  mdiSortAscending,
  mdiSortDescending,
  mdiClose, // added close icon
} from "@mdi/js";
import Success from "../components/Success";

export default function Home() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [category, setCategory] = useState("all");
  const [pantry, setPantry] = useState("all");
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const location = useLocation();

  // Success modal visibility (initialized from location.state)
  const [showSuccess, setShowSuccess] = useState(
    !!location?.state?.showSuccess
  );

  useEffect(() => {
    if (location?.state?.showSuccess) {
      setShowSuccess(true);
    }
  }, [location?.state?.showSuccess]);

  // Sort
  const [sortBy, setSortBy] = useState("expires"); // 'expires', 'name', 'quantity'
  const [sortOrder, setSortOrder] = useState("asc"); // 'asc', 'desc'

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/products");
      const contentType = response.headers.get("content-type");

      if (!contentType || !contentType.includes("application/json")) {
        throw new Error(
          "Risposta del server non valida. Riavvia il server (npm run start)."
        );
      }

      if (!response.ok) {
        throw new Error("Errore nel caricamento dei prodotti");
      }

      const data = await response.json();
      setProducts(data.map((p) => Product.fromJSON(p)));
    } catch (err) {
      console.error("Error fetching products:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    const total = products.length;
    const byPantry = products.reduce((acc, p) => {
      acc[p.pantry] = (acc[p.pantry] || 0) + 1;
      return acc;
    }, {});
    return { total, byPantry };
  }, [products]);

  const filteredAndSortedProducts = useMemo(() => {
    let result = [...products];

    // Filter
    if (category !== "all") {
      result = result.filter((p) => p.category === category);
    }
    if (pantry !== "all") {
      result = result.filter((p) => p.pantry === pantry);
    }
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((p) => p.name.toLowerCase().includes(q));
    }

    // Sort
    result.sort((a, b) => {
      let valA, valB;

      switch (sortBy) {
        case "expires":
          valA = new Date(a.expires).getTime();
          valB = new Date(b.expires).getTime();
          break;
        case "quantity":
          valA = a.quantity;
          valB = b.quantity;
          break;
        case "name":
        default:
          valA = a.name.toLowerCase();
          valB = b.name.toLowerCase();
          break;
      }

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [products, category, pantry, search, sortBy, sortOrder]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Icon path={mdiLoading} size={2} spin className="text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6 relative h-full">
      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-lg shadow-sm border border-gray-100 mb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">La tua Dispensa</h1>
          <p className="text-gray-500 text-sm">
            Gestisci i tuoi prodotti e scadenze
          </p>
        </div>
        <div className="flex gap-4 text-sm">
          <div className="bg-blue-50 px-3 py-1 rounded-full text-blue-700 font-medium">
            Totale: {stats.total}
          </div>
          {Object.entries(stats.byPantry).map(([name, count]) => (
            <div
              key={name}
              className="bg-gray-100 px-3 py-1 rounded-full text-gray-700"
            >
              {name}: {count}
            </div>
          ))}
        </div>
      </div>

      {/* Filters & Controls */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <Icon
                path={mdiMagnify}
                size={1}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="Cerca prodotto..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`md:hidden p-2 border rounded-lg transition-colors ${
                showFilters
                  ? "bg-blue-100 text-blue-700 border-blue-200"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Icon path={mdiFilter} size={1} />
            </button>
          </div>

          {/* Filters */}
          <div
            className={`${
              showFilters ? "flex" : "hidden"
            } md:flex flex-col sm:flex-row gap-2 w-full md:w-auto`}
          >
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="px-3 py-2 border rounded-lg bg-white text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none w-full md:w-auto"
            >
              <option value="all">Tutte le categorie</option>
              {Product.category.map((c) => (
                <option key={c} value={c}>
                  {c.charAt(0).toUpperCase() + c.slice(1)}
                </option>
              ))}
            </select>

            <select
              value={pantry}
              onChange={(e) => setPantry(e.target.value)}
              className="px-3 py-2 border rounded-lg bg-white text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none w-full md:w-auto"
            >
              <option value="all">Tutte le dispense</option>
              {Product.pantry.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Sort Controls */}
        <div
          className={`${
            showFilters ? "flex" : "hidden"
          } md:flex items-center gap-2 w-full md:w-auto`}
        >
          <div className="flex items-center gap-2 flex-1">
            <span className="text-sm text-gray-600 font-medium whitespace-nowrap flex items-center gap-1">
              <Icon path={mdiSort} size={0.8} /> Ordina:
            </span>
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setSortOrder("asc");
              }}
              className="px-3 py-2 border rounded-lg bg-white text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none w-full"
            >
              <option value="expires">Scadenza</option>
              <option value="quantity">Quantità</option>
              <option value="name">Nome</option>
            </select>
          </div>

          <button
            onClick={() =>
              setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))
            }
            className="p-2 border rounded-lg bg-white text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none"
            title={sortOrder === "asc" ? "Crescente" : "Decrescente"}
          >
            <Icon
              path={sortOrder === "asc" ? mdiSortAscending : mdiSortDescending}
              size={1}
            />
          </button>
        </div>
      </div>

      {/* Product Grid */}
      {filteredAndSortedProducts.length === 0 ? (
        <div className="text-center py-12 text-gray-500 bg-white rounded-lg border border-dashed border-gray-300">
          <Icon path={mdiFilter} size={2} className="mx-auto mb-2 opacity-20" />
          <p>Nessun prodotto trovato</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredAndSortedProducts.map((product) =>
            product.renderCard(navigate)
          )}
        </div>
      )}

      {showSuccess && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="relative bg-white rounded-xl shadow-xl max-w-sm w-full p-6 space-y-4 animate-in fade-in zoom-in duration-200">
            {/* Close button */}
            <button
              onClick={() => {
                setShowSuccess(false);
                // clear the location state to avoid re-opening on navigation
                navigate(location?.pathname || "/", {
                  replace: true,
                  state: {},
                });
              }}
              aria-label="Close"
              className="absolute top-3 right-3 p-2 rounded-md text-gray-500 hover:bg-gray-100"
            >
              <Icon path={mdiClose} size={1} />
            </button>

            {Success()}
          </div>
        </div>
      )}
    </div>
  );
}
