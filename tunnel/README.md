# Cloudflare Tunnel — ให้ลูกค้าดูเว็บจากเครื่องคุณ (localhost)

ใช้เมื่อยังไม่ได้เช่าโฮสต์ แต่ต้องการส่งลิงก์ให้ลูกค้า/ทีมเปิดดูเว็บ + หลังบ้าน CMS บน XAMPP

**URL ในเครื่องคุณ:** `http://localhost/wealthlifeinsure.com`  
**หลังบ้าน:** `http://localhost/wealthlifeinsure.com/admin/v2/`

---

## ก่อนเริ่ม

1. เปิด **XAMPP** → Start **Apache** และ **MySQL**
2. ทดสอบเปิด `http://localhost/wealthlifeinsure.com` ในเบราว์เซอร์ให้ได้ก่อน
3. ติดตั้ง `cloudflared` (ครั้งแรกเท่านั้น)

---

## ขั้นที่ 1 — ติดตั้ง cloudflared

ดับเบิลคลิก `install-cloudflared.bat`  
หรือใน PowerShell:

```powershell
winget install --id Cloudflare.cloudflared -e
```

ปิดแล้วเปิดเทอร์มินัลใหม่ แล้วทดสอบ:

```powershell
cloudflared --version
```

---

## ขั้นที่ 2 — โหมดด่วน (แนะนำเริ่มต้น)

ไม่ต้องมีโดเมน Cloudflare — ได้ลิงก์ `*.trycloudflare.com` ชั่วคราว

ดับเบิลคลิก **`quick-tunnel.bat`**

- จะขึ้น URL แบบ `https://xxxx-xx-xx.trycloudflare.com`
- ส่งลิงก์นี้ให้ลูกค้า (ลิงก์เปลี่ยนทุกครั้งที่รันใหม่)
- หลังบ้าน: เติม `/admin/v2/` ต่อท้าย URL นั้น

**หมายเหตุ:** ต้องเปิดหน้าต่าง batch ทิ้งไว้ — ปิด = tunnel หยุด

---

## ขั้นที่ 3 — โหมดถาวร (มีบัญชี Cloudflare + โดเมน)

เหมาะเมื่อต้องการ URL คงที่ เช่น `preview.wealthlifeinsure.com`

### 3.1 เข้าสู่ระบบ Cloudflare

```powershell
cd C:\xampp\htdocs\wealthlifeinsure.com\tunnel
cloudflared tunnel login
```

เลือกโดเมนที่จัดการใน Cloudflare

### 3.2 สร้าง tunnel

```powershell
cloudflared tunnel create wealthlife-preview
```

จะได้ไฟล์ credentials ใน `%USERPROFILE%\.cloudflared\`

คัดลอก **Tunnel ID** (UUID) ไว้

### 3.3 ตั้งค่า config

```powershell
copy config.example.yml config.yml
```

แก้ `config.yml`:

- `tunnel:` → UUID จากขั้น 3.2
- `credentials-file:` → path ไปยังไฟล์ `.json` ที่ cloudflared สร้างให้
- `hostname:` → subdomain ที่ต้องการ (ต้องอยู่ในโดเมนที่ผูก Cloudflare)

### 3.4 ผูก DNS

```powershell
cloudflared tunnel route dns wealthlife-preview preview.wealthlifeinsure.com
```

(เปลี่ยนชื่อ tunnel และ hostname ตามที่ตั้ง)

### 3.5 รัน tunnel

ดับเบิลคลิก **`run-named-tunnel.bat`**

หรือ:

```powershell
cloudflared tunnel --config config.yml run
```

---

## ลิงก์ที่ส่งให้ลูกค้า

| ส่วน | Path |
|------|------|
| หน้าเว็บ | `/` (หรือทั้ง URL จาก quick tunnel) |
| CMS | `/admin/v2/` |

ตัวอย่าง quick tunnel:

- เว็บ: `https://abc-123.trycloudflare.com/`
- หลังบ้าน: `https://abc-123.trycloudflare.com/admin/v2/`

---

## ข้อควรรู้

- **ความปลอดภัย:** quick tunnel เป็น public — อย่าใช้รหัสผ่าน admin ง่าย ๆ ในโหมด demo
- **ปิด tunnel** เมื่อไม่ใช้งาน
- ถ้ารูปหรือลิงก์เพี้ยน อาจต้องแก้ `site_url` ใน `cms/config.php` เป็น URL ของ tunnel ชั่วคราว (เฉพาะตอน demo)
- tunnel **ไม่แทน** การอัปโหลดขึ้นโฮสต์จริง — ใช้แค่ preview ก่อน deploy

---

## แก้ปัญหาเบื้องต้น

| อาการ | แก้ |
|--------|-----|
| `cloudflared` ไม่รู้จัก | รัน `install-cloudflared.bat` แล้วเปิด CMD ใหม่ |
| 502 / ไม่ขึ้นเว็บ | ตรวจ Apache ใน XAMPP ว่า Start แล้ว |
| หน้าเว็บขาว / 404 | ตรวจว่า path คือ `/wealthlifeinsure.com` ใน XAMPP |
| หลังบ้อง login ไม่ได้ | ใช้ HTTPS จาก tunnel ได้เลย; ล้าง cookie แล้วลองใหม่ |
