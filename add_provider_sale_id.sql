-- Agregar la nueva columna
IF NOT EXISTS (
    SELECT 1 
    FROM sys.columns 
    WHERE object_id = OBJECT_ID('Sales') AND name = 'IdSaleProvider'
)
BEGIN
    ALTER TABLE Sales ADD IdSaleProvider NVARCHAR(100) NULL;
END

-- Crear el índice si no existe
IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IX_Sales_IdSaleProvider' AND object_id = OBJECT_ID('Sales')
)
BEGIN
    CREATE INDEX IX_Sales_IdSaleProvider ON Sales(IdSaleProvider);
END 