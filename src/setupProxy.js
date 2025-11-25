const fs = require("fs");
const path = require("path");
const bodyParser = require("body-parser");

module.exports = function (app) {
  app.use(bodyParser.json());

  app.post("/api/products", (req, res) => {
    const newProduct = req.body;
    const filePath = path.join(
      __dirname,
      "..",
      "server",
      "pantry_products.json"
    );

    fs.readFile(filePath, "utf8", (err, data) => {
      let products = [];
      if (!err && data) {
        try {
          products = JSON.parse(data);
        } catch (e) {
          console.error("Error parsing JSON:", e);
        }
      }

      products.push(newProduct);

      fs.writeFile(filePath, JSON.stringify(products, null, 2), (err) => {
        if (err) {
          console.error("Error writing file:", err);
          res.status(500).json({ error: "Failed to save product" });
        } else {
          console.log("Product saved to", filePath);
          res.json({ success: true, message: "Product saved successfully" });
        }
      });
    });
  });

  app.get("/api/products", (req, res) => {
    const filePath = path.join(
      __dirname,
      "..",
      "server",
      "pantry_products.json"
    );

    fs.readFile(filePath, "utf8", (err, data) => {
      if (err) {
        // If file doesn't exist, return empty array
        if (err.code === "ENOENT") {
          return res.json([]);
        }
        console.error("Error reading file:", err);
        return res.status(500).json({ error: "Failed to read products" });
      }

      let products = [];
      try {
        products = JSON.parse(data);
      } catch (e) {
        console.error("Error parsing JSON:", e);
        return res.status(500).json({ error: "Failed to parse products" });
      }

      res.json(products);
    });
  });

  app.get("/api/products/:barcode", (req, res) => {
    const barcode = req.params.barcode;
    const filePath = path.join(
      __dirname,
      "..",
      "server",
      "pantry_products.json"
    );

    fs.readFile(filePath, "utf8", (err, data) => {
      if (err) {
        console.error("Error reading file:", err);
        return res.status(500).json({ error: "Failed to read products" });
      }

      let products = [];
      try {
        products = JSON.parse(data);
      } catch (e) {
        console.error("Error parsing JSON:", e);
        return res.status(500).json({ error: "Failed to parse products" });
      }

      const product = products.find((p) => p.barcode === barcode);

      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }

      res.json(product);
    });
  });

  app.delete("/api/products/:barcode", (req, res) => {
    const barcode = req.params.barcode;
    const quantityToRemove = parseInt(req.body.quantity) || 1; // Default to 1 if not specified
    const filePath = path.join(
      __dirname,
      "..",
      "server",
      "pantry_products.json"
    );

    fs.readFile(filePath, "utf8", (err, data) => {
      if (err) {
        return res.status(500).json({ error: "Failed to read products" });
      }

      let products = JSON.parse(data);
      const productIndex = products.findIndex((p) => p.barcode === barcode);

      if (productIndex !== -1) {
        const product = products[productIndex];

        if (product.quantity > quantityToRemove) {
          // Reduce quantity
          product.quantity -= quantityToRemove;
          products[productIndex] = product; // Update product in array
        } else {
          // Remove product entirely if quantity to remove >= current quantity
          products.splice(productIndex, 1);
        }

        fs.writeFile(filePath, JSON.stringify(products, null, 2), (err) => {
          if (err) {
            return res.status(500).json({ error: "Failed to update products" });
          }
          // Return the updated product (or null if removed) so UI can update
          const updatedProduct = products.find((p) => p.barcode === barcode);
          res.json({
            success: true,
            message: "Product updated",
            product: updatedProduct || null,
          });
        });
      } else {
        res.status(404).json({ error: "Product not found" });
      }
    });
  });

  // New ID-based endpoints
  app.get("/api/products/item/:id", (req, res) => {
    const id = req.params.id;
    const filePath = path.join(
      __dirname,
      "..",
      "server",
      "pantry_products.json"
    );

    fs.readFile(filePath, "utf8", (err, data) => {
      if (err) {
        if (err.code === "ENOENT") return res.json({});
        return res.status(500).json({ error: "Failed to read products" });
      }
      let products = [];
      try {
        products = JSON.parse(data);
      } catch (e) {}
      const product = products.find((p) => p.id === id);
      if (product) res.json(product);
      else res.status(404).json({ error: "Product not found" });
    });
  });

  app.put("/api/products/item/:id", (req, res) => {
    const id = req.params.id;
    const updatedProduct = req.body;
    const filePath = path.join(
      __dirname,
      "..",
      "server",
      "pantry_products.json"
    );

    fs.readFile(filePath, "utf8", (err, data) => {
      if (err) return res.status(500).json({ error: "Failed" });
      let products = JSON.parse(data);
      const index = products.findIndex((p) => p.id === id);
      if (index !== -1) {
        products[index] = { ...products[index], ...updatedProduct };
        fs.writeFile(filePath, JSON.stringify(products, null, 2), (err) => {
          if (err) return res.status(500).json({ error: "Failed to save" });
          res.json({ success: true, product: products[index] });
        });
      } else {
        res.status(404).json({ error: "Product not found" });
      }
    });
  });

  app.delete("/api/products/item/:id", (req, res) => {
    const id = req.params.id;
    const filePath = path.join(
      __dirname,
      "..",
      "server",
      "pantry_products.json"
    );

    fs.readFile(filePath, "utf8", (err, data) => {
      if (err) return res.status(500).json({ error: "Failed" });
      let products = JSON.parse(data);
      const newProducts = products.filter((p) => p.id !== id);
      if (products.length !== newProducts.length) {
        fs.writeFile(filePath, JSON.stringify(newProducts, null, 2), (err) => {
          if (err) return res.status(500).json({ error: "Failed to delete" });
          res.json({ success: true });
        });
      } else {
        res.status(404).json({ error: "Not found" });
      }
    });
  });
};
