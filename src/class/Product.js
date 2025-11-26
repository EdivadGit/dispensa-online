import React from "react";
import { Icon } from "@mdi/react";
import { mdiAlertCircle, mdiCheckCircle, mdiClockOutline } from "@mdi/js";

class Product {
  static pantry = ["Gruppo", "Branco", "Reparto", "Clan"];
  static unit = ["pezzi", "kg", "g", "litri", "confezioni"];
  static category = [
    "pasta",
    "conserve",
    "colazione",
    "merenda",
    "condimenti",
    "frutta",
    "altro",
  ];

  constructor(
    id,
    name,
    category,
    expires,
    quantity,
    barcode,
    pantry,
    unit = "pezzi",
    notes = "",
    image = null,
    addedDate = null
  ) {
    this.id = id;
    this.name = name;
    this.category = category;
    this.expires = expires;
    this.quantity = quantity;
    this.barcode = barcode;
    this.pantry = pantry;
    this.unit = unit;
    this.notes = notes;
    this.image = image;
    this.addedDate = addedDate;
  }

  isExpired() {
    const today = new Date();
    const expiryDate = new Date(this.expires);
    return expiryDate < today;
  }

  daysUntilExpiry() {
    const today = new Date();
    const expiryDate = new Date(this.expires);
    // Reset hours to compare dates only
    today.setHours(0, 0, 0, 0);
    expiryDate.setHours(0, 0, 0, 0);

    const timeDiff = expiryDate - today;
    return Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
  }

  getExpiryStatus() {
    const days = this.daysUntilExpiry();

    if (days < 0) {
      return {
        status: "expired",
        days,
        color: "bg-red-50 border-red-200 text-red-700",
        icon: "mdiAlertCircle",
        text: `Scaduto da ${Math.abs(days)} giorni`,
      };
    }
    if (days <= 7) {
      return {
        status: "soon",
        days,
        color: "bg-orange-50 border-orange-200 text-orange-700",
        icon: "mdiClockOutline",
        text: `Scade tra ${days} giorni`,
      };
    }
    return {
      status: "ok",
      days,
      color: "bg-green-50 border-green-200 text-green-700",
      icon: "mdiCheckCircle",
      text: "Scadenza OK",
    };
  }

  getPantryColor() {
    const pantryColors = {
      Gruppo: "gray",
      Branco: "yellow",
      Reparto: "green",
      Clan: "red",
    };
    return pantryColors[this.pantry] || "gray";
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      category: this.category,
      expires: this.expires,
      quantity: this.quantity,
      barcode: this.barcode,
      pantry: this.pantry,
      unit: this.unit,
      notes: this.notes,
      image: this.image,
      addedDate: this.addedDate,
    };
  }

  static fromJSON(json) {
    return new Product(
      json.id,
      json.name,
      json.category,
      json.expires,
      json.quantity,
      json.barcode,
      json.pantry,
      json.unit,
      json.notes,
      json.image,
      json.addedDate
    );
  }

  toString() {
    return JSON.stringify(this.toJSON());
  }

  getDisplayImage() {
    if (this.image) return this.image;

    const categoryColors = {
      pasta: "eab308", // yellow-500
      conserve: "ef4444", // red-500
      colazione: "3b82f6", // blue-500
      merenda: "f97316", // orange-500
      condimenti: "7bbe00", // green-500
      frutta: "f97316", // orange-500
      altro: "94a3b8", // slate-400
    };

    const color = categoryColors[this.category] || "94a3b8";
    return `https://placehold.co/600x400/${color}/ffffff?text=${
      this.name.charAt(0).toUpperCase() + this.name.slice(1)
    }`;
  }

  renderCard(navigate) {
    const expiryStatus = this.getExpiryStatus();

    const iconMap = {
      mdiAlertCircle,
      mdiClockOutline,
      mdiCheckCircle,
    };
    const statusIcon = iconMap[expiryStatus.icon];

    const formatDate = (iso) => {
      if (!iso) return "-";
      const d = new Date(iso);
      return d.toLocaleDateString();
    };

    return (
      <div
        key={this.id || this.barcode}
        className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow overflow-hidden flex flex-col"
      >
        {/* Image */}
        <div className="h-32 bg-gray-100 relative overflow-hidden">
          <img
            src={this.getDisplayImage()}
            alt={this.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-2 right-2 bg-white/90 backdrop-blur px-2 py-1 rounded text-xs font-bold shadow-sm">
            {this.quantity} {this.unit}
          </div>
        </div>

        <div className="p-4 flex-1 flex flex-col">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3
                className="font-bold text-gray-800 line-clamp-1"
                title={this.name}
              >
                {this.name}
              </h3>
              <p className="text-xs text-gray-500 capitalize">
                {this.category} • {this.pantry}
              </p>
            </div>
          </div>

          <div
            className={`mt-auto mb-3 px-3 py-2 rounded-md border text-xs font-medium flex items-center gap-2 ${expiryStatus.color}`}
          >
            <Icon path={statusIcon} size={0.6} />
            <span>
              {expiryStatus.text} ({formatDate(this.expires)})
            </span>
          </div>

          <button
            onClick={() => navigate(`/product/${this.id || this.barcode}`)}
            className="w-full py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Dettagli
          </button>
        </div>
      </div>
    );
  }

  async save() {
    // Upload image (supports File via FormData or base64 data URL). Replace image with server path.
    let imagePath = this.image;

    try {
      // Browser File upload via FormData (recommended)
      if (
        imagePath &&
        typeof File !== "undefined" &&
        imagePath instanceof File
      ) {
        const form = new FormData();
        const filename = `${this.id}_${imagePath.name || "image.png"}`;
        form.append("file", imagePath, filename);

        const uploadResp = await fetch(
          process.env.PUBLIC_URL + "/api/upload_image",
          {
            method: "POST",
            body: form,
          }
        );

        if (!uploadResp.ok) {
          console.warn(
            "Image file upload failed, continuing without uploaded image"
          );
        } else {
          const json = await uploadResp.json();
          if (json && json.path) imagePath = json.path;
        }
      }

      // Fallback: base64 data URL (existing flow)
      else if (
        imagePath &&
        typeof imagePath === "string" &&
        imagePath.startsWith("data:")
      ) {
        const uploadResp = await fetch(
          process.env.PUBLIC_URL + "/api/upload_image",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              image: imagePath,
              filename: `${this.id}.png`,
            }),
          }
        );

        if (!uploadResp.ok) {
          console.warn(
            "Image upload failed, continuing and saving product without uploaded image"
          );
        } else {
          const json = await uploadResp.json();
          if (json && json.path) imagePath = json.path;
        }
      }
    } catch (err) {
      console.warn("Error uploading image:", err);
    }

    const payload = this.toJSON();
    payload.image = imagePath;

    const response = await fetch(process.env.PUBLIC_URL + "/api/products", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error("Failed to save product to server");
    }

    return response;
  }
}

export default Product;
