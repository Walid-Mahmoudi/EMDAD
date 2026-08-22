import "./globals.css";

export const metadata = {
  title: "إمداد | نظام إدارة العملاء",
  description: "نظام CRM الداخلي لشركة إمداد - وكيل LG لأنظمة التكييف المركزي",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <body className="bg-paper text-ink font-body antialiased">
        {children}
      </body>
    </html>
  );
}
