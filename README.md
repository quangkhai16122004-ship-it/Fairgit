# Báo cáo tìm hiểu Git và quy trình làm việc với Git

## 1. Git là gì

**Git** là hệ thống quản lý phiên bản *(version control system: hệ thống giúp theo dõi lịch sử thay đổi của mã nguồn)*.  
Git giúp lưu lại các lần thay đổi, hỗ trợ làm việc nhóm, khôi phục phiên bản cũ và quản lý các nhánh phát triển khác nhau trong cùng một dự án.

## 2. Các khái niệm cơ bản trong Git

### 2.1 Repository

**Repository** *(kho lưu trữ mã nguồn)* là nơi chứa toàn bộ dự án, bao gồm mã nguồn, thư mục, file cấu hình và lịch sử commit.

### 2.2 Commit

**Commit** là một mốc ghi nhận thay đổi của dự án tại một thời điểm cụ thể.  
Mỗi commit cần có nội dung mô tả rõ ràng để người khác có thể hiểu thay đổi đã được thực hiện là gì.

### 2.3 Branch

**Branch** *(nhánh)* là một dòng phát triển riêng biệt trong cùng repository.  
Việc tạo branch giúp tách riêng từng tính năng hoặc sửa lỗi, tránh ảnh hưởng trực tiếp đến nhánh chính.

### 2.4 Merge

**Merge** *(gộp nhánh)* là thao tác đưa thay đổi từ một nhánh vào nhánh khác.  
Đây là cách phổ biến để hợp nhất phần việc sau khi hoàn thành.

### 2.5 Rebase

**Rebase** là thao tác đặt lại các commit của nhánh hiện tại lên trên một mốc mới.  
Rebase giúp lịch sử commit gọn hơn, nhưng cần sử dụng cẩn thận để tránh gây khó khăn khi làm việc nhóm.

### 2.6 Pull Request / Merge Request

**Pull Request** *(GitHub)* và **Merge Request** *(GitLab)* đều là yêu cầu gộp mã từ một nhánh vào nhánh khác.  
Đây là bước quan trọng để review code *(xem xét mã nguồn)* trước khi merge.

## 3. Các lệnh Git cơ bản

Một số lệnh Git cơ bản đã tìm hiểu:

- `git init`: khởi tạo repository
- `git status`: kiểm tra trạng thái thay đổi
- `git add`: thêm file vào vùng chuẩn bị commit
- `git commit`: tạo commit lưu thay đổi
- `git branch`: xem hoặc tạo branch
- `git checkout` / `git switch`: chuyển nhánh
- `git merge`: gộp nhánh
- `git rebase`: cập nhật lại vị trí commit
- `git push`: đẩy code lên remote repository *(repo từ xa)*
- `git pull`: lấy thay đổi mới từ remote repository

## 4. Commit message convention

Trong quá trình tìm hiểu, em nhận thấy việc viết commit message chưa có quy chuẩn rõ ràng.  
Đây là điểm cần cải thiện vì commit message ảnh hưởng trực tiếp đến khả năng theo dõi lịch sử thay đổi.

Một số nguyên tắc cần áp dụng:

- Nội dung commit ngắn gọn, rõ nghĩa
- Mỗi commit chỉ nên phản ánh một nhóm thay đổi chính
- Ưu tiên dùng cùng một quy ước xuyên suốt dự án

Ví dụ quy ước có thể áp dụng:

- `feat:` thêm tính năng mới
- `fix:` sửa lỗi
- `refactor:` chỉnh sửa lại code nhưng không đổi chức năng
- `docs:` cập nhật tài liệu
- `style:` chỉnh sửa định dạng, không ảnh hưởng logic
- `test:` bổ sung hoặc sửa test

Ví dụ:

- `feat: add logout page`
- `fix: correct cart total calculation`
- `docs: update git workflow report`

## 5. GitHub và GitLab

**GitHub** và **GitLab** là các nền tảng hỗ trợ làm việc với Git.  
Hai nền tảng này cung cấp các chức năng như:

- lưu trữ repository từ xa
- quản lý branch
- tạo Pull Request / Merge Request
- review code
- hỗ trợ cộng tác trong nhóm

Như vậy, **Git** là công cụ cốt lõi, còn **GitHub/GitLab** là môi trường để áp dụng Git vào làm việc nhóm.

## 6. Workflow với Git

## 6.1 GitHub Flow

**GitHub Flow** là quy trình làm việc đơn giản, phù hợp với dự án nhỏ hoặc nhóm cần triển khai nhanh.

Quy trình cơ bản:

1. Tạo branch từ `main`
2. Thực hiện thay đổi trên branch riêng
3. Commit và push lên remote
4. Tạo Pull Request / Merge Request
5. Review và merge vào `main`

### Nhận xét

GitHub Flow có ưu điểm là đơn giản, dễ áp dụng và phù hợp khi mỗi tính năng được phát triển độc lập.  
Tuy nhiên, workflow này ít phân tách giai đoạn phát triển và phát hành hơn so với Git Flow.

## 6.2 Git Flow

**Git Flow** là workflow có cấu trúc chặt chẽ hơn, phù hợp với dự án có quy trình phát triển và release *(phát hành phiên bản)* rõ ràng.

Các nhánh chính trong Git Flow:

- `main`: chứa phiên bản ổn định
- `develop`: chứa mã nguồn đang phát triển
- `feature/*`: phát triển từng tính năng
- `release/*`: chuẩn bị phát hành
- `hotfix/*`: sửa lỗi khẩn cấp trên bản phát hành

### Nhận xét

Git Flow giúp tổ chức công việc rõ ràng hơn, đặc biệt khi dự án có nhiều giai đoạn như phát triển, kiểm thử và phát hành.  
Tuy nhiên, Git Flow phức tạp hơn GitHub Flow và cần quản lý nhánh cẩn thận hơn.

## 6.3 So sánh GitHub Flow và Git Flow

| Tiêu chí | GitHub Flow | Git Flow |
|---|---|---|
| Mức độ phức tạp | Đơn giản | Phức tạp hơn |
| Nhánh chính | Chủ yếu dùng `main` | Dùng `main` và `develop` |
| Phù hợp với | Dự án nhỏ, triển khai nhanh | Dự án có release rõ ràng |
| Quản lý phát hành | Đơn giản | Chặt chẽ hơn |
| Số lượng nhánh | Ít | Nhiều |

## 7. Kết luận

Qua quá trình tìm hiểu, em rút ra một số điểm chính:

- Git là nền tảng quan trọng để quản lý lịch sử thay đổi mã nguồn
- Cần nắm chắc các khái niệm cơ bản như repository, commit, branch, merge và rebase trước khi học workflow
- GitHub Flow và Git Flow là hai quy trình khác nhau, cần phân biệt rõ mục đích sử dụng
- Việc viết commit message theo quy chuẩn là cần thiết để báo cáo thay đổi rõ ràng và chuyên nghiệp hơn
- Khi làm báo cáo kỹ thuật, nên ưu tiên trình bày theo hướng khái niệm, nguyên lý và kết luận thay vì liệt kê quá chi tiết các thao tác nhỏ