-- Eliminar la restricción única existente si existe
IF EXISTS (
    SELECT * FROM sys.indexes 
    WHERE name = 'UQ_Sales_idSaleProvider' 
    AND object_id = OBJECT_ID('Sales')
)
BEGIN
    DROP INDEX [UQ_Sales_idSaleProvider] ON [dbo].[Sales];
END;

-- Actualizar registros existentes que tengan NULL
UPDATE [dbo].[Sales]
SET idSaleProvider = 'LEGACY-' + CAST(Id AS NVARCHAR(20))
WHERE idSaleProvider IS NULL;

-- Ahora sí podemos actualizar la columna a NOT NULL
ALTER TABLE [dbo].[Sales]
ALTER COLUMN idSaleProvider NVARCHAR(100) NOT NULL;

-- Crear nueva restricción única
IF NOT EXISTS (
    SELECT * FROM sys.indexes 
    WHERE name = 'UQ_Sales_idSaleProvider' 
    AND object_id = OBJECT_ID('Sales')
)
BEGIN
    ALTER TABLE [dbo].[Sales]
    ADD CONSTRAINT UQ_Sales_idSaleProvider UNIQUE (idSaleProvider);
END;

-- Recrear el índice
IF EXISTS (
    SELECT * FROM sys.indexes 
    WHERE name = 'IX_Sales_idSaleProvider' 
    AND object_id = OBJECT_ID('Sales')
)
BEGIN
    DROP INDEX [IX_Sales_idSaleProvider] ON [dbo].[Sales];
END;

CREATE INDEX [IX_Sales_idSaleProvider] ON [dbo].[Sales](idSaleProvider);