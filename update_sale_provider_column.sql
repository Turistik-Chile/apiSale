-- Actualizar la columna idSaleProvider si existe
IF EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'[dbo].[Sales]') 
    AND name = 'IdSaleProvider'
)
BEGIN
    EXEC sp_rename 'Sales.IdSaleProvider', 'idSaleProvider', 'COLUMN';
    PRINT 'Columna IdSaleProvider renombrada a idSaleProvider';
END
GO

-- Asegurarse de que la columna tenga el tipo de dato correcto
IF EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'[dbo].[Sales]') 
    AND name = 'idSaleProvider'
)
BEGIN
    ALTER TABLE [dbo].[Sales]
    ALTER COLUMN idSaleProvider NVARCHAR(100) NULL;
    PRINT 'Tipo de dato de idSaleProvider actualizado a NVARCHAR(100)';
END
GO

-- Actualizar el índice si existe
IF EXISTS (
    SELECT * FROM sys.indexes 
    WHERE name = 'IX_Sales_IdSaleProvider' 
    AND object_id = OBJECT_ID('Sales')
)
BEGIN
    DROP INDEX [IX_Sales_IdSaleProvider] ON [dbo].[Sales];
    CREATE INDEX [IX_Sales_idSaleProvider] ON [dbo].[Sales](idSaleProvider);
    PRINT 'Índice actualizado para idSaleProvider';
END
GO 