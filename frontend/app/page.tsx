"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Wallet, TrendingUp, Home, Shield, Banknote, HelpCircle, RefreshCw } from "lucide-react";

// הגדרת סוגי הנתונים
interface Category {
  name: string;
  value: number;
  color: string;
  icon: string | null;
}

interface DashboardData {
  total_net_worth: number;
  liquid_capital: number;
  currency: string;
  breakdown: Category[];
}

const formatMoney = (amount: number) => {
  return new Intl.NumberFormat("he-IL", {
    style: "currency",
    currency: "ILS",
    maximumFractionDigits: 0,
  }).format(amount);
};

const iconMap: any = {
  Rocket: TrendingUp,
  Home: Home,
  Shield: Shield,
  Banknote: Banknote,
};

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      // פנייה לשרת המקומי (Python)
      const response = await axios.get("http://127.0.0.1:8000/api/dashboard");
      setData(response.data);
    } catch (err) {
      console.error("Connection Error:", err);
      setError("לא הצלחתי להתחבר לשרת. האם ה-Python רץ בטרמינל השני?");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) return (
    <div className="flex h-screen w-full items-center justify-center bg-gray-50" dir="rtl">
      <div className="flex flex-col items-center gap-4">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
        <p className="text-gray-500 font-medium">טוען נתונים...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="flex h-screen w-full items-center justify-center bg-gray-50" dir="rtl">
      <div className="text-center space-y-4">
        <div className="text-red-500 text-5xl">⚠️</div>
        <h2 className="text-xl font-bold text-gray-800">שגיאת תקשורת</h2>
        <p className="text-gray-600">{error}</p>
        <button onClick={fetchData} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">נסה שוב</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans" dir="rtl">
      <div className="max-w-5xl mx-auto space-y-10">
        
        {/* כותרת */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-200">
              <Wallet className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-800">הון משפחתי</h1>
              <p className="text-slate-500 text-sm">תמונת מצב עדכנית</p>
            </div>
          </div>
          <button onClick={fetchData} className="p-2 hover:bg-slate-200 rounded-full transition">
            <RefreshCw className="w-5 h-5 text-slate-400" />
          </button>
        </header>

        {/* כרטיסים ראשיים */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-2 h-full bg-blue-600"></div>
            <h2 className="text-slate-500 font-medium mb-2 text-lg">סך הכל הון עצמי</h2>
            <div className="text-5xl font-extrabold text-slate-900 tracking-tight">
              {data && formatMoney(data.total_net_worth)}
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-2 h-full bg-emerald-500"></div>
            <h2 className="text-slate-500 font-medium mb-2 text-lg">כסף נזיל וזמין</h2>
            <div className="text-5xl font-extrabold text-emerald-600 tracking-tight">
              {data && formatMoney(data.liquid_capital)}
            </div>
          </div>
        </div>

        {/* פירוט קטגוריות */}
        <div>
          <h3 className="text-xl font-bold text-slate-800 mb-6">חלוקת התיק</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {data?.breakdown.map((category) => {
              const IconComponent = category.icon ? iconMap[category.icon] : HelpCircle;
              const percent = ((category.value / data.total_net_worth) * 100).toFixed(1);
              
              return (
                <div key={category.name} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 rounded-xl bg-opacity-10" style={{ backgroundColor: `${category.color}15` }}>
                      <IconComponent className="w-6 h-6" style={{ color: category.color }} />
                    </div>
                    <span className="text-xs font-bold px-2 py-1 rounded-full bg-slate-100 text-slate-600">
                      {percent}%
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-slate-800">{formatMoney(category.value)}</div>
                  <div className="text-sm text-slate-500 font-medium">{category.name}</div>
                  <div className="w-full bg-slate-100 h-2 rounded-full mt-4 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${percent}%`, backgroundColor: category.color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}