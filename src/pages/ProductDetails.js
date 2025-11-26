import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useParams, useNavigate } from "react-router-dom";
import Product from "../class/Product";
import { Icon } from "@mdi/react";
import {
  mdiLoading,
  mdiAlertCircle,
  mdiPencil,
  mdiDelete,
  mdiArrowLeft,
  mdiCheckCircle,
  mdiClockOutline,
  mdiCalendar,
} from "@mdi/js";

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          process.env.PUBLIC_URL + `/api/products/item/${id}`
        );
        if (!response.ok) {
          throw new Error("Prodotto non trovato");
        }
        const data = await response.json();
        setProduct(Product.fromJSON(data));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      const response = await fetch(
        process.env.PUBLIC_URL + `/api/products/item/${id}`,
        {
          method: "DELETE",
        }
      );
      if (response.ok) {
        navigate("/", { state: { showSuccess: true } });
      } else {
        throw new Error("Errore durante l'eliminazione");
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setShowDeleteModal(false);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center p-8">
        <Icon path={mdiLoading} size={2} spin className="text-blue-600" />
      </div>
    );
  if (error)
    return (
      <div className="p-4 text-red-600 flex items-center gap-2">
        <Icon path={mdiAlertCircle} size={1} /> {error}
      </div>
    );
  if (!product) return null;

  const expiryStatus = product.getExpiryStatus();
  const statusIconPath =
    expiryStatus.icon === "mdiAlertCircle"
      ? mdiAlertCircle
      : expiryStatus.icon === "mdiClockOutline"
      ? mdiClockOutline
      : mdiCheckCircle;

  return (
    <div className="relative h-full space-y-6 max-w-3xl mx-auto p-4">
      <Link
        to="/"
        className="flex items-center text-gray-600 hover:text-gray-900"
      >
        <Icon path={mdiArrowLeft} size={1} /> Torna indietro
      </Link>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="h-64 bg-gray-100 relative">
          <img
            src={product.getDisplayImage()}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="p-6 space-y-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                {product.name}
              </h1>
              <p className="text-gray-500 capitalize mt-4">
                <span
                  className={`px-6 bg-${product.getPantryColor()}-50 border-${product.getPantryColor()}-800 text-${product.getPantryColor()}-700 border p-1 rounded-full font-medium`}
                >
                  {product.pantry}
                </span>{" "}
                • {product.category}
              </p>
            </div>
            <span className="bg-green-50 border-green-800 text-green-700"></span>
            <span className="bg-yellow-50 border-yellow-800 text-yellow-700"></span>
            <span className="bg-red-50 border-red-800 text-red-700"></span>
            <span className="bg-gray-50 border-gray-800 text-gray-700"></span>

            <div className="flex gap-2">
              <button
                onClick={() => navigate(`/product/${id}/edit`)}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-full"
                title="Modifica"
              >
                <Icon path={mdiPencil} size={1} />
              </button>
              <button
                onClick={handleDeleteClick}
                className="p-2 text-red-600 hover:bg-red-50 rounded-full"
                title="Elimina"
              >
                <Icon path={mdiDelete} size={1} />
              </button>
            </div>
          </div>

          <div
            className={`p-4 rounded-lg border flex items-center gap-3 ${expiryStatus.color}`}
          >
            <Icon path={statusIconPath} size={1.2} />
            <div>
              <p className="font-medium">{expiryStatus.text}</p>
              <p className="text-sm opacity-80">
                Scade il: {new Date(product.expires).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Quantità</p>
              <p className="text-xl font-bold text-gray-800">
                {product.quantity} {product.unit}
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Codice a barre</p>
              <p className="font-bold text-gray-800 font-mono text-sm">
                {product.barcode || "-"}
              </p>
            </div>
          </div>

          {product.notes && (
            <div>
              <h3 className="font-medium text-gray-800 mb-2">Note</h3>
              <p className="text-gray-600 bg-gray-50 p-4 rounded-lg">
                {product.notes}
              </p>
            </div>
          )}

          <div className="text-xs text-gray-400 flex items-center gap-1 pt-4 border-t">
            <Icon path={mdiCalendar} size={0.6} />
            Aggiunto il:{" "}
            {product.addedDate
              ? new Date(product.addedDate).toLocaleDateString()
              : "Sconosciuto"}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3 text-red-600">
              <div className="bg-red-100 p-2 rounded-full">
                <Icon path={mdiAlertCircle} size={1.5} />
              </div>
              <h3 className="text-lg font-bold text-gray-900">
                Elimina Prodotto
              </h3>
            </div>

            <p className="text-gray-600">
              Sei sicuro di voler eliminare <strong>{product.name}</strong>?
              Questa azione non può essere annullata.
            </p>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                Annulla
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors shadow-sm"
              >
                Elimina
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
