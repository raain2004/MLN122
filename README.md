# Game: Đế Chế Độc Quyền (Monopoly Empire Simulation)

Một ứng dụng web mô phỏng quá trình tích tụ, tập trung tư bản và hình thành 4 hình thức tổ chức độc quyền: **Cartel**, **Syndicate**, **Trust**, **Consortium**.

## 🎯 Mục tiêu học tập (Learning Objectives)

Trò chơi được thiết kế nhằm giúp người chơi (sinh viên học phần Kinh tế chính trị Mác - Lênin) tự giải thích được:
1. Nguyên nhân hình thành tổ chức độc quyền từ cạnh tranh tự do khốc liệt.
2. Phân biệt bản chất 4 hình thức tổ chức độc quyền từ thấp đến cao (Cartel, Syndicate, Trust, Consortium).
3. Sự phát triển liên kết từ liên kết ngang (cùng ngành) sang liên kết dọc (đa ngành).
4. Nhận diện dấu hiệu của một liên minh độc quyền dễ tan vỡ so với liên minh bền vững phụ thuộc tài chính.

---

## 🛠️ Công nghệ sử dụng
- **HTML5**: Cấu trúc ứng dụng dạng Đơn trang (SPA).
- **CSS3**: Thiết kế giao diện cao cấp (Glassmorphism, Dark Navy & Accent Gold), hiệu ứng chuyển bậc (Transitions), và hỗ trợ hoàn hảo cho Mobile-first.
- **JavaScript (Vanilla)**: Logic game, quản lý trạng thái (State Machine), kiểm tra Stage Gate và vẽ cây quyết định SVG tương tác.

---

## 🚀 Hướng dẫn Triển khai lên GitHub Pages (Deployment)

Để đưa trò chơi này lên mạng cho sinh viên/người chơi khác trải nghiệm trực tuyến thông qua GitHub Pages, vui lòng làm theo các bước sau:

### Bước 1: Tạo Repository mới trên GitHub
1. Truy cập [github.com](https://github.com/) và đăng nhập vào tài khoản của bạn.
2. Nhấn nút **New** (hoặc truy cập `github.com/new`) để tạo một repository mới.
3. Đặt tên repository (ví dụ: `de-che-doc-quyen`).
4. Để chế độ **Public** (bắt buộc đối với tài khoản miễn phí để dùng GitHub Pages).
5. Không tích chọn thêm README, .gitignore hay license (để trống hoàn toàn).
6. Nhấn **Create repository**.

### Bước 2: Liên kết và Push mã nguồn từ máy lên GitHub
Mở Git Bash hoặc PowerShell tại thư mục chứa mã nguồn này (`c:\Users\vugam\Downloads\mln122`) và chạy các lệnh sau:

```bash
# Khởi tạo git
git init

# Thêm tất cả các tệp tin vào git staging area
git add .

# Ghi nhận phiên bản ban đầu (Commit)
git commit -m "Initial commit: Complete Monopoly Empire Simulation Game"

# Tạo nhánh chính (main)
git branch -M main

# Liên kết với repository vừa tạo trên GitHub (Thay URL bằng link repository của bạn)
git remote add origin https://github.com/username/de-che-doc-quyen.git

# Đẩy mã nguồn lên GitHub
git push -u origin main
```
*(Thay thế `username` bằng tên tài khoản GitHub của bạn và `de-che-doc-quyen` bằng tên kho lưu trữ của bạn).*

### Bước 3: Kích hoạt tính năng GitHub Pages
1. Vào trang Repository của bạn trên GitHub.
2. Chọn mục **Settings** (Cài đặt) ở thanh menu phía trên.
3. Tại menu bên trái, tìm mục **Pages** (dưới phần *Code and automation*).
4. Ở phần **Build and deployment** -> **Source**, chọn **Deploy from a branch**.
5. Ở phần **Branch**, chọn nhánh **main** (hoặc `master`) và thư mục là `/ (root)`.
6. Nhấn nút **Save**.
7. Chờ từ 1-2 phút, GitHub sẽ cấp cho bạn một đường liên kết dạng: `https://username.github.io/de-che-doc-quyen/`.

Bây giờ bất kỳ ai cũng có thể truy cập đường link đó để chơi game trực tiếp trên điện thoại hoặc máy tính!
