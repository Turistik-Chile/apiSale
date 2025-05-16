-- Crear tabla de ventas (Sales)
CREATE TABLE Sales (
    SaleId INT IDENTITY(1,1) PRIMARY KEY,
    Name NVARCHAR(100) NOT NULL,
    LastName NVARCHAR(100) NOT NULL,
    Email NVARCHAR(255) NOT NULL,
    PhoneNumber NVARCHAR(20) NOT NULL,
    Country NVARCHAR(2) NOT NULL,
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE(),
    Status NVARCHAR(20) DEFAULT 'PENDING'
);

-- Crear tabla de items del carrito (CartItems)
CREATE TABLE CartItems (
    CartItemId INT IDENTITY(1,1) PRIMARY KEY,
    SaleId INT NOT NULL,
    IdItemEcommerce NVARCHAR(100) NOT NULL,
    CreatedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (SaleId) REFERENCES Sales(SaleId)
);

-- Crear tabla de pasajeros (Passengers)
CREATE TABLE Passengers (
    PassengerId INT IDENTITY(1,1) PRIMARY KEY,
    SaleId INT NOT NULL,
    IdPassenger NVARCHAR(50) NOT NULL,
    Name NVARCHAR(100) NOT NULL,
    LastName NVARCHAR(100) NOT NULL,
    Email NVARCHAR(255) NOT NULL,
    CreatedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (SaleId) REFERENCES Sales(SaleId)
);

-- Índices para mejorar el rendimiento
CREATE INDEX IX_Sales_Email ON Sales(Email);
CREATE INDEX IX_Sales_Status ON Sales(Status);
CREATE INDEX IX_CartItems_SaleId ON CartItems(SaleId);
CREATE INDEX IX_Passengers_SaleId ON Passengers(SaleId);
CREATE INDEX IX_Passengers_Email ON Passengers(Email);

-- Procedimiento almacenado para crear una venta completa
CREATE PROCEDURE sp_CreateSale
    @Name NVARCHAR(100),
    @LastName NVARCHAR(100),
    @Email NVARCHAR(255),
    @PhoneNumber NVARCHAR(20),
    @Country NVARCHAR(2),
    @SaleId INT OUTPUT
AS
BEGIN
    BEGIN TRANSACTION;
    
    BEGIN TRY
        -- Insertar la venta principal
        INSERT INTO Sales (Name, LastName, Email, PhoneNumber, Country)
        VALUES (@Name, @LastName, @Email, @PhoneNumber, @Country);
        
        SET @SaleId = SCOPE_IDENTITY();
        
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;

-- Procedimiento almacenado para agregar items al carrito
CREATE PROCEDURE sp_AddCartItem
    @SaleId INT,
    @IdItemEcommerce NVARCHAR(100)
AS
BEGIN
    INSERT INTO CartItems (SaleId, IdItemEcommerce)
    VALUES (@SaleId, @IdItemEcommerce);
END;

-- Procedimiento almacenado para agregar pasajeros
CREATE PROCEDURE sp_AddPassenger
    @SaleId INT,
    @IdPassenger NVARCHAR(50),
    @Name NVARCHAR(100),
    @LastName NVARCHAR(100),
    @Email NVARCHAR(255)
AS
BEGIN
    INSERT INTO Passengers (SaleId, IdPassenger, Name, LastName, Email)
    VALUES (@SaleId, @IdPassenger, @Name, @LastName, @Email);
END; 