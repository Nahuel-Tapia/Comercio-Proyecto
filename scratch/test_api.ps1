Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "   Iniciando Pruebas de Integración de la API" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

$baseUrl = "http://localhost:5199"

# Helper for HTTP requests
function Invoke-Request {
    param (
        [string]$Path,
        [string]$Method = "GET",
        [object]$Body = $null,
        [string]$Token = $null
    )
    
    $headers = @{}
    if ($Token) {
        $headers.Add("Authorization", "Bearer $Token")
    }
    
    $params = @{
        Uri = "$baseUrl$Path"
        Method = $Method
        Headers = $headers
        ContentType = "application/json"
        ErrorAction = "Stop"
        UseBasicParsing = $true
    }
    
    if ($Body) {
        $params.Body = ($Body | ConvertTo-Json -Depth 5)
    }
    
    try {
        $response = Invoke-WebRequest @params
        return @{
            StatusCode = $response.StatusCode
            Content = ($response.Content | ConvertTo-Json -Depth 5)
            RawContent = $response.Content
        }
    } catch {
        $status = $_.Exception.Response.StatusCode
        $stream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        $responseBody = $reader.ReadToEnd()
        return @{
            StatusCode = $status
            Content = $responseBody
            RawContent = $responseBody
        }
    }
}

# 1. Login Normal User
Write-Host "`n1. Probando Login de Usuario Común..." -ForegroundColor Yellow
$loginUserBody = @{ Email = "user@ecommerce.com"; Password = "User123!" }
$res = Invoke-Request -Path "/api/auth/login" -Method "POST" -Body $loginUserBody
if ($res.StatusCode -eq 200) {
    $userTokenObj = $res.RawContent | ConvertFrom-Json
    $userToken = $userTokenObj.token
    Write-Host "Login exitoso! Token obtenido." -ForegroundColor Green
} else {
    Write-Host "Fallo el login de usuario: Status $($res.StatusCode)" -ForegroundColor Red
    Write-Host $res.Content -ForegroundColor Red
    exit 1
}

# 2. Login Admin User
Write-Host "`n2. Probando Login de Administrador..." -ForegroundColor Yellow
$loginAdminBody = @{ Email = "admin@ecommerce.com"; Password = "Admin123!" }
$res = Invoke-Request -Path "/api/auth/login" -Method "POST" -Body $loginAdminBody
if ($res.StatusCode -eq 200) {
    $adminTokenObj = $res.RawContent | ConvertFrom-Json
    $adminToken = $adminTokenObj.token
    Write-Host "Login exitoso! Token obtenido." -ForegroundColor Green
} else {
    Write-Host "Fallo el login de administrador: Status $($res.StatusCode)" -ForegroundColor Red
    Write-Host $res.Content -ForegroundColor Red
    exit 1
}

# 3. Create Product using User Token
Write-Host "`n3. Creando producto con token de Usuario Común (Debe funcionar)..." -ForegroundColor Yellow
$category = "a1b2c3d4-0000-0000-0000-000000000001" # Electrónica
$productBody = @{
    Name = "Audifonos Bluetooth"
    Description = "Auriculares inalámbricos con cancelación de ruido"
    Price = 4500.00
    Stock = 50
    CategoryId = $category
}
$res = Invoke-Request -Path "/api/products" -Method "POST" -Body $productBody -Token $userToken
if ($res.StatusCode -eq 201) {
    $createdProd = $res.RawContent | ConvertFrom-Json
    $productId = $createdProd.id
    Write-Host "Producto creado exitosamente! ID: $productId" -ForegroundColor Green
} else {
    Write-Host "Fallo al crear producto: Status $($res.StatusCode)" -ForegroundColor Red
    Write-Host $res.Content -ForegroundColor Red
    exit 1
}

# 4. Attempt Delete Product using User Token (Should fail - 403 Forbidden)
Write-Host "`n4. Intentando eliminar producto con token de Usuario Común (Debe fallar - 403)..." -ForegroundColor Yellow
$res = Invoke-Request -Path "/api/products/$productId" -Method "DELETE" -Token $userToken
if ($res.StatusCode -eq 403) {
    Write-Host "Acceso denegado correctamente (403 Forbidden)." -ForegroundColor Green
} else {
    Write-Host "Fallo de seguridad! Se esperaba 403 Forbidden pero se obtuvo: $($res.StatusCode)" -ForegroundColor Red
    exit 1
}

# 5. Delete Product using Admin Token (Should succeed - 204)
Write-Host "`n5. Eliminando producto con token de Administrador (Debe funcionar - 204)..." -ForegroundColor Yellow
$res = Invoke-Request -Path "/api/products/$productId" -Method "DELETE" -Token $adminToken
if ($res.StatusCode -eq 204) {
    Write-Host "Producto eliminado exitosamente por el administrador." -ForegroundColor Green
} else {
    Write-Host "Fallo al eliminar producto: Status $($res.StatusCode)" -ForegroundColor Red
    Write-Host $res.Content -ForegroundColor Red
    exit 1
}

# 6. Recreate Product to use for Order Creation
Write-Host "`n6. Re-creando producto para pruebas de orden..." -ForegroundColor Yellow
$res = Invoke-Request -Path "/api/products" -Method "POST" -Body $productBody -Token $userToken
$createdProd = $res.RawContent | ConvertFrom-Json
$productId = $createdProd.id

# 7. Create Order using User Token
Write-Host "`n7. Creando orden de compra con token de Usuario Común..." -ForegroundColor Yellow
$orderBody = @{
    UserId = "b1c2d3e4-0000-0000-0000-000000000002"
    Items = @(
        @{
            ProductId = $productId
            Quantity = 2
        }
    )
}
$res = Invoke-Request -Path "/api/orders" -Method "POST" -Body $orderBody -Token $userToken
if ($res.StatusCode -eq 201) {
    $createdOrder = $res.RawContent | ConvertFrom-Json
    Write-Host "Orden creada exitosamente! ID: $($createdOrder.id)" -ForegroundColor Green
} else {
    Write-Host "Fallo al crear la orden: Status $($res.StatusCode)" -ForegroundColor Red
    Write-Host $res.Content -ForegroundColor Red
    exit 1
}

Write-Host "`n=============================================" -ForegroundColor Cyan
Write-Host "   ¡Todas las pruebas pasaron exitosamente!" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Cyan
