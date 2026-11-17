# Sổ Tay QA/QC Hiện Trường & Nghiệm Thu Cáp Quang 1FO (21297/QĐ-VTT)

> Hệ thống sổ tay điện tử và báo cáo nghiệm thu cáp quang 1FO bọc chặt (G657A1) hoạt động đa nền tảng, đồng bộ thời gian thực qua Cloudflare Pages & cơ sở dữ liệu Cloudflare D1 (SQLite Edge).

---

## 🚀 Tính Năng Chính

1. **Đồng Bộ Đa Thiết Bị (Multi-Device Sync qua Cloudflare D1):**
   - Tự động lưu và đồng bộ tức thì giữa máy tính văn phòng, laptop xuống xưởng, máy tính bảng và điện thoại di động.
   - Hỗ trợ chế độ **Offline Fallback** (lưu an toàn trên máy khi mất mạng xưởng và tự đẩy lên cloud khi có mạng lại).
2. **Quản Lý Nhiều Đợt Nghiệm Thu / Cuộn Cáp (Sessions):**
   - Tạo mới, đổi tên, ghi mã cuộn/lô, tên cán bộ giám định, tên xưởng sản xuất và kết luận tổng quan.
   - Nút **Copy Link Máy Khác** giúp sao chép URL trực tiếp kèm mã phiên (`?session=...`), mở lập tức trên điện thoại hoặc chia sẻ đồng nghiệp qua Zalo/Email.
3. **Checklist Toàn Diện & Chuyên Sâu:**
   - **0. Chuẩn bị trước khi đi:** 16 hạng mục trang thiết bị, 5 bộ hồ sơ gửi scan trước, 4 quy tắc hiện trường kèm nút copy nhanh tin nhắn gửi nhà máy.
   - **1. Cấu trúc cáp & 7 thành phần:** Mặt cắt hình số 8 SVG, phân tích rủi ro, mẹo tự soi và yêu cầu nhà máy xuất trình.
   - **2. Bảng 38 chỉ tiêu kỹ thuật & bài đo:** Nút Đạt / Trượt, tiến độ đo kiểm trực quan, kèm **ô ghi số đo thực tế / ghi chú** cho từng bài đo.
   - **3. Test nhanh tại xưởng:** 6 bài kiểm tra DIY thực chiến.
   - **4. Chiêu trò gian lận:** 8 thủ thuật xưởng thường dùng và đối sách bắt tại trận.
   - **5. Hồ sơ & chứng từ:** Bảng đối chiếu 7 loại hồ sơ, rủi ro làm giả CO/CQ/Test report.
   - **6. Câu hỏi chất vấn:** 6 câu hỏi bẫy kỹ thuật viên nhà máy.
   - **7. Kịch bản What-If:** 7 tình huống quyết định (Từ chối, Đo lại, Báo cáo chủ đầu tư).
   - **11 Điểm cảnh báo mập mờ:** Phân tích kẽ hở trong quy chuẩn 21297/QĐ-VTT.
4. **In Ấn & Xuất Báo Cáo:**
   - Xuất bản in / PDF chuẩn chỉnh, tự động tối ưu giao diện in, ẩn các nút bấm thừa.

---

## 🛠️ Công Nghệ & Kiến Trúc Backend

- **Frontend:** HTML5, Modern CSS, Tailwind CSS v3, Vanilla ES6+ Javascript.
- **Hosting & CDN:** Cloudflare Pages (Global Edge Network).
- **Backend API:** Cloudflare Pages Functions (`/api/sessions`, `/api/sessions/:id`).
- **Cơ Sở Dữ Liệu:** Cloudflare D1 Database (`qa-qc-1fo-db` - Serverless SQLite tại APAC).
