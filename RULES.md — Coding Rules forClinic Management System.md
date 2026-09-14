# Clinic Management System — Development Rules

> Project: Clinic Management System  
> Backend: ASP.NET Core 8 Web API + Entity Framework Core + SQL Server  
> Frontend: React + JavaScript (JSX) + Vite + MUI  
> Authentication: Custom Users/Roles + JWT Bearer  
> Password Hashing: BCrypt  
> Realtime: SignalR  
> API documentation: Swagger / OpenAPI

---

# 1. GENERAL RULES

## 1.1. Ngôn ngữ

- Code: English.
- Variable, class, method, property, endpoint: English.
- Comment chỉ viết khi cần giải thích logic không hiển nhiên.
- UI text có thể dùng Vietnamese hoặc English theo design thống nhất của project.

## 1.2. Code style

- Ưu tiên code rõ ràng, dễ đọc hơn code ngắn.
- Không viết code quá dài trong một method.
- Không lặp lại logic ở nhiều nơi nếu có thể tái sử dụng.
- Không commit code debug.
- Không commit password, token, API key hoặc secret.
- Không hard-code dữ liệu nghiệp vụ nếu dữ liệu phải lấy từ database.

## 1.3. Không over-engineering

Không tự ý thêm:

- Microservice
- CQRS phức tạp
- Event Sourcing
- Message Broker
- Repository abstraction không cần thiết
- Design Pattern chỉ để "cho đẹp"

Chỉ thêm khi project thực sự cần.

---

# 2. PROJECT STRUCTURE

## 2.1. Root

```text
ClinicManagement/
│
├── Backend/
│   └── ClinicManagement.API/
│
├── Frontend/
│   └── clinic-management-client/
│
├── Tests/
│
├── Docs/
│
├── .gitignore
├── README.md
└── docker-compose.yml
```

## 2.2. Backend

```text
ClinicManagement/
│
├── Commons/
│   ├── ApiResponse.cs
│   ├── RoleConstants.cs
│   └── ClaimConstants.cs
├── Configurations/
│   ├── JwtSettings.cs
│   ├── JwtConfiguration.cs
│   ├── SwaggerConfiguration.cs
│   ├── CorsConfiguration.cs
│   └── DependencyInjection.cs
├── Controllers/
├── Services/
│   ├── Interfaces/
│   └── Implementations/
├── Repositories/
│   ├── Interfaces/
│   └── Implementations/
├── Data/
│   ├── Entities/
│   ├── Configurations/
│   └── Migrations/
├── DTOs/
│   ├── Requests/
│   └── Responses/
├── Validators/
├── Exceptions/
├── Helpers/
├── Hubs/
├── Mappings/
├── Program.cs
└── appsettings.json
```

## 2.3. Frontend

```text
src/
│
├── api/
├── layouts/
├── components/
│   ├── patient/
│   └── internal/
├── pages/
│   ├── patient/
│   └── internal/
│       ├── admin/
│       ├── doctor/
│       └── receptionist/
├── features/
├── hooks/
├── routes/
├── validators/
├── utils/
├── services/
├── store/
├── App.jsx
└── main.jsx
```

---

# 3. NAMING CONVENTION

# 3.1. Backend C#

## Classes

PascalCase:

```csharp
AppointmentService
AppointmentRepository
CreateAppointmentRequest
AppointmentResponse
```

## Methods

PascalCase:

```csharp
GetByIdAsync()
CreateAsync()
UpdateAsync()
DeleteAsync()
GetAvailableSlotsAsync()
```

## Variables

camelCase:

```csharp
appointment
patientId
doctorSchedule
```

## Private fields

```csharp
private readonly IAppointmentRepository _appointmentRepository;
```

## Interfaces

Prefix `I`:

```csharp
IAppointmentService
IAppointmentRepository
INotificationService
```

## Async methods

Method có asynchronous operation phải kết thúc bằng:

```text
Async
```

Ví dụ:

```csharp
GetByIdAsync()
CreateAsync()
DeleteAsync()
```

## Boolean

Tên boolean phải thể hiện rõ ý nghĩa:

```csharp
IsActive
IsRead
IsPaid
HasPermission
```

Không dùng:

```csharp
Active
Read
Paid
```

---

# 3.2. Frontend JavaScript

## Components

PascalCase, dùng đuôi `.jsx` cho component có JSX:

```text
AppointmentTable.jsx
BookingForm.jsx
PatientProfile.jsx
NotificationBell.jsx
```

## Hooks

Prefix `use`, dùng đuôi `.js`:

```text
useAuth.js
useAppointments.js
usePagination.js
useSignalR.js
```

## API files

camelCase, dùng đuôi `.js`:

```text
appointmentApi.js
doctorApi.js
patientApi.js
invoiceApi.js
```

## Data models / shapes

Dùng JSDoc để document data shape khi cần:

```js
/**
 * @typedef {Object} Appointment
 * @property {number} appointmentId
 * @property {string} patientName
 * @property {string} doctorName
 * @property {string} appointmentDate
 * @property {string} status
 */
```

## Variables / functions

camelCase:

```js
appointment
doctorId
fetchAppointments()
handleSubmit()
```

---

# 4. DATABASE / ENTITY RULES

Entity phải nằm trong:

```text
Data/Entities/
```

Tên Entity dùng số ít:

```text
User
Role
Doctor
Patient
Appointment
MedicalRecord
Medicine
Invoice
Payment
```

Không dùng:

```text
Users.cs
Doctors.cs
Appointments.cs
```

## Primary Key

Theo convention:

```csharp
public int AppointmentId { get; set; }
```

## Foreign Key

```csharp
public int DoctorId { get; set; }
public Doctor Doctor { get; set; }
```

## Nullable

Chỉ nullable khi nghiệp vụ cho phép.

```csharp
public string? Notes { get; set; }
```

Không sử dụng nullable tùy tiện để "cho hết lỗi".

## Decimal

Tiền phải dùng:

```csharp
decimal
```

Không dùng:

```csharp
float
double
```

Ví dụ:

```csharp
public decimal UnitPrice { get; set; }
public decimal TotalAmount { get; set; }
```

## Date / Time

Không lưu ngày giờ bằng string.

Sai:

```csharp
public string AppointmentDate { get; set; }
```

Ưu tiên:

```csharp
DateTime
DateOnly
TimeOnly
```

tùy nghiệp vụ.

---

# 5. ENTITY CONFIGURATION

Không nhét quá nhiều database configuration vào Entity.

Ưu tiên:

```text
Data/
└── Configurations/
```

Ví dụ:

```text
AppointmentConfiguration.cs
DoctorConfiguration.cs
PatientConfiguration.cs
InvoiceConfiguration.cs
```

Dùng Fluent API cho:

- Primary key
- Foreign key
- Index
- Unique constraint
- Decimal precision
- MaxLength
- Relationship
- Delete behavior

Ví dụ:

```csharp
builder.HasIndex(x => new
{
    x.DoctorId,
    x.AppointmentDate,
    x.TimeSlot
})
.IsUnique();
```

Các business constraint quan trọng phải được bảo vệ ở database khi phù hợp.

---

# 6. CONTROLLER RULES

Controller chỉ chịu trách nhiệm:

1. Nhận HTTP request.
2. Validate request ở mức API.
3. Gọi Service.
4. Trả HTTP response.

Controller không được chứa business logic phức tạp.

Không viết:

```csharp
if (existingAppointment != null)
{
    // complex business logic
}
```

trong Controller.

Thay vào đó:

```text
Controller
    ↓
Service
    ↓
Repository
```

## Controller naming

```text
AppointmentsController
DoctorsController
PatientsController
InvoicesController
```

## Route convention

```text
/api/appointments
/api/doctors
/api/patients
/api/invoices
```

Không sử dụng route tùy tiện:

```text
/api/getAllAppointments
/api/createNewAppointment
```

HTTP method phải thể hiện hành động CRUD:

```text
GET
POST
PUT
PATCH
DELETE
```

---

# 7. SERVICE RULES

Service là nơi xử lý business logic.

Ví dụ AppointmentService:

```text
- Check doctor
- Check patient
- Check schedule
- Check duplicated appointment
- Create appointment
- Trigger notification
```

Business Service không được chứa HTTP-specific logic.

Không sử dụng trực tiếp:

```csharp
HttpContext
Ok()
BadRequest()
NotFound()
```

trong Business Service.

Ngoại lệ: infrastructure service như `CurrentUserService` được phép sử dụng `IHttpContextAccessor` để đọc authenticated user claims.

Business Service cần thông tin user hiện tại phải inject:

```csharp
ICurrentUserService
```

thay vì truy cập `HttpContext` trực tiếp.

## Service naming

```text
AppointmentService
DoctorService
PatientService
PrescriptionService
InvoiceService
```

Interface:

```text
IAppointmentService
IDoctorService
IPatientService
```

---

# 8. REPOSITORY RULES

Repository chịu trách nhiệm truy cập database.

Ví dụ:

```text
AppointmentRepository
MedicineRepository
InventoryRepository
InvoiceRepository
```

Repository được phép chứa:

- EF Core query
- Include
- Where
- OrderBy
- Pagination query
- Projection
- Specialized database query

Repository không xử lý business workflow.

Sai:

```text
Repository
→ check appointment
→ create invoice
→ send notification
```

Đúng:

```text
Service
→ business workflow

Repository
→ data access
```

---

# 9. DTO RULES

Không return Entity trực tiếp từ Controller.

Luôn dùng DTO.

## Request DTO

```text
DTOs/
└── Requests/
```

Ví dụ:

```text
CreateAppointmentRequest.cs
UpdateAppointmentRequest.cs
LoginRequest.cs
CreatePrescriptionRequest.cs
```

## Response DTO

```text
DTOs/
└── Responses/
```

Ví dụ:

```text
AppointmentResponse.cs
DoctorResponse.cs
PatientResponse.cs
InvoiceResponse.cs
```

Nếu response khác nhau theo use case thì tạo DTO riêng.

Không tạo một DTO khổng lồ dùng cho mọi API.

---

# 10. MAPPING RULES

Entity ↔ DTO phải được mapping ở:

```text
Mappings/
```

Nếu project sử dụng AutoMapper:

```text
AutoMapperProfile.cs
```

Không map thủ công lặp lại ở nhiều Controller.

Sai:

```csharp
var response = new AppointmentResponse
{
    ...
};
```

lặp ở nhiều nơi.

Ưu tiên centralized mapping.

---

# 11. VALIDATION RULES

Validation của Request phải tách khỏi Controller.

Thư mục:

```text
Validators/
```

Ví dụ:

```text
AppointmentValidator.cs
PrescriptionValidator.cs
LoginValidator.cs
```

Các validation như:

```text
Required
Maximum length
Email format
Quantity > 0
Date not in the past
```

đưa vào Validator.

Business rule phức tạp vẫn thuộc Service.

Phân biệt:

```text
Validation
→ dữ liệu input hợp lệ?

Business Rule
→ nghiệp vụ có được phép thực hiện?
```

---

# 12. EXCEPTION RULES

Không sử dụng `try/catch` lặp lại ở mọi Controller.

Project sử dụng centralized exception handling:

```text
Exceptions/
├── ErrorCode.cs
├── AppException.cs
└── GlobalExceptionHandler.cs
```

Lỗi nghiệp vụ phải dùng `AppException` với `ErrorCode` tương ứng.

Ví dụ:

```csharp
throw new AppException(
    ErrorCode.APPOINTMENT_CONFLICT
);
```

Không dùng các exception chung như sau cho lỗi nghiệp vụ đã có `ErrorCode`:

```csharp
throw new Exception("...");
throw new KeyNotFoundException("...");
```

`GlobalExceptionHandler` chịu trách nhiệm chuyển exception thành HTTP response thống nhất.

Không tạo thêm một hệ exception riêng như `NotFoundException`, `BusinessRuleException` nếu chưa được team thống nhất.

Frontend phải xử lý error theo format `ApiResponse` thống nhất.

---

# 13. API RESPONSE RULES

Response phải thống nhất thông qua:

```csharp
ApiResponse<T>
```

Success:

```json
{
  "code": 1000,
  "message": "Success",
  "result": {}
}
```

Error:

```json
{
  "code": 5002,
  "message": "The doctor already has an appointment at this time",
  "result": null
}
```

Quy ước mã lỗi hiện tại:

```text
1000 = Success
1xxx = Common / Authentication
2xxx = User / Auth
3xxx = Doctor
4xxx = Patient
5xxx = Appointment
...
9999 = Uncategorized exception
```

Mỗi `ErrorCode` phải có mã duy nhất.

Không để mỗi Controller trả một format khác nhau.

Frontend đọc dữ liệu nghiệp vụ từ:

```js
response.data.result
```

---

# 14. PAGINATION RULES

API list lớn phải hỗ trợ pagination.

Pagination dùng chung:

```text
pageNumber
pageSize
```

Ví dụ:

```text
GET /api/appointments?pageNumber=1&pageSize=10
```

`PaginationRequest` chịu trách nhiệm chuẩn hóa `PageNumber` và `PageSize`; `PageSize` không được vượt quá giới hạn chung của hệ thống.

Các filter riêng như:

```text
search
sortBy
sortOrder
status
doctorId
```

phải đặt trong request/filter DTO của từng domain, không nhét toàn bộ vào `PaginationRequest`.

Không trả toàn bộ hàng nghìn records về frontend.

Response phân trang phải được bọc trong `ApiResponse<PagedResponse<T>>` và có dạng:

```json
{
  "code": 1000,
  "message": "Success",
  "result": {
    "items": [],
    "pageNumber": 1,
    "pageSize": 10,
    "totalItems": 100,
    "totalPages": 10,
    "hasPreviousPage": false,
    "hasNextPage": true
  }
}
```

Query dùng `Skip()` / `Take()` phải có thứ tự ổn định bằng `OrderBy()` phù hợp.

---

# 15. EF CORE RULES

Ưu tiên async:

```csharp
await context.Appointments
    .Where(...)
    .ToListAsync();
```

Không dùng synchronous query trong API nếu không cần.

Tránh N+1 query.

Dùng:

```csharp
Include()
ThenInclude()
Select()
```

phù hợp.

Chỉ sử dụng tracking khi cần update entity.

Với read-only query có thể dùng:

```csharp
AsNoTracking()
```

---

# 16. TRANSACTION RULES

Các nghiệp vụ liên quan nhiều table phải sử dụng transaction khi cần.

Ví dụ tạo invoice:

```text
Create Invoice
+
Create Invoice Details
+
Create Payment
+
Update Invoice Status
```

Không để workflow quan trọng cập nhật một nửa rồi fail một nửa.

---

# 17. JWT / AUTHENTICATION RULES

Project sử dụng Custom `Users` / `Roles` + JWT Bearer, không sử dụng ASP.NET Core Identity để quản lý bảng user/role.

JWT phải được xử lý tập trung qua các service/configuration dùng chung.

API yêu cầu authentication phải sử dụng:

```csharp
[Authorize]
```

Role-specific API phải dùng `RoleConstants`, không hard-code role string trực tiếp.

Ví dụ:

```csharp
[Authorize(Roles = RoleConstants.Doctor)]
```

Nhiều role:

```csharp
[Authorize(
    Roles = RoleConstants.Admin
        + ","
        + RoleConstants.Receptionist
)]
```

Không tự viết kiểm tra role thủ công ở mọi method nếu ASP.NET Authorization đã đáp ứng.

Role dùng thống nhất:

```text
Admin
Doctor
Receptionist
Patient
```

Không tạo variation:

```text
ADMIN
admin
doctor
DOCTOR
```

Password phải được hash thông qua:

```csharp
IPasswordHasherService
```

Implementation hiện tại sử dụng BCrypt.

Business service không gọi `BCrypt.Net.BCrypt` trực tiếp; mọi hash/verify password phải đi qua `IPasswordHasherService`.

Access Token được tạo qua `IJwtTokenGenerator`.

Refresh Token phải được sinh bằng cryptographically secure random generator, không dùng JWT thứ hai làm refresh token.

Không log hoặc trả JWT secret, password hay refresh token vào log.

---

# 18. SIGNALR RULES

SignalR chỉ được dùng cho những sự kiện cần real-time.

Ví dụ:

```text
AppointmentCreated
AppointmentConfirmed
PatientCheckedIn
LabResultCompleted
InvoiceCreated
PaymentCompleted
```

Không dùng SignalR cho mọi API.

Backend:

```text
Hubs/NotificationHub.cs
```

Frontend:

```text
services/signalrService.js
```

Event name phải được thống nhất giữa BE và FE.

Ví dụ:

```text
AppointmentCreated
```

Không chỗ này dùng:

```text
appointment_created
```

chỗ khác:

```text
NewAppointment
```

---

# 19. FRONTEND ARCHITECTURE

Frontend phải tách:

```text
Page
↓
Component / Hook
↓
API
↓
Backend
```

Page không nên gọi Axios trực tiếp quá nhiều.

Sai:

```jsx
axios.get(...)
axios.post(...)
```

rải trong hàng chục component.

Ưu tiên:

```text
pages
→ hooks
→ api
```

---

# 20. AXIOS RULES

Tạo một Axios instance duy nhất:

```text
src/api/axiosClient.js
```

Mọi API call dùng instance này.

Không viết:

```js
axios.create(...)
```

ở nhiều file.

JWT interceptor cũng đặt tập trung.

Ví dụ:

```text
axiosClient
├── baseURL
├── Authorization
├── response error handling
└── refresh token handling
```

---

# 21. FRONTEND API MODULES

API phải chia theo domain:

```text
api/
├── authApi.js
├── appointmentApi.js
├── doctorApi.js
├── patientApi.js
├── prescriptionApi.js
├── medicineApi.js
├── inventoryApi.js
├── labTestApi.js
├── invoiceApi.js
├── paymentApi.js
└── reportApi.js
```

Không tạo:

```text
api.ts
```

rồi nhét toàn bộ endpoint vào một file.

---

# 22. REACT COMPONENT RULES

Component phải có một responsibility rõ ràng.

Không tạo component 1.000 dòng.

Nếu component quá lớn, tách:

```text
BookingPage
├── DoctorSelector
├── DateSelector
├── TimeSlotPicker
├── BookingSummary
└── BookingForm
```

Reusable component:

```text
components/
├── common/
└── internal/
```

Không copy-paste cùng một Table/Button/Dialog ở nhiều page.

---

# 23. PAGE RULES

Page chịu trách nhiệm:

- Layout của page
- Compose components
- Gọi hooks
- Điều phối UI

Không nhét toàn bộ business logic vào page.

---

# 24. HOOK RULES

Custom hook dùng cho:

- Data fetching
- Form logic
- Reusable state logic
- Auth
- Pagination
- SignalR

Ví dụ:

```text
useAppointments()
useAppointment()
useCreateAppointment()
useAuth()
useSignalR()
```

Hook phải có tên bắt đầu bằng:

```text
use
```

---

# 25. STATE MANAGEMENT

Phân biệt:

## Global client state

Redux Toolkit:

```text
auth
user
permissions
notification UI state
```

## Server state

Ưu tiên React Query / TanStack Query:

```text
appointments
doctors
patients
medicines
invoices
medical records
```

Không lưu toàn bộ API response vào Redux nếu không cần.

---

# 26. FORM RULES

Form lớn sử dụng:

```text
React Hook Form
+
Zod
```

Validation phải được xử lý:

```text
Frontend
+
Backend
```

Frontend validation dùng để UX.

Backend validation dùng để đảm bảo system security/integrity.

Không tin dữ liệu từ frontend.

---

# 27. ERROR HANDLING FRONTEND

Tất cả API errors phải được xử lý thống nhất.

Ví dụ:

```text
utils/
└── errorHandler.js
```

Các trường hợp:

```text
400 → Validation error
401 → Unauthorized
403 → Forbidden
404 → Not found
409 → Business conflict
500 → Server error
```

Không mỗi component tự xử lý error theo format khác nhau.

---

# 28. LOADING / EMPTY / ERROR STATE

Mỗi màn hình gọi API phải xử lý ít nhất:

```text
Loading
Success
Empty
Error
```

Không để màn hình trắng khi API chưa trả dữ liệu.

Ví dụ:

```text
Loading
   ↓
Success
   ├── Data
   └── Empty
```

---

# 29. ROUTING RULES

Routes phải phân nhóm:

```text
/
/login
/register

/internal/...
```

Patient Portal:

```text
/
 /doctors
 /departments
 /booking
 /my-appointments
 /medical-records
 /invoices
```

Internal Portal:

```text
/internal/dashboard
/internal/appointments
/internal/patients
/internal/doctors
/internal/inventory
/internal/invoices
/internal/reports
```

Route protection phải dùng:

```text
ProtectedRoute
RoleRoute
```

Không chỉ ẩn menu để bảo mật.

Backend vẫn phải kiểm tra `[Authorize]`.

---

# 30. UI RULES

Màu chủ đạo:

```text
Blue
```

UI framework:

```text
Material UI
```

Component style phải thống nhất:

- Button
- Table
- Dialog
- Form
- Card
- Badge
- Pagination
- Toast

Không tự tạo 5 kiểu button cho 5 module.

---

# 31. FILE SIZE RULE

Không đặt giới hạn cứng tuyệt đối, nhưng:

- Component quá lớn → xem xét tách.
- Service quá lớn → tách business logic.
- Repository quá lớn → tách query theo domain.
- Controller quá lớn → chắc chắn đang chứa quá nhiều logic.

Một file chỉ nên có một responsibility chính.

---

# 32. COMMENTS

Không viết comment cho code hiển nhiên.

Không nên:

```csharp
// Get appointment by id
var appointment = await ...
```

Nên comment khi giải thích:

- Business rule
- Race condition
- Workaround
- Security reason
- Performance consideration

Ví dụ:

```csharp
// Re-check availability before saving to prevent
// appointment conflicts caused by concurrent requests.
```

---

# 33. LOGGING

Log các action quan trọng:

```text
Login
Create appointment
Cancel appointment
Check-in
Create prescription
Update inventory
Create invoice
Payment
```

Không log:

```text
Password
JWT token
Sensitive personal information
```

---

# 34. SECURITY

Không commit:

```text
Password
JWT secret
API key
Connection string chứa credential thật
Refresh token
Private certificate / private key
```

Không hard-code secret thật trong:

```text
appsettings.json
docker-compose.yml
frontend source code
```

Local backend secrets ưu tiên dùng:

```text
.NET User Secrets
Environment Variables
```

Ví dụ:

```text
ConnectionStrings:DefaultConnection
Jwt:Key
```

Docker credential local có thể lấy từ `.env`; file `.env` phải nằm trong `.gitignore`.

Các file template không chứa secret thật như `.env.example` được phép commit để team biết các biến cần cấu hình.

Frontend không được chứa secret thực sự. Biến `VITE_*` được bundle xuống browser nên chỉ dùng cho public configuration như API base URL.

Nếu secret đã từng được commit lên Git, chỉ thêm vào `.gitignore` là chưa đủ; phải rotate secret và xử lý lịch sử Git khi cần.

---

# 35. DATABASE MIGRATION

Migrations phải được commit vào Git:

```text
Data/Migrations/
```

Không xóa migration cũ chỉ vì code đã thay đổi.

Khi database schema thay đổi:

```text
Entity change
→ Migration
→ Database update
```

Team phải thống nhất migration trước khi merge nếu nhiều người cùng sửa schema.

---

# 36. GIT RULES

Không code trực tiếp trên:

```text
main
```

Feature mới:

```text
feature/appointment-booking
feature/jwt-authentication
feature/prescription
feature/inventory
```

Bug:

```text
fix/appointment-conflict
fix/login-validation
```

Refactor:

```text
refactor/appointment-service
```

---

# 37. COMMIT MESSAGE

Format:

```text
type: description
```

Types:

```text
feat
fix
refactor
docs
test
chore
style
```

Examples:

```text
feat: add appointment booking API
feat: add patient booking page
fix: prevent duplicate appointment
refactor: simplify invoice service
test: add appointment service tests
docs: update API documentation
chore: update frontend dependencies
```

Không dùng:

```text
update code
fix
abc
done
test
```

---

# 38. PULL REQUEST RULES

Một PR nên tập trung vào một feature/fix.

Không gom:

```text
Appointment
+
Payment
+
UI redesign
+
Database refactor
```

vào một PR duy nhất nếu không cần.

PR phải:

- Build được.
- Không có lỗi compile.
- Không có debug code.
- Có commit message rõ ràng.
- Không phá API hiện tại nếu chưa thông báo team.
- Không tự ý đổi database schema nếu chưa thống nhất.

---

# 39. BEFORE COMMIT

Backend:

```text
dotnet build
```

Frontend:

```text
npm run build
```

Nếu có test:

```text
dotnet test
```

Frontend test:

```text
npm test
```

Không commit code khi build đang fail.

---

# 40. TEAM RULES

Mọi member phải:

1. Pull code mới nhất trước khi bắt đầu task.
2. Tạo branch riêng.
3. Không sửa code của người khác nếu không cần.
4. Không đổi naming convention tùy ý.
5. Không tự ý đổi API response format.
6. Không tự ý đổi database schema.
7. Không commit secret.
8. Không commit generated files.
9. Không merge code chưa build.
10. Khi thay đổi contract giữa FE và BE phải thông báo team.

---

# 41. API CONTRACT RULE

Khi Backend thay đổi:

```text
Request DTO
Response DTO
Endpoint
HTTP method
Status code
```

phải cập nhật:

```text
Swagger
Frontend API module
Related JS data models / JSDoc types
```

Không thay đổi API âm thầm.

Ví dụ nếu BE đổi:

```text
GET /api/appointments
```

response:

```json
{
  "items": []
}
```

sang:

```json
{
  "data": []
}
```

phải update FE tương ứng.

---

# 42. BUSINESS FLOW RULE

Các nghiệp vụ chính phải giữ đúng flow:

```text
Appointment
    ↓
Check-in
    ↓
Medical Record
    ↓
Prescription / Lab Test
    ↓
Invoice
    ↓
Payment
    ↓
Review
```

Không cho phép gọi API phá vỡ business state.

Ví dụ:

- Không tạo Medical Record nếu appointment chưa ở trạng thái phù hợp.
- Không thanh toán invoice đã hủy.
- Không review khi appointment chưa hoàn thành.
- Không kê prescription nếu chưa có medical record.
- Không xuất thuốc vượt quá tồn kho.

---

# 43. APPOINTMENT STATUS

Chỉ sử dụng các trạng thái đã thống nhất:

```text
Pending
Confirmed
InProgress
Completed
Cancelled
```

Không tự tạo:

```text
Waiting
Done
Finish
Canceled
```

trừ khi team cập nhật rule chính thức.

---

# 44. INVOICE STATUS

```text
Unpaid
Paid
```

---

# 45. LAB TEST STATUS

```text
Pending
Completed
```

---

# 46. GENERAL PRINCIPLE

Khi không chắc nên đặt code ở đâu, hãy hỏi:

> "Đây là HTTP logic, Business logic, Data access hay UI logic?"

Nếu là:

```text
HTTP
→ Controller

Business
→ Service

Database
→ Repository

Database configuration
→ Data

Input validation
→ Validator

Data shape API
→ DTO

Entity mapping
→ Mapping

Realtime
→ Hub / SignalR service

UI
→ React Page / Component

API communication
→ api/

Reusable UI logic
→ hooks/
```

---

# 47. FINAL RULE

Code phải ưu tiên:

```text
Readable
Maintainable
Consistent
Testable
Secure
```

trước:

```text
Short
Clever
Complex
Over-engineered
```

Mục tiêu của project không chỉ là "chạy được".

Mục tiêu là:

> **Mọi thành viên trong team có thể mở bất kỳ module nào và hiểu được code đang được tổ chức như thế nào.**