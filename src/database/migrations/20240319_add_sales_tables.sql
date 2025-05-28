-- Verificar y crear tabla Sales si no existe
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Sales]') AND type in (N'U'))
BEGIN
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
    PRINT 'Tabla Sales creada exitosamente';
END
ELSE
BEGIN
    PRINT 'La tabla Sales ya existe';
END

-- Verificar y crear tabla CartItems si no existe
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[CartItems]') AND type in (N'U'))
BEGIN
    CREATE TABLE CartItems (
        CartItemId INT IDENTITY(1,1) PRIMARY KEY,
        SaleId INT NOT NULL,
        IdItemEcommerce NVARCHAR(100) NOT NULL,
        CreatedAt DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (SaleId) REFERENCES Sales(SaleId)
    );
    PRINT 'Tabla CartItems creada exitosamente';
END
ELSE
BEGIN
    PRINT 'La tabla CartItems ya existe';
END

-- Verificar y crear tabla Passengers si no existe
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Passengers]') AND type in (N'U'))
BEGIN
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
    PRINT 'Tabla Passengers creada exitosamente';
END
ELSE
BEGIN
    PRINT 'La tabla Passengers ya existe';
END

-- Verificar y crear índices si no existen
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Sales_Email' AND object_id = OBJECT_ID('Sales'))
BEGIN
    CREATE INDEX IX_Sales_Email ON Sales(Email);
    PRINT 'Índice IX_Sales_Email creado exitosamente';
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Sales_Status' AND object_id = OBJECT_ID('Sales'))
BEGIN
    CREATE INDEX IX_Sales_Status ON Sales(Status);
    PRINT 'Índice IX_Sales_Status creado exitosamente';
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_CartItems_SaleId' AND object_id = OBJECT_ID('CartItems'))
BEGIN
    CREATE INDEX IX_CartItems_SaleId ON CartItems(SaleId);
    PRINT 'Índice IX_CartItems_SaleId creado exitosamente';
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Passengers_SaleId' AND object_id = OBJECT_ID('Passengers'))
BEGIN
    CREATE INDEX IX_Passengers_SaleId ON Passengers(SaleId);
    PRINT 'Índice IX_Passengers_SaleId creado exitosamente';
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Passengers_Email' AND object_id = OBJECT_ID('Passengers'))
BEGIN
    CREATE INDEX IX_Passengers_Email ON Passengers(Email);
    PRINT 'Índice IX_Passengers_Email creado exitosamente';
END

-- Verificar y crear procedimientos almacenados si no existen
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[sp_CreateSale]') AND type in (N'P'))
BEGIN
    EXEC('CREATE PROCEDURE sp_CreateSale
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
    END');
    PRINT 'Procedimiento sp_CreateSale creado exitosamente';
END

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[sp_AddCartItem]') AND type in (N'P'))
BEGIN
    EXEC('CREATE PROCEDURE sp_AddCartItem
        @SaleId INT,
        @IdItemEcommerce NVARCHAR(100)
    AS
    BEGIN
        INSERT INTO CartItems (SaleId, IdItemEcommerce)
        VALUES (@SaleId, @IdItemEcommerce);
    END');
    PRINT 'Procedimiento sp_AddCartItem creado exitosamente';
END

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[sp_AddPassenger]') AND type in (N'P'))
BEGIN
    EXEC('CREATE PROCEDURE sp_AddPassenger
        @SaleId INT,
        @IdPassenger NVARCHAR(50),
        @Name NVARCHAR(100),
        @LastName NVARCHAR(100),
        @Email NVARCHAR(255)
    AS
    BEGIN
        INSERT INTO Passengers (SaleId, IdPassenger, Name, LastName, Email)
        VALUES (@SaleId, @IdPassenger, @Name, @LastName, @Email);
    END');
    PRINT 'Procedimiento sp_AddPassenger creado exitosamente';
END 