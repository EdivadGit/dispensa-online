import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import Product from "../class/Product";
import { mdiBarcodeScan, mdiLoading } from "@mdi/js";
import { Icon } from "@mdi/react";

const CATEGORIES = Product.category;
const UNITS = Product.unit;
const PANTRY = Product.pantry;

export default function NewItem() {
  const navigate = useNavigate();
  const scannerRef = useRef(null);
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    barcode: "",
    name: "",
    quantity: 1,
    unit: UNITS[0],
    expires: "",
    category: CATEGORIES[0],
    pantry: PANTRY[0],
    notes: "",
    image: null,
    imagePreview: null,
  });

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

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      const hasChanges =
        formData.name ||
        formData.expires ||
        formData.notes ||
        formData.image ||
        formData.barcode;
      if (hasChanges) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [formData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({
          ...prev,
          image: file,
          imagePreview: reader.result,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const startScanning = async () => {
    setScanning(true);
    setError("");
    setTimeout(() => {
      const html5QrCode = new Html5Qrcode("reader");
      scannerRef.current = html5QrCode;

      const config = {
        fps: 20,
        aspectRatio: 1.0,
        formatsToSupport: [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.QR_CODE,
        ],
        advanced: [{ zoom: 3.0 }],
        videoConstraints: {
          facingMode: { ideal: "environment" },
          advanced: [{ focusMode: "continuous" }, { focusMode: "auto" }],
        },
      };

      html5QrCode
        .start({ facingMode: "environment" }, config, (decodedText) => {
          console.log(`Code matched = ${decodedText}`);
          stopScanning();
          setFormData((prev) => ({ ...prev, barcode: decodedText }));
          setSuccess("Barcode scansionato!");
        })
        .then(() => {
          const capabilities = html5QrCode.getRunningTrackCapabilities();
          console.log("Camera capabilities:", capabilities);

          if (capabilities.zoom) {
            html5QrCode
              .applyVideoConstraints({
                advanced: [{ zoom: 3.0 }],
              })
              .then(() => {
                console.log("Zoom applicato con successo");
              })
              .catch((err) => {
                console.warn("Zoom non supportato su questo dispositivo", err);
              });
          }
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.name || !formData.quantity || !formData.expires) {
      setError("Perfavore completa tutti i campi.");
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expDate = new Date(formData.expires);
    if (expDate < today) {
      setError("Non puoi inserire un prodotto già scaduto.");
      return;
    }

    setLoading(true);

    try {
      const newProduct = await new Product(
        Date.now().toString(),
        formData.name,
        formData.category,
        formData.expires,
        parseInt(formData.quantity),
        formData.barcode,
        formData.pantry,
        formData.unit,
        formData.notes,
        formData.image,
        new Date().toISOString()
      );
      await newProduct.save();

      navigate("/", { state: { showSuccess: true } });
      return;
    } catch (err) {
      console.error("Error saving product:", err);
      setError("Impossibile salvare il prodotto. ");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 rounded-lg h-full">
      <h1 className="text-2xl font-bold mb-6">
        Aggiungi un prodotto alla dispensa
      </h1>

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

      {scanning ? (
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
      ) : (
        <div className="mb-6">
          <button
            type="button"
            onClick={startScanning}
            className="w-full flex justify-center items-center gap-2 bg-green-800 text-white py-3 px-4 rounded-lg hover:bg-green-900 transition-colors"
          >
            <Icon path={mdiBarcodeScan} size={1} />
            Scansiona il barcode
          </button>
          <p className="text-center text-sm text-gray-500 mt-2">
            Scansiona il barcode del prodotto (Opzionale)
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {formData.barcode && (
          <div className="bg-gray-50 p-3 rounded border border-gray-200">
            <span className="text-sm font-medium text-gray-500 block">
              Scanned Barcode:
            </span>
            <span className="text-lg font-mono font-bold text-gray-800">
              {formData.barcode}
            </span>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nome <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
            autoComplete="off"
            className="w-full border rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="es. Penne rigate"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quantità <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="quantity"
              value={formData.quantity}
              onChange={handleInputChange}
              min="1"
              required
              autoComplete="off"
              className="w-full border rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Unità <span className="text-red-500">*</span>
            </label>
            <select
              name="unit"
              value={formData.unit}
              autoComplete="off"
              onChange={handleInputChange}
              className="w-full border rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="w-full">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Scadenza <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            name="expires"
            value={formData.expires}
            onChange={handleInputChange}
            required
            autoComplete="off"
            className="w-full border rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Categoria <span className="text-red-500">*</span>
          </label>
          <select
            name="category"
            value={formData.category}
            onChange={handleInputChange}
            className="w-full border rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Branca <span className="text-red-500">*</span>
          </label>
          <div className="flex flex-col gap-2 mt-1">
            {Product.pantry.map((p) => (
              <label key={p} className="inline-flex items-center">
                <input
                  type="radio"
                  name="pantry"
                  value={p}
                  autoComplete="off"
                  checked={formData.pantry === p}
                  onChange={handleInputChange}
                  className="form-radio text-green-600"
                />
                <span className="ml-2">{p}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Note (Opzionale)
          </label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleInputChange}
            rows="3"
            className="w-full border rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
          ></textarea>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Immagine (Opzionale)
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
          />
          {formData.imagePreview && (
            <div className="mt-2">
              <img
                src={formData.imagePreview}
                alt="Preview"
                className="h-32 w-auto object-cover rounded border"
              />
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={() => {
              const hasChanges =
                formData.name ||
                formData.expires ||
                formData.notes ||
                formData.image ||
                formData.barcode;
              if (hasChanges) {
                if (window.confirm("Sei sicuro di voler annullare?")) {
                  navigate("/");
                }
              } else {
                navigate("/");
              }
            }}
            className="flex-1 py-2 px-4 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium"
          >
            Annulla
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-2 px-4 bg-green-800 text-white rounded-md hover:bg-green-900 font-medium disabled:opacity-50 flex justify-center items-center"
          >
            {loading ? <Icon path={mdiLoading} size={1} spin /> : "Salva"}
          </button>
        </div>
      </form>
    </div>
  );
}
