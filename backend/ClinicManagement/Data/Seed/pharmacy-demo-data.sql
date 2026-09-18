SET NOCOUNT ON;

BEGIN TRY
    BEGIN TRANSACTION;

    INSERT INTO MedicineCategories (CategoryName)
    SELECT N'Kháng sinh'
    WHERE NOT EXISTS (
        SELECT 1 FROM MedicineCategories
        WHERE CategoryName = N'Kháng sinh'
    );

    INSERT INTO MedicineCategories (CategoryName)
    SELECT N'Giảm đau - Hạ sốt'
    WHERE NOT EXISTS (
        SELECT 1 FROM MedicineCategories
        WHERE CategoryName = N'Giảm đau - Hạ sốt'
    );

    INSERT INTO MedicineCategories (CategoryName)
    SELECT N'Tiêu hóa - Dạ dày'
    WHERE NOT EXISTS (
        SELECT 1 FROM MedicineCategories
        WHERE CategoryName = N'Tiêu hóa - Dạ dày'
    );

    INSERT INTO MedicineCategories (CategoryName)
    SELECT N'Hô hấp - Hen suyễn'
    WHERE NOT EXISTS (
        SELECT 1 FROM MedicineCategories
        WHERE CategoryName = N'Hô hấp - Hen suyễn'
    );

    INSERT INTO MedicineCategories (CategoryName)
    SELECT N'Tim mạch - Huyết áp'
    WHERE NOT EXISTS (
        SELECT 1 FROM MedicineCategories
        WHERE CategoryName = N'Tim mạch - Huyết áp'
    );

    INSERT INTO MedicineCategories (CategoryName)
    SELECT N'Nội tiết - Tiểu đường'
    WHERE NOT EXISTS (
        SELECT 1 FROM MedicineCategories
        WHERE CategoryName = N'Nội tiết - Tiểu đường'
    );

    INSERT INTO MedicineCategories (CategoryName)
    SELECT N'Nhãn khoa'
    WHERE NOT EXISTS (
        SELECT 1 FROM MedicineCategories
        WHERE CategoryName = N'Nhãn khoa'
    );

    INSERT INTO MedicineCategories (CategoryName)
    SELECT N'Vitamin & Khoáng chất'
    WHERE NOT EXISTS (
        SELECT 1 FROM MedicineCategories
        WHERE CategoryName = N'Vitamin & Khoáng chất'
    );

    INSERT INTO Suppliers (SupplierName, ContactInfo, Address)
    SELECT
        N'Dược Hậu Giang (DHG Pharma)',
        N'0292.3899.999',
        N'288 Bis Nguyễn Văn Cừ, Cần Thơ'
    WHERE NOT EXISTS (
        SELECT 1 FROM Suppliers
        WHERE SupplierName = N'Dược Hậu Giang (DHG Pharma)'
    );

    INSERT INTO Suppliers (SupplierName, ContactInfo, Address)
    SELECT
        N'Dược phẩm Sanofi-Aventis VN',
        N'028.3829.8526',
        N'Quận 1, TP. Hồ Chí Minh'
    WHERE NOT EXISTS (
        SELECT 1 FROM Suppliers
        WHERE SupplierName = N'Dược phẩm Sanofi-Aventis VN'
    );

    INSERT INTO Suppliers (SupplierName, ContactInfo, Address)
    SELECT
        N'AstraZeneca Việt Nam',
        N'028.3910.4500',
        N'TP. Hồ Chí Minh'
    WHERE NOT EXISTS (
        SELECT 1 FROM Suppliers
        WHERE SupplierName = N'AstraZeneca Việt Nam'
    );

    INSERT INTO Suppliers (SupplierName, ContactInfo, Address)
    SELECT
        N'Imexpharm Corporation',
        N'0277.3851.941',
        N'Cao Lãnh, Đồng Tháp'
    WHERE NOT EXISTS (
        SELECT 1 FROM Suppliers
        WHERE SupplierName = N'Imexpharm Corporation'
    );

    INSERT INTO Suppliers (SupplierName, ContactInfo, Address)
    SELECT
        N'Merck Healthcare VN',
        N'028.3824.7890',
        N'Quận 3, TP. Hồ Chí Minh'
    WHERE NOT EXISTS (
        SELECT 1 FROM Suppliers
        WHERE SupplierName = N'Merck Healthcare VN'
    );

    INSERT INTO Suppliers (SupplierName, ContactInfo, Address)
    SELECT
        N'Santen Pharmaceutical',
        N'028.3822.1100',
        N'Quận Bình Thạnh, TP. Hồ Chí Minh'
    WHERE NOT EXISTS (
        SELECT 1 FROM Suppliers
        WHERE SupplierName = N'Santen Pharmaceutical'
    );

    INSERT INTO Suppliers (SupplierName, ContactInfo, Address)
    SELECT
        N'Bayer Healthcare VN',
        N'028.3914.8888',
        N'Quận 7, TP. Hồ Chí Minh'
    WHERE NOT EXISTS (
        SELECT 1 FROM Suppliers
        WHERE SupplierName = N'Bayer Healthcare VN'
    );

    DECLARE @KhangSinhId INT = (
        SELECT CategoryId FROM MedicineCategories
        WHERE CategoryName = N'Kháng sinh'
    );
    DECLARE @GiamDauId INT = (
        SELECT CategoryId FROM MedicineCategories
        WHERE CategoryName = N'Giảm đau - Hạ sốt'
    );
    DECLARE @TieuHoaId INT = (
        SELECT CategoryId FROM MedicineCategories
        WHERE CategoryName = N'Tiêu hóa - Dạ dày'
    );
    DECLARE @HoHapId INT = (
        SELECT CategoryId FROM MedicineCategories
        WHERE CategoryName = N'Hô hấp - Hen suyễn'
    );
    DECLARE @TimMachId INT = (
        SELECT CategoryId FROM MedicineCategories
        WHERE CategoryName = N'Tim mạch - Huyết áp'
    );
    DECLARE @NoiTietId INT = (
        SELECT CategoryId FROM MedicineCategories
        WHERE CategoryName = N'Nội tiết - Tiểu đường'
    );
    DECLARE @NhanKhoaId INT = (
        SELECT CategoryId FROM MedicineCategories
        WHERE CategoryName = N'Nhãn khoa'
    );
    DECLARE @VitaminId INT = (
        SELECT CategoryId FROM MedicineCategories
        WHERE CategoryName = N'Vitamin & Khoáng chất'
    );

    DECLARE @DhgId INT = (
        SELECT SupplierId FROM Suppliers
        WHERE SupplierName = N'Dược Hậu Giang (DHG Pharma)'
    );
    DECLARE @SanofiId INT = (
        SELECT SupplierId FROM Suppliers
        WHERE SupplierName = N'Dược phẩm Sanofi-Aventis VN'
    );
    DECLARE @AstraId INT = (
        SELECT SupplierId FROM Suppliers
        WHERE SupplierName = N'AstraZeneca Việt Nam'
    );
    DECLARE @ImexId INT = (
        SELECT SupplierId FROM Suppliers
        WHERE SupplierName = N'Imexpharm Corporation'
    );
    DECLARE @MerckId INT = (
        SELECT SupplierId FROM Suppliers
        WHERE SupplierName = N'Merck Healthcare VN'
    );
    DECLARE @SantenId INT = (
        SELECT SupplierId FROM Suppliers
        WHERE SupplierName = N'Santen Pharmaceutical'
    );
    DECLARE @BayerId INT = (
        SELECT SupplierId FROM Suppliers
        WHERE SupplierName = N'Bayer Healthcare VN'
    );

    INSERT INTO Medicines (
        MedicineName,
        CategoryId,
        SupplierId,
        Unit,
        UnitPrice,
        Description
    )
    SELECT
        N'Augmentin 1g',
        @KhangSinhId,
        @DhgId,
        N'Hộp',
        245000,
        N'Amoxicillin 875mg + Acid Clavulanic 125mg'
    WHERE NOT EXISTS (
        SELECT 1 FROM Medicines
        WHERE MedicineName = N'Augmentin 1g'
    );

    INSERT INTO Medicines (
        MedicineName,
        CategoryId,
        SupplierId,
        Unit,
        UnitPrice,
        Description
    )
    SELECT
        N'Panadol Extra',
        @GiamDauId,
        @SanofiId,
        N'Hộp',
        195000,
        N'Paracetamol 500mg + Caffeine 65mg'
    WHERE NOT EXISTS (
        SELECT 1 FROM Medicines
        WHERE MedicineName = N'Panadol Extra'
    );

    INSERT INTO Medicines (
        MedicineName,
        CategoryId,
        SupplierId,
        Unit,
        UnitPrice,
        Description
    )
    SELECT
        N'Nexium Mups 40mg',
        @TieuHoaId,
        @AstraId,
        N'Hộp',
        368000,
        N'Esomeprazole magnesium trihydrate 40mg'
    WHERE NOT EXISTS (
        SELECT 1 FROM Medicines
        WHERE MedicineName = N'Nexium Mups 40mg'
    );

    INSERT INTO Medicines (
        MedicineName,
        CategoryId,
        SupplierId,
        Unit,
        UnitPrice,
        Description
    )
    SELECT
        N'Amlor 5mg',
        @TimMachId,
        @SanofiId,
        N'Hộp',
        312000,
        N'Amlodipine besylate 5mg'
    WHERE NOT EXISTS (
        SELECT 1 FROM Medicines
        WHERE MedicineName = N'Amlor 5mg'
    );

    INSERT INTO Medicines (
        MedicineName,
        CategoryId,
        SupplierId,
        Unit,
        UnitPrice,
        Description
    )
    SELECT
        N'Ventolin Inhaler',
        @HoHapId,
        @ImexId,
        N'Bình',
        92000,
        N'Salbutamol 100mcg/liều'
    WHERE NOT EXISTS (
        SELECT 1 FROM Medicines
        WHERE MedicineName = N'Ventolin Inhaler'
    );

    INSERT INTO Medicines (
        MedicineName,
        CategoryId,
        SupplierId,
        Unit,
        UnitPrice,
        Description
    )
    SELECT
        N'Glucophage 850mg',
        @NoiTietId,
        @MerckId,
        N'Hộp',
        285000,
        N'Metformin Hydrochloride 850mg'
    WHERE NOT EXISTS (
        SELECT 1 FROM Medicines
        WHERE MedicineName = N'Glucophage 850mg'
    );

    INSERT INTO Medicines (
        MedicineName,
        CategoryId,
        SupplierId,
        Unit,
        UnitPrice,
        Description
    )
    SELECT
        N'Cravit Ophthalmic 0.5%',
        @NhanKhoaId,
        @SantenId,
        N'Lọ',
        118000,
        N'Levofloxacin Hydrate 25mg/5ml'
    WHERE NOT EXISTS (
        SELECT 1 FROM Medicines
        WHERE MedicineName = N'Cravit Ophthalmic 0.5%'
    );

    INSERT INTO Medicines (
        MedicineName,
        CategoryId,
        SupplierId,
        Unit,
        UnitPrice,
        Description
    )
    SELECT
        N'Berocca Performance',
        @VitaminId,
        @BayerId,
        N'Tuýp',
        85000,
        N'Vitamin nhóm B + C + khoáng chất'
    WHERE NOT EXISTS (
        SELECT 1 FROM Medicines
        WHERE MedicineName = N'Berocca Performance'
    );

    DECLARE @AugmentinId INT = (
        SELECT MedicineId FROM Medicines
        WHERE MedicineName = N'Augmentin 1g'
    );
    DECLARE @PanadolId INT = (
        SELECT MedicineId FROM Medicines
        WHERE MedicineName = N'Panadol Extra'
    );
    DECLARE @NexiumId INT = (
        SELECT MedicineId FROM Medicines
        WHERE MedicineName = N'Nexium Mups 40mg'
    );
    DECLARE @AmlorId INT = (
        SELECT MedicineId FROM Medicines
        WHERE MedicineName = N'Amlor 5mg'
    );
    DECLARE @VentolinId INT = (
        SELECT MedicineId FROM Medicines
        WHERE MedicineName = N'Ventolin Inhaler'
    );
    DECLARE @GlucophageId INT = (
        SELECT MedicineId FROM Medicines
        WHERE MedicineName = N'Glucophage 850mg'
    );
    DECLARE @CravitId INT = (
        SELECT MedicineId FROM Medicines
        WHERE MedicineName = N'Cravit Ophthalmic 0.5%'
    );
    DECLARE @BeroccaId INT = (
        SELECT MedicineId FROM Medicines
        WHERE MedicineName = N'Berocca Performance'
    );

    INSERT INTO Inventory (
        MedicineId,
        BatchNumber,
        QuantityInStock,
        ExpiryDate
    )
    SELECT
        @AugmentinId,
        N'LOT-AUG-2401',
        450,
        CAST(DATEADD(DAY, 365, GETDATE()) AS DATE)
    WHERE NOT EXISTS (
        SELECT 1 FROM Inventory
        WHERE MedicineId = @AugmentinId
            AND BatchNumber = N'LOT-AUG-2401'
    );

    INSERT INTO Inventory (
        MedicineId,
        BatchNumber,
        QuantityInStock,
        ExpiryDate
    )
    SELECT
        @PanadolId,
        N'LOT-PAN-2309',
        8,
        CAST(DATEADD(DAY, 240, GETDATE()) AS DATE)
    WHERE NOT EXISTS (
        SELECT 1 FROM Inventory
        WHERE MedicineId = @PanadolId
            AND BatchNumber = N'LOT-PAN-2309'
    );

    INSERT INTO Inventory (
        MedicineId,
        BatchNumber,
        QuantityInStock,
        ExpiryDate
    )
    SELECT
        @NexiumId,
        N'LOT-NEX-2402',
        215,
        CAST(DATEADD(DAY, 20, GETDATE()) AS DATE)
    WHERE NOT EXISTS (
        SELECT 1 FROM Inventory
        WHERE MedicineId = @NexiumId
            AND BatchNumber = N'LOT-NEX-2402'
    );

    INSERT INTO Inventory (
        MedicineId,
        BatchNumber,
        QuantityInStock,
        ExpiryDate
    )
    SELECT
        @AmlorId,
        N'LOT-AML-2208',
        0,
        CAST(DATEADD(DAY, 400, GETDATE()) AS DATE)
    WHERE NOT EXISTS (
        SELECT 1 FROM Inventory
        WHERE MedicineId = @AmlorId
            AND BatchNumber = N'LOT-AML-2208'
    );

    INSERT INTO Inventory (
        MedicineId,
        BatchNumber,
        QuantityInStock,
        ExpiryDate
    )
    SELECT
        @VentolinId,
        N'LOT-VEN-2311',
        24,
        CAST(DATEADD(DAY, -20, GETDATE()) AS DATE)
    WHERE NOT EXISTS (
        SELECT 1 FROM Inventory
        WHERE MedicineId = @VentolinId
            AND BatchNumber = N'LOT-VEN-2311'
    );

    INSERT INTO Inventory (
        MedicineId,
        BatchNumber,
        QuantityInStock,
        ExpiryDate
    )
    SELECT
        @GlucophageId,
        N'LOT-GLU-2403',
        180,
        CAST(DATEADD(DAY, 520, GETDATE()) AS DATE)
    WHERE NOT EXISTS (
        SELECT 1 FROM Inventory
        WHERE MedicineId = @GlucophageId
            AND BatchNumber = N'LOT-GLU-2403'
    );

    INSERT INTO Inventory (
        MedicineId,
        BatchNumber,
        QuantityInStock,
        ExpiryDate
    )
    SELECT
        @CravitId,
        N'LOT-CRA-2310',
        60,
        CAST(DATEADD(DAY, 430, GETDATE()) AS DATE)
    WHERE NOT EXISTS (
        SELECT 1 FROM Inventory
        WHERE MedicineId = @CravitId
            AND BatchNumber = N'LOT-CRA-2310'
    );

    INSERT INTO Inventory (
        MedicineId,
        BatchNumber,
        QuantityInStock,
        ExpiryDate
    )
    SELECT
        @BeroccaId,
        N'LOT-BER-2404',
        90,
        CAST(DATEADD(DAY, 260, GETDATE()) AS DATE)
    WHERE NOT EXISTS (
        SELECT 1 FROM Inventory
        WHERE MedicineId = @BeroccaId
            AND BatchNumber = N'LOT-BER-2404'
    );

    COMMIT TRANSACTION;

    SELECT
        (SELECT COUNT(*) FROM MedicineCategories) AS TotalCategories,
        (SELECT COUNT(*) FROM Suppliers) AS TotalSuppliers,
        (SELECT COUNT(*) FROM Medicines) AS TotalMedicines,
        (SELECT COUNT(*) FROM Inventory) AS TotalInventoryBatches;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
    BEGIN
        ROLLBACK TRANSACTION;
    END;

    THROW;
END CATCH;
