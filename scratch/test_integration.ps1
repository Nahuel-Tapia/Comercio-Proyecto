Write-Host "Iniciando Pruebas de Integración y Validación..." -ForegroundColor Cyan

# Función helper para manejar e imprimir errores esperados (400 Bad Request / 500 Server Error)
function Test-ExpectedError {
    param (
        [string]$Uri,
        [string]$Method,
        [string]$Body = $null
    )
    
    try {
        $params = @{
            Uri = $Uri
            Method = $Method
            ErrorAction = 'Stop'
        }
        if ($Body) {
            $params.Body = $Body
            $params.ContentType = 'application/json'
        }
        $res = Invoke-RestMethod @params
        Write-Host "ERROR: Se esperaba una respuesta de error pero se obtuvo un código exitoso." -ForegroundColor Red
        return $res
    } catch {
        $status = $_.Exception.Response.StatusCode
        $stream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        $responseBody = $reader.ReadToEnd()
        Write-Host "Status esperado: $status" -ForegroundColor Yellow
        Write-Host "Respuesta de Error (Problem Details):" -ForegroundColor Yellow
        Write-Host $responseBody
        return $responseBody
    }
}

# 1. Prueba de Error Global (500)
Write-Host "`n1. Probando el Middleware Global de Excepciones (/api/test-error)..."
$null = Test-ExpectedError -Uri "http://localhost:5199/api/test-error" -Method Get

# 2. Pruebas de Validación RFC 7807 (400 Bad Request)
Write-Host "`n2.1. Creando un usuario con nombre vacío (Debe fallar)..."
$invalidUser1 = @{ Name = ""; Email = "invalid_user@example.com" } | ConvertTo-Json
$null = Test-ExpectedError -Uri "http://localhost:5199/api/users" -Method Post -Body $invalidUser1

Write-Host "`n2.2. Creando un usuario con email inválido (Debe fallar)..."
$invalidUser2 = @{ Name = "Usuario Invalido"; Email = "not-an-email" } | ConvertTo-Json
$null = Test-ExpectedError -Uri "http://localhost:5199/api/users" -Method Post -Body $invalidUser2

Write-Host "`n2.3. Creando un producto con precio <= 0 (Debe fallar)..."
$invalidProduct = @{ Name = "Teclado Invalido"; Price = 0.00; CategoryId = "9b0c51d9-75bc-426c-a496-ec6194b63870" } | ConvertTo-Json
$null = Test-ExpectedError -Uri "http://localhost:5199/api/products" -Method Post -Body $invalidProduct

Write-Host "`n2.4. Creando una orden con lista de ítems vacía (Debe fallar)..."
$invalidOrder = @{ UserId = "some-user-id"; Items = @() } | ConvertTo-Json
$null = Test-ExpectedError -Uri "http://localhost:5199/api/orders" -Method Post -Body $invalidOrder

# 3. Creaciones exitosas para verificar flujos normales
Write-Host "`n3.1. Creando un usuario válido..."
$random = Get-Random -Minimum 1000 -Maximum 9999
$email = "testvalido$random@example.com"
$userBody = @{ Name = "Cliente Test Valido"; Email = $email } | ConvertTo-Json
$user = Invoke-RestMethod -Uri "http://localhost:5199/api/users" -Method Post -Body $userBody -ContentType "application/json"
Write-Host "Usuario creado exitosamente: ID=$($user.Id)" -ForegroundColor Green

Write-Host "`n3.2. Creando un producto válido..."
$catId = "9b0c51d9-75bc-426c-a496-ec6194b63870" # Categoría Electrónica sembrada
$productBody = @{ Name = "Teclado Gamer Pro"; Price = 129.99; CategoryId = $catId } | ConvertTo-Json
$product = Invoke-RestMethod -Uri "http://localhost:5199/api/products" -Method Post -Body $productBody -ContentType "application/json"
Write-Host "Producto creado exitosamente: ID=$($product.Id)" -ForegroundColor Green

# 4. Crear una orden válida
Write-Host "`n4. Creando una orden válida..."
$orderBody = @{
    UserId = $user.Id
    Items = @(
        @{
            ProductId = $product.Id
            UnitPrice = 129.99
            Quantity = 1
        }
    )
} | ConvertTo-Json
$order = Invoke-RestMethod -Uri "http://localhost:5199/api/orders" -Method Post -Body $orderBody -ContentType "application/json"
Write-Host "Orden procesada exitosamente: ID=$($order.Id), Total=$($order.Total)" -ForegroundColor Green

# 5. Borrado Lógico (Soft Delete) de Producto
Write-Host "`n5. Ejecutando Soft Delete en el producto Gamer Pro..."
Invoke-RestMethod -Uri "http://localhost:5199/api/products/$($product.Id)" -Method Delete
Write-Host "Llamada DELETE ejecutada." -ForegroundColor Green

# 6. Verificar que no aparece en activos
Write-Host "`n6. Comprobando que no aparece en /api/products..."
$activeProducts = Invoke-RestMethod -Uri "http://localhost:5199/api/products" -Method Get
$found = $activeProducts | Where-Object { $_.Id -eq $product.Id }
if ($null -eq $found) {
    Write-Host "ÉXITO: El producto no aparece en la lista pública de productos activos." -ForegroundColor Green
} else {
    Write-Host "FALLO: El producto borrado lógicamente sigue apareciendo en /api/products." -ForegroundColor Red
}

# 7. Verificar a través del nuevo Endpoint Diagnostics Raw (con shadow properties)
Write-Host "`n7. Verificando Shadow Properties e IgnoreQueryFilters en /api/diagnostics/products-raw..."
$rawProducts = Invoke-RestMethod -Uri "http://localhost:5199/api/diagnostics/products-raw" -Method Get
$deletedProd = $rawProducts | Where-Object { $_.id -eq $product.Id }

if ($null -ne $deletedProd) {
    Write-Host "ÉXITO: Producto encontrado en la base de datos cruda!" -ForegroundColor Green
    Write-Host "IsDeleted: $($deletedProd.isDeleted)" -ForegroundColor Yellow
    Write-Host "CreatedDate: $($deletedProd.createdDate)" -ForegroundColor Yellow
    Write-Host "LastModifiedDate: $($deletedProd.lastModifiedDate)" -ForegroundColor Yellow
    if ($deletedProd.isDeleted -eq $true -and $null -ne $deletedProd.lastModifiedDate) {
        Write-Host "CONCORDANCIA COMPLETA: IsDeleted es true y LastModifiedDate está establecido." -ForegroundColor Green
    } else {
        Write-Host "ERROR: Las shadow properties no tienen los valores correctos para Soft Delete." -ForegroundColor Red
    }
} else {
    Write-Host "FALLO: El producto no se encuentra ni siquiera en /api/diagnostics/products-raw." -ForegroundColor Red
}

# 8. Borrado Lógico (Soft Delete) de Orden
Write-Host "`n8. Ejecutando Soft Delete en la orden..."
Invoke-RestMethod -Uri "http://localhost:5199/api/orders/$($order.Id)" -Method Delete
Write-Host "Llamada DELETE ejecutada para la orden." -ForegroundColor Green

# 9. Verificar en /api/diagnostics/orders-raw
Write-Host "`n9. Verificando Shadow Properties e IgnoreQueryFilters en /api/diagnostics/orders-raw..."
$rawOrders = Invoke-RestMethod -Uri "http://localhost:5199/api/diagnostics/orders-raw" -Method Get
$deletedOrder = $rawOrders | Where-Object { $_.id -eq $order.Id }

if ($null -ne $deletedOrder) {
    Write-Host "ÉXITO: Orden encontrada en base de datos cruda!" -ForegroundColor Green
    Write-Host "IsDeleted: $($deletedOrder.isDeleted)" -ForegroundColor Yellow
    Write-Host "CreatedDate: $($deletedOrder.createdDate)" -ForegroundColor Yellow
    Write-Host "LastModifiedDate: $($deletedOrder.lastModifiedDate)" -ForegroundColor Yellow
    if ($deletedOrder.isDeleted -eq $true -and $null -ne $deletedOrder.lastModifiedDate) {
        Write-Host "CONCORDANCIA COMPLETA: La orden IsDeleted es true y LastModifiedDate está establecido." -ForegroundColor Green
    } else {
        Write-Host "ERROR: La orden no fue marcada como IsDeleted = true en SQLite." -ForegroundColor Red
    }
} else {
    Write-Host "FALLO: La orden no se encuentra en /api/diagnostics/orders-raw." -ForegroundColor Red
}
