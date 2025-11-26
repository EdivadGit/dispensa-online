import React, { useState, useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { mdiBarcodeScan, mdiLoading } from "@mdi/js";
import { Icon } from "@mdi/react";

export default function RemoveItem() {
  const scannerRef = useRef(null);
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [scannedBarcode, setScannedBarcode] = useState("");
  const [product, setProduct] = useState(null);
  const [quantityToRemove, setQuantityToRemove] = useState(1);

  // Cleanup scanner on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current
          .stop()
          .catch((err) =>
            console.warn("Scanner cleanup error (ignored):", err)
          );
      }
    };
  }, []);

  const startScanning = async () => {
    setScanning(true);
    setError("");
    setSuccess("");
    setScannedBarcode("");
    setProduct(null);
    setQuantityToRemove(1);

    setTimeout(() => {
      const html5QrCode = new Html5Qrcode("reader");
      scannerRef.current = html5QrCode;

      const config = { fps: 10, qrbox: { width: 250, height: 250 } };

      html5QrCode
        .start(
          { facingMode: "environment" },
          config,
          (decodedText) => {
            console.log(`Code matched = ${decodedText}`);
            stopScanning();
            setScannedBarcode(decodedText);
            fetchProduct(decodedText);
          },
          (errorMessage) => {
            // parse error, ignore it.
          }
        )
        .catch((err) => {
          console.error("Error starting scanner", err);
          setError(
            "Impossibile avviare la fotocamera, abilita l'accesso a questo sito web"
          );
          setScanning(false);
        });
    }, 100);
  };

  const stopScanning = () => {
    if (scannerRef.current) {
      scannerRef.current
        .stop()
        .then(() => {
          scannerRef.current.clear();
          setScanning(false);
        })
        .catch((err) => {
          console.warn("Failed to stop scanner:", err);
          setScanning(false);
        });
    } else {
      setScanning(false);
    }
  };

  const fetchProduct = async (barcode) => {
    setLoading(true);
    try {
      const response = await fetch(
        process.env.PUBLIC_URL + `/api/products/${barcode}`
      );

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error(
          "Risposta del server non valida (HTML invece di JSON). Prova a riavviare il server (npm run start)."
        );
      }

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Prodotto non trovato");
        }
        throw new Error("Errore nel recupero del prodotto");
      }
      const data = await response.json();
      setProduct(data);
      setQuantityToRemove(1); // Reset to 1
    } catch (err) {
      console.error("Error fetching product:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async () => {
    if (!product) return;

    setLoading(true);
    try {
      const response = await fetch(
        process.env.PUBLIC_URL + `/api/products/${product.barcode}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ quantity: quantityToRemove }),
        }
      );

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Risposta del server non valida.");
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Errore durante la rimozione");
      }

      setSuccess(
        `Rimossi ${quantityToRemove} ${product.unit} di ${
          product.name
        }. Rimanenti: ${data.product ? data.product.quantity : 0}`
      );
    } catch (err) {
      console.error("Error removing product:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 rounded-lg h-full">
      <h1 className="text-2xl font-bold mb-6">Rimuovi un prodotto</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}

      {!scanning && !product && (
        <div className="mb-6">
          <button
            type="button"
            onClick={startScanning}
            disabled={loading}
            className="w-full flex justify-center items-center gap-2 bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <Icon path={mdiLoading} size={1} spin />
            ) : (
              <>
                <Icon path={mdiBarcodeScan} size={1} />
                Scansiona per Rimuovere
              </>
            )}
          </button>
          <p className="text-center text-sm text-gray-500 mt-2">
            Scansiona il barcode per rimuovere unità del prodotto
          </p>
        </div>
      )}

      {scanning && (
        <div className="mb-6">
          <div
            id="reader"
            className="w-full h-64 bg-gray-100 rounded overflow-hidden"
          ></div>
          <button
            type="button"
            onClick={stopScanning}
            className="mt-4 w-full bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600"
          >
            Annulla
          </button>
        </div>
      )}

      {product && !scanning && (
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h2 className="text-xl font-bold mb-2">{product.name}</h2>
          <p className="text-gray-600 mb-4">
            Quantità disponibile:{" "}
            <span className="font-bold">
              {product.quantity} {product.unit}
            </span>
          </p>

          <div className="mb-6">
            <div className="flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={() =>
                  setQuantityToRemove(Math.max(0, quantityToRemove - 1))
                }
                className="w-12 h-12 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center text-2xl font-bold hover:bg-gray-300 transition-colors"
              >
                -
              </button>
              <span className="text-3xl font-bold text-gray-800 w-16 text-center">
                {quantityToRemove}
              </span>
              <button
                type="button"
                onClick={() =>
                  setQuantityToRemove(
                    Math.min(product.quantity, quantityToRemove + 1)
                  )
                }
                className="w-12 h-12 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center text-2xl font-bold hover:bg-gray-300 transition-colors"
              >
                +
              </button>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => {
                setProduct(null);
                setScannedBarcode("");
              }}
              className="flex-1 py-2 px-4 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium"
            >
              Annulla
            </button>
            <button
              onClick={handleRemove}
              disabled={loading}
              className="flex-1 py-2 px-4 bg-red-600 text-white rounded-md hover:bg-red-700 font-medium disabled:opacity-50"
            >
              {loading ? "Rimozione..." : "Rimuovi dalla dispensa"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
