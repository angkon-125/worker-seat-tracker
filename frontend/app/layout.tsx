import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export const metadata = {
  title: "VisionTrack | Worker Seat Tracker",
  description: "Next-gen monitoring dashboard for workplace efficiency.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable}`}>
      <body className="font-sans antialiased text-white bg-[#09090b]">
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            <Navbar />
            
            <main className="flex-1 overflow-y-auto relative custom-scrollbar">
              {/* Global Ambient Background Effects */}
              <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
                <div className="absolute top-0 right-[10%] w-[600px] h-[600px] bg-blue-600/5 blur-[120px] rounded-full" />
                <div className="absolute bottom-0 left-[-5%] w-[500px] h-[500px] bg-indigo-600/5 blur-[100px] rounded-full" />
                <div className="absolute top-[30%] left-[20%] w-[400px] h-[400px] bg-emerald-500/5 blur-[100px] rounded-full" />
              </div>

              <div className="p-8">
                {children}
              </div>
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
