import { Outlet, NavLink, Link, useNavigate } from "react-router-dom";
import { Newspaper, Tv, BookOpen, Calendar as CalendarIcon, User, Search as SearchIcon, Menu, LogIn, Moon, Sun } from "lucide-react";
import React, { useState, useEffect } from "react";

export function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const [isDarkMode, setIsDarkMode] = useState(
    document.documentElement.classList.contains("dark")
  );

  const toggleDarkMode = () => {
    const isDark = !isDarkMode;
    setIsDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
      setIsSidebarOpen(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white dark:bg-gray-800 shadow-sm px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 rounded-full active:bg-gray-100 dark:active:bg-gray-700 md:hidden">
            <Menu className="w-6 h-6" />
          </button>
          
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white overflow-hidden">
               <img src="/logo.png" alt="منصة تعز" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
            </div>
            <span className="font-bold text-lg text-blue-900 dark:text-blue-100 hidden md:block">منصة تعز</span>
          </Link>
        </div>
        
        <div className="flex-1 max-w-xl mx-4 hidden md:flex items-center">
            <form onSubmit={handleSearch} className="relative w-full">
               <input 
                 type="text" 
                 value={searchQuery}
                 onChange={e => setSearchQuery(e.target.value)}
                 placeholder="البحث في الأخبار والمحتوى..." 
                 className="w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-full pl-4 pr-10 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
               />
               <button type="submit" className="absolute right-3 top-2.5 text-gray-400 hover:text-blue-600">
                  <SearchIcon className="w-5 h-5" />
               </button>
            </form>
        </div>

        <div className="flex items-center gap-2">
           <button onClick={() => setIsSidebarOpen(true)} className="p-2 rounded-full md:hidden">
             <SearchIcon className="w-5 h-5" />
           </button>
           <button onClick={toggleDarkMode} className="p-2 rounded-full active:bg-gray-100 dark:active:bg-gray-700">
             {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
           </button>
           <Link to="/admin" className="p-2 rounded-full active:bg-gray-100 dark:active:bg-gray-700 text-blue-600">
             <LogIn className="w-5 h-5" />
           </Link>
        </div>
      </header>

      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 transition-opacity" onClick={() => setIsSidebarOpen(false)}>
           <div className="bg-white dark:bg-gray-800 w-72 h-full p-4 transform transition-transform overflow-y-auto" onClick={e => e.stopPropagation()}>
               <div className="flex items-center gap-3 border-b dark:border-gray-700 pb-4 mb-4">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white overflow-hidden">
                     <img src="/logo.png" alt="منصة تعز" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
                  </div>
                  <div>
                    <h2 className="font-bold text-lg">منصة تعز</h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400">منصة إخبارية ثقافية</p>
                  </div>
               </div>
               
               <form onSubmit={handleSearch} className="relative w-full mb-6 md:hidden">
                 <input 
                   type="text" 
                   value={searchQuery}
                   onChange={e => setSearchQuery(e.target.value)}
                   placeholder="البحث..." 
                   className="w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl pl-4 pr-10 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                 />
                 <button type="submit" className="absolute right-3 top-3.5 text-gray-400">
                    <SearchIcon className="w-5 h-5" />
                 </button>
               </form>

               <nav className="flex flex-col gap-2">
                 {[
                   { to: "/", icon: Newspaper, label: "الأخبار" },
                   { to: "/watch", icon: Tv, label: "شاهد" },
                   { to: "/leader", icon: User, label: "السيد القائد" },
                   { to: "/quran", icon: BookOpen, label: "من هدي القرآن" },
                   { to: "/events", icon: CalendarIcon, label: "المناسبات والفعاليات" }
                 ].map(item => (
                   <NavLink 
                     key={item.to} 
                     to={item.to} 
                     onClick={() => setIsSidebarOpen(false)}
                     className={({isActive}) => `flex items-center gap-3 p-3 rounded-lg transition-colors ${isActive ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold" : "hover:bg-gray-100 dark:hover:bg-gray-700"}`}
                   >
                     <item.icon className="w-5 h-5" />
                     {item.label}
                   </NavLink>
                 ))}
               </nav>
           </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
        <Outlet />
      </main>

      {/* Bottom Navigation for Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t dark:border-gray-700 px-2 flex justify-between items-center z-40 pb-safe shadow-[0_-4px_10px_rgba(0,0,0,0.05)] dark:shadow-[0_-4px_10px_rgba(0,0,0,0.2)]">
        {[
          { to: "/", icon: Newspaper, label: "الأخبار" },
          { to: "/watch", icon: Tv, label: "شاهد" },
          { to: "/leader", icon: User, label: "القائد" },
          { to: "/quran", icon: BookOpen, label: "القرآن" },
          { to: "/events", icon: CalendarIcon, label: "الفعاليات" }
        ].map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center p-2 pt-3 pb-3 min-w-[4rem] transition-colors relative ${
                isActive
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-blue-600 rounded-b-full"></div>}
                <item.icon className={`w-6 h-6 mb-1 ${isActive ? 'fill-blue-100 dark:fill-blue-900/30' : ''}`} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

