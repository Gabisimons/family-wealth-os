import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client, Client
from pydantic import BaseModel
from typing import List
from dotenv import load_dotenv

# 1. טעינת משתני הסביבה (מהקובץ .env שיצרת קודם)
load_dotenv()

# 2. אתחול ה-Client של Supabase
# הקוד הזה רץ פעם אחת כשהשרת עולה
url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")

if not url or not key:
    raise ValueError("Missing SUPABASE_URL or SUPABASE_KEY in .env file")

supabase: Client = create_client(url, key)

# 3. הגדרת האפליקציה (FastAPI)
app = FastAPI(title="Family Wealth OS", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], # המיקום שבו ירוץ האתר שלנו
    allow_credentials=True,
    allow_methods=["*"], # מאפשרים הכל כרגע
    allow_headers=["*"],
)

# --- Models (Schemas) ---
# אלו המחלקות שמגדירות איך הדאטה נראה. זה עוזר ל-Frontend להבין מה הוא מקבל.

class CategoryBreakdown(BaseModel):
    name: str
    value: float
    color: str
    icon: str | None

class DashboardSummary(BaseModel):
    total_net_worth: float
    liquid_capital: float
    currency: str
    breakdown: List[CategoryBreakdown]

# --- Endpoints (Routes) ---

@app.get("/")
def read_root():
    return {"status": "System is online", "project": "Family Wealth OS"}

@app.get("/api/dashboard", response_model=DashboardSummary)
def get_dashboard_summary():
    """
    מושך את כל הנכסים, מסכם אותם ומחזיר תמונת מצב עדכנית
    """
    try:
        # שליפה מ-Supabase: טבלת assets + חיבור (join) לטבלת categories
        response = supabase.table('assets').select("current_value, is_liquid, categories(name, color_hex, icon)").execute()
        assets = response.data

        # לוגיקה עסקית (חישובים)
        total_value = sum(item['current_value'] for item in assets)
        liquid_value = sum(item['current_value'] for item in assets if item['is_liquid'])
        
        # הקבצה לפי קטגוריות
        category_map = {}
        for item in assets:
            cat_data = item['categories']
            # טיפול במקרה שנכס לא משויך לקטגוריה (Fail safe)
            if not cat_data:
                cat_name = "Uncategorized"
                cat_color = "#cccccc"
                cat_icon = "HelpCircle"
            else:
                cat_name = cat_data['name']
                cat_color = cat_data['color_hex']
                cat_icon = cat_data.get('icon')

            if cat_name not in category_map:
                category_map[cat_name] = {
                    "name": cat_name, 
                    "value": 0, 
                    "color": cat_color,
                    "icon": cat_icon
                }
            
            category_map[cat_name]["value"] += item['current_value']

        return {
            "total_net_worth": total_value,
            "liquid_capital": liquid_value,
            "currency": "ILS",
            "breakdown": list(category_map.values())
        }

    except Exception as e:
        # אם משהו נכשל, נחזיר שגיאה ברורה
        print(f"Error fetching dashboard data: {e}")
        raise HTTPException(status_code=500, detail=str(e))