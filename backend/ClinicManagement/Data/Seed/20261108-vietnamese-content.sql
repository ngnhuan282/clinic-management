-- Versioned data repair: update only exact legacy values; never reseed or delete records.
SET NOCOUNT ON;
SET XACT_ABORT ON;
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
SET ANSI_PADDING ON;
SET ANSI_WARNINGS ON;
SET ARITHABORT ON;
SET CONCAT_NULL_YIELDS_NULL ON;
SET NUMERIC_ROUNDABORT OFF;

DECLARE @translations TABLE (OldValue nvarchar(400) COLLATE Latin1_General_100_BIN2 PRIMARY KEY, NewValue nvarchar(500));
INSERT INTO @translations (OldValue, NewValue) VALUES
    (N'Nguyen Minh An', N'Nguyễn Minh An'),
    (N'Tran Thu Ha', N'Trần Thu Hà'),
    (N'Le Quang Huy', N'Lê Quang Huy'),
    (N'Chuyen sau sieu am tim va tang huyet ap', N'Chuyên sâu siêu âm tim và tăng huyết áp'),
    (N'Tu van suc khoe tong quat va benh man tinh', N'Tư vấn sức khỏe tổng quát và bệnh mạn tính'),
    (N'Dieu tri viem da co dia, mun va di ung da', N'Điều trị viêm da cơ địa, mụn và dị ứng da'),
    (N'Chuyen khoa ', N'Chuyên khoa '),
    (N'Chuyen khoa mau', N'Chuyên khoa mẫu'),
    (N'Khoa mau cho phong kham', N'Khoa mẫu cho phòng khám'),
    (N'Phong kham ', N'Phòng khám '),
    (N'Kham benh', N'Khám bệnh'),
    (N'Tang ', N'Tầng '),
    (N'Bac si mau ', N'Bác sĩ mẫu '),
    (N'Kham va dieu tri ', N'Khám và điều trị '),
    (N'Demo Administrator', N'Quản trị viên mẫu'),
    (N'Demo Doctor', N'Bác sĩ mẫu'),
    (N'Demo Receptionist', N'Lễ tân mẫu'),
    (N'Demo Lab Technician', N'Kỹ thuật viên xét nghiệm mẫu'),
    (N'Demo Patient ', N'Bệnh nhân mẫu '),
    (N'Demo Pharmacist', N'Dược sĩ mẫu'),
    (N'Kham va tu van suc khoe', N'Khám và tư vấn sức khỏe'),
    (N'Kham dau dau va met moi', N'Khám đau đầu và mệt mỏi'),
    (N'Tai kham huyet ap', N'Tái khám huyết áp'),
    (N'Kham ho va dau hong', N'Khám ho và đau họng'),
    (N'Kham dau bung', N'Khám đau bụng'),
    (N'Vien', N'Viên'),
    (N'Binh', N'Bình'),
    (N'Goi', N'Gói'),
    (N'But', N'Bút'),
    (N'Giam dau ha sot', N'Giảm đau hạ sốt'),
    (N'Khang sinh Penicillin', N'Kháng sinh Penicillin'),
    (N'Dieu tri dai thao duong', N'Điều trị đái tháo đường'),
    (N'Da day', N'Dạ dày'),
    (N'Di ung', N'Dị ứng'),
    (N'Khang viem khong steroid', N'Kháng viêm không steroid'),
    (N'Khang sinh Macrolide', N'Kháng sinh Macrolide'),
    (N'Dieu tri tang huyet ap', N'Điều trị tăng huyết áp'),
    (N'Bu nuoc dien giai', N'Bù nước điện giải'),
    (N'Khang histamine', N'Kháng histamine'),
    (N'Ha lipid mau', N'Hạ lipid máu'),
    (N'Khang sinh Cephalosporin', N'Kháng sinh Cephalosporin'),
    (N'Vitamin tong hop', N'Vitamin tổng hợp'),
    (N'Demo supplier ', N'Nhà cung cấp mẫu '),
    (N'Demo address', N'Địa chỉ nhà cung cấp mẫu'),
    (N'Thuoc mau cho moi truong phat trien', N'Thuốc mẫu cho môi trường phát triển'),
    (N'Phieu mau dang cho xac nhan nhap kho', N'Phiếu mẫu đang chờ xác nhận nhập kho'),
    (N'Phieu mau da nhap kho', N'Phiếu mẫu đã nhập kho'),
    (N'Phieu mau da huy', N'Phiếu mẫu đã hủy'),
    (N'Cong thuc mau', N'Công thức máu'),
    (N'Duong huyet', N'Đường huyết'),
    (N'Mo mau', N'Mỡ máu'),
    (N'Chuc nang gan', N'Chức năng gan'),
    (N'Chuc nang than', N'Chức năng thận'),
    (N'Tong phan nuoc tieu', N'Tổng phân tích nước tiểu'),
    (N'Dien giai do', N'Điện giải đồ'),
    (N'Mau lang', N'Máu lắng'),
    (N'Xet nghiem mau cho phong kham', N'Xét nghiệm trong danh mục dịch vụ của phòng khám.'),
    (N'Tang huyet ap', N'Tăng huyết áp'),
    (N'Dai thao duong type 2', N'Đái tháo đường type 2'),
    (N'Nhiem khuan ho hap tren', N'Nhiễm khuẩn hô hấp trên'),
    (N'Hen phe quan', N'Hen phế quản'),
    (N'Viem da day', N'Viêm dạ dày'),
    (N'Dau lung', N'Đau lưng'),
    (N'Roi loan lipid mau', N'Rối loạn lipid máu'),
    (N'Viem hong cap', N'Viêm họng cấp'),
    (N'Trao nguoc da day', N'Trào ngược dạ dày'),
    (N'Nhiem trung tiet nieu', N'Nhiễm trùng tiết niệu'),
    (N'Viem da co dia', N'Viêm da cơ địa'),
    (N'Viem ket mac', N'Viêm kết mạc'),
    (N'Dau nua dau', N'Đau nửa đầu'),
    (N'Thoai hoa khop goi', N'Thoái hóa khớp gối'),
    (N'Thieu mau thieu sat', N'Thiếu máu thiếu sắt'),
    (N'Viem gan virus man', N'Viêm gan virus mạn'),
    (N'Dau nguc', N'Đau ngực'),
    (N'Dau dau', N'Đau đầu'),
    (N'Tieu chay cap', N'Tiêu chảy cấp'),
    (N'Benh mach vanh', N'Bệnh mạch vành'),
    (N'Chan doan mau cho ho so kham', N'Chẩn đoán mẫu cho hồ sơ khám'),
    (N'Trieu chung can danh gia lan ', N'Triệu chứng cần đánh giá lần '),
    (N'Da kham va huong dan theo doi', N'Đã khám và hướng dẫn theo dõi'),
    (N'Ho, dau hong va met moi trong hai ngay', N'Ho, đau họng và mệt mỏi trong hai ngày'),
    (N'Dau bung nhe sau bua an', N'Đau bụng nhẹ sau bữa ăn'),
    (N'Roi loan tieu hoa nhe, theo doi tai nha', N'Rối loạn tiêu hóa nhẹ, theo dõi tại nhà'),
    (N'Don cho thanh toan de kiem tra khoa cap thuoc.', N'Đơn chờ thanh toán để kiểm tra khóa cấp thuốc.'),
    (N'Uong thuoc dung gio va dung lieu da ke.', N'Uống thuốc đúng giờ và đúng liều đã kê.'),
    (N'Don da thanh toan nhung ton kho chua dap ung.', N'Đơn đã thanh toán nhưng tồn kho chưa đáp ứng.'),
    (N'Don mau da giao thuoc va ghi nhan lo xuat.', N'Đơn mẫu đã giao thuốc và ghi nhận lô xuất.'),
    (N'Sang 1 vien', N'Sáng 1 viên'),
    (N'Toi 1 vien', N'Tối 1 viên'),
    (N'Khi dau 1 vien', N'Khi đau 1 viên'),
    (N'Uong truoc bua sang 30 phut', N'Uống trước bữa sáng 30 phút'),
    (N'Uong sau an', N'Uống sau ăn'),
    (N'Uong sau an toi', N'Uống sau ăn tối'),
    (N'Khong qua lieu chi dinh', N'Không quá liều chỉ định'),
    (N'Chan doan chinh', N'Chẩn đoán chính'),
    (N'Chan doan mau cho luot kham hoan tat hom nay', N'Chẩn đoán mẫu cho lượt khám hoàn tất hôm nay'),
    (N'Kiem tra theo chi dinh bac si', N'Kiểm tra theo chỉ định bác sĩ'),
    (N'Ket qua mau ', N'Kết quả mẫu '),
    (N': trong gioi han tham chieu', N': trong giới hạn tham chiếu'),
    (N'Da kiem tra', N'Đã kiểm tra'),
    (N'Noi tong quat', N'Nội tổng quát'),
    (N'Nhi khoa', N'Nhi khoa'),
    (N'Nhi', N'Nhi khoa'),
    (N'Rang ham mat', N'Răng hàm mặt'),
    (N'Tim mach', N'Tim mạch'),
    (N'Ho hap', N'Hô hấp'),
    (N'Tieu hoa', N'Tiêu hóa'),
    (N'Noi tiet', N'Nội tiết'),
    (N'Da lieu', N'Da liễu'),
    (N'Mat', N'Mắt'),
    (N'Tai mui hong', N'Tai mũi họng'),
    (N'Co xuong khop', N'Cơ xương khớp'),
    (N'Than kinh', N'Thần kinh'),
    (N'San phu khoa', N'Sản phụ khoa'),
    (N'Tiet nieu', N'Tiết niệu'),
    (N'Dinh duong', N'Dinh dưỡng'),
    (N'Y hoc co truyen', N'Y học cổ truyền'),
    (N'Phuc hoi chuc nang', N'Phục hồi chức năng'),
    (N'Cap cuu', N'Cấp cứu'),
    (N'Xet nghiem', N'Xét nghiệm'),
    (N'Chan doan hinh anh', N'Chẩn đoán hình ảnh'),
    (N'Bac si mau 01', N'Bác sĩ mẫu 01'),
    (N'Demo Patient 01', N'Bệnh nhân mẫu 01'),
    (N'Demo supplier 1', N'Nhà cung cấp mẫu 1'),
    (N'Tang 1', N'Tầng 1'),
    (N'Trieu chung can danh gia lan 1', N'Triệu chứng cần đánh giá lần 1'),
    (N'Ket qua mau 01: trong gioi han tham chieu', N'Kết quả mẫu 01: trong giới hạn tham chiếu'),
    (N'Chuyen khoa Noi tong quat', N'Chuyên khoa Nội tổng quát'),
    (N'Phong kham Noi tong quat', N'Phòng khám Nội tổng quát'),
    (N'Kham va dieu tri Noi tong quat', N'Khám và điều trị Nội tổng quát'),
    (N'Bac si mau 02', N'Bác sĩ mẫu 02'),
    (N'Demo Patient 02', N'Bệnh nhân mẫu 02'),
    (N'Demo supplier 2', N'Nhà cung cấp mẫu 2'),
    (N'Tang 2', N'Tầng 2'),
    (N'Trieu chung can danh gia lan 2', N'Triệu chứng cần đánh giá lần 2'),
    (N'Ket qua mau 02: trong gioi han tham chieu', N'Kết quả mẫu 02: trong giới hạn tham chiếu'),
    (N'Chuyen khoa Nhi khoa', N'Chuyên khoa Nhi khoa'),
    (N'Phong kham Nhi khoa', N'Phòng khám Nhi khoa'),
    (N'Kham va dieu tri Nhi khoa', N'Khám và điều trị Nhi khoa'),
    (N'Chuyen khoa Nhi', N'Chuyên khoa Nhi khoa'),
    (N'Phong kham Nhi', N'Phòng khám Nhi khoa'),
    (N'Kham va dieu tri Nhi', N'Khám và điều trị Nhi khoa'),
    (N'Bac si mau 03', N'Bác sĩ mẫu 03'),
    (N'Demo Patient 03', N'Bệnh nhân mẫu 03'),
    (N'Demo supplier 3', N'Nhà cung cấp mẫu 3'),
    (N'Tang 3', N'Tầng 3'),
    (N'Trieu chung can danh gia lan 3', N'Triệu chứng cần đánh giá lần 3'),
    (N'Ket qua mau 03: trong gioi han tham chieu', N'Kết quả mẫu 03: trong giới hạn tham chiếu'),
    (N'Chuyen khoa Rang ham mat', N'Chuyên khoa Răng hàm mặt'),
    (N'Phong kham Rang ham mat', N'Phòng khám Răng hàm mặt'),
    (N'Kham va dieu tri Rang ham mat', N'Khám và điều trị Răng hàm mặt'),
    (N'Bac si mau 04', N'Bác sĩ mẫu 04'),
    (N'Demo Patient 04', N'Bệnh nhân mẫu 04'),
    (N'Demo supplier 4', N'Nhà cung cấp mẫu 4'),
    (N'Tang 4', N'Tầng 4'),
    (N'Trieu chung can danh gia lan 4', N'Triệu chứng cần đánh giá lần 4'),
    (N'Ket qua mau 04: trong gioi han tham chieu', N'Kết quả mẫu 04: trong giới hạn tham chiếu'),
    (N'Chuyen khoa Tim mach', N'Chuyên khoa Tim mạch'),
    (N'Phong kham Tim mach', N'Phòng khám Tim mạch'),
    (N'Kham va dieu tri Tim mach', N'Khám và điều trị Tim mạch'),
    (N'Bac si mau 05', N'Bác sĩ mẫu 05'),
    (N'Demo Patient 05', N'Bệnh nhân mẫu 05'),
    (N'Demo supplier 5', N'Nhà cung cấp mẫu 5'),
    (N'Tang 5', N'Tầng 5'),
    (N'Trieu chung can danh gia lan 5', N'Triệu chứng cần đánh giá lần 5'),
    (N'Ket qua mau 05: trong gioi han tham chieu', N'Kết quả mẫu 05: trong giới hạn tham chiếu'),
    (N'Chuyen khoa Ho hap', N'Chuyên khoa Hô hấp'),
    (N'Phong kham Ho hap', N'Phòng khám Hô hấp'),
    (N'Kham va dieu tri Ho hap', N'Khám và điều trị Hô hấp'),
    (N'Bac si mau 06', N'Bác sĩ mẫu 06'),
    (N'Demo Patient 06', N'Bệnh nhân mẫu 06'),
    (N'Demo supplier 6', N'Nhà cung cấp mẫu 6'),
    (N'Tang 6', N'Tầng 6'),
    (N'Trieu chung can danh gia lan 6', N'Triệu chứng cần đánh giá lần 6'),
    (N'Ket qua mau 06: trong gioi han tham chieu', N'Kết quả mẫu 06: trong giới hạn tham chiếu'),
    (N'Chuyen khoa Tieu hoa', N'Chuyên khoa Tiêu hóa'),
    (N'Phong kham Tieu hoa', N'Phòng khám Tiêu hóa'),
    (N'Kham va dieu tri Tieu hoa', N'Khám và điều trị Tiêu hóa'),
    (N'Bac si mau 07', N'Bác sĩ mẫu 07'),
    (N'Demo Patient 07', N'Bệnh nhân mẫu 07'),
    (N'Demo supplier 7', N'Nhà cung cấp mẫu 7'),
    (N'Tang 7', N'Tầng 7'),
    (N'Trieu chung can danh gia lan 7', N'Triệu chứng cần đánh giá lần 7'),
    (N'Ket qua mau 07: trong gioi han tham chieu', N'Kết quả mẫu 07: trong giới hạn tham chiếu'),
    (N'Chuyen khoa Noi tiet', N'Chuyên khoa Nội tiết'),
    (N'Phong kham Noi tiet', N'Phòng khám Nội tiết'),
    (N'Kham va dieu tri Noi tiet', N'Khám và điều trị Nội tiết'),
    (N'Bac si mau 08', N'Bác sĩ mẫu 08'),
    (N'Demo Patient 08', N'Bệnh nhân mẫu 08'),
    (N'Demo supplier 8', N'Nhà cung cấp mẫu 8'),
    (N'Tang 8', N'Tầng 8'),
    (N'Trieu chung can danh gia lan 8', N'Triệu chứng cần đánh giá lần 8'),
    (N'Ket qua mau 08: trong gioi han tham chieu', N'Kết quả mẫu 08: trong giới hạn tham chiếu'),
    (N'Chuyen khoa Da lieu', N'Chuyên khoa Da liễu'),
    (N'Phong kham Da lieu', N'Phòng khám Da liễu'),
    (N'Kham va dieu tri Da lieu', N'Khám và điều trị Da liễu'),
    (N'Bac si mau 09', N'Bác sĩ mẫu 09'),
    (N'Demo Patient 09', N'Bệnh nhân mẫu 09'),
    (N'Demo supplier 9', N'Nhà cung cấp mẫu 9'),
    (N'Tang 9', N'Tầng 9'),
    (N'Trieu chung can danh gia lan 9', N'Triệu chứng cần đánh giá lần 9'),
    (N'Ket qua mau 09: trong gioi han tham chieu', N'Kết quả mẫu 09: trong giới hạn tham chiếu'),
    (N'Chuyen khoa Mat', N'Chuyên khoa Mắt'),
    (N'Phong kham Mat', N'Phòng khám Mắt'),
    (N'Kham va dieu tri Mat', N'Khám và điều trị Mắt'),
    (N'Bac si mau 10', N'Bác sĩ mẫu 10'),
    (N'Demo Patient 10', N'Bệnh nhân mẫu 10'),
    (N'Demo supplier 10', N'Nhà cung cấp mẫu 10'),
    (N'Tang 10', N'Tầng 10'),
    (N'Trieu chung can danh gia lan 10', N'Triệu chứng cần đánh giá lần 10'),
    (N'Ket qua mau 10: trong gioi han tham chieu', N'Kết quả mẫu 10: trong giới hạn tham chiếu'),
    (N'Chuyen khoa Tai mui hong', N'Chuyên khoa Tai mũi họng'),
    (N'Phong kham Tai mui hong', N'Phòng khám Tai mũi họng'),
    (N'Kham va dieu tri Tai mui hong', N'Khám và điều trị Tai mũi họng'),
    (N'Bac si mau 11', N'Bác sĩ mẫu 11'),
    (N'Demo Patient 11', N'Bệnh nhân mẫu 11'),
    (N'Demo supplier 11', N'Nhà cung cấp mẫu 11'),
    (N'Tang 11', N'Tầng 11'),
    (N'Trieu chung can danh gia lan 11', N'Triệu chứng cần đánh giá lần 11'),
    (N'Ket qua mau 11: trong gioi han tham chieu', N'Kết quả mẫu 11: trong giới hạn tham chiếu'),
    (N'Chuyen khoa Co xuong khop', N'Chuyên khoa Cơ xương khớp'),
    (N'Phong kham Co xuong khop', N'Phòng khám Cơ xương khớp'),
    (N'Kham va dieu tri Co xuong khop', N'Khám và điều trị Cơ xương khớp'),
    (N'Bac si mau 12', N'Bác sĩ mẫu 12'),
    (N'Demo Patient 12', N'Bệnh nhân mẫu 12'),
    (N'Demo supplier 12', N'Nhà cung cấp mẫu 12'),
    (N'Tang 12', N'Tầng 12'),
    (N'Trieu chung can danh gia lan 12', N'Triệu chứng cần đánh giá lần 12'),
    (N'Ket qua mau 12: trong gioi han tham chieu', N'Kết quả mẫu 12: trong giới hạn tham chiếu'),
    (N'Chuyen khoa Than kinh', N'Chuyên khoa Thần kinh'),
    (N'Phong kham Than kinh', N'Phòng khám Thần kinh'),
    (N'Kham va dieu tri Than kinh', N'Khám và điều trị Thần kinh'),
    (N'Bac si mau 13', N'Bác sĩ mẫu 13'),
    (N'Demo Patient 13', N'Bệnh nhân mẫu 13'),
    (N'Demo supplier 13', N'Nhà cung cấp mẫu 13'),
    (N'Tang 13', N'Tầng 13'),
    (N'Trieu chung can danh gia lan 13', N'Triệu chứng cần đánh giá lần 13'),
    (N'Ket qua mau 13: trong gioi han tham chieu', N'Kết quả mẫu 13: trong giới hạn tham chiếu'),
    (N'Chuyen khoa San phu khoa', N'Chuyên khoa Sản phụ khoa'),
    (N'Phong kham San phu khoa', N'Phòng khám Sản phụ khoa'),
    (N'Kham va dieu tri San phu khoa', N'Khám và điều trị Sản phụ khoa'),
    (N'Bac si mau 14', N'Bác sĩ mẫu 14'),
    (N'Demo Patient 14', N'Bệnh nhân mẫu 14'),
    (N'Demo supplier 14', N'Nhà cung cấp mẫu 14'),
    (N'Tang 14', N'Tầng 14'),
    (N'Trieu chung can danh gia lan 14', N'Triệu chứng cần đánh giá lần 14'),
    (N'Ket qua mau 14: trong gioi han tham chieu', N'Kết quả mẫu 14: trong giới hạn tham chiếu'),
    (N'Chuyen khoa Tiet nieu', N'Chuyên khoa Tiết niệu'),
    (N'Phong kham Tiet nieu', N'Phòng khám Tiết niệu'),
    (N'Kham va dieu tri Tiet nieu', N'Khám và điều trị Tiết niệu'),
    (N'Bac si mau 15', N'Bác sĩ mẫu 15'),
    (N'Demo Patient 15', N'Bệnh nhân mẫu 15'),
    (N'Demo supplier 15', N'Nhà cung cấp mẫu 15'),
    (N'Tang 15', N'Tầng 15'),
    (N'Trieu chung can danh gia lan 15', N'Triệu chứng cần đánh giá lần 15'),
    (N'Ket qua mau 15: trong gioi han tham chieu', N'Kết quả mẫu 15: trong giới hạn tham chiếu'),
    (N'Chuyen khoa Dinh duong', N'Chuyên khoa Dinh dưỡng'),
    (N'Phong kham Dinh duong', N'Phòng khám Dinh dưỡng'),
    (N'Kham va dieu tri Dinh duong', N'Khám và điều trị Dinh dưỡng'),
    (N'Bac si mau 16', N'Bác sĩ mẫu 16'),
    (N'Demo Patient 16', N'Bệnh nhân mẫu 16'),
    (N'Demo supplier 16', N'Nhà cung cấp mẫu 16'),
    (N'Tang 16', N'Tầng 16'),
    (N'Trieu chung can danh gia lan 16', N'Triệu chứng cần đánh giá lần 16'),
    (N'Ket qua mau 16: trong gioi han tham chieu', N'Kết quả mẫu 16: trong giới hạn tham chiếu'),
    (N'Chuyen khoa Y hoc co truyen', N'Chuyên khoa Y học cổ truyền'),
    (N'Phong kham Y hoc co truyen', N'Phòng khám Y học cổ truyền'),
    (N'Kham va dieu tri Y hoc co truyen', N'Khám và điều trị Y học cổ truyền'),
    (N'Bac si mau 17', N'Bác sĩ mẫu 17'),
    (N'Demo Patient 17', N'Bệnh nhân mẫu 17'),
    (N'Demo supplier 17', N'Nhà cung cấp mẫu 17'),
    (N'Tang 17', N'Tầng 17'),
    (N'Trieu chung can danh gia lan 17', N'Triệu chứng cần đánh giá lần 17'),
    (N'Ket qua mau 17: trong gioi han tham chieu', N'Kết quả mẫu 17: trong giới hạn tham chiếu'),
    (N'Chuyen khoa Phuc hoi chuc nang', N'Chuyên khoa Phục hồi chức năng'),
    (N'Phong kham Phuc hoi chuc nang', N'Phòng khám Phục hồi chức năng'),
    (N'Kham va dieu tri Phuc hoi chuc nang', N'Khám và điều trị Phục hồi chức năng'),
    (N'Bac si mau 18', N'Bác sĩ mẫu 18'),
    (N'Demo Patient 18', N'Bệnh nhân mẫu 18'),
    (N'Demo supplier 18', N'Nhà cung cấp mẫu 18'),
    (N'Tang 18', N'Tầng 18'),
    (N'Trieu chung can danh gia lan 18', N'Triệu chứng cần đánh giá lần 18'),
    (N'Ket qua mau 18: trong gioi han tham chieu', N'Kết quả mẫu 18: trong giới hạn tham chiếu'),
    (N'Chuyen khoa Cap cuu', N'Chuyên khoa Cấp cứu'),
    (N'Phong kham Cap cuu', N'Phòng khám Cấp cứu'),
    (N'Kham va dieu tri Cap cuu', N'Khám và điều trị Cấp cứu'),
    (N'Bac si mau 19', N'Bác sĩ mẫu 19'),
    (N'Demo Patient 19', N'Bệnh nhân mẫu 19'),
    (N'Demo supplier 19', N'Nhà cung cấp mẫu 19'),
    (N'Tang 19', N'Tầng 19'),
    (N'Trieu chung can danh gia lan 19', N'Triệu chứng cần đánh giá lần 19'),
    (N'Ket qua mau 19: trong gioi han tham chieu', N'Kết quả mẫu 19: trong giới hạn tham chiếu'),
    (N'Chuyen khoa Xet nghiem', N'Chuyên khoa Xét nghiệm'),
    (N'Phong kham Xet nghiem', N'Phòng khám Xét nghiệm'),
    (N'Kham va dieu tri Xet nghiem', N'Khám và điều trị Xét nghiệm'),
    (N'Bac si mau 20', N'Bác sĩ mẫu 20'),
    (N'Demo Patient 20', N'Bệnh nhân mẫu 20'),
    (N'Demo supplier 20', N'Nhà cung cấp mẫu 20'),
    (N'Tang 20', N'Tầng 20'),
    (N'Trieu chung can danh gia lan 20', N'Triệu chứng cần đánh giá lần 20'),
    (N'Ket qua mau 20: trong gioi han tham chieu', N'Kết quả mẫu 20: trong giới hạn tham chiếu'),
    (N'Chuyen khoa Chan doan hinh anh', N'Chuyên khoa Chẩn đoán hình ảnh'),
    (N'Phong kham Chan doan hinh anh', N'Phòng khám Chẩn đoán hình ảnh'),
    (N'Kham va dieu tri Chan doan hinh anh', N'Khám và điều trị Chẩn đoán hình ảnh');

IF COL_LENGTH(N'dbo.Departments', N'Name') IS NOT NULL
    UPDATE target SET [Name] = t.NewValue
    FROM dbo.[Departments] target
    JOIN @translations t ON target.[Name] COLLATE Latin1_General_100_BIN2 = t.OldValue;

IF COL_LENGTH(N'dbo.Departments', N'Description') IS NOT NULL
    UPDATE target SET [Description] = t.NewValue
    FROM dbo.[Departments] target
    JOIN @translations t ON target.[Description] COLLATE Latin1_General_100_BIN2 = t.OldValue;

IF COL_LENGTH(N'dbo.Specializations', N'Name') IS NOT NULL
    UPDATE target SET [Name] = t.NewValue
    FROM dbo.[Specializations] target
    JOIN @translations t ON target.[Name] COLLATE Latin1_General_100_BIN2 = t.OldValue;

IF COL_LENGTH(N'dbo.Specializations', N'Description') IS NOT NULL
    UPDATE target SET [Description] = t.NewValue
    FROM dbo.[Specializations] target
    JOIN @translations t ON target.[Description] COLLATE Latin1_General_100_BIN2 = t.OldValue;

IF COL_LENGTH(N'dbo.Rooms', N'Name') IS NOT NULL
    UPDATE target SET [Name] = t.NewValue
    FROM dbo.[Rooms] target
    JOIN @translations t ON target.[Name] COLLATE Latin1_General_100_BIN2 = t.OldValue;

IF COL_LENGTH(N'dbo.Rooms', N'RoomType') IS NOT NULL
    UPDATE target SET [RoomType] = t.NewValue
    FROM dbo.[Rooms] target
    JOIN @translations t ON target.[RoomType] COLLATE Latin1_General_100_BIN2 = t.OldValue;

IF COL_LENGTH(N'dbo.Rooms', N'Location') IS NOT NULL
    UPDATE target SET [Location] = t.NewValue
    FROM dbo.[Rooms] target
    JOIN @translations t ON target.[Location] COLLATE Latin1_General_100_BIN2 = t.OldValue;

IF COL_LENGTH(N'dbo.Doctors', N'FullName') IS NOT NULL
    UPDATE target SET [FullName] = t.NewValue
    FROM dbo.[Doctors] target
    JOIN @translations t ON target.[FullName] COLLATE Latin1_General_100_BIN2 = t.OldValue
    WHERE (DoctorId BETWEEN 1 AND 3 OR DoctorId BETWEEN 1001 AND 1020);

IF COL_LENGTH(N'dbo.Doctors', N'Biography') IS NOT NULL
    UPDATE target SET [Biography] = t.NewValue
    FROM dbo.[Doctors] target
    JOIN @translations t ON target.[Biography] COLLATE Latin1_General_100_BIN2 = t.OldValue
    WHERE (DoctorId BETWEEN 1 AND 3 OR DoctorId BETWEEN 1001 AND 1020);

IF COL_LENGTH(N'dbo.LabTestTypes', N'Name') IS NOT NULL
    UPDATE target SET [Name] = t.NewValue
    FROM dbo.[LabTestTypes] target
    JOIN @translations t ON target.[Name] COLLATE Latin1_General_100_BIN2 = t.OldValue;

IF COL_LENGTH(N'dbo.LabTestTypes', N'Description') IS NOT NULL
    UPDATE target SET [Description] = t.NewValue
    FROM dbo.[LabTestTypes] target
    JOIN @translations t ON target.[Description] COLLATE Latin1_General_100_BIN2 = t.OldValue;

IF COL_LENGTH(N'dbo.MedicineCategories', N'CategoryName') IS NOT NULL
    UPDATE target SET [CategoryName] = t.NewValue
    FROM dbo.[MedicineCategories] target
    JOIN @translations t ON target.[CategoryName] COLLATE Latin1_General_100_BIN2 = t.OldValue;

IF COL_LENGTH(N'dbo.Medicines', N'Unit') IS NOT NULL
    UPDATE target SET [Unit] = t.NewValue
    FROM dbo.[Medicines] target
    JOIN @translations t ON target.[Unit] COLLATE Latin1_General_100_BIN2 = t.OldValue;

IF COL_LENGTH(N'dbo.Medicines', N'Description') IS NOT NULL
    UPDATE target SET [Description] = t.NewValue
    FROM dbo.[Medicines] target
    JOIN @translations t ON target.[Description] COLLATE Latin1_General_100_BIN2 = t.OldValue;

IF COL_LENGTH(N'dbo.Diseases', N'DiseaseName') IS NOT NULL
    UPDATE target SET [DiseaseName] = t.NewValue
    FROM dbo.[Diseases] target
    JOIN @translations t ON target.[DiseaseName] COLLATE Latin1_General_100_BIN2 = t.OldValue;

IF COL_LENGTH(N'dbo.Diseases', N'Description') IS NOT NULL
    UPDATE target SET [Description] = t.NewValue
    FROM dbo.[Diseases] target
    JOIN @translations t ON target.[Description] COLLATE Latin1_General_100_BIN2 = t.OldValue;

IF COL_LENGTH(N'dbo.Users', N'FullName') IS NOT NULL
    UPDATE target SET [FullName] = t.NewValue
    FROM dbo.[Users] target
    JOIN @translations t ON target.[FullName] COLLATE Latin1_General_100_BIN2 = t.OldValue
    WHERE (UserId BETWEEN 1001 AND 1021 AND (Username = 'admin' OR Username LIKE 'demo[_]%'));

IF COL_LENGTH(N'dbo.Patients', N'FullName') IS NOT NULL
    UPDATE target SET [FullName] = t.NewValue
    FROM dbo.[Patients] target
    JOIN @translations t ON target.[FullName] COLLATE Latin1_General_100_BIN2 = t.OldValue
    WHERE (PatientId BETWEEN 1001 AND 1021);

IF COL_LENGTH(N'dbo.Appointments', N'PatientName') IS NOT NULL
    UPDATE target SET [PatientName] = t.NewValue
    FROM dbo.[Appointments] target
    JOIN @translations t ON target.[PatientName] COLLATE Latin1_General_100_BIN2 = t.OldValue
    WHERE (AppointmentId BETWEEN 1001 AND 1028);

IF COL_LENGTH(N'dbo.Appointments', N'Reason') IS NOT NULL
    UPDATE target SET [Reason] = t.NewValue
    FROM dbo.[Appointments] target
    JOIN @translations t ON target.[Reason] COLLATE Latin1_General_100_BIN2 = t.OldValue
    WHERE (AppointmentId BETWEEN 1001 AND 1028);

IF COL_LENGTH(N'dbo.MedicalRecords', N'Symptoms') IS NOT NULL
    UPDATE target SET [Symptoms] = t.NewValue
    FROM dbo.[MedicalRecords] target
    JOIN @translations t ON target.[Symptoms] COLLATE Latin1_General_100_BIN2 = t.OldValue
    WHERE (MedicalRecordId BETWEEN 1001 AND 1028);

IF COL_LENGTH(N'dbo.MedicalRecords', N'Conclusion') IS NOT NULL
    UPDATE target SET [Conclusion] = t.NewValue
    FROM dbo.[MedicalRecords] target
    JOIN @translations t ON target.[Conclusion] COLLATE Latin1_General_100_BIN2 = t.OldValue
    WHERE (MedicalRecordId BETWEEN 1001 AND 1028);

IF COL_LENGTH(N'dbo.PrescriptionDetails', N'Dosage') IS NOT NULL
    UPDATE target SET [Dosage] = t.NewValue
    FROM dbo.[PrescriptionDetails] target
    JOIN @translations t ON target.[Dosage] COLLATE Latin1_General_100_BIN2 = t.OldValue
    WHERE (PrescriptionDetailId BETWEEN 1001 AND 1028);

IF COL_LENGTH(N'dbo.PrescriptionDetails', N'Instructions') IS NOT NULL
    UPDATE target SET [Instructions] = t.NewValue
    FROM dbo.[PrescriptionDetails] target
    JOIN @translations t ON target.[Instructions] COLLATE Latin1_General_100_BIN2 = t.OldValue
    WHERE (PrescriptionDetailId BETWEEN 1001 AND 1028);

IF COL_LENGTH(N'dbo.Prescriptions', N'Notes') IS NOT NULL
    UPDATE target SET [Notes] = t.NewValue
    FROM dbo.[Prescriptions] target
    JOIN @translations t ON target.[Notes] COLLATE Latin1_General_100_BIN2 = t.OldValue
    WHERE (PrescriptionId BETWEEN 1001 AND 1028);

IF COL_LENGTH(N'dbo.PurchaseOrders', N'Notes') IS NOT NULL
    UPDATE target SET [Notes] = t.NewValue
    FROM dbo.[PurchaseOrders] target
    JOIN @translations t ON target.[Notes] COLLATE Latin1_General_100_BIN2 = t.OldValue
    WHERE (PurchaseOrderId BETWEEN 1001 AND 1028);

IF COL_LENGTH(N'dbo.RecordDiagnoses', N'Note') IS NOT NULL
    UPDATE target SET [Note] = t.NewValue
    FROM dbo.[RecordDiagnoses] target
    JOIN @translations t ON target.[Note] COLLATE Latin1_General_100_BIN2 = t.OldValue
    WHERE (RecordDiagnosisId BETWEEN 1001 AND 1028);

IF COL_LENGTH(N'dbo.LabTests', N'ClinicalDiagnosis') IS NOT NULL
    UPDATE target SET [ClinicalDiagnosis] = t.NewValue
    FROM dbo.[LabTests] target
    JOIN @translations t ON target.[ClinicalDiagnosis] COLLATE Latin1_General_100_BIN2 = t.OldValue
    WHERE (Id BETWEEN 1001 AND 1028);

IF COL_LENGTH(N'dbo.LabTestResults', N'ResultSummary') IS NOT NULL
    UPDATE target SET [ResultSummary] = t.NewValue
    FROM dbo.[LabTestResults] target
    JOIN @translations t ON target.[ResultSummary] COLLATE Latin1_General_100_BIN2 = t.OldValue
    WHERE (Id BETWEEN 1001 AND 1028);

IF COL_LENGTH(N'dbo.LabTestResults', N'Note') IS NOT NULL
    UPDATE target SET [Note] = t.NewValue
    FROM dbo.[LabTestResults] target
    JOIN @translations t ON target.[Note] COLLATE Latin1_General_100_BIN2 = t.OldValue
    WHERE (Id BETWEEN 1001 AND 1028);

IF COL_LENGTH(N'dbo.Suppliers', N'SupplierName') IS NOT NULL
    UPDATE target SET [SupplierName] = t.NewValue
    FROM dbo.[Suppliers] target
    JOIN @translations t ON target.[SupplierName] COLLATE Latin1_General_100_BIN2 = t.OldValue
    WHERE (SupplierId BETWEEN 1001 AND 1020);

IF COL_LENGTH(N'dbo.Suppliers', N'Address') IS NOT NULL
    UPDATE target SET [Address] = t.NewValue
    FROM dbo.[Suppliers] target
    JOIN @translations t ON target.[Address] COLLATE Latin1_General_100_BIN2 = t.OldValue
    WHERE (SupplierId BETWEEN 1001 AND 1020);

DECLARE @specialties TABLE (Code varchar(30) PRIMARY KEY, Summary nvarchar(500));
INSERT INTO @specialties VALUES
    ('NOI', N'Khám và đánh giá sức khỏe tổng thể, tiếp nhận các triệu chứng chưa rõ chuyên khoa và theo dõi bệnh nội khoa thường gặp. Bác sĩ kết hợp tiền sử bệnh, thăm khám và kết quả cận lâm sàng để định hướng chăm sóc, tái khám hoặc chuyển chuyên khoa khi cần.'),
    ('NHI', N'Chăm sóc sức khỏe trẻ em, khám các bệnh thường gặp và theo dõi sự phát triển thể chất. Nội dung thăm khám có thể gồm vấn đề hô hấp, tiêu hóa, dinh dưỡng và hướng dẫn chăm sóc phù hợp với từng giai đoạn phát triển của trẻ.'),
    ('RHM', N'Khám và đánh giá các vấn đề về răng, nướu và vùng hàm mặt; tư vấn vệ sinh răng miệng và theo dõi sức khỏe răng định kỳ. Bác sĩ trao đổi về tình trạng răng miệng, nhu cầu chăm sóc và hướng xử trí phù hợp sau khi thăm khám.'),
    ('TIM', N'Khám và theo dõi các bệnh lý tim mạch như tăng huyết áp, rối loạn lipid máu, bệnh mạch vành và rối loạn nhịp tim. Đánh giá triệu chứng, yếu tố nguy cơ và kết quả thăm dò giúp bác sĩ xây dựng kế hoạch chăm sóc phù hợp.'),
    ('HOHAP', N'Khám các vấn đề đường hô hấp như ho kéo dài, khò khè, hen phế quản và bệnh phổi tắc nghẽn mạn tính. Việc thăm khám kết hợp khai thác yếu tố dị ứng, môi trường sống và các kết quả thăm dò chức năng hô hấp đã có.'),
    ('TIEUHOA', N'Khám các bệnh lý đường tiêu hóa, gan và mật; đánh giá đau bụng, rối loạn tiêu hóa, trào ngược và các vấn đề gan mạn tính. Bác sĩ xem xét tiền sử, kết quả xét nghiệm, siêu âm hoặc nội soi để định hướng theo dõi.'),
    ('NOITIET', N'Khám và theo dõi rối loạn nội tiết, chuyển hóa như đái tháo đường, bệnh tuyến giáp và rối loạn lipid máu. Việc theo dõi lâu dài dựa trên triệu chứng, diễn biến chỉ số xét nghiệm và đáp ứng của từng người bệnh.'),
    ('DALIEU', N'Khám các vấn đề về da, tóc và móng; đánh giá tổn thương da, ngứa và những thay đổi kéo dài hoặc tái phát. Bác sĩ ghi nhận diễn biến, sản phẩm đang sử dụng và yếu tố tiếp xúc để tư vấn chăm sóc phù hợp.'),
    ('MAT', N'Khám và kiểm tra sức khỏe mắt, tiếp nhận các vấn đề về thị lực, khó chịu ở mắt và nhu cầu theo dõi định kỳ. Thông tin về kính đang sử dụng, bệnh nền và kết quả khám trước giúp bác sĩ đánh giá tình trạng hiện tại.'),
    ('TMH', N'Khám các vấn đề tại tai, mũi, xoang và họng, bao gồm tình trạng khó chịu kéo dài hoặc tái phát. Bác sĩ đánh giá triệu chứng, khả năng nghe, giọng nói và tiền sử điều trị để định hướng thăm khám phù hợp.'),
    ('CXYK', N'Khám và theo dõi các bệnh lý cơ, xương, khớp như thoái hóa khớp, gout, viêm khớp và loãng xương. Việc đánh giá kết hợp mức độ đau, khả năng vận động và kết quả xét nghiệm hoặc chẩn đoán hình ảnh.'),
    ('THANKINH', N'Khám và đánh giá các triệu chứng liên quan đến hệ thần kinh; theo dõi những thay đổi về cảm giác, vận động và sinh hoạt. Bác sĩ kết hợp tiền sử, thăm khám và kết quả cận lâm sàng để định hướng chăm sóc hoặc khám chuyên khoa sâu hơn.'),
    ('SAN', N'Chăm sóc sức khỏe phụ nữ, khám và theo dõi thai kỳ, đánh giá các bệnh lý phụ khoa và sức khỏe sinh sản. Nội dung thăm khám được trao đổi theo độ tuổi, tiền sử và nhu cầu riêng của từng người bệnh.'),
    ('NIEU', N'Khám và đánh giá các vấn đề của hệ tiết niệu, tiếp nhận thay đổi khi đi tiểu và nhu cầu theo dõi bệnh đã được chẩn đoán. Bác sĩ đối chiếu triệu chứng, kết quả xét nghiệm nước tiểu và chẩn đoán hình ảnh khi có.'),
    ('DINHDUONG', N'Đánh giá tình trạng dinh dưỡng theo độ tuổi, thể trạng và nhu cầu sức khỏe; trao đổi về chế độ ăn và thói quen sinh hoạt. Nội dung tư vấn dựa trên thông tin ăn uống, diễn biến cân nặng và bệnh nền của từng người.'),
    ('YHCT', N'Thăm khám và tư vấn chăm sóc sức khỏe theo y học cổ truyền, kết hợp xem xét bệnh sử và các phương pháp đang điều trị. Bác sĩ đánh giá thể trạng, nhu cầu của người bệnh và khả năng phối hợp với các chuyên khoa liên quan.'),
    ('PHCN', N'Đánh giá chức năng vận động và mức độ ảnh hưởng đến sinh hoạt, từ đó trao đổi mục tiêu phục hồi phù hợp. Bác sĩ xem xét tình trạng sau chấn thương, sau điều trị hoặc hạn chế vận động để xây dựng kế hoạch theo dõi.'),
    ('CAPCUU', N'Tiếp nhận và đánh giá ban đầu những tình trạng cần hỗ trợ y tế khẩn, ưu tiên theo mức độ nghiêm trọng. Thông tin người bệnh, bệnh nền, thuốc đang dùng và diễn biến gần nhất giúp nhân viên y tế phối hợp xử trí hoặc chuyển tuyến.'),
    ('XETNGHIEM', N'Cung cấp thông tin cận lâm sàng phục vụ đánh giá sức khỏe, hỗ trợ chẩn đoán và theo dõi điều trị. Các nhóm xét nghiệm thường liên quan đến huyết học, sinh hóa, miễn dịch và nước tiểu; danh mục, chi phí được công bố ở trang dịch vụ.'),
    ('CDHA', N'Sử dụng hình ảnh y học để hỗ trợ đánh giá cấu trúc cơ thể, chẩn đoán và theo dõi điều trị. Các nhóm kỹ thuật gồm siêu âm, X-quang và những thăm dò chuyên sâu theo chỉ định; dịch vụ thực hiện được xác nhận khi đăng ký.');

UPDATE d SET Description = s.Summary
FROM dbo.Departments d JOIN @specialties s ON d.Code = s.Code
WHERE d.Description IS NULL OR LTRIM(RTRIM(d.Description)) = N''
    OR d.Description COLLATE Latin1_General_100_BIN2 IN (N'Khoa mau cho phong kham', N'Khoa mẫu cho phòng khám');

UPDATE sp SET Description = s.Summary
FROM dbo.Specializations sp JOIN dbo.Departments d ON sp.DepartmentId = d.DepartmentId
JOIN @specialties s ON d.Code = s.Code
WHERE sp.Description IS NULL OR LTRIM(RTRIM(sp.Description)) = N''
    OR sp.Description COLLATE Latin1_General_100_BIN2 IN (N'Chuyen khoa mau', N'Chuyên khoa mẫu');
