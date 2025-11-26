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
