# ngrok — ส่งลิงก์ให้ลูกค้าดูเว็บ / หลังบ้านชั่วคราว

เหมาะกับเคส: **ยังไม่ขึ้นโฮสต์** แต่อยากให้ลูกค้าเปิดดูจากอินเทอร์เน็ตได้ (ไม่ต้องใช้ IP เครื่องคุณ)

**ในเครื่องคุณ (XAMPP):**
- เว็บ: `http://127.0.0.1/wealthlifeinsure.com/`
- หลังบ้าน: `http://127.0.0.1/wealthlifeinsure.com/admin/v2/`

---

## ครั้งแรก (ทำครั้งเดียว)

### 1) ติดตั้ง ngrok

ดับเบิลคลิก `install-ngrok.bat`  
หรือ: `winget install Ngrok.Ngrok`

### 2) สมัคร + ใส่ token

1. สมัครฟรีที่ [https://dashboard.ngrok.com/signup](https://dashboard.ngrok.com/signup)
2. คัดลอก **Authtoken** จาก Dashboard
3. รัน `setup-token.bat` แล้ววาง token  
   หรือใน CMD:

```text
ngrok config add-authtoken YOUR_TOKEN_HERE
```

---

## เปิดให้ลูกค้าดู (ทุกครั้ง)

1. เปิด **XAMPP** → Start **Apache** + **MySQL**
2. ทดสอบ `http://127.0.0.1/wealthlifeinsure.com/` ว่าเปิดได้
3. ดับเบิลคลิก **`start-preview.bat`**
4. คัดลอก URL ที่ขึ้น (เช่น `https://abc123.ngrok-free.app`)
5. ส่งให้ลูกค้า:

| ดูอะไร | URL |
|--------|-----|
| หน้าเว็บ | `https://xxxx.ngrok-free.app/wealthlifeinsure.com/` |
| หลังบ้าน CMS | `https://xxxx.ngrok-free.app/wealthlifeinsure.com/admin/v2/` |

ปิดหน้าต่าง batch = ลิงก์ใช้ไม่ได้

---

## ความปลอดภัย (สำคัญ)

- ลิงก์ ngrok เป็น **สาธารณะ** — ใครมีลิงก์เปิดได้
- ใช้รหัส admin **ที่ไม่ใช่รหัส production**
- ปิด tunnel เมื่อ demo เสร็จ
- อย่าแชร์ลิงก์ในกลุ่มใหญ่ / โซเชียล

---

## แก้ปัญหา

| อาการ | แก้ |
|--------|-----|
| `ngrok` ไม่รู้จัก | รัน `install-ngrok.bat` แล้วเปิด CMD ใหม่ |
| ต้องการ authtoken | ทำขั้น "ครั้งแรก" ข้อ 2 |
| หน้า XAMPP แทนเว็บ | ใส่ path `/wealthlifeinsure.com/` ต่อท้าย URL ngrok |
| หลังบ้าน login ไม่ได้ | ล้าง cookie แล้วลองใหม่ / ใช้ Incognito |

---

## เปรียบเทียบกับ Cloudflare Tunnel

โฟลเดอร์ `tunnel/` ยังมีไว้ถ้าอยากใช้ Cloudflare ภายหลัง  
สำหรับส่งลิงก์ชั่วคราวแบบง่าย → **ใช้ ngrok โฟลเดอร์นี้พอ**
