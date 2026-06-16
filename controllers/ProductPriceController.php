<?php

class ProductPriceController extends Controller
{
    private $priceModel;

    public function __construct()
    {
        $this->priceModel = new ProductPrice();
    }

    public function index()
    {
        AuthMiddleware::check();
        $this->jsonResponse([
            'prices' => $this->priceModel->findAll(),
            'types' => ProductPrice::TYPES,
            'capacities' => ProductPrice::CAPACITIES,
        ]);
    }

    public function lookup()
    {
        AuthMiddleware::check();
        $type = $_GET['type'] ?? '';
        $capacity = $_GET['capacity'] ?? '';

        if (!$this->priceModel->validateType($type)) {
            $this->jsonResponse(['message' => 'Invalid type'], 400);
        }
        if (!$this->priceModel->validateCapacity($capacity)) {
            $this->jsonResponse(['message' => 'Capacity must be 6, 9, or 12 kg'], 400);
        }

        $row = $this->priceModel->findByTypeCapacity($type, $capacity);
        if (!$row) {
            $this->jsonResponse(['message' => 'Price not configured for this product'], 404);
        }

        $this->jsonResponse([
            'type' => $row['type'],
            'capacity' => $row['capacity'],
            'unit_price' => (float) $row['price'],
        ]);
    }

    public function update()
    {
        AuthMiddleware::hasRoleOrPermission(['Super Admin'], 'manage_inventory');
        $data = $this->getJsonInput();
        $items = $data['prices'] ?? $data;

        if (!is_array($items) || empty($items)) {
            $this->jsonResponse(['message' => 'Prices array required'], 400);
        }

        foreach ($items as $item) {
            if (!$this->priceModel->validateType($item['type'] ?? '')) {
                $this->jsonResponse(['message' => 'Invalid type: ' . ($item['type'] ?? '')], 400);
            }
            if (!$this->priceModel->validateCapacity($item['capacity'] ?? '')) {
                $this->jsonResponse(['message' => 'Invalid capacity'], 400);
            }
            if (!isset($item['price']) || (float) $item['price'] < 0) {
                $this->jsonResponse(['message' => 'Invalid price'], 400);
            }
        }

        $this->priceModel->bulkUpdate($items);
        $this->jsonResponse([
            'message' => 'Prices updated',
            'prices' => $this->priceModel->findAll(),
        ]);
    }
}
