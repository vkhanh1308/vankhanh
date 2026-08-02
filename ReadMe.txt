--Terminal 1:

cd C:\Users\PC\Downloads\dms-dhthang
python reset_db.py
python seed_admin.py
python seed_data.py

--Terminal 2:

cd C:\Users\PC\Downloads\dms-dhthang
python -m uvicorn main:app --reload

--Terminal 3:

cd C:\Users\PC\Downloads\dms-dhthang\frontend
npm run dev