-- Agregar columna secureId a la tabla Sales
IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'[dbo].[Sales]') 
    AND name = 'secureId'
)
BEGIN
    -- Agregar la columna
    ALTER TABLE [dbo].[Sales]
    ADD secureId NVARCHAR(50) NULL;

    -- Crear un índice único
    CREATE UNIQUE INDEX [UQ_Sales_secureId] ON [dbo].[Sales](secureId) WHERE secureId IS NOT NULL;

    -- Actualizar registros existentes
    DECLARE @Id INT
    DECLARE @Date DATE
    DECLARE @SecureId NVARCHAR(50)

    DECLARE sale_cursor CURSOR FOR
    SELECT Id, Date FROM [dbo].[Sales]
    WHERE secureId IS NULL

    OPEN sale_cursor
    FETCH NEXT FROM sale_cursor INTO @Id, @Date

    WHILE @@FETCH_STATUS = 0
    BEGIN
        -- Generar el secureId en formato TUR-YYYYMMDD-XXXX
        SET @SecureId = CONCAT(
            'TUR-',
            FORMAT(@Date, 'yyyyMMdd'),
            '-',
            RIGHT('0000' + UPPER(CONVERT(VARCHAR(4), @Id, 36)), 4)
        )

        -- Actualizar el registro
        UPDATE [dbo].[Sales]
        SET secureId = @SecureId
        WHERE Id = @Id

        FETCH NEXT FROM sale_cursor INTO @Id, @Date
    END

    CLOSE sale_cursor
    DEALLOCATE sale_cursor

    -- Hacer la columna NOT NULL después de actualizar todos los registros
    ALTER TABLE [dbo].[Sales]
    ALTER COLUMN secureId NVARCHAR(50) NOT NULL;
END; 