<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET,POST,PUT,DELETE,OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

$jsonFile = __DIR__ . '/../../server/pantry_products.json';

function readProducts() {
    global $jsonFile;
    if (!file_exists($jsonFile)) {
        return [];
    }
    $data = file_get_contents($jsonFile);
    return json_decode($data, true) ?: [];
}

function writeProducts($products) {
    global $jsonFile;
    $dir = dirname($jsonFile);
    if (!is_dir($dir)) {
        mkdir($dir, 0755, true);
    }
    file_put_contents($jsonFile, json_encode($products, JSON_PRETTY_PRINT), LOCK_EX);
}

$requestUri = $_SERVER['REQUEST_URI'];
$scriptName = $_SERVER['SCRIPT_NAME']; 
$basePath = str_replace('/index.php', '', $scriptName); 

// Remove query string
$requestUri = strtok($requestUri, '?');

// Remove base path from URI to get the route
if (strpos($requestUri, $basePath) === 0) {
    $route = substr($requestUri, strlen($basePath));
} else {
    $route = $requestUri;
}
$route = str_replace('api/', '', $route);
$method = $_SERVER['REQUEST_METHOD'];

// Routes
// /products
// /products/:barcode
// /products/item/:id

// Upload image endpoint: accepts JSON { image: "data:...base64...", filename: "name.png" }
if ($route === '/upload_image' || $route === '/upload_image/') {
    if ($method === 'POST') {
        // Support multipart/form-data uploads via 'file' field
        if (!empty($_FILES['file']) && is_uploaded_file($_FILES['file']['tmp_name'])) {
            $origName = $_FILES['file']['name'];
            $filename = isset($origName) ? basename($origName) : uniqid('img_') . '.png';
            $imgDir = __DIR__ . '/../../server/images';
            if (!is_dir($imgDir)) mkdir($imgDir, 0755, true);
            $filePath = $imgDir . '/' . $filename;
            if (!move_uploaded_file($_FILES['file']['tmp_name'], $filePath)) {
                http_response_code(500);
                echo json_encode(['success' => false, 'error' => 'Failed to move uploaded file']);
                exit();
            }
            $publicPath = '/server/images/' . $filename;
            echo json_encode(['success' => true, 'path' => $publicPath, 'filename' => $filename]);
            exit();
        }

        // Fallback: accept JSON with data URI
        $input = json_decode(file_get_contents('php://input'), true);
        if (!$input || !isset($input['image'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'No image provided']);
            exit();
        }

        $imageData = $input['image'];
        $filename = isset($input['filename']) ? basename($input['filename']) : uniqid('img_') . '.png';

        if (preg_match('/^data:(.*?);base64,(.*)$/', $imageData, $matches)) {
            $data = base64_decode($matches[2]);
            $imgDir = __DIR__ . '/../../server/images';
            if (!is_dir($imgDir)) mkdir($imgDir, 0755, true);
            $filePath = $imgDir . '/' . $filename;
            if (file_put_contents($filePath, $data) === false) {
                http_response_code(500);
                echo json_encode(['success' => false, 'error' => 'Failed to write image']);
                exit();
            }

            // Return a path that the client can use. Adjust if your server serves images from a different URL.
            $publicPath = '/server/images/' . $filename;
            echo json_encode(['success' => true, 'path' => $publicPath, 'filename' => $filename]);
            exit();
        } else {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Invalid data URI']);
            exit();
        }
    }
}

if ($route === '/products' || $route === '/products/') {
    if ($method === 'GET') {
        echo json_encode(readProducts());
    } elseif ($method === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);
        $products = readProducts();
        $products[] = $input;
        writeProducts($products);
        echo json_encode(['success' => true, 'message' => 'Product saved successfully']);
    }
} elseif (preg_match('#^/products/item/([^/]+)$#', $route, $matches)) {
    $id = $matches[1];
    if ($method === 'GET') {
        $products = readProducts();
        $product = null;
        foreach ($products as $p) {
            if (isset($p['id']) && $p['id'] == $id) {
                $product = $p;
                break;
            }
        }
        if ($product) echo json_encode($product);
        else { http_response_code(404); echo json_encode(['error' => 'Product not found']); }
    } elseif ($method === 'PUT') {
        $input = json_decode(file_get_contents('php://input'), true);
        $products = readProducts();
        $found = false;
        foreach ($products as &$p) {
            if (isset($p['id']) && $p['id'] == $id) {
                $p = array_merge($p, $input);
                $found = true;
                break;
            }
        }
        if ($found) {
            writeProducts($products);
            echo json_encode(['success' => true, 'product' => $p]);
        } else {
            http_response_code(404); echo json_encode(['error' => 'Product not found']);
        }
    } elseif ($method === 'DELETE') {
        $products = readProducts();
        $newProducts = array_filter($products, function($p) use ($id) {
            return !isset($p['id']) || $p['id'] != $id;
        });
        if (count($products) != count($newProducts)) {
            writeProducts(array_values($newProducts));
            echo json_encode(['success' => true]);
        } else {
            http_response_code(404); echo json_encode(['error' => 'Not found']);
        }
    }
} elseif (preg_match('#^/products/([^/]+)$#', $route, $matches)) {
    $barcode = $matches[1];
    if ($method === 'GET') {
        $products = readProducts();
        $product = null;
        foreach ($products as $p) {
            if (isset($p['barcode']) && $p['barcode'] == $barcode) {
                $product = $p;
                break;
            }
        }
        if ($product) echo json_encode($product);
        else { http_response_code(404); echo json_encode(['error' => 'Product not found']); }
    } elseif ($method === 'DELETE') {
        $input = json_decode(file_get_contents('php://input'), true);
        $quantityToRemove = isset($input['quantity']) ? (int)$input['quantity'] : 1;
        
        $products = readProducts();
        $index = -1;
        foreach ($products as $i => $p) {
            if (isset($p['barcode']) && $p['barcode'] == $barcode) {
                $index = $i;
                break;
            }
        }
        
        if ($index !== -1) {
            if ($products[$index]['quantity'] > $quantityToRemove) {
                $products[$index]['quantity'] -= $quantityToRemove;
            } else {
                array_splice($products, $index, 1);
            }
            writeProducts($products);
            
            // Return updated product or null if removed
            $updatedProduct = null;
             foreach ($products as $p) {
                if (isset($p['barcode']) && $p['barcode'] == $barcode) {
                    $updatedProduct = $p;
                    break;
                }
            }
            echo json_encode(['success' => true, 'message' => 'Product updated', 'product' => $updatedProduct]);
        } else {
            http_response_code(404); echo json_encode(['error' => 'Product not found']);
        }
    }
} else {
    http_response_code(404);
    echo json_encode(['error' => 'Route not found']);
}
?>
