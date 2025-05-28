-- Agregar columna CancelReason a la tabla Sales si no existe
IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'[dbo].[Sales]') 
    AND name = 'CancelReason'
)
BEGIN
    ALTER TABLE [dbo].[Sales]
    ADD CancelReason NVARCHAR(500) NULL;
END;

-- Agregar columna CancelReason a la tabla CartItems si no existe
IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'[dbo].[CartItems]') 
    AND name = 'CancelReason'
)
BEGIN
    ALTER TABLE [dbo].[CartItems]
    ADD CancelReason NVARCHAR(500) NULL;
END; 