-- Crear tabla de ventas (Sales)
CREATE TABLE Sales (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    -- Provider info
    ProviderName NVARCHAR(100) NOT NULL,
    
    -- Customer info
    Name NVARCHAR(100) NOT NULL,
    LastName NVARCHAR(100) NOT NULL,
    Email NVARCHAR(255) NOT NULL,
    PhoneNumber NVARCHAR(20) NOT NULL,
    Country NVARCHAR(2) NOT NULL,
    City NVARCHAR(100) NOT NULL,
    Language NVARCHAR(50) NOT NULL,
    Date DATE NOT NULL,
    Time TIME NOT NULL,
    QtyPax INT NOT NULL,
    Opt NVARCHAR(100) NOT NULL,
    Total DECIMAL(10,2) NOT NULL,
    
    -- System fields
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE(),
    Status NVARCHAR(20) DEFAULT 'PENDING'
);
GO

-- Crear tabla de items del carrito (CartItems)
CREATE TABLE CartItems (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    SaleId INT NOT NULL,
    IdItemEcommerce NVARCHAR(100) NOT NULL,
    CreatedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (SaleId) REFERENCES Sales(Id)
);
GO

-- Crear índices para optimizar consultas
CREATE INDEX IX_Sales_Email ON Sales(Email);
GO

CREATE INDEX IX_Sales_Status ON Sales(Status);
GO

CREATE INDEX IX_CartItems_SaleId ON CartItems(SaleId);
GO

-- Procedimiento almacenado para crear una venta
CREATE PROCEDURE sp_CreateSale
    @ProviderName NVARCHAR(100),
    @Name NVARCHAR(100),
    @LastName NVARCHAR(100),
    @Email NVARCHAR(255),
    @PhoneNumber NVARCHAR(20),
    @Country NVARCHAR(2),
    @City NVARCHAR(100),
    @Language NVARCHAR(50),
    @Date DATE,
    @Time TIME,
    @QtyPax INT,
    @Opt NVARCHAR(100),
    @Total DECIMAL(10,2),
    @SaleId INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;
    
    BEGIN TRY
        -- Insertar la venta principal
        INSERT INTO Sales (
            ProviderName, Name, LastName, Email, PhoneNumber, 
            Country, City, Language, Date, Time, QtyPax, Opt, Total
        )
        VALUES (
            @ProviderName, @Name, @LastName, @Email, @PhoneNumber,
            @Country, @City, @Language, @Date, @Time, @QtyPax, @Opt, @Total
        );
        
        SET @SaleId = SCOPE_IDENTITY();
        
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

-- Procedimiento almacenado para agregar items al carrito
CREATE PROCEDURE sp_AddCartItem
    @SaleId INT,
    @IdItemEcommerce NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO CartItems (SaleId, IdItemEcommerce)
    VALUES (@SaleId, @IdItemEcommerce);
END;
GO

-- Trigger para actualizar UpdatedAt en Sales
CREATE TRIGGER TR_Sales_UpdatedAt
ON Sales
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE Sales
    SET UpdatedAt = GETDATE()
    FROM Sales s
    INNER JOIN inserted i ON s.Id = i.Id;
END;
GO 